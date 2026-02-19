/**
 * TEST CRON SCRIPT
 * Triggers the local Next.js API routes to simulate Vercel Cron.
 * usage: npx tsx scripts/test-cron.ts
 */

async function testCron() {
    const baseUrl = 'http://localhost:3000';
    const secret = process.env.CRON_SECRET || '';

    console.log('--- TESTING VERCEL CRON API ENDPOINTS ---');
    console.log(`Target: ${baseUrl}`);

    try {
        // 1. Trigger Scheduler
        console.log('\n[1] Triggering Scheduler (/api/cron/schedule)...');
        const scheduleRes = await fetch(`${baseUrl}/api/cron/schedule`, {
            headers: { 'Authorization': `Bearer ${secret}` }
        });

        const scheduleData = await scheduleRes.json();
        console.log('Status:', scheduleRes.status);
        console.log('Response:', JSON.stringify(scheduleData, null, 2));

        // 2. Trigger Worker (Processor)
        console.log('\n[2] Triggering Worker (/api/cron/process)...');
        const processRes = await fetch(`${baseUrl}/api/cron/process`, {
            headers: { 'Authorization': `Bearer ${secret}` }
        });

        const processData = await processRes.json();
        console.log('Status:', processRes.status);
        console.log('Response:', JSON.stringify(processData, null, 2));

    } catch (err: any) {
        console.error('Test failed:', err.message);
        console.error('Ensure your Next.js server is running (npm run dev)');
    }
}

testCron();
