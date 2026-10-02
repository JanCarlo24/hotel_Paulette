import test from 'node:test';
import assert from 'node:assert/strict';
import {
    HOTEL_ROOMS,
    HOTEL_SERVICES,
    calculateBookingTotal,
    calculateNights,
    formatMoney,
    getStoredBookings,
    isDateOverlap,
    isRoomAvailable,
    saveStoredBookings
} from '../src/index.js';

test('calcula noches entre fechas ISO válidas', () => {
    assert.equal(calculateNights('2026-10-02', '2026-10-05'), 3);
});

test('rechaza fechas inválidas o una salida anterior a la llegada', () => {
    assert.throws(() => calculateNights('2026-02-30', '2026-03-02'), RangeError);
    assert.throws(() => calculateNights('2026-10-05', '2026-10-02'), RangeError);
});

test('detecta traslape y permite reservas contiguas', () => {
    assert.equal(isDateOverlap('2026-10-02', '2026-10-05', '2026-10-04', '2026-10-07'), true);
    assert.equal(isDateOverlap('2026-10-02', '2026-10-05', '2026-10-05', '2026-10-07'), false);
});

test('comprueba disponibilidad usando las reservas existentes', () => {
    const bookings = [{ roomId: 'room-1', checkIn: '2026-10-02', checkOut: '2026-10-05' }];
    assert.equal(isRoomAvailable('room-1', '2026-10-04', '2026-10-06', bookings), false);
    assert.equal(isRoomAvailable('room-2', '2026-10-04', '2026-10-06', bookings), true);
});

test('calcula habitación, servicios y cupón de descuento', () => {
    const total = calculateBookingTotal({
        room: HOTEL_ROOMS[0],
        nights: 2,
        serviceIds: ['breakfast'],
        services: HOTEL_SERVICES,
        discount: 0.1
    });
    assert.equal(total, 4698);
});

test('valida moneda y rechaza importes no finitos', () => {
    assert.match(formatMoney(850), /850/);
    assert.throws(() => formatMoney(Number.NaN), TypeError);
});

test('guarda y recupera reservas con una clave configurable', () => {
    const values = new Map();
    const storage = {
        getItem: (key) => values.get(key) ?? null,
        setItem: (key, value) => values.set(key, value)
    };
    const bookings = [{ id: 'test-booking' }];
    saveStoredBookings(storage, bookings, 'hotel:bookings');
    assert.deepEqual(getStoredBookings(storage, 'hotel:bookings'), bookings);
});

test('reporta JSON dañado en vez de ocultar el error', () => {
    const storage = { getItem: () => '{not-json' };
    assert.throws(() => getStoredBookings(storage), SyntaxError);
});
