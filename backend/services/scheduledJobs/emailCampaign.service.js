import config from 'config';
import { getRandomActivePromotions } from '../promotion.service.js';
import { getRandomEnagagedCustomers } from '../visitHistory.service.js';
import { sendWeeklyPromotionEmail } from '../../helpers/sendEmail.js';
import { generateUnsubscribeToken } from '../../helpers/token.helper.js';

export async function sendWeeklyPromotionEmails() {

    // get 5 random ongoing promotions
    const randomPromotions = await getRandomActivePromotions(5);

    if (randomPromotions.length === 0) {
        return;
    }

    // get 20 random customers (based off visit history + emailOptOut = false)
    const randomCustomers = await getRandomEnagagedCustomers(20);

    await Promise.all(randomCustomers.map(async (customer) => {
        const token = generateUnsubscribeToken(customer._id);
        const unsubscribeLink = `${config.get('frontendLink')}/unsubscribe?token=${token}`;
        
        await sendWeeklyPromotionEmail(customer.email, randomPromotions, unsubscribeLink);
    }));
}