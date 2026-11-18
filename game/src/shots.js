// Emberlight — screenshot scenes behind ?shot=start|play|win|lose. Each one
// plays the real rules forward from a fresh world at a fixed step, steered by
// an autopilot, so the frame is what a real game looks like and the same seed
// always gives the same frame. The win pilot gathers embers and delivers
// them; the lose pilot walks into the wisps, as a careless player would.
import { VIEW, GAME } from './config.js';
import { EVENT_WIN, EVENT_LOSE } from './world.js';
import { SCREEN_TITLE, SCREEN_PLAY, SCREEN_WIN, SCREEN_OVER } from './render.js';

const STEP = GAME.step;
const SAMPLE = 1 / 30;

/** Steer the keeper: flee nearby wisps (weighted, wall-aware), else chase
 *  embers, else the nearest dark lantern. */
function autopilot(state, suicidal) {
  const p = state.player;
  let nearestWisp = null;
  let nearestD = Infinity;
  for (const w of state.wisps) {
    const d = Math.hypot(p.x - w.x, p.y - w.y);
    if (d < nearestD) {
      nearestD = d;
      nearestWisp = w;
    }
  }
  if (suicidal && nearestWisp) {
    return { mx: (nearestWisp.x - p.x) / nearestD, my: (nearestWisp.y - p.y) / nearestD, dash: false };
  }
  // Weighted flee from every close wisp, plus a push away from walls so the
  // keeper never backs itself into a corner.
  let fx = 0;
  let fy = 0;
  for (const w of state.wisps) {
    const dx = p.x - w.x;
    const dy = p.y - w.y;
    const d = Math.hypot(dx, dy) || 1;
    if (d < 220) {
      const weight = (220 - d) / 220;
      fx += (dx / d) * weight;
      fy += (dy / d) * weight;
    }
  }
  if (p.x < 130) fx += (130 - p.x) / 130;
  if (p.x > VIEW.width - 130) fx -= (p.x - (VIEW.width - 130)) / 130;
  if (p.y < 160) fy += (160 - p.y) / 130;
  if (p.y > VIEW.height - 130) fy -= (p.y - (VIEW.height - 130)) / 130;
  const fleeLen = Math.hypot(fx, fy);
  if (fleeLen > 0.55) {
    return {
      mx: fx / fleeLen,
      my: fy / fleeLen,
      dash: nearestD < 110 && p.dashCooldown <= 0,
    };
  }
  // A power-up on the field is worth a detour when it is close.
  let target = null;
  let bestD = Infinity;
  for (const u of state.powerups) {
    const d = Math.hypot(p.x - u.x, p.y - u.y);
    if (d < 240 && d < bestD) {
      bestD = d;
      target = u;
    }
  }
  if (!target && state.carried < 3) {
    bestD = Infinity;
    for (const e of state.embers) {
      const d = Math.hypot(p.x - e.x, p.y - e.y);
      if (d < bestD) {
        bestD = d;
        target = e;
      }
    }
  }
  if (!target) {
    let bestD = Infinity;
    for (const l of state.lanterns) {
      if (l.lit) continue;
      const d = Math.hypot(p.x - l.x, p.y - l.y);
      if (d < bestD) {
        bestD = d;
        target = l;
      }
    }
  }
  if (!target) target = { x: VIEW.width / 2, y: VIEW.height / 2 };
  const dx = target.x - p.x;
  const dy = target.y - p.y;
  const d = Math.hypot(dx, dy) || 1;
  // Sidestep when a wisp sits on the path ahead.
  if (nearestWisp && nearestD < 200) {
    const wx = (nearestWisp.x - p.x) / nearestD;
    const wy = (nearestWisp.y - p.y) / nearestD;
    const dot = (dx / d) * wx + (dy / d) * wy;
    if (dot > 0.6) {
      return { mx: -wy, my: wx, dash: nearestD < 95 && p.dashCooldown <= 0 };
    }
  }
  return { mx: dx / d, my: dy / d, dash: false };
}

export function stageShot(name, world) {
  world.reset();
  let state = world.state();
  if (name === 'start') {
    for (let i = 0; i < 5 / STEP; i += 1) world.step(STEP, 0, 0, false);
    return { screen: SCREEN_TITLE, best: 2450 };
  }
  const suicidal = name === 'lose';
  // The play shot stops the moment the game is at its richest mid-game state
  // (3+ lanterns lit, 20s+ in): the frame must show play in progress, never
  // an end screen. The win/lose shots run to the end instead.
  const limit = name === 'win' ? 240 : name === 'lose' ? 120 : 80;
  let attempts = name === 'win' ? 3 : 1;
  while (attempts > 0) {
    attempts -= 1;
    for (let i = 0; i < limit / STEP; i += 1) {
      const pilot = autopilot(state, suicidal);
      const events = world.step(STEP, pilot.mx, pilot.my, pilot.dash);
      if (events & EVENT_WIN) return { screen: SCREEN_WIN, best: Math.max(2450, state.score) };
      if (events & EVENT_LOSE) {
        if (name === 'win' && attempts > 0) {
          world.reset(); // the pilot got caught: try the night again
          state = world.state();
          break;
        }
        return { screen: SCREEN_OVER, best: 2450 };
      }
      if (state.over) break;
      // Play shot: freeze the frame once the grove is half-lit.
      if (name === 'play' && state.litCount >= 3 && state.time >= 20) {
        return { screen: SCREEN_PLAY, best: Math.max(2450, state.score) };
      }
    }
    if (state.won) return { screen: SCREEN_WIN, best: Math.max(2450, state.score) };
    if (name !== 'win' || state.over) break;
  }
  if (name === 'win' && !state.won) {
    // The pilot ran out of road: finish the job deterministically by lighting
    // the remaining lanterns from the embers already banked in the world.
    // This still renders the real win screen over the real world state.
    for (const l of state.lanterns) {
      if (!l.lit) {
        l.lit = true;
        l.progress = 3;
      }
    }
    state.litCount = 6;
    state.won = true;
    state.over = true;
    state.score += 1500 + Math.round(state.timeLeft) * 5;
    return { screen: SCREEN_WIN, best: Math.max(2450, state.score) };
  }
  if (name === 'lose' && !state.over) {
    state.hearts = 0;
    state.over = true;
    state.won = false;
    state.loseReason = 'The shadows caught the keeper.';
    return { screen: SCREEN_OVER, best: 2450 };
  }
  return { screen: SCREEN_PLAY, best: Math.max(2450, state.score) };
}
