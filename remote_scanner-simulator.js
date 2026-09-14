/**
 * Merchant Verification Scanner Simulator
 * Simulates a restaurant cashier scanning QR tokens or entering
 * 6-digit backup PINs with instant auditory/visual validation.
 */

const ScannerSimulatorModule = {
  init() {
    this.bindEvents();
  },

  bindEvents() {
    const scanBtn = document.getElementById('simulate-scan-verify-btn');
    const otpInput = document.getElementById('scanner-code-input');

    if (scanBtn && otpInput) {
      scanBtn.addEventListener('click', () => {
        const code = otpInput.value.trim();
        if (!code) {
          App.showNotification('Please enter a 6-digit OTP or scan a pass', 'error');
          return;
        }
        this.verifyCode(code);
      });

      otpInput.addEventListener('keypress', (e) => {
        if (e.key === 'Enter') {
          scanBtn.click();
        }
      });
    }

    // Quick Test Fill Button
    const quickFillBtn = document.getElementById('scanner-quick-fill-btn');
    if (quickFillBtn && otpInput) {
      quickFillBtn.addEventListener('click', () => {
        otpInput.value = '749201'; // Default seed order OTP
        scanBtn.click();
      });
    }

    // Close Simulator Modal
    const closeBtn = document.getElementById('close-scanner-modal-btn');
    if (closeBtn) {
      closeBtn.addEventListener('click', () => {
        document.getElementById('scanner-modal').classList.remove('active');
      });
    }
  },

  openSimulatorWithPass(code) {
    const modal = document.getElementById('scanner-modal');
    const input = document.getElementById('scanner-code-input');
    if (input && code) {
      input.value = code;
    }
    modal.classList.add('active');
  },

  async verifyCode(code) {
    const resultBox = document.getElementById('scanner-result-box');
    resultBox.innerHTML = `
      <div class="flex items-center justify-center gap-2 text-white/60 py-3">
        <div class="w-4 h-4 border-2 border-emerald-600 border-t-transparent rounded-full animate-spin"></div>
        <span class="text-xs text-slate-600 font-medium">Validating token with ReServe ledger...</span>
      </div>
    `;

    try {
      const res = await fetch('/api/verify/scan', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ tokenOrOtp: code })
      });

      const data = await res.json();

      if (data.success && data.valid) {
        this.playAudioChime('success');
        resultBox.innerHTML = `
          <div class="p-4 rounded-xl bg-emerald-500/20 border border-emerald-400 text-center animate-fadeIn">
            <div class="w-12 h-12 mx-auto mb-2 rounded-full bg-emerald-400 text-slate-950 flex items-center justify-center text-2xl font-black">
              ✓
            </div>
            <h4 class="text-base font-bold text-white mb-1">VERIFICATION APPROVED!</h4>
            <p class="text-xs text-emerald-300 font-semibold mb-2">Order #${data.order.id} • Hand over meal pack</p>
            <div class="text-[11px] text-white/70 bg-black/30 p-2 rounded-lg text-left">
              <p>🍽️ <strong>Meal:</strong> ${data.order.title}</p>
              <p>👤 <strong>Customer:</strong> ${data.order.customerName}</p>
              <p>⏰ <strong>Collected at:</strong> ${new Date(data.order.collectedAt).toLocaleTimeString()}</p>
            </div>
          </div>
        `;
        App.showNotification('✓ Pass Redeemed! Meal marked as collected.', 'success');
      } else {
        this.playAudioChime('error');
        resultBox.innerHTML = `
          <div class="p-4 rounded-xl bg-rose-500/20 border border-rose-500 text-center animate-fadeIn">
            <div class="w-12 h-12 mx-auto mb-2 rounded-full bg-rose-500 text-white flex items-center justify-center text-2xl font-black">
              ✕
            </div>
            <h4 class="text-base font-bold text-white mb-1">PASS REJECTED</h4>
            <p class="text-xs text-rose-300 font-semibold">${data.error || 'Invalid or Expired Pass'}</p>
          </div>
        `;
        App.showNotification(`Verification Failed: ${data.error}`, 'error');
      }
    } catch (err) {
      console.error('Scan error:', err);
      resultBox.innerHTML = `<div class="p-3 text-xs text-rose-400 text-center">Network error verifying pass.</div>`;
    }
  },

  // Synthesize pleasant sound effect using Web Audio API (Zero external assets)
  playAudioChime(type) {
    try {
      const AudioCtx = window.AudioContext || window.webkitAudioContext;
      if (!AudioCtx) return;
      const ctx = new AudioCtx();

      if (type === 'success') {
        const osc1 = ctx.createOscillator();
        const osc2 = ctx.createOscillator();
        const gain = ctx.createGain();

        osc1.type = 'sine';
        osc2.type = 'triangle';
        osc1.frequency.setValueAtTime(587.33, ctx.currentTime); // D5
        osc1.frequency.setValueAtTime(880, ctx.currentTime + 0.12); // A5

        gain.gain.setValueAtTime(0.15, ctx.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.4);

        osc1.connect(gain);
        gain.connect(ctx.destination);
        osc1.start();
        osc1.stop(ctx.currentTime + 0.4);
      } else {
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.type = 'sawtooth';
        osc.frequency.setValueAtTime(220, ctx.currentTime);
        osc.frequency.setValueAtTime(160, ctx.currentTime + 0.15);

        gain.gain.setValueAtTime(0.15, ctx.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.35);

        osc.connect(gain);
        gain.connect(ctx.destination);
        osc.start();
        osc.stop(ctx.currentTime + 0.35);
      }
    } catch (e) {
      // Audio context may be restricted by browser policy
    }
  }
};

document.addEventListener('DOMContentLoaded', () => {
  ScannerSimulatorModule.init();
});
