import { registerEndOfDayJobs } from '../jobs/endOfDayJobs.js';
import { registerExpiryJobs } from '../jobs/expiryJobs.js';
import { registerSeedDataJobs } from '../jobs/seedDataJobs.js';

export function registerJobs(timezone = 'Asia/Singapore') {
    if (process.env.NODE_ENV === 'test') return;
    registerEndOfDayJobs(timezone);
    registerExpiryJobs(timezone);
    registerSeedDataJobs(timezone);
}
