import cron from 'node-cron';
import { runJob } from '../helpers/jobRunner.js';
import { expireStaleRedemptions } from '../services/scheduledJobs/expire.service.js';

export function registerExpiryJobs() {
    // every 2 minutes, expires stale redemptions
    cron.schedule('*/2 * * * *', async () => {
        await runJob('ExpireStaleRedemptions', async () => {
            await expireStaleRedemptions();
        });
    });
}