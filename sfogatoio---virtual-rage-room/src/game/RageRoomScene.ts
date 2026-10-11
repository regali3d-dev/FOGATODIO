import * as THREE from 'three';
import { soundEngine } from '../audio/SoundEngine';
import { BreakableCategory, WeaponType } from '../types/game';
import { DebrisSystem } from './debrisSystem';
import {
  createConcreteTexture,
  createFloorTexture,
  createHazardStripesTexture,
  createWarningSignTexture,
} from './proceduralTextures';
import {
  BreakableProp,
  createBarrelProp,
  createBoomboxProp,
  createBottleProp,
  createCarboyProp,
  createCeramicProp,
  createExtinguisherProp,
  createGuitarProp,
  createLampProp,
  createLaptopProp,
  createMannequinProp,
  createCustomFaceMannequinProp,
  createMicrowaveProp,
  createPCTowerProp,
  createPlantPotProp,
  createPrinterProp,
  createSanitaryProp,
  createTelephoneProp,
  createTireStackProp,
  createTVProp,
  createWallClockProp,
  createWindowProp,
  createWoodenFurnitureProp,
} from './props';
import { createWeaponMesh, WEAPONS } from './weapons';

export interface HitResult {
  hit: boolean;
  destroyed: boolean;
  category?: BreakableCategory;
  name?: string;
  damage?: number;
  score?: number;
  worldPos?: THREE.Vector3;
  hitZone?: 'head' | 'torso' | 'limbs';
  isExplosion?: boolean;
}

export class RageRoomScene {
  public canvas: HTMLCanvasElement;
  public scene: THREE.Scene;
  public camera: THREE.PerspectiveCamera;
  public renderer: THREE.WebGLRenderer;
  public debrisSystem: DebrisSystem;

  public gameMode: 'standard' | 'custom_mannequins' = 'standard';
  public customFaceTexture: THREE.Texture | null = null;
  public customFaceName: string = 'Bersaglio Personalizzato';

  private playerPos: THREE.Vector3 = new THREE.Vector3(0, 1.65, 3.2);
  private playerVelocity: THREE.Vector3 = new THREE.Vector3();
  private cameraPitch: number = 0;
  private cameraYaw: number = 0;
  private isPointerLocked: boolean = false;
  private mouseSensitivity: number = 0.0022;

  public touchMoveVector: THREE.Vector2 = new THREE.Vector2(0, 0);

  private bobTimer: number = 0;
  private swayOffset: THREE.Vector2 = new THREE.Vector2();
  private swayVelocity: THREE.Vector2 = new THREE.Vector2();

  private shakeIntensity: number = 0;
  private shakeDecay: number = 5.0;

  private currentWeaponType: WeaponType = 'bat';
  private weaponContainer: THREE.Group;
  private weaponMeshGroup: THREE.Group | null = null;
  private isSwinging: boolean = false;
  private swingProgress: number = 0;
  private swingCooldown: number = 0;
  private hasHitInCurrentSwing: boolean = false;

  private keys: Record<string, boolean> = {};

  private props: BreakableProp[] = [];
  private propHitboxes: THREE.Mesh[] = [];
  private propCounter: number = 0;

  private raycaster: THREE.Raycaster = new THREE.Raycaster();

  // Pre-allocated scratch objects to eliminate per-frame garbage collection and micro-stutters
  private readonly _camEuler: THREE.Euler = new THREE.Euler(0, 0, 0, 'YXZ');
  private readonly _moveDir: THREE.Vector3 = new THREE.Vector3();
  private readonly _forward: THREE.Vector3 = new THREE.Vector3();
  private readonly _right: THREE.Vector3 = new THREE.Vector3();
  private readonly _targetVel: THREE.Vector3 = new THREE.Vector3();
  private readonly _zeroVel: THREE.Vector3 = new THREE.Vector3(0, 0, 0);
  private readonly _restPos: THREE.Vector3 = new THREE.Vector3(0.28, -0.28, -0.55);
  private readonly _restRot: THREE.Euler = new THREE.Euler(-Math.PI / 6, 0.15, -Math.PI / 8);
  private readonly _strikeDir: THREE.Vector3 = new THREE.Vector3();
  private readonly _sampleCoords: THREE.Vector2[] = [
    new THREE.Vector2(0, 0),
    new THREE.Vector2(-0.14, 0),
    new THREE.Vector2(0.14, 0),
    new THREE.Vector2(0, -0.14),
    new THREE.Vector2(0, 0.14),
    new THREE.Vector2(-0.22, 0),
    new THREE.Vector2(0.22, 0),
    new THREE.Vector2(0, -0.22),
    new THREE.Vector2(-0.16, -0.16),
    new THREE.Vector2(0.16, -0.16),
    new THREE.Vector2(-0.16, 0.16),
    new THREE.Vector2(0.16, 0.16),
  ];

  private hangingLight: THREE.PointLight | null = null;
  private redBeaconLight: THREE.PointLight | null = null;
  private clock: THREE.Clock = new THREE.Clock();
  private animFrameId: number | null = null;
  private isDestroyed: boolean = false;

  public onSmashCallback?: (hit: HitResult) => void;
  public onPointerLockChange?: (locked: boolean) => void;
  public onRestockCallback?: () => void;
  public onRoomClearedCallback?: (earnedCredit: boolean) => void;
  public onPropsCountChange?: (remaining: number, total: number) => void;

  constructor(canvas: HTMLCanvasElement) {
    this.canvas = canvas;
    this.scene = new THREE.Scene();
    this.scene.fog = new THREE.FogExp2(0x121316, 0.04);

    this.camera = new THREE.PerspectiveCamera(
      75,
      canvas.clientWidth / canvas.clientHeight,
      0.1,
      100
    );
    this.camera.position.copy(this.playerPos);

    this.renderer = new THREE.WebGLRenderer({
      canvas,
      antialias: true,
      powerPreference: 'high-performance',
    });
    this.renderer.setSize(canvas.clientWidth, canvas.clientHeight);
    this.renderer.setPixelRatio(Math.min(window.devicePixelRatio, 1.75));
    this.renderer.toneMapping = THREE.ACESFilmicToneMapping;
    this.renderer.toneMappingExposure = 1.1;
    this.renderer.shadowMap.enabled = true;
    this.renderer.shadowMap.type = THREE.PCFShadowMap;

    this.weaponContainer = new THREE.Group();
    this.camera.add(this.weaponContainer);

    // Warm natural forward fill light on the player's view
    const playerLight = new THREE.PointLight(0xfff7ed, 12, 10, 1.3);
    playerLight.position.set(0, 0, 0.3);
    this.camera.add(playerLight);

    this.scene.add(this.camera);

    this.debrisSystem = new DebrisSystem(this.scene);

    this.buildRoom();
    this.spawnAllProps();
    this.equipWeapon('bat');

    this.setupEventListeners();
    this.startLoop();
  }

  private buildRoom(): void {
    const roomSize = 13;
    const roomHeight = 4.2;

    const concreteTex = createConcreteTexture();
    concreteTex.repeat.set(3, 1.5);
    const floorTex = createFloorTexture();
    floorTex.repeat.set(4, 4);

    const wallMat = new THREE.MeshStandardMaterial({
      map: concreteTex,
      roughness: 0.85,
      metalness: 0.1,
    });

    const floorMat = new THREE.MeshStandardMaterial({
      map: floorTex,
      roughness: 0.8,
      metalness: 0.2,
    });

    const ceilingMat = new THREE.MeshStandardMaterial({
      color: 0x18181b,
      roughness: 0.9,
    });

    // Floor
    const floorGeo = new THREE.PlaneGeometry(roomSize, roomSize);
    const floor = new THREE.Mesh(floorGeo, floorMat);
    floor.rotation.x = -Math.PI / 2;
    floor.receiveShadow = true;
    this.scene.add(floor);

    // Ceiling
    const ceiling = new THREE.Mesh(floorGeo, ceilingMat);
    ceiling.position.y = roomHeight;
    ceiling.rotation.x = Math.PI / 2;
    this.scene.add(ceiling);

    // 4 Walls
    const wallGeo = new THREE.PlaneGeometry(roomSize, roomHeight);

    const northWall = new THREE.Mesh(wallGeo, wallMat);
    northWall.position.set(0, roomHeight / 2, -roomSize / 2);
    northWall.receiveShadow = true;
    this.scene.add(northWall);

    const southWall = new THREE.Mesh(wallGeo, wallMat);
    southWall.position.set(0, roomHeight / 2, roomSize / 2);
    southWall.rotation.y = Math.PI;
    southWall.receiveShadow = true;
    this.scene.add(southWall);

    const westWall = new THREE.Mesh(wallGeo, wallMat);
    westWall.position.set(-roomSize / 2, roomHeight / 2, 0);
    westWall.rotation.y = Math.PI / 2;
    westWall.receiveShadow = true;
    this.scene.add(westWall);

    const eastWall = new THREE.Mesh(wallGeo, wallMat);
    eastWall.position.set(roomSize / 2, roomHeight / 2, 0);
    eastWall.rotation.y = -Math.PI / 2;
    eastWall.receiveShadow = true;
    this.scene.add(eastWall);

    // Perimeter Hazard Warning Borders
    const hazardTex = createHazardStripesTexture();
    const hazardMat = new THREE.MeshBasicMaterial({ map: hazardTex });
    const borderThickness = 0.25;
    const borderLen = roomSize - 0.4;

    const b1 = new THREE.Mesh(new THREE.PlaneGeometry(borderLen, borderThickness), hazardMat);
    b1.rotation.x = -Math.PI / 2;
    b1.position.set(0, 0.005, -roomSize / 2 + 0.3);
    this.scene.add(b1);

    const b2 = new THREE.Mesh(new THREE.PlaneGeometry(borderLen, borderThickness), hazardMat);
    b2.rotation.x = -Math.PI / 2;
    b2.position.set(0, 0.005, roomSize / 2 - 0.3);
    this.scene.add(b2);

    const b3 = new THREE.Mesh(new THREE.PlaneGeometry(borderThickness, borderLen), hazardMat);
    b3.rotation.x = -Math.PI / 2;
    b3.position.set(-roomSize / 2 + 0.3, 0.005, 0);
    this.scene.add(b3);

    const b4 = new THREE.Mesh(new THREE.PlaneGeometry(borderThickness, borderLen), hazardMat);
    b4.rotation.x = -Math.PI / 2;
    b4.position.set(roomSize / 2 - 0.3, 0.005, 0);
    this.scene.add(b4);

    // Warning Sign
    const signMat = new THREE.MeshBasicMaterial({ map: createWarningSignTexture() });
    const signMesh = new THREE.Mesh(new THREE.PlaneGeometry(1.8, 1.35), signMat);
    signMesh.position.set(0, 2.6, -roomSize / 2 + 0.03);
    this.scene.add(signMesh);

    // Air Duct
    const ductGeo = new THREE.BoxGeometry(0.8, 0.5, roomSize);
    const ductMat = new THREE.MeshStandardMaterial({ color: 0x3f3f46, metalness: 0.8, roughness: 0.4 });
    const duct = new THREE.Mesh(ductGeo, ductMat);
    duct.position.set(2.8, roomHeight - 0.25, 0);
    this.scene.add(duct);

    // Lighting - High-clarity ambient & hemisphere fill for prominent face visibility
    const ambientLight = new THREE.AmbientLight(0x404040, 2.2);
    this.scene.add(ambientLight);

    const hemiLight = new THREE.HemisphereLight(0xffedd5, 0x1e293b, 1.8);
    hemiLight.position.set(0, 4.0, 0);
    this.scene.add(hemiLight);

    this.hangingLight = new THREE.PointLight(0xffedd5, 45, 14, 1.6);
    this.hangingLight.position.set(0, 3.4, 0);
    this.hangingLight.castShadow = true;
    this.hangingLight.shadow.mapSize.width = 1024;
    this.hangingLight.shadow.mapSize.height = 1024;
    this.scene.add(this.hangingLight);

    const wireGeo = new THREE.CylinderGeometry(0.01, 0.01, 0.8);
    const wireMat = new THREE.MeshBasicMaterial({ color: 0x09090b });
    const wire = new THREE.Mesh(wireGeo, wireMat);
    wire.position.set(0, 3.8, 0);
    this.scene.add(wire);

    const shadeGeo = new THREE.ConeGeometry(0.35, 0.25, 12, 1, true);
    const shadeMat = new THREE.MeshStandardMaterial({ color: 0x18181b, roughness: 0.5, metalness: 0.6 });
    const shade = new THREE.Mesh(shadeGeo, shadeMat);
    shade.position.set(0, 3.45, 0);
    this.scene.add(shade);

    const spotLight = new THREE.SpotLight(0xf97316, 25, 10, Math.PI / 4, 0.4, 1.5);
    spotLight.position.set(-2, 3.8, 2);
    spotLight.target.position.set(0, 0.8, 0);
    this.scene.add(spotLight);
    this.scene.add(spotLight.target);

    this.redBeaconLight = new THREE.PointLight(0xef4444, 18, 9, 2.0);
    this.redBeaconLight.position.set(-5.5, 3.2, -5.5);
    this.scene.add(this.redBeaconLight);

    this.buildWorkbenches();
  }

  private buildWorkbenches(): void {
    const metalMat = new THREE.MeshStandardMaterial({
      color: 0x27272a,
      roughness: 0.4,
      metalness: 0.8,
    });

    // 1. Center Island Table
    const centerTable = new THREE.Group();
    centerTable.position.set(0, 0, 0);
    const tableTop = new THREE.Mesh(new THREE.BoxGeometry(2.6, 0.1, 1.5), metalMat);
    tableTop.position.y = 0.85;
    tableTop.castShadow = true;
    tableTop.receiveShadow = true;
    centerTable.add(tableTop);

    const legGeo = new THREE.CylinderGeometry(0.05, 0.05, 0.85, 12);
    [
      [-1.15, -0.6],
      [1.15, -0.6],
      [-1.15, 0.6],
      [1.15, 0.6],
    ].forEach(([lx, lz]) => {
      const leg = new THREE.Mesh(legGeo, metalMat);
      leg.position.set(lx, 0.425, lz);
      leg.castShadow = true;
      centerTable.add(leg);
    });
    this.scene.add(centerTable);

    // 2. West Workbench
    const westTable = new THREE.Group();
    westTable.position.set(-4.8, 0, -0.5);
    const wTop = new THREE.Mesh(new THREE.BoxGeometry(1.2, 0.1, 3.6), metalMat);
    wTop.position.y = 0.85;
    wTop.castShadow = true;
    westTable.add(wTop);

    const wLeg1 = new THREE.Mesh(legGeo, metalMat);
    wLeg1.position.set(0.45, 0.425, -1.6);
    westTable.add(wLeg1);
    const wLeg2 = new THREE.Mesh(legGeo, metalMat);
    wLeg2.position.set(0.45, 0.425, 1.6);
    westTable.add(wLeg2);
    this.scene.add(westTable);

    // 3. East Shelving Unit
    const eastShelf = new THREE.Group();
    eastShelf.position.set(4.8, 0, 0);
    for (let s = 1; s <= 3; s++) {
      const shelfTier = new THREE.Mesh(new THREE.BoxGeometry(1.0, 0.05, 3.4), metalMat);
      shelfTier.position.y = s * 0.7;
      shelfTier.castShadow = true;
      shelfTier.receiveShadow = true;
      eastShelf.add(shelfTier);
    }
    const uprightGeo = new THREE.BoxGeometry(0.06, 2.3, 0.06);
    [
      [-0.45, -1.6],
      [0.45, -1.6],
      [-0.45, 1.6],
      [0.45, 1.6],
    ].forEach(([ux, uz]) => {
      const up = new THREE.Mesh(uprightGeo, metalMat);
      up.position.set(ux, 1.15, uz);
      eastShelf.add(up);
    });
    this.scene.add(eastShelf);
  }

  public spawnAllProps(): void {
    this.props.forEach((p) => this.scene.remove(p.rootMesh));
    this.props = [];
    this.propHitboxes = [];
    this.propCounter = 0;

    if (this.gameMode === 'custom_mannequins') {
      this.spawnCustomMannequinsBatch();
    } else {
      this.spawnBatch();
    }

    if (this.onPropsCountChange) {
      this.onPropsCountChange(this.props.length, this.props.length);
    }
  }

  private customMannequinSlots: { pos: THREE.Vector3; rotY: number }[] = [
    // 1. Immediate Front Targets (close combat)
    { pos: new THREE.Vector3(0, 0, 1.3), rotY: Math.PI },
    { pos: new THREE.Vector3(-1.1, 0, 1.6), rotY: Math.PI - 0.25 },
    { pos: new THREE.Vector3(1.1, 0, 1.6), rotY: Math.PI + 0.25 },
    { pos: new THREE.Vector3(-2.2, 0, 2.0), rotY: Math.PI - 0.45 },
    { pos: new THREE.Vector3(2.2, 0, 2.0), rotY: Math.PI + 0.45 },

    // 2. Lateral Flanks (surrounding angles)
    { pos: new THREE.Vector3(-3.2, 0, 2.6), rotY: Math.PI / 2 + 0.3 },
    { pos: new THREE.Vector3(3.2, 0, 2.6), rotY: -Math.PI / 2 - 0.3 },
    { pos: new THREE.Vector3(-3.6, 0, 1.2), rotY: Math.PI / 2 },
    { pos: new THREE.Vector3(3.6, 0, 1.2), rotY: -Math.PI / 2 },
    { pos: new THREE.Vector3(-2.8, 0, 0.3), rotY: Math.PI / 2 - 0.2 },
    { pos: new THREE.Vector3(2.8, 0, 0.3), rotY: -Math.PI / 2 + 0.2 },
    { pos: new THREE.Vector3(-4.5, 0, -0.1), rotY: Math.PI / 3 },
    { pos: new THREE.Vector3(4.5, 0, -0.1), rotY: -Math.PI / 3 },

    // 3. Center Table & Elevated Pedestals (raised height mannequins)
    { pos: new THREE.Vector3(-0.95, 0.85, 0.0), rotY: Math.PI },
    { pos: new THREE.Vector3(0.95, 0.85, 0.0), rotY: Math.PI },
    { pos: new THREE.Vector3(0, 0.85, -0.45), rotY: Math.PI },
    { pos: new THREE.Vector3(-0.55, 0.85, 0.35), rotY: Math.PI - 0.15 },
    { pos: new THREE.Vector3(0.55, 0.85, 0.35), rotY: Math.PI + 0.15 },

    // 4. Midfield Ring
    { pos: new THREE.Vector3(-1.6, 0, -1.1), rotY: 0.3 },
    { pos: new THREE.Vector3(1.6, 0, -1.1), rotY: -0.3 },
    { pos: new THREE.Vector3(0, 0, -1.5), rotY: 0 },
    { pos: new THREE.Vector3(-3.2, 0, -1.3), rotY: 0.6 },
    { pos: new THREE.Vector3(3.2, 0, -1.3), rotY: -0.6 },

    // 5. Backfield & Deep Corners
    { pos: new THREE.Vector3(-2.2, 0, -2.5), rotY: 0.4 },
    { pos: new THREE.Vector3(2.2, 0, -2.5), rotY: -0.4 },
    { pos: new THREE.Vector3(0, 0, -2.9), rotY: 0 },
    { pos: new THREE.Vector3(-3.6, 0, -3.0), rotY: 0.5 },
    { pos: new THREE.Vector3(3.6, 0, -3.0), rotY: -0.5 },
  ];

  private spawnCustomMannequinsBatch(): void {
    const playerTarget = new THREE.Vector3(0, 0, 3.2);
    this.customMannequinSlots.forEach((slot, idx) => {
      const c = ++this.propCounter;
      const dir = playerTarget.clone().sub(slot.pos);
      const rotY = Math.atan2(dir.x, dir.z);
      const mannequin = createCustomFaceMannequinProp(
        `prop_custom_mann_${idx}_${c}`,
        slot.pos.clone(),
        rotY,
        this.customFaceTexture,
        this.customFaceName
      );
      this.addProp(mannequin);
    });
  }

  public spawnSingleCustomMannequin(): void {
    if (this.isDestroyed || this.gameMode !== 'custom_mannequins') return;
    const c = ++this.propCounter;
    const slot = this.customMannequinSlots[Math.floor(Math.random() * this.customMannequinSlots.length)];
    const dir = new THREE.Vector3(0, 0, 3.2).sub(slot.pos);
    const rotY = Math.atan2(dir.x, dir.z);
    const mannequin = createCustomFaceMannequinProp(
      `prop_custom_mann_respawn_${c}`,
      slot.pos.clone(),
      rotY,
      this.customFaceTexture,
      this.customFaceName
    );
    this.addProp(mannequin);
    if (this.onPropsCountChange) {
      this.onPropsCountChange(this.props.length, Math.max(this.props.length, 28));
    }
  }

  public setCustomFace(texture: THREE.Texture | null, name: string = 'Bersaglio Personalizzato'): void {
    this.customFaceTexture = texture;
    this.customFaceName = name;
    this.gameMode = 'custom_mannequins';

    if (texture) {
      texture.colorSpace = THREE.SRGBColorSpace;
      texture.needsUpdate = true;
    }

    // Immediately update face material on all active mannequins in scene
    this.props.forEach((p) => {
      if (p.rootMesh.userData?.isCustomMannequin && p.rootMesh.userData?.headGroup) {
        const headGroup = p.rootMesh.userData.headGroup as THREE.Group;
        const faceMesh = p.rootMesh.userData.faceMesh as THREE.Mesh;
        if (faceMesh && texture) {
          const mat = faceMesh.material as THREE.MeshStandardMaterial;
          if (mat) {
            mat.map = texture;
            mat.emissiveMap = texture;
            mat.emissive = new THREE.Color(0x222222);
            mat.emissiveIntensity = 0.02;
            mat.roughness = 0.55;
            mat.transparent = true;
            mat.alphaTest = 0.05;
            mat.needsUpdate = true;
          }
        }
      }
    });
  }

  private spawnBatch(): void {
    const c = ++this.propCounter;

    // --- CENTER TABLE TARGETS ---
    this.addProp(createTVProp(`prop_tv_c_${c}`, new THREE.Vector3(0, 1.45, -0.1), 0));
    this.addProp(createPCTowerProp(`prop_pc_c_${c}`, new THREE.Vector3(-0.95, 0.9, 0.1), 0.2));
    this.addProp(createLaptopProp(`prop_laptop_c_${c}`, new THREE.Vector3(0.1, 0.9, 0.35), 0.1));
    this.addProp(createCeramicProp(`prop_mug_c_${c}`, new THREE.Vector3(0.7, 0.9, 0.35), 'mug'));
    this.addProp(createBottleProp(`prop_bot_c1_${c}`, new THREE.Vector3(-0.4, 0.9, 0.35), 'green'));
    this.addProp(createBottleProp(`prop_bot_c2_${c}`, new THREE.Vector3(0.4, 0.9, 0.35), 'amber'));
    this.addProp(createBottleProp(`prop_bot_c3_${c}`, new THREE.Vector3(0.9, 0.9, 0.15), 'blue'));
    this.addProp(createCeramicProp(`prop_cer_c1_${c}`, new THREE.Vector3(-0.6, 0.9, -0.35), 'plate'));
    this.addProp(createCeramicProp(`prop_cer_c2_${c}`, new THREE.Vector3(0.55, 0.9, -0.35), 'vase'));

    // --- WEST WORKBENCH TARGETS ---
    this.addProp(createMicrowaveProp(`prop_micro_w_${c}`, new THREE.Vector3(-4.8, 1.12, -1.4), Math.PI / 2));
    this.addProp(createTelephoneProp(`prop_phone_w_${c}`, new THREE.Vector3(-4.8, 0.9, -0.85), Math.PI / 2));
    this.addProp(createExtinguisherProp(`prop_exting_w_${c}`, new THREE.Vector3(-4.7, 0.9, -0.2), Math.PI / 2));
    this.addProp(createWoodenFurnitureProp(`prop_wood_w1_${c}`, new THREE.Vector3(-4.8, 0.9, 0.5), 'crate'));
    this.addProp(createCeramicProp(`prop_cer_w1_${c}`, new THREE.Vector3(-4.8, 0.9, 1.1), 'mug'));
    this.addProp(createBottleProp(`prop_bot_w1_${c}`, new THREE.Vector3(-4.6, 0.9, 0.9), 'amber'));
    this.addProp(createBottleProp(`prop_bot_w2_${c}`, new THREE.Vector3(-4.9, 0.9, 1.3), 'green'));

    // Office Printer next to west workbench
    this.addProp(createPrinterProp(`prop_printer_w_${c}`, new THREE.Vector3(-4.6, 0, -2.5), Math.PI / 4));

    // --- EAST SHELVING TARGETS ---
    this.addProp(createWoodenFurnitureProp(`prop_wood_e1_${c}`, new THREE.Vector3(4.8, 0.72, -1.0), 'crate'));
    this.addProp(createCeramicProp(`prop_cer_e1_${c}`, new THREE.Vector3(4.8, 0.72, 0.8), 'plate'));
    this.addProp(createBoomboxProp(`prop_boombox_e_${c}`, new THREE.Vector3(4.8, 1.42, 0.0), -Math.PI / 2));
    this.addProp(createBottleProp(`prop_bot_e1_${c}`, new THREE.Vector3(4.8, 1.42, -1.1), 'green'));
    this.addProp(createBottleProp(`prop_bot_e2_${c}`, new THREE.Vector3(4.8, 1.42, -0.7), 'amber'));
    this.addProp(createBottleProp(`prop_bot_e3_${c}`, new THREE.Vector3(4.8, 1.42, 0.8), 'blue'));
    this.addProp(createCeramicProp(`prop_cer_e2_${c}`, new THREE.Vector3(4.8, 1.42, 1.2), 'vase'));
    this.addProp(createBottleProp(`prop_bot_e5_${c}`, new THREE.Vector3(4.8, 2.12, -0.8), 'amber'));
    this.addProp(createBottleProp(`prop_bot_e6_${c}`, new THREE.Vector3(4.8, 2.12, -0.3), 'blue'));
    this.addProp(createBottleProp(`prop_bot_e7_${c}`, new THREE.Vector3(4.8, 2.12, 0.3), 'green'));
    this.addProp(createBottleProp(`prop_bot_e8_${c}`, new THREE.Vector3(4.8, 2.12, 0.8), 'amber'));
    // Mineral Water Cooler next to East Shelf
    this.addProp(createCarboyProp(`prop_cooler_e_${c}`, new THREE.Vector3(4.6, 0, 2.5), -Math.PI / 2));

    // --- WALL TARGETS ---
    this.addProp(createWindowProp(`prop_win_n1_${c}`, new THREE.Vector3(-3.2, 2.1, -6.42), 0, 2.4, 1.6));
    this.addProp(createWindowProp(`prop_win_n2_${c}`, new THREE.Vector3(3.2, 2.1, -6.42), 0, 2.4, 1.6));
    this.addProp(createWallClockProp(`prop_clock_e_${c}`, new THREE.Vector3(6.42, 2.6, 0), -Math.PI / 2));
    this.addProp(createTVProp(`prop_tv_s_${c}`, new THREE.Vector3(0, 2.3, 6.42), Math.PI, true));

    // --- SPECIAL FREESTANDING FLOOR TARGETS ---
    // Porcelain Toilet Bowl / Sanitary
    this.addProp(createSanitaryProp(`prop_sanitary_f_${c}`, new THREE.Vector3(2.5, 0, -2.4), -Math.PI / 4));
    // Electric Guitar
    this.addProp(createGuitarProp(`prop_guitar_f_${c}`, new THREE.Vector3(-2.8, 0, -2.2), Math.PI / 5));
    // Oak Barrel
    this.addProp(createBarrelProp(`prop_barrel_f_${c}`, new THREE.Vector3(2.2, 0, 2.0)));
    // Wooden Chair & Side Table with Potted Plant
    this.addProp(createWoodenFurnitureProp(`prop_wood_f1_${c}`, new THREE.Vector3(-2.2, 0, 2.0), 'chair'));
    this.addProp(createWoodenFurnitureProp(`prop_wood_f3_${c}`, new THREE.Vector3(-1.8, 0, -2.4), 'side_table'));
    this.addProp(createPlantPotProp(`prop_plant_t_${c}`, new THREE.Vector3(-1.8, 0.72, -2.4)));
    this.addProp(createPlantPotProp(`prop_plant_f_${c}`, new THREE.Vector3(3.4, 0, -3.2)));

    // Crash-Test Dummy Mannequin in front of player
    this.addProp(createMannequinProp(`prop_mann_f_${c}`, new THREE.Vector3(0, 0, 1.2), Math.PI));

    // Halogen Floodlamp on Stand
    this.addProp(createLampProp(`prop_lamp_f1_${c}`, new THREE.Vector3(-3.8, 0, 2.6), Math.PI / 4));
    this.addProp(createLampProp(`prop_lamp_f2_${c}`, new THREE.Vector3(3.6, 0, -1.2), -Math.PI / 3));

    // Stack of Industrial Heavy Rubber Tires
    this.addProp(createTireStackProp(`prop_tires_f_${c}`, new THREE.Vector3(3.8, 0, 3.2)));

    // Floor bottles & urn
    this.addProp(createCeramicProp(`prop_cer_f1_${c}`, new THREE.Vector3(-2.8, 0, 0.5), 'vase'));
    this.addProp(createBottleProp(`prop_bot_f1_${c}`, new THREE.Vector3(1.2, 0, 2.5), 'amber'));
    this.addProp(createBottleProp(`prop_bot_f2_${c}`, new THREE.Vector3(-1.2, 0, 2.5), 'green'));
    this.addProp(createExtinguisherProp(`prop_exting_f_${c}`, new THREE.Vector3(3.0, 0, 0.8), 0.4));

    if (this.onPropsCountChange) {
      this.onPropsCountChange(this.props.filter((p) => p.currentHp > 0).length, this.props.length);
    }
  }

  public getRemainingPropsCount(): number {
    return this.props.filter((p) => p.currentHp > 0).length;
  }

  public getTotalPropsCount(): number {
    return this.props.length;
  }

  // Auto-replenishment when targets run out!
  public checkAndRestockIfNeeded(): boolean {
    const activePropsCount = this.props.filter((p) => p.currentHp > 0).length;

    if (this.onPropsCountChange) {
      this.onPropsCountChange(activePropsCount, this.props.length);
    }

    // If 0 objects remain: 100% cleared before time runs out! Player wins a free credit!
    if (activePropsCount === 0) {
      soundEngine.playRoomClearedFanfare();
      if (this.onRoomClearedCallback) {
        this.onRoomClearedCallback(true);
      }
      setTimeout(() => {
        if (!this.isDestroyed) {
          this.props.forEach((p) => this.scene.remove(p.rootMesh));
          this.props = [];
          this.propHitboxes = [];
          this.spawnBatch();
          if (this.onRestockCallback) {
            this.onRestockCallback();
          }
        }
      }, 1200);
      return true;
    }
    return false;
  }

  private addProp(prop: BreakableProp): void {
    this.props.push(prop);
    this.scene.add(prop.rootMesh);
    this.propHitboxes.push(prop.hitBox);
  }

  public equipWeapon(type: WeaponType): void {
    this.currentWeaponType = type;

    if (this.weaponMeshGroup) {
      this.weaponContainer.remove(this.weaponMeshGroup);
    }

    this.weaponMeshGroup = createWeaponMesh(type);
    this.weaponContainer.add(this.weaponMeshGroup);
    soundEngine.playWeaponSwitch();
  }

  public getWeaponType(): WeaponType {
    return this.currentWeaponType;
  }

  public applyTouchLook(deltaX: number, deltaY: number): void {
    const touchSensitivity = 0.004;
    this.cameraYaw -= deltaX * touchSensitivity;
    this.cameraPitch -= deltaY * touchSensitivity;

    const maxPitch = Math.PI / 2 - 0.05;
    this.cameraPitch = Math.max(-maxPitch, Math.min(maxPitch, this.cameraPitch));

    this.swayVelocity.x += deltaX * 0.0004;
    this.swayVelocity.y += deltaY * 0.0004;
  }

  public swingWeapon(): boolean {
    if (this.isSwinging || this.swingCooldown > 0) return false;

    const stats = WEAPONS[this.currentWeaponType];
    this.isSwinging = true;
    this.swingProgress = 0;
    this.hasHitInCurrentSwing = false;
    this.swingCooldown = stats.cooldown;

    soundEngine.playSwing(this.currentWeaponType);
    return true;
  }

  private checkStrikeImpact(): void {
    if (this.hasHitInCurrentSwing || !this.isSwinging) return;
    if (this.swingProgress < 0.22 || this.swingProgress > 0.72) return;

    const stats = WEAPONS[this.currentWeaponType];
    const reach = stats.reach * 1.35;
    this.raycaster.far = reach;

    let bestHit: THREE.Intersection | null = null;
    let closestDist = Infinity;

    for (const sc of this._sampleCoords) {
      this.raycaster.setFromCamera(sc, this.camera);
      const intersects = this.raycaster.intersectObjects(this.propHitboxes, false);
      if (intersects.length > 0 && intersects[0].distance < closestDist) {
        closestDist = intersects[0].distance;
        bestHit = intersects[0];
      }
    }

    if (bestHit) {
      const propId = bestHit.object.userData.propId;
      const prop = this.props.find((p) => p.id === propId);

      if (prop && prop.currentHp > 0) {
        this.hasHitInCurrentSwing = true;
        this.applyPropDamage(prop, stats.damage, stats.impactForce, bestHit.point);
      }
    }
  }

  private applyPropDamage(
    prop: BreakableProp,
    damage: number,
    impactForce: number,
    hitPoint: THREE.Vector3
  ): void {
    const isMannequin = prop.category === 'mannequin' || Boolean(prop.rootMesh.userData?.isCustomMannequin);
    let hitZone: 'head' | 'torso' | 'limbs' | undefined;
    let finalDamage = damage;
    let hitScore = Math.floor(prop.scoreValue * 0.25);

    if (isMannequin) {
      const localY = hitPoint.y - prop.rootMesh.position.y;
      if (localY >= 1.62) {
        // Head / Face hit (Headshot)
        hitZone = 'head';
        finalDamage = Math.floor(damage * 1.5);
        hitScore = 600;
        this.debrisSystem.spawnSparks(hitPoint, 24);
      } else if (localY >= 1.15) {
        // Torso / Chest hit
        hitZone = 'torso';
        finalDamage = damage;
        hitScore = 350;
        this.debrisSystem.spawnSparks(hitPoint, 16);
      } else {
        // Limbs / Legs hit
        hitZone = 'limbs';
        finalDamage = Math.max(10, Math.floor(damage * 0.8));
        hitScore = 150;
        this.debrisSystem.spawnSparks(hitPoint, 10);
      }
    }

    prop.currentHp -= finalDamage;
    const stats = WEAPONS[this.currentWeaponType];

    this.triggerScreenShake(stats.screenShake);

    this.cameraPitch += (Math.random() - 0.3) * 0.04;
    this.cameraYaw += (Math.random() - 0.5) * 0.03;

    soundEngine.playImpact(prop.impactSound, Math.min(1.5, finalDamage / 50));

    if (prop.currentHp <= 0) {
      const strikeDir = new THREE.Vector3();
      this.camera.getWorldDirection(strikeDir);

      if (isMannequin) {
        // BOOM! Explosion sound and blast physics
        soundEngine.playExplosion(1.5);
        this.triggerScreenShake(stats.screenShake * 2.8);
        this.debrisSystem.spawnDebris(prop.category, hitPoint, strikeDir, impactForce * 2.0);
        this.debrisSystem.spawnSparks(hitPoint, 36);
      } else {
        this.debrisSystem.spawnDebris(prop.category, hitPoint, strikeDir, impactForce);
      }

      this.scene.remove(prop.rootMesh);
      const hitBoxIdx = this.propHitboxes.indexOf(prop.hitBox);
      if (hitBoxIdx !== -1) this.propHitboxes.splice(hitBoxIdx, 1);

      if (this.onSmashCallback) {
        this.onSmashCallback({
          hit: true,
          destroyed: true,
          category: prop.category,
          name: prop.name,
          damage: finalDamage,
          score: isMannequin ? 1500 : prop.scoreValue,
          worldPos: hitPoint,
          hitZone,
          isExplosion: isMannequin,
        });
      }

      // Check if room needs replenishment
      if (this.gameMode === 'custom_mannequins') {
        setTimeout(() => {
          if (!this.isDestroyed && this.gameMode === 'custom_mannequins') {
            this.spawnSingleCustomMannequin();
          }
        }, 1200);
      } else {
        this.checkAndRestockIfNeeded();
      }
    } else {
      if (prop.onDamage) {
        prop.onDamage(prop, finalDamage);
      }
      this.debrisSystem.spawnSparks(hitPoint, 12);

      if (this.onSmashCallback) {
        this.onSmashCallback({
          hit: true,
          destroyed: false,
          category: prop.category,
          name: prop.name,
          damage: finalDamage,
          score: hitScore,
          worldPos: hitPoint,
          hitZone,
        });
      }
    }
  }

  public triggerScreenShake(amount: number): void {
    this.shakeIntensity = Math.min(1.0, this.shakeIntensity + amount);
  }

  public lockPointer(): void {
    if (!this.isPointerLocked) {
      this.canvas.requestPointerLock();
    }
  }

  public unlockPointer(): void {
    if (document.pointerLockElement === this.canvas) {
      document.exitPointerLock();
    }
  }

  private setupEventListeners(): void {
    const onLockChange = () => {
      this.isPointerLocked = document.pointerLockElement === this.canvas;
      if (this.onPointerLockChange) {
        this.onPointerLockChange(this.isPointerLocked);
      }
    };
    document.addEventListener('pointerlockchange', onLockChange);

    const onMouseMove = (e: MouseEvent) => {
      if (!this.isPointerLocked) return;

      const movementX = e.movementX || 0;
      const movementY = e.movementY || 0;

      this.cameraYaw -= movementX * this.mouseSensitivity;
      this.cameraPitch -= movementY * this.mouseSensitivity;

      const maxPitch = Math.PI / 2 - 0.05;
      this.cameraPitch = Math.max(-maxPitch, Math.min(maxPitch, this.cameraPitch));

      this.swayVelocity.x += movementX * 0.0003;
      this.swayVelocity.y += movementY * 0.0003;
    };
    window.addEventListener('mousemove', onMouseMove);

    const onMouseDown = (e: MouseEvent) => {
      if (e.button === 0) {
        if (!this.isPointerLocked) {
          this.lockPointer();
        } else {
          this.swingWeapon();
        }
      }
    };
    this.canvas.addEventListener('mousedown', onMouseDown);

    const onKeyDown = (e: KeyboardEvent) => {
      this.keys[e.code] = true;

      if (e.code === 'Space') {
        if (!this.isPointerLocked) {
          this.lockPointer();
        } else {
          this.swingWeapon();
        }
      }
    };

    const onKeyUp = (e: KeyboardEvent) => {
      this.keys[e.code] = false;
    };

    window.addEventListener('keydown', onKeyDown);
    window.addEventListener('keyup', onKeyUp);

    const onResize = () => {
      if (!this.canvas || this.isDestroyed) return;
      this.camera.aspect = this.canvas.clientWidth / this.canvas.clientHeight;
      this.camera.updateProjectionMatrix();
      this.renderer.setSize(this.canvas.clientWidth, this.canvas.clientHeight);
    };
    window.addEventListener('resize', onResize);
  }

  private startLoop(): void {
    const render = () => {
      if (this.isDestroyed) return;

      const delta = Math.min(this.clock.getDelta(), 0.1);
      this.update(delta);
      this.renderer.render(this.scene, this.camera);

      this.animFrameId = requestAnimationFrame(render);
    };

    this.animFrameId = requestAnimationFrame(render);
  }

  private update(delta: number): void {
    const time = this.clock.getElapsedTime();

    if (this.redBeaconLight) {
      this.redBeaconLight.intensity = 12 + Math.sin(time * 4) * 8;
    }
    if (this.hangingLight) {
      this.hangingLight.intensity = 42 + (Math.random() - 0.5) * 3;
    }

    this.updatePlayerMovement(delta);
    this.updateWeaponAnimation(delta);
    this.updateCameraTransform(delta);
    this.debrisSystem.update(delta);

    if (this.isSwinging) {
      this.checkStrikeImpact();
    }
  }

  private updatePlayerMovement(delta: number): void {
    const moveSpeed = 4.2;
    const accel = 26.0;
    const friction = 15.0;

    this._moveDir.set(0, 0, 0);

    if (this.keys['KeyW'] || this.keys['ArrowUp']) this._moveDir.z -= 1;
    if (this.keys['KeyS'] || this.keys['ArrowDown']) this._moveDir.z += 1;
    if (this.keys['KeyA'] || this.keys['ArrowLeft']) this._moveDir.x -= 1;
    if (this.keys['KeyD'] || this.keys['ArrowRight']) this._moveDir.x += 1;

    if (this.touchMoveVector.lengthSq() > 0.01) {
      this._moveDir.x += this.touchMoveVector.x;
      this._moveDir.z -= this.touchMoveVector.y;
    }

    if (this._moveDir.lengthSq() > 0) {
      if (this._moveDir.lengthSq() > 1) this._moveDir.normalize();

      this._forward.set(-Math.sin(this.cameraYaw), 0, -Math.cos(this.cameraYaw));
      this._right.set(Math.cos(this.cameraYaw), 0, -Math.sin(this.cameraYaw));

      this._targetVel.set(0, 0, 0)
        .addScaledVector(this._forward, -this._moveDir.z * moveSpeed)
        .addScaledVector(this._right, this._moveDir.x * moveSpeed);

      this.playerVelocity.lerp(this._targetVel, Math.min(1.0, accel * delta));

      this.bobTimer += delta * 11.0;
      if (Math.sin(this.bobTimer) < -0.95) {
        soundEngine.playFootstep();
      }
    } else {
      this.playerVelocity.lerp(this._zeroVel, Math.min(1.0, friction * delta));
    }

    this.playerPos.addScaledVector(this.playerVelocity, delta);

    const bound = 5.2;
    this.playerPos.x = Math.max(-bound, Math.min(bound, this.playerPos.x));
    this.playerPos.z = Math.max(-bound, Math.min(bound, this.playerPos.z));

    if (
      this.playerPos.x > -1.55 &&
      this.playerPos.x < 1.55 &&
      this.playerPos.z > -1.05 &&
      this.playerPos.z < 1.05
    ) {
      const dx = Math.abs(this.playerPos.x) - 1.55;
      const dz = Math.abs(this.playerPos.z) - 1.05;
      if (dx > dz) {
        this.playerPos.x = Math.sign(this.playerPos.x) * 1.6;
      } else {
        this.playerPos.z = Math.sign(this.playerPos.z) * 1.1;
      }
    }
  }

  private updateCameraTransform(delta: number): void {
    this._camEuler.x = this.cameraPitch;
    this._camEuler.y = this.cameraYaw;

    if (this.shakeIntensity > 0) {
      const shakeAmt = this.shakeIntensity * 0.08;
      this._camEuler.x += (Math.random() - 0.5) * shakeAmt;
      this._camEuler.y += (Math.random() - 0.5) * shakeAmt;
      this._camEuler.z = (Math.random() - 0.5) * shakeAmt * 0.5;

      this.shakeIntensity = Math.max(0, this.shakeIntensity - this.shakeDecay * delta);
    } else {
      this._camEuler.z = 0;
    }

    this.camera.quaternion.setFromEuler(this._camEuler);

    const speed = this.playerVelocity.length();
    const bobY = speed > 0.1 ? Math.sin(this.bobTimer) * 0.045 : 0;
    const bobX = speed > 0.1 ? Math.cos(this.bobTimer * 0.5) * 0.025 : 0;

    this.camera.position.set(
      this.playerPos.x + bobX,
      this.playerPos.y + bobY,
      this.playerPos.z
    );
  }

  private updateWeaponAnimation(delta: number): void {
    if (!this.weaponMeshGroup) return;

    const stats = WEAPONS[this.currentWeaponType];

    if (this.swingCooldown > 0) {
      this.swingCooldown -= delta;
    }

    this.swayOffset.x += this.swayVelocity.x;
    this.swayOffset.y += this.swayVelocity.y;
    this.swayVelocity.multiplyScalar(0.85);
    this.swayOffset.lerp(new THREE.Vector2(0, 0), delta * 8);

    const restPos = this._restPos;
    const restRot = this._restRot;

    if (this.isSwinging) {
      this.swingProgress += delta / stats.swingDuration;

      if (this.swingProgress >= 1.0) {
        this.isSwinging = false;
        this.swingProgress = 0;
      }
    }

    if (this.isSwinging) {
      const p = this.swingProgress;

      if (p < 0.25) {
        const t = p / 0.25;
        this.weaponContainer.position.set(
          restPos.x + 0.12 * t,
          restPos.y + 0.18 * t,
          restPos.z + 0.15 * t
        );
        this.weaponContainer.rotation.set(
          restRot.x + 0.4 * t,
          restRot.y - 0.5 * t,
          restRot.z + 0.5 * t
        );
      } else if (p < 0.6) {
        const t = (p - 0.25) / 0.35;
        const ease = t * t * (3 - 2 * t);

        this.weaponContainer.position.set(
          restPos.x + 0.12 - 0.4 * ease,
          restPos.y + 0.18 - 0.3 * ease,
          restPos.z + 0.15 - 0.25 * ease
        );
        this.weaponContainer.rotation.set(
          restRot.x + 0.4 - 1.2 * ease,
          restRot.y - 0.5 + 1.2 * ease,
          restRot.z + 0.5 - 1.4 * ease
        );
      } else {
        const t = (p - 0.6) / 0.4;
        const ease = 1 - Math.pow(1 - t, 3);

        this.weaponContainer.position.set(
          restPos.x - 0.28 + 0.28 * ease,
          restPos.y - 0.12 + 0.12 * ease,
          restPos.z - 0.1 + 0.1 * ease
        );
        this.weaponContainer.rotation.set(
          restRot.x - 0.8 + 0.8 * ease,
          restRot.y + 0.7 - 0.7 * ease,
          restRot.z - 0.9 + 0.9 * ease
        );
      }
    } else {
      const idleBob = Math.sin(this.clock.getElapsedTime() * 2) * 0.008;
      this.weaponContainer.position.set(
        restPos.x - this.swayOffset.x * 0.4,
        restPos.y + idleBob - this.swayOffset.y * 0.4,
        restPos.z
      );
      this.weaponContainer.rotation.set(
        restRot.x - this.swayOffset.y * 0.8,
        restRot.y - this.swayOffset.x * 0.8,
        restRot.z
      );
    }
  }

  public resetRoom(): void {
    this.debrisSystem.reset();
    this.spawnAllProps();
    this.playerPos.set(0, 1.65, 3.2);
    this.playerVelocity.set(0, 0, 0);
    this.cameraPitch = 0;
    this.cameraYaw = 0;
    this.touchMoveVector.set(0, 0);
  }

  public destroy(): void {
    this.isDestroyed = true;
    if (this.animFrameId !== null) {
      cancelAnimationFrame(this.animFrameId);
    }
    this.renderer.dispose();
  }
}
