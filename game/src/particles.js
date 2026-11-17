// Emberlight — sparks, motes and floating score text. Pure decoration: the
// world spawns them, the renderer draws them, nothing else reads them.
export function createParticles() {
  const list = [];
  return {
    burst(x, y, color, count, speed = 160) {
      for (let i = 0; i < count; i += 1) {
        const a = Math.random() * Math.PI * 2;
        const v = speed * (0.3 + Math.random() * 0.7);
        list.push({
          x, y, vx: Math.cos(a) * v, vy: Math.sin(a) * v,
          life: 0.5 + Math.random() * 0.4, age: 0, size: 2 + Math.random() * 3, color,
        });
      }
    },
    ring(x, y, color) {
      for (let i = 0; i < 26; i += 1) {
        const a = (i / 26) * Math.PI * 2;
        list.push({
          x, y, vx: Math.cos(a) * 220, vy: Math.sin(a) * 220,
          life: 0.7, age: 0, size: 3, color,
        });
      }
    },
    floatText(x, y, text, color) {
      list.push({ x, y, vx: 0, vy: -46, life: 1.1, age: 0, size: 0, color, text });
    },
    step(dt) {
      for (let i = list.length - 1; i >= 0; i -= 1) {
        const p = list[i];
        p.age += dt;
        if (p.age >= p.life) {
          list.splice(i, 1);
          continue;
        }
        p.x += p.vx * dt;
        p.y += p.vy * dt;
        p.vx *= 0.94;
        p.vy *= 0.94;
      }
    },
    draw(ctx) {
      for (const p of list) {
        const t = 1 - p.age / p.life;
        ctx.globalAlpha = Math.max(0, t);
        if (p.text) {
          ctx.fillStyle = p.color;
          ctx.font = 'bold 22px Georgia, serif';
          ctx.textAlign = 'center';
          ctx.fillText(p.text, p.x, p.y);
        } else {
          ctx.fillStyle = p.color;
          ctx.beginPath();
          ctx.arc(p.x, p.y, p.size * t + 0.5, 0, Math.PI * 2);
          ctx.fill();
        }
      }
      ctx.globalAlpha = 1;
    },
    clear() {
      list.length = 0;
    },
  };
}
