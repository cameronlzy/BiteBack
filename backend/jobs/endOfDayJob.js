import cron from 'node-cron';
import { processEndOfDay } from '../services/scheduledJobs/processEndOfDay.js';
import { runJob } from '../helpers/jobRunner.js';
import { backfillReviewAnalytics } from '../services/scheduledJobs/backfillReviewAnalytics.js';
import { DateTime } from 'luxon';

export function registerEndOfDayJob(timezone = 'Asia/Singapore') {
    if (process.env.NODE_ENV === 'test') return;
    
    // runs every 15 minute
    cron.schedule('*/15 * * * *', async () => {
        const now = DateTime.now().setZone(timezone);
        await runJob('EndOfDayCleanup', async () => {
            await processEndOfDay(now);
        });
    });

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