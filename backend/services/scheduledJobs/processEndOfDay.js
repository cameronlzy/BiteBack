import { queueCleanup } from "./queueCleanup.js";
import { processVisitHistory } from "./visitHistoryProcessor.js";
import Restaurant from "../../models/restaurant.model.js";
import { getOpeningHoursToday } from "../../helpers/restaurant.helper.js";

export async function processEndOfDay() {
    const now = new Date();
    const currentHour = now.getHours();
    const currentMinute = now.getMinutes();

    const restaurants = await Restaurant.find();

    for (const restaurant of restaurants) {
        const dayHours = getOpeningHoursToday(restaurant);
        if (!dayHours || dayHours === 'x') continue;

        const [_openStr, closeStr] = dayHours.split('-');    
        const [closingHourStr, closingMinuteStr] = closeStr.split(':');
        const closingHour = parseInt(closingHourStr, 10);
        const closingMinute = parseInt(closingMinuteStr, 10);
        
        // add 30 mins buffer time
        const bufferMinutes = 30;
        const closingTotalMinutes = closingHour * 60 + closingMinute + bufferMinutes;
        const nowTotalMinutes = currentHour * 60 + currentMinute;

        if (nowTotalMinutes >= closingTotalMinutes) {
            await queueCleanup(restaurant); // assign to deletedEntries
            await processVisitHistory(restaurant);
            // add in statistics processing
        }
    }
}