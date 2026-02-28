const axios = require('axios');
require('dotenv').config();

const BASE_URL = 'http://localhost:3000'; // Assuming local dev
const CRON_PATH = '/api/cron/otp-cleanup';
const SECRET = process.env.CRON_SECRET;

async function verifySecurity() {
    console.log('--- Verifying Cron Route Security ---');
    
    // 1. Test without header
    try {
        console.log('Testing without Authorization header...');
        await axios.get(`${BASE_URL}${CRON_PATH}`);
        console.error('❌ FAILED: Route accessible without secret!');
    } catch (error) {
        if (error.response && error.response.status === 401) {
            console.log('✅ Success: Route blocked without secret (401 Unauthorized)');
        } else {
            console.log(`⚠️ Note: Received status ${error.response ? error.response.status : error.message}. (Expected 401 if routing protection is active)`);
        }
    }

    // 2. Test with correct header
    try {
        console.log('Testing with correct Authorization header...');
        const response = await axios.get(`${BASE_URL}${CRON_PATH}`, {
            headers: { 'Authorization': `Bearer ${SECRET}` }
        });
        console.log('✅ Success: Route accessible with correct secret!');
        console.log('Response:', response.data.message);
    } catch (error) {
        console.error('❌ FAILED: Route inaccessible even with correct secret!');
        console.error('Error:', error.response ? error.response.data : error.message);
    }
}

verifySecurity();
