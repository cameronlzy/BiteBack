import Reservation from '../../models/reservation.model.js';
import { DateTime } from 'luxon';

export async function cleanupPastReservations(restaurant, session) {
    const nowSGT = DateTime.now().setZone('Asia/Singapore');
    const nowUTC = nowSGT.toUTC().toJSDate();

    await Reservation.deleteMany({
        restaurant: restaurant._id,
        reservationDate: { $lt: nowUTC }
    }).session(session);
}
