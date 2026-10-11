export type GameState = 'title' | 'payment' | 'face_upload' | 'playing' | 'gameover';

export type WeaponType = 'bat' | 'hammer' | 'pipe';

export type SessionTier = 'blitz' | 'carnage' | 'custom_mannequins';

export interface WeaponStats {
  id: WeaponType;
  name: string;
  subtitle: string;
  description: string;
  damage: number;       // Base damage per hit
  impactForce: number;  // Physics impulse on debris
  reach: number;        // Range in meters
  swingDuration: number;// Swing duration in seconds
  cooldown: number;     // Seconds between swings
  screenShake: number;  // Screen shake intensity
  weightLabel: string;
  reachLabel: string;
  speedLabel: string;
  color: string;
}

export type BreakableCategory =
  | 'tv'
  | 'bottle'
  | 'furniture'
  | 'ceramic'
  | 'window'
  | 'electronics'
  | 'appliance'
  | 'extinguisher'
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

export interface DestructionStats {
  totalSmashed: number;
  totalDamage: number;
  highestCombo: number;
  byCategory: Record<BreakableCategory, number>;
  weaponUsed: WeaponType;
  elapsedSeconds: number;
  tier: SessionTier;
  mannequinStats?: {
    headshots: number;
    torsoHits: number;
    limbHits: number;
    explodedCount: number;
  };
}

export interface FloatingText {
  id: string;
  text: string;
  x: number;
  y: number;
  color: string;
  scale: number;
  opacity: number;
  createdAt: number;
}

export type PaymentMethod = 'apple_pay' | 'google_pay' | 'paypal' | 'card' | 'stripe';

export interface LeaderboardEntry {
  id: string;
  name: string;
  score: number;
  smashed: number;
  date: string;
  tier: SessionTier;
}
