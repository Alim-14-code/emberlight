// Emberlight — shared tuning numbers. One place for every magic number so the
// game can be balanced without hunting through the simulation or the renderer.
export const VIEW = { width: 1280, height: 720 };

export const PLAYER = {
  radius: 18,
  speed: 265,
  dashSpeed: 640,
  dashTime: 0.16,
  dashCooldown: 1.1,
  invulnerableTime: 1.1,
  carryMax: 3,
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

export const EMBER = { radius: 11, maxOnField: 5, spawnEvery: 2.4, score: 25 };
export const LANTERN_SCORE = 250;
export const COMBO_STEP = 0.25; // +25% score per combo step, capped below
export const COMBO_MAX = 3;

export const WISP = {
  radius: 17,
  drifterSpeed: 95,
  dartSpeed: 150,
  dartLungeSpeed: 330,
  bruteSpeed: 70,
  bruteRadius: 26,
  spawnEvery: 3.2,
};

export const GAME = {
  hearts: 3,
  timeLimit: 180, // seconds of night left; reaching zero loses the game
  step: 1 / 60,
  winBonusPerSecondLeft: 5,
};

export const PALETTE = {
  skyTop: '#0a1a2e',
  skyBottom: '#123240',
  ground: '#0d2b26',
  ember: '#ffb347',
  emberCore: '#ffe9a8',
  lanternLit: '#ffd166',
  lanternDark: '#3a4a5a',
  wisp: '#8b7ff0',
  wispBrute: '#c65df0',
  player: '#f4ead8',
  cloak: '#2e6f6a',
  heart: '#ff5d73',
  text: '#f7f3e8',
  dim: '#9db8c4',
};
