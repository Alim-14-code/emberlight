// Emberlight — every pixel the player sees: the night grove, the keeper, the
// wisps, the HUD and the title / pause / win / lose screens. All art is drawn
// in code (gradients, shapes, glow); no image files are shipped.
import { VIEW, PALETTE, LANTERNS, EMBERS_PER_LANTERN, LANTERN_COUNT, PLAYER, GAME } from './config.js';
import { WISP_DRIFTER, WISP_DART, WISP_BRUTE } from './world.js';

export const SCREEN_TITLE = 'title';
export const SCREEN_PLAY = 'play';
export const SCREEN_PAUSE = 'pause';
export const SCREEN_WIN = 'win';
export const SCREEN_OVER = 'over';

function roundRect(ctx, x, y, w, h, r) {
  ctx.beginPath();
  ctx.moveTo(x + r, y);
  ctx.arcTo(x + w, y, x + w, y + h, r);
  ctx.arcTo(x + w, y + h, x, y + h, r);
  ctx.arcTo(x, y + h, x, y, r);
  ctx.arcTo(x, y, x + w, y, r);
  ctx.closePath();
}

function glow(ctx, x, y, radius, color) {
  const g = ctx.createRadialGradient(x, y, 0, x, y, radius);
  g.addColorStop(0, color);
  g.addColorStop(1, 'rgba(0,0,0,0)');
  ctx.fillStyle = g;
  ctx.beginPath();
  ctx.arc(x, y, radius, 0, Math.PI * 2);
  ctx.fill();
}

function drawBackground(ctx, state, t) {
  const g = ctx.createLinearGradient(0, 0, 0, VIEW.height);
  g.addColorStop(0, PALETTE.skyTop);
  g.addColorStop(0.55, PALETTE.skyBottom);
  g.addColorStop(1, PALETTE.ground);
  ctx.fillStyle = g;
  ctx.fillRect(0, 0, VIEW.width, VIEW.height);
  // Moon, kept below the HUD bar.
  glow(ctx, 1060, 135, 90, 'rgba(240,244,220,0.25)');
  ctx.fillStyle = '#eef2d8';
  ctx.beginPath();
  ctx.arc(1060, 135, 34, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = 'rgba(180,190,160,0.7)';
  ctx.beginPath();
  ctx.arc(1050, 127, 7, 0, Math.PI * 2);
  ctx.arc(1070, 145, 5, 0, Math.PI * 2);
  ctx.fill();
  // Stars.
  for (const s of state.stars) {
    ctx.globalAlpha = 0.35 + 0.65 * Math.abs(Math.sin(t * 0.9 + s.tw));
    ctx.fillStyle = '#dfe9f2';
    ctx.beginPath();
    ctx.arc(s.x, s.y, s.r, 0, Math.PI * 2);
    ctx.fill();
  }
  ctx.globalAlpha = 1;
  // Distant pines.
  ctx.fillStyle = '#0a2027';
  for (let i = 0; i < 14; i += 1) {
    const x = i * 96 + 20;
    const h = 90 + ((i * 37) % 60);
    ctx.beginPath();
    ctx.moveTo(x, 300);
    ctx.lineTo(x + 34, 300 - h);
    ctx.lineTo(x + 68, 300);
    ctx.closePath();
    ctx.fill();
  }
  // Grove floor.
  ctx.fillStyle = '#0e2f28';
  ctx.fillRect(0, 300, VIEW.width, VIEW.height - 300);
  ctx.fillStyle = 'rgba(255,255,255,0.03)';
  for (let i = 0; i < 40; i += 1) {
    const x = (i * 173) % VIEW.width;
    const y = 330 + ((i * 97) % 360);
    ctx.beginPath();
    ctx.ellipse(x, y, 60, 10, 0, 0, Math.PI * 2);
    ctx.fill();
  }
  // Fireflies drifting over the floor.
  for (let i = 0; i < 12; i += 1) {
    const fx = (i * 211 + Math.sin(t * 0.4 + i) * 30 + VIEW.width) % VIEW.width;
    const fy = 340 + ((i * 53) % 330) + Math.cos(t * 0.6 + i * 2) * 12;
    ctx.globalAlpha = 0.25 + 0.35 * Math.abs(Math.sin(t + i));
    ctx.fillStyle = '#ffe9a8';
    ctx.beginPath();
    ctx.arc(fx, fy, 2.2, 0, Math.PI * 2);
    ctx.fill();
  }
  ctx.globalAlpha = 1;
}

function drawLantern(ctx, lantern, t) {
  const { x, y } = lantern;
  if (lantern.lit) {
    glow(ctx, x, y - 18, 110 + Math.sin(t * 3 + x) * 8, 'rgba(255,190,80,0.30)');
    glow(ctx, x, y - 18, 46, 'rgba(255,220,130,0.55)');
  } else if (lantern.glow > 0) {
    glow(ctx, x, y - 18, 60 * lantern.glow, 'rgba(255,190,80,0.35)');
  }
  // Post and cap.
  ctx.fillStyle = '#5a4632';
  ctx.fillRect(x - 5, y - 6, 10, 44);
  ctx.fillStyle = '#2c2118';
  ctx.beginPath();
  ctx.moveTo(x - 16, y - 6);
  ctx.lineTo(x + 16, y - 6);
  ctx.lineTo(x + 9, y - 20);
  ctx.lineTo(x - 9, y - 20);
  ctx.closePath();
  ctx.fill();
  // Glass.
  ctx.fillStyle = lantern.lit ? PALETTE.lanternLit : '#22303c';
  roundRect(ctx, x - 13, y - 40, 26, 26, 5);
  ctx.fill();
  if (lantern.lit) {
    ctx.fillStyle = '#fff3c4';
    ctx.beginPath();
    ctx.arc(x, y - 27, 6 + Math.sin(t * 5 + x) * 1.2, 0, Math.PI * 2);
    ctx.fill();
  } else {
    // Progress pips: how many embers this lantern still needs.
    ctx.fillStyle = PALETTE.dim;
    ctx.font = 'bold 13px Georgia, serif';
    ctx.textAlign = 'center';
    ctx.fillText(`${lantern.progress}/${EMBERS_PER_LANTERN}`, x, y + 58);
    ctx.fillStyle = '#ffb347';
    for (let i = 0; i < lantern.progress; i += 1) {
      ctx.beginPath();
      ctx.arc(x - 10 + i * 10, y - 48, 2.5, 0, Math.PI * 2);
      ctx.fill();
    }
  }
}

function drawEmber(ctx, ember) {
  const y = ember.y + Math.sin(ember.phase) * 5;
  glow(ctx, ember.x, y, 34, 'rgba(255,170,60,0.45)');
  ctx.fillStyle = PALETTE.ember;
  ctx.beginPath();
  ctx.arc(ember.x, y, 11, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = PALETTE.emberCore;
  ctx.beginPath();
  ctx.arc(ember.x, y, 5.5, 0, Math.PI * 2);
  ctx.fill();
}

function drawWisp(ctx, wisp, t) {
  const color = wisp.kind === WISP_BRUTE ? '#c65df0' : wisp.kind === WISP_DART ? '#7fb0f0' : PALETTE.wisp;
  const wob = Math.sin(wisp.phase) * 3;
  glow(ctx, wisp.x, wisp.y + wob, wisp.radius * 2.6, 'rgba(139,127,240,0.28)');
  ctx.fillStyle = color;
  ctx.globalAlpha = 0.88;
  ctx.beginPath();
  ctx.arc(wisp.x, wisp.y + wob - 4, wisp.radius, 0, Math.PI * 2);
  ctx.fill();
  ctx.beginPath();
  ctx.moveTo(wisp.x - wisp.radius * 0.8, wisp.y + wob);
  ctx.quadraticCurveTo(wisp.x, wisp.y + wob + wisp.radius + 12 + Math.sin(t * 6 + wisp.phase) * 5, wisp.x + wisp.radius * 0.8, wisp.y + wob);
  ctx.closePath();
  ctx.fill();
  ctx.globalAlpha = 1;
  // Eyes.
  ctx.fillStyle = '#fff';
  ctx.beginPath();
  ctx.arc(wisp.x - 6, wisp.y + wob - 6, 3.4, 0, Math.PI * 2);
  ctx.arc(wisp.x + 6, wisp.y + wob - 6, 3.4, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = '#1a1030';
  ctx.beginPath();
  ctx.arc(wisp.x - 6, wisp.y + wob - 6, 1.6, 0, Math.PI * 2);
  ctx.arc(wisp.x + 6, wisp.y + wob - 6, 1.6, 0, Math.PI * 2);
  ctx.fill();
}

function drawPlayer(ctx, state, t) {
  const p = state.player;
  const blink = p.invulnerable > 0 && Math.floor(t * 12) % 2 === 0;
  if (blink) ctx.globalAlpha = 0.35;
  glow(ctx, p.x, p.y, 70, 'rgba(255,200,100,0.22)');
  // Cloak.
  ctx.fillStyle = PALETTE.cloak;
  ctx.beginPath();
  ctx.moveTo(p.x, p.y - 20);
  ctx.quadraticCurveTo(p.x + 20, p.y - 4, p.x + 15, p.y + 18);
  ctx.lineTo(p.x - 15, p.y + 18);
  ctx.quadraticCurveTo(p.x - 20, p.y - 4, p.x, p.y - 20);
  ctx.fill();
  // Hood + face.
  ctx.fillStyle = '#3d8f86';
  ctx.beginPath();
  ctx.arc(p.x, p.y - 12, 12, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = PALETTE.player;
  ctx.beginPath();
  ctx.arc(p.x + p.facing * 3, p.y - 11, 7.5, 0, Math.PI * 2);
  ctx.fill();
  // The keeper's lantern, swinging ahead.
  const lx = p.x + p.facing * 24;
  const ly = p.y + 2 + Math.sin(t * 4) * 2;
  ctx.strokeStyle = '#8a6b3f';
  ctx.beginPath();
  ctx.moveTo(p.x + p.facing * 12, p.y + 2);
  ctx.lineTo(lx, ly - 6);
  ctx.stroke();
  glow(ctx, lx, ly, 30, 'rgba(255,210,110,0.5)');
  ctx.fillStyle = PALETTE.lanternLit;
  ctx.beginPath();
  ctx.arc(lx, ly, 6, 0, Math.PI * 2);
  ctx.fill();
  // Carried embers orbit the keeper.
  for (let i = 0; i < state.carried; i += 1) {
    const a = t * 3 + (i * Math.PI * 2) / Math.max(1, state.carried);
    ctx.fillStyle = PALETTE.ember;
    ctx.beginPath();
    ctx.arc(p.x + Math.cos(a) * 28, p.y - 4 + Math.sin(a) * 12, 5, 0, Math.PI * 2);
    ctx.fill();
  }
  ctx.globalAlpha = 1;
}

function drawHud(ctx, state) {
  // Top bar.
  ctx.fillStyle = 'rgba(6,18,26,0.72)';
  roundRect(ctx, 12, 10, VIEW.width - 24, 64, 12);
  ctx.fill();
  ctx.textAlign = 'left';
  ctx.textBaseline = 'alphabetic';
  // Hearts.
  for (let i = 0; i < GAME.hearts; i += 1) {
    const x = 40 + i * 34;
    const y = 44;
    ctx.fillStyle = i < state.hearts ? PALETTE.heart : 'rgba(255,255,255,0.18)';
    ctx.beginPath();
    ctx.moveTo(x, y + 8);
    ctx.bezierCurveTo(x - 12, y - 4, x - 6, y - 14, x, y - 6);
    ctx.bezierCurveTo(x + 6, y - 14, x + 12, y - 4, x, y + 8);
    ctx.fill();
  }
  // Score.
  ctx.fillStyle = PALETTE.text;
  ctx.font = 'bold 26px Georgia, serif';
  ctx.fillText(`SCORE ${state.score}`, 150, 48);
  // Lanterns lit.
  ctx.font = 'bold 22px Georgia, serif';
  ctx.fillStyle = PALETTE.lanternLit;
  let lx = 330;
  for (let i = 0; i < LANTERN_COUNT; i += 1) {
    ctx.globalAlpha = i < state.litCount ? 1 : 0.28;
    ctx.beginPath();
    ctx.arc(lx, 40, 8, 0, Math.PI * 2);
    ctx.fill();
    lx += 26;
  }
  ctx.globalAlpha = 1;
  ctx.fillStyle = PALETTE.text;
  ctx.fillText(`${state.litCount}/${LANTERN_COUNT} LANTERNS`, lx + 6, 48);
  // Combo.
  if (state.combo >= 2) {
    ctx.fillStyle = '#ffb347';
    ctx.font = 'bold 20px Georgia, serif';
    ctx.fillText(`COMBO x${state.combo}`, 672, 48);
  }
  // Timer.
  const mins = Math.floor(state.timeLeft / 60);
  const secs = Math.floor(state.timeLeft % 60);
  const timeText = `${mins}:${String(secs).padStart(2, '0')}`;
  ctx.fillStyle = state.timeLeft <= 30 ? '#ff7a6b' : PALETTE.text;
  ctx.font = 'bold 28px Georgia, serif';
  ctx.textAlign = 'right';
  ctx.fillText(`NIGHT ${timeText}`, VIEW.width - 36, 48);
  ctx.textAlign = 'left';
  // Timer bar.
  ctx.fillStyle = 'rgba(255,255,255,0.15)';
  ctx.fillRect(880, 56, 360, 6);
  ctx.fillStyle = state.timeLeft <= 30 ? '#ff7a6b' : '#7fd4a8';
  ctx.fillRect(880, 56, 360 * Math.max(0, state.timeLeft / GAME.timeLimit), 6);
  // Dash meter + carried embers, bottom left.
  ctx.fillStyle = 'rgba(6,18,26,0.6)';
  roundRect(ctx, 12, VIEW.height - 52, 480, 40, 10);
  ctx.fill();
  const dashReady = state.player.dashCooldown <= 0;
  ctx.fillStyle = dashReady ? '#7fd4ff' : 'rgba(255,255,255,0.25)';
  ctx.font = 'bold 17px Georgia, serif';
  ctx.fillText(dashReady ? 'DASH READY  [SPACE]' : 'DASH ...', 26, VIEW.height - 26);
  ctx.fillStyle = PALETTE.ember;
  for (let i = 0; i < state.carried; i += 1) {
    ctx.beginPath();
    ctx.arc(216 + i * 22, VIEW.height - 32, 7, 0, Math.PI * 2);
    ctx.fill();
  }
  ctx.fillStyle = PALETTE.dim;
  ctx.font = '14px Georgia, serif';
  ctx.fillText('→ deliver to a dark lantern', 272, VIEW.height - 26);
  // Controls hint, bottom right.
  ctx.fillStyle = PALETTE.dim;
  ctx.font = '15px Georgia, serif';
  ctx.textAlign = 'right';
  ctx.fillText('WASD / arrows move · SPACE dash · P pause · M sound', VIEW.width - 20, VIEW.height - 26);
  ctx.textAlign = 'left';
}

function panel(ctx, x, y, w, h) {
  ctx.fillStyle = 'rgba(5,16,24,0.82)';
  roundRect(ctx, x, y, w, h, 18);
  ctx.fill();
  ctx.strokeStyle = 'rgba(255,209,102,0.5)';
  ctx.lineWidth = 2;
  roundRect(ctx, x, y, w, h, 18);
  ctx.stroke();
}

function drawTitle(ctx, state, best) {
  ctx.fillStyle = 'rgba(4,12,20,0.55)';
  ctx.fillRect(0, 0, VIEW.width, VIEW.height);
  panel(ctx, 240, 92, 800, 536);
  ctx.textAlign = 'center';
  ctx.fillStyle = PALETTE.lanternLit;
  ctx.font = 'bold 84px Georgia, serif';
  ctx.fillText('EMBERLIGHT', 640, 200);
  ctx.fillStyle = PALETTE.text;
  ctx.font = 'italic 26px Georgia, serif';
  ctx.fillText('Keep the lanterns lit before the night ends', 640, 244);
  ctx.fillStyle = PALETTE.dim;
  ctx.font = '20px Georgia, serif';
  ctx.fillText('Collect glowing embers  ●  Carry up to 3  ●  Touch a dark lantern to light it', 640, 300);
  ctx.fillText('Light all 6 lanterns to win. Shadow wisps steal a heart — lose 3 and the night wins.', 640, 330);
  ctx.fillText('WASD / arrows to move  ·  SPACE to dash  ·  hold mouse to steer  ·  P pause', 640, 360);
  ctx.fillStyle = '#ffb347';
  ctx.font = 'bold 24px Georgia, serif';
  ctx.fillText('Dart wisps lunge · Brutes are slow but huge · Chains build your combo', 640, 400);
  if (best > 0) {
    ctx.fillStyle = PALETTE.text;
    ctx.font = 'bold 22px Georgia, serif';
    ctx.fillText(`BEST SCORE  ${best}`, 640, 448);
  }
  const pulse = 0.6 + 0.4 * Math.sin(Date.now() / 350);
  ctx.globalAlpha = pulse;
  ctx.fillStyle = '#ffd166';
  ctx.font = 'bold 30px Georgia, serif';
  ctx.fillText('—  PRESS ENTER OR CLICK TO START  —', 640, 516);
  ctx.globalAlpha = 1;
  ctx.fillStyle = PALETTE.dim;
  ctx.font = '16px Georgia, serif';
  ctx.fillText('An original game · sound on · no downloads · best in desktop Chrome', 640, 588);
  ctx.textAlign = 'left';
}

function drawEnd(ctx, state, best, won) {
  ctx.fillStyle = won ? 'rgba(20,40,10,0.55)' : 'rgba(20,6,12,0.6)';
  ctx.fillRect(0, 0, VIEW.width, VIEW.height);
  panel(ctx, 290, 130, 700, 460);
  ctx.textAlign = 'center';
  ctx.fillStyle = won ? PALETTE.lanternLit : '#ff7a6b';
  ctx.font = 'bold 64px Georgia, serif';
  ctx.fillText(won ? 'ALL LANTERNS LIT!' : 'THE NIGHT WON', 640, 232);
  ctx.fillStyle = PALETTE.text;
  ctx.font = '22px Georgia, serif';
  ctx.fillText(won ? 'Dawn breaks over a glowing grove.' : state.loseReason, 640, 276);
  if (won) {
    const stars = state.timeLeft > 90 ? 3 : state.timeLeft > 45 ? 2 : 1;
    ctx.font = '44px Georgia, serif';
    ctx.fillStyle = PALETTE.lanternLit;
    ctx.fillText('★'.repeat(stars) + '☆'.repeat(3 - stars), 640, 330);
    ctx.fillStyle = PALETTE.dim;
    ctx.font = '18px Georgia, serif';
    ctx.fillText(`Time to spare: ${Math.round(state.timeLeft)}s  ·  ${stars} star${stars > 1 ? 's' : ''}`, 640, 360);
  } else {
    ctx.fillStyle = PALETTE.dim;
    ctx.font = '20px Georgia, serif';
    ctx.fillText(`Lanterns lit: ${state.litCount} of ${LANTERN_COUNT}  ·  Embers gathered along the way`, 640, 330);
  }
  ctx.fillStyle = PALETTE.text;
  ctx.font = 'bold 30px Georgia, serif';
  ctx.fillText(`SCORE  ${state.score}`, 640, 420);
  ctx.fillStyle = PALETTE.dim;
  ctx.font = '20px Georgia, serif';
  ctx.fillText(`BEST  ${Math.max(best, state.score)}`, 640, 454);
  const pulse = 0.6 + 0.4 * Math.sin(Date.now() / 350);
  ctx.globalAlpha = pulse;
  ctx.fillStyle = '#ffd166';
  ctx.font = 'bold 26px Georgia, serif';
  ctx.fillText('—  PRESS R OR CLICK TO PLAY AGAIN  —', 640, 522);
  ctx.globalAlpha = 1;
  ctx.textAlign = 'left';
}

function drawPause(ctx) {
  ctx.fillStyle = 'rgba(4,12,20,0.6)';
  ctx.fillRect(0, 0, VIEW.width, VIEW.height);
  panel(ctx, 390, 260, 500, 200);
  ctx.textAlign = 'center';
  ctx.fillStyle = PALETTE.text;
  ctx.font = 'bold 48px Georgia, serif';
  ctx.fillText('PAUSED', 640, 340);
  ctx.fillStyle = PALETTE.dim;
  ctx.font = '20px Georgia, serif';
  ctx.fillText('Press P or click to keep playing', 640, 386);
  ctx.textAlign = 'left';
}

export function drawWorld(ctx, state, screen, best, t, particles) {
  ctx.save();
  if (state.shake > 0) {
    const s = state.shake * 14;
    ctx.translate((Math.random() - 0.5) * s, (Math.random() - 0.5) * s);
  }
  drawBackground(ctx, state, t);
  for (const lantern of state.lanterns) drawLantern(ctx, lantern, t);
  for (const ember of state.embers) drawEmber(ctx, ember);
  for (const wisp of state.wisps) drawWisp(ctx, wisp, t);
  drawPlayer(ctx, state, t);
  particles.draw(ctx);
  ctx.restore();
  if (screen === SCREEN_PLAY || screen === SCREEN_PAUSE) drawHud(ctx, state);
  if (screen === SCREEN_TITLE) drawTitle(ctx, state, best);
  if (screen === SCREEN_WIN) drawEnd(ctx, state, best, true);
  if (screen === SCREEN_OVER) drawEnd(ctx, state, best, false);
  if (screen === SCREEN_PAUSE) drawPause(ctx);
}
