// Canvas rendering for Velvet Vault: the gallery hall, vision cones, the
// thief and guards, the loot, and the HUD (alarm meter, loot, objective).
// The room is drawn in room space (1280x720) and letterboxed to the canvas.

import { ROOM, CONE_HALF, GUARD_RANGE, CAMERA_RANGE } from './world.js';
import { view } from './input.js';

const COLORS = {
  floorA: '#221d33',
  floorB: '#1e1930',
  wall: '#3a3352',
  wallTop: '#4a4270',
  carpet: '#5a1f2e',
  carpetEdge: '#8a2f45',
  caseGlass: 'rgba(150, 200, 255, 0.16)',
  caseFrame: '#c9a227',
  pedestal: '#2e2a44',
  pedestalTop: '#3d3759',
  painting: '#7a5c2e',
  paintingArt: '#c98f4e',
  thief: '#39c6d6',
  thiefDark: '#0e7d8c',
  guard: '#e8b13c',
  guardDark: '#8a6420',
  cone: 'rgba(232, 177, 60, 0.20)',
  coneEdge: 'rgba(232, 177, 60, 0.55)',
  camCone: 'rgba(235, 70, 70, 0.16)',
  camConeEdge: 'rgba(235, 70, 70, 0.5)',
  sapphire: '#7fd4ff',
  gem: '#ffd76a',
  exit: '#3ddc84',
  text: '#efeaf6',
  muted: '#9a92b5',
  danger: '#ff5a5a',
};

function fitCanvas(canvas) {
  const dpr = Math.min(window.devicePixelRatio || 1, 2);
  const w = canvas.clientWidth;
  const h = canvas.clientHeight;
  if (canvas.width !== Math.round(w * dpr) || canvas.height !== Math.round(h * dpr)) {
    canvas.width = Math.round(w * dpr);
    canvas.height = Math.round(h * dpr);
  }
  const ctx = canvas.getContext('2d');
  ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
  const scale = Math.min(w / ROOM.w, h / ROOM.h);
  const ox = (w - ROOM.w * scale) / 2;
  const oy = (h - ROOM.h * scale) / 2;
  view.scale = scale;
  view.ox = ox;
  view.oy = oy;
  return { ctx, w, h, scale, ox, oy };
}

function drawCone(ctx, x, y, angle, range, fill, edge) {
  ctx.beginPath();
  ctx.moveTo(x, y);
  ctx.arc(x, y, range, angle - CONE_HALF, angle + CONE_HALF);
  ctx.closePath();
  ctx.fillStyle = fill;
  ctx.fill();
  ctx.strokeStyle = edge;
  ctx.lineWidth = 1.5;
  ctx.stroke();
}

function drawPerson(ctx, x, y, angle, r, body, dark, facing) {
  // Shadow.
  ctx.beginPath();
  ctx.ellipse(x, y + r * 0.75, r * 0.95, r * 0.4, 0, 0, Math.PI * 2);
  ctx.fillStyle = 'rgba(0, 0, 0, 0.35)';
  ctx.fill();
  // Body.
  ctx.beginPath();
  ctx.arc(x, y, r, 0, Math.PI * 2);
  ctx.fillStyle = body;
  ctx.fill();
  ctx.lineWidth = 2;
  ctx.strokeStyle = dark;
  ctx.stroke();
  // Facing tick: a small nose / flashlight direction.
  const fx = x + Math.cos(angle) * r;
  const fy = y + Math.sin(angle) * r;
  ctx.beginPath();
  ctx.arc(fx, fy, r * 0.34, 0, Math.PI * 2);
  ctx.fillStyle = facing;
  ctx.fill();
}

function drawRoom(ctx, world) {
  const w = ROOM.wall;
  // Floor tiles.
  for (let ty = 0; ty < 9; ty++) {
    for (let tx = 0; tx < 16; tx++) {
      ctx.fillStyle = (tx + ty) % 2 === 0 ? COLORS.floorA : COLORS.floorB;
      ctx.fillRect(w + tx * 80, w + ty * 80, 80, 80);
    }
  }
  // Velvet carpet down the middle.
  ctx.fillStyle = COLORS.carpet;
  ctx.fillRect(560, w, 160, ROOM.h - w * 2);
  ctx.fillStyle = COLORS.carpetEdge;
  ctx.fillRect(556, w, 4, ROOM.h - w * 2);
  ctx.fillRect(720, w, 4, ROOM.h - w * 2);

  // Walls.
  ctx.fillStyle = COLORS.wall;
  ctx.fillRect(0, 0, ROOM.w, w);
  ctx.fillRect(0, ROOM.h - w, ROOM.w, w);
  ctx.fillRect(0, 0, w, ROOM.h);
  ctx.fillRect(ROOM.w - w, 0, w, ROOM.h);
  ctx.fillStyle = COLORS.wallTop;
  ctx.fillRect(0, w - 5, ROOM.w, 5);
  ctx.fillRect(0, ROOM.h - w, ROOM.w, 5);
  ctx.fillRect(w - 5, 0, 5, ROOM.h);
  ctx.fillRect(ROOM.w - w, 0, 5, ROOM.h);

  // Paintings on the north wall.
  const paintings = [180, 420, 860, 1100];
  for (const px of paintings) {
    ctx.fillStyle = COLORS.painting;
    ctx.fillRect(px - 42, 8, 84, 16);
    ctx.fillStyle = COLORS.paintingArt;
    ctx.fillRect(px - 36, 11, 72, 10);
  }

  // Exit door on the south wall.
  const ex = world.exit;
  ctx.fillStyle = world.exitOpen ? COLORS.exit : '#55506e';
  ctx.fillRect(ex.x - ex.w / 2, ROOM.h - w, ex.w, w);
  ctx.fillStyle = '#0b0a12';
  ctx.font = 'bold 13px system-ui, sans-serif';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillText(world.exitOpen ? 'EXIT — GO!' : 'EXIT · LOCKED', ex.x, ROOM.h - w / 2 + 1);

  // Obstacles: display cases and pedestals.
  for (const o of world.obstacles) {
    if (o.kind === 'case') {
      ctx.fillStyle = '#241f38';
      ctx.fillRect(o.x, o.y, o.w, o.h);
      ctx.fillStyle = COLORS.caseGlass;
      ctx.fillRect(o.x + 4, o.y + 4, o.w - 8, o.h - 8);
      ctx.strokeStyle = COLORS.caseFrame;
      ctx.lineWidth = 3;
      ctx.strokeRect(o.x + 2, o.y + 2, o.w - 4, o.h - 4);
      ctx.beginPath();
      ctx.moveTo(o.x + 4, o.y + 4);
      ctx.lineTo(o.x + o.w - 4, o.y + o.h - 4);
      ctx.strokeStyle = 'rgba(255,255,255,0.12)';
      ctx.lineWidth = 1;
      ctx.stroke();
    } else {
      ctx.fillStyle = COLORS.pedestal;
      ctx.fillRect(o.x, o.y, o.w, o.h);
      ctx.fillStyle = COLORS.pedestalTop;
      ctx.fillRect(o.x + 5, o.y + 5, o.w - 10, o.h - 10);
      ctx.strokeStyle = '#57507a';
      ctx.lineWidth = 2;
      ctx.strokeRect(o.x + 1, o.y + 1, o.w - 2, o.h - 2);
    }
  }
}

function drawLoot(ctx, world) {
  for (const loot of world.smallLoot) {
    if (loot.taken) continue;
    const bob = Math.sin(world.time * 3 + loot.x) * 2;
    ctx.beginPath();
    ctx.arc(loot.x, loot.y + bob, 10, 0, Math.PI * 2);
    ctx.fillStyle = COLORS.gem;
    ctx.fill();
    ctx.lineWidth = 2;
    ctx.strokeStyle = '#8a6420';
    ctx.stroke();
    ctx.beginPath();
    ctx.arc(loot.x - 3, loot.y + bob - 3, 3, 0, Math.PI * 2);
    ctx.fillStyle = 'rgba(255,255,255,0.75)';
    ctx.fill();
  }

  // The Star Sapphire in its glass case, north wall.
  const sap = world.sapphire;
  const cx = sap.x;
  const cy = sap.y;
  ctx.fillStyle = '#241f38';
  ctx.fillRect(cx - 34, cy - 26, 68, 52);
  ctx.fillStyle = COLORS.caseGlass;
  ctx.fillRect(cx - 30, cy - 22, 60, 44);
  ctx.strokeStyle = COLORS.caseFrame;
  ctx.lineWidth = 2.5;
  ctx.strokeRect(cx - 32, cy - 24, 64, 48);
  if (!sap.taken) {
    const pulse = 1 + Math.sin(world.time * 4) * 0.12;
    ctx.save();
    ctx.translate(cx, cy);
    ctx.scale(pulse, pulse);
    ctx.rotate(Math.PI / 4);
    ctx.fillStyle = COLORS.sapphire;
    ctx.fillRect(-11, -11, 22, 22);
    ctx.fillStyle = 'rgba(255,255,255,0.85)';
    ctx.fillRect(-11, -11, 22, 6);
    ctx.restore();
    ctx.beginPath();
    ctx.arc(cx, cy, 24 + Math.sin(world.time * 4) * 3, 0, Math.PI * 2);
    ctx.strokeStyle = 'rgba(127, 212, 255, 0.5)';
    ctx.lineWidth = 1.5;
    ctx.stroke();
    // Crack progress ring.
    if (world.sapphireCrack > 0) {
      ctx.beginPath();
      ctx.arc(cx, cy, 32, -Math.PI / 2, -Math.PI / 2 + Math.PI * 2 * world.sapphireCrack);
      ctx.strokeStyle = '#ffd76a';
      ctx.lineWidth = 4;
      ctx.stroke();
    }
  }
}

function drawWatchers(ctx, world) {
  // Camera cones first (under guards), then guard cones.
  for (const cam of world.cameras) {
    drawCone(ctx, cam.x, cam.y, cam.angle, CAMERA_RANGE, COLORS.camCone, COLORS.camConeEdge);
  }
  for (const g of world.guards) {
    const fill = g.state === 'chase' ? 'rgba(235, 70, 70, 0.28)' : COLORS.cone;
    const edge = g.state === 'chase' ? 'rgba(235, 70, 70, 0.7)' : COLORS.coneEdge;
    drawCone(ctx, g.x, g.y, g.angle, GUARD_RANGE, fill, edge);
  }
  // Cameras on the wall.
  for (const cam of world.cameras) {
    ctx.save();
    ctx.translate(cam.x, cam.y);
    ctx.rotate(cam.angle);
    ctx.fillStyle = '#1a1626';
    ctx.fillRect(-6, -8, 18, 16);
    ctx.fillStyle = cam.seesThief ? COLORS.danger : '#ff8a8a';
    ctx.beginPath();
    ctx.arc(12, 0, 4, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();
  }
  // Guards.
  for (const g of world.guards) {
    drawPerson(ctx, g.x, g.y, g.angle, 15, COLORS.guard, COLORS.guardDark, '#fff2c9');
    if (g.state !== 'patrol') {
      ctx.font = 'bold 16px system-ui, sans-serif';
      ctx.textAlign = 'center';
      ctx.fillStyle = g.state === 'chase' ? COLORS.danger : '#ffd76a';
      ctx.fillText(g.state === 'chase' ? '!' : '?', g.x, g.y - 22);
    }
  }
}

function drawThief(ctx, world) {
  const t = world.thief;
  // Noise ring while sprinting.
  if (t.sprinting) {
    ctx.beginPath();
    ctx.arc(t.x, t.y, 26 + Math.sin(world.time * 10) * 3, 0, Math.PI * 2);
    ctx.strokeStyle = 'rgba(255, 215, 106, 0.5)';
    ctx.lineWidth = 1.5;
    ctx.stroke();
  }
  drawPerson(ctx, t.x, t.y, t.angle, t.r, COLORS.thief, COLORS.thiefDark, '#0b0a12');
  // Little mask band.
  ctx.beginPath();
  ctx.arc(t.x, t.y, t.r * 0.62, 0, Math.PI * 2);
  ctx.strokeStyle = '#0b0a12';
  ctx.lineWidth = 3;
  ctx.stroke();
}

function drawHud(ctx, world, phase) {
  const w = ROOM.wall;
  // Top bar background.
  ctx.fillStyle = 'rgba(8, 7, 14, 0.78)';
  ctx.fillRect(0, 0, ROOM.w, 34);
  ctx.textBaseline = 'middle';

  // Alarm meter.
  ctx.font = 'bold 13px system-ui, sans-serif';
  ctx.textAlign = 'left';
  ctx.fillStyle = world.alarm > 70 ? COLORS.danger : COLORS.text;
  ctx.fillText('ALARM', 16, 18);
  const barX = 78;
  const barW = 260;
  ctx.fillStyle = '#2a2540';
  ctx.fillRect(barX, 9, barW, 16);
  const alarmW = (barW * world.alarm) / 100;
  ctx.fillStyle = world.alarm > 70 ? COLORS.danger : world.alarm > 35 ? '#ffb13c' : '#3ddc84';
  if (alarmW > 0) ctx.fillRect(barX, 9, alarmW, 16);
  ctx.strokeStyle = 'rgba(239, 234, 246, 0.35)';
  ctx.lineWidth = 1;
  ctx.strokeRect(barX + 0.5, 9.5, barW, 16);

  // Loot and score.
  ctx.fillStyle = COLORS.text;
  ctx.textAlign = 'left';
  const lootText = `LOOT $${world.lootValue.toLocaleString()}  ·  ${world.lootTaken} item${world.lootTaken === 1 ? '' : 's'}`;
  ctx.fillText(lootText, 370, 18);
  ctx.textAlign = 'center';
  ctx.fillStyle = COLORS.muted;
  ctx.fillText(world.levelName, ROOM.w / 2 + 120, 18);
  ctx.textAlign = 'right';
  ctx.fillStyle = COLORS.text;
  const t = Math.floor(world.time);
  ctx.fillText(`${String(Math.floor(t / 60)).padStart(2, '0')}:${String(t % 60).padStart(2, '0')}`, ROOM.w - 16, 18);

  // Objective line under the bar.
  ctx.textAlign = 'center';
  ctx.font = '13px system-ui, sans-serif';
  ctx.fillStyle = COLORS.muted;
  const objective = world.sapphireTaken
    ? 'Sapphire secured — reach the green EXIT door!'
    : 'Steal the Star Sapphire from the glass case, then escape.';
  ctx.fillText(objective, ROOM.w / 2, 52);

  // Toast message.
  if (world.messageT > 0 && world.message) {
    ctx.font = 'bold 15px system-ui, sans-serif';
    ctx.fillStyle = 'rgba(8, 7, 14, 0.8)';
    const tw = ctx.measureText(world.message).width + 28;
    ctx.fillRect(ROOM.w / 2 - tw / 2, 66, tw, 28);
    ctx.fillStyle = '#ffd76a';
    ctx.fillText(world.message, ROOM.w / 2, 81);
  }

  // Spotted warning.
  if (world.spotted && phase === 'playing') {
    ctx.font = 'bold 15px system-ui, sans-serif';
    ctx.fillStyle = COLORS.danger;
    ctx.textAlign = 'center';
    ctx.fillText('SPOTTED — break line of sight!', ROOM.w / 2, ROOM.h - 44);
  }
}

function overlay(ctx, title, lines, accent, prompt) {
  ctx.fillStyle = 'rgba(8, 7, 14, 0.72)';
  ctx.fillRect(0, 0, ROOM.w, ROOM.h);
  ctx.textAlign = 'center';
  ctx.fillStyle = accent || COLORS.text;
  ctx.font = 'bold 52px system-ui, sans-serif';
  ctx.fillText(title, ROOM.w / 2, ROOM.h / 2 - 90);
  ctx.font = '17px system-ui, sans-serif';
  ctx.fillStyle = COLORS.text;
  lines.forEach((line, i) => {
    ctx.fillText(line, ROOM.w / 2, ROOM.h / 2 - 40 + i * 28);
  });
  ctx.font = 'bold 15px system-ui, sans-serif';
  ctx.fillStyle = COLORS.muted;
  ctx.fillText(prompt || 'Press Enter or click to begin', ROOM.w / 2, ROOM.h / 2 + 110);
}

export function render(canvas, world, phase, extra) {
  const { ctx, w, h, scale, ox, oy } = fitCanvas(canvas);
  ctx.clearRect(0, 0, w, h);
  ctx.fillStyle = '#0b0a12';
  ctx.fillRect(0, 0, w, h);
  ctx.save();
  ctx.translate(ox, oy);
  ctx.scale(scale, scale);

  drawRoom(ctx, world);
  drawLoot(ctx, world);
  drawWatchers(ctx, world);
  drawThief(ctx, world);
  drawHud(ctx, world, phase);

  if (phase === 'title') {
    overlay(ctx, 'VELVET VAULT', [
      'One room. Two guards. One very shiny sapphire.',
      'Slip past the vision cones, dodge the cameras,',
      'crack the case, and walk out the south door.',
      '',
      'WASD / arrows to move · Shift to sprint (loud!) · R to restart',
    ], '#ffd76a');
  } else if (phase === 'caught') {
    overlay(ctx, 'CAUGHT!', [
      world.catchReason,
      `Loot kept: $${world.lootValue.toLocaleString()} · Time: ${Math.floor(world.time)}s`,
      '',
      'Press R to try the hall again.',
    ], COLORS.danger, 'Press R to retry this hall');
  } else if (phase === 'escaped') {
    overlay(ctx, 'CLEAN GETAWAY!', [
      `You slipped out with $${world.lootValue.toLocaleString()} of loot.`,
      `Time bonus: $${world.timeBonus || 0} · Total score: $${world.score.toLocaleString()}`,
      '',
      'Press N for the next hall, or R to replay this one.',
    ], COLORS.exit, 'Press N for the next hall · R to replay');
  } else if (phase === 'done') {
    overlay(ctx, 'THE VAULT IS EMPTY', [
      'You cleared every hall of the Meridian Gallery.',
      `Final score: $${world.score.toLocaleString()}`,
      '',
      'Press R to run it all again.',
    ], COLORS.exit, 'Press R to run it all again');
  }

  ctx.restore();
  if (extra && extra.afterFrame) extra.afterFrame(ctx, scale, ox, oy);
}
