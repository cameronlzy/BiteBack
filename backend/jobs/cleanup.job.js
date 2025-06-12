import cron from 'node-cron';
// import { processEligibleRestaurants } from '../services/queue.service.js';

// runs every 15 minute
cron.schedule('*/15 * * * *', async () => {
    console.log('[CleanupJob] Running scheduled cleanup');
});