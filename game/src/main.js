// Velvet Vault — boot, game loop and state machine.
// Phases: title -> playing -> caught | escaped -> (next hall) -> done.
// ?shot=... renders one fixed scene for screenshots and never starts the loop.

import { makeWorld, updateWorld, levelDefs } from './world.js';
import { render } from './render.js';
import { makeInput, attachClickToMove } from './input.js';
import { makeAudio } from './audio.js';
import { parseShot, stageShot } from './shots.js';

const canvas = document.getElementById('stage');
const statusEl = document.getElementById('sr');
const input = makeInput();
attachClickToMove(canvas, input);
const audio = makeAudio();

const SEED = 20261122;
let levelIndex = 0;
let world = makeWorld(0, SEED);
let phase = 'title'; // title | playing | caught | escaped | done
let lastSpotted = false;
let lastAlarmTick = 0;

const shot = parseShot();
if (shot) {
  audio.setMuted(true);
  const staged = stageShot(shot);
  world = staged.world;
  phase = staged.phase;
  if (phase === 'escaped') {
    // The end shot shows the win overlay; mark the world escaped so the
    // overlay's numbers line up, but keep rendering this one frame.
    world.escaped = true;
    world.timeBonus = 452;
    world.score = 1752;
  }
  render(canvas, world, phase);
  document.title = `Velvet Vault — shot ${shot.shot}`;
} else {
  requestAnimationFrame(tick);
}

let last = performance.now();

function announce(text) {
  if (statusEl) statusEl.textContent = text;
}

function startLevel(index) {
  levelIndex = index;
  world = makeWorld(index, SEED);
  phase = 'playing';
  lastSpotted = false;
  announce(`Hall ${index + 1}: ${world.levelName}. Steal the Star Sapphire.`);
}

function tick(now) {
  const dt = Math.min(0.05, (now - last) / 1000);
  last = now;

  if (input.pressedStart) {
    input.pressedStart = false;
    audio.unlock();
    if (phase === 'title') {
      phase = 'playing';
      announce('Heist started. Stay out of the cones.');
    }
  }
  if (input.pressedRestart) {
    input.pressedRestart = false;
    audio.unlock();
    startLevel(levelIndex);
  }
  if (input.pressedNext) {
    input.pressedNext = false;
    if (phase === 'escaped' || phase === 'done') {
      if (levelIndex + 1 < levelDefs().length) startLevel(levelIndex + 1);
      else startLevel(0);
    }
  }

  if (phase === 'playing') {
    const wasSpotted = world.spotted;
    const wasAlarm = world.alarm;
    updateWorld(world, input, dt);
    if (world.spotted && !wasSpotted) {
      audio.spotted();
      announce('Spotted! Break line of sight.');
    }
    if (Math.floor(world.alarm / 25) > Math.floor(wasAlarm / 25) && world.alarm > 0) {
      audio.alarm();
    }
    if (world.caught) {
      phase = 'caught';
      audio.lose();
      announce(`Caught. ${world.catchReason}`);
    } else if (world.escaped) {
      audio.win();
      announce('Clean getaway! Press N for the next hall.');
      if (levelIndex + 1 >= levelDefs().length) {
        phase = 'done';
      } else {
        phase = 'escaped';
      }
    }
  } else if (phase === 'escaped' && input.pressedStart) {
    input.pressedStart = false;
  }

  // Keep the alarm ticking sound in step with the meter while spotted.
  if (world.spotted && now - lastAlarmTick > 900) {
    lastAlarmTick = now;
  }

  render(canvas, world, phase);
  requestAnimationFrame(tick);
}

// Expose a tiny handle for play-testing from the console.
window.velvetVault = {
  get world() { return world; },
  get phase() { return phase; },
  startLevel,
};
