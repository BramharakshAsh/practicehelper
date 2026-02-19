/**
 * PROCESS ALL JOBS SCRIPT
 * Repeatedly triggers the worker API until no jobs remain.
 * usage: npx tsx scripts/process-all-jobs.ts
 */

async function processAllJobs() {
    const baseUrl = 'http://localhost:3000';
    const secret = process.env.CRON_SECRET || '';
    let totalProcessed = 0;
    let batchCount = 0;

    console.log('--- STARTING BULK EMAIL PROCESSING ---');
    console.log(`Target: ${baseUrl}/api/cron/process`);

    while (true) {
        batchCount++;
        try {
            console.log(`\n[Batch ${batchCount}] Requesting worker...`);
            const res = await fetch(`${baseUrl}/api/cron/process`, {
                headers: { 'Authorization': `Bearer ${secret}` }
            });

            if (res.status !== 200) {
                console.error(`Error: Status ${res.status}`);
                const text = await res.text();
                console.error(text);
                break;
            }

            const data = await res.json();

            if (data.message === 'No pending jobs') {
                console.log('✅ No more pending jobs.');
                break;
            }

            if (data.processed) {
                totalProcessed += data.processed;
                console.log(`Processed: ${data.processed} emails.`);
                data.results.forEach((r: any) => {
                    console.log(` - ${r.status}: ${r.email || r.id}`);
                });
            } else {
                console.log('Unexpected response:', data);
                break;
            }

            // Small delay to be nice to the server
            await new Promise(resolve => setTimeout(resolve, 1000));

        } catch (err: any) {
            console.error('Request failed:', err.message);
            break;
        }
    }

    console.log(`\n--- COMPLETE ---`);
    console.log(`Total emails processed/attempted: ${totalProcessed}`);
}

processAllJobs();
