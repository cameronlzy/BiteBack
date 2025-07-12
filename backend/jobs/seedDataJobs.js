// import cron from 'node-cron';
// import { runJob } from '../helpers/jobRunner.js';
// import { seedData } from '../services/scheduledJobs/seedData.js';

// export function registerDataSeedJobs(timezone = 'Asia/Singapore') {
//     // runs at 12am everyday, creates reservations for the upcoming day


//     // every hour, create a few queue and review entries
//     cron.schedule('0 * * * *', async () => {
//         await runJob('SeedQueueAndReview', async () => {
//             await seedQueueAndReview();
//         });
//     });
// }
