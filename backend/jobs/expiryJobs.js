import cron from 'node-cron';
import { runJob } from '../helpers/jobRunner.js';
import { expireStaleRedemptions, cancelStaleOrders } from '../services/scheduledJobs/expire.service.js';

export function registerExpiryJobs(timezone = 'Asia/Singapore') {
    // every minute - expires stale redemptions
    cron.schedule('*/1 * * * *', async () => {
        await runJob('ExpireStaleRedemptions', async () => {
            await expireStaleRedemptions();
        });
    }, { timezone });

    // every 5 minutes — cancel stale orders
    cron.schedule('*/5 * * * *', async () => {
        await runJob('CancelStaleOrders', async () => {
            await cancelStaleOrders();
        });
    }, { timezone });
}