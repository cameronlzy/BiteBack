import cron from 'node-cron';
import { DateTime } from 'luxon';
import { processEndOfDay, backfillReviewAnalytics } from '../services/scheduledJobs/endOfDay.service.js';
import { runJob } from '../helpers/jobRunner.js';

export function registerEndOfDayJobs(timezone = 'Asia/Singapore') {
    if (process.env.NODE_ENV === 'test') return;
    
    // runs every 15 minute
    cron.schedule('*/15 * * * *', async () => {
        const now = DateTime.now().setZone(timezone);
        await runJob('EndOfDayCleanup', async () => {
            await processEndOfDay(now);
        });
    }, { timezone });

    // runs every minute, backfills review analytics at the end of the day
    cron.schedule('59 23 * * *', async () => {
        const runDate = DateTime.now().setZone(timezone).startOf('day');
        await runJob('EndOfDayBackfill', async () => {
            await backfillReviewAnalytics(runDate);
        });
    }, { timezone });
}