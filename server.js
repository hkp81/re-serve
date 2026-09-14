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
    return { meals: [], heroes: [], sponsors: [], volunteers: [], orders: [], stats: {} };
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

// --- API ENDPOINTS ---

// Health check
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', platform: 'Re-serve', tagline: 'Serving Again', timestamp: new Date().toISOString() });
});

// Platform Stats
app.get('/api/stats', (req, res) => {
  const db = readDB();
  res.json(db.stats || {});
});

// Get meals with query filters
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
      m.partnerName.toLowerCase().includes(q) ||
      (m.location && m.location.city.toLowerCase().includes(q))
    );
  }

  res.json({ total: results.length, data: results });
});

// Get specific meal
app.get('/api/meals/:id', (req, res) => {
  const db = readDB();
  const meal = (db.meals || []).find(m => m.id === req.params.id);
  if (!meal) {
    return res.status(404).json({ error: 'Meal not found' });
  }
  res.json(meal);
});

// Create new surplus listing (Partner upload)
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
    return res.status(400).json({ error: 'Missing required fields: title, partnerName, venueType' });
  }

  const origPriceNum = parseFloat(originalPrice) || 0;
  const discPercentNum = listingType === 'donate' ? 100 : (parseFloat(discountPercent) || 60);
  const calculatedPrice = listingType === 'donate' ? 0 : Math.round(origPriceNum * (1 - discPercentNum / 100));
  const weightNum = parseFloat(weightKg) || 5.0;
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
    platformCommissionRate: listingType === 'donate' ? 0 : 0.08, // 8% commission on sales
    weightKg: weightNum,
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
      lat: 28.6280 + (Math.random() - 0.5) * 0.04,
      lng: 77.3649 + (Math.random() - 0.5) * 0.04
    },
    tags: [
      listingType === 'donate' ? 'Donation ₹0' : (discPercentNum + '% Off'),
      venueType,
      storageTemp ? storageTemp.split(' ')[0] : 'Fresh'
    ],
    image: req.body.image || 'https://images.unsplash.com/photo-1546069901-ba9599a7e63c?w=600&auto=format&fit=crop&q=80'
  };

  db.meals.unshift(newMeal);
  writeDB(db);

  res.status(201).json({ success: true, message: 'Surplus meal listed successfully', data: newMeal });
});

// Reserve / Buy surplus meal or Claim free donation
app.post('/api/reserve', (req, res) => {
  const db = readDB();
  const { mealId, customerName, customerPhone, paymentMethod, portionsReserved } = req.body;

  const meal = (db.meals || []).find(m => m.id === mealId);
  if (!meal) {
    return res.status(404).json({ error: 'Meal listing not found' });
  }

  if (meal.status !== 'available') {
    return res.status(400).json({ error: 'Meal is no longer available (already ' + meal.status + ')' });
  }

  const portions = parseInt(portionsReserved, 10) || 1;
  const isDonation = meal.listingType === 'donate';
  const itemTotal = isDonation ? 0 : meal.price * portions;
  
  // Platform commission (8% on discounted food sales, 0% on humanitarian donations)
  const platformFee = isDonation ? 0 : Math.round(itemTotal * (meal.platformCommissionRate || 0.08));
  const totalPayable = itemTotal + platformFee;

  // Generate OTP (6 digits) and QR Token
  const otp = Math.floor(100000 + Math.random() * 900000).toString();
  const orderId = 'ORD-' + Math.floor(1000 + Math.random() * 9000);
  const qrToken = 'RESERVE-' + orderId + '-TOKEN-' + Math.random().toString(36).substring(2, 9).toUpperCase();

  // Assign volunteer for delivery/claim if needed
  const volunteer = (db.volunteers || [])[0] || null;

  const order = {
    id: orderId,
    mealId: meal.id,
    mealTitle: meal.title,
    partnerName: meal.partnerName,
    customerName: customerName || (isDonation ? 'Volunteer Community Care' : 'Conscious Diner'),
    customerPhone: customerPhone || '+91 99000 11222',
    portions,
    weightKg: Math.round((meal.weightKg * (portions / (meal.portions || portions))) * 10) / 10,
    itemTotal,
    platformFee,
    totalPayable,
    isDonation,
    paymentMethod: isDonation ? 'FREE_SDG_CLAIM' : (paymentMethod || 'ONLINE_UPI'),
    paymentStatus: isDonation ? 'FREE' : (paymentMethod === 'COD' ? 'PAY_ON_COLLECTION' : 'PAID_ONLINE'),
    otp,
    qrToken,
    status: 'reserved',
    volunteerId: volunteer ? volunteer.id : null,
    createdAt: new Date().toISOString()
  };

  // Update meal status
  meal.status = 'reserved';

  if (!db.orders) db.orders = [];
  db.orders.unshift(order);

  // Update statistics
  if (db.stats) {
    db.stats.totalMealsServed += portions;
    db.stats.totalKgSaved += order.weightKg;
    db.stats.co2PreventedKg += Math.round(order.weightKg * 2.5 * 10) / 10;
    if (isDonation) {
      db.stats.peopleFed += portions;
    }
  }

  writeDB(db);

  res.status(201).json({
    success: true,
    message: isDonation ? 'Free donation claimed with dignity!' : 'Surplus meal reserved successfully!',
    order
  });
});

// Verify Pickup via QR Code or OTP (Contactless dignity collection)
app.post('/api/verify-pickup', (req, res) => {
  const db = readDB();
  const { otp, qrToken, orderId } = req.body;

  if (!otp && !qrToken && !orderId) {
    return res.status(400).json({ error: 'Please provide either OTP, QR Token, or Order ID' });
  }

  const order = (db.orders || []).find(o =>
    (orderId && o.id.toUpperCase() === orderId.toUpperCase()) ||
    (otp && o.otp === otp.trim()) ||
    (qrToken && o.qrToken === qrToken.trim())
  );

  if (!order) {
    return res.status(404).json({ error: 'No matching order found with the provided credentials' });
  }

  if (order.status === 'collected') {
    return res.status(400).json({ error: 'Order has already been verified and collected', order });
  }

  order.status = 'collected';
  order.collectedAt = new Date().toISOString();

  // Also update corresponding meal status
  const meal = (db.meals || []).find(m => m.id === order.mealId);
  if (meal) {
    meal.status = 'collected';
  }

  writeDB(db);

  res.json({
    success: true,
    message: 'Pickup verified with dignity! Food handed over safely.',
    order
  });
});

// Leaderboard: Food Heroes (Donated highest meal by weight, meals, people fed)
app.get('/api/leaderboards/heroes', (req, res) => {
  const db = readDB();
  let heroes = [...(db.heroes || [])];
  heroes.sort((a, b) => b.totalWeightKg - a.totalWeightKg);
  // Ensure top hero has the official title "Food Hero"
  if (heroes.length > 0) {
    heroes[0].title = 'Food Hero 🌟';
  }
  res.json({ total: heroes.length, heroes });
});

// Leaderboard: Hierarchical Meal Sponsors (City -> District -> State -> Country)
app.get('/api/leaderboards/sponsors', (req, res) => {
  const db = readDB();
  const level = (req.query.level || 'all').toLowerCase();
  let sponsors = [...(db.sponsors || [])];

  sponsors.sort((a, b) => b.mealsSponsored - a.mealsSponsored);

  if (level !== 'all') {
    sponsors = sponsors.filter(s => s.tier && s.tier.toLowerCase().includes(level));
  }

  res.json({
    level,
    total: sponsors.length,
    sponsors
  });
});

// Sponsor a meal (Monetary donation to feed hungry citizens)
app.post('/api/sponsor', (req, res) => {
  const db = readDB();
  const { name, role, mealCount, city, district, state, country, amount } = req.body;

  const count = parseInt(mealCount, 10) || 10;
  const costPerMeal = 30; // ₹30 per subsidized meal
  const totalAmount = parseFloat(amount) || (count * costPerMeal);

  const newSponsor = {
    id: 'sp-' + Date.now().toString(36),
    name: name || 'Anonymous Sustainer',
    role: role || 'Community Benefactor',
    mealsSponsored: count,
    amountDonated: totalAmount,
    city: city || 'Noida',
    district: district || 'Gautam Buddha Nagar',
    state: state || 'Uttar Pradesh',
    country: country || 'India',
    rank: (db.sponsors || []).length + 1,
    tier: count >= 500 ? 'Country Tier' : (count >= 200 ? 'State Tier' : (count >= 50 ? 'District Tier' : 'City Tier')),
    badge: count >= 500 ? 'National Sustainer 🇮🇳' : 'Community Hero',
    avatar: 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=150&auto=format&fit=crop&q=80'
  };

  if (!db.sponsors) db.sponsors = [];
  db.sponsors.push(newSponsor);

  if (db.stats) {
    db.stats.peopleFed += count;
    db.stats.totalMealsServed += count;
  }

  writeDB(db);

  res.status(201).json({
    success: true,
    message: 'Thank you! You have sponsored ' + count + ' wholesome meals for people in need.',
    sponsor: newSponsor
  });
});

// Live Delivery / Volunteer GPS Simulator tracking
app.get('/api/tracking/:orderId', (req, res) => {
  const db = readDB();
  const orderId = req.params.orderId;
  const order = (db.orders || []).find(o => o.id === orderId) || (db.orders || [])[0];

  const volunteer = (db.volunteers || [])[0] || {
    id: 'vol-sim',
    name: 'Ravi Teja',
    phone: '+91 98888 12345',
    vehicle: 'Electric Cargo Scooter',
    rating: 4.9
  };

  // Step-by-step route
  const elapsedMinutes = Math.floor((Date.now() / 1000 / 10) % 6);
  const routePoints = [
    { step: 0, lat: 28.6250, lng: 77.3600, status: 'Volunteer Dispatched', eta: '12 mins' },
    { step: 1, lat: 28.6265, lng: 77.3620, status: 'Heading to Kitchen', eta: '8 mins' },
    { step: 2, lat: 28.6280, lng: 77.3649, status: 'Arrived at Food Partner Outlet', eta: '5 mins' },
    { step: 3, lat: 28.6295, lng: 77.3670, status: 'Food Inspected & Collected Safely', eta: '4 mins' },
    { step: 4, lat: 28.6320, lng: 77.3690, status: 'En Route to Community Distribution', eta: '2 mins' },
    { step: 5, lat: 28.6340, lng: 77.3710, status: 'Reached Distribution Spot', eta: 'Arrived' }
  ];

  const currentPoint = routePoints[elapsedMinutes] || routePoints[0];

  res.json({
    orderId: order ? order.id : orderId,
    volunteer: {
      ...volunteer,
      currentLocation: { lat: currentPoint.lat, lng: currentPoint.lng },
      currentStatusText: currentPoint.status,
      eta: currentPoint.eta
    },
    pickupLocation: {
      name: order ? order.partnerName : 'Grand Heritage Hostel Mess',
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

// Start Server
app.listen(PORT, () => {
  console.log('======================================================');
  console.log('  Re-serve (Serving Again) Platform Online            ');
  console.log('  Server URL: http://localhost:' + PORT);
  console.log('  SDG 2 (Zero Hunger) & SDG 12 (Responsible Waste)    ');
  console.log('======================================================');
});
