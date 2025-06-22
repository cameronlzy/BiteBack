import mongoose from "mongoose";
import Promotion from "../../models/promotion.model.js";
import { DateTime } from 'luxon';

export function createTestPromotion(restaurant = new mongoose.Types.ObjectId()) {
    const title = 'title';
    const description = 'description';
    const startDate = DateTime.now().toJSDate();
    const endDate = DateTime.now().plus({ weeks: 1 }).toJSDate();
    
    const promotion = new Promotion({
        title, description, restaurant, startDate, endDate
    });
    return promotion;
}