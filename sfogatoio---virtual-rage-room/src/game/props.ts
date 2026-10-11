import * as THREE from 'three';
import { BreakableCategory } from '../types/game';
import {
  createCRTTexture,
  createCrackedGlassTexture,
  createWoodTexture,
} from './proceduralTextures';

export interface BreakableProp {
  id: string;
  category: BreakableCategory;
  name: string;
  rootMesh: THREE.Group;
  hitBox: THREE.Mesh;
  maxHp: number;
  currentHp: number;
  stages: number;
  currentStage: number;
  scoreValue: number;
  impactSound:
    | 'glass'
    | 'wood'
    | 'metal'
    | 'tv'
    | 'ceramic'
    | 'bottle'
    | 'extinguisher'
    | 'electronics'
    | 'appliance'
    | 'printer'
    | 'barrel'
    | 'guitar'
    | 'sanitary'
    | 'carboy'
    | 'telephone'
    | 'plantpot'
    | 'lamp'
    | 'mannequin'
    | 'tires';
  crackMesh?: THREE.Mesh;
  screenMesh?: THREE.Mesh;
  onDamage?: (prop: BreakableProp, damage: number) => void;
  onShatter?: (prop: BreakableProp, strikeOrigin: THREE.Vector3, force: number) => void;
}

export interface DebrisPiece {
  mesh: THREE.Mesh;
  velocity: THREE.Vector3;
  angularVelocity: THREE.Vector3;
  age: number;
  maxAge: number;
  category: BreakableCategory;
  settled: boolean;
}

let crackedGlassTex: THREE.CanvasTexture | null = null;
let crtTex: THREE.CanvasTexture | null = null;
let woodTex: THREE.CanvasTexture | null = null;

function getCrackedGlassTex(): THREE.CanvasTexture {
  if (!crackedGlassTex) crackedGlassTex = createCrackedGlassTexture();
  return crackedGlassTex;
}

function getCRTTexture(): THREE.CanvasTexture {
  if (!crtTex) crtTex = createCRTTexture();
  return crtTex;
}

function getWoodTexture(): THREE.CanvasTexture {
  if (!woodTex) woodTex = createWoodTexture();
  return woodTex;
}

/**
 * 4K TV / Monitor
 */
export function createTVProp(
  id: string,
  position: THREE.Vector3,
  rotationY: number = 0,
  isWallMounted: boolean = false
): BreakableProp {
  const group = new THREE.Group();
  group.position.copy(position);
  group.rotation.y = rotationY;

  const frameMat = new THREE.MeshStandardMaterial({
    color: 0x18181b,
    roughness: 0.35,
    metalness: 0.6,
  });
  const frameGeo = new THREE.BoxGeometry(1.2, 0.72, 0.08);
  const frame = new THREE.Mesh(frameGeo, frameMat);
  frame.castShadow = true;
  group.add(frame);

  const screenMat = new THREE.MeshBasicMaterial({ map: getCRTTexture() });
  const screenGeo = new THREE.PlaneGeometry(1.12, 0.64);
  const screen = new THREE.Mesh(screenGeo, screenMat);
  screen.position.z = 0.042;
  group.add(screen);

  const crackMat = new THREE.MeshBasicMaterial({
    map: getCrackedGlassTex(),
    transparent: true,
    opacity: 0,
    blending: THREE.AdditiveBlending,
  });
  const crackGeo = new THREE.PlaneGeometry(1.12, 0.64);
  const crackMesh = new THREE.Mesh(crackGeo, crackMat);
  crackMesh.position.z = 0.045;
  group.add(crackMesh);

  if (!isWallMounted) {
    const standNeckGeo = new THREE.CylinderGeometry(0.04, 0.04, 0.22, 12);
    const standNeck = new THREE.Mesh(standNeckGeo, frameMat);
    standNeck.position.set(0, -0.42, 0);
    group.add(standNeck);

    const baseGeo = new THREE.BoxGeometry(0.45, 0.02, 0.3);
    const base = new THREE.Mesh(baseGeo, frameMat);
    base.position.set(0, -0.52, 0);
    group.add(base);
  }

  const hitGeo = new THREE.BoxGeometry(1.2, 0.8, 0.3);
  const hitMat = new THREE.MeshBasicMaterial({ visible: false });
  const hitBox = new THREE.Mesh(hitGeo, hitMat);
  hitBox.userData = { propId: id };
  group.add(hitBox);

  return {
    id,
    category: 'tv',
    name: '4K Surveillance Monitor',
    rootMesh: group,
    hitBox,
    maxHp: 80,
    currentHp: 80,
    stages: 2,
    currentStage: 0,
    scoreValue: 500,
    impactSound: 'tv',
    crackMesh,
    screenMesh: screen,
    onDamage: (p) => {
      if (p.currentHp <= p.maxHp * 0.5 && p.crackMesh) {
        (p.crackMesh.material as THREE.MeshBasicMaterial).opacity = 0.9;
        p.currentStage = 1;
      }
    },
  };
}

/**
 * Heavy Office Laser Multifunction Printer / Copier
 */
export function createPrinterProp(
  id: string,
  position: THREE.Vector3,
  rotationY: number = 0
): BreakableProp {
  const group = new THREE.Group();
  group.position.copy(position);
  group.rotation.y = rotationY;

  // Base body (beige/gray commercial plastic)
  const bodyMat = new THREE.MeshStandardMaterial({ color: 0x94a3b8, roughness: 0.5, metalness: 0.1 });
  const bodyGeo = new THREE.BoxGeometry(0.75, 0.5, 0.65);
  const body = new THREE.Mesh(bodyGeo, bodyMat);
  body.position.y = 0.25;
  body.castShadow = true;
  group.add(body);

  // Scanner top bed
  const scannerGeo = new THREE.BoxGeometry(0.72, 0.08, 0.62);
  const scannerMat = new THREE.MeshStandardMaterial({ color: 0x334155, roughness: 0.3, metalness: 0.4 });
  const scanner = new THREE.Mesh(scannerGeo, scannerMat);
  scanner.position.y = 0.54;
  group.add(scanner);

  // Paper output tray
  const trayGeo = new THREE.BoxGeometry(0.45, 0.03, 0.25);
  const tray = new THREE.Mesh(trayGeo, bodyMat);
  tray.position.set(0, 0.32, 0.42);
  group.add(tray);

  // Touch LCD control panel
  const lcdGeo = new THREE.PlaneGeometry(0.18, 0.12);
  const lcdMat = new THREE.MeshBasicMaterial({ color: 0x06b6d4 });
  const lcd = new THREE.Mesh(lcdGeo, lcdMat);
  lcd.position.set(0.25, 0.58, 0.25);
  lcd.rotation.x = -Math.PI / 4;
  group.add(lcd);

  // Hitbox
  const hitGeo = new THREE.BoxGeometry(0.85, 0.7, 0.75);
  const hitMat = new THREE.MeshBasicMaterial({ visible: false });
  const hitBox = new THREE.Mesh(hitGeo, hitMat);
  hitBox.position.y = 0.35;
  hitBox.userData = { propId: id };
  group.add(hitBox);

  return {
    id,
    category: 'printer',
    name: 'Office Laser Photocopier',
    rootMesh: group,
    hitBox,
    maxHp: 85,
    currentHp: 85,
    stages: 2,
    currentStage: 0,
    scoreValue: 550,
    impactSound: 'printer',
  };
}

/**
 * Wooden Oak Keg / Barrel
 */
export function createBarrelProp(
  id: string,
  position: THREE.Vector3
): BreakableProp {
  const group = new THREE.Group();
  group.position.copy(position);

  const woodMat = new THREE.MeshStandardMaterial({
    map: getWoodTexture(),
    roughness: 0.7,
  });

  // Barrel bulging cylinder
  const barrelGeo = new THREE.CylinderGeometry(0.32, 0.32, 0.85, 16);
  const barrel = new THREE.Mesh(barrelGeo, woodMat);
  barrel.position.y = 0.425;
  barrel.scale.set(1.2, 1, 1.2);
  barrel.castShadow = true;
  group.add(barrel);

  // Iron hoops
  const hoopMat = new THREE.MeshStandardMaterial({ color: 0x1f2937, metalness: 0.85, roughness: 0.3 });
  [-0.25, -0.08, 0.08, 0.25].forEach((offsetY) => {
    const hoop = new THREE.Mesh(new THREE.TorusGeometry(0.39, 0.015, 6, 24), hoopMat);
    hoop.rotation.x = Math.PI / 2;
    hoop.position.y = 0.425 + offsetY;
    group.add(hoop);
  });

  // Hitbox
  const hitGeo = new THREE.CylinderGeometry(0.45, 0.45, 0.9, 10);
  const hitMat = new THREE.MeshBasicMaterial({ visible: false });
  const hitBox = new THREE.Mesh(hitGeo, hitMat);
  hitBox.position.y = 0.45;
  hitBox.userData = { propId: id };
  group.add(hitBox);

  return {
    id,
    category: 'barrel',
    name: 'Vintage Oak Stave Keg',
    rootMesh: group,
    hitBox,
    maxHp: 90,
    currentHp: 90,
    stages: 2,
    currentStage: 0,
    scoreValue: 420,
    impactSound: 'barrel',
  };
}

/**
 * Electric Guitar on Floor Stand
 */
export function createGuitarProp(
  id: string,
  position: THREE.Vector3,
  rotationY: number = 0
): BreakableProp {
  const group = new THREE.Group();
  group.position.copy(position);
  group.rotation.y = rotationY;

  // Solid body (Cherry Red sunburst)
  const bodyMat = new THREE.MeshStandardMaterial({ color: 0xef4444, roughness: 0.2, metalness: 0.3 });
  const bodyGeo = new THREE.BoxGeometry(0.35, 0.5, 0.06);
  const body = new THREE.Mesh(bodyGeo, bodyMat);
  body.position.y = 0.45;
  body.castShadow = true;
  group.add(body);

  // White pickguard
  const pickguardMat = new THREE.MeshStandardMaterial({ color: 0xf1f5f9, roughness: 0.3 });
  const pg = new THREE.Mesh(new THREE.BoxGeometry(0.2, 0.3, 0.01), pickguardMat);
  pg.position.set(0.04, 0.45, 0.035);
  group.add(pg);

  // Maple Neck
  const neckMat = new THREE.MeshStandardMaterial({ color: 0xfde047, roughness: 0.4 });
  const neckGeo = new THREE.BoxGeometry(0.06, 0.65, 0.04);
  const neck = new THREE.Mesh(neckGeo, neckMat);
  neck.position.y = 0.95;
  group.add(neck);

  // Headstock
  const headGeo = new THREE.BoxGeometry(0.09, 0.18, 0.035);
  const head = new THREE.Mesh(headGeo, bodyMat);
  head.position.y = 1.35;
  group.add(head);

  // Floor stand tripod
  const standMat = new THREE.MeshStandardMaterial({ color: 0x18181b, metalness: 0.7 });
  const standLeg = new THREE.Mesh(new THREE.CylinderGeometry(0.015, 0.015, 0.6, 8), standMat);
  standLeg.position.set(0, 0.3, -0.15);
  standLeg.rotation.x = 0.3;
  group.add(standLeg);

  // Hitbox
  const hitGeo = new THREE.BoxGeometry(0.5, 1.4, 0.4);
  const hitMat = new THREE.MeshBasicMaterial({ visible: false });
  const hitBox = new THREE.Mesh(hitGeo, hitMat);
  hitBox.position.y = 0.7;
  hitBox.userData = { propId: id };
  group.add(hitBox);

  return {
    id,
    category: 'guitar',
    name: 'Electric Stratocaster Guitar',
    rootMesh: group,
    hitBox,
    maxHp: 55,
    currentHp: 55,
    stages: 1,
    currentStage: 0,
    scoreValue: 520,
    impactSound: 'guitar',
  };
}

/**
 * Porcelain Sanitary (Toilet Bowl / Washbasin) - Classic Smash Room Favorite!
 */
export function createSanitaryProp(
  id: string,
  position: THREE.Vector3,
  rotationY: number = 0
): BreakableProp {
  const group = new THREE.Group();
  group.position.copy(position);
  group.rotation.y = rotationY;

  const porcelainMat = new THREE.MeshStandardMaterial({
    color: 0xffffff,
    roughness: 0.15,
    metalness: 0.05,
  });

  // Bowl base
  const baseGeo = new THREE.CylinderGeometry(0.24, 0.18, 0.42, 16);
  const base = new THREE.Mesh(baseGeo, porcelainMat);
  base.position.y = 0.21;
  base.castShadow = true;
  group.add(base);

  // Upper oval rim
  const rimGeo = new THREE.TorusGeometry(0.22, 0.06, 10, 20);
  rimGeo.scale(0.85, 1.25, 1);
  rimGeo.rotateX(Math.PI / 2);
  const rim = new THREE.Mesh(rimGeo, porcelainMat);
  rim.position.y = 0.44;
  group.add(rim);

  // Water cistern tank on back
  const tankGeo = new THREE.BoxGeometry(0.48, 0.38, 0.22);
  const tank = new THREE.Mesh(tankGeo, porcelainMat);
  tank.position.set(0, 0.65, -0.22);
  tank.castShadow = true;
  group.add(tank);

  // Flush handle (chrome)
  const chromeMat = new THREE.MeshStandardMaterial({ color: 0xe2e8f0, metalness: 0.95, roughness: 0.1 });
  const handle = new THREE.Mesh(new THREE.CylinderGeometry(0.015, 0.015, 0.08, 8), chromeMat);
  handle.rotation.z = Math.PI / 2;
  handle.position.set(0.26, 0.78, -0.22);
  group.add(handle);

  // Hitbox
  const hitGeo = new THREE.BoxGeometry(0.65, 0.9, 0.7);
  const hitMat = new THREE.MeshBasicMaterial({ visible: false });
  const hitBox = new THREE.Mesh(hitGeo, hitMat);
  hitBox.position.y = 0.45;
  hitBox.userData = { propId: id };
  group.add(hitBox);

  return {
    id,
    category: 'sanitary',
    name: 'Porcelain Vitreous Sanitary Bowl',
    rootMesh: group,
    hitBox,
    maxHp: 70,
    currentHp: 70,
    stages: 2,
    currentStage: 0,
    scoreValue: 580,
    impactSound: 'sanitary',
  };
}

/**
 * Microwave Oven
 */
export function createMicrowaveProp(
  id: string,
  position: THREE.Vector3,
  rotationY: number = 0
): BreakableProp {
  const group = new THREE.Group();
  group.position.copy(position);
  group.rotation.y = rotationY;

  const bodyMat = new THREE.MeshStandardMaterial({
    color: 0xd4d4d8,
    roughness: 0.3,
    metalness: 0.7,
  });
  const bodyGeo = new THREE.BoxGeometry(0.65, 0.42, 0.45);
  const body = new THREE.Mesh(bodyGeo, bodyMat);
  body.castShadow = true;
  group.add(body);

  const doorMat = new THREE.MeshPhysicalMaterial({
    color: 0x09090b,
    roughness: 0.1,
    metalness: 0.9,
    reflectivity: 0.9,
  });
  const doorGeo = new THREE.PlaneGeometry(0.42, 0.32);
  const door = new THREE.Mesh(doorGeo, doorMat);
  door.position.set(-0.08, 0, 0.228);
  group.add(door);

  const padMat = new THREE.MeshStandardMaterial({ color: 0x18181b, roughness: 0.5 });
  const padGeo = new THREE.PlaneGeometry(0.14, 0.32);
  const pad = new THREE.Mesh(padGeo, padMat);
  pad.position.set(0.22, 0, 0.228);
  group.add(pad);

  const ledMat = new THREE.MeshBasicMaterial({ color: 0x22c55e });
  const ledGeo = new THREE.PlaneGeometry(0.1, 0.04);
  const led = new THREE.Mesh(ledGeo, ledMat);
  led.position.set(0.22, 0.1, 0.23);
  group.add(led);

  const hitGeo = new THREE.BoxGeometry(0.7, 0.45, 0.5);
  const hitMat = new THREE.MeshBasicMaterial({ visible: false });
  const hitBox = new THREE.Mesh(hitGeo, hitMat);
  hitBox.userData = { propId: id };
  group.add(hitBox);

  return {
    id,
    category: 'appliance',
    name: 'Industrial Microwave Oven',
    rootMesh: group,
    hitBox,
    maxHp: 75,
    currentHp: 75,
    stages: 2,
    currentStage: 0,
    scoreValue: 450,
    impactSound: 'appliance',
  };
}

/**
 * Desktop PC Tower & Keyboard
 */
export function createPCTowerProp(
  id: string,
  position: THREE.Vector3,
  rotationY: number = 0
): BreakableProp {
  const group = new THREE.Group();
  group.position.copy(position);
  group.rotation.y = rotationY;

  const caseMat = new THREE.MeshStandardMaterial({
    color: 0x18181b,
    roughness: 0.4,
    metalness: 0.8,
  });
  const towerGeo = new THREE.BoxGeometry(0.28, 0.55, 0.52);
  const tower = new THREE.Mesh(towerGeo, caseMat);
  tower.position.y = 0.275;
  tower.castShadow = true;
  group.add(tower);

  const fanMat = new THREE.MeshBasicMaterial({ color: 0x06b6d4 });
  const fanGeo = new THREE.CircleGeometry(0.08, 16);
  const fan = new THREE.Mesh(fanGeo, fanMat);
  fan.position.set(-0.142, 0.32, 0.05);
  fan.rotation.y = -Math.PI / 2;
  group.add(fan);

  const kbMat = new THREE.MeshStandardMaterial({ color: 0x27272a, roughness: 0.6 });
  const kbGeo = new THREE.BoxGeometry(0.44, 0.03, 0.16);
  const kb = new THREE.Mesh(kbGeo, kbMat);
  kb.position.set(0.2, 0.015, 0.28);
  kb.rotation.y = 0.15;
  kb.castShadow = true;
  group.add(kb);

  const hitGeo = new THREE.BoxGeometry(0.65, 0.6, 0.6);
  const hitMat = new THREE.MeshBasicMaterial({ visible: false });
  const hitBox = new THREE.Mesh(hitGeo, hitMat);
  hitBox.position.y = 0.3;
  hitBox.userData = { propId: id };
  group.add(hitBox);

  return {
    id,
    category: 'electronics',
    name: 'Workstation PC & Mechanical Keyboard',
    rootMesh: group,
    hitBox,
    maxHp: 65,
    currentHp: 65,
    stages: 2,
    currentStage: 0,
    scoreValue: 480,
    impactSound: 'electronics',
  };
}

/**
 * Fire Extinguisher
 */
export function createExtinguisherProp(
  id: string,
  position: THREE.Vector3,
  rotationY: number = 0
): BreakableProp {
  const group = new THREE.Group();
  group.position.copy(position);
  group.rotation.y = rotationY;

  const tankMat = new THREE.MeshStandardMaterial({
    color: 0xdc2626,
    roughness: 0.25,
    metalness: 0.7,
  });
  const tankGeo = new THREE.CylinderGeometry(0.1, 0.1, 0.55, 16);
  const tank = new THREE.Mesh(tankGeo, tankMat);
  tank.position.y = 0.275;
  tank.castShadow = true;
  group.add(tank);

  const topGeo = new THREE.SphereGeometry(0.1, 16, 8, 0, Math.PI * 2, 0, Math.PI / 2);
  const topCap = new THREE.Mesh(topGeo, tankMat);
  topCap.position.y = 0.55;
  group.add(topCap);

  const valveMat = new THREE.MeshStandardMaterial({ color: 0xca8a04, metalness: 0.9, roughness: 0.2 });
  const valveGeo = new THREE.BoxGeometry(0.08, 0.08, 0.14);
  const valve = new THREE.Mesh(valveGeo, valveMat);
  valve.position.set(0, 0.68, 0);
  group.add(valve);

  const hoseMat = new THREE.MeshStandardMaterial({ color: 0x111111, roughness: 0.9 });
  const hoseGeo = new THREE.CylinderGeometry(0.02, 0.02, 0.35, 8);
  const hose = new THREE.Mesh(hoseGeo, hoseMat);
  hose.position.set(0.08, 0.45, 0.06);
  group.add(hose);

  const hitGeo = new THREE.CylinderGeometry(0.16, 0.16, 0.75, 8);
  const hitMat = new THREE.MeshBasicMaterial({ visible: false });
  const hitBox = new THREE.Mesh(hitGeo, hitMat);
  hitBox.position.y = 0.375;
  hitBox.userData = { propId: id };
  group.add(hitBox);

  return {
    id,
    category: 'extinguisher',
    name: 'High-Pressure Fire Extinguisher',
    rootMesh: group,
    hitBox,
    maxHp: 50,
    currentHp: 50,
    stages: 1,
    currentStage: 0,
    scoreValue: 600,
    impactSound: 'extinguisher',
  };
}

/**
 * 80s Stereo Boombox
 */
export function createBoomboxProp(
  id: string,
  position: THREE.Vector3,
  rotationY: number = 0
): BreakableProp {
  const group = new THREE.Group();
  group.position.copy(position);
  group.rotation.y = rotationY;

  const boxMat = new THREE.MeshStandardMaterial({ color: 0x3f3f46, roughness: 0.4, metalness: 0.6 });
  const boxGeo = new THREE.BoxGeometry(0.7, 0.35, 0.2);
  const box = new THREE.Mesh(boxGeo, boxMat);
  box.position.y = 0.175;
  box.castShadow = true;
  group.add(box);

  const speakerMat = new THREE.MeshStandardMaterial({ color: 0x111111, roughness: 0.9 });
  const speakerGeo = new THREE.CircleGeometry(0.11, 16);

  const leftSpk = new THREE.Mesh(speakerGeo, speakerMat);
  leftSpk.position.set(-0.22, 0.175, 0.102);
  group.add(leftSpk);

  const rightSpk = new THREE.Mesh(speakerGeo, speakerMat);
  rightSpk.position.set(0.22, 0.175, 0.102);
  group.add(rightSpk);

  const deckMat = new THREE.MeshBasicMaterial({ color: 0x09090b });
  const deck = new THREE.Mesh(new THREE.PlaneGeometry(0.16, 0.12), deckMat);
  deck.position.set(0, 0.175, 0.102);
  group.add(deck);

  const antMat = new THREE.MeshStandardMaterial({ color: 0xe4e4e7, metalness: 0.9 });
  const antGeo = new THREE.CylinderGeometry(0.008, 0.008, 0.4, 8);
  const ant = new THREE.Mesh(antGeo, antMat);
  ant.position.set(-0.25, 0.5, -0.05);
  ant.rotation.z = -0.3;
  group.add(ant);

  const hitGeo = new THREE.BoxGeometry(0.75, 0.4, 0.3);
  const hitMat = new THREE.MeshBasicMaterial({ visible: false });
  const hitBox = new THREE.Mesh(hitGeo, hitMat);
  hitBox.position.y = 0.2;
  hitBox.userData = { propId: id };
  group.add(hitBox);

  return {
    id,
    category: 'electronics',
    name: 'Vintage Ghetto-Blaster Boombox',
    rootMesh: group,
    hitBox,
    maxHp: 45,
    currentHp: 45,
    stages: 1,
    currentStage: 0,
    scoreValue: 380,
    impactSound: 'electronics',
  };
}

/**
 * Wall Clock
 */
export function createWallClockProp(
  id: string,
  position: THREE.Vector3,
  rotationY: number = 0
): BreakableProp {
  const group = new THREE.Group();
  group.position.copy(position);
  group.rotation.y = rotationY;

  const frameMat = new THREE.MeshStandardMaterial({ color: 0x18181b, roughness: 0.5 });
  const frameGeo = new THREE.TorusGeometry(0.25, 0.03, 12, 24);
  const frame = new THREE.Mesh(frameGeo, frameMat);
  group.add(frame);

  const faceMat = new THREE.MeshBasicMaterial({ color: 0xf1f5f9 });
  const faceGeo = new THREE.CircleGeometry(0.25, 24);
  const face = new THREE.Mesh(faceGeo, faceMat);
  face.position.z = 0.01;
  group.add(face);

  const handMat = new THREE.MeshBasicMaterial({ color: 0x000000 });
  const handH = new THREE.Mesh(new THREE.PlaneGeometry(0.02, 0.12), handMat);
  handH.position.set(0, 0.05, 0.02);
  group.add(handH);

  const handM = new THREE.Mesh(new THREE.PlaneGeometry(0.015, 0.18), handMat);
  handM.position.set(0.06, 0.03, 0.02);
  handM.rotation.z = -Math.PI / 3;
  group.add(handM);

  const hitGeo = new THREE.CylinderGeometry(0.3, 0.3, 0.1, 12);
  const hitMat = new THREE.MeshBasicMaterial({ visible: false });
  const hitBox = new THREE.Mesh(hitGeo, hitMat);
  hitBox.rotation.x = Math.PI / 2;
  hitBox.userData = { propId: id };
  group.add(hitBox);

  return {
    id,
    category: 'appliance',
    name: 'Industrial Quartz Wall Clock',
    rootMesh: group,
    hitBox,
    maxHp: 30,
    currentHp: 30,
    stages: 1,
    currentStage: 0,
    scoreValue: 220,
    impactSound: 'glass',
  };
}

/**
 * Wooden Furniture item
 */
export function createWoodenFurnitureProp(
  id: string,
  position: THREE.Vector3,
  type: 'chair' | 'crate' | 'side_table' = 'crate'
): BreakableProp {
  const group = new THREE.Group();
  group.position.copy(position);

  const woodMat = new THREE.MeshStandardMaterial({
    map: getWoodTexture(),
    roughness: 0.7,
    metalness: 0.05,
  });

  if (type === 'crate') {
    const crateGeo = new THREE.BoxGeometry(0.7, 0.7, 0.7);
    const crate = new THREE.Mesh(crateGeo, woodMat);
    crate.position.y = 0.35;
    crate.castShadow = true;
    crate.receiveShadow = true;
    group.add(crate);
  } else if (type === 'side_table') {
    const topGeo = new THREE.BoxGeometry(0.9, 0.06, 0.9);
    const top = new THREE.Mesh(topGeo, woodMat);
    top.position.y = 0.72;
    top.castShadow = true;
    group.add(top);

    const legGeo = new THREE.BoxGeometry(0.06, 0.72, 0.06);
    const offsets = [
      [-0.38, -0.38],
      [0.38, -0.38],
      [-0.38, 0.38],
      [0.38, 0.38],
    ];
    offsets.forEach(([ox, oz]) => {
      const leg = new THREE.Mesh(legGeo, woodMat);
      leg.position.set(ox, 0.36, oz);
      leg.castShadow = true;
      group.add(leg);
    });
  } else {
    const seatGeo = new THREE.BoxGeometry(0.5, 0.05, 0.5);
    const seat = new THREE.Mesh(seatGeo, woodMat);
    seat.position.y = 0.5;
    group.add(seat);

    const backGeo = new THREE.BoxGeometry(0.5, 0.45, 0.04);
    const back = new THREE.Mesh(backGeo, woodMat);
    back.position.set(0, 0.75, -0.22);
    group.add(back);

    const legGeo = new THREE.CylinderGeometry(0.03, 0.02, 0.5, 8);
    const legOffsets = [
      [-0.2, -0.2],
      [0.2, -0.2],
      [-0.2, 0.2],
      [0.2, 0.2],
    ];
    legOffsets.forEach(([ox, oz]) => {
      const leg = new THREE.Mesh(legGeo, woodMat);
      leg.position.set(ox, 0.25, oz);
      group.add(leg);
    });
  }

  const hitGeo = new THREE.BoxGeometry(0.9, 0.8, 0.9);
  const hitMat = new THREE.MeshBasicMaterial({ visible: false });
  const hitBox = new THREE.Mesh(hitGeo, hitMat);
  hitBox.position.y = 0.4;
  hitBox.userData = { propId: id };
  group.add(hitBox);

  return {
    id,
    category: 'furniture',
    name: type === 'crate' ? 'Reinforced Timber Crate' : 'Oak Workshop Stool',
    rootMesh: group,
    hitBox,
    maxHp: 65,
    currentHp: 65,
    stages: 2,
    currentStage: 0,
    scoreValue: 350,
    impactSound: 'wood',
  };
}

/**
 * Glass Bottle
 */
export function createBottleProp(
  id: string,
  position: THREE.Vector3,
  bottleColor: 'green' | 'amber' | 'blue' = 'green'
): BreakableProp {
  const group = new THREE.Group();
  group.position.copy(position);

  const col =
    bottleColor === 'green'
      ? 0x10b981
      : bottleColor === 'amber'
      ? 0xd97706
      : 0x0ea5e9;

  const glassMat = new THREE.MeshPhysicalMaterial({
    color: col,
    transmission: 0.85,
    opacity: 1,
    transparent: true,
    roughness: 0.15,
    ior: 1.5,
    thickness: 0.1,
  });

  const baseGeo = new THREE.CylinderGeometry(0.065, 0.065, 0.22, 16);
  const base = new THREE.Mesh(baseGeo, glassMat);
  base.position.y = 0.11;
  base.castShadow = true;
  group.add(base);

  const shoulderGeo = new THREE.CylinderGeometry(0.03, 0.065, 0.08, 16);
  const shoulder = new THREE.Mesh(shoulderGeo, glassMat);
  shoulder.position.y = 0.26;
  group.add(shoulder);

  const neckGeo = new THREE.CylinderGeometry(0.024, 0.03, 0.14, 16);
  const neck = new THREE.Mesh(neckGeo, glassMat);
  neck.position.y = 0.37;
  group.add(neck);

  const capGeo = new THREE.CylinderGeometry(0.026, 0.026, 0.02, 12);
  const capMat = new THREE.MeshStandardMaterial({ color: 0xd4af37, metalness: 0.8, roughness: 0.3 });
  const cap = new THREE.Mesh(capGeo, capMat);
  cap.position.y = 0.45;
  group.add(cap);

  const hitGeo = new THREE.CylinderGeometry(0.09, 0.09, 0.48, 8);
  const hitMat = new THREE.MeshBasicMaterial({ visible: false });
  const hitBox = new THREE.Mesh(hitGeo, hitMat);
  hitBox.position.y = 0.24;
  hitBox.userData = { propId: id };
  group.add(hitBox);

  return {
    id,
    category: 'bottle',
    name: `${bottleColor.toUpperCase()} Glass Bottle`,
    rootMesh: group,
    hitBox,
    maxHp: 25,
    currentHp: 25,
    stages: 1,
    currentStage: 0,
    scoreValue: 150,
    impactSound: 'bottle',
  };
}

/**
 * Ceramic Vase, Plate, or Coffee Mug
 */
export function createCeramicProp(
  id: string,
  position: THREE.Vector3,
  type: 'vase' | 'plate' | 'mug' = 'vase'
): BreakableProp {
  const group = new THREE.Group();
  group.position.copy(position);

  const ceramicMat = new THREE.MeshStandardMaterial({
    color: type === 'mug' ? 0xef4444 : 0xf8fafc,
    roughness: 0.25,
    metalness: 0.1,
  });

  if (type === 'vase') {
    const bodyGeo = new THREE.SphereGeometry(0.16, 16, 12);
    bodyGeo.scale(1, 1.4, 1);
    const body = new THREE.Mesh(bodyGeo, ceramicMat);
    body.position.y = 0.22;
    body.castShadow = true;
    group.add(body);

    const rimGeo = new THREE.TorusGeometry(0.07, 0.015, 8, 16);
    rimGeo.rotateX(Math.PI / 2);
    const rim = new THREE.Mesh(rimGeo, ceramicMat);
    rim.position.y = 0.42;
    group.add(rim);
  } else if (type === 'mug') {
    const mugGeo = new THREE.CylinderGeometry(0.065, 0.06, 0.14, 16);
    const mug = new THREE.Mesh(mugGeo, ceramicMat);
    mug.position.y = 0.07;
    mug.castShadow = true;
    group.add(mug);

    const handleGeo = new THREE.TorusGeometry(0.04, 0.012, 8, 12, Math.PI);
    handleGeo.rotateY(Math.PI / 2);
    const handle = new THREE.Mesh(handleGeo, ceramicMat);
    handle.position.set(0.075, 0.07, 0);
    group.add(handle);
  } else {
    for (let i = 0; i < 3; i++) {
      const plateGeo = new THREE.CylinderGeometry(0.18, 0.14, 0.025, 16);
      const plate = new THREE.Mesh(plateGeo, ceramicMat);
      plate.position.y = 0.015 + i * 0.035;
      plate.castShadow = true;
      group.add(plate);
    }
  }

  const hitGeo = new THREE.CylinderGeometry(0.18, 0.18, 0.4, 8);
  const hitMat = new THREE.MeshBasicMaterial({ visible: false });
  const hitBox = new THREE.Mesh(hitGeo, hitMat);
  hitBox.position.y = 0.2;
  hitBox.userData = { propId: id };
  group.add(hitBox);

  return {
    id,
    category: 'ceramic',
    name: type === 'vase' ? 'Porcelain Urn' : type === 'mug' ? 'Ceramic Coffee Mug' : 'Ceramic Dinnerware Stack',
    rootMesh: group,
    hitBox,
    maxHp: 30,
    currentHp: 30,
    stages: 1,
    currentStage: 0,
    scoreValue: 200,
    impactSound: 'ceramic',
  };
}

/**
 * Wall Window or Mirror
 */
export function createWindowProp(
  id: string,
  position: THREE.Vector3,
  rotationY: number = 0,
  width: number = 2.0,
  height: number = 1.4
): BreakableProp {
  const group = new THREE.Group();
  group.position.copy(position);
  group.rotation.y = rotationY;

  const frameMat = new THREE.MeshStandardMaterial({
    color: 0x27272a,
    roughness: 0.5,
    metalness: 0.8,
  });
  const frameGeo = new THREE.BoxGeometry(width, height, 0.06);
  const frame = new THREE.Mesh(frameGeo, frameMat);
  group.add(frame);

  const glassMat = new THREE.MeshPhysicalMaterial({
    color: 0xcfd8dc,
    transmission: 0.7,
    roughness: 0.05,
    metalness: 0.9,
    reflectivity: 0.95,
    transparent: true,
    opacity: 0.8,
  });
  const glassGeo = new THREE.PlaneGeometry(width - 0.12, height - 0.12);
  const glass = new THREE.Mesh(glassGeo, glassMat);
  glass.position.z = 0.032;
  group.add(glass);

  const crackMat = new THREE.MeshBasicMaterial({
    map: getCrackedGlassTex(),
    transparent: true,
    opacity: 0,
    blending: THREE.AdditiveBlending,
  });
  const crackMesh = new THREE.Mesh(glassGeo, crackMat);
  crackMesh.position.z = 0.035;
  group.add(crackMesh);

  const hitGeo = new THREE.BoxGeometry(width, height, 0.2);
  const hitMat = new THREE.MeshBasicMaterial({ visible: false });
  const hitBox = new THREE.Mesh(hitGeo, hitMat);
  hitBox.userData = { propId: id };
  group.add(hitBox);

  return {
    id,
    category: 'window',
    name: 'Reinforced Observation Mirror',
    rootMesh: group,
    hitBox,
    maxHp: 70,
    currentHp: 70,
    stages: 2,
    currentStage: 0,
    scoreValue: 400,
    impactSound: 'glass',
    crackMesh,
    onDamage: (p) => {
      if (p.currentHp <= p.maxHp * 0.5 && p.crackMesh) {
        (p.crackMesh.material as THREE.MeshBasicMaterial).opacity = 0.95;
        p.currentStage = 1;
      }
    },
  };
}

/**
 * Mineral Water Dispenser Cooler with 19L Blue Inverted Bottle
 */
export function createCarboyProp(
  id: string,
  position: THREE.Vector3,
  rotationY: number = 0
): BreakableProp {
  const group = new THREE.Group();
  group.position.copy(position);
  group.rotation.y = rotationY;

  // Dispenser stand (white/silver plastic body)
  const baseMat = new THREE.MeshStandardMaterial({ color: 0xf1f5f9, roughness: 0.35, metalness: 0.1 });
  const baseGeo = new THREE.BoxGeometry(0.38, 0.85, 0.38);
  const base = new THREE.Mesh(baseGeo, baseMat);
  base.position.y = 0.425;
  base.castShadow = true;
  group.add(base);

  // Recessed tap alcove
  const alcoveGeo = new THREE.BoxGeometry(0.26, 0.28, 0.12);
  const alcoveMat = new THREE.MeshStandardMaterial({ color: 0x334155, roughness: 0.8 });
  const alcove = new THREE.Mesh(alcoveGeo, alcoveMat);
  alcove.position.set(0, 0.55, 0.14);
  group.add(alcove);

  // Blue & Red taps
  const tapBlue = new THREE.Mesh(
    new THREE.BoxGeometry(0.04, 0.05, 0.05),
    new THREE.MeshStandardMaterial({ color: 0x3b82f6 })
  );
  tapBlue.position.set(-0.06, 0.62, 0.17);
  group.add(tapBlue);

  const tapRed = new THREE.Mesh(
    new THREE.BoxGeometry(0.04, 0.05, 0.05),
    new THREE.MeshStandardMaterial({ color: 0xef4444 })
  );
  tapRed.position.set(0.06, 0.62, 0.17);
  group.add(tapRed);

  // 19L Blue Polycarbonate Inverted Carboy Bottle
  const bottleMat = new THREE.MeshPhysicalMaterial({
    color: 0x0284c7,
    roughness: 0.1,
    transmission: 0.82,
    transparent: true,
    opacity: 0.85,
    ior: 1.45,
    thickness: 0.15,
  });
  const bottleGeo = new THREE.CylinderGeometry(0.14, 0.14, 0.45, 16);
  const bottle = new THREE.Mesh(bottleGeo, bottleMat);
  bottle.position.y = 1.08;
  bottle.castShadow = true;
  group.add(bottle);

  // Bottle neck collar
  const neckGeo = new THREE.CylinderGeometry(0.06, 0.13, 0.08, 16);
  const neck = new THREE.Mesh(neckGeo, bottleMat);
  neck.position.y = 0.86;
  group.add(neck);

  const hitGeo = new THREE.BoxGeometry(0.5, 1.4, 0.5);
  const hitMat = new THREE.MeshBasicMaterial({ visible: false });
  const hitBox = new THREE.Mesh(hitGeo, hitMat);
  hitBox.position.y = 0.7;
  hitBox.userData = { propId: id };
  group.add(hitBox);

  return {
    id,
    category: 'carboy',
    name: 'Office Mineral Water Cooler',
    rootMesh: group,
    hitBox,
    maxHp: 60,
    currentHp: 60,
    stages: 2,
    currentStage: 0,
    scoreValue: 560,
    impactSound: 'carboy',
  };
}

/**
 * 80s/90s Office Push-Button Desk Telephone
 */
export function createTelephoneProp(
  id: string,
  position: THREE.Vector3,
  rotationY: number = 0
): BreakableProp {
  const group = new THREE.Group();
  group.position.copy(position);
  group.rotation.y = rotationY;

  const phoneMat = new THREE.MeshStandardMaterial({ color: 0xd6d3d1, roughness: 0.5 });
  const baseGeo = new THREE.BoxGeometry(0.24, 0.08, 0.26);
  const base = new THREE.Mesh(baseGeo, phoneMat);
  base.position.y = 0.04;
  base.rotation.x = -0.15;
  base.castShadow = true;
  group.add(base);

  // Keypad
  const keypad = new THREE.Mesh(
    new THREE.PlaneGeometry(0.12, 0.14),
    new THREE.MeshStandardMaterial({ color: 0x292524, roughness: 0.7 })
  );
  keypad.position.set(0.03, 0.075, 0.02);
  keypad.rotation.x = -Math.PI / 2 - 0.15;
  group.add(keypad);

  // Handset receiver
  const handsetMat = new THREE.MeshStandardMaterial({ color: 0x1c1917, roughness: 0.4 });
  const handset = new THREE.Mesh(new THREE.BoxGeometry(0.06, 0.04, 0.22), handsetMat);
  handset.position.set(-0.07, 0.09, 0.02);
  handset.castShadow = true;
  group.add(handset);

  const hitGeo = new THREE.BoxGeometry(0.35, 0.2, 0.35);
  const hitMat = new THREE.MeshBasicMaterial({ visible: false });
  const hitBox = new THREE.Mesh(hitGeo, hitMat);
  hitBox.position.y = 0.08;
  hitBox.userData = { propId: id };
  group.add(hitBox);

  return {
    id,
    category: 'telephone',
    name: 'Vintage Push-Button Office Phone',
    rootMesh: group,
    hitBox,
    maxHp: 35,
    currentHp: 35,
    stages: 1,
    currentStage: 0,
    scoreValue: 260,
    impactSound: 'telephone',
  };
}

/**
 * Terracotta Ceramic Plant Pot with Indoor Fern
 */
export function createPlantPotProp(
  id: string,
  position: THREE.Vector3
): BreakableProp {
  const group = new THREE.Group();
  group.position.copy(position);

  // Terracotta clay pot
  const potMat = new THREE.MeshStandardMaterial({ color: 0xc2410c, roughness: 0.8 });
  const potGeo = new THREE.CylinderGeometry(0.18, 0.12, 0.28, 16);
  const pot = new THREE.Mesh(potGeo, potMat);
  pot.position.y = 0.14;
  pot.castShadow = true;
  group.add(pot);

  // Soil
  const soilMat = new THREE.MeshStandardMaterial({ color: 0x451a03, roughness: 0.95 });
  const soilGeo = new THREE.CylinderGeometry(0.17, 0.17, 0.04, 16);
  const soil = new THREE.Mesh(soilGeo, soilMat);
  soil.position.y = 0.27;
  group.add(soil);

  // Plant leaves
  const leafMat = new THREE.MeshStandardMaterial({ color: 0x15803d, roughness: 0.6, side: THREE.DoubleSide });
  for (let i = 0; i < 6; i++) {
    const angle = (i / 6) * Math.PI * 2;
    const leafGeo = new THREE.PlaneGeometry(0.12, 0.25);
    const leaf = new THREE.Mesh(leafGeo, leafMat);
    leaf.position.set(Math.cos(angle) * 0.06, 0.38, Math.sin(angle) * 0.06);
    leaf.rotation.y = angle;
    leaf.rotation.x = 0.4;
    group.add(leaf);
  }

  const hitGeo = new THREE.CylinderGeometry(0.25, 0.2, 0.55, 8);
  const hitMat = new THREE.MeshBasicMaterial({ visible: false });
  const hitBox = new THREE.Mesh(hitGeo, hitMat);
  hitBox.position.y = 0.27;
  hitBox.userData = { propId: id };
  group.add(hitBox);

  return {
    id,
    category: 'plantpot',
    name: 'Terracotta Potted Ficus Plant',
    rootMesh: group,
    hitBox,
    maxHp: 40,
    currentHp: 40,
    stages: 1,
    currentStage: 0,
    scoreValue: 310,
    impactSound: 'plantpot',
  };
}

/**
 * Halogen Construction Work Light / Floodlamp on Stand
 */
export function createLampProp(
  id: string,
  position: THREE.Vector3,
  rotationY: number = 0
): BreakableProp {
  const group = new THREE.Group();
  group.position.copy(position);
  group.rotation.y = rotationY;

  const yellowMat = new THREE.MeshStandardMaterial({ color: 0xeab308, roughness: 0.35, metalness: 0.6 });
  const steelMat = new THREE.MeshStandardMaterial({ color: 0x27272a, roughness: 0.4, metalness: 0.8 });

  // Tripod Base
  const mast = new THREE.Mesh(new THREE.CylinderGeometry(0.02, 0.02, 1.2, 8), steelMat);
  mast.position.y = 0.6;
  group.add(mast);

  for (let i = 0; i < 3; i++) {
    const leg = new THREE.Mesh(new THREE.CylinderGeometry(0.015, 0.015, 0.6, 6), steelMat);
    const ang = (i / 3) * Math.PI * 2;
    leg.position.set(Math.cos(ang) * 0.2, 0.25, Math.sin(ang) * 0.2);
    leg.rotation.z = Math.cos(ang) * 0.4;
    leg.rotation.x = Math.sin(ang) * 0.4;
    group.add(leg);
  }

  // Yellow Halogen Enclosure
  const head = new THREE.Mesh(new THREE.BoxGeometry(0.35, 0.25, 0.18), yellowMat);
  head.position.y = 1.25;
  head.castShadow = true;
  group.add(head);

  // Glass face
  const glass = new THREE.Mesh(
    new THREE.PlaneGeometry(0.3, 0.2),
    new THREE.MeshPhysicalMaterial({ color: 0xfef08a, roughness: 0.1, transmission: 0.8, opacity: 0.9 })
  );
  glass.position.set(0, 1.25, 0.092);
  group.add(glass);

  // Wire safety cage guard
  const cage = new THREE.Mesh(
    new THREE.BoxGeometry(0.32, 0.22, 0.04),
    new THREE.MeshBasicMaterial({ wireframe: true, color: 0x18181b })
  );
  cage.position.set(0, 1.25, 0.1);
  group.add(cage);

  const hitGeo = new THREE.BoxGeometry(0.5, 1.4, 0.5);
  const hitMat = new THREE.MeshBasicMaterial({ visible: false });
  const hitBox = new THREE.Mesh(hitGeo, hitMat);
  hitBox.position.y = 0.7;
  hitBox.userData = { propId: id };
  group.add(hitBox);

  return {
    id,
    category: 'lamp',
    name: 'Industrial Halogen Floodlight',
    rootMesh: group,
    hitBox,
    maxHp: 55,
    currentHp: 55,
    stages: 2,
    currentStage: 0,
    scoreValue: 490,
    impactSound: 'lamp',
  };
}

/**
 * Articulated Wooden Crash-Test Dummy / Mannequin
 */
export function createMannequinProp(
  id: string,
  position: THREE.Vector3,
  rotationY: number = 0
): BreakableProp {
  const group = new THREE.Group();
  group.position.copy(position);
  group.rotation.y = rotationY;

  const woodMat = new THREE.MeshStandardMaterial({
    map: getWoodTexture(),
    roughness: 0.6,
  });
  const ironMat = new THREE.MeshStandardMaterial({ color: 0x18181b, metalness: 0.8 });

  // Iron base disk
  const base = new THREE.Mesh(new THREE.CylinderGeometry(0.3, 0.3, 0.03, 16), ironMat);
  base.position.y = 0.015;
  group.add(base);

  // Center pole
  const pole = new THREE.Mesh(new THREE.CylinderGeometry(0.02, 0.02, 0.9, 8), ironMat);
  pole.position.y = 0.45;
  group.add(pole);

  // Pelvis & Torso
  const torso = new THREE.Mesh(new THREE.BoxGeometry(0.38, 0.55, 0.22), woodMat);
  torso.position.y = 1.1;
  torso.castShadow = true;
  group.add(torso);

  // Head sphere
  const head = new THREE.Mesh(new THREE.SphereGeometry(0.11, 12, 10), woodMat);
  head.position.y = 1.5;
  group.add(head);

  // Shoulders & Arms
  [-0.24, 0.24].forEach((sx) => {
    const arm = new THREE.Mesh(new THREE.CylinderGeometry(0.04, 0.035, 0.45, 8), woodMat);
    arm.position.set(sx, 1.05, 0);
    arm.rotation.z = sx > 0 ? -0.15 : 0.15;
    group.add(arm);
  });

  const hitGeo = new THREE.BoxGeometry(0.6, 1.7, 0.45);
  const hitMat = new THREE.MeshBasicMaterial({ visible: false });
  const hitBox = new THREE.Mesh(hitGeo, hitMat);
  hitBox.position.y = 0.85;
  hitBox.userData = { propId: id };
  group.add(hitBox);

  return {
    id,
    category: 'mannequin',
    name: 'Heavy Crash-Test Mannequin',
    rootMesh: group,
    hitBox,
    maxHp: 95,
    currentHp: 95,
    stages: 2,
    currentStage: 0,
    scoreValue: 650,
    impactSound: 'mannequin',
  };
}

/**
 * Ultra-Realistic Human Boxing / Training Mannequin with Curved 3D Facial Mapping
 */
export function createCustomFaceMannequinProp(
  id: string,
  position: THREE.Vector3,
  rotationY: number = 0,
  faceTexture?: THREE.Texture | null,
  faceName: string = 'Bersaglio Personalizzato'
): BreakableProp {
  const group = new THREE.Group();
  group.position.copy(position);
  group.rotation.y = rotationY;

  // Realistic Materials
  const skinMat = new THREE.MeshStandardMaterial({
    color: 0xdeb887,
    roughness: 0.45,
    metalness: 0.03,
  });

  const hairMat = new THREE.MeshStandardMaterial({
    color: 0x1c1917,
    roughness: 0.85,
    metalness: 0.05,
  });

  const shirtMat = new THREE.MeshStandardMaterial({
    color: 0x1e293b,
    roughness: 0.7,
    metalness: 0.08,
  });

  const pantsMat = new THREE.MeshStandardMaterial({
    color: 0x0f172a,
    roughness: 0.75,
    metalness: 0.05,
  });

  const beltMat = new THREE.MeshStandardMaterial({
    color: 0x18181b,
    roughness: 0.5,
    metalness: 0.2,
  });

  const buckleMat = new THREE.MeshStandardMaterial({
    color: 0x94a3b8,
    metalness: 0.85,
    roughness: 0.2,
  });

  const bootsMat = new THREE.MeshStandardMaterial({
    color: 0x171717,
    roughness: 0.5,
    metalness: 0.2,
  });

  const ironMat = new THREE.MeshStandardMaterial({
    color: 0x262626,
    metalness: 0.75,
    roughness: 0.35,
  });

  // 1. Heavy Gym Base & Stabilization Pedestal
  const base = new THREE.Mesh(new THREE.CylinderGeometry(0.42, 0.45, 0.05, 24), ironMat);
  base.position.y = 0.025;
  base.receiveShadow = true;
  group.add(base);

  const baseCollar = new THREE.Mesh(new THREE.CylinderGeometry(0.065, 0.08, 0.12, 16), ironMat);
  baseCollar.position.y = 0.08;
  group.add(baseCollar);

  // 2. Realistic Legs & Combat Boots
  [-0.14, 0.14].forEach((lx) => {
    // Combat Boot
    const boot = new THREE.Mesh(new THREE.BoxGeometry(0.125, 0.12, 0.28), bootsMat);
    boot.position.set(lx, 0.08, 0.03);
    boot.rotation.y = lx > 0 ? 0.08 : -0.08;
    boot.castShadow = true;
    group.add(boot);

    // Shin / Calf
    const calf = new THREE.Mesh(new THREE.CylinderGeometry(0.07, 0.055, 0.42, 14), pantsMat);
    calf.position.set(lx, 0.33, 0);
    calf.castShadow = true;
    group.add(calf);

    // Knee Cap
    const knee = new THREE.Mesh(new THREE.SphereGeometry(0.075, 12, 10), pantsMat);
    knee.position.set(lx, 0.56, 0.015);
    knee.castShadow = true;
    group.add(knee);

    // Thigh (Quadriceps)
    const thigh = new THREE.Mesh(new THREE.CylinderGeometry(0.098, 0.078, 0.44, 14), pantsMat);
    thigh.position.set(lx, 0.80, 0);
    thigh.castShadow = true;
    group.add(thigh);
  });

  // 3. Pelvis & Tactical Belt
  const pelvis = new THREE.Mesh(new THREE.CylinderGeometry(0.19, 0.17, 0.22, 16), pantsMat);
  pelvis.position.y = 1.05;
  pelvis.castShadow = true;
  group.add(pelvis);

  const belt = new THREE.Mesh(new THREE.CylinderGeometry(0.195, 0.195, 0.05, 16), beltMat);
  belt.position.y = 1.15;
  group.add(belt);

  const buckle = new THREE.Mesh(new THREE.BoxGeometry(0.07, 0.045, 0.02), buckleMat);
  buckle.position.set(0, 1.15, 0.196);
  group.add(buckle);

  // 4. Athletic Tapered Abdomen & Waist
  const abdomen = new THREE.Mesh(new THREE.CylinderGeometry(0.20, 0.185, 0.24, 16), shirtMat);
  abdomen.position.y = 1.28;
  abdomen.castShadow = true;
  group.add(abdomen);

  // 5. Broad Muscular Chest & Upper Torso (Pectorals & Ribcage)
  const chest = new THREE.Mesh(new THREE.BoxGeometry(0.46, 0.32, 0.28), shirtMat);
  chest.position.y = 1.50;
  chest.castShadow = true;
  group.add(chest);

  // Defined Left & Right Pectorals contour
  [-0.11, 0.11].forEach((px) => {
    const pec = new THREE.Mesh(new THREE.BoxGeometry(0.18, 0.15, 0.04), shirtMat);
    pec.position.set(px, 1.52, 0.145);
    pec.castShadow = true;
    group.add(pec);
  });

  // Target Bullseye Decal on Chest
  const targetChest = new THREE.Mesh(
    new THREE.RingGeometry(0.04, 0.11, 16),
    new THREE.MeshBasicMaterial({ color: 0xef4444, side: THREE.DoubleSide })
  );
  targetChest.position.set(0, 1.50, 0.166);
  group.add(targetChest);

  const targetCenter = new THREE.Mesh(
    new THREE.CircleGeometry(0.038, 16),
    new THREE.MeshBasicMaterial({ color: 0xffffff, side: THREE.DoubleSide })
  );
  targetCenter.position.set(0, 1.50, 0.167);
  group.add(targetCenter);

  // 6. Deltoids & Shoulders
  [-0.27, 0.27].forEach((sx) => {
    const shoulder = new THREE.Mesh(new THREE.SphereGeometry(0.095, 14, 12), shirtMat);
    shoulder.position.set(sx, 1.58, 0);
    shoulder.castShadow = true;
    group.add(shoulder);

    // Upper Arm (Biceps / Triceps)
    const upperArm = new THREE.Mesh(new THREE.CylinderGeometry(0.07, 0.06, 0.32, 12), shirtMat);
    upperArm.position.set(sx, 1.40, 0.04);
    upperArm.rotation.z = sx > 0 ? -0.15 : 0.15;
    upperArm.rotation.x = 0.25; // Angled forward in athletic boxer stance
    upperArm.castShadow = true;
    group.add(upperArm);

    // Elbow
    const elbow = new THREE.Mesh(new THREE.SphereGeometry(0.06, 10, 8), shirtMat);
    elbow.position.set(sx * 1.05, 1.25, 0.08);
    group.add(elbow);

    // Forearm
    const forearm = new THREE.Mesh(new THREE.CylinderGeometry(0.06, 0.048, 0.28, 12), skinMat);
    forearm.position.set(sx * 1.02, 1.13, 0.16);
    forearm.rotation.x = 0.65;
    forearm.castShadow = true;
    group.add(forearm);

    // Clenched Boxing Hand / Fist
    const fist = new THREE.Mesh(new THREE.BoxGeometry(0.085, 0.095, 0.10), bootsMat);
    fist.position.set(sx * 0.95, 1.04, 0.25);
    fist.castShadow = true;
    group.add(fist);
  });

  // 7. Muscular Neck Column & Trapezius
  const neck = new THREE.Mesh(new THREE.CylinderGeometry(0.072, 0.088, 0.18, 16), skinMat);
  neck.position.y = 1.68;
  neck.castShadow = true;
  group.add(neck);

  // 8. Head Group (Cranium, Jaw, Ears, Dedicated Studio Light & 3D Curved Face)
  const headGroup = new THREE.Group();
  headGroup.position.set(0, 1.84, 0);

  // Cranium (Anatomical Cranial Vault - positioned behind the face to prevent any clipping)
  const craniumGeo = new THREE.SphereGeometry(0.136, 24, 20);
  const cranium = new THREE.Mesh(craniumGeo, skinMat);
  cranium.scale.set(0.92, 1.15, 0.92);
  cranium.position.set(0, 0, -0.045);
  cranium.castShadow = false;
  headGroup.add(cranium);

  // Hair / Scalp Silhouette (Crown & Back of head)
  const hairGeo = new THREE.SphereGeometry(0.140, 20, 16, 0, Math.PI * 2, 0, Math.PI * 0.52);
  const hair = new THREE.Mesh(hairGeo, hairMat);
  hair.scale.set(0.93, 1.16, 0.94);
  hair.position.set(0, 0.02, -0.042);
  headGroup.add(hair);

  // Defined Jaw & Chin Foundation
  const chin = new THREE.Mesh(new THREE.CylinderGeometry(0.045, 0.075, 0.12, 14), skinMat);
  chin.position.set(0, -0.11, 0.035);
  chin.rotation.x = -0.22;
  headGroup.add(chin);

  // Left & Right Anatomical Ears
  [-0.134, 0.134].forEach((ex) => {
    const ear = new THREE.Mesh(new THREE.BoxGeometry(0.016, 0.052, 0.038), skinMat);
    ear.position.set(ex, 0, -0.015);
    headGroup.add(ear);
  });

  // 9. Ultra-Realistic 3D Anatomical Curved Face Mask facing FORWARD (+Z towards player)
  // Perfectly projected forward with convex facial curvature so it NEVER clips or hides
  const faceWidth = 0.26;
  const faceHeight = 0.33;
  const faceGeo = new THREE.PlaneGeometry(faceWidth, faceHeight, 28, 28);
  const pos = faceGeo.attributes.position;
  for (let i = 0; i < pos.count; i++) {
    const x = pos.getX(i);
    const y = pos.getY(i);
    const nx = x / (faceWidth * 0.5); // -1 to 1
    const ny = y / (faceHeight * 0.5); // -1 to 1
    // Lifelike facial curvature: nose bridge and central features project forward
    const forwardCurve = 0.042 * (1 - Math.pow(nx, 2)) + 0.018 * (1 - Math.pow(ny, 2));
    pos.setZ(i, forwardCurve);
  }
  faceGeo.computeVertexNormals();

  if (faceTexture) {
    faceTexture.colorSpace = THREE.SRGBColorSpace;
    faceTexture.wrapS = THREE.ClampToEdgeWrapping;
    faceTexture.wrapT = THREE.ClampToEdgeWrapping;
    faceTexture.needsUpdate = true;
  }

  // Realistic face material with natural lighting (no artificial glare or washed-out glow)
  const faceMat = faceTexture
    ? new THREE.MeshStandardMaterial({
        map: faceTexture,
        emissive: new THREE.Color(0x222222),
        emissiveMap: faceTexture,
        emissiveIntensity: 0.02, // Calibrated subtle baseline: 100% natural photo contrast & skin depth
        roughness: 0.55,        // Natural matte skin texture, eliminates specular glare
        metalness: 0.0,
        side: THREE.FrontSide,
        transparent: true,      // Background removal support
        alphaTest: 0.05,
      })
    : new THREE.MeshStandardMaterial({
        color: 0xdeb887,
        roughness: 0.55,
        metalness: 0.02,
        side: THREE.FrontSide,
      });

  const faceMesh = new THREE.Mesh(faceGeo, faceMat);
  faceMesh.position.set(0, 0.02, 0.065);
  faceMesh.renderOrder = 10;
  headGroup.add(faceMesh);

  group.add(headGroup);

  // Comprehensive Human Hitbox (Head, Torso & Limbs coverage)
  const hitGeo = new THREE.BoxGeometry(0.72, 1.95, 0.50);
  const hitMat = new THREE.MeshBasicMaterial({ visible: false });
  const hitBox = new THREE.Mesh(hitGeo, hitMat);
  hitBox.position.y = 0.98;
  hitBox.userData = { propId: id, isCustomMannequin: true };
  group.add(hitBox);

  group.userData = {
    isCustomMannequin: true,
    initialRotY: rotationY,
    headGroup,
    faceMesh,
  };

  return {
    id,
    category: 'mannequin',
    name: `Manichino Realistico: ${faceName}`,
    rootMesh: group,
    hitBox,
    maxHp: 100,
    currentHp: 100,
    stages: 3,
    currentStage: 0,
    scoreValue: 1200,
    impactSound: 'mannequin',
    onDamage: (prop, dmg) => {
      // Realistic heavy-bag spring recoil & head jolt
      const joltForce = Math.min(1.0, dmg / 40);
      group.rotation.x = -0.25 * joltForce;
      group.rotation.z = (Math.random() - 0.5) * 0.22 * joltForce;

      if (headGroup) {
        headGroup.rotation.x = -0.38 * joltForce;
        headGroup.rotation.y = (Math.random() - 0.5) * 0.55 * joltForce;
        headGroup.rotation.z = (Math.random() - 0.5) * 0.3 * joltForce;
      }

      setTimeout(() => {
        if (group) {
          group.rotation.x = 0;
          group.rotation.z = 0;
        }
        if (headGroup) {
          headGroup.rotation.x = 0;
          headGroup.rotation.y = 0;
          headGroup.rotation.z = 0;
        }
      }, 160);
    },
  };
}

/**
 * Stack of Heavy Duty Industrial Rubber Tires
 */
export function createTireStackProp(
  id: string,
  position: THREE.Vector3
): BreakableProp {
  const group = new THREE.Group();
  group.position.copy(position);

  const rubberMat = new THREE.MeshStandardMaterial({
    color: 0x1c1917,
    roughness: 0.9,
    metalness: 0.05,
  });

  for (let i = 0; i < 3; i++) {
    const tire = new THREE.Mesh(new THREE.TorusGeometry(0.34, 0.12, 10, 20), rubberMat);
    tire.rotation.x = Math.PI / 2;
    tire.position.y = 0.12 + i * 0.24;
    tire.castShadow = true;
    tire.receiveShadow = true;
    group.add(tire);
  }

  const hitGeo = new THREE.CylinderGeometry(0.48, 0.48, 0.75, 10);
  const hitMat = new THREE.MeshBasicMaterial({ visible: false });
  const hitBox = new THREE.Mesh(hitGeo, hitMat);
  hitBox.position.y = 0.38;
  hitBox.userData = { propId: id };
  group.add(hitBox);

  return {
    id,
    category: 'tires',
    name: 'Stack of Heavy Industrial Tires',
    rootMesh: group,
    hitBox,
    maxHp: 85,
    currentHp: 85,
    stages: 2,
    currentStage: 0,
    scoreValue: 480,
    impactSound: 'tires',
  };
}

/**
 * Alloy Laptop / Ultrabook on Desk
 */
export function createLaptopProp(
  id: string,
  position: THREE.Vector3,
  rotationY: number = 0
): BreakableProp {
  const group = new THREE.Group();
  group.position.copy(position);
  group.rotation.y = rotationY;

  const alloyMat = new THREE.MeshStandardMaterial({ color: 0x94a3b8, metalness: 0.85, roughness: 0.3 });

  // Base with keyboard
  const base = new THREE.Mesh(new THREE.BoxGeometry(0.36, 0.015, 0.25), alloyMat);
  base.position.y = 0.008;
  base.castShadow = true;
  group.add(base);

  const kb = new THREE.Mesh(
    new THREE.PlaneGeometry(0.3, 0.14),
    new THREE.MeshStandardMaterial({ color: 0x18181b, roughness: 0.7 })
  );
  kb.rotation.x = -Math.PI / 2;
  kb.position.set(0, 0.016, -0.02);
  group.add(kb);

  // Screen Lid
  const lid = new THREE.Mesh(new THREE.BoxGeometry(0.36, 0.24, 0.01), alloyMat);
  lid.position.set(0, 0.11, -0.12);
  lid.rotation.x = 0.25;
  lid.castShadow = true;
  group.add(lid);

  // Glowing Screen
  const screen = new THREE.Mesh(
    new THREE.PlaneGeometry(0.32, 0.2),
    new THREE.MeshBasicMaterial({ color: 0x06b6d4 })
  );
  screen.position.set(0, 0.11, -0.113);
  screen.rotation.x = 0.25;
  group.add(screen);

  const hitGeo = new THREE.BoxGeometry(0.42, 0.25, 0.35);
  const hitMat = new THREE.MeshBasicMaterial({ visible: false });
  const hitBox = new THREE.Mesh(hitGeo, hitMat);
  hitBox.position.y = 0.12;
  hitBox.userData = { propId: id };
  group.add(hitBox);

  return {
    id,
    category: 'electronics',
    name: 'Alloy Ultrabook Laptop',
    rootMesh: group,
    hitBox,
    maxHp: 45,
    currentHp: 45,
    stages: 1,
    currentStage: 0,
    scoreValue: 510,
    impactSound: 'electronics',
  };
}
