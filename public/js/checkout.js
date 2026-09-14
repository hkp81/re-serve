/**
 * checkout.js - Reservation, Checkout, Commission & Dignity QR/OTP Module
 * Handles surplus reservations, 5-10% developer commission calculations,
 * payment selection (Online/COD), and generates dynamic QR code & 6-digit OTP.
 */

(function () {
  let currentMeal = null;
  let portions = 1;

  function openCheckout(mealId) {
    const meals = window.DiscoveryModule ? window.DiscoveryModule.getAllMeals() : [];
    currentMeal = meals.find(m => m.id === mealId);
    if (!currentMeal) {
      window.AppModule?.showToast('Error', 'Meal listing not found', 'error');
      return;
    }

    portions = 1;
    const modal = document.getElementById('checkout-modal');
    if (!modal) return;

    renderCheckoutContent();
    modal.classList.add('active');
  }

  function closeCheckout() {
    const modal = document.getElementById('checkout-modal');
    if (modal) modal.classList.remove('active');
  }

  function renderCheckoutContent() {
    const container = document.getElementById('checkout-modal-content');
    if (!container || !currentMeal) return;

    const isDonation = currentMeal.listingType === 'donate';
    const unitPrice = isDonation ? 0 : currentMeal.price;
    const itemSubtotal = unitPrice * portions;
    const commissionRate = currentMeal.platformCommissionRate || 0.08;
    const platformFee = isDonation ? 0 : Math.round(itemSubtotal * commissionRate);
    const totalPayable = itemSubtotal + platformFee;

    container.innerHTML = `
      <div style="text-align: center; margin-bottom: 1.5rem;">
        <span class="badge-sdg-tag">
          ${isDonation ? '🤝 Zero Hunger Humanitarian Claim' : '🌱 Sustainable Surplus Rescue'}
        </span>
        <h2 style="color: #fff; font-size: 1.4rem; font-weight: 800; margin-top: 0.5rem;">
          ${isDonation ? 'Claim Surplus with Dignity' : 'Reserve & Buy Surplus Meal'}
        </h2>
        <p style="color: var(--text-muted); font-size: 0.85rem;">
          ${currentMeal.title} &bull; <span style="color: var(--emerald-primary);">${currentMeal.partnerName}</span>
        </p>
      </div>

      <!-- Quantity Selector -->
      <div style="background: rgba(0,0,0,0.3); padding: 1rem; border-radius: var(--radius-md); border: 1px solid var(--glass-border); margin-bottom: 1.25rem;">
        <div style="display: flex; justify-content: space-between; align-items: center;">
          <div>
            <div style="font-weight: 700; color: #fff; font-size: 0.9rem;">Portions to Reserve</div>
            <div style="font-size: 0.75rem; color: var(--text-muted);">Available in this batch: ${currentMeal.portions} portions</div>
          </div>
          <div style="display: flex; align-items: center; gap: 0.75rem;">
            <button type="button" class="btn-scanner-quick" onclick="window.CheckoutModule.adjustPortions(-1)" ${portions <= 1 ? 'disabled style="opacity:0.4;"' : ''}>-</button>
            <span style="font-weight: 800; font-size: 1.1rem; color: #fff; min-width: 24px; text-align: center;">${portions}</span>
            <button type="button" class="btn-scanner-quick" onclick="window.CheckoutModule.adjustPortions(1)" ${portions >= (currentMeal.portions || 10) ? 'disabled style="opacity:0.4;"' : ''}>+</button>
          </div>
        </div>
      </div>

      <!-- Price Breakdown -->
      <div style="background: rgba(255,255,255,0.03); padding: 1.25rem; border-radius: var(--radius-md); border: 1px solid var(--glass-border); margin-bottom: 1.25rem;">
        <div style="display: flex; justify-content: space-between; font-size: 0.85rem; margin-bottom: 0.5rem; color: var(--text-muted);">
          <span>Subtotal (${portions} × ₹${unitPrice})</span>
          <span style="color: #fff; font-weight: 600;">₹${itemSubtotal}</span>
        </div>
        <div style="display: flex; justify-content: space-between; font-size: 0.85rem; margin-bottom: 0.75rem; color: var(--text-muted);">
          <span>Platform Commission (8%)</span>
          <span style="color: ${isDonation ? '#34d399' : '#fff'}; font-weight: 600;">
            ${isDonation ? '₹0 (Waived for Charity)' : `₹${platformFee}`}
          </span>
        </div>
        <div style="border-top: 1px dashed rgba(255,255,255,0.15); padding-top: 0.75rem; display: flex; justify-content: space-between; align-items: baseline;">
          <span style="color: #fff; font-weight: 800;">Total Payable</span>
          <span style="font-size: 1.4rem; font-weight: 800; color: ${isDonation ? '#34d399' : '#10b981'};">
            ${isDonation ? '₹0 FREE' : `₹${totalPayable}`}
          </span>
        </div>
      </div>

      <!-- Recipient & Payment Option -->
      <form id="checkout-form" onsubmit="window.CheckoutModule.submitReservation(event)">
        <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 0.75rem; margin-bottom: 1.25rem;">
          <div>
            <label class="input-label">Your Name / Organization</label>
            <input type="text" id="cust-name" class="form-input" required placeholder="e.g. Suman / Robin Hood Army" value="Conscious Citizen">
          </div>
          <div>
            <label class="input-label">Phone Number</label>
            <input type="tel" id="cust-phone" class="form-input" required placeholder="+91 98765 43210" value="+91 98765 43210">
          </div>
        </div>

        <div style="margin-bottom: 1.5rem;">
          <label class="input-label">Payment & Collection Mode</label>
          ${isDonation ? `
            <div style="background: rgba(16, 185, 129, 0.1); border: 1px solid rgba(16, 185, 129, 0.4); padding: 0.75rem; border-radius: var(--radius-md); font-size: 0.82rem; color: #34d399;">
              ✅ <strong>Humanitarian Free Claim</strong>: Covered 100% by platform & partner donation. Verified contactless OTP & QR pickup generated immediately.
            </div>
          ` : `
            <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 0.75rem;">
              <label style="display: flex; align-items: center; gap: 0.5rem; background: rgba(0,0,0,0.3); border: 1px solid var(--glass-border); padding: 0.75rem; border-radius: var(--radius-md); cursor: pointer; font-size: 0.85rem;">
                <input type="radio" name="pay-mode" value="ONLINE_UPI" checked>
                <span>⚡ Online UPI / Card</span>
              </label>
              <label style="display: flex; align-items: center; gap: 0.5rem; background: rgba(0,0,0,0.3); border: 1px solid var(--glass-border); padding: 0.75rem; border-radius: var(--radius-md); cursor: pointer; font-size: 0.85rem;">
                <input type="radio" name="pay-mode" value="COD">
                <span>💵 Pay on Collection</span>
              </label>
            </div>
          `}
        </div>

        <button type="submit" class="btn-action-primary" style="width: 100%; justify-content: center; padding: 0.85rem; font-size: 1rem;">
          ${isDonation ? '🤝 Confirm Free Claim & Get QR Code' : `🔒 Pay ₹${totalPayable} & Generate Dignity QR`}
        </button>
      </form>
    `;
  }

  function adjustPortions(delta) {
    if (!currentMeal) return;
    const maxPortions = currentMeal.portions || 10;
    const next = portions + delta;
    if (next >= 1 && next <= maxPortions) {
      portions = next;
      renderCheckoutContent();
    }
  }

  async function submitReservation(e) {
    e.preventDefault();
    if (!currentMeal) return;

    const name = document.getElementById('cust-name')?.value || 'Conscious Diner';
    const phone = document.getElementById('cust-phone')?.value || '+91 99999 88888';
    const payMode = document.querySelector('input[name="pay-mode"]:checked')?.value || (currentMeal.listingType === 'donate' ? 'FREE_SDG_CLAIM' : 'ONLINE_UPI');

    try {
      const res = await fetch('/api/reserve', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          mealId: currentMeal.id,
          customerName: name,
          customerPhone: phone,
          paymentMethod: payMode,
          portionsReserved: portions
        })
      });

      const data = await res.json();
      if (res.ok && data.success) {
        showSuccessDignityPass(data.order);
        if (window.DiscoveryModule) window.DiscoveryModule.refresh();
        if (window.AppModule) window.AppModule.refreshStats();
      } else {
        window.AppModule?.showToast('Reservation Error', data.error || 'Could not complete reservation', 'error');
      }
    } catch (err) {
      console.error('Reservation submission error:', err);
      window.AppModule?.showToast('Error', 'Server connection failed', 'error');
    }
  }

  function showSuccessDignityPass(order) {
    const container = document.getElementById('checkout-modal-content');
    if (!container) return;

    // Generate Dynamic QR Code using an SVG QR Matrix pattern
    const qrMatrixSvg = generateMockQrSvg(order.qrToken);

    container.innerHTML = `
      <div style="text-align: center;">
        <div style="width: 50px; height: 50px; background: rgba(16, 185, 129, 0.2); border: 2px solid var(--emerald-primary); border-radius: 50%; display: flex; align-items: center; justify-content: center; margin: 0 auto 0.75rem auto; color: var(--emerald-primary); font-size: 1.5rem;">
          ✓
        </div>
        <span class="badge-sdg-tag" style="margin-bottom: 0.5rem;">Collect With Dignity Verified</span>
        <h2 style="color: #fff; font-size: 1.35rem; font-weight: 800;">Your Collection Pass is Ready</h2>
        <p style="color: var(--text-muted); font-size: 0.8rem; margin-bottom: 1.25rem;">
          Show this QR code or 6-digit OTP at the counter or to your delivery volunteer. Handover is confidential & stigma-free.
        </p>

        <!-- QR Code Container -->
        <div style="background: #fff; padding: 1.25rem; border-radius: var(--radius-lg); width: 200px; height: 200px; margin: 0 auto 1.25rem auto; display: flex; align-items: center; justify-content: center; box-shadow: 0 10px 25px rgba(0,0,0,0.5);">
          ${qrMatrixSvg}
        </div>

        <!-- 6 Digit OTP Display -->
        <label class="input-label">Verification OTP Code</label>
        <div class="otp-display-box">
          ${order.otp.split('').map(d => `<div class="otp-digit">${d}</div>`).join('')}
        </div>

        <div style="background: rgba(255,255,255,0.04); border: 1px solid var(--glass-border); border-radius: var(--radius-md); padding: 0.85rem; text-align: left; font-size: 0.8rem; margin-bottom: 1.25rem;">
          <div style="display: flex; justify-content: space-between; margin-bottom: 0.25rem;">
            <span style="color: var(--text-muted);">Order ID:</span>
            <strong style="color: #fff;">${order.id}</strong>
          </div>
          <div style="display: flex; justify-content: space-between; margin-bottom: 0.25rem;">
            <span style="color: var(--text-muted);">Outlet / Partner:</span>
            <span style="color: var(--emerald-primary); font-weight: 600;">${order.partnerName}</span>
          </div>
          <div style="display: flex; justify-content: space-between;">
            <span style="color: var(--text-muted);">Status:</span>
            <span style="color: #38bdf8; font-weight: 700;">Ready for Pickup</span>
          </div>
        </div>

        <div style="display: flex; gap: 0.75rem;">
          <button type="button" class="btn-action-primary" style="flex: 1; justify-content: center;" onclick="window.CheckoutModule.viewTracking('${order.id}')">
            📍 Track Volunteer on Map
          </button>
          <button type="button" class="btn-scanner-quick" onclick="window.CheckoutModule.closeCheckout()">
            Done
          </button>
        </div>
      </div>
    `;
  }

  function viewTracking(orderId) {
    closeCheckout();
    if (window.AppModule) {
      window.AppModule.switchTab('tracking');
      if (window.SimulatorModule) {
        window.SimulatorModule.startTracking(orderId);
      }
    }
  }

  // Generates clean dynamic SVG representation of QR code
  function generateMockQrSvg(token) {
    return `
      <svg viewBox="0 0 100 100" width="170" height="170" fill="#0a0e17">
        <!-- Corner Markers -->
        <rect x="5" y="5" width="26" height="26" fill="#0a0e17" rx="3"/>
        <rect x="9" y="9" width="18" height="18" fill="#ffffff" rx="1"/>
        <rect x="13" y="13" width="10" height="10" fill="#0a0e17" rx="1"/>

        <rect x="69" y="5" width="26" height="26" fill="#0a0e17" rx="3"/>
        <rect x="73" y="9" width="18" height="18" fill="#ffffff" rx="1"/>
        <rect x="77" y="13" width="10" height="10" fill="#0a0e17" rx="1"/>

        <rect x="5" y="69" width="26" height="26" fill="#0a0e17" rx="3"/>
        <rect x="9" y="73" width="18" height="18" fill="#ffffff" rx="1"/>
        <rect x="13" y="77" width="10" height="10" fill="#0a0e17" rx="1"/>

        <!-- Grid Pattern Modules -->
        <rect x="36" y="8" width="5" height="5"/>
        <rect x="46" y="8" width="5" height="5"/>
        <rect x="56" y="8" width="5" height="5"/>
        <rect x="36" y="18" width="5" height="5"/>
        <rect x="51" y="18" width="5" height="5"/>

        <rect x="8" y="36" width="5" height="5"/>
        <rect x="18" y="36" width="5" height="5"/>
        <rect x="28" y="36" width="5" height="5"/>
        <rect x="38" y="36" width="5" height="5"/>
        <rect x="48" y="36" width="5" height="5"/>
        <rect x="58" y="36" width="5" height="5"/>
        <rect x="68" y="36" width="5" height="5"/>
        <rect x="78" y="36" width="5" height="5"/>
        <rect x="88" y="36" width="5" height="5"/>

        <rect x="8" y="46" width="5" height="5"/>
        <rect x="23" y="46" width="5" height="5"/>
        <rect x="38" y="46" width="5" height="5"/>
        <rect x="53" y="46" width="5" height="5"/>
        <rect x="68" y="46" width="5" height="5"/>
        <rect x="83" y="46" width="5" height="5"/>

        <rect x="13" y="56" width="5" height="5"/>
        <rect x="33" y="56" width="5" height="5"/>
        <rect x="43" y="56" width="5" height="5"/>
        <rect x="63" y="56" width="5" height="5"/>
        <rect x="73" y="56" width="5" height="5"/>
        <rect x="83" y="56" width="5" height="5"/>

        <rect x="36" y="68" width="5" height="5"/>
        <rect x="46" y="68" width="5" height="5"/>
        <rect x="66" y="68" width="5" height="5"/>
        <rect x="86" y="68" width="5" height="5"/>

        <rect x="41" y="78" width="5" height="5"/>
        <rect x="56" y="78" width="5" height="5"/>
        <rect x="76" y="78" width="5" height="5"/>
        <rect x="86" y="78" width="5" height="5"/>

        <rect x="36" y="88" width="5" height="5"/>
        <rect x="51" y="88" width="5" height="5"/>
        <rect x="66" y="88" width="5" height="5"/>
      </svg>
    `;
  }

  window.CheckoutModule = {
    openCheckout,
    closeCheckout,
    adjustPortions,
    submitReservation,
    viewTracking
  };
})();
