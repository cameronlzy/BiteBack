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
    });

    // runs every minute, backfills review analytics at the end of the day
    cron.schedule('* * * * *', async () => {
        const now = DateTime.now().setZone(timezone);
        if (now.hour === 23 && now.minute === 59) {
            const runDate = now.startOf('day');

            await runJob('EndOfDayBackfill', async () => {
                await backfillReviewAnalytics(runDate);
            });
        }
    });
}