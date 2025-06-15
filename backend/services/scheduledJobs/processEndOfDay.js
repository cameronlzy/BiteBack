import { queueCleanup } from "./queueCleanup";

export async function processEndOfDay() {
    const now = new Date();
    const currentHour = now.getHours();
    const currentMinute = now.getMinutes();

    const restaurants = await Restaurant.find();

    for (const restaurant of restaurants) {
        const dayHours = getOpeningHoursToday(restaurant);
        if (!dayHours || dayHours === 'x') continue;

        const [openStr, closeStr] = dayHours.split('-');    
        const [closingHourStr, closingMinuteStr] = closeStr.split(':');
        const closingHour = parseInt(closingHourStr, 10);
        const closingMinute = parseInt(closingMinuteStr, 10);
        
        // add 30 mins buffer time
        const bufferMinutes = 30;
        const closingTotalMinutes = closingHour * 60 + closingMinute + bufferMinutes;
        const nowTotalMinutes = currentHour * 60 + currentMinute;

        if (nowTotalMinutes >= closingTotalMinutes) {
            const deletedEntries = await queueCleanup(restaurant);
            // add in vsiit history processing
            // add in statistics processing
        }
    }
}