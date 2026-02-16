import { startScheduler } from './scheduler.js';
import { processEmailQueue } from './worker.js';
import dotenv from 'dotenv';

dotenv.config();

async function main() {
    process.on('unhandledRejection', (reason, promise) => {
        console.error('[CRITICAL] Unhandled Rejection at:', promise, 'reason:', reason);
    });

    process.on('uncaughtException', (err) => {
        console.error('[CRITICAL] Uncaught Exception:', err.message);
        process.exit(1);
    });

    console.log('--------------------------------------------------');
    console.log('CAControl Day End Reminder Email System');
    console.log('Starting services...');
    console.log(`Time: ${new Date().toISOString()}`);
    console.log('--------------------------------------------------');

    try {
        // Start the scheduler (Job Creator) - runs every 15 mins
        startScheduler();

        // Start the worker (Job Processor) - runs continuously
        processEmailQueue();

        console.log('[SYSTEM] Both Scheduler and Worker are running.');

        // Graceful shutdown
        const shutdown = () => {
            console.log('\n[SYSTEM] Received shutdown signal. Closing gracefully...');
            // In a more complex app, we'd close DB connections here
            process.exit(0);
        };

        process.on('SIGTERM', shutdown);
        process.on('SIGINT', shutdown);

    } catch (err: any) {
        console.error('[SYSTEM_CRITICAL] Failed to start services:', err.message);
        process.exit(1);
    }
}

main();
