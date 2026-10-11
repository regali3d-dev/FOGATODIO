import * as THREE from 'three';

export function createConcreteTexture(): THREE.CanvasTexture {
  const canvas = document.createElement('canvas');
  canvas.width = 512;
  canvas.height = 512;
  const ctx = canvas.getContext('2d')!;

  // Base industrial dark concrete
  ctx.fillStyle = '#222326';
  ctx.fillRect(0, 0, 512, 512);

  // Perlin-like multi-pass noise
  const imgData = ctx.getImageData(0, 0, 512, 512);
  const d = imgData.data;
  for (let i = 0; i < d.length; i += 4) {
    const noise = (Math.random() - 0.5) * 35;
    const base = 35 + noise;
    d[i] = Math.max(0, Math.min(255, base + (Math.random() - 0.5) * 15));
    d[i + 1] = Math.max(0, Math.min(255, base + (Math.random() - 0.5) * 15));
    d[i + 2] = Math.max(0, Math.min(255, base + (Math.random() - 0.5) * 18));
  }
  ctx.putImageData(imgData, 0, 0);

  // Grimy patches and stains
  for (let s = 0; s < 12; s++) {
    const x = Math.random() * 512;
    const y = Math.random() * 512;
    const r = 20 + Math.random() * 60;
    const grad = ctx.createRadialGradient(x, y, 0, x, y, r);
    grad.addColorStop(0, 'rgba(15, 12, 10, 0.4)');
    grad.addColorStop(1, 'rgba(15, 12, 10, 0)');
    ctx.fillStyle = grad;
    ctx.beginPath();
    ctx.arc(x, y, r, 0, Math.PI * 2);
    ctx.fill();
  }

  // Scratches and hairline cracks
  ctx.strokeStyle = 'rgba(10, 10, 10, 0.6)';
  ctx.lineWidth = 1;
  for (let c = 0; c < 8; c++) {
    let cx = Math.random() * 512;
    let cy = Math.random() * 512;
    ctx.beginPath();
    ctx.moveTo(cx, cy);
    for (let seg = 0; seg < 4; seg++) {
      cx += (Math.random() - 0.5) * 40;
      cy += (Math.random() - 0.5) * 40;
      ctx.lineTo(cx, cy);
    }
    ctx.stroke();
  }

  const texture = new THREE.CanvasTexture(canvas);
  texture.wrapS = THREE.RepeatWrapping;
  texture.wrapT = THREE.RepeatWrapping;
  return texture;
}

export function createFloorTexture(): THREE.CanvasTexture {
  const canvas = document.createElement('canvas');
  canvas.width = 512;
  canvas.height = 512;
  const ctx = canvas.getContext('2d')!;

  // Dark industrial floor with expansion joints
  ctx.fillStyle = '#1a1b1d';
  ctx.fillRect(0, 0, 512, 512);

  // Grid tiles / slabs
  ctx.strokeStyle = 'rgba(10, 10, 12, 0.9)';
  ctx.lineWidth = 4;
  ctx.strokeRect(0, 0, 512, 512);
  ctx.strokeRect(0, 0, 256, 256);
  ctx.strokeRect(256, 0, 256, 256);
  ctx.strokeRect(0, 256, 256, 256);
  ctx.strokeRect(256, 256, 256, 256);

  // Surface texture noise
  const imgData = ctx.getImageData(0, 0, 512, 512);
  const d = imgData.data;
  for (let i = 0; i < d.length; i += 4) {
    const grain = (Math.random() - 0.5) * 25;
    d[i] = Math.max(0, Math.min(255, d[i] + grain));
    d[i + 1] = Math.max(0, Math.min(255, d[i + 1] + grain));
    d[i + 2] = Math.max(0, Math.min(255, d[i + 2] + grain));
  }
  ctx.putImageData(imgData, 0, 0);

  // Impact scuffs & oil splatters
  for (let o = 0; o < 20; o++) {
    const ox = Math.random() * 512;
    const oy = Math.random() * 512;
    const rad = 5 + Math.random() * 25;
    const grad = ctx.createRadialGradient(ox, oy, 0, ox, oy, rad);
    grad.addColorStop(0, 'rgba(8, 8, 8, 0.7)');
    grad.addColorStop(1, 'rgba(20, 20, 20, 0)');
    ctx.fillStyle = grad;
    ctx.beginPath();
    ctx.arc(ox, oy, rad, 0, Math.PI * 2);
    ctx.fill();
  }

  const texture = new THREE.CanvasTexture(canvas);
  texture.wrapS = THREE.RepeatWrapping;
  texture.wrapT = THREE.RepeatWrapping;
  texture.repeat.set(4, 4);
  return texture;
}

export function createHazardStripesTexture(): THREE.CanvasTexture {
  const canvas = document.createElement('canvas');
  canvas.width = 256;
  canvas.height = 64;
  const ctx = canvas.getContext('2d')!;

  ctx.fillStyle = '#eab308'; // Warning yellow
  ctx.fillRect(0, 0, 256, 64);

  ctx.fillStyle = '#18181b'; // Dark black-gray
  ctx.beginPath();
  const stripeWidth = 24;
  for (let x = -64; x < 256 + 64; x += stripeWidth * 2) {
    ctx.beginPath();
    ctx.moveTo(x, 0);
    ctx.lineTo(x + stripeWidth, 0);
    ctx.lineTo(x + stripeWidth - 32, 64);
    ctx.lineTo(x - 32, 64);
    ctx.closePath();
    ctx.fill();
  }

  const texture = new THREE.CanvasTexture(canvas);
  texture.wrapS = THREE.RepeatWrapping;
  texture.wrapT = THREE.RepeatWrapping;
  return texture;
}

export function createWoodTexture(): THREE.CanvasTexture {
  const canvas = document.createElement('canvas');
  canvas.width = 512;
  canvas.height = 512;
  const ctx = canvas.getContext('2d')!;

  // Warm rugged timber base
  ctx.fillStyle = '#5c3a21';
  ctx.fillRect(0, 0, 512, 512);

  // Planks
  const plankH = 128;
  for (let y = 0; y < 512; y += plankH) {
    ctx.strokeStyle = '#2d180c';
    ctx.lineWidth = 3;
    ctx.strokeRect(0, y, 512, plankH);

    // Wood grain lines
    for (let g = 0; g < 40; g++) {
      const lineY = y + Math.random() * plankH;
      ctx.strokeStyle = Math.random() > 0.5 ? '#73492a' : '#452b18';
      ctx.lineWidth = 1 + Math.random() * 2;
      ctx.beginPath();
      ctx.moveTo(0, lineY);
      ctx.bezierCurveTo(
        170, lineY + (Math.random() - 0.5) * 15,
        340, lineY + (Math.random() - 0.5) * 15,
        512, lineY
      );
      ctx.stroke();
    }

    // Wood knot
    if (Math.random() > 0.3) {
      const kx = 100 + Math.random() * 312;
      const ky = y + plankH / 2 + (Math.random() - 0.5) * 20;
      ctx.fillStyle = '#341f12';
      ctx.beginPath();
      ctx.ellipse(kx, ky, 18, 9, Math.PI * 0.1, 0, Math.PI * 2);
      ctx.fill();
    }
  }

  const texture = new THREE.CanvasTexture(canvas);
  texture.wrapS = THREE.RepeatWrapping;
  texture.wrapT = THREE.RepeatWrapping;
  return texture;
}

export function createCRTTexture(label: string = 'STANDBY'): THREE.CanvasTexture {
  const canvas = document.createElement('canvas');
  canvas.width = 512;
  canvas.height = 384;
  const ctx = canvas.getContext('2d')!;

  // Deep dark glass
  ctx.fillStyle = '#060a0f';
  ctx.fillRect(0, 0, 512, 384);

  // Scanlines
  ctx.fillStyle = 'rgba(0, 20, 30, 0.4)';
  for (let y = 0; y < 384; y += 4) {
    ctx.fillRect(0, y, 512, 2);
  }

  // Glowing retro grid
  ctx.strokeStyle = 'rgba(0, 220, 255, 0.15)';
  ctx.lineWidth = 1;
  for (let x = 0; x < 512; x += 32) {
    ctx.beginPath();
    ctx.moveTo(x, 0);
    ctx.lineTo(x, 384);
    ctx.stroke();
  }
  for (let y = 0; y < 384; y += 32) {
    ctx.beginPath();
    ctx.moveTo(0, y);
    ctx.lineTo(512, y);
    ctx.stroke();
  }

  // Crosshair / target graphics
  ctx.strokeStyle = '#ef4444';
  ctx.lineWidth = 3;
  ctx.beginPath();
  ctx.arc(256, 192, 60, 0, Math.PI * 2);
  ctx.stroke();

  ctx.beginPath();
  ctx.moveTo(256, 110);
  ctx.lineTo(256, 274);
  ctx.moveTo(174, 192);
  ctx.lineTo(338, 192);
  ctx.stroke();

  // Glitchy text
  ctx.font = 'bold 28px monospace';
  ctx.fillStyle = '#ef4444';
  ctx.textAlign = 'center';
  ctx.fillText('FOGATODIO TARGET', 256, 80);

  ctx.font = 'bold 22px monospace';
  ctx.fillStyle = '#06b6d4';
  ctx.fillText(label, 256, 320);

  const texture = new THREE.CanvasTexture(canvas);
  return texture;
}

export function createCrackedGlassTexture(): THREE.CanvasTexture {
  const canvas = document.createElement('canvas');
  canvas.width = 512;
  canvas.height = 512;
  const ctx = canvas.getContext('2d')!;

  ctx.clearRect(0, 0, 512, 512);

  // White spiderweb cracks
  ctx.strokeStyle = 'rgba(255, 255, 255, 0.85)';
  ctx.lineWidth = 2;

  const originX = 256;
  const originY = 256;

  // Concentric jagged circles
  for (let r = 25; r <= 220; r += 35) {
    ctx.beginPath();
    const steps = 16;
    for (let s = 0; s <= steps; s++) {
      const angle = (s / steps) * Math.PI * 2;
      const wobble = r + (Math.random() - 0.5) * 20;
      const px = originX + Math.cos(angle) * wobble;
      const py = originY + Math.sin(angle) * wobble;
      if (s === 0) ctx.moveTo(px, py);
      else ctx.lineTo(px, py);
    }
    ctx.closePath();
    ctx.stroke();
  }

  // Radial fracture lines
  const spokes = 18;
  for (let i = 0; i < spokes; i++) {
    const angle = (i / spokes) * Math.PI * 2 + (Math.random() - 0.5) * 0.2;
    ctx.beginPath();
    ctx.moveTo(originX, originY);
    let curX = originX;
    let curY = originY;
    const len = 240 + Math.random() * 40;
    const numSub = 5;
    for (let s = 0; s < numSub; s++) {
      curX += (Math.cos(angle) * len) / numSub + (Math.random() - 0.5) * 15;
      curY += (Math.sin(angle) * len) / numSub + (Math.random() - 0.5) * 15;
      ctx.lineTo(curX, curY);
    }
    ctx.stroke();
  }

  const texture = new THREE.CanvasTexture(canvas);
  return texture;
}

export function createWarningSignTexture(): THREE.CanvasTexture {
  const canvas = document.createElement('canvas');
  canvas.width = 512;
  canvas.height = 384;
  const ctx = canvas.getContext('2d')!;

  // Weathered metal yellow sign
  ctx.fillStyle = '#f59e0b';
  ctx.fillRect(0, 0, 512, 384);

  // Black border
  ctx.strokeStyle = '#000000';
  ctx.lineWidth = 14;
  ctx.strokeRect(10, 10, 492, 364);

  // Black header block
  ctx.fillStyle = '#dc2626';
  ctx.fillRect(20, 20, 472, 90);

  ctx.font = '900 48px sans-serif';
  ctx.fillStyle = '#ffffff';
  ctx.textAlign = 'center';
  ctx.fillText('DANGER', 256, 85);

  ctx.font = '800 28px sans-serif';
  ctx.fillStyle = '#000000';
  ctx.fillText('STRESS RELIEF FACILITY', 256, 170);

  ctx.font = '600 22px sans-serif';
  ctx.fillText('HEAVY IMPACT ZONE', 256, 215);
  ctx.fillText('MAXIMUM FORCE PERMITTED', 256, 255);

  // Bolt rivets in 4 corners
  const rivets = [
    [30, 30],
    [482, 30],
    [30, 354],
    [482, 354],
  ];
  ctx.fillStyle = '#475569';
  rivets.forEach(([rx, ry]) => {
    ctx.beginPath();
    ctx.arc(rx, ry, 7, 0, Math.PI * 2);
    ctx.fill();
    ctx.strokeStyle = '#1e293b';
    ctx.lineWidth = 2;
    ctx.stroke();
  });

  const texture = new THREE.CanvasTexture(canvas);
  return texture;
}
