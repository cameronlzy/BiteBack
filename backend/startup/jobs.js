import { registerEndOfDayJobs } from '../jobs/endOfDayJobs.js';
import { registerExpiryJobs } from '../jobs/expiryJobs.js';

export function registerJobs(timezone = 'Asia/Singapore') {
    if (process.env.NODE_ENV === 'test') return;
    registerEndOfDayJobs(timezone);
    registerExpiryJobs(timezone);
}
