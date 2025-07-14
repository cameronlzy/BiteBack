import _ from 'lodash';
import { DateTime } from 'luxon';
import Promotion from '../models/promotion.model.js';
import Restaurant from '../models/restaurant.model.js';
import { escapeRegex } from '../helpers/regex.helper.js';
import { deleteImagesFromDocument } from '../services/image.service.js';
import { error, success } from '../helpers/response.js';

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
                isActive: 1,
            },
        }
    );
    
    const [promotions, countResult] = await Promise.all([
        Promotion.aggregate(basePipeline),
        Promotion.aggregate(countPipeline),
    ]);

    const totalCount = countResult[0]?.total || 0;
    return success({
        totalCount,
        page,
        limit,
        totalPages: Math.ceil(totalCount/ limit),
        promotions
    });
}

export async function getPromotionsByOwner(authUser, query) {
    const { page, limit, status } = query;
    const skip = (page - 1) * limit;

    const now = new Date();
    const restaurants = await Restaurant.find({ owner: authUser.profile }).lean();
    const restaurantIds = restaurants.map(r => r._id);
    const baseFilter = { restaurant: { $in: restaurantIds } };

    if (status === 'past') {
        baseFilter.endDate = { $lt: now };
    } else if (status === 'upcoming') {
        baseFilter.endDate = { $gte: now };
    }

    const [promotions, total] = await Promise.all([
        Promotion.find(baseFilter)
            .populate('restaurant', 'name')
            .sort({ isActive: -1, startDate: 1 })
            .skip(skip)
            .limit(limit)
            .lean(),
        Promotion.countDocuments(baseFilter),
    ]);

    return success({
        promotions,
        page,
        limit,
        totalCount: total,
        totalPages: Math.ceil(total / limit),
    });
}

export async function getPromotionById(promotionId) {
    const promotion = await Promotion.findById(promotionId).populate('restaurant', 'name owner').lean();
    if (!promotion) return error(404, 'Promotion not found');
    if (promotion.endDate < new Date()) return error(404, 'Promotion expired');
    return success(promotion);
}

export async function createPromotion(authUser, data) {
    const restaurant = await Restaurant.findById(data.restaurant).select('timezone owner').lean();
    if (!restaurant) return error(404, 'Restaurant not found');
    if (restaurant.owner.toString() != authUser.profile) return error(403, 'Restaurant does not belong to owner');

    const promotion = new Promotion(_.pick(data, ['restaurant', 'title', 'description']));
    promotion.startDate = DateTime.fromISO(data.startDate, { zone: restaurant.timezone }).toUTC().toJSDate();
    promotion.endDate = DateTime.fromISO(data.endDate, { zone: restaurant.timezone }).toUTC().toJSDate();
    if (data.timeWindow) {
        const today = DateTime.now().setZone(restaurant.timezone).toISODate();

        if (data.timeWindow.startTime) {
            const dtStart = DateTime.fromISO(`${today}T${data.timeWindow.startTime}`, { zone: restaurant.timezone }).toUTC();
            data.timeWindow.startTime = dtStart.toFormat('HH:mm');
        }

        if (data.timeWindow.endTime) {
            const dtEnd = DateTime.fromISO(`${today}T${data.timeWindow.endTime}`, { zone: restaurant.timezone }).toUTC();
            data.timeWindow.endTime = dtEnd.toFormat('HH:mm');
        }
        promotion.timeWindow = data.timeWindow;
    }
    await promotion.save();

    return success(promotion.toObject());
}

export async function updatePromotion(promotion, restaurant, update) {
    if (promotion.endDate < new Date()) {
        return error(400, 'Promotion has expired');
    }

    for (const key in update) {
        if (key === 'startDate') {
            if (promotion.startDate < new Date()) {
                return error(400, 'Promotion has already started');
            }
            promotion.startDate = DateTime.fromISO(update.startDate, { zone: restaurant.timezone }).toUTC().toJSDate();
        } else if (key === 'endDate') {
            promotion.endDate = DateTime.fromISO(update.endDate, { zone: restaurant.timezone }).toUTC().toJSDate();
        } else if (key === 'timeWindow') {
            const today = DateTime.now().setZone(restaurant.timezone).toISODate();

            if (update.timeWindow.startTime) {
                const dtStart = DateTime.fromISO(`${today}T${update.timeWindow.startTime}`, { zone: restaurant.timezone }).toUTC();
                update.timeWindow.startTime = dtStart.toFormat('HH:mm');
            }

            if (update.timeWindow.endTime) {
                const dtEnd = DateTime.fromISO(`${today}T${update.timeWindow.endTime}`, { zone: restaurant.timezone }).toUTC();
                update.timeWindow.endTime = dtEnd.toFormat('HH:mm');
            }
            promotion.timeWindow = update.timeWindow;
        } else if (update[key] !== undefined) {
            promotion[key] = update[key];
        }
    }

    await promotion.save();
    return success(promotion.toObject());
}

export async function deletePromotion(promotion) {
    if (promotion.startDate < new Date()) {
        return error(400, 'Promotion has started');
    }
    if (promotion.endDate < new Date()) {
        return error(400, 'Promotion has expired');
    }

    await Promise.all([
        deleteImagesFromDocument(promotion, 'bannerImage'),
        deleteImagesFromDocument(promotion, 'mainImage'),
    ]);

    const deletedPromotion = promotion.toObject();
    await promotion.deleteOne();
    return success(deletedPromotion);
}