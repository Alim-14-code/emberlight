// Emberlight — the simulation. A keeper collects glowing embers and carries
// them to the six dark lanterns of the grove before the night runs out.
// Shadow wisps hunt the keeper: one touch costs a heart and scatters the
// embers being carried. Light all six lanterns to win; lose all hearts or
// let the timer reach zero to lose.
import {
  VIEW, PLAYER, LANTERNS, LANTERN_COUNT, EMBERS_PER_LANTERN, EMBER,
  LANTERN_SCORE, COMBO_STEP, COMBO_MAX, WISP, GAME,
} from './config.js';
import { makeRandom } from './random.js';

export const EVENT_NONE = 0;
export const EVENT_PICKUP = 1;
export const EVENT_DEPOSIT = 2;
export const EVENT_HIT = 4;
export const EVENT_WIN = 8;
export const EVENT_LOSE = 16;
export const EVENT_DASH = 32;
export const EVENT_WISP = 64;

export const WISP_DRIFTER = 'drifter';
export const WISP_DART = 'dart';
export const WISP_BRUTE = 'brute';

export function createWorld(seed = 20261117) {
  const rng = makeRandom(seed);
  let state = null;

  function spawnEmber() {
    return {
      x: rng.range(70, VIEW.width - 70),
      y: rng.range(90, VIEW.height - 70),
      phase: rng.range(0, Math.PI * 2),
      bob: rng.range(0.8, 1.4),
    };
  }

  function spawnWisp(kind) {
    const edge = Math.floor(rng.range(0, 4));
    let x = 0;
    let y = 0;
    if (edge === 0) { x = rng.range(0, VIEW.width); y = -30; }
    if (edge === 1) { x = VIEW.width + 30; y = rng.range(0, VIEW.height); }
    if (edge === 2) { x = rng.range(0, VIEW.width); y = VIEW.height + 30; }
    if (edge === 3) { x = -30; y = rng.range(0, VIEW.height); }
    return {
      kind, x, y, vx: 0, vy: 0,
      radius: kind === WISP_BRUTE ? WISP.bruteRadius : WISP.radius,
      lungeTimer: rng.range(1.2, 2.4),
      lunging: 0,
      phase: rng.range(0, Math.PI * 2),
    };
  }

  function wispTargetCount() {
    return Math.min(2 + state.litCount, 8);
  }

  function reset() {
    state = {
      time: 0,
      timeLeft: GAME.timeLimit,
      score: 0,
      best: 0,
      hearts: GAME.hearts,
      litCount: 0,
      carried: 0,
      combo: 0,
      comboTimer: 0,
      shake: 0,
      emberTimer: 0,
      wispTimer: 2,
      over: false,
      won: false,
      loseReason: '',
      lastTickSecond: -1,
      player: {
        x: VIEW.width / 2, y: VIEW.height / 2, vx: 0, vy: 0,
        dashTime: 0, dashCooldown: 0, invulnerable: 0, facing: 1,
      },
      lanterns: LANTERNS.map((p) => ({ x: p.x, y: p.y, lit: false, progress: 0, glow: 0 })),
      embers: [spawnEmber(), spawnEmber(), spawnEmber()],
      wisps: [spawnWisp(WISP_DRIFTER), spawnWisp(WISP_DRIFTER)],
      stars: [],
    };
    for (let i = 0; i < 90; i += 1) {
      state.stars.push({
        x: rng.range(0, VIEW.width), y: rng.range(0, VIEW.height * 0.62),
        r: rng.range(0.6, 2.1), tw: rng.range(0, Math.PI * 2),
      });
    }
  }

  function difficulty() {
    return 1 + state.litCount * 0.09;
  }

  function depositAt(lantern) {
    const gained = state.carried;
    lantern.progress += gained;
    state.carried = 0;
    if (lantern.progress >= EMBERS_PER_LANTERN && !lantern.lit) {
      lantern.lit = true;
      lantern.progress = EMBERS_PER_LANTERN;
      state.litCount += 1;
      const mult = 1 + Math.min(state.combo, 8) * COMBO_STEP;
      const points = Math.round(LANTERN_SCORE * Math.min(mult, COMBO_MAX));
      state.score += points;
      if (state.litCount >= LANTERN_COUNT) {
        state.won = true;
        state.over = true;
        state.score += Math.round(state.timeLeft) * GAME.winBonusPerSecondLeft;
        return EVENT_DEPOSIT | EVENT_WIN;
      }
      return EVENT_DEPOSIT;
    }
    return EVENT_DEPOSIT;
  }

  function takeHit(wisp) {
    state.hearts -= 1;
    state.combo = 0;
    state.comboTimer = 0;
    state.shake = 0.45;
    const p = state.player;
    p.invulnerable = PLAYER.invulnerableTime;
    // Knock the keeper away from the wisp and scatter carried embers.
    const dx = p.x - wisp.x;
    const dy = p.y - wisp.y;
    const d = Math.hypot(dx, dy) || 1;
    p.x += (dx / d) * 46;
    p.y += (dy / d) * 46;
    const scattered = state.carried;
    state.carried = 0;
    for (let i = 0; i < scattered; i += 1) {
      state.embers.push({
        x: Math.max(50, Math.min(VIEW.width - 50, p.x + (dx / d) * 60 + rng.range(-30, 30))),
        y: Math.max(60, Math.min(VIEW.height - 50, p.y + (dy / d) * 60 + rng.range(-30, 30))),
        phase: rng.range(0, Math.PI * 2), bob: 1,
      });
    }
    if (state.hearts <= 0) {
      state.over = true;
      state.won = false;
      state.loseReason = 'The shadows caught the keeper.';
      return EVENT_HIT | EVENT_LOSE;
    }
    return EVENT_HIT;
  }

  // Step the world by dt seconds. moveX/moveY are -1..1, dash is a fresh
  // dash request this step. Returns an event bitmask for sound/particles.
  function step(dt, moveX, moveY, dash) {
    if (!state || state.over) return EVENT_NONE;
    let events = EVENT_NONE;
    state.time += dt;
    state.timeLeft -= dt;
    if (state.shake > 0) state.shake = Math.max(0, state.shake - dt);
    const second = Math.ceil(state.timeLeft);
    if (second !== state.lastTickSecond) {
      state.lastTickSecond = second;
      if (second <= 10 && second > 0) events |= 128; // EVENT_TICK
    }
    if (state.timeLeft <= 0) {
      state.timeLeft = 0;
      state.over = true;
      state.won = false;
      state.loseReason = 'Night fell before the lanterns were lit.';
      return EVENT_LOSE;
    }
    if (state.comboTimer > 0) {
      state.comboTimer -= dt;
      if (state.comboTimer <= 0) state.combo = 0;
    }

    const p = state.player;
    if (p.invulnerable > 0) p.invulnerable -= dt;
    if (p.dashCooldown > 0) p.dashCooldown -= dt;
    if (dash && p.dashCooldown <= 0 && (moveX !== 0 || moveY !== 0)) {
      p.dashTime = PLAYER.dashTime;
      p.dashCooldown = PLAYER.dashCooldown;
      events |= EVENT_DASH;
    }
    let speed = PLAYER.speed;
    if (p.dashTime > 0) {
      p.dashTime -= dt;
      speed = PLAYER.dashSpeed;
    }
    const len = Math.hypot(moveX, moveY) || 1;
    p.vx = (moveX / len) * speed * (moveX || moveY ? 1 : 0);
    p.vy = (moveY / len) * speed * (moveX || moveY ? 1 : 0);
    if (moveX !== 0) p.facing = moveX > 0 ? 1 : -1;
    p.x = Math.max(PLAYER.radius, Math.min(VIEW.width - PLAYER.radius, p.x + p.vx * dt));
    p.y = Math.max(PLAYER.radius + 24, Math.min(VIEW.height - PLAYER.radius, p.y + p.vy * dt));

    // Ember pickups.
    for (let i = state.embers.length - 1; i >= 0; i -= 1) {
      const e = state.embers[i];
      e.phase += dt * 2.2 * e.bob;
      const d = Math.hypot(p.x - e.x, p.y - e.y);
      if (d < PLAYER.radius + EMBER.radius + 4 && state.carried < PLAYER.carryMax) {
        state.embers.splice(i, 1);
        state.carried += 1;
        state.combo += 1;
        state.comboTimer = 6;
        const mult = 1 + Math.min(state.combo - 1, 8) * COMBO_STEP;
        state.score += Math.round(EMBER.score * Math.min(mult, COMBO_MAX));
        events |= EVENT_PICKUP;
      }
    }
    state.emberTimer += dt;
    if (state.emberTimer >= EMBER.spawnEvery && state.embers.length < EMBER.maxOnField) {
      state.emberTimer = 0;
      state.embers.push(spawnEmber());
    }

    // Lantern deposits: touch a dark lantern while carrying embers.
    for (const lantern of state.lanterns) {
      lantern.glow = Math.max(0, lantern.glow - dt * 2);
      if (lantern.lit) continue;
      const d = Math.hypot(p.x - lantern.x, p.y - lantern.y);
      if (d < PLAYER.radius + 34 && state.carried > 0) {
        lantern.glow = 1;
        events |= depositAt(lantern);
        if (state.over) return events;
      }
    }

    // Wisps: spawn to keep pressure, then hunt.
    state.wispTimer += dt;
    if (state.wispTimer >= WISP.spawnEvery && state.wisps.length < wispTargetCount()) {
      state.wispTimer = 0;
      const roll = rng.next();
      const kind = state.litCount >= 4 && roll < 0.25
        ? WISP_BRUTE
        : state.litCount >= 2 && roll < 0.55 ? WISP_DART : WISP_DRIFTER;
      state.wisps.push(spawnWisp(kind));
      events |= EVENT_WISP;
    }
    const diff = difficulty();
    for (const w of state.wisps) {
      w.phase += dt * 3;
      const dx = p.x - w.x;
      const dy = p.y - w.y;
      const d = Math.hypot(dx, dy) || 1;
      let speedW = WISP.drifterSpeed * diff;
      if (w.kind === WISP_DART) {
        speedW = WISP.dartSpeed * diff;
        w.lungeTimer -= dt;
        if (w.lunging > 0) {
          w.lunging -= dt;
          speedW = WISP.dartLungeSpeed;
        } else if (w.lungeTimer <= 0 && d < 260) {
          w.lunging = 0.35;
          w.lungeTimer = rng.range(1.6, 2.6);
        }
      }
      if (w.kind === WISP_BRUTE) speedW = WISP.bruteSpeed * diff;
      // Wisps wobble so their path is readable, not a perfect homing line.
      const wob = Math.sin(w.phase) * 0.35;
      const nx = dx / d;
      const ny = dy / d;
      w.x += (nx - ny * wob) * speedW * dt;
      w.y += (ny + nx * wob) * speedW * dt;
      if (p.invulnerable <= 0 && d < PLAYER.radius + w.radius - 2) {
        events |= takeHit(w);
        if (state.over) return events;
      }
    }
    return events;
  }

  reset();
  return { state: () => state, reset, step };
}

export const EVENT_TICK = 128;
