// Emberlight — boot, fixed-step loop, screen state machine and wiring between
// input, world, particles, audio and the renderer.
import { VIEW, GAME, PLAYER, EMBER, LANTERN_SCORE } from './config.js';
import { createWorld, EVENT_PICKUP, EVENT_DEPOSIT, EVENT_HIT, EVENT_WIN, EVENT_LOSE, EVENT_DASH, EVENT_WISP, EVENT_TICK } from './world.js';
import { drawWorld, SCREEN_TITLE, SCREEN_PLAY, SCREEN_PAUSE, SCREEN_WIN, SCREEN_OVER } from './render.js';
import { createInput } from './input.js';
import { createParticles } from './particles.js';
import { createAudio } from './audio.js';
import { stageShot } from './shots.js';

const canvas = document.getElementById('game');
const ctx = canvas.getContext('2d');
canvas.width = VIEW.width;
canvas.height = VIEW.height;

const params = new URLSearchParams(window.location.search);
const shotName = params.get('shot');
const seed = Number(params.get('seed') || 7);

const world = createWorld(shotName ? seed : (Date.now() % 100000));
const input = createInput(canvas);
const particles = createParticles();
const audio = createAudio();

let screen = SCREEN_TITLE;
let best = 0;
try {
  best = Number(window.localStorage.getItem('emberlight-best') || 0) || 0;
} catch {
  best = 0;
}
let lastTime = 0;
let accumulator = 0;
let elapsed = 0;
let shotDone = false;

function saveBest() {
  if (world.state().score > best) {
    best = world.state().score;
    try {
      window.localStorage.setItem('emberlight-best', String(best));
    } catch {
      // storage unavailable; best lives for this session only
    }
  }
}

function startGame() {
  audio.unlock();
  audio.startPad();
  world.reset();
  particles.clear();
  screen = SCREEN_PLAY;
}

function handleEvents(events) {
  const s = world.state();
  const p = s.player;
  if (events & EVENT_PICKUP) {
    audio.pickup(s.combo);
    particles.burst(p.x, p.y, '#ffb347', 10, 120);
    particles.floatText(p.x, p.y - 30, `+${Math.round(EMBER.score * (1 + Math.min(s.combo - 1, 8) * 0.25))}`, '#ffe9a8');
  }
  if (events & EVENT_DEPOSIT) {
    audio.deposit();
    const lit = s.lanterns.find((l) => l.lit && l.glow > 0) || s.lanterns[s.litCount - 1];
    if (lit) particles.ring(lit.x, lit.y - 18, '#ffd166');
    particles.floatText(p.x, p.y - 34, 'LANTERN LIT!', '#ffd166');
  }
  if (events & EVENT_HIT) {
    audio.hit();
    particles.burst(p.x, p.y, '#8b7ff0', 22, 220);
  }
  if (events & EVENT_DASH) {
    audio.dash();
    particles.burst(p.x, p.y, '#7fd4ff', 8, 90);
  }
  if (events & EVENT_WISP) audio.wispSpawn();
  if (events & EVENT_TICK) audio.tick();
  if (events & EVENT_WIN) {
    audio.win();
    audio.stopPad();
    saveBest();
    screen = SCREEN_WIN;
  }
  if (events & EVENT_LOSE) {
    audio.lose();
    audio.stopPad();
    saveBest();
    screen = SCREEN_OVER;
  }
}

function stepGame(dt) {
  const keys = input.state;
  let mx = keys.moveX;
  let my = keys.moveY;
  if (keys.mouseDown && mx === 0 && my === 0) {
    const p = world.state().player;
    const dx = keys.mouseX - p.x;
    const dy = keys.mouseY - p.y;
    const d = Math.hypot(dx, dy);
    if (d > 12) {
      mx = dx / d;
      my = dy / d;
    }
  }
  const dash = input.consumeDash() || (keys.mouseDown && world.state().player.dashCooldown <= 0 && Math.hypot(keys.mouseX - world.state().player.x, keys.mouseY - world.state().player.y) > 200);
  const events = world.step(dt, mx, my, dash);
  handleEvents(events);
  particles.step(dt);
}

function onKey(code) {
  if (code === 'Enter') {
    if (screen === SCREEN_TITLE || screen === SCREEN_WIN || screen === SCREEN_OVER) startGame();
    else if (screen === SCREEN_PAUSE) screen = SCREEN_PLAY;
  }
  if (code === 'KeyR' && (screen === SCREEN_WIN || screen === SCREEN_OVER || screen === SCREEN_PLAY)) startGame();
  if (code === 'KeyP' || code === 'Escape') {
    if (screen === SCREEN_PLAY) screen = SCREEN_PAUSE;
    else if (screen === SCREEN_PAUSE) screen = SCREEN_PLAY;
  }
  if (code === 'KeyM') audio.toggleMute();
}

window.addEventListener('keydown', (event) => {
  if (event.repeat) return;
  onKey(event.code);
});

function onClick(point) {
  audio.unlock();
  if (screen === SCREEN_TITLE || screen === SCREEN_WIN || screen === SCREEN_OVER) startGame();
  else if (screen === SCREEN_PAUSE) screen = SCREEN_PLAY;
}

function frame(timestamp) {
  const now = timestamp / 1000;
  let dt = lastTime ? now - lastTime : 0.016;
  lastTime = now;
  if (dt > 0.1) dt = 0.1;
  elapsed += dt;

  if (shotName && !shotDone) {
    const staged = stageShot(shotName, world);
    screen = staged.screen;
    best = staged.best;
    shotDone = true;
  } else if (!shotName) {
    const click = input.takeClick();
    if (click) onClick(click);
    if (screen === SCREEN_PLAY) {
      accumulator += dt;
      while (accumulator >= GAME.step) {
        stepGame(GAME.step);
        accumulator -= GAME.step;
      }
    } else {
      // Ambient drift behind menus: embers bob, stars twinkle.
      world.state().embers.forEach((e) => { e.phase += dt * 2; });
      particles.step(dt);
      input.takeClick();
      input.consumeDash();
    }
  }
  drawWorld(ctx, world.state(), screen, best, elapsed, particles);
  if (shotName && shotDone) {
    window.__shotReady = true;
  }
  requestAnimationFrame(frame);
}

requestAnimationFrame(frame);

// Debug handle for automated play-testing (read-only state inspection).
window.__emberlight = {
  world,
  get screen() { return screen; },
  get best() { return best; },
};
