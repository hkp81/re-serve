/**
 * ngo-dashboard.js - NGO & Volunteer Humanitarian Portal (Zero Hunger / ₹0 Claim)
 * Allows registered NGOs and student volunteers to claim zero-rupee food batches,
 * assign delivery volunteers, and track the number of people fed.
 */

(function () {
  async function initNgoDashboard() {
    loadNgoBatches();
    loadDistributionImpact();
  }

  async function loadNgoBatches() {
    const listContainer = document.getElementById('ngo-batches-list');
    if (!listContainer) return;

    try {
      const res = await fetch('/api/meals?type=donate');
      const data = await res.json();
      const donateMeals = data.data || [];

      if (donateMeals.length === 0) {
        listContainer.innerHTML = `
          <div class="glass-card" style="padding: 2rem; text-align: center; grid-column: 1/-1;">
            <p style="color: var(--text-muted);">All donation batches have been claimed for today! Check back soon or list fresh surplus.</p>
          </div>
        `;
        return;
      }

      listContainer.innerHTML = donateMeals.map(m => `
        <div class="glass-card" style="padding: 1.25rem; border-left: 4px solid var(--emerald-primary);">
          <div style="display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 0.5rem;">
            <div>
              <span class="venue-tag" style="background: rgba(16,185,129,0.2); color: #34d399; font-weight: 700;">₹0 Humanitarian Batch</span>
              <h4 style="color: #fff; font-size: 1.1rem; margin-top: 0.35rem;">${m.title}</h4>
              <p style="color: var(--emerald-primary); font-size: 0.8rem; font-weight: 600;">📍 ${m.partnerName} (${m.location.address})</p>
            </div>
            <div style="text-align: right;">
              <span style="font-size: 1.3rem; font-weight: 800; color: #34d399;">${m.portions} Meals</span>
              <span style="display: block; font-size: 0.72rem; color: var(--text-muted);">${m.weightKg} kg weight</span>
            </div>
          </div>

          <p style="font-size: 0.8rem; color: var(--text-muted); margin-bottom: 0.85rem; background: rgba(0,0,0,0.2); padding: 0.5rem; border-radius: var(--radius-sm);">
            <strong>Storage & Condition:</strong> ${m.storageTemp} &bull; ${m.condition}
          </p>

          <div style="display: flex; justify-content: space-between; align-items: center;">
            <div style="font-size: 0.75rem; color: var(--amber-warning); font-weight: 600;">
              ⏳ Expiry Countdown Active
            </div>
            <button class="btn-action-primary btn-action-donate" onclick="window.CheckoutModule.openCheckout('${m.id}')">
              🤝 Claim for NGO Distribution
            </button>
          </div>
        </div>
      `).join('');
    } catch (err) {
      console.error('Failed to load NGO batches:', err);
    }
  }

  async function loadDistributionImpact() {
    try {
      const res = await fetch('/api/stats');
      const stats = await res.json();

      const fedEl = document.getElementById('ngo-impact-people-fed');
      const mealsEl = document.getElementById('ngo-impact-meals');
      const co2El = document.getElementById('ngo-impact-co2');

      if (fedEl) fedEl.textContent = Number(stats.peopleFed || 0).toLocaleString();
      if (mealsEl) mealsEl.textContent = Number(stats.totalMealsServed || 0).toLocaleString();
      if (co2El) co2El.textContent = Number(stats.co2PreventedKg || 0).toLocaleString() + ' kg';
    } catch (err) {
      console.error('Impact stats load error:', err);
    }
  }

  window.NgoModule = {
    init: initNgoDashboard,
    refresh: loadNgoBatches
  };
})();
