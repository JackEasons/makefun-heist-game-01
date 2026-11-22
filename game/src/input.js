// Keyboard and mouse input for Velvet Vault. Arrow keys / WASD move,
// Shift sprints (loud), E is the action key, R restarts, Enter starts.
// Clicking the room sets a click-to-move target.

export function makeInput() {
  const input = {
    left: false,
    right: false,
    up: false,
    down: false,
    sprint: false,
    action: false,
    moveTarget: null,
    // Edge-triggered presses, consumed by the game loop.
    pressedStart: false,
    pressedRestart: false,
    pressedNext: false,
  };

  const keys = new Set();
  const KEYMAP = {
    ArrowLeft: 'left', KeyA: 'left',
    ArrowRight: 'right', KeyD: 'right',
    ArrowUp: 'up', KeyW: 'up',
    ArrowDown: 'down', KeyS: 'down',
    ShiftLeft: 'sprint', ShiftRight: 'sprint',
    KeyE: 'action',
  };

  function sync() {
    input.left = keys.has('ArrowLeft') || keys.has('KeyA');
    input.right = keys.has('ArrowRight') || keys.has('KeyD');
    input.up = keys.has('ArrowUp') || keys.has('KeyW');
    input.down = keys.has('ArrowDown') || keys.has('KeyS');
    input.sprint = keys.has('ShiftLeft') || keys.has('ShiftRight');
    input.action = keys.has('KeyE');
  }

  window.addEventListener('keydown', (e) => {
    if (['ArrowLeft', 'ArrowRight', 'ArrowUp', 'ArrowDown', 'Space'].includes(e.code)) {
      e.preventDefault();
    }
    if (e.repeat) return;
    keys.add(e.code);
    if (e.code === 'Enter' || e.code === 'Space') input.pressedStart = true;
    if (e.code === 'KeyR') input.pressedRestart = true;
    if (e.code === 'KeyN') input.pressedNext = true;
    sync();
  });
  window.addEventListener('keyup', (e) => {
    keys.delete(e.code);
    sync();
  });
  window.addEventListener('blur', () => {
    keys.clear();
    sync();
  });

  return input;
}

// Translate a click on the canvas into room coordinates. The renderer keeps
// the current view transform here so clicks land where the player expects.
export const view = { scale: 1, ox: 0, oy: 0 };

export function attachClickToMove(canvas, input) {
  canvas.addEventListener('pointerdown', (e) => {
    const rect = canvas.getBoundingClientRect();
    const x = (e.clientX - rect.left - view.ox) / view.scale;
    const y = (e.clientY - rect.top - view.oy) / view.scale;
    input.moveTarget = { x, y };
    input.pressedStart = true; // a click also starts from the title screen
  });
}
