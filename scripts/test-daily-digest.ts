/**
 * TEST DAILY DIGEST CRON
 * usage: npx tsx scripts/test-daily-digest.ts
 */

async function testDailyDigest() {
    const baseUrl = 'http://localhost:3000';
    const secret = process.env.CRON_SECRET || '';

    console.log('--- TESTING DAILY DIGEST ---');
    console.log(`Target: ${baseUrl}/api/cron/daily-digest`);

    try {
        const res = await fetch(`${baseUrl}/api/cron/daily-digest`, {
            headers: { 'Authorization': `Bearer ${secret}` }
        });

        console.log('Status:', res.status);
        const text = await res.text();
        try {
            console.log('Response:', JSON.stringify(JSON.parse(text), null, 2));
        } catch {
            console.log('Response (Raw):', text);
        }

    } catch (err: any) {
        console.error('Test failed:', err.message);
    }
}

testDailyDigest();
