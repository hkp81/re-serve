/**
 * Customer Discovery Engine (Sober Light & Annadaan Seva Edition)
 * Handles real-time filtering (including dedicated ₹0 Annadaan Donated Food),
 * live ticking countdown timers, List / Radar Map view toggling,
 * 3D card tilt re-initialization, and bilingual labels.
 */

const DiscoveryModule = {
  currentFilter: {
    veg: false,
    campus: false,
    maxPrice: null,
    donated: false,
    search: '',
    city: 'all'
  },
  currentView: 'list', // 'list' | 'map'
  listings: [],
  timerInterval: null,

  init() {
    this.bindEvents();
    this.fetchListings();
    this.startGlobalTimer();
  },

  bindEvents() {
    // 1. ₹0 Annadaan / Donated Food Filter Toggle
    const donatedBtn = document.getElementById('filter-donated-btn');
    if (donatedBtn) {
      donatedBtn.addEventListener('click', () => {
        this.currentFilter.donated = !this.currentFilter.donated;
        donatedBtn.classList.toggle('border-amber-500', this.currentFilter.donated);
        donatedBtn.classList.toggle('bg-amber-500/20', this.currentFilter.donated);
        donatedBtn.classList.toggle('text-amber-800', this.currentFilter.donated);
        this.fetchListings();
      });
    }

    // 2. Veg Filter Toggle
    const vegBtn = document.getElementById('filter-veg-btn');
    if (vegBtn) {
      vegBtn.addEventListener('click', () => {
        this.currentFilter.veg = !this.currentFilter.veg;
        vegBtn.classList.toggle('border-emerald-600', this.currentFilter.veg);
        vegBtn.classList.toggle('bg-emerald-500/15', this.currentFilter.veg);
        vegBtn.classList.toggle('text-emerald-800', this.currentFilter.veg);
        this.fetchListings();
      });
    }

    // 3. Campus Filter Toggle
    const campusBtn = document.getElementById('filter-campus-btn');
    if (campusBtn) {
      campusBtn.addEventListener('click', () => {
        this.currentFilter.campus = !this.currentFilter.campus;
        campusBtn.classList.toggle('border-cyan-600', this.currentFilter.campus);
        campusBtn.classList.toggle('bg-cyan-500/15', this.currentFilter.campus);
        campusBtn.classList.toggle('text-cyan-800', this.currentFilter.campus);
        this.fetchListings();
      });
    }

    // 4. Under ₹100 Filter Toggle
    const priceBtn = document.getElementById('filter-price-btn');
    if (priceBtn) {
      priceBtn.addEventListener('click', () => {
        this.currentFilter.maxPrice = this.currentFilter.maxPrice === 100 ? null : 100;
        priceBtn.classList.toggle('border-amber-600', this.currentFilter.maxPrice === 100);
        priceBtn.classList.toggle('bg-amber-500/15', this.currentFilter.maxPrice === 100);
        priceBtn.classList.toggle('text-amber-800', this.currentFilter.maxPrice === 100);
        this.fetchListings();
      });
    }

    // 5. Search Input
    const searchInput = document.getElementById('search-food-input');
    if (searchInput) {
      let debounceTimer;
      searchInput.addEventListener('input', (e) => {
        clearTimeout(debounceTimer);
        debounceTimer = setTimeout(() => {
          this.currentFilter.search = e.target.value.trim();
          this.fetchListings();
        }, 250);
      });
    }

    // 6. City Selector
    const citySelect = document.getElementById('header-city-select');
    if (citySelect) {
      citySelect.addEventListener('change', (e) => {
        this.currentFilter.city = e.target.value;
        this.fetchListings();
      });
    }

    // 7. View Switcher (List vs Map)
    const listToggle = document.getElementById('view-list-toggle');
    const mapToggle = document.getElementById('view-map-toggle');
    if (listToggle && mapToggle) {
      listToggle.addEventListener('click', () => {
        this.currentView = 'list';
        listToggle.classList.add('bg-white', 'text-slate-900', 'shadow-sm');
        listToggle.classList.remove('text-slate-500');
        mapToggle.classList.remove('bg-white', 'text-slate-900', 'shadow-sm');
        mapToggle.classList.add('text-slate-500');
        document.getElementById('listings-grid-container').classList.remove('hidden');
        document.getElementById('listings-map-container').classList.add('hidden');
      });

      mapToggle.addEventListener('click', () => {
        this.currentView = 'map';
        mapToggle.classList.add('bg-white', 'text-slate-900', 'shadow-sm');
        mapToggle.classList.remove('text-slate-500');
        listToggle.classList.remove('bg-white', 'text-slate-900', 'shadow-sm');
        listToggle.classList.add('text-slate-500');
        document.getElementById('listings-grid-container').classList.add('hidden');
        document.getElementById('listings-map-container').classList.remove('hidden');
        this.renderMapView();
      });
    }
  },

  async fetchListings() {
    const params = new URLSearchParams();
    if (this.currentFilter.donated) params.append('donated', 'true');
    if (this.currentFilter.veg) params.append('veg', 'true');
    if (this.currentFilter.campus) params.append('campus', 'true');
    if (this.currentFilter.maxPrice !== null) params.append('maxPrice', this.currentFilter.maxPrice);
    if (this.currentFilter.search) params.append('search', this.currentFilter.search);
    if (this.currentFilter.city && this.currentFilter.city !== 'all') params.append('city', this.currentFilter.city);

    try {
      const res = await fetch(`/api/listings?${params.toString()}`);
      const data = await res.json();
      if (data.success) {
        this.listings = data.listings;
        this.renderListView();
        if (this.currentView === 'map') {
          this.renderMapView();
        }
      }
    } catch (err) {
      console.error('Error fetching listings:', err);
    }
  },

  renderListView() {
    const container = document.getElementById('listings-grid-container');
    if (!container) return;

    if (this.listings.length === 0) {
      container.innerHTML = `
        <div class="col-span-full text-center py-16">
          <div class="w-16 h-16 mx-auto mb-4 rounded-full bg-amber-50 flex items-center justify-center text-3xl">🍲</div>
          <h3 class="text-xl font-bold text-slate-800 mb-2">No Meals Matching Filters</h3>
          <p class="text-slate-500 text-sm max-w-md mx-auto">Try clearing filters or check back around 8:30 PM when kitchens list closing surplus.</p>
        </div>
      `;
      return;
    }

    container.innerHTML = this.listings.map((item) => {
      const isDonation = item.rescuePrice === 0 || item.isDonation === true;
      const isUrgent = item.minutesRemaining <= 30;
      const isCritical = item.minutesRemaining <= 15;
      const timerClass = isCritical ? 'urgent' : '';

      return `
        <div class="glass-card overflow-hidden flex flex-col group card-3d-tilt ${isDonation ? 'border-2 border-[#E5A93C] bg-gradient-to-b from-amber-50/50 to-white' : ''}" data-id="${item.id}">
          
          <!-- Food Image with Badges -->
          <div class="relative h-48 w-full overflow-hidden bg-slate-100">
            <img 
              src="${item.image}" 
              alt="${item.title}" 
              class="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
              loading="lazy"
            />
            <div class="absolute inset-0 bg-gradient-to-t from-slate-900/60 via-transparent to-black/20"></div>
            
            <!-- Top Badges -->
            <div class="absolute top-3 left-3 flex items-center gap-2">
              ${isDonation ? `
                <span class="diet-badge-annadaan backdrop-blur-md">
                  <span class="diet-dot-annadaan animate-ping"></span>
                  🌾 100% Free Donated Meal
                </span>
              ` : `
                <span class="${item.isVeg ? 'diet-badge-veg' : 'diet-badge-nonveg'} backdrop-blur-md">
                  <span class="${item.isVeg ? 'diet-dot-veg' : 'diet-dot-nonveg'}"></span>
                  ${item.isVeg ? 'Pure Veg' : 'Non-Veg'}
                </span>
              `}
              ${item.isCampus ? `<span class="px-2.5 py-1 text-xs font-semibold rounded-full bg-teal-100 text-teal-900 border border-teal-200 backdrop-blur-md">🏫 Campus</span>` : ''}
            </div>

            <div class="absolute top-3 right-3">
              <span class="px-3 py-1 text-xs font-black rounded-full ${isDonation ? 'bg-[#E5A93C] text-slate-900 shadow-md' : 'bg-[#004D40] text-white shadow-md'}">
                ${isDonation ? 'FREE (100% OFF)' : `${item.discountPercent}% OFF`}
              </span>
            </div>

            <!-- Live Ticking Countdown Pill -->
            <div class="absolute bottom-3 left-3">
              <div class="live-timer-chip ${timerClass}" data-timer-id="${item.id}" data-minutes="${item.minutesRemaining}">
                <span class="inline-block w-2 h-2 rounded-full ${isUrgent ? 'bg-rose-500 animate-ping' : 'bg-amber-500'}"></span>
                <span class="timer-text">${this.formatMinutes(item.minutesRemaining)}</span>
              </div>
            </div>
          </div>

          <!-- Card Content Body -->
          <div class="p-5 flex-1 flex flex-col justify-between">
            <div>
              <div class="flex items-center justify-between text-xs text-slate-500 mb-1.5">
                <span class="font-bold text-slate-700 flex items-center gap-1 truncate max-w-[200px]">
                  ${isDonation ? '🤝' : '🏪'} ${item.restaurantName}
                </span>
                <span class="text-[11px] font-semibold text-slate-400">📍 ${item.distance}</span>
              </div>

              <h3 class="text-base font-bold text-slate-900 group-hover:text-[#004D40] transition-colors mb-2 leading-snug">
                ${item.title}
              </h3>

              <p class="text-slate-600 text-xs line-clamp-2 mb-3 leading-relaxed">
                ${item.description}
              </p>

              <!-- Safety Badge -->
              <div class="p-2 rounded-lg bg-slate-50 border border-slate-200/70 mb-3 flex items-center gap-2 text-[11px] text-slate-700">
                <span class="text-[#004D40] font-bold">🛡️</span>
                <span class="font-medium truncate">${item.safetyBadge}</span>
              </div>

              <!-- Allergens & Dietary Tags -->
              <div class="flex flex-wrap gap-1.5 mb-4">
                ${(item.allergens || []).map(al => `
                  <span class="px-2 py-0.5 rounded text-[10px] bg-slate-100 text-slate-600 border border-slate-200 font-medium">
                    ${al}
                  </span>
                `).join('')}
              </div>
            </div>

            <!-- Pricing & Reserve CTA -->
            <div class="pt-3 border-t border-slate-200/80 flex items-center justify-between">
              <div>
                <div class="text-[10px] text-slate-500 uppercase font-bold tracking-wider">
                  ${isDonation ? 'Donated Community Meal' : 'Surplus Price'}
                </div>
                <div class="flex items-baseline gap-2">
                  ${isDonation ? `
                    <span class="text-2xl font-black text-amber-700">₹0</span>
                    <span class="text-xs text-slate-400 line-through">₹${item.originalPrice}</span>
                  ` : `
                    <span class="text-xl font-extrabold text-slate-900">₹${item.rescuePrice}</span>
                    <span class="text-xs text-slate-400 line-through">₹${item.originalPrice}</span>
                  `}
                </div>
              </div>

              <button 
                onclick="CheckoutModule.openCheckoutModal('${item.id}')"
                class="${isDonation ? 'btn-saffron' : 'btn-emerald'} text-xs font-bold py-2.5 px-4 shadow-sm ${item.availableQuantity <= 0 ? 'opacity-50 pointer-events-none' : ''}"
              >
                ${item.availableQuantity <= 0 ? 'Claimed' : (isDonation ? `🎁 Claim Free (${item.availableQuantity} Left)` : `Reserve (${item.availableQuantity} Left)`)}
              </button>
            </div>
          </div>
        </div>
      `;
    }).join('');

    // Re-initialize 3D perspective tilt on freshly rendered cards
    if (window.init3DCardTilt) {
      window.init3DCardTilt();
    }
  },

  renderMapView() {
    const mapContainer = document.getElementById('listings-map-container');
    if (!mapContainer) return;

    const pinsHtml = this.listings.map((item, idx) => {
      const isDonation = item.rescuePrice === 0 || item.isDonation === true;
      const topPos = 20 + ((idx * 27) % 65);
      const leftPos = 15 + ((idx * 33) % 75);

      return `
        <div 
          class="map-pin group" 
          style="top: ${topPos}%; left: ${leftPos}%;"
          onclick="CheckoutModule.openCheckoutModal('${item.id}')"
        >
          <div class="map-pin-pulse ${isDonation ? '!bg-amber-400/40' : ''}"></div>
          <div class="relative w-10 h-10 rounded-full bg-white border-2 ${isDonation ? 'border-amber-500 shadow-amber-500/40' : 'border-emerald-600 shadow-emerald-500/30'} shadow-lg flex items-center justify-center text-lg">
            ${isDonation ? '🌾' : (item.isVeg ? '🥗' : '🍗')}
          </div>

          <!-- Pin Hover Tooltip -->
          <div class="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 w-52 p-3 rounded-xl bg-white border border-slate-200 shadow-xl opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none z-30">
            <p class="text-xs font-bold text-slate-900 truncate">${item.restaurantName}</p>
            <p class="text-[11px] font-semibold ${isDonation ? 'text-amber-700' : 'text-emerald-700'} truncate">${item.title}</p>
            <div class="flex items-center justify-between mt-1 text-[10px]">
              <span class="font-bold text-slate-700">${isDonation ? '₹0 Free Annadaan' : `₹${item.rescuePrice} (${item.discountPercent}% OFF)`}</span>
              <span class="text-amber-600 font-mono font-bold">${item.minutesRemaining}m left</span>
            </div>
          </div>
        </div>
      `;
    }).join('');

    mapContainer.innerHTML = `
      <div class="glass-map-canvas">
        <div class="map-grid-pattern"></div>
        <div class="relative w-full h-full">
          ${pinsHtml}
        </div>
        <div class="absolute bottom-4 left-4 p-2.5 rounded-xl glass-panel text-xs text-slate-700 flex items-center gap-3 border border-slate-200">
          <div class="flex items-center gap-1">
            <span class="w-3 h-3 rounded-full bg-[#E5A93C] inline-block"></span>
            <span class="font-bold text-amber-800">🌾 Free Donated Meals</span>
          </div>
          <div class="flex items-center gap-1">
            <span class="w-3 h-3 rounded-full bg-[#004D40] inline-block"></span>
            <span>🥗 Vegetarian (Veg)</span>
          </div>
          <div class="flex items-center gap-1">
            <span class="w-3 h-3 rounded-full bg-rose-500 inline-block"></span>
            <span>🍗 Non-Veg</span>
          </div>
        </div>
      </div>
    `;
  },

  startGlobalTimer() {
    this.timerInterval = setInterval(() => {
      const timerElements = document.querySelectorAll('.live-timer-chip');
      timerElements.forEach((chip) => {
        let mins = parseInt(chip.dataset.minutes, 10);
        if (mins > 0) {
          mins -= 1;
          chip.dataset.minutes = mins;
          const textSpan = chip.querySelector('.timer-text');
          if (textSpan) {
            textSpan.textContent = this.formatMinutes(mins);
          }
          if (mins <= 15) {
            chip.classList.add('urgent');
          }
        } else {
          const textSpan = chip.querySelector('.timer-text');
          if (textSpan) {
            textSpan.textContent = 'Closing';
          }
        }
      });
    }, 60000);
  },

  formatMinutes(mins) {
    if (mins <= 0) return 'Closing';
    const h = Math.floor(mins / 60);
    const m = mins % 60;
    if (h > 0) {
      return `${h}h ${m}m left`;
    }
    return `${m}m left`;
  }
};

document.addEventListener('DOMContentLoaded', () => {
  DiscoveryModule.init();
});
