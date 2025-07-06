import cron from 'node-cron';
import { DateTime } from 'luxon';
import { runJob } from '../helpers/jobRunner.js';
import { expireStaleRedemptions } from '../services/scheduledJobs/expireStaleRedemptions.js';

export function registerExpiryJobs(timezone = 'Asia/Singapore') {
    // every 2 minutes, expires stale redemptions
    cron.schedule('*/2 * * * *', async () => {
        const now = DateTime.now().setZone(timezone);
        await runJob('ExpireStaleRedemptions', async () => {
            const count = await expireStaleRedemptions();
            if (count > 0) {
                console.log(`[${now.toISO()}] Expired ${count} redemptions`);
            }
        });
    });
}