/**
 * partner-dashboard.js - Surplus Food Entry Portal (Sell @ 50-75% Discount or Donate ₹0)
 * Allows restaurants, cafeterias, bakeries, and hostel messes to list surplus food
 * with temperature tracking, portion metrics, and automated expiry alert timers.
 */

(function () {
  function initPartnerDashboard() {
    const form = document.getElementById('partner-listing-form');
    if (!form) return;

    form.addEventListener('submit', handleFormSubmit);

    // Live preview listeners
    const inputs = ['item-title', 'partner-name', 'orig-price', 'discount-slider', 'weight-kg', 'portions-count', 'storage-temp-input', 'food-condition', 'listing-type-select'];
    inputs.forEach(id => {
      const el = document.getElementById(id);
      if (el) {
        el.addEventListener('input', updateLivePreview);
        el.addEventListener('change', updateLivePreview);
      }
    });

    // Preset Temperature buttons
    const presetBtns = document.querySelectorAll('.temp-preset-btn');
    presetBtns.forEach(btn => {
      btn.addEventListener('click', () => {
        presetBtns.forEach(b => b.classList.remove('active'));
        btn.classList.add('active');
        const input = document.getElementById('storage-temp-input');
        if (input) {
          input.value = btn.dataset.temp;
          updateLivePreview();
        }
      });
    });

    updateLivePreview();
  }

  function updateLivePreview() {
    const title = document.getElementById('item-title')?.value || 'Fresh Artisan Sourdough Batch';
    const partner = document.getElementById('partner-name')?.value || 'Crumb & Crust Patisserie';
    const listingType = document.getElementById('listing-type-select')?.value || 'sell';
    const origPrice = parseFloat(document.getElementById('orig-price')?.value) || 200;
    const discount = parseInt(document.getElementById('discount-slider')?.value, 10) || 65;
    const weight = document.getElementById('weight-kg')?.value || '5.0';
    const portions = document.getElementById('portions-count')?.value || '8';
    const temp = document.getElementById('storage-temp-input')?.value || '21°C (Controlled Ambient Display)';
    const condition = document.getElementById('food-condition')?.value || 'Freshly baked today. Sealed in clean eco parchment.';

    // Slider value label
    const sliderLabel = document.getElementById('discount-val-label');
    if (sliderLabel) sliderLabel.textContent = `${discount}%`;

    const isDonation = listingType === 'donate';
    const sellingPrice = isDonation ? 0 : Math.round(origPrice * (1 - discount / 100));
    const commission = isDonation ? 0 : Math.round(sellingPrice * 0.08);

    // Update Live Preview Card
    const previewBox = document.getElementById('listing-live-preview');
    if (!previewBox) return;

    previewBox.innerHTML = `
      <div class="glass-card" style="border: 1px solid var(--emerald-primary); padding: 1.25rem; border-radius: var(--radius-lg);">
        <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 0.5rem;">
          <span class="badge-sdg-tag" style="margin-bottom: 0;">Live Preview</span>
          <span style="font-size: 0.75rem; color: ${isDonation ? '#34d399' : '#f43f5e'}; font-weight: 800;">
            ${isDonation ? '₹0 Humanitarian Donation' : `${discount}% OFF`}
          </span>
        </div>
        <h4 style="color: #fff; font-size: 1.1rem; margin-bottom: 0.25rem;">${title}</h4>
        <p style="color: var(--emerald-primary); font-size: 0.8rem; font-weight: 600; margin-bottom: 0.5rem;">${partner}</p>
        
        <div class="condition-note" style="font-size: 0.75rem; margin-bottom: 0.5rem;">
          ${condition}
        </div>

        <div style="display: flex; gap: 0.75rem; font-size: 0.75rem; color: var(--text-muted); margin-bottom: 0.75rem;">
          <span>🌡️ ${temp}</span>
          <span>⚖️ ${weight} kg</span>
          <span>🍱 ${portions} Portions</span>
        </div>

        <div style="display: flex; justify-content: space-between; align-items: baseline; border-top: 1px solid rgba(255,255,255,0.1); padding-top: 0.5rem;">
          <div>
            ${isDonation ? `
              <span style="color: #34d399; font-weight: 800; font-size: 1.2rem;">₹0 FREE</span>
            ` : `
              <span style="text-decoration: line-through; color: var(--text-subtle); font-size: 0.75rem;">₹${origPrice}</span>
              <span style="color: #fff; font-weight: 800; font-size: 1.2rem; margin-left: 0.25rem;">₹${sellingPrice}</span>
              <span style="font-size: 0.65rem; color: var(--text-muted); display: block;">Incl. ₹${commission} (8%) developer commission</span>
            `}
          </div>
          <span class="badge-sdg-tag" style="margin: 0; background: rgba(16,185,129,0.1);">Verified Protocol</span>
        </div>
      </div>
    `;
  }

  async function handleFormSubmit(e) {
    e.preventDefault();

    const title = document.getElementById('item-title')?.value;
    const partnerName = document.getElementById('partner-name')?.value;
    const venueType = document.getElementById('venue-type-select')?.value;
    const category = document.getElementById('category-select')?.value;
    const listingType = document.getElementById('listing-type-select')?.value;
    const originalPrice = document.getElementById('orig-price')?.value;
    const discountPercent = document.getElementById('discount-slider')?.value;
    const weightKg = document.getElementById('weight-kg')?.value;
    const portions = document.getElementById('portions-count')?.value;
    const storageTemp = document.getElementById('storage-temp-input')?.value;
    const condition = document.getElementById('food-condition')?.value;
    const city = document.getElementById('outlet-city')?.value || 'Noida';
    const expiryHours = document.getElementById('expiry-hours-input')?.value || 3;

    try {
      const res = await fetch('/api/meals', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
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
          expiryHours
        })
      });

      const data = await res.json();
      if (res.ok && data.success) {
        window.AppModule?.showToast('Surplus Listed!', 'Food posted to live feed with active countdown timer.', 'success');
        document.getElementById('partner-listing-form')?.reset();
        updateLivePreview();
        
        // Auto navigate to discovery to show the new item
        setTimeout(() => {
          window.AppModule?.switchTab('discovery');
          window.DiscoveryModule?.refresh();
        }, 1200);
      } else {
        window.AppModule?.showToast('Error', data.error || 'Failed to list surplus food', 'error');
      }
    } catch (err) {
      console.error('Partner submission error:', err);
      window.AppModule?.showToast('Error', 'Server connection failed', 'error');
    }
  }

  window.PartnerModule = {
    init: initPartnerDashboard,
    updateLivePreview
  };
})();
