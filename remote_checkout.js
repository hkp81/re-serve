/**
 * Checkout & Digital QR Pass Engine (ReServe Edition)
 * Handles both paid surplus meal reservations (UPI Intent)
 * and 100% FREE donated meal claims (₹0 Platform Fee),
 * plus citizen meal sponsorship.
 */

const CheckoutModule = {
  currentListing: null,
  activeOrder: null,
  passTimerInterval: null,

  init() {
    this.bindEvents();
  },

  bindEvents() {
    // UPI Option Selectors
    const upiOptions = document.querySelectorAll('.upi-app-option');
    upiOptions.forEach(opt => {
      opt.addEventListener('click', () => {
        upiOptions.forEach(o => o.classList.remove('border-teal-800', 'bg-teal-50'));
        opt.classList.add('border-teal-800', 'bg-teal-50');
      });
    });

    // Pay / Confirm Button
    const payBtn = document.getElementById('confirm-pay-btn');
    if (payBtn) {
      payBtn.addEventListener('click', () => this.processPayment());
    }

    // Close Modals
    const closeCheckout = document.getElementById('close-checkout-modal-btn');
    if (closeCheckout) {
      closeCheckout.addEventListener('click', () => {
        document.getElementById('checkout-modal').classList.remove('active');
      });
    }

    const closePass = document.getElementById('close-qr-pass-modal-btn');
    if (closePass) {
      closePass.addEventListener('click', () => {
        document.getElementById('qr-pass-modal').classList.remove('active');
      });
    }
  },

  openCheckoutModal(listingId) {
    const listing = DiscoveryModule.listings.find(l => l.id === listingId);
    if (!listing) return;

    this.currentListing = listing;
    const isDonation = listing.rescuePrice === 0 || listing.isDonation === true;
    const modal = document.getElementById('checkout-modal');

    // Populate Titles & Info
    document.getElementById('checkout-item-title').textContent = listing.title;
    document.getElementById('checkout-restaurant-name').textContent = isDonation ? `🌾 Donated: ${listing.restaurantName}` : `🏪 ${listing.restaurantName}`;
    document.getElementById('checkout-item-price').textContent = isDonation ? '₹0 (Free Donation)' : `₹${listing.rescuePrice}`;
    
    const platformFee = isDonation ? 0 : 5;
    const reliefTip = isDonation ? 0 : 2;
    const total = isDonation ? 0 : (listing.rescuePrice + platformFee + reliefTip);

    document.getElementById('checkout-platform-fee').textContent = isDonation ? '₹0' : `₹${platformFee}`;
    document.getElementById('checkout-tip-fee').textContent = isDonation ? '₹0' : `₹${reliefTip}`;
    document.getElementById('checkout-total-price').textContent = `₹${total}`;

    // Update UPI App Section Visibility
    const upiContainer = document.querySelector('#checkout-modal .upi-container-box');
    const payBtn = document.getElementById('confirm-pay-btn');

    if (isDonation) {
      if (upiContainer) upiContainer.style.display = 'none';
      if (payBtn) {
        payBtn.className = 'btn-saffron w-full py-3.5 text-sm font-bold shadow-md';
        payBtn.innerHTML = `<span>🎁 Claim Free Meal Pass</span>`;
      }
    } else {
      if (upiContainer) upiContainer.style.display = 'block';
      if (payBtn) {
        payBtn.className = 'btn-emerald w-full py-3.5 text-sm font-bold shadow-md';
        payBtn.innerHTML = `<span>⚡ Complete UPI Payment (₹${total})</span>`;
      }
    }

    modal.classList.add('active');
  },

  async processPayment() {
    const payBtn = document.getElementById('confirm-pay-btn');
    if (!this.currentListing) return;

    const isDonation = this.currentListing.rescuePrice === 0 || this.currentListing.isDonation === true;

    payBtn.disabled = true;
    payBtn.innerHTML = `
      <div class="w-5 h-5 border-2 border-white/40 border-t-white rounded-full animate-spin"></div>
      <span>${isDonation ? 'Generating Free Meal Pass...' : 'Securing UPI Intent...'}</span>
    `;

    try {
      // Simulate real-time secure handshake
      await new Promise(r => setTimeout(r, isDonation ? 600 : 1100));

      const res = await fetch('/api/orders/reserve', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          listingId: this.currentListing.id,
          customerName: isDonation ? 'Community Beneficiary' : 'Aryan V.',
          customerPhone: '+91 98470 12345',
          paymentMethod: isDonation ? 'Free Community Relief (₹0)' : 'UPI (Instant App)'
        })
      });

      const data = await res.json();
      if (data.success) {
        this.activeOrder = data.order;
        document.getElementById('checkout-modal').classList.remove('active');
        this.showDigitalQrPass(data.order);
        
        if (isDonation) {
          App.showNotification('🌾 Meal pass generated! Show this QR pass at the counter.', 'success');
        } else {
          App.showNotification('🎉 Payment Approved! Your Digital QR Pass is ready.', 'success');
        }

        // Update discovery listings
        if (typeof DiscoveryModule !== 'undefined') {
          DiscoveryModule.fetchListings();
        }
      } else {
        App.showNotification(`Reservation failed: ${data.error}`, 'error');
      }
    } catch (err) {
      console.error('Payment error:', err);
      App.showNotification('Processing error', 'error');
    } finally {
      payBtn.disabled = false;
      payBtn.innerHTML = isDonation ? 
        `<span>🎁 Claim Free Meal Pass</span>` : 
        `<span>⚡ Complete UPI Payment</span>`;
    }
  },

  showDigitalQrPass(order) {
    const modal = document.getElementById('qr-pass-modal');
    const content = document.getElementById('qr-pass-modal-content');
    const isDonated = order.itemPrice === 0 || order.isDonation === true;

    content.innerHTML = `
      <div class="text-center">
        <!-- Pass Header -->
        <div class="inline-flex items-center gap-1.5 px-3.5 py-1 rounded-full ${isDonated ? 'bg-amber-100 text-amber-900 border border-amber-300' : 'bg-teal-50 text-teal-900 border border-teal-300'} text-xs font-bold mb-3">
          <span class="w-2 h-2 rounded-full ${isDonated ? 'bg-amber-600' : 'bg-teal-700'} animate-ping"></span>
          <span>${isDonated ? '🌾 100% Free Meal Pass (Ready for Pickup)' : 'Order Confirmed • Ready for Pickup'}</span>
        </div>

        <h3 class="text-xl font-extrabold text-slate-900">${order.restaurantName}</h3>
        <p class="text-xs text-slate-500 mb-5">${order.title} • Order ID: #${order.id}</p>

        <!-- Simulated Cryptographic QR Code -->
        <div class="relative w-52 h-52 mx-auto bg-white p-3 rounded-2xl shadow-xl border border-slate-200 flex items-center justify-center mb-4">
          <svg viewBox="0 0 100 100" class="w-full h-full text-slate-950">
            <rect width="100" height="100" fill="#ffffff" />
            <path d="M8,8 h28 v28 h-28 z M12,12 v20 h20 v-20 z M18,18 h8 v8 h-8 z" fill="#004D40" />
            <path d="M64,8 h28 v28 h-28 z M68,12 v20 h20 v-20 z M74,18 h8 v8 h-8 z" fill="#004D40" />
            <path d="M8,64 h28 v28 h-28 z M12,68 v20 h20 v-20 z M18,74 h8 v8 h-8 z" fill="#004D40" />
            <rect x="42" y="12" width="16" height="6" fill="#004D40" />
            <rect x="42" y="24" width="8" height="18" fill="#004D40" />
            <rect x="56" y="36" width="28" height="8" fill="#004D40" />
            <rect x="42" y="52" width="18" height="8" fill="#004D40" />
            <rect x="68" y="52" width="20" height="20" fill="#004D40" />
            <rect x="42" y="68" width="16" height="20" fill="#004D40" />
          </svg>

          <!-- Center Brand Watermark -->
          <div class="absolute inset-0 flex items-center justify-center pointer-events-none">
            <div class="w-10 h-10 rounded-full ${isDonated ? 'bg-[#E5A93C] text-slate-900' : 'bg-[#004D40] text-white'} font-black flex items-center justify-center text-sm shadow-md border-2 border-white">
              ${isDonated ? '🌾' : '🌿'}
            </div>
          </div>
        </div>

        <!-- 6-Digit Counter PIN -->
        <div class="mb-4">
          <div class="text-[11px] uppercase tracking-wider text-slate-500 font-bold mb-1">
            Counter Verification PIN (6-Digit)
          </div>
          <div class="inline-block font-mono text-3xl font-extrabold tracking-widest ${isDonated ? 'text-amber-800 bg-amber-50 border-amber-300' : 'text-teal-900 bg-teal-50 border-teal-300'} border px-6 py-2 rounded-xl shadow-sm">
            ${order.pickupOtp}
          </div>
        </div>

        <!-- Ticking Pickup Validity Timer -->
        <div class="p-3 rounded-xl bg-amber-50 border border-amber-200 text-xs text-amber-800 mb-4 flex items-center justify-center gap-2">
          <span>⏰</span>
          <span class="font-mono font-bold" id="pass-ticking-clock">Pickup Window: Valid for next 45m : 00s</span>
        </div>

        <div class="flex items-center gap-3">
          <button 
            onclick="ScannerSimulatorModule.openSimulatorWithPass('${order.pickupOtp}')"
            class="btn-glass flex-1 py-2 text-xs"
          >
            📸 Test In Scanner
          </button>
          <button 
            onclick="document.getElementById('qr-pass-modal').classList.remove('active')"
            class="${isDonated ? 'btn-saffron' : 'btn-emerald'} flex-1 py-2 text-xs"
          >
            Done (Close)
          </button>
        </div>
      </div>
    `;

    modal.classList.add('active');
  },

  // Citizen sponsors an extra meal for ₹25
  async sponsorMeal(amount = 25) {
    try {
      const res = await fetch('/api/sponsor/meal', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ amount, donorName: 'Anonymous Donor' })
      });
      const data = await res.json();
      if (data.success) {
        App.showNotification(`🙏 Thank you! ${data.mealsCount} sponsored meals added directly to the NGO relief feed.`, 'success');
        // Update counters
        const savedEl = document.getElementById('stat-meals-saved');
        const count = parseInt((savedEl ? savedEl.textContent : '94825').replace(/[^0-9]/g, '')) + data.mealsCount;
        if (savedEl) savedEl.textContent = `${count.toLocaleString('en-IN')}+`;
        
        const annadaanEl = document.getElementById('stat-annadaan-saved');
        if (annadaanEl) {
          const aCount = parseInt(annadaanEl.textContent.replace(/[^0-9]/g, '')) + data.mealsCount;
          annadaanEl.textContent = `${aCount.toLocaleString('en-IN')}+`;
        }
      }
    } catch (err) {
      console.error('Sponsor error:', err);
    }
  }
};

document.addEventListener('DOMContentLoaded', () => {
  CheckoutModule.init();
});
