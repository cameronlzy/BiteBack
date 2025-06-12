export async function queueCleanup(restaurant) {
    return await withTransaction(async (session) => {
        // delete queueEntries for this restaurant
        const deletedEntries = await QueueEntry.deleteMany({
            restaurant: restaurant._id
        }).session(session);
        
        // reset counters
        const updatedCounter = await QueueCounter.updateMany(
            { restaurant: restaurant._id },
            { $set: { lastNumber: 0, calledNumber: 0 } }
        ).session(session);
        return deletedEntries.toObject();
    });
}