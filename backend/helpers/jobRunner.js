import logger from '../startup/logging.js';

export async function runJob(name, jobFn) {
    try {
        logger.info(`[Job] Starting job: ${name}`);
        await jobFn();
        logger.info(`[Job] Completed job: ${name}`);
    } catch (err) {
        logger.error(`[Job] Error in job ${name}:`, err);
    }
}
