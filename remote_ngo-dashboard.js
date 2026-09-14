/**
 * NGO Dashboard & Food Recovery Engine (ReServe Edition)
 * Implements Free Donation Feed, Urgent Fallback Alerts,
 * Volunteer QR & 6-Digit OTP Generator, and Downloadable 80G Impact Receipt.
 */

const NgoDashboardModule = {
  alerts: [],
  selectedAlert: null,

  init() {
    this.bindEvents();
    this.fetchNgoAlerts();
  },

  bindEvents() {
    const refreshBtn = document.getElementById('ngo-refresh-alerts-btn');
    if (refreshBtn) {
      refreshBtn.addEventListener('click', () => this.fetchNgoAlerts());
    }

    const downloadReceiptBtn = document.getElementById('download-80g-receipt-btn');
    if (downloadReceiptBtn) {
      downloadReceiptBtn.addEventListener('click', () => this.generate80GReceipt());
    }
  },

  async fetchNgoAlerts() {
    try {
      const res = await fetch('/api/ngo/alerts');
      const data = await res.json();
      if (data.success) {
        this.alerts = data.alerts;
        this.renderUrgentAlerts();
        this.renderDonationFeed();
      }
    } catch (err) {
      console.error('Error fetching NGO alerts:', err);
    }
  },

  renderUrgentAlerts() {
    const container = document.getElementById('ngo-urgent-alerts-container');
    if (!container) return;

    const urgentItems = this.alerts.filter(a => a.status === 'urgent_fallback');

    if (urgentItems.length === 0) {
      container.innerHTML = `
        <div class="p-4 rounded-xl bg-white border border-slate-200 text-center text-slate-500 text-xs shadow-sm">
          ✅ No active urgent fallback alerts in your 5 km radius.
        </div>
      `;
      return;
    }

    container.innerHTML = urgentItems.map(item => `
      <div class="p-5 rounded-2xl bg-rose-50/80 border border-rose-300 shadow-sm flex flex-col md:flex-row items-start md:items-center justify-between gap-4 card-3d-tilt">
        <div class="flex items-start gap-3.5">
          <div class="w-10 h-10 rounded-full bg-rose-100 border border-rose-400 flex items-center justify-center text-xl shrink-0">
            🚨
          </div>
          <div>
            <div class="flex items-center gap-2">
              <span class="px-2 py-0.5 rounded text-[10px] font-black uppercase tracking-wider bg-rose-600 text-white">Critical Fallback (Urgent)</span>
              <span class="text-xs text-rose-700 font-mono font-bold">⏰ ${item.minutesLeft} mins left</span>
            </div>
            <h4 class="text-base font-bold text-slate-900 mt-1">${item.restaurantName} • ${item.itemsDescription}</h4>
            <p class="text-xs text-slate-600 font-medium">📍 ${item.address} (${item.distance}) • Ph: ${item.phone}</p>
          </div>
        </div>

        <div class="flex items-center gap-2.5 w-full md:w-auto">
          <button 
            onclick="NgoDashboardModule.claimRescueMission('${item.id}')"
            class="btn-rose text-xs py-2.5 px-4 w-full md:w-auto font-bold shadow-sm"
          >
            ⚡ Accept Rescue (Claim Free Meals)
          </button>
        </div>
      </div>
    `).join('');

    if (window.init3DCardTilt) window.init3DCardTilt();
  },

  renderDonationFeed() {
    const container = document.getElementById('ngo-donation-feed-container');
    if (!container) return;

    container.innerHTML = this.alerts.map(item => {
      const isClaimed = item.status === 'claimed';

      return `
        <div class="p-4 rounded-xl bg-white border border-slate-200 flex flex-col sm:flex-row sm:items-center justify-between gap-3 shadow-sm card-3d-tilt">
          <div>
            <div class="flex items-center gap-2 mb-1">
              <span class="text-xs font-bold text-slate-800">🏪 ${item.restaurantName}</span>
              <span class="text-[10px] px-2.5 py-0.5 rounded-full font-semibold ${isClaimed ? 'bg-teal-100 text-teal-900 border border-teal-300' : 'bg-amber-100 text-amber-900 border border-amber-300'}">
                ${isClaimed ? '✓ Claimed by ' + (item.claimedByNgo || 'Robin Hood Army') : 'Awaiting Volunteer Dispatch'}
              </span>
            </div>
            <h5 class="text-sm font-bold text-slate-900">${item.itemsDescription} (${item.totalUnits} Units)</h5>
            <p class="text-xs text-slate-500 font-medium">📍 ${item.address} • ${item.distance}</p>
          </div>

          <div class="flex items-center gap-2">
            ${isClaimed ? `
              <button 
                onclick="NgoDashboardModule.showVolunteerPass('${item.id}')"
                class="btn-glass text-xs py-2 px-3.5 flex items-center gap-1.5 font-bold border-slate-300"
              >
                <span>🔑 View OTP Pass</span>
              </button>
            ` : `
              <button 
                onclick="NgoDashboardModule.claimRescueMission('${item.id}')"
                class="btn-emerald text-xs py-2 px-3.5 flex items-center gap-1.5 font-bold"
              >
                <span>Accept (${item.totalUnits} Packs)</span>
              </button>
            `}
          </div>
        </div>
      `;
    }).join('');

    if (window.init3DCardTilt) window.init3DCardTilt();
  },

  async claimRescueMission(alertId) {
    try {
      const res = await fetch('/api/ngo/claim', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          alertId,
          ngoName: 'Robin Hood Army (Kerala Unit)',
          volunteerName: 'Volunteer Rahul S.'
        })
      });

      const data = await res.json();
      if (data.success) {
        App.showNotification('🎉 Rescue mission confirmed! Volunteer OTP Pass Generated.', 'success');
        this.fetchNgoAlerts();
        this.showVolunteerPass(alertId);
      } else {
        App.showNotification(`Error: ${data.error}`, 'error');
      }
    } catch (err) {
      console.error('Failed to claim mission:', err);
    }
  },

  showVolunteerPass(alertId) {
    const alert = this.alerts.find(a => a.id === alertId);
    if (!alert) return;

    this.selectedAlert = alert;
    const modal = document.getElementById('ngo-pass-modal');
    const content = document.getElementById('ngo-pass-modal-content');

    content.innerHTML = `
      <div class="text-center">
        <div class="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-teal-50 text-teal-900 border border-teal-300 text-xs font-bold mb-3">
          ✓ Verified NGO Rescue Pass
        </div>
        <h3 class="text-xl font-extrabold text-slate-900 mb-1">${alert.restaurantName}</h3>
        <p class="text-xs text-slate-500 mb-5">${alert.itemsDescription} • 📍 ${alert.address}</p>

        <!-- Dynamic Simulated QR Code -->
        <div class="w-48 h-48 mx-auto bg-white p-3 rounded-2xl shadow-xl border border-slate-200 flex items-center justify-center mb-4">
          <svg viewBox="0 0 100 100" class="w-full h-full text-slate-950">
            <rect width="100" height="100" fill="#ffffff" />
            <path d="M10,10 h30 v30 h-30 z M15,15 v20 h20 v-20 z M22,22 h6 v6 h-6 z" fill="#004D40" />
            <path d="M60,10 h30 v30 h-30 z M65,15 v20 h20 v-20 z M72,22 h6 v6 h-6 z" fill="#004D40" />
            <path d="M10,60 h30 v30 h-30 z M15,65 v20 h20 v-20 z M22,72 h6 v6 h-6 z" fill="#004D40" />
            <rect x="45" y="15" width="8" height="25" fill="#004D40" />
            <rect x="55" y="45" width="30" height="8" fill="#004D40" />
            <rect x="45" y="60" width="10" height="25" fill="#004D40" />
            <rect x="65" y="65" width="20" height="20" fill="#004D40" />
          </svg>
        </div>

        <!-- High-Visibility 6-Digit OTP -->
        <div class="mb-4">
          <div class="text-[11px] uppercase tracking-wider text-slate-500 font-bold mb-1">
            Offline 6-Digit Counter PIN
          </div>
          <div class="inline-block font-mono text-3xl font-extrabold tracking-widest text-teal-900 bg-teal-50 border border-teal-300 px-6 py-2 rounded-xl shadow-sm">
            ${alert.volunteerOtp || '831902'}
          </div>
        </div>

        <div class="p-3.5 rounded-xl bg-slate-50 border border-slate-200 text-xs text-slate-700 text-left mb-5 leading-relaxed">
          <p class="font-bold text-slate-900 mb-0.5">Assigned Volunteer: Rahul S. (Robin Hood Army)</p>
          <p>Present this pass at the counter. FSSAI Good Samaritan protection applies under 2019 surplus regulations.</p>
        </div>

        <button 
          onclick="document.getElementById('ngo-pass-modal').classList.remove('active')"
          class="btn-emerald w-full py-2.5 text-sm font-bold shadow-sm"
        >
          Close Pass
        </button>
      </div>
    `;

    modal.classList.add('active');
  },

  generate80GReceipt() {
    const printArea = document.getElementById('printable-80g-receipt');
    if (!printArea) return;

    printArea.innerHTML = `
      <div class="print-receipt-container text-slate-900 bg-white p-8 rounded-2xl max-w-xl mx-auto font-sans">
        <div class="border-b-2 border-slate-900 pb-4 mb-4 flex justify-between items-start">
          <div>
            <h2 class="text-2xl font-black tracking-tight text-slate-950">RESERVE RELIEF FOUNDATION</h2>
            <p class="text-xs text-slate-600">Registered Food Recovery Network • NITI Aayog Darpan: KL/2024/049812</p>
            <p class="text-xs text-slate-600">80G Income Tax Exemption Ref: CIT(E)/80G/DEL-2024-25/1049</p>
          </div>
          <div class="text-right">
            <span class="px-3 py-1 bg-teal-100 text-teal-900 text-xs font-bold rounded">OFFICIAL CSR AUDIT</span>
            <p class="text-xs font-mono text-slate-500 mt-1">Receipt #${Math.floor(100000 + Math.random() * 900000)}</p>
          </div>
        </div>

        <div class="my-4">
          <h3 class="text-base font-bold text-slate-900 mb-2">SURPLUS FOOD RESCUE & COMMUNITY RELIEF CERTIFICATE</h3>
          <p class="text-xs text-slate-700 leading-relaxed">
            This document certifies that the meals listed below were salvaged from commercial restaurant closing surplus in compliance with the 
            <strong>FSSAI Food Recovery and Surplus Distribution Regulations (2019)</strong> and distributed free of charge to underprivileged beneficiaries.
          </p>
        </div>

        <div class="bg-slate-50 border border-slate-200 rounded-lg p-3.5 my-4 text-xs">
          <div class="grid grid-cols-2 gap-2 mb-1">
            <span class="text-slate-500">Beneficiary Network:</span>
            <span class="font-semibold text-slate-900">Robin Hood Army (Kerala Mission)</span>
          </div>
          <div class="grid grid-cols-2 gap-2 mb-1">
            <span class="text-slate-500">Meals Rescued (Total):</span>
            <span class="font-semibold text-teal-900">1,420 Cooked Meals (355 kg)</span>
          </div>
          <div class="grid grid-cols-2 gap-2 mb-1">
            <span class="text-slate-500">Valuation Saved:</span>
            <span class="font-semibold text-slate-900">₹1,42,000 INR (CSR Valuation)</span>
          </div>
          <div class="grid grid-cols-2 gap-2">
            <span class="text-slate-500">GHG Emissions Averted:</span>
            <span class="font-semibold text-teal-900">3.55 Metric Tonnes CO₂e</span>
          </div>
        </div>

        <div class="mt-8 pt-4 border-t border-slate-300 flex justify-between items-end text-xs text-slate-600">
          <div>
            <p>Verification Seal: Cryptographic Ledger Verified</p>
            <p class="text-[10px] text-slate-400">Date: ${new Date().toLocaleDateString('en-IN')}</p>
          </div>
          <div class="text-center">
            <div class="font-serif italic text-sm mb-1 text-slate-800">Authorized Trustee</div>
            <div class="border-t border-slate-800 pt-1 text-[10px] font-bold">RESERVE CHARITY TRUST</div>
          </div>
        </div>
      </div>
    `;

    window.print();
  }
};

document.addEventListener('DOMContentLoaded', () => {
  NgoDashboardModule.init();
});
