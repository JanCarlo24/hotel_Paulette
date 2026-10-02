import { initializeApp } from "https://www.gstatic.com/firebasejs/11.6.1/firebase-app.js";
        import { getAuth, GoogleAuthProvider, signInWithPopup, signInWithCustomToken, signInAnonymously } from "https://www.gstatic.com/firebasejs/11.6.1/firebase-auth.js";
        import {
            HOTEL_COUPONS as VALID_COUPONS,
            HOTEL_GALLERY as GALLERY,
            HOTEL_ROOMS as ROOMS,
            HOTEL_SERVICES as SERVICES,
            calculateBookingTotal,
            calculateNights,
            formatMoney,
            getStoredBookings,
            isRoomAvailable as checkRoomAvailability,
            saveStoredBookings
        } from '../../src/index.js';

        // Firebase Initialization
        let auth;
        try {
            const firebaseConfig = typeof __firebase_config !== 'undefined' ? JSON.parse(__firebase_config) : {};
            if (firebaseConfig && firebaseConfig.apiKey) {
                const app = initializeApp(firebaseConfig);
                auth = getAuth(app);
            }
        } catch (e) {
            console.error("Firebase config error:", e);
        }

        // Global State
        const state = {
            checkIn: '',
            checkOut: '',
            guests: 2,
            nights: 0,
            selectedRoom: null,
            selectedServices: [],
            discount: 0,
            user: null
        };

        const getBookings = () => getStoredBookings(localStorage);
        const saveBookings = (bookings) => saveStoredBookings(localStorage, bookings);
        const getTotal = () => state.selectedRoom
            ? calculateBookingTotal({
                room: state.selectedRoom,
                nights: state.nights,
                serviceIds: state.selectedServices,
                services: SERVICES,
                discount: state.discount
            })
            : 0;

        function ensureFirebaseReady() {
            const raw = typeof __firebase_config !== 'undefined' ? __firebase_config : '{}';
            try {
                const cfg = JSON.parse(raw);
                return cfg && cfg.apiKey ? cfg : null;
            } catch {
                return null;
            }
        }

        function setLoggedUser(user) {
            state.user = user;
            const label = document.getElementById('logged-user-label');
            if (label) label.textContent = user ? `Sesión iniciada como ${user.displayName || user.email || 'usuario'}` : 'Sesión iniciada correctamente.';
            const authSection = document.getElementById('auth-section');
            const loggedSection = document.getElementById('logged-in-section');
            if (authSection && loggedSection) {
                authSection.classList.toggle('hidden', !!user);
                loggedSection.classList.toggle('hidden', !user);
            }
        }

        function persistLocalUser(user) {
            localStorage.setItem('overlookUser', JSON.stringify(user));
            setLoggedUser(user);
        }

        function loadLocalUser() {
            try {
                const saved = localStorage.getItem('overlookUser');
                if (!saved) return;
                const parsed = JSON.parse(saved);
                if (parsed && parsed.email) setLoggedUser(parsed);
            } catch {
                // ignore invalid local storage
            }
        }

        function isRoomAvailable(roomId, checkIn, checkOut) {
            return checkRoomAvailability(roomId, checkIn, checkOut, getBookings());
        }

        function renderAvailabilityCalendar() {
            const calendar = document.getElementById('availability-calendar');
            if (!calendar || !state.selectedRoom) return;
            const start = state.checkIn ? new Date(state.checkIn) : new Date();
            const rows = [];
            let cursor = new Date(start);
            for (let i = 0; i < 7; i++) {
                const iso = cursor.toISOString().slice(0, 10);
                const available = isRoomAvailable(state.selectedRoom.id, iso, iso);
                rows.push(`<div class="rounded-xl p-2 ${available ? 'bg-green-100 text-green-800 border border-green-300' : 'bg-red-100 text-red-700 border border-red-300'}">${cursor.toLocaleDateString('es-MX', { day: 'numeric', month: 'short' })}</div>`);
                cursor.setDate(cursor.getDate() + 1);
            }
            calendar.innerHTML = rows.join('');
        }

        // Utility: Toast Notifications
        window.showToast = function(message, type = 'error') {
            const container = document.getElementById('toast-container');
            const toast = document.createElement('div');
            const bgColor = type === 'error' ? 'bg-red-500/90' : 'bg-blue-600/90';
            const icon = type === 'error' ? 'fa-circle-exclamation' : 'fa-circle-info';
            
            toast.className = `${bgColor} text-white px-6 py-4 rounded-xl shadow-xl backdrop-blur-md font-medium flex items-center gap-3 transform transition-all duration-300 translate-x-full border border-white/20`;
            toast.innerHTML = `<i class="fa-solid ${icon} text-xl"></i> <span>${message}</span>`;
            
            container.appendChild(toast);
            
            // Trigger animation
            setTimeout(() => { toast.classList.remove('translate-x-full'); }, 10);
            
            // Remove after 4s
            setTimeout(() => {
                toast.classList.add('opacity-0');
                setTimeout(() => toast.remove(), 300);
            }, 4000);
        }

        // Utility: Navigation
        window.navTo = function(viewId) {
            document.querySelectorAll('.view-section').forEach(el => el.classList.add('view-hidden'));
            const target = document.getElementById(viewId);
            if(!target) return;
            target.classList.remove('view-hidden');

            if (viewId === 'view-rooms') renderAllRooms();
            if (viewId === 'view-services') renderServices();
            if (viewId === 'view-bookings') renderBookings();
            if (viewId === 'view-gallery') renderGallery();
            
            // Scroll top
            target.parentElement.scrollTop = 0;
        }

        // Formatting currency
        function roomCard(room) {
            const nights = state.nights || 1;
            return `<div class="glass-card rounded-2xl overflow-hidden flex flex-col h-full">
                <div class="h-48 bg-cover bg-center" style="background-image: url('${room.img}')"></div>
                <div class="p-5 flex flex-col flex-grow"><h4 class="text-xl font-bold text-gray-900 mb-1">${room.name}</h4>
                <p class="text-sm text-gray-800 font-medium mb-3"><i class="fa-solid fa-user mr-1"></i> ${room.capacity}</p>
                <p class="text-lg font-bold text-blue-900 mb-4 mt-auto">${formatMoney(room.price)} <span class="text-sm font-normal text-gray-700">por noche</span></p>
                <div class="grid grid-cols-2 gap-3"><button onclick="viewDetails('${room.id}')" class="bg-white/50 hover:bg-white/80 border border-gray-400 text-gray-900 font-bold py-2 px-4 rounded-xl transition">VER DETALLES</button>
                <button onclick="selectRoom('${room.id}')" class="bg-gradient-to-r from-blue-600 to-indigo-700 text-white font-bold py-2 px-4 rounded-xl shadow-md transition">ELEGIR</button></div></div></div>`;
        }

        function renderAllRooms() {
            const maxPrice = Number(document.getElementById('room-price-filter')?.value || 5200);
            const minCapacity = Number(document.getElementById('room-capacity-filter')?.value || 1);
            const sort = document.getElementById('room-sort')?.value || 'price';
            const rooms = ROOMS.filter(room => room.price <= maxPrice && room.maxGuests >= minCapacity).sort((a, b) => sort === 'capacity' ? a.maxGuests - b.maxGuests : sort === 'name' ? a.name.localeCompare(b.name) : a.price - b.price);
            document.getElementById('all-rooms-container').innerHTML = rooms.length ? rooms.map(roomCard).join('') : '<p class="col-span-full glass-card rounded-2xl p-8 text-center font-bold">No hay habitaciones con esos filtros.</p>';
            const label = document.getElementById('room-price-label');
            if (label) label.textContent = formatMoney(maxPrice);
        }

        function renderServices() {
            document.getElementById('services-container').innerHTML = SERVICES.map(service => `<article class="glass-card rounded-2xl p-5 flex flex-col"><i class="fa-solid ${service.icon} text-3xl text-blue-800 mb-4"></i><h4 class="text-xl font-bold text-gray-900">${service.name}</h4><p class="text-gray-700 font-medium my-3 flex-grow">${service.description}</p><div class="flex items-center justify-between"><strong class="text-blue-900">${formatMoney(service.price)}</strong><button onclick="addService('${service.id}')" class="bg-blue-700 hover:bg-blue-800 text-white font-bold py-2 px-3 rounded-xl">AÑADIR</button></div></article>`).join('');
        }

        window.addService = function(serviceId) {
            if (!state.selectedServices.includes(serviceId)) state.selectedServices.push(serviceId);
            showToast('Servicio añadido a tu próxima reserva.', 'info');
            navTo('view-confirm');
            if (!state.selectedRoom) { showToast('Primero selecciona una habitación para añadir servicios.', 'error'); navTo('view-rooms'); return; }
            prepareConfirmScreen();
        };

        function renderGallery() {
            document.getElementById('gallery-container').innerHTML = GALLERY.map((image, index) => `<img src="${image}" alt="Instalación del resort ${index + 1}" class="w-full aspect-square object-cover rounded-2xl shadow-lg hover:scale-[1.02] transition">`).join('');
        }

        function renderBookings() {
            const bookings = getBookings();
            const container = document.getElementById('bookings-container');
            if (!bookings.length) { container.innerHTML = '<div class="glass-card rounded-2xl p-8 text-center"><i class="fa-solid fa-calendar-xmark text-4xl text-blue-800 mb-3"></i><p class="text-lg font-bold">Todavía no tienes reservaciones.</p><button onclick="navTo(\'view-home\')" class="mt-4 bg-blue-700 text-white font-bold py-2 px-4 rounded-xl">BUSCAR HABITACIÓN</button></div>'; return; }
            container.innerHTML = bookings.map(booking => `<article class="glass-card rounded-2xl p-5 mb-4"><div class="flex flex-col md:flex-row md:items-center md:justify-between gap-4"><div><p class="text-xs font-bold uppercase text-blue-900">Código ${booking.code}</p><h4 class="text-xl font-bold">${booking.room}</h4><p class="text-gray-700">${booking.checkIn} al ${booking.checkOut} · ${booking.guests} huésped(es)</p><p class="font-bold text-blue-900 mt-2">${formatMoney(booking.total)}</p></div><div class="flex gap-2"><button onclick="repeatBooking('${booking.id}')" class="bg-blue-700 text-white font-bold px-3 py-2 rounded-xl">RESERVAR DE NUEVO</button><button onclick="cancelBooking('${booking.id}')" class="bg-red-100 text-red-700 font-bold px-3 py-2 rounded-xl">CANCELAR</button></div></div></article>`).join('');
        }

        window.cancelBooking = function(id) { saveBookings(getBookings().filter(booking => booking.id !== id)); renderBookings(); showToast('La reservación fue cancelada.', 'info'); };
        window.repeatBooking = function(id) { const booking = getBookings().find(item => item.id === id); if (!booking) return; const room = ROOMS.find(item => item.name === booking.room); if (!room) return; state.selectedRoom = room; state.checkIn = booking.checkIn; state.checkOut = booking.checkOut; state.guests = booking.guests; state.nights = calculateNights(state.checkIn, state.checkOut); prepareConfirmScreen(); navTo('view-confirm'); };

        // 1. Handle Search Validation
        window.handleSearch = function() {
            const checkIn = document.getElementById('checkin').value;
            const checkOut = document.getElementById('checkout').value;
            const guests = parseInt(document.getElementById('guests').value);

            if (!checkIn || !checkOut) {
                showToast("Selecciona una fecha de llegada y una de salida para continuar.", 'error');
                return;
            }

            const inDate = new Date(checkIn);
            const outDate = new Date(checkOut);
            
            // Fix timezone offset issues for local dates comparison
            inDate.setMinutes(inDate.getMinutes() + inDate.getTimezoneOffset());
            outDate.setMinutes(outDate.getMinutes() + outDate.getTimezoneOffset());
            const today = new Date();
            today.setHours(0,0,0,0);

            if (inDate < today) {
                showToast("La fecha de llegada no puede ser en el pasado.", 'error');
                return;
            }

            if (outDate <= inDate) {
                showToast("La fecha de salida debe ser posterior a la fecha de llegada.", 'error');
                return;
            }

            // Save state
            state.checkIn = checkIn;
            state.checkOut = checkOut;
            state.guests = guests;
            state.nights = calculateNights(checkIn, checkOut);

            renderResults();
            navTo('view-results');
        }

        // 2. Render Results
        function renderResults() {
            const container = document.getElementById('rooms-container');
            container.innerHTML = '';
            
            let hasRooms = false;

            ROOMS.forEach(room => {
                const hasGuestCapacity = state.guests <= room.maxGuests;
                const isAvailable = state.checkIn && state.checkOut ? isRoomAvailable(room.id, state.checkIn, state.checkOut) : true;
                if (!hasGuestCapacity || !isAvailable) return;
                
                hasRooms = true;
                const card = document.createElement('div');
                card.className = 'glass-card rounded-2xl overflow-hidden flex flex-col h-full';
                
                card.innerHTML = `
                    <div class="h-48 bg-cover bg-center" style="background-image: url('${room.img}')"></div>
                    <div class="p-5 flex flex-col flex-grow">
                        <h4 class="text-xl font-bold text-gray-900 mb-1">${room.name}</h4>
                        <p class="text-sm text-gray-800 font-medium mb-3"><i class="fa-solid fa-user mr-1"></i> ${room.capacity}</p>
                        <p class="text-lg font-bold text-blue-900 mb-4 mt-auto">Desde ${formatMoney(room.price)} <span class="text-sm font-normal text-gray-700">por noche</span></p>
                        
                        <div class="grid grid-cols-2 gap-3">
                            <button onclick="viewDetails('${room.id}')" class="bg-white/50 hover:bg-white/80 border border-gray-400 text-gray-900 font-bold py-2 px-4 rounded-xl transition">
                                VER DETALLES
                            </button>
                            <button onclick="selectRoom('${room.id}')" class="bg-gradient-to-r from-blue-600 to-indigo-700 hover:from-blue-700 hover:to-indigo-800 text-white font-bold py-2 px-4 rounded-xl shadow-md transition">
                                ELEGIR
                            </button>
                        </div>
                    </div>
                `;
                container.appendChild(card);
            });

            if(!hasRooms){
                container.innerHTML = `
                <div class="col-span-full p-8 text-center bg-white/30 rounded-2xl border border-white/50">
                    <i class="fa-solid fa-face-frown text-4xl text-gray-600 mb-3"></i>
                    <p class="text-lg font-bold text-gray-800">No hay habitaciones disponibles para esas fechas o número de huéspedes.</p>
                    <p class="text-sm text-gray-700">Prueba otra fecha o reduce el número de huéspedes.</p>
                </div>`;
            }
        }

        // 3. View Room Details
        window.viewDetails = function(roomId) {
            const room = ROOMS.find(r => r.id === roomId);
            if(!room) return;

            state.selectedRoom = room;
            
            document.getElementById('detail-img').style.backgroundImage = `url('${room.img}')`;
            document.getElementById('detail-title').innerText = room.name;
            document.getElementById('detail-capacity').innerHTML = `<i class="fa-solid fa-users mr-2"></i> ${room.capacity}`;
            
            const amContainer = document.getElementById('detail-amenities');
            amContainer.innerHTML = room.amenities.map(a => `<li><i class="fa-solid fa-check text-blue-700 mr-1"></i> ${a}</li>`).join('');
            renderAvailabilityCalendar();
            
            const total = getTotal();
            document.getElementById('detail-total').innerText = formatMoney(total);

            navTo('view-details');
        }

        // Quick select from results
        window.selectRoom = function(roomId) {
            viewDetails(roomId); // Pre-fill details
            navTo('view-confirm'); // Jump to confirm
            prepareConfirmScreen();
        }

        // Hook confirm navigation to prepare data
        const originalNavTo = window.navTo;
        window.navTo = function(viewId) {
            if(viewId === 'view-confirm' && !state.selectedRoom) {
                showToast("Selecciona una habitación para continuar con tu reservación.");
                return;
            }
            if(viewId === 'view-confirm') {
                prepareConfirmScreen();
            }
            originalNavTo(viewId);
        }

        // 4. Prepare Confirmation Screen
        function prepareConfirmScreen() {
            if (!state.selectedRoom) return;
            document.getElementById('confirm-checkin').innerText = state.checkIn;
            document.getElementById('confirm-checkout').innerText = state.checkOut;
            document.getElementById('confirm-room').innerText = state.selectedRoom.name;
            document.getElementById('confirm-guests').innerText = `${state.guests} Persona(s)`;
            
            const serviceContainer = document.getElementById('confirm-services');
            serviceContainer.innerHTML = SERVICES.map(service => `<label class="flex items-center gap-2 bg-white/30 rounded-lg p-2 text-sm font-medium"><input type="checkbox" value="${service.id}" ${state.selectedServices.includes(service.id) ? 'checked' : ''} class="service-option accent-blue-700"> ${service.name} (+${formatMoney(service.price)})</label>`).join('');
            serviceContainer.querySelectorAll('.service-option').forEach(input => input.addEventListener('change', event => { if (event.target.checked) state.selectedServices.push(event.target.value); else state.selectedServices = state.selectedServices.filter(id => id !== event.target.value); document.getElementById('confirm-total').innerText = formatMoney(getTotal()); }));
            document.getElementById('confirm-total').innerText = formatMoney(getTotal());
        }

        // 5. Auth Flow real with Firebase or local fallback
        async function loginWithGoogle() {
            const btn = document.getElementById('btn-google-login');
            btn.innerHTML = `<i class="fa-solid fa-spinner fa-spin text-xl"></i> Conectando con Google...`;
            btn.disabled = true;

            try {
                const firebaseConfig = ensureFirebaseReady();
                if (firebaseConfig && auth) {
                    const provider = new GoogleAuthProvider();
                    const result = await signInWithPopup(auth, provider);
                    const user = result.user;
                    persistLocalUser({
                        email: user.email,
                        displayName: user.displayName || 'Usuario Google',
                        photoURL: user.photoURL || ''
                    });
                    showToast('Inicio de sesión con Google correcto.', 'info');
                    return;
                }

                const fallbackUser = {
                    email: 'guest@overlook.local',
                    displayName: 'Usuario de demostración'
                };
                persistLocalUser(fallbackUser);
                showToast('Sesión local activada. Conecta Firebase para Google real.', 'info');
            } catch (error) {
                console.error('Auth error:', error);
                showToast('Error al iniciar sesión. Intenta nuevamente.', 'error');
            } finally {
                btn.innerHTML = `<img src="https://www.svgrepo.com/show/475656/google-color.svg" class="w-6 h-6" alt="Google"> Iniciar con Google`;
                btn.disabled = false;
            }
        }

        document.getElementById('btn-google-login').addEventListener('click', loginWithGoogle);
        document.getElementById('btn-email-login').addEventListener('click', () => {
            const email = document.getElementById('login-email').value.trim();
            const password = document.getElementById('login-password').value.trim();
            if (!email || !password) {
                showToast('Completa correo y contraseña para iniciar sesión.', 'error');
                return;
            }
            persistLocalUser({ email, displayName: email.split('@')[0] });
            showToast('Sesión iniciada con email correctamente.', 'info');
        });

        // 6. Final Booking Validation & Submit
        const checkPolicy = document.getElementById('policy-checkbox');
        const btnConfirm = document.getElementById('btn-confirm-booking');

        checkPolicy.addEventListener('change', (e) => {
            btnConfirm.disabled = !e.target.checked;
        });

        btnConfirm.addEventListener('click', () => {
            if(!checkPolicy.checked) {
                showToast("Debes aceptar las políticas de reservación y cancelación para continuar.");
                return;
            }
            
            const booking = {
                id: `booking-${Date.now()}`,
                code: `OV-${Math.floor(100000 + Math.random() * 900000)}`,
                roomId: state.selectedRoom.id,
                room: state.selectedRoom.name,
                checkIn: state.checkIn,
                checkOut: state.checkOut,
                guests: state.guests,
                services: state.selectedServices,
                total: getTotal()
            };
            saveBookings([...getBookings(), booking]);
            document.getElementById('success-modal').classList.remove('hidden');
        });

        document.getElementById('apply-coupon').addEventListener('click', () => {
            const code = document.getElementById('coupon-code').value.trim().toUpperCase();
            const message = document.getElementById('coupon-message');
            const discount = VALID_COUPONS[code];
            if (discount) {
                state.discount = discount;
                message.textContent = `Cupón aplicado: ${discount * 100}% de descuento.`;
                message.className = 'text-sm font-bold text-green-700 mt-2';
            } else {
                state.discount = 0;
                message.textContent = 'Cupón no válido. Prueba OVERLOOK10.';
                message.className = 'text-sm font-bold text-red-700 mt-2';
            }
            document.getElementById('confirm-total').innerText = formatMoney(getTotal());
        });

        document.getElementById('mobile-menu-button').addEventListener('click', () => {
            const menu = document.getElementById('main-menu');
            const button = document.getElementById('mobile-menu-button');
            menu.classList.toggle('hidden');
            menu.classList.toggle('absolute');
            menu.classList.toggle('top-16');
            menu.classList.toggle('right-4');
            menu.classList.toggle('z-40');
            menu.classList.toggle('flex');
            menu.classList.toggle('flex-col');
            menu.classList.toggle('bg-white/90');
            menu.classList.toggle('p-4');
            button.setAttribute('aria-expanded', String(!menu.classList.contains('hidden')));
        });

        ['room-price-filter', 'room-capacity-filter', 'room-sort'].forEach(id => document.getElementById(id)?.addEventListener('input', renderAllRooms));
        document.getElementById('contact-form').addEventListener('submit', event => { event.preventDefault(); localStorage.setItem('overlookLastContact', JSON.stringify({ name: document.getElementById('contact-name').value, email: document.getElementById('contact-email').value, topic: document.getElementById('contact-topic').value, message: document.getElementById('contact-message').value })); event.target.reset(); showToast('Mensaje enviado. Te responderemos pronto.', 'info'); });

        const todayString = new Date().toISOString().split('T')[0];
        document.getElementById('checkin').min = todayString;
        document.getElementById('checkout').min = todayString;
        loadLocalUser();
        renderAllRooms();
        renderServices();
        renderGallery();
