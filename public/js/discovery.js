/**
 * discovery.js - Surplus Discovery Feed with 3D Interactive Tilt & Shiny Glare
 * Displays real-time surplus food cards with dynamic countdown timers,
 * 3D perspective mouse tilt, food storage temperature badges, and filters.
 */

(function () {
  let allMeals = [];
  let timerInterval = null;

  async function fetchMeals() {
    const grid = document.getElementById('meals-grid');
    if (!grid) return;

    try {
      const activeType = document.querySelector('.filter-chip.active')?.dataset.type || 'all';
      const venueType = document.getElementById('venue-filter')?.value || 'all';
      const search = document.getElementById('search-meals')?.value || '';

      const query = new URLSearchParams();
      if (activeType !== 'all') query.append('type', activeType);
      if (venueType !== 'all') query.append('venue', venueType);
      if (search) query.append('search', search);

      const res = await fetch(`/api/meals?${query.toString()}`);
      const data = await res.json();
      allMeals = data.data || [];
      renderMeals(allMeals);
    } catch (err) {
      console.error('Failed to load surplus meals:', err);
      grid.innerHTML = `<div class="glass-card" style="grid-column: 1/-1; padding: 2rem; text-align: center;">
        <p style="color: #ef4444; font-weight: 700;">Could not load surplus meals from server.</p>
      </div>`;
    }
  }

  function renderMeals(meals) {
    const grid = document.getElementById('meals-grid');
    if (!grid) return;

    if (meals.length === 0) {
      grid.innerHTML = `
        <div class="glass-card" style="grid-column: 1/-1; padding: 3rem; text-align: center;">
          <div style="font-size: 2.8rem; margin-bottom: 0.5rem;">🥗</div>
          <h3 style="color: #0f172a; margin-bottom: 0.5rem; font-weight: 800;">No Surplus Items Found</h3>
          <p style="color: var(--text-muted); font-size: 0.88rem;">Try clearing your filters or check back shortly as partner outlets list freshly packed items.</p>
        </div>
      `;
      return;
    }

    grid.innerHTML = meals.map(meal => {
      const isDonation = meal.listingType === 'donate';
      const isHot = meal.storageTemp && (meal.storageTemp.includes('6') || meal.storageTemp.includes('7') || meal.storageTemp.toLowerCase().includes('hot') || meal.storageTemp.toLowerCase().includes('steam'));
      const tempIcon = isHot ? '🔥' : (meal.storageTemp.includes('4') ? '❄️' : '🌿');
      const tempClass = isHot ? 'hot' : 'cold';

      return `
        <div class="glass-card meal-card interactive-tilt-card" data-id="${meal.id}">
          <div class="meal-img-box">
            <img src="${meal.image}" alt="${meal.title}" class="meal-img" loading="lazy">
            <div class="temp-badge ${tempClass}">
              <span>${tempIcon}</span>
              <span>${meal.storageTemp || 'Safe Hold'}</span>
            </div>
            <div class="timer-badge safe" id="timer-${meal.id}" data-expires="${meal.expiresAt}">
              <span>⏳</span>
              <span class="timer-text">Calculating...</span>
            </div>
            <div class="listing-type-ribbon ${isDonation ? 'ribbon-donate' : 'ribbon-discount'}">
              ${isDonation ? '₹0 Free Donation' : `${meal.discountPercent}% OFF`}
            </div>
          </div>

          <div class="meal-body">
            <div class="partner-info">
              <span class="partner-name">
                <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><path d="M12 2a8 8 0 0 0-8 8c0 5.25 8 12 8 12s8-6.75 8-12a8 8 0 0 0-8-8z"/><circle cx="12" cy="10" r="3"/></svg>
                ${meal.partnerName}
              </span>
              <span class="venue-tag">${meal.venueType}</span>
            </div>

            <h3 class="meal-title">${meal.title}</h3>

            <div class="condition-note">
              <strong style="color: var(--orange-primary);">Condition:</strong> ${meal.condition}
            </div>

            <div class="meal-meta-row">
              <span class="meal-meta-item">
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4"/></svg>
                ${meal.portions} Portions
              </span>
              <span class="meal-meta-item">
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="10"/><path d="M12 6v6l4 2"/></svg>
                ${meal.weightKg} kg Total
              </span>
              <span class="meal-meta-item" style="color: var(--emerald-dark);">
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><polyline points="20 6 9 17 4 12"/></svg>
                Verified Safe
              </span>
            </div>

            <div class="meal-footer">
              <div class="price-container">
                ${isDonation ? `
                  <span class="original-price-strike">Original ₹${meal.originalPrice}</span>
                  <div class="current-price free">₹0 <span>FREE</span></div>
                  <span class="commission-note">Humanitarian distribution (₹0 Fee)</span>
                ` : `
                  <span class="original-price-strike">₹${meal.originalPrice}</span>
                  <div class="current-price">₹${meal.price} <span>/ pack</span></div>
                  <span class="commission-note">Includes 5–10% developer fee</span>
                `}
              </div>

              <button class="btn-action-primary ${isDonation ? 'btn-action-donate' : ''}" onclick="window.CheckoutModule.openCheckout('${meal.id}')">
                ${isDonation ? 'Claim with Dignity' : 'Reserve & Buy'}
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><line x1="5" y1="12" x2="19" y2="12"/><polyline points="12 5 19 12 12 19"/></svg>
              </button>
            </div>
          </div>
        </div>
      `;
    }).join('');

    updateAllTimers();
    apply3DTiltListeners();
  }

  // Applies Interactive 3D Tilt and Specular Shiny Glare to cards
  function apply3DTiltListeners() {
    const cards = document.querySelectorAll('.interactive-tilt-card');
    cards.forEach(card => {
      card.addEventListener('mousemove', (e) => {
        const rect = card.getBoundingClientRect();
        const x = e.clientX - rect.left;
        const y = e.clientY - rect.top;
        
        // Update CSS variables for shiny glare
        card.style.setProperty('--mouse-x', `${x}px`);
        card.style.setProperty('--mouse-y', `${y}px`);

        // Calculate 3D rotation angles
        const centerX = rect.width / 2;
        const centerY = rect.height / 2;
        const rotateX = ((y - centerY) / centerY) * -9;
        const rotateY = ((x - centerX) / centerX) * 9;

        card.style.transform = `perspective(1000px) rotateX(${rotateX}deg) rotateY(${rotateY}deg) translateY(-6px) scale3d(1.02, 1.02, 1.02)`;
      });

      card.addEventListener('mouseleave', () => {
        card.style.transform = 'perspective(1000px) rotateX(0deg) rotateY(0deg) translateY(0) scale3d(1, 1, 1)';
      });
    });
  }

  function updateAllTimers() {
    const timerEls = document.querySelectorAll('.timer-badge');
    const now = new Date().getTime();

    timerEls.forEach(el => {
      const expires = new Date(el.dataset.expires).getTime();
      const diff = expires - now;

      const textSpan = el.querySelector('.timer-text');
      if (!textSpan) return;

      if (diff <= 0) {
        textSpan.textContent = 'EXPIRED';
        el.className = 'timer-badge urgent';
        return;
      }

      const hours = Math.floor(diff / (1000 * 60 * 60));
      const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
      const seconds = Math.floor((diff % (1000 * 60)) / 1000);

      textSpan.textContent = `${hours > 0 ? hours + 'h ' : ''}${minutes}m ${seconds}s`;

      if (diff > 2 * 3600 * 1000) {
        el.className = 'timer-badge safe';
      } else if (diff > 30 * 60 * 1000) {
        el.className = 'timer-badge warning';
      } else {
        el.className = 'timer-badge urgent';
      }
    });
  }

  function startLiveTimers() {
    if (timerInterval) clearInterval(timerInterval);
    timerInterval = setInterval(updateAllTimers, 1000);
  }

  function setupFilterListeners() {
    const chips = document.querySelectorAll('.filter-chip');
    chips.forEach(chip => {
      chip.addEventListener('click', () => {
        chips.forEach(c => c.classList.remove('active'));
        chip.classList.add('active');
        fetchMeals();
      });
    });

    const venueFilter = document.getElementById('venue-filter');
    if (venueFilter) {
      venueFilter.addEventListener('change', fetchMeals);
    }

    const searchInput = document.getElementById('search-meals');
    if (searchInput) {
      let debounceTimeout;
      searchInput.addEventListener('input', () => {
        clearTimeout(debounceTimeout);
        debounceTimeout = setTimeout(fetchMeals, 300);
      });
    }
  }

  window.DiscoveryModule = {
    init() {
      setupFilterListeners();
      fetchMeals();
      startLiveTimers();
    },
    refresh: fetchMeals,
    getAllMeals: () => allMeals
  };
})();