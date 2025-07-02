import Reservation from '../../models/reservation.model.js';
import { DateTime } from 'luxon';

export async function cleanupPastReservations(restaurant, session) {
    const now = DateTime.now().setZone(restaurant.timezone);
    const nowUTC = now.toUTC().toJSDate();

    await Reservation.deleteMany({
        restaurant: restaurant._id,
        reservationDate: { $lt: nowUTC }
    }).session(session);
}
