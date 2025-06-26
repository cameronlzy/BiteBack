import QueueEntry from '../../models/queueEntry.model.js';
import QueueCounter from '../../models/queueCounter.model.js';

export async function queueCleanup(restaurant, session) {
    // delete queueEntries for this restaurant
    await QueueEntry.deleteMany(
        { restaurant: restaurant._id }  
    ).session(session);

    // reset counters
    await QueueCounter.updateMany(
        { restaurant: restaurant._id },
        { $set: { lastNumber: 0, calledNumber: 0 } }
    ).session(session);
}