import cron from 'node-cron';
import { processEndOfDay } from '../services/scheduledJobs/processEndOfDay.js';
import { runJob } from '../helpers/jobRunner.js';
import { backfillReviewAnalytics } from '../services/scheduledJobs/backfillReviewAnalytics.js';
import { DateTime } from 'luxon';

export function registerEndOfDayJob() {
    if (process.env.NODE_ENV === 'test') return;
    
    // runs every 15 minute
    cron.schedule('*/15 * * * *', async () => {
        const nowSGT = DateTime.now().setZone('Asia/Singapore');
        await runJob('EndOfDayCleanup', async () => {
            await processEndOfDay(nowSGT);
        });
    });

    cron.schedule('* * * * *', async () => {
        const nowSGT = DateTime.now().setZone('Asia/Singapore');
        if (nowSGT.hour === 23 && nowSGT.minute === 59) {
            const runDateSGT = nowSGT.startOf('day');

            await runJob('EndOfDayBackfill', async () => {
                await backfillReviewAnalytics(runDateSGT);
            });
        }
    });
}