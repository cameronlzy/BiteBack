import { registerEndOfDayJob } from '../jobs/endOfDayJob.js';

export function registerJobs() {
    registerEndOfDayJob();
}
