const freezeRecords = (records) =>
    Object.freeze(records.map((record) => Object.freeze(record)));

export const HOTEL_ROOMS = freezeRecords([
    {
        id: 'room-1',
        name: 'De Luxe Sea View',
        capacity: '2 adultos y 1 niño',
        maxGuests: 3,
        price: 2450,
        img: 'https://images.unsplash.com/photo-1590490360182-c33d57733427?auto=format&fit=crop&w=800&q=80',
        amenities: ['Vista al mar', 'Cama King Size', 'Balcón privado', 'Room service 24/7', 'Wi-Fi alta velocidad', 'Tina de hidromasaje']
    },
    {
        id: 'room-2',
        name: 'Suite Presidencial',
        capacity: 'Hasta 4 adultos',
        maxGuests: 4,
        price: 5200,
        img: 'https://images.unsplash.com/photo-1582719478250-c89cae4dc85b?auto=format&fit=crop&w=800&q=80',
        amenities: ['Vista panorámica', 'Dos habitaciones', 'Sala de estar', 'Chef privado opcional', 'Acceso al Spa', 'Terraza privada']
    },
    {
        id: 'room-3',
        name: 'Standard Tropical',
        capacity: '2 adultos',
        maxGuests: 2,
        price: 1800,
        img: 'https://images.unsplash.com/photo-1598928506311-c55dd1b31bb1?auto=format&fit=crop&w=800&q=80',
        amenities: ['Vista al jardín', 'Cama Queen Size', 'Minibar', 'Smart TV', 'Aire acondicionado']
    }
]);

export const HOTEL_SERVICES = freezeRecords([
    { id: 'spa', name: 'Circuito de Spa', description: 'Relajación profunda con sauna, vapor y jacuzzi.', price: 850, icon: 'fa-spa' },
    { id: 'breakfast', name: 'Desayuno buffet', description: 'Sabores locales y opciones para toda la familia.', price: 320, icon: 'fa-mug-hot' },
    { id: 'transfer', name: 'Traslado aeropuerto', description: 'Viaje privado de llegada o salida sin complicaciones.', price: 1200, icon: 'fa-car' },
    { id: 'dinner', name: 'Cena romántica', description: 'Menú de cuatro tiempos en una terraza privada.', price: 1450, icon: 'fa-champagne-glasses' },
    { id: 'tour', name: 'Tour de cenotes', description: 'Excursión guiada para descubrir la Riviera Maya.', price: 1100, icon: 'fa-water' },
    { id: 'kids', name: 'Club infantil', description: 'Actividades supervisadas para pequeños viajeros.', price: 450, icon: 'fa-puzzle-piece' }
]);

export const HOTEL_GALLERY = Object.freeze([
    'https://images.unsplash.com/photo-1540541338287-41700207dee6?auto=format&fit=crop&w=800&q=80',
    'https://images.unsplash.com/photo-1590490360182-c33d57733427?auto=format&fit=crop&w=800&q=80',
    'https://images.unsplash.com/photo-1544161515-4ab6ce6db874?auto=format&fit=crop&w=800&q=80',
    'https://images.unsplash.com/photo-1551882547-ff40c63fe5fa?auto=format&fit=crop&w=800&q=80',
    'https://images.unsplash.com/photo-1542314831-068cd1dbfeeb?auto=format&fit=crop&w=800&q=80',
    'https://images.unsplash.com/photo-1530789253388-582c481c54b0?auto=format&fit=crop&w=800&q=80'
]);

export const HOTEL_COUPONS = Object.freeze({
    OVERLOOK10: 0.1,
    BIENVENIDO: 0.1
});

export const HOTEL_THEME = Object.freeze({
    fonts: Object.freeze({
        body: "'Inter', sans-serif",
        googleFontsUrl: 'https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700&display=swap'
    }),
    colors: Object.freeze({
        primary: '#2563eb',
        primaryDark: '#1d4ed8',
        secondary: '#4338ca',
        text: '#111827',
        muted: '#4b5563',
        surface: 'rgba(255, 255, 255, 0.4)',
        success: '#16a34a',
        error: '#dc2626'
    })
});

export function formatMoney(amount, currency = 'MXN', locale = 'es-MX') {
    if (!Number.isFinite(amount)) {
        throw new TypeError('El importe debe ser un número finito.');
    }

    return `${new Intl.NumberFormat(locale, { style: 'currency', currency }).format(amount)} ${currency}`;
}

function parseISODate(date) {
    if (typeof date !== 'string' || !/^\d{4}-\d{2}-\d{2}$/.test(date)) {
        throw new TypeError('La fecha debe tener el formato AAAA-MM-DD.');
    }

    const timestamp = Date.parse(`${date}T00:00:00Z`);
    if (!Number.isFinite(timestamp) || new Date(timestamp).toISOString().slice(0, 10) !== date) {
        throw new RangeError('La fecha no es válida.');
    }

    return timestamp;
}

export function calculateNights(checkIn, checkOut) {
    const start = parseISODate(checkIn);
    const end = parseISODate(checkOut);
    if (end <= start) {
        throw new RangeError('La salida debe ser posterior a la llegada.');
    }

    return (end - start) / 86_400_000;
}

export function isDateOverlap(start1, end1, start2, end2) {
    return parseISODate(start1) < parseISODate(end2) &&
        parseISODate(end1) > parseISODate(start2);
}

export function isRoomAvailable(roomId, checkIn, checkOut, bookings = []) {
    if (!checkIn || !checkOut) {
        return true;
    }

    return !bookings.some((booking) =>
        booking.roomId === roomId &&
        isDateOverlap(checkIn, checkOut, booking.checkIn, booking.checkOut)
    );
}

export function calculateBookingTotal({
    room,
    nights,
    serviceIds = [],
    services = HOTEL_SERVICES,
    discount = 0
}) {
    if (!room || !Number.isFinite(room.price) || room.price < 0) {
        throw new TypeError('Se requiere una habitación con un precio válido.');
    }
    if (!Number.isFinite(nights) || nights < 0) {
        throw new RangeError('El número de noches debe ser un número no negativo.');
    }
    if (!Number.isFinite(discount) || discount < 0 || discount > 1) {
        throw new RangeError('El descuento debe estar entre 0 y 1.');
    }

    const servicesTotal = serviceIds.reduce((total, serviceId) => {
        const service = services.find((item) => item.id === serviceId);
        return total + (service?.price ?? 0);
    }, 0);

    return Math.max(0, (room.price * nights + servicesTotal) * (1 - discount));
}

export function getStoredBookings(storage, storageKey = 'overlookBookings') {
    if (!storage || typeof storage.getItem !== 'function') {
        throw new TypeError('Se requiere un almacenamiento compatible con localStorage.');
    }

    const stored = storage.getItem(storageKey);
    if (!stored) {
        return [];
    }

    const bookings = JSON.parse(stored);
    if (!Array.isArray(bookings)) {
        throw new TypeError(`Los datos guardados en "${storageKey}" no son una lista de reservas.`);
    }

    return bookings;
}

export function saveStoredBookings(storage, bookings, storageKey = 'overlookBookings') {
    if (!storage || typeof storage.setItem !== 'function') {
        throw new TypeError('Se requiere un almacenamiento compatible con localStorage.');
    }
    if (!Array.isArray(bookings)) {
        throw new TypeError('Las reservas deben proporcionarse como una lista.');
    }

    storage.setItem(storageKey, JSON.stringify(bookings));
}

function escapeHTML(value) {
    return String(value).replace(/[&<>"']/g, (character) => ({
        '&': '&amp;',
        '<': '&lt;',
        '>': '&gt;',
        '"': '&quot;',
        "'": '&#39;'
    })[character]);
}

export class BookingTools {
    constructor({
        rooms = HOTEL_ROOMS,
        services = HOTEL_SERVICES,
        storagePrefix = 'hotel-paulette',
        currency = 'MXN',
        locale = 'es-MX'
    } = {}) {
        if (!Array.isArray(rooms) || !Array.isArray(services)) {
            throw new TypeError('rooms y services deben ser listas.');
        }
        if (typeof storagePrefix !== 'string' || !storagePrefix.trim()) {
            throw new TypeError('storagePrefix debe ser una cadena no vacía.');
        }

        this.rooms = rooms;
        this.services = services;
        this.storageKey = `${storagePrefix.trim()}:bookings`;
        this.currency = currency;
        this.locale = locale;
        this.host = null;
        this.handleSubmit = this.handleSubmit.bind(this);
    }

    mountBookingWidget(selector) {
        const host = document.querySelector(selector);
        if (!host) {
            throw new Error(`No se encontró el contenedor de reservas: ${selector}`);
        }
        if (this.host) {
            this.unmountBookingWidget();
        }

        this.host = host;
        this.host.innerHTML = `
            <section class="bt-booking-widget" aria-label="Formulario de reservación">
                <form class="bt-booking-form">
                    <label>Habitación
                        <select name="roomId" required>
                            ${this.rooms.map((room) => `<option value="${escapeHTML(room.id)}">${escapeHTML(room.name)} — ${escapeHTML(formatMoney(room.price, this.currency, this.locale))} por noche</option>`).join('')}
                        </select>
                    </label>
                    <div class="bt-booking-dates">
                        <label>Llegada<input name="checkIn" type="date" required></label>
                        <label>Salida<input name="checkOut" type="date" required></label>
                    </div>
                    <label>Huéspedes
                        <select name="guests">
                            ${[1, 2, 3, 4, 5].map((count) => `<option value="${count}"${count === 2 ? ' selected' : ''}>${count}</option>`).join('')}
                        </select>
                    </label>
                    <fieldset>
                        <legend>Servicios adicionales</legend>
                        ${this.services.map((service) => `<label class="bt-booking-service"><input name="serviceIds" type="checkbox" value="${escapeHTML(service.id)}"> ${escapeHTML(service.name)} (+${escapeHTML(formatMoney(service.price, this.currency, this.locale))})</label>`).join('')}
                    </fieldset>
                    <p class="bt-booking-total" aria-live="polite">Selecciona fechas para calcular el total.</p>
                    <p class="bt-booking-message" role="status" aria-live="polite"></p>
                    <button type="submit">Confirmar reservación</button>
                </form>
            </section>`;

        const form = this.host.querySelector('.bt-booking-form');
        form.addEventListener('input', () => this.updateTotal(form));
        form.addEventListener('submit', this.handleSubmit);
        return this.host;
    }

    unmountBookingWidget() {
        if (!this.host) {
            return;
        }

        this.host.querySelector('.bt-booking-form')?.removeEventListener('submit', this.handleSubmit);
        this.host.replaceChildren();
        this.host = null;
    }

    updateTotal(form) {
        const totalLabel = form.querySelector('.bt-booking-total');
        const checkIn = form.elements.checkIn.value;
        const checkOut = form.elements.checkOut.value;
        if (!checkIn || !checkOut) {
            totalLabel.textContent = 'Selecciona fechas para calcular el total.';
            return;
        }

        const room = this.rooms.find((item) => item.id === form.elements.roomId.value);
        if (!room) {
            throw new Error('La habitación seleccionada ya no está disponible.');
        }
        const nights = calculateNights(checkIn, checkOut);
        const serviceIds = [...form.querySelectorAll('[name="serviceIds"]:checked')].map((input) => input.value);
        totalLabel.textContent = `Total estimado (${nights} noches): ${formatMoney(calculateBookingTotal({
            room,
            nights,
            serviceIds,
            services: this.services
        }), this.currency, this.locale)}`;
    }

    handleSubmit(event) {
        event.preventDefault();
        const form = event.currentTarget;
        const message = form.querySelector('.bt-booking-message');
        try {
            const room = this.rooms.find((item) => item.id === form.elements.roomId.value);
            const checkIn = form.elements.checkIn.value;
            const checkOut = form.elements.checkOut.value;
            const guests = Number(form.elements.guests.value);
            if (!room || !checkIn || !checkOut) {
                throw new Error('Completa las fechas y selecciona una habitación.');
            }
            const nights = calculateNights(checkIn, checkOut);
            if (guests > room.maxGuests) {
                throw new Error('La habitación no tiene capacidad para ese número de huéspedes.');
            }

            const storage = globalThis.localStorage;
            const bookings = getStoredBookings(storage, this.storageKey);
            if (!isRoomAvailable(room.id, checkIn, checkOut, bookings)) {
                throw new Error('La habitación no está disponible para esas fechas.');
            }

            const serviceIds = [...form.querySelectorAll('[name="serviceIds"]:checked')].map((input) => input.value);
            const booking = {
                id: `booking-${Date.now()}`,
                roomId: room.id,
                room: room.name,
                checkIn,
                checkOut,
                guests,
                services: serviceIds,
                total: calculateBookingTotal({ room, nights, serviceIds, services: this.services })
            };
            saveStoredBookings(storage, [...bookings, booking], this.storageKey);
            message.textContent = `Reservación guardada. Total: ${formatMoney(booking.total, this.currency, this.locale)}.`;
            form.reset();
            this.updateTotal(form);
        } catch (error) {
            message.textContent = error instanceof Error ? error.message : 'No se pudo completar la reservación.';
        }
    }
}
