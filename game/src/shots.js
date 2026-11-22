// Deterministic screenshot scenes for shots.json: the same seed and shot
// always stage the same frame, so the screenshots are real renders of the
// game's own code in a fixed, judge-readable state.
//   ?shot=start — title screen over the hall
//   ?shot=play  — mid-heist: thief near the sapphire, cones crossing the room
//   ?shot=end   — the getaway: sapphire taken, exit open, thief at the door

import { makeWorld } from './world.js';
import { angleTo } from './random.js';

export function parseShot() {
  const q = new URLSearchParams(window.location.search);
  const shot = q.get('shot');
  if (!shot) return null;
  const seed = Number(q.get('seed') || '1') || 1;
  const level = Math.min(2, Math.max(0, Number(q.get('level') || '0') || 0));
  return { shot, seed, level };
}

// Stage a world for a screenshot. Returns { world, phase }.
export function stageShot({ shot, seed, level }) {
  const world = makeWorld(level, seed);
  if (shot === 'start') {
    return { world, phase: 'title' };
  }
  if (shot === 'chase') {
    // Mid-chase drama: a guard is on the thief, the alarm is nearly full,
    // the camera has the thief in its cone. Shows the stakes in one frame.
    world.thief.x = 640;
    world.thief.y = 430;
    world.thief.angle = -Math.PI / 2;
    world.guards[0].x = 520;
    world.guards[0].y = 330;
    world.guards[0].angle = angleTo(520, 330, 640, 430);
    world.guards[0].state = 'chase';
    world.guards[0].seesThief = true;
    world.guards[0].lastSeen = { x: 640, y: 430 };
    world.guards[0].lastSeenT = world.time;
    if (world.guards[1]) {
      world.guards[1].x = 860;
      world.guards[1].y = 560;
      world.guards[1].angle = Math.PI * 0.85;
    }
    world.cameras[0].angle = world.cameras[0].base + 0.75;
    world.cameras[0].seesThief = true;
    world.spotted = true;
    world.alarm = 82;
    world.time = 52;
    world.lootTaken = 2;
    world.lootValue = 400;
    world.score = 400;
    if (world.smallLoot[0]) world.smallLoot[0].taken = true;
    if (world.smallLoot[1]) world.smallLoot[1].taken = true;
    return { world, phase: 'playing' };
  }
  if (shot === 'end') {
    world.sapphireTaken = true;
    world.sapphire.taken = true;
    world.lootTaken = 2;
    world.lootValue = 1300;
    world.score = 1300;
    world.exitOpen = true;
    world.thief.x = world.exit.x - 10;
    world.thief.y = 668;
    world.thief.angle = Math.PI / 2;
    world.alarm = 12;
    world.time = 74;
    return { world, phase: 'escaped', escapedWorld: world };
  }
  // play: mid-heist, thief creeping up the carpet toward the sapphire,
  // a guard's cone sweeping across the room, alarm part-filled.
  world.thief.x = 640;
  world.thief.y = 470;
  world.thief.angle = -Math.PI / 2;
  world.guards[0].x = 420;
  world.guards[0].y = 300;
  world.guards[0].angle = 0.35;
  world.guards[0].wp = 1;
  if (world.guards[1]) {
    world.guards[1].x = 880;
    world.guards[1].y = 540;
    world.guards[1].angle = Math.PI;
    world.guards[1].wp = 0;
  }
  world.cameras[0].angle = world.cameras[0].base + 0.55;
  world.alarm = 38;
  world.time = 41;
  world.lootTaken = 1;
  world.lootValue = 150;
  world.score = 150;
  if (world.smallLoot[0]) world.smallLoot[0].taken = true;
  return { world, phase: 'playing' };
}
