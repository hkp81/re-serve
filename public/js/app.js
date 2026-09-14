/**
 * app.js - Main Application Orchestrator for Re-serve (Serving Again)
 * Controls navigation tabs, Auth / Login system, Leaderboards, 3D mouse shine glare, Stats, and Toasts.
 */

(function () {
  let heroStackInstance = null;
  let currentUser = null;

  function initApp() {
    setupTabNavigation();
    setupAuthSystem();
    setupSponsorModal();
    setupLeaderboardControls();
    setupGlobalGlassShine();
    loadPlatformStats();
    loadFoodHeroes();
    loadSponsors('all');

    // Initialize module dependencies
    if (window.DiscoveryModule) window.DiscoveryModule.init();
    if (window.PartnerModule) window.PartnerModule.init();
    if (window.NgoModule) window.NgoModule.init();
  }

  // --- AUTH & LOGIN SYSTEM ---
  function setupAuthSystem() {
    // Check saved session
    try {
      const saved = localStorage.getItem('reserve_user');
      if (saved) {
        currentUser = JSON.parse(saved);
      }
    } catch (e) {
      console.warn('Session parse error:', e);
    }

    updateNavUser();

    // Setup Login Form
    const loginForm = document.getElementById('login-form');
    if (loginForm) {
      loginForm.addEventListener('submit', (e) => {
        e.preventDefault();
        const email = document.getElementById('login-email')?.value || 'user@reserve.org';
        const roleBtn = document.querySelector('.auth-role-btn.active');
        const role = roleBtn?.dataset.role || 'diner';

        let name = 'Conscious Diner';
        let badge = 'Conscious Diner';
        let avatar = 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=120&auto=format&fit=crop&q=80';

        if (role === 'partner') {
          name = 'Grand Heritage Hostel Mess';
          badge = 'Verified Partner';
          avatar = 'https://images.unsplash.com/photo-1577219491135-ce391730fb2c?w=120&auto=format&fit=crop&q=80';
        } else if (role === 'ngo') {
          name = 'Asha Community Shelter';
          badge = 'NGO Lead';
          avatar = 'https://images.unsplash.com/photo-1583394838336-acd977736f90?w=120&auto=format&fit=crop&q=80';
        }

        login({ name, email, role, badge, avatar });
      });
    }

    // Role switcher pills in modal
    const roleBtns = document.querySelectorAll('.auth-role-btn');
    roleBtns.forEach(btn => {
      btn.addEventListener('click', () => {
        roleBtns.forEach(b => b.classList.remove('active'));
        btn.classList.add('active');
      });
    });
  }

  function login(user) {
    currentUser = user;
    try {
      localStorage.setItem('reserve_user', JSON.stringify(user));
    } catch (e) {}

    updateNavUser();
    closeLoginModal();
    showToast('Signed In Successfully!', `Welcome back, ${user.name} (${user.badge})`, 'success');

    // Auto navigate to relevant section
    if (user.role === 'partner') {
      switchTab('partner');
    } else if (user.role === 'ngo') {
      switchTab('ngo');
    }
  }

  function logout() {
    currentUser = null;
    try {
      localStorage.removeItem('reserve_user');
    } catch (e) {}
    updateNavUser();
    showToast('Signed Out', 'You have been logged out securely.', 'info');
  }

  function demoLogin(role) {
    if (role === 'partner') {
      login({
        name: 'Grand Heritage Hostel Mess',
        email: 'kitchen@grandheritage.edu',
        role: 'partner',
        badge: 'Verified Food Partner',
        avatar: 'https://images.unsplash.com/photo-1577219491135-ce391730fb2c?w=120&auto=format&fit=crop&q=80'
      });
    } else if (role === 'ngo') {
      login({
        name: 'Robin Hood / Asha Shelter',
        email: 'volunteers@ashacommunity.org',
        role: 'ngo',
        badge: 'Verified NGO Lead',
        avatar: 'https://images.unsplash.com/photo-1583394838336-acd977736f90?w=120&auto=format&fit=crop&q=80'
      });
    } else {
      login({
        name: 'Aarav Sharma',
        email: 'aarav.sharma@gmail.com',
        role: 'diner',
        badge: 'Conscious Diner',
        avatar: 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=120&auto=format&fit=crop&q=80'
      });
    }
  }

  function updateNavUser() {
    const navActions = document.getElementById('nav-user-container');
    if (!navActions) return;

    if (currentUser) {
      navActions.innerHTML = `
        <div style="display: flex; align-items: center; gap: 0.5rem;">
          <button class="user-profile-btn" onclick="window.AppModule.showUserProfile()">
            <img src="${currentUser.avatar}" alt="${currentUser.name}" class="user-avatar-mini">
            <span>${currentUser.name.split(' ')[0]}</span>
            <span class="venue-tag" style="background: var(--emerald-light); color: var(--emerald-dark); font-size: 0.68rem;">${currentUser.badge}</span>
          </button>
          <button class="btn-scanner-quick" onclick="window.AppModule.logout()" title="Sign Out" style="padding: 0.5rem 0.75rem;">
            🚪
          </button>
        </div>
      `;
    } else {
      navActions.innerHTML = `
        <button class="user-profile-btn" onclick="window.AppModule.openLoginModal()">
          👤 Sign In / Join
        </button>
      `;
    }
  }

  function openLoginModal() {
    const modal = document.getElementById('login-modal');
    if (modal) modal.classList.add('active');
  }

  function closeLoginModal() {
    const modal = document.getElementById('login-modal');
    if (modal) modal.classList.remove('active');
  }

  function showUserProfile() {
    if (!currentUser) return openLoginModal();
    showToast(`Profile: ${currentUser.name}`, `Role: ${currentUser.badge} &bull; Email: ${currentUser.email}`, 'info');
  }

  // --- GLOBAL SHINY GLASS REFLECTION TRACKER ---
  function setupGlobalGlassShine() {
    const panels = document.querySelectorAll('.glass-panel, .glass-card');
    panels.forEach(panel => {
      panel.addEventListener('mousemove', (e) => {
        const rect = panel.getBoundingClientRect();
        const x = e.clientX - rect.left;
        const y = e.clientY - rect.top;
        panel.style.setProperty('--mouse-x', `${x}px`);
        panel.style.setProperty('--mouse-y', `${y}px`);
      });
    });
  }

  // --- TAB NAVIGATION ---
  function setupTabNavigation() {
    const tabBtns = document.querySelectorAll('.nav-tab-btn');
    tabBtns.forEach(btn => {
      btn.addEventListener('click', () => {
        const tab = btn.dataset.tab;
        switchTab(tab);
      });
    });
  }

  function switchTab(tabId) {
    const tabBtns = document.querySelectorAll('.nav-tab-btn');
    tabBtns.forEach(b => {
      if (b.dataset.tab === tabId) {
        b.classList.add('active');
      } else {
        b.classList.remove('active');
      }
    });

    const sections = document.querySelectorAll('.view-section');
    sections.forEach(sec => {
      if (sec.id === `view-${tabId}`) {
        sec.classList.add('active');
      } else {
        sec.classList.remove('active');
      }
    });

    if (tabId === 'discovery' && window.DiscoveryModule) {
      window.DiscoveryModule.refresh();
    } else if (tabId === 'ngo' && window.NgoModule) {
      window.NgoModule.refresh();
    } else if (tabId === 'tracking' && window.SimulatorModule) {
      window.SimulatorModule.init();
    } else if (tabId === 'leaderboards') {
      loadFoodHeroes();
      loadSponsors('all');
    }

    setTimeout(setupGlobalGlassShine, 150);
  }

  // --- STATS TICKER ---
  async function loadPlatformStats() {
    try {
      const res = await fetch('/api/stats');
      const stats = await res.json();

      const kgEl = document.getElementById('stat-kg-saved');
      const mealsEl = document.getElementById('stat-meals-served');
      const co2El = document.getElementById('stat-co2-prevented');
      const peopleEl = document.getElementById('stat-people-fed');

      if (kgEl) kgEl.textContent = Number(stats.totalKgSaved || 0).toLocaleString() + ' kg';
      if (mealsEl) mealsEl.textContent = Number(stats.totalMealsServed || 0).toLocaleString();
      if (co2El) co2El.textContent = Number(stats.co2PreventedKg || 0).toLocaleString() + ' kg';
      if (peopleEl) peopleEl.textContent = Number(stats.peopleFed || 0).toLocaleString();
    } catch (err) {
      console.error('Stats loading failed:', err);
    }
  }

  // --- FOOD HERO LEADERBOARD ---
  async function loadFoodHeroes() {
    const container = document.getElementById('hero-cards-deck');
    if (!container) return;

    try {
      const res = await fetch('/api/leaderboards/heroes');
      const data = await res.json();
      const heroes = data.heroes || [];

      container.innerHTML = heroes.map((h, idx) => {
        const isChamp = idx === 0;
        return `
          <div class="spread-card ${isChamp ? 'champion' : ''}" data-index="${idx}">
            ${isChamp ? '<div class="champion-crown">★ FOOD HERO 🌟</div>' : ''}
            <div class="spread-card-header">
              <img src="${h.avatar}" alt="${h.name}" class="hero-avatar">
              <div>
                <h3 class="hero-name">${h.name}</h3>
                <p class="hero-subtitle-tag">${h.donorType} &bull; ${h.city}</p>
              </div>
            </div>

            <div class="hero-metric-grid">
              <div class="metric-box">
                <span style="color: var(--emerald-dark);">${h.totalWeightKg} kg</span>
                <label>Weight Saved</label>
              </div>
              <div class="metric-box">
                <span style="color: var(--orange-primary);">${h.totalMealsDonated}</span>
                <label>Meals Donated</label>
              </div>
              <div class="metric-box">
                <span style="color: #0f172a;">${h.peopleFed}</span>
                <label>People Fed</label>
              </div>
            </div>

            <p class="hero-quote">"${h.quote || 'Leading with compassion and zero waste.'}"</p>
          </div>
        `;
      }).join('');

      heroStackInstance = new window.StackSpreadCards('hero-cards-deck', {
        spreadMode: 'fan',
        autoSpreadOnHover: true
      });

    } catch (err) {
      console.error('Food Heroes load error:', err);
    }
  }

  // --- SPONSOR LEADERBOARD ---
  async function loadSponsors(level = 'all') {
    const tbody = document.getElementById('sponsors-table-body');
    if (!tbody) return;

    try {
      const res = await fetch(`/api/leaderboards/sponsors?level=${level}`);
      const data = await res.json();
      const sponsors = data.sponsors || [];

      if (sponsors.length === 0) {
        tbody.innerHTML = `<tr><td colspan="5" style="text-align: center; color: var(--text-muted); padding: 1.5rem;">No sponsors registered under this geographic tier yet.</td></tr>`;
        return;
      }

      tbody.innerHTML = sponsors.map((s, idx) => {
        const rankClass = idx === 0 ? 'rank-1' : (idx === 1 ? 'rank-2' : (idx === 2 ? 'rank-3' : 'rank-other'));
        return `
          <tr>
            <td><span class="rank-badge ${rankClass}">#${idx + 1}</span></td>
            <td>
              <div style="display: flex; align-items: center; gap: 0.75rem;">
                <img src="${s.avatar}" style="width: 36px; height: 36px; border-radius: 50%; object-fit: cover; border: 2px solid var(--emerald-primary);">
                <div>
                  <strong style="color: #0f172a; font-size: 0.9rem;">${s.name}</strong>
                  <div style="font-size: 0.74rem; color: var(--text-muted);">${s.role}</div>
                </div>
              </div>
            </td>
            <td>
              <span style="color: var(--orange-primary); font-weight: 800; font-size: 0.98rem;">
                ${s.mealsSponsored} Meals
              </span>
              <span style="font-size: 0.72rem; color: var(--text-muted); display: block;">₹${(s.amountDonated || s.mealsSponsored * 30).toLocaleString()} funded</span>
            </td>
            <td>
              <span style="color: #0f172a; font-size: 0.85rem; font-weight: 600;">${s.city} &bull; ${s.district}</span>
              <span style="display: block; font-size: 0.72rem; color: var(--text-muted);">${s.state}, ${s.country}</span>
            </td>
            <td>
              <span class="venue-tag" style="background: var(--orange-light); color: var(--orange-hover); font-weight: 800;">
                ${s.badge || s.tier}
              </span>
            </td>
          </tr>
        `;
      }).join('');
    } catch (err) {
      console.error('Failed to load sponsors:', err);
    }
  }

  function setupLeaderboardControls() {
    const spreadBtn = document.getElementById('btn-toggle-spread');
    if (spreadBtn) {
      spreadBtn.addEventListener('click', () => {
        if (heroStackInstance) {
          const isNowSpread = heroStackInstance.toggleSpread();
          spreadBtn.classList.toggle('active', isNowSpread);
          spreadBtn.classList.toggle('locked-spread', isNowSpread);
          spreadBtn.textContent = isNowSpread ? 'Deck: Spread View (Fan)' : 'Deck: Stacked View';
        }
      });
    }

    const tierBtns = document.querySelectorAll('.sponsor-tier-btn');
    tierBtns.forEach(btn => {
      btn.addEventListener('click', () => {
        tierBtns.forEach(b => b.classList.remove('active'));
        btn.classList.add('active');
        loadSponsors(btn.dataset.tier);
      });
    });
  }

  // --- SPONSOR A MEAL MODAL ---
  function setupSponsorModal() {
    const form = document.getElementById('sponsor-meal-form');
    if (form) {
      form.addEventListener('submit', handleSponsorSubmit);
    }

    const mealInput = document.getElementById('sponsor-meal-count');
    const amountPreview = document.getElementById('sponsor-amount-preview');
    if (mealInput && amountPreview) {
      mealInput.addEventListener('input', () => {
        const count = parseInt(mealInput.value, 10) || 1;
        amountPreview.textContent = `₹${count * 30}`;
      });
    }
  }

  function openSponsorModal() {
    const modal = document.getElementById('sponsor-modal');
    if (modal) modal.classList.add('active');
  }

  function closeSponsorModal() {
    const modal = document.getElementById('sponsor-modal');
    if (modal) modal.classList.remove('active');
  }

  async function handleSponsorSubmit(e) {
    e.preventDefault();
    const name = document.getElementById('sponsor-name')?.value;
    const role = document.getElementById('sponsor-role')?.value;
    const count = parseInt(document.getElementById('sponsor-meal-count')?.value, 10) || 10;
    const city = document.getElementById('sponsor-city')?.value || 'Noida';
    const district = document.getElementById('sponsor-district')?.value || 'Gautam Buddha Nagar';
    const state = document.getElementById('sponsor-state')?.value || 'Uttar Pradesh';
    const country = document.getElementById('sponsor-country')?.value || 'India';

    try {
      const res = await fetch('/api/sponsor', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name,
          role,
          mealCount: count,
          city,
          district,
          state,
          country
        })
      });

      const data = await res.json();
      if (res.ok && data.success) {
        showToast('Sponsorship Received!', `Thank you for sponsoring ${count} wholesome meals!`, 'success');
        closeSponsorModal();
        loadPlatformStats();
        loadSponsors('all');
      } else {
        showToast('Error', data.error || 'Could not process donation', 'error');
      }
    } catch (err) {
      console.error('Sponsor submission error:', err);
      showToast('Error', 'Server connection failed', 'error');
    }
  }

  // --- TOAST NOTIFICATIONS ---
  function showToast(title, message, type = 'info') {
    const container = document.getElementById('toast-container');
    if (!container) return;

    const toast = document.createElement('div');
    toast.className = `toast ${type}`;
    toast.innerHTML = `
      <div style="font-size: 1.35rem;">
        ${type === 'success' ? '✅' : (type === 'error' ? '❌' : '🌱')}
      </div>
      <div>
        <div style="font-weight: 800; color: #0f172a;">${title}</div>
        <div style="color: var(--text-muted); font-size: 0.8rem;">${message}</div>
      </div>
    `;

    container.appendChild(toast);
    setTimeout(() => {
      toast.style.opacity = '0';
      toast.style.transform = 'translateX(100%)';
      setTimeout(() => toast.remove(), 300);
    }, 4000);
  }

  window.AppModule = {
    init: initApp,
    switchTab,
    refreshStats: loadPlatformStats,
    openSponsorModal,
    closeSponsorModal,
    openLoginModal,
    closeLoginModal,
    showUserProfile,
    demoLogin,
    logout,
    showToast,
    setupGlobalGlassShine,
    getCurrentUser: () => currentUser
  };

  window.addEventListener('DOMContentLoaded', initApp);
})();