/**
 * simulator.js - Live Delivery & Volunteer Courier GPS Radar Simulation
 * Luminous White, Emerald Green & Solar Orange styled vector map
 */

(function () {
  let mapCanvas = null;
  let ctx = null;
  let animId = null;
  let progress = 0;
  let activeOrderId = 'ORD-9201';

  const waypoints = [
    { x: 80, y: 380, label: 'Volunteer Depot', status: 'Dispatched' },
    { x: 220, y: 310, label: 'Sector 62 Crossroad', status: 'Heading to Kitchen' },
    { x: 380, y: 190, label: 'Hostel Mess (Pickup)', status: 'Arrived at Food Partner Outlet' },
    { x: 540, y: 160, label: 'Expressway Link', status: 'Food Inspected & Collected Safely' },
    { x: 680, y: 260, label: 'Community Hub', status: 'En Route to Feeding Shelter' },
    { x: 820, y: 220, label: 'Asha Center (Shelter)', status: 'Delivered with Dignity' }
  ];

  function initMap() {
    mapCanvas = document.getElementById('map-canvas');
    if (!mapCanvas) return;

    ctx = mapCanvas.getContext('2d');
    resizeCanvas();

    window.addEventListener('resize', resizeCanvas);
    startAnimation();
    fetchTrackingData(activeOrderId);
  }

  function resizeCanvas() {
    if (!mapCanvas || !mapCanvas.parentElement) return;
    mapCanvas.width = mapCanvas.parentElement.clientWidth;
    mapCanvas.height = 500;
  }

  async function fetchTrackingData(orderId) {
    try {
      const res = await fetch(`/api/tracking/${orderId}`);
      const data = await res.json();
      updateSidebar(data);
    } catch (err) {
      console.error('Tracking fetch error:', err);
    }
  }

  function updateSidebar(data) {
    const volName = document.getElementById('tracking-vol-name');
    const volVehicle = document.getElementById('tracking-vol-vehicle');
    const volEta = document.getElementById('tracking-eta');
    const volStatus = document.getElementById('tracking-status-badge');

    if (volName && data.volunteer) volName.textContent = data.volunteer.name;
    if (volVehicle && data.volunteer) volVehicle.textContent = data.volunteer.vehicle;
    if (volEta && data.volunteer) volEta.textContent = data.volunteer.eta;
    if (volStatus && data.volunteer) volStatus.textContent = data.volunteer.currentStatusText;
  }

  function startAnimation() {
    if (animId) cancelAnimationFrame(animId);

    function step() {
      progress += 0.0018;
      if (progress > 1) progress = 0;

      renderMap();
      animId = requestAnimationFrame(step);
    }

    animId = requestAnimationFrame(step);
  }

  function renderMap() {
    if (!ctx || !mapCanvas) return;
    const w = mapCanvas.width;
    const h = mapCanvas.height;

    ctx.clearRect(0, 0, w, h);

    // Light Clean Map Background Grid
    ctx.fillStyle = '#f8fafc';
    ctx.fillRect(0, 0, w, h);

    ctx.strokeStyle = 'rgba(203, 213, 225, 0.45)';
    ctx.lineWidth = 1;
    const gridSize = 40;
    for (let x = 0; x < w; x += gridSize) {
      ctx.beginPath();
      ctx.moveTo(x, 0);
      ctx.lineTo(x, h);
      ctx.stroke();
    }
    for (let y = 0; y < h; y += gridSize) {
      ctx.beginPath();
      ctx.moveTo(0, y);
      ctx.lineTo(w, y);
      ctx.stroke();
    }

    const scaleX = w / 920;
    const scaledPoints = waypoints.map(p => ({
      x: p.x * scaleX,
      y: p.y,
      label: p.label,
      status: p.status
    }));

    // Base Road Path
    ctx.beginPath();
    ctx.moveTo(scaledPoints[0].x, scaledPoints[0].y);
    for (let i = 1; i < scaledPoints.length; i++) {
      ctx.lineTo(scaledPoints[i].x, scaledPoints[i].y);
    }
    ctx.strokeStyle = '#e2e8f0';
    ctx.lineWidth = 8;
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';
    ctx.stroke();

    const totalSegments = scaledPoints.length - 1;
    const segFloat = progress * totalSegments;
    const segIdx = Math.min(Math.floor(segFloat), totalSegments - 1);
    const segT = segFloat - segIdx;

    const pA = scaledPoints[segIdx];
    const pB = scaledPoints[segIdx + 1];

    const currentX = pA.x + (pB.x - pA.x) * segT;
    const currentY = pA.y + (pB.y - pA.y) * segT;

    // Active Green Route with Glow
    ctx.beginPath();
    ctx.moveTo(scaledPoints[0].x, scaledPoints[0].y);
    for (let i = 1; i <= segIdx; i++) {
      ctx.lineTo(scaledPoints[i].x, scaledPoints[i].y);
    }
    ctx.lineTo(currentX, currentY);
    ctx.strokeStyle = '#10b981';
    ctx.lineWidth = 5;
    ctx.shadowColor = 'rgba(16, 185, 129, 0.5)';
    ctx.shadowBlur = 10;
    ctx.stroke();
    ctx.shadowBlur = 0;

    // Render Waypoint Markers
    scaledPoints.forEach((pt, index) => {
      const isPickup = index === 2;
      const isDrop = index === scaledPoints.length - 1;

      ctx.beginPath();
      ctx.arc(pt.x, pt.y, isPickup || isDrop ? 10 : 6, 0, Math.PI * 2);
      ctx.fillStyle = isPickup ? '#f97316' : (isDrop ? '#10b981' : '#94a3b8');
      ctx.fill();
      ctx.lineWidth = 3;
      ctx.strokeStyle = '#ffffff';
      ctx.stroke();

      ctx.font = '700 11px Plus Jakarta Sans, sans-serif';
      ctx.fillStyle = isPickup ? '#ea580c' : (isDrop ? '#047857' : '#475569');
      ctx.fillText(pt.label, pt.x - 30, pt.y - 14);
    });

    // Radar Pulse on Courier
    const pulseRadius = 16 + Math.sin(Date.now() * 0.006) * 7;
    ctx.beginPath();
    ctx.arc(currentX, currentY, pulseRadius, 0, Math.PI * 2);
    ctx.fillStyle = 'rgba(16, 185, 129, 0.2)';
    ctx.fill();

    ctx.beginPath();
    ctx.arc(currentX, currentY, 9, 0, Math.PI * 2);
    ctx.fillStyle = '#10b981';
    ctx.fill();
    ctx.lineWidth = 3;
    ctx.strokeStyle = '#ffffff';
    ctx.stroke();

    // Courier Tooltip Pill
    ctx.fillStyle = '#ffffff';
    ctx.strokeStyle = '#10b981';
    ctx.lineWidth = 1.5;
    ctx.shadowColor = 'rgba(0,0,0,0.08)';
    ctx.shadowBlur = 8;
    ctx.fillRect(currentX - 60, currentY - 48, 120, 26);
    ctx.strokeRect(currentX - 60, currentY - 48, 120, 26);
    ctx.shadowBlur = 0;

    ctx.font = '800 11px Plus Jakarta Sans, sans-serif';
    ctx.fillStyle = '#047857';
    ctx.fillText('🛵 Rahul (Courier)', currentX - 52, currentY - 31);

    updateTimelineSteps(segIdx);
  }

  function updateTimelineSteps(activeIdx) {
    const steps = document.querySelectorAll('.timeline-step');
    steps.forEach((step, idx) => {
      step.classList.remove('active', 'completed');
      if (idx < activeIdx) {
        step.classList.add('completed');
      } else if (idx === activeIdx) {
        step.classList.add('active');
      }
    });
  }

  window.SimulatorModule = {
    init: initMap,
    startTracking: (orderId) => {
      activeOrderId = orderId;
      fetchTrackingData(orderId);
    }
  };
})();