// Velvet Vault world: one gallery hall per level, the thief, patrolling
// guards with vision cones, sweeping wall cameras, loot, and the alarm meter.
// All coordinates are in room space: 1280 x 720, walls 28 thick.

import { clamp, dist, angleTo, angleDiff, turnToward, makeRng, range } from './random.js';

export const ROOM = { w: 1280, h: 720, wall: 28 };

const GUARD_SPEED = 62;
const GUARD_CHASE_SPEED = 118;
const THIEF_SPEED = 168;
const THIEF_SPRINT = 238;
const CAMERA_RANGE = 260;
const GUARD_RANGE = 235;
const CONE_HALF = 0.62; // ~35 degrees each side

// Level layouts: pedestals and display cases are cover (block movement and
// line of sight). Each level adds a guard or a camera and moves the loot.
export function levelDefs() {
  return [
    {
      name: 'Hall One — The Meridian Gallery',
      guards: [
        { path: [[300, 200], [980, 200], [980, 520], [300, 520]], speed: GUARD_SPEED },
        { path: [[640, 280], [640, 580]], speed: GUARD_SPEED + 8 },
      ],
      cameras: [
        { x: 640, y: 44, base: Math.PI / 2, sweep: 0.65, speed: 0.45 },
      ],
      smallLoot: [
        { x: 180, y: 160, kind: 'gem', value: 150, label: 'Moon Opal' },
        { x: 1100, y: 580, kind: 'gem', value: 150, label: 'Ember Ruby' },
      ],
      obstacles: [
        { x: 420, y: 300, w: 90, h: 120, kind: 'case' },
        { x: 770, y: 300, w: 90, h: 120, kind: 'case' },
        { x: 180, y: 380, w: 70, h: 70, kind: 'pedestal' },
        { x: 1030, y: 270, w: 70, h: 70, kind: 'pedestal' },
      ],
      sapphire: { x: 640, y: 130 },
      thiefStart: { x: 640, y: 660 },
      exit: { x: 640, y: 706, w: 130 },
    },
    {
      name: 'Hall Two — The Gilded Wing',
      guards: [
        { path: [[240, 170], [1040, 170], [1040, 550], [240, 550]], speed: GUARD_SPEED + 6 },
        { path: [[640, 260], [640, 590]], speed: GUARD_SPEED + 14 },
        { path: [[420, 480], [860, 480], [860, 240], [420, 240]], speed: GUARD_SPEED },
      ],
      cameras: [
        { x: 300, y: 44, base: Math.PI / 2, sweep: 0.65, speed: 0.55 },
        { x: 980, y: 44, base: Math.PI / 2, sweep: 0.65, speed: 0.55 },
      ],
      smallLoot: [
        { x: 150, y: 150, kind: 'gem', value: 200, label: 'Moon Opal' },
        { x: 1130, y: 150, kind: 'gem', value: 200, label: 'Ember Ruby' },
        { x: 1130, y: 580, kind: 'gem', value: 250, label: 'Ivory Cameo' },
      ],
      obstacles: [
        { x: 400, y: 290, w: 80, h: 130, kind: 'case' },
        { x: 800, y: 290, w: 80, h: 130, kind: 'case' },
        { x: 200, y: 400, w: 70, h: 70, kind: 'pedestal' },
        { x: 1010, y: 400, w: 70, h: 70, kind: 'pedestal' },
        { x: 605, y: 330, w: 70, h: 90, kind: 'pedestal' },
      ],
      sapphire: { x: 640, y: 120 },
      thiefStart: { x: 640, y: 660 },
      exit: { x: 640, y: 706, w: 130 },
    },
    {
      name: 'Hall Three — The Vault of Echoes',
      guards: [
        { path: [[200, 150], [1080, 150], [1080, 570], [200, 570]], speed: GUARD_SPEED + 12 },
        { path: [[640, 250], [640, 600]], speed: GUARD_SPEED + 20 },
        { path: [[360, 500], [920, 500], [920, 220], [360, 220]], speed: GUARD_SPEED + 6 },
        { path: [[200, 360], [1080, 360]], speed: GUARD_SPEED + 16 },
      ],
      cameras: [
        { x: 240, y: 44, base: Math.PI / 2, sweep: 0.7, speed: 0.65 },
        { x: 640, y: 44, base: Math.PI / 2, sweep: 0.6, speed: 0.7 },
        { x: 1040, y: 44, base: Math.PI / 2, sweep: 0.7, speed: 0.65 },
      ],
      smallLoot: [
        { x: 140, y: 140, kind: 'gem', value: 250, label: 'Moon Opal' },
        { x: 1140, y: 140, kind: 'gem', value: 250, label: 'Ember Ruby' },
        { x: 140, y: 590, kind: 'gem', value: 300, label: 'Ivory Cameo' },
        { x: 1140, y: 590, kind: 'gem', value: 300, label: 'Black Pearl' },
      ],
      obstacles: [
        { x: 380, y: 280, w: 80, h: 130, kind: 'case' },
        { x: 820, y: 280, w: 80, h: 130, kind: 'case' },
        { x: 200, y: 400, w: 70, h: 70, kind: 'pedestal' },
        { x: 1010, y: 400, w: 70, h: 70, kind: 'pedestal' },
        { x: 605, y: 320, w: 70, h: 100, kind: 'pedestal' },
        { x: 480, y: 520, w: 90, h: 60, kind: 'case' },
        { x: 710, y: 520, w: 90, h: 60, kind: 'case' },
      ],
      sapphire: { x: 640, y: 110 },
      thiefStart: { x: 640, y: 660 },
      exit: { x: 640, y: 706, w: 130 },
    },
  ];
}

export function makeWorld(levelIndex, seed) {
  const def = levelDefs()[levelIndex];
  const rng = makeRng(seed * 7919 + levelIndex * 131 + 7);
  const world = {
    levelIndex,
    levelName: def.name,
    seed,
    time: 0,
    alarm: 0,
    score: 0,
    lootTaken: 0,
    lootValue: 0,
    sapphireTaken: false,
    sapphireCrack: 0, // 0..1 progress while standing at the case
    exitOpen: false,
    caught: false,
    escaped: false,
    catchReason: '',
    spotted: false, // any watcher sees the thief this frame
    noise: 0, // 0..1, sprinting makes noise guards can hear
    message: '',
    messageT: 0,
    obstacles: def.obstacles.map((o) => ({ ...o })),
    exit: { ...def.exit },
    sapphire: { ...def.sapphire, taken: false },
    smallLoot: def.smallLoot.map((l) => ({ ...l, taken: false })),
    thief: {
      x: def.thiefStart.x,
      y: def.thiefStart.y,
      r: 15,
      angle: -Math.PI / 2,
      moving: false,
      sprinting: false,
    },
    guards: def.guards.map((g) => ({
      path: g.path,
      wp: 0,
      x: g.path[0][0],
      y: g.path[0][1],
      angle: 0,
      speed: g.speed,
      state: 'patrol', // patrol | suspicious | chase
      lastSeen: null,
      lastSeenT: 0,
      pauseT: 0,
      seesThief: false,
    })),
    cameras: def.cameras.map((c) => ({
      ...c,
      angle: c.base,
      phase: rng() * Math.PI * 2,
      seesThief: false,
    })),
  };
  // Face each guard along its first patrol leg.
  for (const g of world.guards) {
    const nxt = g.path[1 % g.path.length];
    g.angle = angleTo(g.x, g.y, nxt[0], nxt[1]);
  }
  return world;
}

// --- collision helpers -------------------------------------------------

function circleHitsRect(cx, cy, r, rect) {
  const nx = clamp(cx, rect.x, rect.x + rect.w);
  const ny = clamp(cy, rect.y, rect.y + rect.h);
  const dx = cx - nx;
  const dy = cy - ny;
  return dx * dx + dy * dy < r * r;
}

function segmentHitsRect(x1, y1, x2, y2, rect) {
  // Slab test: does the segment cross the rectangle?
  const dx = x2 - x1;
  const dy = y2 - y1;
  let tMin = 0;
  let tMax = 1;
  for (const [p, d, lo, hi] of [
    [x1, dx, rect.x, rect.x + rect.w],
    [y1, dy, rect.y, rect.y + rect.h],
  ]) {
    if (Math.abs(d) < 1e-9) {
      if (p < lo || p > hi) return false;
    } else {
      let t1 = (lo - p) / d;
      let t2 = (hi - p) / d;
      if (t1 > t2) [t1, t2] = [t2, t1];
      tMin = Math.max(tMin, t1);
      tMax = Math.min(tMax, t2);
      if (tMin > tMax) return false;
    }
  }
  return true;
}

export function lineBlocked(world, x1, y1, x2, y2) {
  for (const o of world.obstacles) {
    if (segmentHitsRect(x1, y1, x2, y2, o)) return true;
  }
  return false;
}

function moveCircle(world, body, dx, dy) {
  const w = ROOM.wall;
  const nx = clamp(body.x + dx, w + body.r, ROOM.w - w - body.r);
  const ny = clamp(body.y + dy, w + body.r, ROOM.h - w - body.r);
  // X then Y so the body slides along obstacle edges.
  let okX = true;
  for (const o of world.obstacles) {
    if (circleHitsRect(nx, body.y, body.r, o)) { okX = false; break; }
  }
  if (okX) body.x = nx;
  let okY = true;
  for (const o of world.obstacles) {
    if (circleHitsRect(body.x, ny, body.r, o)) { okY = false; break; }
  }
  if (okY) body.y = ny;
}

// --- vision ------------------------------------------------------------

function canSee(world, wx, wy, angle, range, tx, ty) {
  const d = dist(wx, wy, tx, ty);
  if (d > range) return false;
  if (Math.abs(angleDiff(angleTo(wx, wy, tx, ty), angle)) > CONE_HALF) return false;
  if (lineBlocked(world, wx, wy, tx, ty)) return false;
  return true;
}

// --- update ------------------------------------------------------------

export function updateWorld(world, input, dt) {
  if (world.caught || world.escaped) return;
  world.time += dt;
  if (world.messageT > 0) world.messageT -= dt;

  const thief = world.thief;
  // Movement: keyboard vector, or click-to-move target.
  let mx = 0;
  let my = 0;
  if (input.left) mx -= 1;
  if (input.right) mx += 1;
  if (input.up) my -= 1;
  if (input.down) my += 1;
  if (mx === 0 && my === 0 && input.moveTarget) {
    const d = dist(thief.x, thief.y, input.moveTarget.x, input.moveTarget.y);
    if (d > 8) {
      mx = (input.moveTarget.x - thief.x) / d;
      my = (input.moveTarget.y - thief.y) / d;
    } else {
      input.moveTarget = null;
    }
  }
  const mag = Math.hypot(mx, my);
  thief.moving = mag > 0.01;
  thief.sprinting = !!input.sprint && thief.moving;
  if (thief.moving) {
    const speed = thief.sprinting ? THIEF_SPRINT : THIEF_SPEED;
    const nx = (mx / (mag || 1)) * speed * dt;
    const ny = (my / (mag || 1)) * speed * dt;
    moveCircle(world, thief, nx, ny);
    thief.angle = angleTo(0, 0, mx, my);
  }
  world.noise = thief.sprinting ? 1 : Math.max(0, world.noise - dt * 2);

  // Cameras sweep.
  for (const cam of world.cameras) {
    cam.angle = cam.base + Math.sin(world.time * cam.speed + cam.phase) * cam.sweep;
    cam.seesThief = canSee(world, cam.x, cam.y, cam.angle, CAMERA_RANGE, thief.x, thief.y);
  }

  // Guards patrol, get suspicious, chase.
  let anySees = false;
  for (const g of world.guards) {
    g.seesThief = canSee(world, g.x, g.y, g.angle, GUARD_RANGE, thief.x, thief.y);
    if (g.seesThief) {
      anySees = true;
      g.lastSeen = { x: thief.x, y: thief.y };
      g.lastSeenT = world.time;
      g.state = 'chase';
    }
    // Sprinting close by is heard even out of sight.
    if (world.noise > 0.5 && dist(g.x, g.y, thief.x, thief.y) < 150 && !g.seesThief) {
      if (g.state === 'patrol') {
        g.state = 'suspicious';
        g.lastSeen = { x: thief.x, y: thief.y };
        g.lastSeenT = world.time;
      }
    }

    if (g.state === 'chase') {
      const target = g.lastSeen || { x: thief.x, y: thief.y };
      const d = dist(g.x, g.y, target.x, target.y);
      if (d > 10) {
        const a = angleTo(g.x, g.y, target.x, target.y);
        g.angle = turnToward(g.angle, a, dt * 5);
        moveCircle(world, g, Math.cos(a) * GUARD_CHASE_SPEED * dt, Math.sin(a) * GUARD_CHASE_SPEED * dt);
      }
      if (world.time - g.lastSeenT > 2.5) g.state = 'suspicious';
      if (dist(g.x, g.y, thief.x, thief.y) < 30) {
        world.caught = true;
        world.catchReason = 'A guard caught you in the open.';
        return;
      }
    } else if (g.state === 'suspicious') {
      const target = g.lastSeen;
      if (target) {
        const d = dist(g.x, g.y, target.x, target.y);
        if (d > 14) {
          const a = angleTo(g.x, g.y, target.x, target.y);
          g.angle = turnToward(g.angle, a, dt * 4);
          moveCircle(world, g, Math.cos(a) * GUARD_SPEED * 1.25 * dt, Math.sin(a) * GUARD_SPEED * 1.25 * dt);
        } else {
          g.pauseT += dt;
          g.angle += dt * 1.8; // look around
          if (g.pauseT > 1.6) {
            g.state = 'patrol';
            g.pauseT = 0;
            g.lastSeen = null;
          }
        }
      } else {
        g.state = 'patrol';
      }
    } else {
      // Patrol: walk the waypoints, pausing briefly at each one.
      if (g.pauseT > 0) {
        g.pauseT -= dt;
      } else {
        const wp = g.path[g.wp];
        const d = dist(g.x, g.y, wp[0], wp[1]);
        if (d < 8) {
          g.wp = (g.wp + 1) % g.path.length;
          g.pauseT = 0.7;
        } else {
          const a = angleTo(g.x, g.y, wp[0], wp[1]);
          g.angle = turnToward(g.angle, a, dt * 4);
          moveCircle(world, g, Math.cos(a) * g.speed * dt, Math.sin(a) * g.speed * dt);
        }
      }
    }
  }

  const cameraSees = world.cameras.some((c) => c.seesThief);
  world.spotted = anySees || cameraSees;

  // Alarm: fills fast while seen, faster still while a guard chases, decays
  // slowly while hidden.
  if (world.spotted) {
    const rate = anySees ? 55 : 24;
    world.alarm = clamp(world.alarm + rate * dt, 0, 100);
  } else {
    world.alarm = clamp(world.alarm - 12 * dt, 0, 100);
  }
  if (world.alarm >= 100) {
    world.caught = true;
    world.catchReason = 'The alarm hit full — the gallery locked down around you.';
    return;
  }

  // Small loot: walk over it to pocket it.
  for (const loot of world.smallLoot) {
    if (!loot.taken && dist(thief.x, thief.y, loot.x, loot.y) < 30) {
      loot.taken = true;
      world.lootTaken += 1;
      world.lootValue += loot.value;
      world.score += loot.value;
      setMessage(world, `Pocketed the ${loot.label} (+$${loot.value})`);
    }
  }

  // The Star Sapphire: stand at the case to crack it (about a second).
  const sap = world.sapphire;
  const nearSapphire = !sap.taken && dist(thief.x, thief.y, sap.x, sap.y) < 46;
  if (nearSapphire) {
    world.sapphireCrack = clamp(world.sapphireCrack + dt / 1.1, 0, 1);
    if (world.sapphireCrack >= 1) {
      sap.taken = true;
      world.sapphireTaken = true;
      world.lootTaken += 1;
      world.lootValue += 1000;
      world.score += 1000;
      world.exitOpen = true;
      setMessage(world, 'The Star Sapphire is yours — get to the exit!');
    }
  } else {
    world.sapphireCrack = clamp(world.sapphireCrack - dt / 0.6, 0, 1);
  }

  // Exit: the south door opens once the sapphire is taken.
  if (world.exitOpen && thief.y > ROOM.h - ROOM.wall - 26 &&
      Math.abs(thief.x - world.exit.x) < world.exit.w / 2) {
    world.escaped = true;
    const timeBonus = Math.max(0, Math.round(600 - world.time * 2));
    world.score += timeBonus;
    world.timeBonus = timeBonus;
  }
}

export function setMessage(world, text) {
  world.message = text;
  world.messageT = 2.6;
}

// --- helpers for screenshots / HUD --------------------------------------

export function watchersSeeing(world) {
  return {
    guards: world.guards.filter((g) => g.seesThief).length,
    cameras: world.cameras.filter((c) => c.seesThief).length,
  };
}

export { GUARD_RANGE, CAMERA_RANGE, CONE_HALF };
