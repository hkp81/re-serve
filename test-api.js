// test-api.js - Automated API Suite for Re-serve
const http = require('http');

const BASE_URL = 'http://localhost:3000';

async function request(path, options = {}) {
  const url = `${BASE_URL}${path}`;
  const response = await fetch(url, {
    headers: { 'Content-Type': 'application/json', ...(options.headers || {}) },
    ...options
  });
  const data = await response.json();
  return { status: response.status, data };
}

async function runTests() {
  console.log('🧪 Running Re-serve Automated Test Suite...\n');
  let passed = 0;
  let failed = 0;

  function assert(condition, message) {
    if (condition) {
      console.log(`  ✅ PASS: ${message}`);
      passed++;
    } else {
      console.error(`  ❌ FAIL: ${message}`);
      failed++;
    }
  }

  try {
    // 1. Health Check
    const health = await request('/api/health');
    assert(health.status === 200 && health.data.status === 'ok', 'GET /api/health returns ok');

    // 2. Platform Stats
    const stats = await request('/api/stats');
    assert(stats.status === 200 && stats.data.totalKgSaved > 0, 'GET /api/stats returns impact numbers');

    // 3. Get Meals
    const meals = await request('/api/meals');
    assert(meals.status === 200 && Array.isArray(meals.data.data) && meals.data.data.length > 0, 'GET /api/meals returns list of surplus items');

    // 4. Create new Surplus Meal (Partner Dashboard)
    const newMealPayload = {
      title: "Automated Test Fresh Sandwiches",
      partnerName: "Campus Coffee & Deli",
      venueType: "Cafeteria",
      category: "Snacks",
      listingType: "sell",
      originalPrice: 200,
      discountPercent: 70,
      weightKg: 4.5,
      portions: 6,
      storageTemp: "4°C Chilled",
      condition: "Sealed in eco-boxes 30 mins ago",
      city: "Noida",
      expiryHours: 2.5
    };
    const createdMeal = await request('/api/meals', {
      method: 'POST',
      body: JSON.stringify(newMealPayload)
    });
    assert(createdMeal.status === 201 && createdMeal.data.data.price === 60, 'POST /api/meals lists item with 70% discount (200 -> 60)');

    const mealId = createdMeal.data.data.id;

    // 5. Reserve / Purchase Meal (Checkout Flow with Commission)
    const reservePayload = {
      mealId: mealId,
      customerName: "Priya Sharma",
      customerPhone: "+91 98765 12345",
      paymentMethod: "ONLINE_UPI",
      portionsReserved: 2
    };
    const reserveRes = await request('/api/reserve', {
      method: 'POST',
      body: JSON.stringify(reservePayload)
    });
    assert(reserveRes.status === 201, 'POST /api/reserve successfully reserves surplus meal');
    assert(reserveRes.data.order && reserveRes.data.order.otp.length === 6, 'Order includes 6-digit OTP for contactless dignity pickup');
    assert(reserveRes.data.order.platformFee > 0, 'Platform fee commission correctly charged on discounted sales');

    const orderId = reserveRes.data.order.id;
    const otp = reserveRes.data.order.otp;

    // 6. Verify Pickup with OTP/QR
    const verifyRes = await request('/api/verify-pickup', {
      method: 'POST',
      body: JSON.stringify({ orderId, otp })
    });
    assert(verifyRes.status === 200 && verifyRes.data.order.status === 'collected', 'POST /api/verify-pickup authenticates OTP and marks collected');

    // 7. Food Hero Leaderboard
    const heroes = await request('/api/leaderboards/heroes');
    assert(heroes.status === 200 && heroes.data.heroes[0].title.includes('Food Hero'), 'GET /api/leaderboards/heroes gives #1 donor the Food Hero title');

    // 8. Sponsor Hierarchy Leaderboard
    const sponsors = await request('/api/leaderboards/sponsors');
    assert(sponsors.status === 200 && sponsors.data.sponsors.length > 0, 'GET /api/leaderboards/sponsors returns sponsor rankings');

    // 9. Sponsor a Meal (Monetary donation)
    const sponsorRes = await request('/api/sponsor', {
      method: 'POST',
      body: JSON.stringify({
        name: "Test Generous Donor",
        role: "Community Sustainer",
        mealCount: 15,
        city: "Noida",
        district: "Gautam Buddha Nagar",
        state: "Uttar Pradesh",
        country: "India"
      })
    });
    assert(sponsorRes.status === 201 && sponsorRes.data.sponsor.mealsSponsored === 15, 'POST /api/sponsor records monetary meal contribution');

    // 10. Live Delivery/Volunteer Tracking Simulation
    const trackingRes = await request(`/api/tracking/${orderId}`);
    assert(trackingRes.status === 200 && trackingRes.data.volunteer && trackingRes.data.volunteer.currentLocation.lat, 'GET /api/tracking/:orderId returns live GPS coordinates and route status');

  } catch (err) {
    console.error('Unexpected error in test runner:', err);
    failed++;
  }

  console.log(`\n======================================================`);
  console.log(`  Tests Passed: ${passed} | Tests Failed: ${failed}`);
  console.log(`======================================================\n`);

  if (failed > 0) {
    process.exit(1);
  } else {
    process.exit(0);
  }
}

runTests();
