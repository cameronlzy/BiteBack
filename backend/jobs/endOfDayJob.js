import cron from 'node-cron';
import { processEndOfDay } from '../services/scheduledJobs/processEndOfDay.js';
import { runJob } from '../helpers/jobRunner.js';

export function registerEndOfDayJob() {
    if (process.env.NODE_ENV === 'test') return;
    
    // runs every 15 minute
    cron.schedule('*/15 * * * *', async () => {
        await runJob('EndOfDayCleanup', async () => {
            await processEndOfDay();
        });
    });
}