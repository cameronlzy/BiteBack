import Promotion from '../models/promotion.model.js';
import mongoose from 'mongoose';
import { escapeRegex } from '../helpers/regex.helper.js';

export async function searchPromotions(filters) {
    const { search, restaurants, page, limit, sortBy, order } = filters;

    const skip = (page - 1) * limit;
    const sortOrder = order === 'desc' ? -1 : 1;
    const basePipeline = [];

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