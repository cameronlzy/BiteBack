import mongoose from 'mongoose';

export function wrapSession(session) {
    return session ? { session } : {};
}

export async function withTransaction(callback) {
    const isProdEnv = process.env.NODE_ENV === 'production';
    const session = isProdEnv ? await mongoose.startSession() : undefined;
    if (session) session.startTransaction();

    try {
        const result = await callback(session);
        if (session) await session.commitTransaction();
        return result;
    } catch (err) {
        if (session) await session.abortTransaction();
        throw err;
    } finally {
        if (session) session.endSession();
    }
}
