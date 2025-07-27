import cron from 'node-cron';
import { runJob } from '../helpers/jobRunner.js';
import { sendWeeklyPromotionEmails } from '../services/scheduledJobs/emailCampaign.service.js';

export function registerEmailCampaignJobs(timezone = 'Asia/Singapore') {
    if (process.env.NODE_ENV === 'test') return;
    
    // runs every monday at 10am SGT - sends weekly promotions campaigns
    cron.schedule('0 10 * * 1', async () => {
        await runJob('SendWeeklyPromotionEmailCampaigns', async () => {
            await sendWeeklyPromotionEmails();
        });
    }, { timezone });
}