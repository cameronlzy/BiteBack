import { withTransaction } from '../../helpers/transaction.helper.js';
import QueueEntry from '../../models/queueEntry.model.js';
import QueueCounter from '../../models/queueCounter.model.js';

export async function queueCleanup(restaurant) {
    return await withTransaction(async (session) => {
        // delete queueEntries for this restaurant
        const entriesToDelete = await QueueEntry.find({ restaurant: restaurant._id }).session(session);
        await QueueEntry.deleteMany({ _id: { $in: entriesToDelete.map(e => e._id) } }).session(session);
   
        // reset counters
        await QueueCounter.updateMany(
            { restaurant: restaurant._id },
            { $set: { lastNumber: 0, calledNumber: 0 } }
        ).session(session);
        return entriesToDelete.map(entry => entry.toObject());
    });
}