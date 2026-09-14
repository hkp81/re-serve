# Re-serve (Serving Again) — Research, Architecture & SDG Impact

## 1. Hackathon Problem Statement & SDG Alignment
**Statement:** Sustainable and Resource Usage  
**Global Goals:**
- **UN SDG 2: Zero Hunger** (Target 2.1 & 2.2: Ensure access to safe, nutritious and sufficient food for all).
- **UN SDG 12: Responsible Consumption and Production** (Target 12.3: Halve per capita global food waste at retail and consumer levels).

India generates over **68 million tonnes of food waste annually**, while millions face food insecurity. Commercial food establishments (restaurants, cafeterias, hostel messes, bakeries) incur high overhead and waste freshly cooked, wholesome food simply because the commercial sales window expires.

## 2. Re-serve Business & Humanitarian Architecture

### A. Dual Economic Engine:
1. **Commercial Surplus (50%–75% Discount):**
   - High-quality freshly packed portions sold to students, office goers, and families at 50% to 75% off retail.
   - Platform earns a sustainable **5% to 10% platform commission** on each sale.
   - Merchant recovers ingredient and packaging costs instead of 100% loss.
2. **Humanitarian Annadaan & NGO Fallback (100% Free, ₹0 Commission):**
   - Direct ₹0 meal donations by kitchens, hostels, and langars.
   - **Auto-NGO Fallback Relay:** If a commercial item remains unsold 45 minutes before closing, it automatically flips to ₹0 and alerts mapped NGOs (Robin Hood Army, Feeding India).
   - Citizen micro-donations (₹25/meal) sponsor packs directly into the NGO relief feed.

### B. Dignity, Traceability & Food Safety Protocol:
- **FSSAI 2019 Compliance Checklist:** Hot-hold (>60°C) or cold-chill (<5°C) temperature monitoring, 4-hour cooking window, food-grade tamper-evident packaging.
- **Encrypted QR & 6-Digit Counter PIN:** Dignified pickup without discrimination at the cashier counter.
- **Merchant Laser Scanner Simulator:** Instant cryptographic token lookup against server ledger.

## 3. Technology Stack & Component Structure
- **Backend:** Node.js, Express.js REST API with JSON ledger persistence (`db.json`).
- **Frontend Design System:** Precision Glassmorphism 3.0 (`glassshade.css`), Tailwind CSS, Canvas 3D Particle Wave Grid (`spline-3d.js`), React 18 Motion Scroll Spread (`stack-spread-react.js`).
- **End-to-End Test Suite:** `test-api.js` verifying health, listings, checkout reservation, QR validation, and NGO claim routes.