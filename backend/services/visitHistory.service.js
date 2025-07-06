import VisitHistory from '../models/visitHistory.model.js';

export async function addVisitToHistory(customer, restaurant, visitDate, session = undefined) {
    const normalizedDate = new Date(Math.floor(visitDate.getTime() / 1000) * 1000);

    const existing = await VisitHistory.findOne({ customer, restaurant }).session(session);

    if (existing) {
        const alreadyVisited = existing.visits.some(
            v => v.visitDate.getTime() === normalizedDate.getTime()
        );
        if (alreadyVisited) return;

        await VisitHistory.updateOne(
            { _id: existing._id },
            {
                $push: {
                    visits: {
                        visitDate: normalizedDate,
                        reviewed: false,
                    },
                },
            },
            { session }
        );
    } else {
        await VisitHistory.create(
            [
                {
                    customer,
                    restaurant,
                    visits: [{ visitDate: normalizedDate, reviewed: false }],
                },
            ],
            session ? { session } : undefined
        );
    }
}

export async function updateVisitReviewedStatus(customer, restaurant, visitDate, status, session = undefined) {
    const normalizedDate = new Date(Math.floor(visitDate.getTime() / 1000) * 1000);

    await VisitHistory.findOneAndUpdate(
        {
            customer,
            restaurant,
            'visits.visitDate': normalizedDate
        },
        {
            $set: { 'visits.$.reviewed': status }
        },
        {
            new: true,
            session
        }
    );
}
