const express = require('express');
const cors = require('cors');
const path = require('path');
const fs = require('fs');

const app = express();
const PORT = process.env.PORT || 3000;
const DB_FILE = path.join(__dirname, 'db.json');

app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Serve static assets from public folder
app.use(express.static(path.join(__dirname, 'public')));

// Helper to read database
function readDB() {
  try {
    const data = fs.readFileSync(DB_FILE, 'utf8');
    return JSON.parse(data);
  } catch (err) {
    console.error('Error reading db.json:', err);
    return { meals: [], listings: [], ngoAlerts: [], orders: [], stats: {}, impact: {}, heroes: [], sponsors: [] };
  }
}

// Helper to write database
function writeDB(data) {
  try {
    fs.writeFileSync(DB_FILE, JSON.stringify(data, null, 2), 'utf8');
    return true;
  } catch (err) {
    console.error('Error writing db.json:', err);
    return false;
  }
}

// ----------------------------------------------------
// 1. HEALTH & METRICS
// ----------------------------------------------------
app.get('/api/health', (req, res) => {
  res.json({
    status: 'ok',
    platform: 'Re-serve',
    tagline: 'Serving Again',
    timestamp: new Date().toISOString()
  });
});

app.get('/api/stats', (req, res) => {
  const db = readDB();
  res.json(db.stats || {});
});

app.get('/api/impact/stats', (req, res) => {
  const db = readDB();
  const impact = db.impact || {
    mealsRescued: 94825,
    donatedMealsCount: 34820,
    carbonOffsetKg: 237062,
    partnerCount: 512,
    activeVolunteers: 184
  };
  res.json({ success: true, stats: impact });
});

// ----------------------------------------------------
// 2. DISCOVERY & MEAL LISTINGS
// ----------------------------------------------------
app.get('/api/listings', (req, res) => {
  const db = readDB();
  let list = db.listings || [];
  const { donated, veg, campus, maxPrice, search, city } = req.query;

  if (donated === 'true') {
    list = list.filter(item => item.isDonation === true || item.rescuePrice === 0);
  }
  if (veg === 'true') {
    list = list.filter(item => item.isVeg === true);
  }
  if (campus === 'true') {
    list = list.filter(item => item.isCampus === true);
  }
  if (maxPrice !== undefined && maxPrice !== null && maxPrice !== '') {
    const p = parseFloat(maxPrice);
    list = list.filter(item => item.rescuePrice <= p);
  }
  if (city && city !== 'all') {
    list = list.filter(item => item.city && item.city.toLowerCase() === city.toLowerCase());
  }
  if (search && search.trim()) {
    const q = search.trim().toLowerCase();
    list = list.filter(item => 
      item.title.toLowerCase().includes(q) ||
      (item.restaurantName && item.restaurantName.toLowerCase().includes(q)) ||
      (item.category && item.category.toLowerCase().includes(q))
    );
  }

  res.json({ success: true, count: list.length, listings: list });
});

// GET /api/meals (Filtered catalog)
app.get('/api/meals', (req, res) => {
  const db = readDB();
  let results = db.meals || [];
  const { type, venue, category, search } = req.query;

  if (type && type !== 'all') {
    results = results.filter(m => m.listingType === type);
  }
  if (venue && venue !== 'all') {
    results = results.filter(m => m.venueType.toLowerCase() === venue.toLowerCase());
  }
  if (category && category !== 'all') {
    results = results.filter(m => m.category.toLowerCase() === category.toLowerCase());
  }
  if (search) {
    const q = search.toLowerCase();
    results = results.filter(m => 
      m.title.toLowerCase().includes(q) || 
      (m.partnerName && m.partnerName.toLowerCase().includes(q)) ||
      (m.location && m.location.city.toLowerCase().includes(q))
    );
  }
  res.json(results);
});

// GET /api/meals/:id
app.get('/api/meals/:id', (req, res) => {
  const db = readDB();
  const meal = (db.meals || []).find(m => m.id === req.params.id) || (db.listings || []).find(l => l.id === req.params.id);
  if (!meal) return res.status(404).json({ error: 'Meal not found' });
  res.json(meal);
});

// POST /api/listings (Used by partner-dashboard.js)
app.post('/api/listings', (req, res) => {
  const db = readDB();
  const {
    restaurantName,
    city,
    title,
    category,
    isVeg,
    isCampus,
    originalPrice,
    rescuePrice,
    quantity,
    minutesRemaining,
    fssaiConfirmed,
    autoNgoFallback,
    allergens
  } = req.body;

  if (!title || originalPrice === undefined || rescuePrice === undefined || !quantity) {
    return res.status(400).json({ success: false, error: 'Missing mandatory fields' });
  }

  const isDonation = Number(rescuePrice) === 0;
  const newId = 'listing-' + Date.now();
  const origPriceNum = Number(originalPrice);
  const rescuePriceNum = Number(rescuePrice);
  const qtyNum = Number(quantity);
  const discountPercent = isDonation ? 100 : Math.round(((origPriceNum - rescuePriceNum) / origPriceNum) * 100);

  const newListing = {
    id: newId,
    restaurantName: restaurantName || 'Pandhal Cake Shop',
    title,
    description: isVeg ? 'Fresh pure vegetarian pack, hygienic sealed container.' : 'Fresh restaurant meal, sealed in food-grade packaging.',
    category: category || 'Meals',
    city: city || 'Kochi',
    isVeg: !!isVeg,
    isCampus: !!isCampus,
    isDonation,
    originalPrice: origPriceNum,
    rescuePrice: rescuePriceNum,
    discountPercent,
    availableQuantity: qtyNum,
    totalQuantity: qtyNum,
    minutesRemaining: minutesRemaining || 45,
    distance: '0.8 km away',
    safetyBadge: fssaiConfirmed ? 'FSSAI Certified Safe (2019 Protocol)' : 'Kitchen Fresh Verified',
    allergens: allergens || (isVeg ? ['Dairy', 'Gluten'] : ['Spices', 'Gluten']),
    image: isVeg ? 'https://images.unsplash.com/photo-1546833999-b9f581a1996d?w=600&auto=format&fit=crop&q=80' : 'https://images.unsplash.com/photo-1563379091339-03b21ab4a4f8?w=600&auto=format&fit=crop&q=80',
    status: 'available',
    autoNgoFallback: !!autoNgoFallback,
    createdAt: new Date().toISOString()
  };

  db.listings = db.listings || [];
  db.listings.unshift(newListing);

  // Sync with meals array
  const newMeal = {
    id: newId,
    title: newListing.title,
    partnerName: newListing.restaurantName,
    venueType: category || 'Restaurant',
    category: newListing.category,
    listingType: isDonation ? 'donate' : 'sell',
    originalPrice: origPriceNum,
    discountPercent,
    price: rescuePriceNum,
    platformCommissionRate: isDonation ? 0 : 0.08,
    weightKg: Math.round(qtyNum * 0.8 * 10) / 10,
    portions: qtyNum,
    storageTemp: '65°C (Steam Safe Hold)',
    condition: 'Freshly prepared surplus. Tested and safe for consumption.',
    isSafetyVerified: true,
    verificationBadge: newListing.safetyBadge,
    preparedAt: new Date().toISOString(),
    expiresAt: new Date(Date.now() + 3 * 3600 * 1000).toISOString(),
    status: 'available',
    location: {
      address: newListing.city + ' Central Outlet',
      city: newListing.city,
      district: newListing.city,
      state: 'Kerala',
      lat: 9.9312,
      lng: 76.2673
    },
    tags: isVeg ? ['Vegetarian', 'Closing Special'] : ['Non-Vegetarian', 'Closing Special'],
    image: newListing.image
  };
  db.meals = db.meals || [];
  db.meals.unshift(newMeal);

  // If auto NGO fallback or 0 price, also register in NGO alerts
  if (isDonation || autoNgoFallback) {
    db.ngoAlerts = db.ngoAlerts || [];
    db.ngoAlerts.unshift({
      id: 'alert-' + Date.now(),
      listingId: newId,
      restaurantName: newListing.restaurantName,
      itemsDescription: `${newListing.availableQuantity} packs of ${newListing.title}`,
      totalUnits: newListing.availableQuantity,
      totalWeightKg: Math.round(newListing.availableQuantity * 0.8 * 10) / 10,
      address: newListing.city + ' Central Outlet',
      city: newListing.city,
      minutesRemaining: newListing.minutesRemaining,
      status: isDonation ? 'active_donation' : 'urgent_fallback',
      otp: Math.floor(100000 + Math.random() * 900000).toString()
    });
  }

  writeDB(db);
  res.status(201).json({ success: true, listing: newListing, meal: newMeal });
});

// POST /api/meals (Legacy endpoint)
app.post('/api/meals', (req, res) => {
  const db = readDB();
  const {
    title,
    partnerName,
    venueType,
    category,
    listingType,
    originalPrice,
    discountPercent,
    weightKg,
    portions,
    storageTemp,
    condition,
    city,
    address,
    expiryHours
  } = req.body;

  if (!title || !partnerName || !venueType) {
    return res.status(400).json({ error: 'Missing mandatory fields: title, partnerName, venueType' });
  }

  const origPriceNum = parseFloat(originalPrice) || 0;
  const discPercentNum = parseFloat(discountPercent) || (listingType === 'donate' ? 100 : 60);
  const calculatedPrice = listingType === 'donate' ? 0 : Math.round(origPriceNum * (1 - discPercentNum / 100));
  const portionsNum = parseInt(portions, 10) || 5;
  const hours = parseFloat(expiryHours) || 3.0;
  const now = new Date();
  const expiresAt = new Date(now.getTime() + hours * 3600 * 1000).toISOString();

  const newMeal = {
    id: 'meal-' + Date.now().toString(36) + Math.random().toString(36).substr(2, 4),
    title,
    partnerName,
    venueType,
    category: category || 'Meals',
    listingType: listingType || 'sell',
    originalPrice: origPriceNum,
    discountPercent: discPercentNum,
    price: calculatedPrice,
    platformCommissionRate: listingType === 'donate' ? 0 : 0.08,
    weightKg: parseFloat(weightKg) || (portionsNum * 0.8),
    portions: portionsNum,
    storageTemp: storageTemp || '65°C (Steam Safe Hold)',
    condition: condition || 'Freshly prepared surplus. Tested and safe for consumption.',
    isSafetyVerified: true,
    verificationBadge: 'FSSAI Safety Verified Protocol',
    preparedAt: now.toISOString(),
    expiresAt,
    status: 'available',
    location: {
      address: address || 'Main High Street Campus',
      city: city || 'Noida',
      district: 'Gautam Buddha Nagar',
      state: 'Uttar Pradesh',
      lat: 28.6280,
      lng: 77.3649
    },
    tags: [
      category || 'Meals',
      listingType === 'donate' ? 'Donation ₹0' : `${discPercentNum}% Off`,
      'Verified Safe'
    ],
    image: 'https://images.unsplash.com/photo-1546833999-b9f581a1996d?w=600&auto=format&fit=crop&q=80'
  };

  db.meals = db.meals || [];
  db.meals.unshift(newMeal);

  // Sync with listings
  db.listings = db.listings || [];
  db.listings.unshift({
    id: newMeal.id,
    restaurantName: newMeal.partnerName,
    title: newMeal.title,
    description: newMeal.condition,
    category: newMeal.category,
    city: newMeal.location.city,
    isVeg: true,
    isCampus: newMeal.venueType.toLowerCase().includes('hostel'),
    isDonation: newMeal.listingType === 'donate',
    originalPrice: newMeal.originalPrice,
    rescuePrice: newMeal.price,
    discountPercent: newMeal.discountPercent,
    availableQuantity: newMeal.portions,
    totalQuantity: newMeal.portions,
    minutesRemaining: Math.round(hours * 60),
    distance: '1.2 km away',
    safetyBadge: newMeal.verificationBadge,
    allergens: ['Dairy', 'Gluten'],
    image: newMeal.image,
    status: 'available'
  });

  writeDB(db);
  res.status(201).json(newMeal);
});

// ----------------------------------------------------
// 3. ORDERS & RESERVATIONS
// ----------------------------------------------------
// POST /api/orders/reserve (Used by checkout.js)
app.post('/api/orders/reserve', (req, res) => {
  const db = readDB();
  const { listingId, customerName, customerPhone, paymentMethod } = req.body;

  const listing = (db.listings || []).find(l => l.id === listingId);
  if (!listing) {
    return res.status(404).json({ success: false, error: 'Listing not found' });
  }

  if (listing.availableQuantity <= 0) {
    return res.status(400).json({ success: false, error: 'Item sold out or already claimed' });
  }

  listing.availableQuantity -= 1;
  const isDonation = listing.rescuePrice === 0 || listing.isDonation === true;
  const platformFee = isDonation ? 0 : 5;
  const tip = isDonation ? 0 : 2;
  const totalAmount = isDonation ? 0 : (listing.rescuePrice + platformFee + tip);

  const pickupOtp = Math.floor(100000 + Math.random() * 900000).toString();
  const orderId = 'RES-' + Math.floor(1000 + Math.random() * 9000);

  const order = {
    id: orderId,
    orderId,
    listingId: listing.id,
    title: listing.title,
    restaurantName: listing.restaurantName,
    city: listing.city,
    customerName: customerName || 'Community Beneficiary',
    customerPhone: customerPhone || '+91 98470 12345',
    itemPrice: listing.rescuePrice,
    platformFee,
    tip,
    totalAmount,
    paymentMethod: paymentMethod || (isDonation ? 'Free Community Relief (₹0)' : 'UPI Instant App'),
    pickupOtp,
    qrToken: 'QR-RESERVE-' + orderId + '-' + pickupOtp,
    status: 'reserved',
    pickupExpiresAt: new Date(Date.now() + 45 * 60 * 1000).toISOString(),
    createdAt: new Date().toISOString()
  };

  db.orders = db.orders || [];
  db.orders.unshift(order);

  // Update impact stats
  if (db.impact) {
    db.impact.mealsRescued += 1;
    if (isDonation) db.impact.donatedMealsCount += 1;
    db.impact.carbonOffsetKg += 2.5;
  }
  if (db.stats) {
    db.stats.totalMealsServed = (db.stats.totalMealsServed || 18450) + 1;
    db.stats.totalKgSaved = Math.round(((db.stats.totalKgSaved || 5420.5) + 0.8) * 10) / 10;
  }

  writeDB(db);
  res.json({ success: true, order });
});

// POST /api/reserve (Legacy endpoint)
app.post('/api/reserve', (req, res) => {
  const db = readDB();
  const { mealId, quantity, buyerName, buyerPhone, paymentMethod } = req.body;
  const qty = parseInt(quantity, 10) || 1;
  const meal = (db.meals || []).find(m => m.id === mealId);

  if (!meal) {
    return res.status(404).json({ error: 'Meal not found' });
  }
  if (meal.portions < qty) {
    return res.status(400).json({ error: 'Requested quantity exceeds available portions' });
  }

  meal.portions -= qty;
  const isDonation = meal.listingType === 'donate' || meal.price === 0;
  const commissionRate = isDonation ? 0 : (meal.platformCommissionRate || 0.08);
  const subtotal = meal.price * qty;
  const platformFee = Math.round(subtotal * commissionRate);
  const totalPayable = subtotal + (isDonation ? 0 : platformFee);
  const pickupOtp = Math.floor(100000 + Math.random() * 900000).toString();
  const orderId = 'ORD-' + Date.now();

  const newOrder = {
    id: orderId,
    orderId,
    mealId: meal.id,
    mealTitle: meal.title,
    title: meal.title,
    partnerName: meal.partnerName,
    restaurantName: meal.partnerName,
    buyerName: buyerName || 'Guest User',
    customerName: buyerName || 'Guest User',
    buyerPhone: buyerPhone || 'N/A',
    quantity: qty,
    unitPrice: meal.price,
    subtotal,
    platformFee,
    totalPayable,
    totalAmount: totalPayable,
    paymentMethod: paymentMethod || 'UPI',
    pickupOtp,
    qrToken: 'QR-' + orderId + '-' + pickupOtp,
    status: 'reserved',
    createdAt: new Date().toISOString()
  };

  db.orders = db.orders || [];
  db.orders.unshift(newOrder);

  if (db.stats) {
    db.stats.totalMealsServed = (db.stats.totalMealsServed || 18450) + qty;
  }

  writeDB(db);
  res.status(201).json({ success: true, order: newOrder });
});

// GET /api/orders
app.get('/api/orders', (req, res) => {
  const db = readDB();
  res.json(db.orders || []);
});

// ----------------------------------------------------
// 4. MERCHANT SCANNER & QR/OTP VERIFICATION
// ----------------------------------------------------
// POST /api/verify/scan (Used by scanner-simulator.js)
app.post('/api/verify/scan', (req, res) => {
  const db = readDB();
  const { tokenOrOtp } = req.body;

  if (!tokenOrOtp) {
    return res.status(400).json({ success: false, error: 'Token or OTP required' });
  }

  const clean = tokenOrOtp.toString().trim();

  // 1. Check in orders
  const order = (db.orders || []).find(o => 
    (o.pickupOtp && o.pickupOtp.toString() === clean) || 
    (o.qrToken && o.qrToken.toString() === clean) ||
    (o.id && o.id.toString() === clean) ||
    (o.orderId && o.orderId.toString() === clean)
  );

  if (order) {
    order.status = 'collected';
    order.collectedAt = new Date().toISOString();
    writeDB(db);
    return res.json({
      success: true,
      valid: true,
      order: {
        id: order.id || order.orderId,
        title: order.title || order.mealTitle,
        customerName: order.customerName || order.buyerName,
        collectedAt: order.collectedAt
      }
    });
  }

  // 2. Check in NGO alerts
  const alert = (db.ngoAlerts || []).find(a => a.otp && a.otp.toString() === clean);
  if (alert) {
    alert.status = 'collected';
    alert.collectedAt = new Date().toISOString();
    writeDB(db);
    return res.json({
      success: true,
      valid: true,
      order: {
        id: alert.id,
        title: alert.itemsDescription,
        customerName: alert.volunteerName || 'Robin Hood Army Volunteer',
        collectedAt: alert.collectedAt
      }
    });
  }

  // 3. Fallback test code support
  if (clean === '749201') {
    return res.json({
      success: true,
      valid: true,
      order: {
        id: 'DEMO-749201',
        title: 'Artisan Bakery Surprise Bag & Dum Biryani Box',
        customerName: 'Verified Beneficiary Aryan V.',
        collectedAt: new Date().toISOString()
      }
    });
  }

  return res.json({
    success: true,
    valid: false,
    message: 'Invalid OTP or Pass Token. Not found in active ledger.'
  });
});

// POST /api/verify-pickup (Legacy endpoint)
app.post('/api/verify-pickup', (req, res) => {
  const db = readDB();
  const { orderId, pickupOtp } = req.body;
  const order = (db.orders || []).find(o => o.orderId === orderId || o.id === orderId);

  if (!order) {
    return res.status(404).json({ verified: false, error: 'Order not found' });
  }
  if (order.pickupOtp.toString() !== pickupOtp.toString()) {
    return res.status(400).json({ verified: false, error: 'Invalid verification OTP' });
  }

  order.status = 'collected';
  order.verifiedAt = new Date().toISOString();
  order.collectedAt = order.verifiedAt;
  writeDB(db);
  res.json({ verified: true, message: 'Pickup confirmed! Food handed over with dignity.', order });
});

// ----------------------------------------------------
// 5. NGO RESCUE ENDPOINTS
// ----------------------------------------------------
// GET /api/ngo/alerts & GET /api/ngo-alerts
app.get(['/api/ngo/alerts', '/api/ngo-alerts', '/api/donations'], (req, res) => {
  const db = readDB();
  res.json({ success: true, alerts: db.ngoAlerts || [] });
});

// POST /api/ngo/claim
app.post('/api/ngo/claim', (req, res) => {
  const db = readDB();
  const { alertId, ngoName, volunteerName } = req.body;
  const alert = (db.ngoAlerts || []).find(a => a.id === alertId);

  if (!alert) {
    return res.status(404).json({ success: false, error: 'Alert not found' });
  }

  alert.status = 'claimed';
  alert.claimedByNgo = ngoName || 'Robin Hood Army (Kerala Unit)';
  alert.volunteerName = volunteerName || 'Volunteer Rahul S.';
  alert.claimedAt = new Date().toISOString();

  if (db.impact) {
    db.impact.donatedMealsCount = (db.impact.donatedMealsCount || 34820) + (alert.totalUnits || 5);
  }

  writeDB(db);
  res.json({ success: true, alert });
});

// ----------------------------------------------------
// 6. SPONSOR A MEAL (Citizen Micro-donations)
// ----------------------------------------------------
app.post('/api/sponsor/meal', (req, res) => {
  const db = readDB();
  const { amount, donorName } = req.body;
  const donationAmount = parseFloat(amount) || 25;
  const mealsCount = Math.max(1, Math.floor(donationAmount / 25));

  db.impact = db.impact || {};
  db.impact.mealsRescued = (db.impact.mealsRescued || 94825) + mealsCount;
  db.impact.donatedMealsCount = (db.impact.donatedMealsCount || 34820) + mealsCount;

  // Append sponsor entry
  db.sponsors = db.sponsors || [];
  db.sponsors.unshift({
    id: 'sp-' + Date.now(),
    name: donorName || 'Kind Patron',
    tier: donationAmount >= 500 ? 'State Champion' : 'Civic Sponsor',
    amount: donationAmount,
    mealsSponsored: mealsCount,
    sponsoredAt: new Date().toISOString()
  });

  writeDB(db);
  res.json({
    success: true,
    amount: donationAmount,
    mealsCount,
    message: `Successfully sponsored ${mealsCount} meals!`
  });
});

// POST /api/sponsor (Legacy endpoint)
app.post('/api/sponsor', (req, res) => {
  const db = readDB();
  const { donorName, tier, amount, mealTargetCount, city } = req.body;
  const amt = parseFloat(amount) || 500;
  const mealsSponsored = mealTargetCount || Math.floor(amt / 25);

  const sponsorRecord = {
    id: 'sp-' + Date.now(),
    name: donorName || 'Kind Patron',
    tier: tier || 'City Contributor',
    amount: amt,
    mealsSponsored,
    city: city || 'Kochi',
    sponsoredAt: new Date().toISOString()
  };

  db.sponsors = db.sponsors || [];
  db.sponsors.unshift(sponsorRecord);
  writeDB(db);
  res.status(201).json({ success: true, sponsor: sponsorRecord });
});

// ----------------------------------------------------
// 7. LEADERBOARDS & VOLUNTEER RADAR TRACKING
// ----------------------------------------------------
app.get('/api/leaderboards/heroes', (req, res) => {
  const db = readDB();
  res.json(db.heroes || [
    { rank: 1, name: 'Grand Heritage Mess', mealsRescued: 3420, kgSaved: 1200, badge: 'Grand Master Rescuer' },
    { rank: 2, name: 'Pandhal Cake Shop', mealsRescued: 2180, kgSaved: 850, badge: 'Bakery Champion' },
    { rank: 3, name: 'Paragon Restaurant', mealsRescued: 1940, kgSaved: 790, badge: 'Community Guardian' }
  ]);
});

app.get('/api/leaderboards/sponsors', (req, res) => {
  const db = readDB();
  res.json(db.sponsors || []);
});

app.get('/api/tracking/:orderId', (req, res) => {
  const orderId = req.params.orderId;
  const elapsedMinutes = (Math.floor(Date.now() / 10000)) % 5;
  const routePoints = [
    { step: 1, lat: 28.6280, lng: 77.3649, status: 'At Pickup Kitchen', eta: '10 mins' },
    { step: 2, lat: 28.6295, lng: 77.3665, status: 'Package Loaded & Insulated', eta: '8 mins' },
    { step: 3, lat: 28.6310, lng: 77.3678, status: 'Transit via Sector 62 Link', eta: '5 mins' },
    { step: 4, lat: 28.6320, lng: 77.3690, status: 'En Route to Community Distribution', eta: '2 mins' },
    { step: 5, lat: 28.6340, lng: 77.3710, status: 'Reached Distribution Spot', eta: 'Arrived' }
  ];
  const currentPoint = routePoints[elapsedMinutes] || routePoints[0];

  res.json({
    orderId,
    volunteer: {
      name: 'Rahul Verma',
      badge: 'Gold Rescue Courier',
      phone: '+91 98112 34567',
      vehicle: 'Electric Cargo Scooter',
      currentLocation: { lat: currentPoint.lat, lng: currentPoint.lng },
      currentStatusText: currentPoint.status,
      eta: currentPoint.eta
    },
    pickupLocation: {
      name: 'Grand Heritage Hostel Mess',
      lat: 28.6280,
      lng: 77.3649
    },
    deliveryLocation: {
      name: 'Asha Community Feeding Shelter',
      lat: 28.6340,
      lng: 77.3710
    },
    allWaypoints: routePoints
  });
});

// Fallback: serve index.html for unknown client-side routes
app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

// Start Server
app.listen(PORT, () => {
  console.log(`======================================================`);
  console.log(`  🍱 Re-serve (Serving Again) Platform Online        `);
  console.log(`  🌐 Server URL: http://localhost:${PORT}             `);
  console.log(`  🌱 SDG 2 (Zero Hunger) & SDG 12 (Responsible Waste)  `);
  console.log(`======================================================`);
});