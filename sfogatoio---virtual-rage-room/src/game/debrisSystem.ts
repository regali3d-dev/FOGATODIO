import * as THREE from 'three';
import { BreakableCategory } from '../types/game';
import { DebrisPiece } from './props';

export class DebrisSystem {
  private scene: THREE.Scene;
  private debrisList: DebrisPiece[] = [];
  private maxDebris: number = 220;

  // Shared reusable geometries & materials
  private glassGeo: THREE.BufferGeometry;
  private woodGeo: THREE.BoxGeometry;
  private tvPlasticGeo: THREE.BoxGeometry;
  private ceramicGeo: THREE.DodecahedronGeometry;
  private metalGeo: THREE.BoxGeometry;

  private woodMat: THREE.MeshStandardMaterial;
  private tvMat: THREE.MeshStandardMaterial;
  private pcbMat: THREE.MeshStandardMaterial;
  private ceramicMat: THREE.MeshStandardMaterial;
  private metalMat: THREE.MeshStandardMaterial;

  // Particle systems
  private sparkPoints: THREE.Points;
  private sparkGeo: THREE.BufferGeometry;
  private sparkPositions: Float32Array;
  private sparkVelocities: Float32Array;
  private sparkLifetimes: Float32Array;
  private maxSparks: number = 400;
  private sparkCount: number = 0;

  // White Powder / Smoke Cloud Particle System (for Fire Extinguisher)
  private smokePoints: THREE.Points;
  private smokeGeo: THREE.BufferGeometry;
  private smokePositions: Float32Array;
  private smokeVelocities: Float32Array;
  private smokeLifetimes: Float32Array;
  private maxSmoke: number = 300;
  private smokeCount: number = 0;

  constructor(scene: THREE.Scene) {
    this.scene = scene;

    // Fragment geometries
    this.glassGeo = new THREE.TetrahedronGeometry(0.08, 0);
    this.woodGeo = new THREE.BoxGeometry(0.12, 0.04, 0.22);
    this.tvPlasticGeo = new THREE.BoxGeometry(0.14, 0.08, 0.04);
    this.ceramicGeo = new THREE.DodecahedronGeometry(0.06);
    this.metalGeo = new THREE.BoxGeometry(0.09, 0.09, 0.09);

    // Fragment materials
    this.woodMat = new THREE.MeshStandardMaterial({
      color: 0x6e4324,
      roughness: 0.8,
    });
    this.tvMat = new THREE.MeshStandardMaterial({
      color: 0x1f2937,
      roughness: 0.4,
      metalness: 0.5,
    });
    this.pcbMat = new THREE.MeshStandardMaterial({
      color: 0x15803d,
      roughness: 0.3,
    });
    this.ceramicMat = new THREE.MeshStandardMaterial({
      color: 0xf1f5f9,
      roughness: 0.3,
    });
    this.metalMat = new THREE.MeshStandardMaterial({
      color: 0x71717a,
      roughness: 0.35,
      metalness: 0.8,
    });

    // Sparks Particle System
    this.sparkGeo = new THREE.BufferGeometry();
    this.sparkPositions = new Float32Array(this.maxSparks * 3);
    this.sparkVelocities = new Float32Array(this.maxSparks * 3);
    this.sparkLifetimes = new Float32Array(this.maxSparks);

    this.sparkGeo.setAttribute('position', new THREE.BufferAttribute(this.sparkPositions, 3));

    const sparkMat = new THREE.PointsMaterial({
      color: 0xfbbf24,
      size: 0.08,
      transparent: true,
      opacity: 0.9,
      blending: THREE.AdditiveBlending,
    });

    this.sparkPoints = new THREE.Points(this.sparkGeo, sparkMat);
    this.sparkPoints.frustumCulled = false;
    this.scene.add(this.sparkPoints);

    // Smoke / Extinguisher Foam Cloud Particle System
    this.smokeGeo = new THREE.BufferGeometry();
    this.smokePositions = new Float32Array(this.maxSmoke * 3);
    this.smokeVelocities = new Float32Array(this.maxSmoke * 3);
    this.smokeLifetimes = new Float32Array(this.maxSmoke);

    this.smokeGeo.setAttribute('position', new THREE.BufferAttribute(this.smokePositions, 3));

    const smokeMat = new THREE.PointsMaterial({
      color: 0xf1f5f9,
      size: 0.35,
      transparent: true,
      opacity: 0.65,
    });

    this.smokePoints = new THREE.Points(this.smokeGeo, smokeMat);
    this.smokePoints.frustumCulled = false;
    this.scene.add(this.smokePoints);
  }

  public spawnDebris(
    category: BreakableCategory,
    origin: THREE.Vector3,
    strikeDir: THREE.Vector3,
    force: number
  ): void {
    const count =
      category === 'tv' || category === 'electronics'
        ? 16
        : category === 'window'
        ? 24
        : category === 'furniture' || category === 'appliance'
        ? 14
        : 10;

    for (let i = 0; i < count; i++) {
      let mesh: THREE.Mesh;

      if (category === 'furniture') {
        mesh = new THREE.Mesh(this.woodGeo, this.woodMat);
        const scale = 0.6 + Math.random() * 0.9;
        mesh.scale.set(scale, scale * (0.8 + Math.random()), scale * (1 + Math.random() * 2));
      } else if (category === 'tv' || category === 'electronics') {
        const isPCB = Math.random() > 0.6;
        mesh = new THREE.Mesh(this.tvPlasticGeo, isPCB ? this.pcbMat : this.tvMat);
        const s = 0.7 + Math.random() * 0.8;
        mesh.scale.set(s, s, s);
      } else if (category === 'appliance' || category === 'extinguisher') {
        mesh = new THREE.Mesh(this.metalGeo, this.metalMat);
        const s = 0.6 + Math.random() * 0.7;
        mesh.scale.set(s, s, s);
      } else if (category === 'window') {
        const glassMat = new THREE.MeshPhysicalMaterial({
          color: 0xe2e8f0,
          roughness: 0.1,
          transmission: 0.85,
          transparent: true,
          opacity: 0.75,
        });
        mesh = new THREE.Mesh(this.glassGeo, glassMat);
        const s = 0.5 + Math.random() * 1.1;
        mesh.scale.set(s * 1.5, s * 0.4, s);
      } else if (category === 'bottle') {
        const bottleGlassMat = new THREE.MeshPhysicalMaterial({
          color: Math.random() > 0.5 ? 0x059669 : 0xb45309,
          roughness: 0.15,
          transparent: true,
          opacity: 0.8,
        });
        mesh = new THREE.Mesh(this.glassGeo, bottleGlassMat);
        const s = 0.4 + Math.random() * 0.6;
        mesh.scale.set(s, s, s);
      } else if (category === 'carboy') {
        const carboyMat = new THREE.MeshPhysicalMaterial({
          color: 0x0284c7,
          roughness: 0.1,
          transmission: 0.8,
          transparent: true,
          opacity: 0.85,
        });
        mesh = new THREE.Mesh(this.glassGeo, carboyMat);
        const s = 0.6 + Math.random() * 0.7;
        mesh.scale.set(s, s, s);
      } else if (category === 'plantpot') {
        const potMat = new THREE.MeshStandardMaterial({
          color: Math.random() > 0.4 ? 0xc2410c : 0x78350f,
          roughness: 0.7,
        });
        mesh = new THREE.Mesh(this.ceramicGeo, potMat);
        const s = 0.5 + Math.random() * 0.7;
        mesh.scale.set(s, s, s);
      } else if (category === 'lamp') {
        const lampMat = new THREE.MeshStandardMaterial({
          color: Math.random() > 0.5 ? 0xeab308 : 0x18181b,
          roughness: 0.3,
          metalness: 0.8,
        });
        mesh = new THREE.Mesh(this.metalGeo, lampMat);
        const s = 0.5 + Math.random() * 0.6;
        mesh.scale.set(s, s, s);
      } else if (category === 'mannequin') {
        mesh = new THREE.Mesh(this.woodGeo, this.woodMat);
        const s = 0.7 + Math.random() * 0.8;
        mesh.scale.set(s, s * 1.5, s);
      } else if (category === 'tires') {
        const tireMat = new THREE.MeshStandardMaterial({
          color: 0x18181b,
          roughness: 0.9,
          metalness: 0.05,
        });
        mesh = new THREE.Mesh(this.metalGeo, tireMat);
        const s = 0.7 + Math.random() * 0.9;
        mesh.scale.set(s, s, s);
      } else {
        mesh = new THREE.Mesh(this.ceramicGeo, this.ceramicMat);
        const s = 0.5 + Math.random() * 0.8;
        mesh.scale.set(s, s, s);
      }

      mesh.castShadow = true;
      mesh.receiveShadow = true;

      mesh.position.set(
        origin.x + (Math.random() - 0.5) * 0.25,
        origin.y + (Math.random() - 0.5) * 0.25,
        origin.z + (Math.random() - 0.5) * 0.25
      );

      const scatterDir = new THREE.Vector3(
        strikeDir.x * 0.5 + (Math.random() - 0.5) * 1.5,
        Math.abs(strikeDir.y * 0.3) + 0.8 + Math.random() * 2.5,
        strikeDir.z * 0.5 + (Math.random() - 0.5) * 1.5
      ).normalize();

      const speed = force * 0.3 + 2.5 + Math.random() * 4.5;
      const velocity = scatterDir.multiplyScalar(speed);

      const angularVelocity = new THREE.Vector3(
        (Math.random() - 0.5) * 20,
        (Math.random() - 0.5) * 20,
        (Math.random() - 0.5) * 20
      );

      this.scene.add(mesh);

      const piece: DebrisPiece = {
        mesh,
        velocity,
        angularVelocity,
        age: 0,
        maxAge: 45,
        category,
        settled: false,
      };

      this.debrisList.push(piece);
    }

    if (
      category === 'tv' ||
      category === 'electronics' ||
      category === 'appliance' ||
      category === 'lamp' ||
      category === 'telephone'
    ) {
      this.spawnSparks(origin, category === 'tv' || category === 'lamp' ? 40 : 25);
    }

    if (category === 'extinguisher' || category === 'carboy') {
      this.spawnSmoke(origin, category === 'extinguisher' ? 90 : 50);
    }

    while (this.debrisList.length > this.maxDebris) {
      const oldest = this.debrisList.shift();
      if (oldest) {
        this.scene.remove(oldest.mesh);
      }
    }
  }

  public spawnSparks(origin: THREE.Vector3, amount: number = 30): void {
    for (let i = 0; i < amount; i++) {
      if (this.sparkCount >= this.maxSparks) break;
      const idx = this.sparkCount;

      this.sparkPositions[idx * 3] = origin.x + (Math.random() - 0.5) * 0.1;
      this.sparkPositions[idx * 3 + 1] = origin.y + (Math.random() - 0.5) * 0.1;
      this.sparkPositions[idx * 3 + 2] = origin.z + (Math.random() - 0.5) * 0.1;

      const speed = 3.5 + Math.random() * 6.0;
      const phi = Math.random() * Math.PI * 2;
      const theta = Math.random() * Math.PI;

      this.sparkVelocities[idx * 3] = Math.sin(theta) * Math.cos(phi) * speed;
      this.sparkVelocities[idx * 3 + 1] = Math.abs(Math.cos(theta) * speed) + 1.5;
      this.sparkVelocities[idx * 3 + 2] = Math.sin(theta) * Math.sin(phi) * speed;

      this.sparkLifetimes[idx] = 0.2 + Math.random() * 0.5;
      this.sparkCount++;
    }
  }

  public spawnSmoke(origin: THREE.Vector3, amount: number = 80): void {
    for (let i = 0; i < amount; i++) {
      if (this.smokeCount >= this.maxSmoke) break;
      const idx = this.smokeCount;

      this.smokePositions[idx * 3] = origin.x + (Math.random() - 0.5) * 0.2;
      this.smokePositions[idx * 3 + 1] = origin.y + (Math.random() - 0.5) * 0.2;
      this.smokePositions[idx * 3 + 2] = origin.z + (Math.random() - 0.5) * 0.2;

      const speed = 1.5 + Math.random() * 3.5;
      const phi = Math.random() * Math.PI * 2;
      const theta = Math.random() * Math.PI;

      this.smokeVelocities[idx * 3] = Math.sin(theta) * Math.cos(phi) * speed;
      this.smokeVelocities[idx * 3 + 1] = Math.abs(Math.cos(theta) * speed) + 0.8;
      this.smokeVelocities[idx * 3 + 2] = Math.sin(theta) * Math.sin(phi) * speed;

      this.smokeLifetimes[idx] = 1.0 + Math.random() * 1.5;
      this.smokeCount++;
    }
  }

  public update(delta: number): void {
    const gravity = 14.0;
    const floorY = 0.04;
    const roomLimit = 5.8;

    // Debris
    for (let i = this.debrisList.length - 1; i >= 0; i--) {
      const p = this.debrisList[i];
      p.age += delta;

      if (!p.settled) {
        p.velocity.y -= gravity * delta;

        p.mesh.position.x += p.velocity.x * delta;
        p.mesh.position.y += p.velocity.y * delta;
        p.mesh.position.z += p.velocity.z * delta;

        p.mesh.rotation.x += p.angularVelocity.x * delta;
        p.mesh.rotation.y += p.angularVelocity.y * delta;
        p.mesh.rotation.z += p.angularVelocity.z * delta;

        if (p.mesh.position.y <= floorY) {
          p.mesh.position.y = floorY;
          p.velocity.y = -p.velocity.y * 0.35;
          p.velocity.x *= 0.65;
          p.velocity.z *= 0.65;
          p.angularVelocity.multiplyScalar(0.7);

          if (p.velocity.lengthSq() < 0.2) {
            p.settled = true;
            p.velocity.set(0, 0, 0);
            p.angularVelocity.set(0, 0, 0);
          }
        }

        if (Math.abs(p.mesh.position.x) > roomLimit) {
          p.mesh.position.x = Math.sign(p.mesh.position.x) * roomLimit;
          p.velocity.x = -p.velocity.x * 0.5;
        }
        if (Math.abs(p.mesh.position.z) > roomLimit) {
          p.mesh.position.z = Math.sign(p.mesh.position.z) * roomLimit;
          p.velocity.z = -p.velocity.z * 0.5;
        }
      }
    }

    // Sparks
    for (let i = 0; i < this.sparkCount; i++) {
      this.sparkLifetimes[i] -= delta;

      if (this.sparkLifetimes[i] <= 0) {
        const lastIdx = this.sparkCount - 1;
        this.sparkPositions[i * 3] = this.sparkPositions[lastIdx * 3];
        this.sparkPositions[i * 3 + 1] = this.sparkPositions[lastIdx * 3 + 1];
        this.sparkPositions[i * 3 + 2] = this.sparkPositions[lastIdx * 3 + 2];

        this.sparkVelocities[i * 3] = this.sparkVelocities[lastIdx * 3];
        this.sparkVelocities[i * 3 + 1] = this.sparkVelocities[lastIdx * 3 + 1];
        this.sparkVelocities[i * 3 + 2] = this.sparkVelocities[lastIdx * 3 + 2];

        this.sparkLifetimes[i] = this.sparkLifetimes[lastIdx];

        this.sparkCount--;
        i--;
        continue;
      }

      this.sparkVelocities[i * 3 + 1] -= gravity * delta * 1.5;
      this.sparkPositions[i * 3] += this.sparkVelocities[i * 3] * delta;
      this.sparkPositions[i * 3 + 1] += this.sparkVelocities[i * 3 + 1] * delta;
      this.sparkPositions[i * 3 + 2] += this.sparkVelocities[i * 3 + 2] * delta;

      if (this.sparkPositions[i * 3 + 1] <= floorY) {
        this.sparkPositions[i * 3 + 1] = floorY;
        this.sparkVelocities[i * 3 + 1] = -this.sparkVelocities[i * 3 + 1] * 0.4;
        this.sparkVelocities[i * 3] *= 0.8;
        this.sparkVelocities[i * 3 + 2] *= 0.8;
      }
    }

    this.sparkGeo.setDrawRange(0, this.sparkCount);
    (this.sparkGeo.attributes.position as THREE.BufferAttribute).needsUpdate = true;

    // Smoke
    for (let i = 0; i < this.smokeCount; i++) {
      this.smokeLifetimes[i] -= delta;

      if (this.smokeLifetimes[i] <= 0) {
        const lastIdx = this.smokeCount - 1;
        this.smokePositions[i * 3] = this.smokePositions[lastIdx * 3];
        this.smokePositions[i * 3 + 1] = this.smokePositions[lastIdx * 3 + 1];
        this.smokePositions[i * 3 + 2] = this.smokePositions[lastIdx * 3 + 2];

        this.smokeVelocities[i * 3] = this.smokeVelocities[lastIdx * 3];
        this.smokeVelocities[i * 3 + 1] = this.smokeVelocities[lastIdx * 3 + 1];
        this.smokeVelocities[i * 3 + 2] = this.smokeVelocities[lastIdx * 3 + 2];

        this.smokeLifetimes[i] = this.smokeLifetimes[lastIdx];

        this.smokeCount--;
        i--;
        continue;
      }

      // Smoke rises slowly with air drag
      this.smokeVelocities[i * 3] *= 0.96;
      this.smokeVelocities[i * 3 + 1] += 0.3 * delta; // gentle thermal lift
      this.smokeVelocities[i * 3 + 2] *= 0.96;

      this.smokePositions[i * 3] += this.smokeVelocities[i * 3] * delta;
      this.smokePositions[i * 3 + 1] += this.smokeVelocities[i * 3 + 1] * delta;
      this.smokePositions[i * 3 + 2] += this.smokeVelocities[i * 3 + 2] * delta;
    }

    this.smokeGeo.setDrawRange(0, this.smokeCount);
    (this.smokeGeo.attributes.position as THREE.BufferAttribute).needsUpdate = true;
  }

  public reset(): void {
    for (const p of this.debrisList) {
      this.scene.remove(p.mesh);
    }
    this.debrisList = [];
    this.sparkCount = 0;
    this.smokeCount = 0;
    this.sparkGeo.setDrawRange(0, 0);
    this.smokeGeo.setDrawRange(0, 0);
    (this.sparkGeo.attributes.position as THREE.BufferAttribute).needsUpdate = true;
    (this.smokeGeo.attributes.position as THREE.BufferAttribute).needsUpdate = true;
  }
}
