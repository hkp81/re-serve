/**
 * spline3d.js - Interactive 3D Canvas Visual for Re-serve
 * Luminous 3D Eco-Globe with Orbiting 3D Food Plates, Solar Orange Accents & Mouse Tracking
 */

(function () {
  function initSpline3D() {
    const canvas = document.getElementById('spline-canvas');
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    let width = (canvas.width = canvas.parentElement.clientWidth || 400);
    let height = (canvas.height = canvas.parentElement.clientHeight || 400);

    window.addEventListener('resize', () => {
      if (canvas.parentElement) {
        width = canvas.width = canvas.parentElement.clientWidth;
        height = canvas.height = canvas.parentElement.clientHeight;
      }
    });

    let mouseX = 0;
    let mouseY = 0;
    let targetRotationX = 0;
    let targetRotationY = 0;
    let rotationX = 0;
    let rotationY = 0;

    canvas.addEventListener('mousemove', (e) => {
      const rect = canvas.getBoundingClientRect();
      mouseX = (e.clientX - rect.left) / width - 0.5;
      mouseY = (e.clientY - rect.top) / height - 0.5;
      targetRotationY = mouseX * 1.2;
      targetRotationX = -mouseY * 1.2;
    });

    canvas.addEventListener('mouseleave', () => {
      targetRotationX = 0;
      targetRotationY = 0;
    });

    // 3D Spherical Particles
    const numParticles = 160;
    const particles = [];
    const radius = Math.min(width, height) * 0.32;

    for (let i = 0; i < numParticles; i++) {
      const theta = Math.acos(2 * Math.random() - 1);
      const phi = Math.random() * Math.PI * 2;
      const isOrange = i % 4 === 0;
      const isMint = i % 4 === 1;
      particles.push({
        x: radius * Math.sin(theta) * Math.cos(phi),
        y: radius * Math.sin(theta) * Math.sin(phi),
        z: radius * Math.cos(theta),
        baseSize: 2 + Math.random() * 3,
        color: isOrange ? '#f97316' : (isMint ? '#34d399' : '#10b981')
      });
    }

    // 3D Orbiting Food Satellites (Rendered as stylized 3D meal plates/discs)
    const foodSatellites = [
      { angle: 0, speed: 0.018, dist: radius * 1.38, size: 14, icon: '🍱', label: 'Thali Pack', color: '#10b981' },
      { angle: 1.6, speed: 0.014, dist: radius * 1.55, size: 12, icon: '🥐', label: 'Bakery Box', color: '#f97316' },
      { angle: 3.2, speed: 0.016, dist: radius * 1.32, size: 15, icon: '🍲', label: 'NGO Sambar Pot', color: '#059669' },
      { angle: 4.8, speed: 0.020, dist: radius * 1.48, size: 13, icon: '🥗', label: 'Fresh Salad', color: '#ea580c' }
    ];

    let baseAngle = 0;

    function render() {
      ctx.clearRect(0, 0, width, height);

      rotationX += (targetRotationX - rotationX) * 0.06;
      rotationY += (targetRotationY - rotationY) * 0.06;
      baseAngle += 0.009;

      const centerX = width / 2;
      const centerY = height / 2;

      // Soft Luminous Glow Background
      const radial = ctx.createRadialGradient(centerX, centerY, 20, centerX, centerY, radius * 1.5);
      radial.addColorStop(0, 'rgba(16, 185, 129, 0.16)');
      radial.addColorStop(0.4, 'rgba(249, 115, 22, 0.08)');
      radial.addColorStop(1, 'transparent');
      ctx.fillStyle = radial;
      ctx.beginPath();
      ctx.arc(centerX, centerY, radius * 1.5, 0, Math.PI * 2);
      ctx.fill();

      const cosY = Math.cos(baseAngle + rotationY);
      const sinY = Math.sin(baseAngle + rotationY);
      const cosX = Math.cos(rotationX);
      const sinX = Math.sin(rotationX);

      // Project 3D Sphere Particles
      const projected = [];
      particles.forEach((p) => {
        let x1 = p.x * cosY - p.z * sinY;
        let z1 = p.z * cosY + p.x * sinY;

        let y2 = p.y * cosX - z1 * sinX;
        let z2 = z1 * cosX + p.y * sinX;

        const scale = 360 / (360 + z2);
        projected.push({
          x2d: centerX + x1 * scale,
          y2d: centerY + y2 * scale,
          z2: z2,
          size: p.baseSize * scale,
          color: p.color
        });
      });

      projected.sort((a, b) => a.z2 - b.z2);

      projected.forEach((p) => {
        const alpha = Math.max(0.25, (p.z2 + radius) / (2 * radius));
        ctx.fillStyle = p.color;
        ctx.globalAlpha = alpha;
        ctx.beginPath();
        ctx.arc(p.x2d, p.y2d, p.size, 0, Math.PI * 2);
        ctx.fill();
      });

      // 3D Orbiting Ring 1 (Emerald Green)
      ctx.strokeStyle = 'rgba(16, 185, 129, 0.35)';
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.ellipse(centerX, centerY, radius * 1.35, radius * 0.5, rotationX, 0, Math.PI * 2);
      ctx.stroke();

      // 3D Orbiting Ring 2 (Solar Orange)
      ctx.strokeStyle = 'rgba(249, 115, 22, 0.3)';
      ctx.lineWidth = 1.5;
      ctx.beginPath();
      ctx.ellipse(centerX, centerY, radius * 1.5, radius * 0.45, -rotationX * 0.8, 0, Math.PI * 2);
      ctx.stroke();

      // Render 3D Food Satellites with Shadow & Floating Badges
      foodSatellites.forEach((sat) => {
        sat.angle += sat.speed;
        const satX = centerX + Math.cos(sat.angle) * sat.dist * Math.cos(rotationX);
        const satY = centerY + Math.sin(sat.angle) * (sat.dist * 0.45) + Math.cos(sat.angle) * sat.dist * Math.sin(rotationX) * 0.4;
        const depthZ = Math.sin(sat.angle);

        ctx.globalAlpha = depthZ > -0.2 ? 1 : 0.6;

        // Plate Disc Shadow
        ctx.fillStyle = 'rgba(15, 23, 42, 0.12)';
        ctx.beginPath();
        ctx.ellipse(satX, satY + 16, sat.size * 1.2, sat.size * 0.4, 0, 0, Math.PI * 2);
        ctx.fill();

        // White 3D Plate Disc
        ctx.fillStyle = '#ffffff';
        ctx.shadowColor = sat.color;
        ctx.shadowBlur = 12;
        ctx.beginPath();
        ctx.arc(satX, satY, sat.size, 0, Math.PI * 2);
        ctx.fill();
        ctx.shadowBlur = 0;

        ctx.strokeStyle = sat.color;
        ctx.lineWidth = 2;
        ctx.stroke();

        // Food Emoji Icon in 3D center
        ctx.font = `${Math.round(sat.size * 1.1)}px Apple Color Emoji, Segoe UI Emoji, sans-serif`;
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText(sat.icon, satX, satY + 1);

        // Tooltip Pill
        ctx.font = '700 10px Plus Jakarta Sans, sans-serif';
        ctx.fillStyle = '#0f172a';
        ctx.fillText(sat.label, satX, satY - sat.size - 6);
      });

      ctx.globalAlpha = 1;
      requestAnimationFrame(render);
    }

    render();
  }

  window.addEventListener('DOMContentLoaded', initSpline3D);
  window.initSpline3D = initSpline3D;
})();