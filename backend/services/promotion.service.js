import Promotion from '../models/promotion.model.js';
import mongoose from 'mongoose';
import { DateTime } from 'luxon';
import { escapeRegex } from '../helpers/regex.helper.js';
import _ from 'lodash';

export async function searchPromotions(filters) {
    const { search, restaurants, page, limit, sortBy, order } = filters;

    const skip = (page - 1) * limit;
    const sortOrder = order === 'desc' ? -1 : 1;
    const now = new Date();
    const basePipeline = [];
    basePipeline.push({
        $match: {
            endDate: { $gt: now },
            isActive: true
        }
    });

    if (restaurants && Array.isArray(restaurants) && restaurants.length > 0) {
        basePipeline.push({
            $match: {
                restaurant: { $in: restaurants.map(id => new mongoose.Types.ObjectId(id)) }
            }
        });
    }

    if (search) {
        const regex = new RegExp(escapeRegex(search), 'i');
            const regexMatchStage = {
              $match: {
                $or: [
                  { title: regex },
                  { description: regex },
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
                startDate: 1,
                endDate: 1,
                timeWindow: 1,
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

export async function getPromotionById(promotionId) {
    const promotion = await Promotion.findById(promotionId).lean();
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