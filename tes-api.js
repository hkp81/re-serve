const http = require('http');

function request(options, data) {
  return new Promise((resolve, reject) => {
    const req = http.request(options, (res) => {
      let body = '';
      res.on('data', chunk => body += chunk);
      res.on('end', () => {
        try {
          resolve({ status: res.statusCode, data: JSON.parse(body) });
        } catch (e) {
          resolve({ status: res.statusCode, raw: body });
        }
      });
    });
    req.on('error', reject);
    if (data) req.write(JSON.stringify(data));
    req.end();
  });
}

async function runTests() {
  console.log('--- Starting Re-serve Backend Test Suite ---');
  let passed = 0;
  let failed = 0;

  async function test(name, fn) {
    try {
      await fn();
      console.log(`✅ PASS: ${name}`);
      passed++;
    } catch (e) {
      console.error(`❌ FAIL: ${name} ->`, e.message);
      failed++;
    }
  }

  // 1. Health check
  await test('GET /api/health returns ok', async () => {
    const res = await request({ hostname: 'localhost', port: 3000, path: '/api/health', method: 'GET' });
    if (res.status !== 200 || res.data.status !== 'ok') throw new Error(`Status ${res.status}`);
  });

  // 2. Impact stats
  await test('GET /api/impact/stats returns metrics', async () => {
    const res = await request({ hostname: 'localhost', port: 3000, path: '/api/impact/stats', method: 'GET' });
    if (res.status !== 200 || !res.data.success || !res.data.stats.mealsRescued) throw new Error('Missing impact data');
  });

  // 3. Platform stats
  await test('GET /api/stats returns general stats', async () => {
    const res = await request({ hostname: 'localhost', port: 3000, path: '/api/stats', method: 'GET' });
    if (res.status !== 200 || !res.data.totalMealsServed) throw new Error('Missing stats');
  });

  // 4. Listings discovery
  let sampleListingId = null;
  await test('GET /api/listings returns surplus listings', async () => {
    const res = await request({ hostname: 'localhost', port: 3000, path: '/api/listings', method: 'GET' });
    if (res.status !== 200 || !res.data.success || !Array.isArray(res.data.listings)) throw new Error('Listings failed');
    if (res.data.listings.length > 0) sampleListingId = res.data.listings[0].id;
  });

  // 5. Create listing
  let createdListingId = null;
  await test('POST /api/listings creates closing surplus item', async () => {
    const payload = {
      restaurantName: 'The French Toast Cafe',
      city: 'Kochi',
      title: 'Artisan Pastry Box (Evening Closing)',
      category: 'Bakery & Desserts',
      isVeg: true,
      isCampus: false,
      originalPrice: 320,
      rescuePrice: 89,
      quantity: 4,
      minutesRemaining: 40,
      fssaiConfirmed: true,
      autoNgoFallback: true,
      allergens: ['Dairy', 'Gluten']
    };
    const res = await request({
      hostname: 'localhost', port: 3000, path: '/api/listings', method: 'POST',
      headers: { 'Content-Type': 'application/json' }
    }, payload);
    if (res.status !== 201 || !res.data.success || !res.data.listing.id) throw new Error('Creation failed');
    createdListingId = res.data.listing.id;
  });

  // 6. Orders reservation
  let generatedOtp = null;
  await test('POST /api/orders/reserve creates reservation with OTP and QR token', async () => {
    const targetId = createdListingId || sampleListingId;
    const payload = {
      listingId: targetId,
      customerName: 'Test Beneficiary Harshit',
      customerPhone: '+91 98470 99999',
      paymentMethod: 'UPI (GPay)'
    };
    const res = await request({
      hostname: 'localhost', port: 3000, path: '/api/orders/reserve', method: 'POST',
      headers: { 'Content-Type': 'application/json' }
    }, payload);
    if (res.status !== 200 || !res.data.success || !res.data.order.pickupOtp) throw new Error('Reserve failed');
    generatedOtp = res.data.order.pickupOtp;
  });

  // 7. Merchant scanner verify
  await test('POST /api/verify/scan verifies OTP pass', async () => {
    const res = await request({
      hostname: 'localhost', port: 3000, path: '/api/verify/scan', method: 'POST',
      headers: { 'Content-Type': 'application/json' }
    }, { tokenOrOtp: generatedOtp });
    if (res.status !== 200 || !res.data.success || !res.data.valid) throw new Error('Scanner verification failed');
  });

  // 8. NGO alerts
  await test('GET /api/ngo/alerts returns fallback listings', async () => {
    const res = await request({ hostname: 'localhost', port: 3000, path: '/api/ngo/alerts', method: 'GET' });
    if (res.status !== 200 || !res.data.success || !Array.isArray(res.data.alerts)) throw new Error('NGO alerts failed');
  });

  // 9. Citizen micro-donation
  await test('POST /api/sponsor/meal processes ₹25 meal sponsorship', async () => {
    const res = await request({
      hostname: 'localhost', port: 3000, path: '/api/sponsor/meal', method: 'POST',
      headers: { 'Content-Type': 'application/json' }
    }, { amount: 50, donorName: 'Kind Supporter' });
    if (res.status !== 200 || !res.data.success || res.data.mealsCount !== 2) throw new Error('Sponsor failed');
  });

  // 10. GPS Tracking
  await test('GET /api/tracking/:orderId returns courier waypoint route', async () => {
    const res = await request({ hostname: 'localhost', port: 3000, path: '/api/tracking/RES-1234', method: 'GET' });
    if (res.status !== 200 || !res.data.volunteer || !res.data.volunteer.currentLocation) throw new Error('Tracking failed');
  });

  console.log(`\n--- Test Suite Summary: ${passed} Passed, ${failed} Failed ---`);
  if (failed > 0) process.exit(1);
}

runTests();