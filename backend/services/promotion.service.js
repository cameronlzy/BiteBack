import Promotion from '../models/promotion.model.js';
import Restaurant from '../models/restaurant.model.js';
import { DateTime } from 'luxon';
import { escapeRegex } from '../helpers/regex.helper.js';
import _ from 'lodash';

export async function searchPromotions(filters) {
    const { search, page, limit, sortBy, order } = filters;

    const skip = (page - 1) * limit;
    const sortOrder = order === 'desc' ? -1 : 1;
    const now = new Date();
    const basePipeline = [
        {
            $match: {
                endDate: { $gt: now },
                isActive: true
            }
        },
            {
                $lookup: {
                    from: 'restaurants', 
                    localField: 'restaurant',
                    foreignField: '_id',
                    as: 'restaurantData'
            }
        },
        {
            $unwind: '$restaurantData'
        }
    ];

    if (search) {
        const regex = new RegExp(escapeRegex(search), 'i');
            const regexMatchStage = {
              $match: {
                $or: [
                  { title: regex },
                  { description: regex },
                  { 'restaurantData.name': regex },
                  { searchKeywords: { $elemMatch: { $regex: regex } } }
                ]
              }
            };
            const searchStage = search ? regexMatchStage : null;
            basePipeline.push(searchStage);
    }

    // create pipeline to get totalCount
    const countPipeline = [...basePipeline, { $count: 'total' }];

    // pagination
    basePipeline.push(
        { $sort: { [sortBy]: sortOrder } },
        { $skip: skip },
        { $limit: limit },
        {
            $project: {
                _id: 1,
                title: 1,
                description: 1,
                restaurant: {
                    _id: '$restaurantData._id',
                    name: '$restaurantData.name'
                },
                startDate: 1,
                endDate: 1,
                timeWindow: 1,
                mainImage: 1,
                bannerImage: 1,
            },
        }
    );
    
    const [promotions, countResult] = await Promise.all([
        Promotion.aggregate(basePipeline),
        Promotion.aggregate(countPipeline),
    ]);

    const totalCount = countResult[0]?.total || 0;
    return {
        status: 200,
        body: {
            totalCount,
            page,
            limit,
            totalPages: Math.ceil(totalCount/ limit),
            promotions
        }
    };
}

export async function getPromotionsByOwner(authUser) {
    const restaurants = await Restaurant.find({ owner: authUser._id }).lean();
    const restaurantIds = restaurants.map(r => r._id);
    const promotions = await Promotion.find({
        restaurant: { $in: restaurantIds }
    }).populate('restaurant', 'name').lean();
    return { status: 200, body: promotions };
}

export async function getPromotionById(promotionId) {
    const promotion = await Promotion.findById(promotionId).populate('restaurant', 'name').lean();
    if (!promotion) return { status: 404, body: 'Promotion not found' };
    if (promotion.endDate < new Date() || !promotion.isActive) return { status: 404, body: 'Promotion expired' };
    return { status: 200, body: promotion };
}

export async function createPromotion(data) {
    const promotion = new Promotion(_.pick(data, ['restaurant', 'title', 'description']));
    promotion.startDate = DateTime.fromISO(data.startDate, { zone: 'Asia/Singapore' }).toUTC().toJSDate();
    promotion.endDate = DateTime.fromISO(data.endDate, { zone: 'Asia/Singapore' }).toUTC().toJSDate();
    if (data.timeWindow) {
        const todaySGT = DateTime.now().setZone('Asia/Singapore').toISODate();

        if (data.timeWindow.startTime) {
            const dtStart = DateTime.fromISO(`${todaySGT}T${data.timeWindow.startTime}`, { zone: 'Asia/Singapore' }).toUTC();
            data.timeWindow.startTime = dtStart.toFormat('HH:mm');
        }

        if (data.timeWindow.endTime) {
            const dtEnd = DateTime.fromISO(`${todaySGT}T${data.timeWindow.endTime}`, { zone: 'Asia/Singapore' }).toUTC();
            data.timeWindow.endTime = dtEnd.toFormat('HH:mm');
        }
        promotion.timeWindow = data.timeWindow;
    }
    await promotion.save();

    return { status: 200, body: promotion.toObject() };
}

export async function updatePromotion(promotion, update) {
    for (const key in update) {
        if (key === 'startDate') {
            promotion.startDate = DateTime.fromISO(update.startDate, { zone: 'Asia/Singapore' }).toUTC().toJSDate();
        } else if (key === 'endDate') {
            promotion.endDate = DateTime.fromISO(update.endDate, { zone: 'Asia/Singapore' }).toUTC().toJSDate();
        } else if (key === 'timeWindow') {
            const todaySGT = DateTime.now().setZone('Asia/Singapore').toISODate();

            if (update.timeWindow.startTime) {
                const dtStart = DateTime.fromISO(`${todaySGT}T${update.timeWindow.startTime}`, { zone: 'Asia/Singapore' }).toUTC();
                update.timeWindow.startTime = dtStart.toFormat('HH:mm');
            }

            if (update.timeWindow.endTime) {
                const dtEnd = DateTime.fromISO(`${todaySGT}T${update.timeWindow.endTime}`, { zone: 'Asia/Singapore' }).toUTC();
                update.timeWindow.endTime = dtEnd.toFormat('HH:mm');
            }
            promotion.timeWindow = update.timeWindow;
        } else if (update[key] !== undefined) {
            promotion[key] = update[key];
        }
    }

    await promotion.save();
    return { status: 200, body: promotion.toObject() };
}

export async function deletePromotion(promotion) {
    const deletedPromotion = promotion.toObject();
    await promotion.deleteOne();
    return { status: 200, body: deletedPromotion };
}