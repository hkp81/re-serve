/**
 * ReServe 3D & WebGL Engine (Precision Glassmorphism Edition)
 * 
 * 1. Dynamic 3D Particle Wave Grid (Fullscreen Background Engine):
 *    - Matrix of points projected in 3D perspective undulating in organic sine-wave currents
 *    - Mouse-driven gravitational ripples and scroll parallax
 *    - Palette: Deep Teal (#004D40), Muted Gold (#E5A93C), Soft Ice (#F8F9FA)
 * 
 * 2. Floating Glassmorphic Spheres (Interactive Mesh):
 *    - Multi-layer glass refraction spheres with 3D mesh wireframe/rings
 *    - Specular highlights, chromatic dispersion, interactive drag-spin and inertia
 *    - Orbiting food rescue badges with smooth spring physics
 * 
 * 3. Card Elevation & Parallax Tilt (3D Gyroscope):
 *    - Multi-axis perspective tilt with dynamic translateZ elevation
 *    - Real hardware gyroscope integration (deviceorientation beta/gamma) + cursor tracking
 *    - Dynamic specular sheen highlight gliding across cards
 */

// ============================================================================
// 1. DYNAMIC 3D PARTICLE WAVE GRID (Fullscreen Background Engine)
// ============================================================================
class Dynamic3DParticleWaveGrid {
  constructor(canvasId) {
    this.canvas = document.getElementById(canvasId);
    if (!this.canvas) return;

    this.ctx = this.canvas.getContext('2d');
    this.width = window.innerWidth;
    this.height = window.innerHeight;

    this.mouseX = 0;
    this.mouseY = 0;
    this.targetMouseX = 0;
    this.targetMouseY = 0;
    this.scrollY = 0;
    this.targetScrollY = 0;
    this.time = 0;

    // Grid configuration
    this.cols = 36;
    this.rows = 26;
    this.gridSpacingX = 55;
    this.gridSpacingZ = 48;

    // Floating glassmorphic satellite nodes in background
    this.floatingSpheres = [];

    this.init();
  }

  init() {
    this.resize();
    window.addEventListener('resize', () => this.resize());

    window.addEventListener('mousemove', (e) => {
      this.targetMouseX = (e.clientX / this.width - 0.5) * 2; // -1 to 1
      this.targetMouseY = (e.clientY / this.height - 0.5) * 2;
    });

    window.addEventListener('scroll', () => {
      this.targetScrollY = window.scrollY;
    }, { passive: true });

    // Background floating glass spheres
    for (let i = 0; i < 6; i++) {
      this.floatingSpheres.push({
        x: (Math.random() - 0.5) * this.width * 1.2,
        y: (Math.random() - 0.5) * this.height * 1.5,
        z: Math.random() * 400 + 200,
        radius: Math.random() * 32 + 22,
        speedX: (Math.random() - 0.5) * 0.4,
        speedY: (Math.random() - 0.5) * 0.35,
        rotAngle: Math.random() * Math.PI * 2,
        rotSpeed: (Math.random() - 0.5) * 0.012,
        theme: i % 2 === 0 ? 'teal' : 'gold'
      });
    }

    this.animate();
  }

  resize() {
    this.width = window.innerWidth;
    this.height = window.innerHeight;
    this.canvas.width = this.width * window.devicePixelRatio;
    this.canvas.height = this.height * window.devicePixelRatio;
    this.ctx.scale(window.devicePixelRatio, window.devicePixelRatio);
  }

  animate() {
    requestAnimationFrame(() => this.animate());

    this.time += 0.022;
    this.mouseX += (this.targetMouseX - this.mouseX) * 0.06;
    this.mouseY += (this.targetMouseY - this.mouseY) * 0.06;
    this.scrollY += (this.targetScrollY - this.scrollY) * 0.08;

    const ctx = this.ctx;
    ctx.clearRect(0, 0, this.width, this.height);

    const centerX = this.width / 2;
    const centerY = this.height * 0.62;
    const f = 460; // Perspective focal length

    this.drawFloatingBackgroundSpheres(ctx, centerX, centerY, f);
    this.drawParticleWaveGrid(ctx, centerX, centerY, f);
  }

  drawParticleWaveGrid(ctx, cx, cy, f) {
    const gridPoints = [];
    const t = this.time;

    const gridOriginX = -(this.cols * this.gridSpacingX) / 2;
    const baseZ = 220;

    // Calculate undulating 3D heights
    for (let r = 0; r < this.rows; r++) {
      gridPoints[r] = [];
      const zWorld = baseZ + r * this.gridSpacingZ;

      for (let c = 0; c < this.cols; c++) {
        const xWorld = gridOriginX + c * this.gridSpacingX;

        // Wave formula combining multi-octave sine frequencies
        const distFromCenter = Math.hypot(xWorld, (r - this.rows / 2) * this.gridSpacingZ);
        const wave1 = Math.sin(xWorld * 0.007 + t * 1.2) * 24;
        const wave2 = Math.cos(r * 0.22 - t * 1.5) * 22;
        const wave3 = Math.sin((xWorld + r * 20) * 0.004 + t * 0.8) * 14;

        // Interactive mouse disturbance
        const mouseWorldX = this.mouseX * (this.width * 0.4);
        const mouseWorldZ = baseZ + (this.mouseY + 1) * 250;
        const distMouse = Math.hypot(xWorld - mouseWorldX, zWorld - mouseWorldZ);
        const mouseWave = Math.sin(Math.max(0, 240 - distMouse) * 0.035) * Math.max(0, 36 - distMouse * 0.15);

        const yWorld = wave1 + wave2 + wave3 + mouseWave + (this.scrollY * 0.08);

        // Perspective 3D Projection
        const camX = xWorld - this.mouseX * 70;
        const camY = yWorld + (this.mouseY * 45);
        const camZ = zWorld;

        const scale = f / Math.max(50, camZ);
        const sx = cx + camX * scale;
        const sy = cy + camY * scale;

        gridPoints[r][c] = {
          sx,
          sy,
          scale,
          zWorld,
          depthRatio: 1 - (r / this.rows),
          elevationRatio: (yWorld + 50) / 100
        };
      }
    }

    // 1. Draw Grid Web Connections (Longitude lines)
    for (let r = 0; r < this.rows; r++) {
      ctx.beginPath();
      for (let c = 0; c < this.cols; c++) {
        const p = gridPoints[r][c];
        if (c === 0) ctx.moveTo(p.sx, p.sy);
        else ctx.lineTo(p.sx, p.sy);
      }
      const alpha = (1 - r / this.rows) * 0.14;
      ctx.strokeStyle = `rgba(0, 77, 64, ${alpha})`;
      ctx.lineWidth = 0.85;
      ctx.stroke();
    }

    // 2. Draw Grid Cross Connections (Latitude lines)
    for (let c = 0; c < this.cols; c += 2) {
      ctx.beginPath();
      for (let r = 0; r < this.rows; r++) {
        const p = gridPoints[r][c];
        if (r === 0) ctx.moveTo(p.sx, p.sy);
        else ctx.lineTo(p.sx, p.sy);
      }
      const alpha = 0.08;
      ctx.strokeStyle = `rgba(0, 77, 64, ${alpha})`;
      ctx.lineWidth = 0.7;
      ctx.stroke();
    }

    // 3. Draw Dynamic Particle Nodes with Deep Teal & Muted Gold Radiance
    for (let r = 0; r < this.rows; r++) {
      for (let c = 0; c < this.cols; c++) {
        const p = gridPoints[r][c];
        const isPeak = p.elevationRatio > 0.65;
        const nodeRadius = Math.max(0.8, (isPeak ? 2.4 : 1.4) * p.scale * 1.5);

        ctx.beginPath();
        ctx.arc(p.sx, p.sy, nodeRadius, 0, Math.PI * 2);

        if (isPeak) {
          // Warm Sand / Muted Gold crest highlights
          ctx.fillStyle = `rgba(229, 169, 60, ${0.45 * p.depthRatio})`;
        } else {
          // Deep Teal base nodes
          ctx.fillStyle = `rgba(0, 77, 64, ${0.35 * p.depthRatio})`;
        }
        ctx.fill();
      }
    }
  }

  drawFloatingBackgroundSpheres(ctx, cx, cy, f) {
    this.floatingSpheres.forEach(s => {
      s.x += s.speedX;
      s.y += s.speedY;
      s.rotAngle += s.rotSpeed;

      const boundaryX = this.width * 0.7;
      const boundaryY = this.height * 0.8;
      if (s.x < -boundaryX) s.x = boundaryX;
      if (s.x > boundaryX) s.x = -boundaryX;
      if (s.y < -boundaryY) s.y = boundaryY;
      if (s.y > boundaryY) s.y = -boundaryY;

      const camX = s.x - this.mouseX * 80;
      const camY = s.y - (this.scrollY * 0.15) - this.mouseY * 50;
      const camZ = s.z;

      const scale = f / Math.max(80, camZ);
      const sx = cx + camX * scale;
      const sy = cy + camY * scale;
      const r = s.radius * scale;

      ctx.save();
      ctx.translate(sx, sy);

      // Glassmorphic Orb Body
      const orbGrad = ctx.createRadialGradient(-r * 0.35, -r * 0.35, r * 0.1, 0, 0, r);
      if (s.theme === 'teal') {
        orbGrad.addColorStop(0, 'rgba(255, 255, 255, 0.75)');
        orbGrad.addColorStop(0.4, 'rgba(0, 77, 64, 0.08)');
        orbGrad.addColorStop(0.85, 'rgba(0, 77, 64, 0.18)');
        orbGrad.addColorStop(1, 'rgba(0, 77, 64, 0.05)');
      } else {
        orbGrad.addColorStop(0, 'rgba(255, 255, 255, 0.75)');
        orbGrad.addColorStop(0.4, 'rgba(229, 169, 60, 0.08)');
        orbGrad.addColorStop(0.85, 'rgba(229, 169, 60, 0.18)');
        orbGrad.addColorStop(1, 'rgba(229, 169, 60, 0.05)');
      }

      ctx.beginPath();
      ctx.arc(0, 0, r, 0, Math.PI * 2);
      ctx.fillStyle = orbGrad;
      ctx.fill();

      // Subtle Glass Rim
      ctx.strokeStyle = s.theme === 'teal' ? 'rgba(0, 77, 64, 0.22)' : 'rgba(229, 169, 60, 0.25)';
      ctx.lineWidth = 1;
      ctx.stroke();

      // Specular Glint
      ctx.beginPath();
      ctx.ellipse(-r * 0.3, -r * 0.3, r * 0.35, r * 0.18, -Math.PI / 4, 0, Math.PI * 2);
      ctx.fillStyle = 'rgba(255, 255, 255, 0.55)';
      ctx.fill();

      ctx.restore();
    });
  }

  setSplineScene(url) {
    const container = document.getElementById('spline-bg-container');
    if (!container) return;

    if (!url) {
      this.canvas.style.display = 'block';
      const existing = container.querySelector('spline-viewer');
      if (existing) existing.remove();
      return;
    }

    this.canvas.style.display = 'none';
    let viewer = container.querySelector('spline-viewer');
    if (!viewer) {
      viewer = document.createElement('spline-viewer');
      viewer.setAttribute('loading-anim', 'true');
      container.appendChild(viewer);
    }
    viewer.setAttribute('url', url);
  }
}

// ============================================================================
// 2. FLOATING GLASSMORPHIC SPHERES (Interactive Mesh in Hero Viewport)
// ============================================================================
class FloatingGlassmorphicSpheresMesh {
  constructor(canvasId) {
    this.canvas = document.getElementById(canvasId);
    if (!this.canvas) return;

    this.ctx = this.canvas.getContext('2d');
    this.width = this.canvas.clientWidth || 500;
    this.height = this.canvas.clientHeight || 450;
    this.mouseX = 0;
    this.mouseY = 0;
    this.targetMouseX = 0;
    this.targetMouseY = 0;
    this.rotationAngle = 0;
    this.pitchAngle = 0.25;

    this.isDragging = false;
    this.dragStartX = 0;
    this.dragStartY = 0;
    this.dragVelocityX = 0;
    this.dragVelocityY = 0;

    // Rescued meal emblems with clean icons
    this.orbitingItems = [
      { icon: '🥗', label: 'Fresh Salad', desc: 'Rescued Fresh' },
      { icon: '🍲', label: 'Warm Stew', desc: 'Zero Food Waste' },
      { icon: '🥐', label: 'Artisan Bakes', desc: 'Bakery Surplus' },
      { icon: '🍛', label: 'Meal Box', desc: 'Community Relief' },
      { icon: '🥛', label: 'Nutrition Pack', desc: '100% Verified' }
    ];

    // Spherical mesh wireframe resolution (latitudes & longitudes)
    this.sphereRadius = 96;
    this.latitudes = 9;
    this.longitudes = 14;

    this.init();
  }

  init() {
    this.resize();
    window.addEventListener('resize', () => this.resize());

    const container = this.canvas.parentElement;
    if (!container) return;

    container.addEventListener('mousemove', (e) => {
      if (this.isDragging) return;
      const rect = container.getBoundingClientRect();
      const x = e.clientX - rect.left - rect.width / 2;
      const y = e.clientY - rect.top - rect.height / 2;
      this.targetMouseX = x * 0.003;
      this.targetMouseY = y * 0.003;
    });

    container.addEventListener('mousedown', (e) => {
      this.isDragging = true;
      this.dragStartX = e.clientX;
      this.dragStartY = e.clientY;
    });

    window.addEventListener('mousemove', (e) => {
      if (!this.isDragging) return;
      const dx = e.clientX - this.dragStartX;
      const dy = e.clientY - this.dragStartY;
      this.rotationAngle += dx * 0.007;
      this.pitchAngle += dy * 0.005;
      this.dragVelocityX = dx * 0.003;
      this.dragVelocityY = dy * 0.003;
      this.dragStartX = e.clientX;
      this.dragStartY = e.clientY;
    });

    window.addEventListener('mouseup', () => {
      this.isDragging = false;
    });

    container.addEventListener('mouseleave', () => {
      if (!this.isDragging) {
        this.targetMouseX = 0;
        this.targetMouseY = 0;
      }
    });

    this.animate();
  }

  resize() {
    if (!this.canvas) return;
    const rect = this.canvas.parentElement.getBoundingClientRect();
    this.width = rect.width || 500;
    this.height = Math.min(rect.height || 480, 520);
    this.canvas.width = this.width * window.devicePixelRatio;
    this.canvas.height = this.height * window.devicePixelRatio;
    this.ctx.scale(window.devicePixelRatio, window.devicePixelRatio);
  }

  animate() {
    requestAnimationFrame(() => this.animate());

    this.mouseX += (this.targetMouseX - this.mouseX) * 0.08;
    this.mouseY += (this.targetMouseY - this.mouseY) * 0.08;

    if (!this.isDragging) {
      this.rotationAngle += 0.008 + this.dragVelocityX;
      this.dragVelocityX *= 0.94;
      this.pitchAngle += this.dragVelocityY;
      this.dragVelocityY *= 0.94;
    }

    // Keep pitch within reasonable viewable bounds
    this.pitchAngle = Math.max(-0.6, Math.min(0.6, this.pitchAngle));

    const ctx = this.ctx;
    ctx.clearRect(0, 0, this.width, this.height);

    const centerX = this.width / 2;
    const centerY = this.height / 2;

    ctx.save();
    ctx.translate(centerX, centerY);

    this.drawInteractiveMeshSphere(ctx);
    this.drawOrbitingFoodItems(ctx);
    this.drawCoreHUD(ctx);

    ctx.restore();
  }

  drawInteractiveMeshSphere(ctx) {
    const r = this.sphereRadius;
    const rotY = this.rotationAngle + this.mouseX * 2;
    const rotX = this.pitchAngle + this.mouseY * 1.5;

    // 1. Soft Backdrop Glow
    const bgGlow = ctx.createRadialGradient(0, 0, r * 0.2, 0, 0, r * 1.5);
    bgGlow.addColorStop(0, 'rgba(0, 77, 64, 0.12)');
    bgGlow.addColorStop(0.6, 'rgba(229, 169, 60, 0.06)');
    bgGlow.addColorStop(1, 'transparent');
    ctx.fillStyle = bgGlow;
    ctx.beginPath();
    ctx.arc(0, 0, r * 1.5, 0, Math.PI * 2);
    ctx.fill();

    // 2. Glassmorphic Translucent Core with Specular Gradient
    const glassGrad = ctx.createRadialGradient(
      -r * 0.35 + this.mouseX * 60,
      -r * 0.35 + this.mouseY * 60,
      r * 0.1,
      0,
      0,
      r
    );
    glassGrad.addColorStop(0, '#FFFFFF');
    glassGrad.addColorStop(0.35, 'rgba(248, 249, 250, 0.92)');
    glassGrad.addColorStop(0.75, 'rgba(0, 77, 64, 0.08)');
    glassGrad.addColorStop(1, 'rgba(0, 77, 64, 0.22)');

    ctx.beginPath();
    ctx.arc(0, 0, r, 0, Math.PI * 2);
    ctx.fillStyle = glassGrad;
    ctx.shadowColor = 'rgba(0, 77, 64, 0.18)';
    ctx.shadowBlur = 28;
    ctx.fill();

    // 3. Interactive 3D Wireframe Mesh (Latitude and Longitude Rings)
    const cosX = Math.cos(rotX), sinX = Math.sin(rotX);
    const cosY = Math.cos(rotY), sinY = Math.sin(rotY);

    const projectPoint = (x, y, z) => {
      // Rotate Y
      const x1 = x * cosY + z * sinY;
      const y1 = y;
      const z1 = -x * sinY + z * cosY;
      // Rotate X
      const x2 = x1;
      const y2 = y1 * cosX - z1 * sinX;
      const z2 = y1 * sinX + z1 * cosX;
      return { x: x2, y: y2, z: z2 };
    };

    // Draw Longitude Rings (Interactive Mesh)
    ctx.lineWidth = 1.1;
    for (let i = 0; i < this.longitudes; i++) {
      const phi = (i / this.longitudes) * Math.PI;
      ctx.beginPath();
      let first = true;
      for (let j = 0; j <= 28; j++) {
        const theta = (j / 28) * Math.PI * 2;
        const x = r * Math.sin(theta) * Math.cos(phi);
        const y = r * Math.cos(theta);
        const z = r * Math.sin(theta) * Math.sin(phi);
        const p = projectPoint(x, y, z);
        if (p.z > -10) { // Render predominantly forward-facing mesh
          if (first) {
            ctx.moveTo(p.x, p.y);
            first = false;
          } else {
            ctx.lineTo(p.x, p.y);
          }
        } else {
          first = true;
        }
      }
      ctx.strokeStyle = i % 2 === 0 ? 'rgba(0, 77, 64, 0.22)' : 'rgba(229, 169, 60, 0.2)';
      ctx.stroke();
    }

    // Draw Latitude Rings
    for (let i = 1; i < this.latitudes; i++) {
      const theta = (i / this.latitudes) * Math.PI;
      const ringR = r * Math.sin(theta);
      const ringY = r * Math.cos(theta);

      ctx.beginPath();
      let first = true;
      for (let j = 0; j <= 28; j++) {
        const phi = (j / 28) * Math.PI * 2;
        const x = ringR * Math.cos(phi);
        const y = ringY;
        const z = ringR * Math.sin(phi);
        const p = projectPoint(x, y, z);
        if (p.z > -15) {
          if (first) {
            ctx.moveTo(p.x, p.y);
            first = false;
          } else {
            ctx.lineTo(p.x, p.y);
          }
        } else {
          first = true;
        }
      }
      ctx.strokeStyle = 'rgba(0, 77, 64, 0.16)';
      ctx.stroke();
    }

    // 4. Glass Edge Rim & Specular Refraction Highlight
    ctx.beginPath();
    ctx.arc(0, 0, r, 0, Math.PI * 2);
    ctx.strokeStyle = 'rgba(0, 77, 64, 0.4)';
    ctx.lineWidth = 1.8;
    ctx.stroke();

    // Glint highlight
    ctx.beginPath();
    ctx.ellipse(-r * 0.4 + this.mouseX * 35, -r * 0.4 + this.mouseY * 35, r * 0.35, r * 0.18, -Math.PI / 4, 0, Math.PI * 2);
    ctx.fillStyle = 'rgba(255, 255, 255, 0.82)';
    ctx.fill();
  }

  drawOrbitingFoodItems(ctx) {
    const orbitRadius = 158;
    const numItems = this.orbitingItems.length;

    this.orbitingItems.forEach((item, index) => {
      const baseAngle = (index / numItems) * Math.PI * 2;
      const currentAngle = baseAngle + this.rotationAngle;

      const x = Math.cos(currentAngle) * orbitRadius;
      const z = Math.sin(currentAngle);
      const y = Math.sin(currentAngle * 2) * 22 + z * 35 * Math.sin(this.pitchAngle) + this.mouseY * 45;

      const scale = 0.85 + (z + 1) * 0.22;
      const alpha = 0.5 + (z + 1) * 0.25;

      ctx.save();
      ctx.translate(x, y);
      ctx.scale(scale, scale);
      ctx.globalAlpha = Math.min(1, Math.max(0.2, alpha));

      // Glass Pill Badge behind Orbiting Icon
      ctx.beginPath();
      ctx.arc(0, 0, 22, 0, Math.PI * 2);
      ctx.fillStyle = 'rgba(255, 255, 255, 0.94)';
      ctx.strokeStyle = 'rgba(0, 77, 64, 0.18)';
      ctx.lineWidth = 1.4;
      ctx.shadowColor = 'rgba(28, 37, 38, 0.08)';
      ctx.shadowBlur = 12;
      ctx.fill();
      ctx.stroke();

      // Food Icon
      ctx.font = '22px system-ui';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText(item.icon, 0, 1);

      // Label when in front of sphere
      if (z > 0.15) {
        ctx.font = '700 10px Plus Jakarta Sans, sans-serif';
        ctx.fillStyle = '#004D40';
        ctx.fillText(item.label, 0, 32);
      }

      ctx.restore();
    });
  }

  drawCoreHUD(ctx) {
    ctx.save();
    // Center ReServe Icon
    ctx.font = '40px system-ui';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText('🥗', 0, -8);

    // ReServe Brand Tagline inside core
    ctx.font = '800 13px Plus Jakarta Sans, sans-serif';
    ctx.fillStyle = '#004D40';
    ctx.fillText('ReServe 3.0', 0, 36);

    ctx.font = '600 10px JetBrains Mono, monospace';
    ctx.fillStyle = '#E5A93C';
    ctx.fillText('ACTIVE SURPLUS RESCUE', 0, 52);

    ctx.restore();
  }
}

// ============================================================================
// 3. CARD ELEVATION & PARALLAX TILT (3D Gyroscope)
// ============================================================================
function init3DCardTilt() {
  const tiltElements = document.querySelectorAll(
    '.glass-card, .card-3d-tilt, .donation-spotlight-bar, .stat-pill, .stat-chip'
  );

  let gyroSupported = false;
  let gyroBeta = 0;  // front-back tilt [-180, 180]
  let gyroGamma = 0; // left-right tilt [-90, 90]

  // Setup Gyroscope Listener for mobile / tablet motion
  if (window.DeviceOrientationEvent && typeof window.DeviceOrientationEvent.requestPermission !== 'function') {
    window.addEventListener('deviceorientation', (e) => {
      if (e.beta !== null && e.gamma !== null) {
        gyroSupported = true;
        // Normalize device angles: beta centered ~45deg holding angle, gamma centered at 0deg
        gyroBeta = (e.beta - 45) * 0.35;
        gyroGamma = e.gamma * 0.45;
      }
    }, { passive: true });
  }

  tiltElements.forEach(card => {
    if (card.dataset.tilt3dActive) return;
    card.dataset.tilt3dActive = 'true';

    // Inject dynamic specular sheen highlight layer
    let sheen = card.querySelector('.tilt-specular-sheen');
    if (!sheen) {
      sheen = document.createElement('div');
      sheen.className = 'tilt-specular-sheen';
      sheen.style.position = 'absolute';
      sheen.style.inset = '0';
      sheen.style.borderRadius = 'inherit';
      sheen.style.pointerEvents = 'none';
      sheen.style.opacity = '0';
      sheen.style.transition = 'opacity 0.25s ease';
      sheen.style.background = 'radial-gradient(circle at 50% 50%, rgba(255, 255, 255, 0.45) 0%, rgba(229, 169, 60, 0.08) 40%, transparent 70%)';
      sheen.style.zIndex = '5';
      card.style.position = card.style.position || 'relative';
      card.appendChild(sheen);
    }

    card.addEventListener('mousemove', (e) => {
      const rect = card.getBoundingClientRect();
      const x = e.clientX - rect.left;
      const y = e.clientY - rect.top;

      const centerX = rect.width / 2;
      const centerY = rect.height / 2;

      // Calculate tilt angles (degrees)
      const rotateX = ((y - centerY) / centerY) * -9; // Max 9 deg
      const rotateY = ((x - centerX) / centerX) * 9;

      // 3D Elevation: Z translation + dynamic deep teal shadow displacement
      const shadowOffsetX = ((x - centerX) / centerX) * -12;
      const shadowOffsetY = ((y - centerY) / centerY) * -16;

      card.style.transform = `perspective(1000px) rotateX(${rotateX.toFixed(2)}deg) rotateY(${rotateY.toFixed(2)}deg) translateZ(14px)`;
      card.style.boxShadow = `${shadowOffsetX.toFixed(1)}px ${shadowOffsetY.toFixed(1)}px 36px -6px rgba(0, 77, 64, 0.16), 0 0 0 1px rgba(0, 77, 64, 0.18)`;
      
      // Update specular sheen position
      if (sheen) {
        sheen.style.opacity = '1';
        sheen.style.background = `radial-gradient(circle at ${x}px ${y}px, rgba(255, 255, 255, 0.42) 0%, rgba(229, 169, 60, 0.1) 45%, transparent 75%)`;
      }
    });

    card.addEventListener('mouseleave', () => {
      card.style.transform = 'perspective(1000px) rotateX(0deg) rotateY(0deg) translateZ(0px)';
      card.style.boxShadow = '';
      if (sheen) sheen.style.opacity = '0';
    });
  });

  // If gyro updates occur on mobile, update cards in viewport gently
  if (window.DeviceOrientationEvent) {
    let gyroRaf = null;
    const applyGyroTilt = () => {
      if (gyroSupported && Math.abs(gyroBeta) > 0.5) {
        tiltElements.forEach(card => {
          const rect = card.getBoundingClientRect();
          if (rect.top < window.innerHeight && rect.bottom > 0) {
            const rotX = Math.max(-10, Math.min(10, gyroBeta));
            const rotY = Math.max(-10, Math.min(10, gyroGamma));
            card.style.transform = `perspective(1000px) rotateX(${-rotX.toFixed(1)}deg) rotateY(${rotY.toFixed(1)}deg) translateZ(8px)`;
          }
        });
      }
      gyroRaf = requestAnimationFrame(applyGyroTilt);
    };
    gyroRaf = requestAnimationFrame(applyGyroTilt);
  }
}

// Global reference for customization
let globalSplineBg = null;
let globalSplineHero = null;

document.addEventListener('DOMContentLoaded', () => {
  // 1. Launch Dynamic 3D Particle Wave Grid Background
  globalSplineBg = new Dynamic3DParticleWaveGrid('spline-bg-canvas');

  // 2. Launch Floating Glassmorphic Spheres Hero Mesh
  globalSplineHero = new FloatingGlassmorphicSpheresMesh('hero-3d-canvas');

  // 3. Initialize Card Elevation & Parallax Tilt (3D Gyroscope)
  init3DCardTilt();

  // 4. Bind 3D Customizer Modal Events
  const openBtn = document.getElementById('open-spline-customizer-btn');
  const modal = document.getElementById('spline-settings-modal');
  const closeBtn = document.getElementById('close-spline-modal-btn');
  const closeDoneBtn = document.getElementById('close-spline-done-btn');
  const modeMeshBtn = document.getElementById('btn-mode-mesh');
  const modeSplineBtn = document.getElementById('btn-mode-spline');
  const urlGroup = document.getElementById('spline-url-group');
  const urlInput = document.getElementById('custom-spline-url-input');
  const applyBtn = document.getElementById('apply-spline-url-btn');
  const statusBadge = document.getElementById('spline-status-badge');

  if (openBtn && modal) {
    openBtn.addEventListener('click', () => modal.classList.add('active'));
  }

  const closeModal = () => modal && modal.classList.remove('active');
  if (closeBtn) closeBtn.addEventListener('click', closeModal);
  if (closeDoneBtn) closeDoneBtn.addEventListener('click', closeModal);

  if (modeMeshBtn && modeSplineBtn && urlGroup) {
    modeMeshBtn.addEventListener('click', () => {
      modeMeshBtn.classList.add('bg-teal-900', 'text-white');
      modeMeshBtn.classList.remove('bg-slate-100', 'text-slate-700');
      modeSplineBtn.classList.remove('bg-teal-900', 'text-white');
      modeSplineBtn.classList.add('bg-slate-100', 'text-slate-700');
      urlGroup.classList.add('hidden');

      if (globalSplineBg) {
        globalSplineBg.setSplineScene(null);
      }
      if (statusBadge) statusBadge.textContent = '✨ 3D Wave Grid: Active';
      if (typeof App !== 'undefined') App.showNotification('3D Particle Wave Grid Active', 'info');
    });

    modeSplineBtn.addEventListener('click', () => {
      modeSplineBtn.classList.add('bg-teal-900', 'text-white');
      modeSplineBtn.classList.remove('bg-slate-100', 'text-slate-700');
      modeMeshBtn.classList.remove('bg-teal-900', 'text-white');
      modeMeshBtn.classList.add('bg-slate-100', 'text-slate-700');
      urlGroup.classList.remove('hidden');
    });

    if (applyBtn && urlInput) {
      applyBtn.addEventListener('click', () => {
        const url = urlInput.value.trim();
        if (!url) {
          if (typeof App !== 'undefined') App.showNotification('Please enter a valid .splinecode URL', 'error');
          return;
        }

        if (globalSplineBg) {
          globalSplineBg.setSplineScene(url);
          if (statusBadge) statusBadge.textContent = '🌐 Spline 3D Scene: Active';
          if (typeof App !== 'undefined') App.showNotification('Spline 3D Scene Mounted in Background!', 'success');
          closeModal();
        }
      });
    }
  }
});

// Re-bind 3D card tilt after any dynamic DOM update
window.init3DCardTilt = init3DCardTilt;
