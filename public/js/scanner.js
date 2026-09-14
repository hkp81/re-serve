/**
 * scanner.js - QR Scanner & OTP Collection Verification Terminal
 * Powers the "Collect with Dignity" contactless handover authentication.
 */

(function () {
  function openScannerModal() {
    const modal = document.getElementById('scanner-modal');
    if (modal) modal.classList.add('active');
  }

  function closeScannerModal() {
    const modal = document.getElementById('scanner-modal');
    if (modal) modal.classList.remove('active');
  }

  async function verifyWithOtp(otpCode) {
    const code = otpCode || document.getElementById('scanner-otp-input')?.value.trim();
    if (!code || code.length < 6) {
      window.AppModule?.showToast('Verification Required', 'Please enter a valid 6-digit OTP code', 'error');
      return;
    }

    try {
      const res = await fetch('/api/verify-pickup', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ otp: code })
      });

      const data = await res.json();
      if (res.ok && data.success) {
        showVerificationSuccess(data.order);
        if (window.DiscoveryModule) window.DiscoveryModule.refresh();
        if (window.AppModule) window.AppModule.refreshStats();
      } else {
        window.AppModule?.showToast('Verification Failed', data.error || 'Invalid OTP code', 'error');
      }
    } catch (err) {
      console.error('Pickup verification error:', err);
      window.AppModule?.showToast('Error', 'Could not connect to verification server', 'error');
    }
  }

  function simulateQrCameraScan() {
    window.AppModule?.showToast('Camera Scanner', 'Scanning QR code from viewfinder...', 'info');

    // Simulate recognition of the active order QR
    setTimeout(() => {
      // Look up existing order or use test OTP
      verifyWithOtp('482910');
    }, 1200);
  }

  function showVerificationSuccess(order) {
    const resultBox = document.getElementById('scanner-result-box');
    if (!resultBox) return;

    resultBox.style.display = 'block';
    resultBox.innerHTML = `
      <div style="background: rgba(16, 185, 129, 0.15); border: 2px solid var(--emerald-primary); border-radius: var(--radius-lg); padding: 1.5rem; text-align: center; animation: fadeIn 0.4s ease;">
        <div style="font-size: 2.2rem; margin-bottom: 0.5rem;">🎉</div>
        <h3 style="color: #34d399; font-size: 1.25rem; font-weight: 800; margin-bottom: 0.25rem;">Handover Verified!</h3>
        <p style="color: #fff; font-size: 0.85rem; margin-bottom: 0.75rem;">
          Food handed over with dignity & safety.
        </p>
        <div style="background: rgba(0,0,0,0.3); border-radius: var(--radius-md); padding: 0.75rem; font-size: 0.8rem; text-align: left; margin-bottom: 1rem;">
          <div style="color: var(--text-muted);">Order: <strong style="color: #fff;">${order.id}</strong></div>
          <div style="color: var(--text-muted);">Item: <strong style="color: #fff;">${order.mealTitle}</strong></div>
          <div style="color: var(--text-muted);">Beneficiary / Buyer: <strong style="color: var(--emerald-primary);">${order.customerName}</strong></div>
          <div style="color: var(--text-muted);">Portions: <strong style="color: #fff;">${order.portions} meals (${order.weightKg} kg)</strong></div>
        </div>
        <button class="btn-action-primary" style="width: 100%; justify-content: center;" onclick="window.ScannerModule.closeScannerModal()">
          Close & Return to Feed
        </button>
      </div>
    `;
  }

  window.ScannerModule = {
    openScannerModal,
    closeScannerModal,
    verifyWithOtp,
    simulateQrCameraScan
  };
})();
