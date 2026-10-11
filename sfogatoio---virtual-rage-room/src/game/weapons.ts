import * as THREE from 'three';
import { WeaponStats, WeaponType } from '../types/game';

export const WEAPONS: Record<WeaponType, WeaponStats> = {
  bat: {
    id: 'bat',
    name: 'Louisville Slugger',
    subtitle: 'Classic Wooden Baseball Bat',
    description: 'Balanced swing weight with wide sweeping arc. Perfect for shattering bottles and launching ceramics.',
    damage: 45,
    impactForce: 12,
    reach: 2.2,
    swingDuration: 0.28,
    cooldown: 0.35,
    screenShake: 0.25,
    weightLabel: 'Balanced',
    reachLabel: 'Long Arc',
    speedLabel: 'Fast',
    color: '#f59e0b',
  },
  hammer: {
    id: 'hammer',
    name: 'Demolition Sledgehammer',
    subtitle: '10kg Forged Steel Sledge',
    description: 'Crushing kinetic destruction. Heavy wind-up, obliterates furniture and pulverizes TVs with thunderous force.',
    damage: 120,
    impactForce: 28,
    reach: 2.0,
    swingDuration: 0.42,
    cooldown: 0.65,
    screenShake: 0.6,
    weightLabel: 'Heavy',
    reachLabel: 'Medium',
    speedLabel: 'Devastating',
    color: '#ef4444',
  },
  pipe: {
    id: 'pipe',
    name: 'Galvanized Steel Pipe',
    subtitle: 'Threaded Industrial Conduit',
    description: 'Dense metal pipe with jagged threaded end. Snappy recovery and pinpoint fracturing accuracy.',
    damage: 60,
    impactForce: 16,
    reach: 1.9,
    swingDuration: 0.22,
    cooldown: 0.3,
    screenShake: 0.35,
    weightLabel: 'Medium',
    reachLabel: 'Close-Mid',
    speedLabel: 'Rapid',
    color: '#06b6d4',
  },
};

/**
 * Builds 3D First-Person Viewmodel for the selected weapon
 */
export function createWeaponMesh(type: WeaponType): THREE.Group {
  const group = new THREE.Group();

  if (type === 'bat') {
    // Baseball Bat (tapered cylinder)
    const woodMat = new THREE.MeshStandardMaterial({
      color: 0xc89658,
      roughness: 0.4,
      metalness: 0.05,
    });
    const gripMat = new THREE.MeshStandardMaterial({
      color: 0x222222,
      roughness: 0.8,
      metalness: 0.1,
    });

    // Handle
    const handleGeo = new THREE.CylinderGeometry(0.02, 0.022, 0.28, 16);
    const handle = new THREE.Mesh(handleGeo, gripMat);
    handle.position.y = 0.14;
    group.add(handle);

    // Knob at bottom
    const knobGeo = new THREE.CylinderGeometry(0.035, 0.035, 0.03, 16);
    const knob = new THREE.Mesh(knobGeo, woodMat);
    knob.position.y = 0.015;
    group.add(knob);

    // Barrel (tapers outward)
    const barrelGeo = new THREE.CylinderGeometry(0.045, 0.022, 0.6, 16);
    const barrel = new THREE.Mesh(barrelGeo, woodMat);
    barrel.position.y = 0.58;
    group.add(barrel);

    // Top cap
    const capGeo = new THREE.SphereGeometry(0.045, 16, 8, 0, Math.PI * 2, 0, Math.PI / 2);
    const cap = new THREE.Mesh(capGeo, woodMat);
    cap.position.y = 0.88;
    group.add(cap);

  } else if (type === 'hammer') {
    // Sledgehammer
    const steelMat = new THREE.MeshStandardMaterial({
      color: 0x3a3f45,
      roughness: 0.35,
      metalness: 0.85,
    });
    const shaftMat = new THREE.MeshStandardMaterial({
      color: 0xdc2626, // Industrial safety red shaft
      roughness: 0.6,
      metalness: 0.1,
    });
    const gripMat = new THREE.MeshStandardMaterial({
      color: 0x111111,
      roughness: 0.9,
    });

    // Shaft
    const shaftGeo = new THREE.CylinderGeometry(0.02, 0.02, 0.85, 16);
    const shaft = new THREE.Mesh(shaftGeo, shaftMat);
    shaft.position.y = 0.425;
    group.add(shaft);

    // Rubber grip
    const gripGeo = new THREE.CylinderGeometry(0.025, 0.025, 0.35, 16);
    const grip = new THREE.Mesh(gripGeo, gripMat);
    grip.position.y = 0.2;
    group.add(grip);

    // Heavy sledge head (octagonal prism)
    const headGeo = new THREE.BoxGeometry(0.12, 0.14, 0.24);
    const head = new THREE.Mesh(headGeo, steelMat);
    head.position.y = 0.84;
    group.add(head);

    // Steel face plates on both striking ends
    const faceGeo = new THREE.CylinderGeometry(0.065, 0.065, 0.02, 16);
    const face1 = new THREE.Mesh(faceGeo, steelMat);
    face1.rotation.x = Math.PI / 2;
    face1.position.set(0, 0.84, 0.13);
    group.add(face1);

    const face2 = new THREE.Mesh(faceGeo, steelMat);
    face2.rotation.x = Math.PI / 2;
    face2.position.set(0, 0.84, -0.13);
    group.add(face2);

  } else {
    // Steel Pipe
    const pipeMat = new THREE.MeshStandardMaterial({
      color: 0x71717a,
      roughness: 0.3,
      metalness: 0.9,
    });
    const rustMat = new THREE.MeshStandardMaterial({
      color: 0x854d0e,
      roughness: 0.7,
      metalness: 0.4,
    });

    // Main pipe body
    const bodyGeo = new THREE.CylinderGeometry(0.022, 0.022, 0.8, 16);
    const body = new THREE.Mesh(bodyGeo, pipeMat);
    body.position.y = 0.4;
    group.add(body);

    // Threaded sleeve / collar
    const collarGeo = new THREE.CylinderGeometry(0.028, 0.028, 0.08, 16);
    const collar = new THREE.Mesh(collarGeo, rustMat);
    collar.position.y = 0.75;
    group.add(collar);

    // Heavy pipe elbow / tee at the tip for striking weight
    const tipGeo = new THREE.CylinderGeometry(0.035, 0.03, 0.12, 12);
    const tip = new THREE.Mesh(tipGeo, pipeMat);
    tip.position.y = 0.84;
    group.add(tip);

    // Grip wrapping
    const tapeGeo = new THREE.CylinderGeometry(0.026, 0.026, 0.28, 16);
    const tapeMat = new THREE.MeshStandardMaterial({ color: 0x1f2937, roughness: 0.85 });
    const tape = new THREE.Mesh(tapeGeo, tapeMat);
    tape.position.y = 0.16;
    group.add(tape);
  }

  // Position and orient weapon relative to first-person camera:
  // Held in lower-right hand corner, pointing upward & slightly forward
  group.position.set(0.28, -0.28, -0.55);
  group.rotation.set(-Math.PI / 6, 0.15, -Math.PI / 8);

  return group;
}
