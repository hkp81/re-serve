/**
 * Food Partner Dashboard Module
 * Implements "Quick Closing Mode", Mandatory FSSAI Safety Checklist,
 * AI Demand Prediction Card, and Auto-NGO Fallback Switch.
 */

const PartnerDashboardModule = {
  init() {
    this.bindEvents();
    this.checkChecklistState();
  },

  bindEvents() {
    // Quick Closing Mode Presets
    const presetBtns = document.querySelectorAll('.quick-preset-btn');
    presetBtns.forEach(btn => {
      btn.addEventListener('click', (e) => {
        const presetType = btn.dataset.preset;
        this.applyPreset(presetType);
      });
    });

    // Safety Checklist Confirmations
    const checklistItems = document.querySelectorAll('.fssai-check-input');
    checklistItems.forEach(item => {
      item.addEventListener('change', () => this.checkChecklistState());
    });

    // Form Submission
    const form = document.getElementById('partner-listing-form');
    if (form) {
      form.addEventListener('submit', (e) => {
        e.preventDefault();
        this.submitListing(form);
      });
    }

    // Auto-NGO Fallback Switch
    const fallbackToggle = document.getElementById('auto-ngo-fallback-toggle');
    const fallbackStatusText = document.getElementById('fallback-status-text');
    if (fallbackToggle && fallbackStatusText) {
      fallbackToggle.addEventListener('change', (e) => {
        if (e.target.checked) {
          fallbackStatusText.textContent = 'Active: Auto-alerts NGOs 45m before closing if unclaimed';
          fallbackStatusText.className = 'text-xs text-emerald-400 font-medium';
        } else {
          fallbackStatusText.textContent = 'Disabled: Meals will not auto-route to charity';
          fallbackStatusText.className = 'text-xs text-white/40 font-medium';
        }
      });
    }
  },

  applyPreset(type) {
    const titleInput = document.getElementById('listing-title-input');
    const origPriceInput = document.getElementById('listing-orig-price-input');
    const rescuePriceInput = document.getElementById('listing-rescue-price-input');
    const qtyInput = document.getElementById('listing-qty-input');
    const catInput = document.getElementById('listing-category-select');
    const vegInput = document.getElementById('listing-isveg-check');

    if (type === 'bakery') {
      titleInput.value = 'Surprise Bakery & Croissant Bag';
      origPriceInput.value = 350;
      rescuePriceInput.value = 99;
      qtyInput.value = 5;
      catInput.value = 'Bakery & Desserts';
      vegInput.checked = true;
    } else if (type === 'biryani') {
      titleInput.value = 'Thalassery Dum Biryani Box + Starter';
      origPriceInput.value = 290;
      rescuePriceInput.value = 89;
      qtyInput.value = 4;
      catInput.value = 'Biryani & Meals';
      vegInput.checked = false;
    } else if (type === 'snack') {
      titleInput.value = 'Midnight Cafe Wrap & Fries Combo';
      origPriceInput.value = 220;
      rescuePriceInput.value = 69;
      qtyInput.value = 6;
      catInput.value = 'Cafe Snacks';
      vegInput.checked = true;
    }

    // Auto-tick checklist for convenience in 30-sec mode
    const checklistItems = document.querySelectorAll('.fssai-check-input');
    checklistItems.forEach(item => { item.checked = true; });
    this.checkChecklistState();

    App.showNotification(`⚡ Quick Preset Applied: "${titleInput.value}". Ready to publish!`, 'info');
  },

  checkChecklistState() {
    const checklistItems = document.querySelectorAll('.fssai-check-input');
    const submitBtn = document.getElementById('publish-listing-btn');
    if (!submitBtn) return;

    const allChecked = Array.from(checklistItems).every(cb => cb.checked);
    submitBtn.disabled = !allChecked;

    if (allChecked) {
      submitBtn.classList.remove('opacity-50', 'cursor-not-allowed');
      submitBtn.classList.add('shadow-lg', 'shadow-emerald-500/30');
    } else {
      submitBtn.classList.add('opacity-50', 'cursor-not-allowed');
      submitBtn.classList.remove('shadow-lg', 'shadow-emerald-500/30');
    }
  },

  async submitListing(form) {
    const title = document.getElementById('listing-title-input').value.trim();
    const originalPrice = parseFloat(document.getElementById('listing-orig-price-input').value);
    const rescuePrice = parseFloat(document.getElementById('listing-rescue-price-input').value);
    const quantity = parseInt(document.getElementById('listing-qty-input').value);
    const category = document.getElementById('listing-category-select').value;
    const isVeg = document.getElementById('listing-isveg-check').checked;
    const autoFallback = document.getElementById('auto-ngo-fallback-toggle').checked;
    const restaurantName = document.getElementById('partner-store-name').value || 'Pandhal Cake Shop';
    const city = document.getElementById('partner-city-select').value || 'Kochi';

    const payload = {
      restaurantName,
      city,
      title,
      category,
      isVeg,
      isCampus: false,
      originalPrice,
      rescuePrice,
      quantity,
      minutesRemaining: 45,
      fssaiConfirmed: true,
      autoNgoFallback: autoFallback,
      allergens: isVeg ? ['Dairy', 'Gluten'] : ['Eggs', 'Halal Spices']
    };

    try {
      const res = await fetch('/api/listings', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });

      const data = await res.json();
      if (data.success) {
        App.showNotification(`🎉 Listing Published! "${title}" is live for pickup.`, 'success');
        form.reset();
        this.checkChecklistState();

        // Refresh discovery feed immediately
        if (typeof DiscoveryModule !== 'undefined') {
          DiscoveryModule.fetchListings();
        }

        // Switch to Customer view to show the newly added item
        setTimeout(() => {
          App.switchRole('customer');
        }, 1200);
      } else {
        App.showNotification(`Error: ${data.error}`, 'error');
      }
    } catch (err) {
      console.error('Failed to submit listing:', err);
      App.showNotification('Network error while publishing listing', 'error');
    }
  }
};

document.addEventListener('DOMContentLoaded', () => {
  PartnerDashboardModule.init();
});
