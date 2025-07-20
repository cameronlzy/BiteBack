import { DateTime } from 'luxon';
import VisitHistory from '../models/visitHistory.model.js';
import CustomerProfile from '../models/customerProfile.model.js';

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

// helper services
export async function getRandomEnagagedCustomers(amount, monthsAgo = 3) {
    const cutoffDate = DateTime.now().minus({ months: monthsAgo }).toJSDate();

    const engagedCustomerIds = await VisitHistory.aggregate([
        {
            $match: {
                'visits.visitDate': { $gte: cutoffDate },
            },
        },
        {
            $project: {
                customer: 1,
                recentVisits: {
                    $filter: {
                        input: '$visits',
                        as: 'visit',
                        cond: { $gte: ['$$visit.visitDate', cutoffDate] }
                    }
                }
            }
        },
        {
            $match: {
                recentVisits: { $ne: [] }
            }
        },
        {
            $group: {
                _id: '$customer'
            }
        },
        { $sample: { size: amount * 5 } }
    ]);

    const customerIds = engagedCustomerIds.map(c => c._id);

    const customers = await CustomerProfile.aggregate([
        { 
            $match: { 
                _id: { $in: customerIds },
                emailOptOut: { $ne: true }
            } 
        },
        {
            $lookup: {
                from: 'users',
                localField: 'user',
                foreignField: '_id',
                as: 'user'
            }
        },
        {
            $unwind: '$user'
        },
        {
            $project: {
                name: 1,
                user: { email: 1 }
            }
        },
        { $sample: { size: amount } }
    ]);

    return customers;
}