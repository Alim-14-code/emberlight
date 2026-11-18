// Emberlight — shared tuning numbers. One place for every magic number so the
// game can be balanced without hunting through the simulation or the renderer.
export const VIEW = { width: 1280, height: 720 };

export const PLAYER = {
  radius: 18,
  speed: 285,
  dashSpeed: 640,
  dashTime: 0.16,
  dashCooldown: 0.9,
  invulnerableTime: 1.6,
  carryMax: 3,
  lightRadius: 150, // the keeper's own lantern light in the dark
};

export const LANTERNS = [
  { x: 150, y: 150 },
  { x: 640, y: 110 },
  { x: 1130, y: 150 },
  { x: 150, y: 570 },
  { x: 640, y: 610 },
  { x: 1130, y: 570 },
];
export const LANTERN_COUNT = LANTERNS.length;
export const EMBERS_PER_LANTERN = 3;
export const LANTERN_LIGHT_RADIUS = 190; // pool of light a lit lantern casts

export const EMBER = { radius: 11, maxOnField: 7, spawnEvery: 1.8, score: 25, lightRadius: 70 };
export const LANTERN_SCORE = 250;
export const COMBO_STEP = 0.25; // +25% score per combo step, capped below
export const COMBO_MAX = 3;
export const COMBO_WINDOW = 6; // seconds between pickups before the combo dies
// Sheltered combo: the dark eats your flame, so the combo timer only ticks
// down while the keeper stands in darkness. Inside a lit lantern's pool of
// light the flame is sheltered and the combo holds.
export const STREAK_BONUS = 50; // +points per lantern lit without taking a hit

// A golden ember is rare, bright and worth far more than a normal one.
export const GOLDEN_EMBER = {
  radius: 14, score: 150, comboBonus: 2, lightRadius: 110,
  spawnEvery: 26, chance: 0.45,
};

export const WISP = {
  radius: 17,
  drifterSpeed: 88,
  dartSpeed: 140,
  dartLungeSpeed: 300,
  bruteSpeed: 64,
  bruteRadius: 26,
  wraithSpeed: 168, // weaves in a sine wave; appears once 3 lanterns burn
  wraithRadius: 15,
  spawnEvery: 4.2,
};

// Power-ups: one at a time on the field, a new one every few seconds.
export const POWERUP = {
  spawnEvery: 13,
  maxOnField: 1,
  magnetRadius: 280, magnetTime: 9,
  swiftMult: 1.45, swiftTime: 8,
  aegisTime: 20, // shield blocks one hit, then fades
  types: ['magnet', 'swift', 'aegis'],
};

export const GAME = {
  hearts: 4,
  timeLimit: 195, // seconds of night left; reaching zero loses the game
  step: 1 / 60,
  winBonusPerSecondLeft: 5,
};

// How dark the grove is away from any light (0 = noon, 1 = pitch black).
export const DARKNESS = 0.58;

export const PALETTE = {
  skyTop: '#060f1e',
  skyBottom: '#0d2733',
  ground: '#0a231f',
  ember: '#ffb347',
  emberCore: '#ffe9a8',
  golden: '#ffd94d',
  goldenCore: '#fff6c8',
  lanternLit: '#ffd166',
  lanternDark: '#3a4a5a',
  wisp: '#8b7ff0',
  wispBrute: '#c65df0',
  wispWraith: '#5fe3c8',
  player: '#f4ead8',
  cloak: '#2e6f6a',
  heart: '#ff5d73',
  text: '#f7f3e8',
  dim: '#9db8c4',
  mushroom: '#7fe0a8',
  mushroomCap: '#ff8fa3',
  powerMagnet: '#7fd4ff',
  powerSwift: '#a8ff7f',
  powerAegis: '#c9a8ff',
};
