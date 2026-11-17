// Emberlight — keyboard and mouse input, normalised to one small state object
// the world steps from. WASD/arrows move, Space dashes, Enter starts, R
// restarts, P pauses, M mutes; holding the mouse button steers toward the cursor.
export function createInput(canvas) {
  const keys = new Set();
  const state = {
    moveX: 0,
    moveY: 0,
    dashQueued: false,
    mouseDown: false,
    mouseX: 0,
    mouseY: 0,
    clicked: false,
  };
  let clickX = 0;
  let clickY = 0;

  function updateMove() {
    let x = 0;
    let y = 0;
    if (keys.has('ArrowLeft') || keys.has('KeyA')) x -= 1;
    if (keys.has('ArrowRight') || keys.has('KeyD')) x += 1;
    if (keys.has('ArrowUp') || keys.has('KeyW')) y -= 1;
    if (keys.has('ArrowDown') || keys.has('KeyS')) y += 1;
    state.moveX = x;
    state.moveY = y;
  }

  window.addEventListener('keydown', (event) => {
    if (['ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight', 'Space'].includes(event.code)) {
      event.preventDefault();
    }
    if (event.repeat) return;
    keys.add(event.code);
    if (event.code === 'Space') state.dashQueued = true;
    updateMove();
  });
  window.addEventListener('keyup', (event) => {
    keys.delete(event.code);
    updateMove();
  });
  window.addEventListener('blur', () => {
    keys.clear();
    updateMove();
  });

  function toCanvas(event) {
    const rect = canvas.getBoundingClientRect();
    return {
      x: ((event.clientX - rect.left) / rect.width) * 1280,
      y: ((event.clientY - rect.top) / rect.height) * 720,
    };
  }
  canvas.addEventListener('pointerdown', (event) => {
    const p = toCanvas(event);
    state.mouseDown = true;
    state.mouseX = p.x;
    state.mouseY = p.y;
    state.clicked = true;
    clickX = p.x;
    clickY = p.y;
  });
  window.addEventListener('pointerup', () => {
    state.mouseDown = false;
  });
  window.addEventListener('pointermove', (event) => {
    const p = toCanvas(event);
    state.mouseX = p.x;
    state.mouseY = p.y;
  });

  return {
    state,
    pressed(code) {
      return keys.has(code);
    },
    takeClick() {
      if (!state.clicked) return null;
      state.clicked = false;
      return { x: clickX, y: clickY };
    },
    consumeDash() {
      const d = state.dashQueued;
      state.dashQueued = false;
      return d;
    },
  };
}
