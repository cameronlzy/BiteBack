import cron from 'node-cron';
import { runJob } from '../helpers/jobRunner.js';
import { seedReservations, seedQueueAndReview, markPastReservations } from '../services/scheduledJobs/seedData.service.js';

export function registerSeedDataJobs(timezone = 'Asia/Singapore') {
    if (process.env.NODE_ENV === 'test') return;
    
    // runs at 12am every day - creates reservations for the upcoming day
    cron.schedule('0 0 * * *', async () => {
        await runJob('SeedReservations', async () => {
            await seedReservations();
        });
    }, { timezone });

    // every hour - creates a few queue and review entries
    cron.schedule('0 * * * *', async () => {
        await runJob('SeedQueueAndReview', async () => {
            await seedQueueAndReview();
        });

        await runJob('MarkPastReservations', async () => {
            await markPastReservations();
        });
    }, { timezone });
}
