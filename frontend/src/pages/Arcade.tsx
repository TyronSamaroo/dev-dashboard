import { useEffect, useMemo, useRef, useState } from "react";
import { Link } from "react-router-dom";
import {
  ArrowLeft,
  ArrowRight,
  Maximize2,
  Pause,
  Play,
  RotateCcw,
  Sparkles,
  Zap,
} from "lucide-react";

declare global {
  interface Window {
    advanceTime?: (ms: number) => Promise<void>;
    render_game_to_text?: () => string;
  }
}

const GAME_TITLE = "Neon Skyline Rush";
const STORAGE_KEY = "dd_arcade_best_score";
const LOGICAL_WIDTH = 420;
const LOGICAL_HEIGHT = 720;
const TRACK_TOP_Y = 148;
const PLAYER_Y = 606;
const PLAYER_RADIUS = 26;
const FRAME_MS = 1000 / 60;
const TOP_LANE_X = [168, 210, 252];
const BOTTOM_LANE_X = [106, 210, 314];

type Mode = "menu" | "playing" | "paused" | "gameover";
type EntityType = "orb" | "barrier";

interface Entity {
  id: number;
  type: EntityType;
  lane: number;
  y: number;
  speedScale: number;
  radius: number;
}

interface Particle {
  x: number;
  y: number;
  vx: number;
  vy: number;
  size: number;
  hue: number;
  alpha: number;
  life: number;
  maxLife: number;
}

interface GameState {
  mode: Mode;
  seed: number;
  run: number;
  playerLane: number;
  playerX: number;
  moveGlow: number;
  dashTimer: number;
  score: number;
  scoreFloat: number;
  combo: number;
  shields: number;
  energy: number;
  distance: number;
  speed: number;
  spawnTimer: number;
  particles: Particle[];
  entities: Entity[];
  bestScore: number;
  collectionFlash: number;
  impactShake: number;
  runTime: number;
  collected: number;
  smashed: number;
  lastAction: string;
  nextEntityId: number;
}

interface PanelState {
  mode: Mode;
  score: number;
  combo: number;
  shields: number;
  energy: number;
  distance: number;
  bestScore: number;
  canBoost: boolean;
  fullscreen: boolean;
  lastAction: string;
}

const detailSections = [
  {
    label: "How It Plays",
    title: "Read the lane, bank the combo.",
    body: "Shift across three lanes, collect bright orbs, and burst through blockers before the speed curve catches up.",
  },
  {
    label: "Controls",
    title: "Fast on keyboard, clean on touch.",
    body: "Use left and right to drift lanes, hit space for a surge dash, or tap the large control rail under the canvas on mobile.",
  },
  {
    label: "Why It Sticks",
    title: "Short loops, immediate reruns.",
    body: "Each run ramps quickly, saves your best score locally, and stays readable enough for a first-time visitor to jump in immediately.",
  },
] as const;

const heroFacts = [
  { label: "Built For", value: "mobile + desktop" },
  { label: "Loop Length", value: "30-90 sec" },
  { label: "Run Goal", value: "combo > 5x" },
] as const;

function clamp(value: number, min: number, max: number) {
  return Math.min(max, Math.max(min, value));
}

function lerp(start: number, end: number, amount: number) {
  return start + (end - start) * amount;
}

function laneXAtY(lane: number, y: number) {
  const t = clamp((y - TRACK_TOP_Y) / (PLAYER_Y - TRACK_TOP_Y), 0, 1);
  return lerp(TOP_LANE_X[lane], BOTTOM_LANE_X[lane], t);
}

function roundRect(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  width: number,
  height: number,
  radius: number,
) {
  const r = Math.min(radius, width / 2, height / 2);
  ctx.beginPath();
  ctx.moveTo(x + r, y);
  ctx.arcTo(x + width, y, x + width, y + height, r);
  ctx.arcTo(x + width, y + height, x, y + height, r);
  ctx.arcTo(x, y + height, x, y, r);
  ctx.arcTo(x, y, x + width, y, r);
  ctx.closePath();
}

function buildPanelState(state: GameState, fullscreen: boolean): PanelState {
  return {
    mode: state.mode,
    score: state.score,
    combo: state.combo,
    shields: state.shields,
    energy: state.energy,
    distance: state.distance,
    bestScore: state.bestScore,
    canBoost: state.energy >= 50,
    fullscreen,
    lastAction: state.lastAction,
  };
}

function panelStatesMatch(a: PanelState, b: PanelState) {
  return (
    a.mode === b.mode &&
    a.score === b.score &&
    a.combo === b.combo &&
    a.shields === b.shields &&
    a.energy === b.energy &&
    a.distance === b.distance &&
    a.bestScore === b.bestScore &&
    a.canBoost === b.canBoost &&
    a.fullscreen === b.fullscreen &&
    a.lastAction === b.lastAction
  );
}

function readBestScore() {
  if (typeof window === "undefined") return 0;
  const raw = window.localStorage.getItem(STORAGE_KEY);
  const parsed = raw ? Number.parseInt(raw, 10) : 0;
  return Number.isFinite(parsed) ? parsed : 0;
}

function createState(bestScore: number, run: number): GameState {
  return {
    mode: "menu",
    seed: 1037 + run * 97,
    run,
    playerLane: 1,
    playerX: laneXAtY(1, PLAYER_Y),
    moveGlow: 0,
    dashTimer: 0,
    score: 0,
    scoreFloat: 0,
    combo: 1,
    shields: 3,
    energy: 48,
    distance: 0,
    speed: 255,
    spawnTimer: 0.9,
    particles: [],
    entities: [],
    bestScore,
    collectionFlash: 0,
    impactShake: 0,
    runTime: 0,
    collected: 0,
    smashed: 0,
    lastAction: "Tap launch or press Enter",
    nextEntityId: 1,
  };
}

function nextRandom(state: GameState) {
  state.seed = (state.seed * 1664525 + 1013904223) >>> 0;
  return state.seed / 4294967295;
}

function emitParticles(
  state: GameState,
  x: number,
  y: number,
  count: number,
  hue: number,
) {
  for (let i = 0; i < count; i += 1) {
    const angle = nextRandom(state) * Math.PI * 2;
    const speed = 70 + nextRandom(state) * 180;
    state.particles.push({
      x,
      y,
      vx: Math.cos(angle) * speed,
      vy: Math.sin(angle) * speed - 20,
      size: 2 + nextRandom(state) * 4,
      hue,
      alpha: 0.85,
      life: 0.3 + nextRandom(state) * 0.5,
      maxLife: 0.3 + nextRandom(state) * 0.5,
    });
  }
}

function saveBestScore(score: number) {
  if (typeof window === "undefined") return;
  window.localStorage.setItem(STORAGE_KEY, String(score));
}

function updateBestScore(state: GameState) {
  if (state.score <= state.bestScore) return;
  state.bestScore = state.score;
  saveBestScore(state.bestScore);
}

function drawBackdrop(ctx: CanvasRenderingContext2D, state: GameState) {
  const gradient = ctx.createLinearGradient(0, 0, 0, LOGICAL_HEIGHT);
  gradient.addColorStop(0, "#2f0d44");
  gradient.addColorStop(0.38, "#12233d");
  gradient.addColorStop(1, "#04070e");
  ctx.fillStyle = gradient;
  ctx.fillRect(0, 0, LOGICAL_WIDTH, LOGICAL_HEIGHT);

  const sun = ctx.createRadialGradient(210, 180, 20, 210, 180, 180);
  sun.addColorStop(0, "rgba(255, 214, 122, 0.92)");
  sun.addColorStop(0.4, "rgba(255, 103, 73, 0.55)");
  sun.addColorStop(1, "rgba(255, 103, 73, 0)");
  ctx.fillStyle = sun;
  ctx.fillRect(0, 0, LOGICAL_WIDTH, 360);

  for (let i = 0; i < 28; i += 1) {
    const drift = (state.runTime * (7 + i * 0.7) + i * 31) % LOGICAL_HEIGHT;
    const x = (i * 41 + (i % 2 === 0 ? 18 : 0)) % LOGICAL_WIDTH;
    const alpha = 0.08 + (i % 4) * 0.025;
    ctx.fillStyle = `rgba(201, 236, 255, ${alpha})`;
    ctx.fillRect(x, drift, 2, 2);
  }

  for (let i = 0; i < 11; i += 1) {
    const towerX = 14 + i * 39;
    const towerW = 18 + (i % 3) * 8;
    const towerH = 92 + ((i * 29) % 96);
    const towerY = 252 - towerH;
    const towerGradient = ctx.createLinearGradient(towerX, towerY, towerX, 252);
    towerGradient.addColorStop(0, "rgba(11, 18, 34, 0.15)");
    towerGradient.addColorStop(1, "rgba(4, 7, 14, 0.75)");
    ctx.fillStyle = towerGradient;
    ctx.fillRect(towerX, towerY, towerW, towerH);

    const windowCount = Math.floor(towerH / 18);
    for (let row = 0; row < windowCount; row += 1) {
      if ((row + i) % 2 === 0) {
        ctx.fillStyle = "rgba(255, 210, 132, 0.22)";
        ctx.fillRect(towerX + 4, towerY + 8 + row * 14, 3, 6);
        ctx.fillRect(towerX + towerW - 7, towerY + 8 + row * 14, 3, 6);
      }
    }
  }

  ctx.save();
  ctx.globalAlpha = 0.14 + state.collectionFlash * 0.4;
  ctx.fillStyle = "#7dd3fc";
  ctx.fillRect(0, 0, LOGICAL_WIDTH, LOGICAL_HEIGHT);
  ctx.restore();
}

function drawTrack(ctx: CanvasRenderingContext2D, state: GameState) {
  const baseGradient = ctx.createLinearGradient(0, TRACK_TOP_Y, 0, LOGICAL_HEIGHT);
  baseGradient.addColorStop(0, "rgba(10, 15, 28, 0.25)");
  baseGradient.addColorStop(1, "rgba(3, 6, 14, 0.98)");

  ctx.beginPath();
  ctx.moveTo(144, TRACK_TOP_Y);
  ctx.lineTo(276, TRACK_TOP_Y);
  ctx.lineTo(392, LOGICAL_HEIGHT);
  ctx.lineTo(28, LOGICAL_HEIGHT);
  ctx.closePath();
  ctx.fillStyle = baseGradient;
  ctx.fill();

  ctx.strokeStyle = "rgba(98, 232, 255, 0.45)";
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.moveTo(144, TRACK_TOP_Y);
  ctx.lineTo(28, LOGICAL_HEIGHT);
  ctx.moveTo(276, TRACK_TOP_Y);
  ctx.lineTo(392, LOGICAL_HEIGHT);
  ctx.stroke();

  ctx.strokeStyle = "rgba(255, 255, 255, 0.15)";
  ctx.lineWidth = 1.5;
  for (let lane = 0; lane < 2; lane += 1) {
    ctx.beginPath();
    ctx.moveTo(lerp(144, 28, (lane + 1) / 3), TRACK_TOP_Y);
    ctx.lineTo(lerp(276, 392, (lane + 1) / 3), LOGICAL_HEIGHT);
    ctx.stroke();
  }

  const speedOffset = (state.distance * 0.016) % 1;
  for (let i = 0; i < 14; i += 1) {
    const depth = (i / 14 + speedOffset) % 1;
    const eased = depth * depth;
    const y = lerp(TRACK_TOP_Y + 12, LOGICAL_HEIGHT, eased);
    const width = lerp(128, 356, eased);
    const alpha = 0.05 + eased * 0.24;
    ctx.strokeStyle = `rgba(103, 232, 249, ${alpha})`;
    ctx.lineWidth = 1 + eased * 3;
    ctx.beginPath();
    ctx.moveTo(210 - width / 2, y);
    ctx.lineTo(210 + width / 2, y);
    ctx.stroke();
  }

  ctx.save();
  ctx.globalCompositeOperation = "screen";
  const railGlow = ctx.createLinearGradient(0, TRACK_TOP_Y, 0, LOGICAL_HEIGHT);
  railGlow.addColorStop(0, "rgba(45, 212, 191, 0.18)");
  railGlow.addColorStop(1, "rgba(56, 189, 248, 0)");
  ctx.strokeStyle = railGlow;
  ctx.lineWidth = 18;
  ctx.beginPath();
  ctx.moveTo(82, LOGICAL_HEIGHT);
  ctx.lineTo(170, TRACK_TOP_Y + 20);
  ctx.moveTo(338, LOGICAL_HEIGHT);
  ctx.lineTo(250, TRACK_TOP_Y + 20);
  ctx.stroke();
  ctx.restore();
}

function drawEntity(ctx: CanvasRenderingContext2D, entity: Entity) {
  const t = clamp((entity.y - TRACK_TOP_Y) / (PLAYER_Y - TRACK_TOP_Y), 0, 1);
  const x = laneXAtY(entity.lane, entity.y);
  const size = lerp(entity.radius * 0.75, entity.radius * 1.35, t);

  if (entity.type === "orb") {
    const glow = ctx.createRadialGradient(x, entity.y, 2, x, entity.y, size * 2.2);
    glow.addColorStop(0, "rgba(255, 252, 206, 0.98)");
    glow.addColorStop(0.22, "rgba(125, 211, 252, 0.95)");
    glow.addColorStop(1, "rgba(125, 211, 252, 0)");
    ctx.fillStyle = glow;
    ctx.beginPath();
    ctx.arc(x, entity.y, size * 2.2, 0, Math.PI * 2);
    ctx.fill();

    ctx.fillStyle = "#fef08a";
    ctx.beginPath();
    ctx.arc(x, entity.y, size * 0.75, 0, Math.PI * 2);
    ctx.fill();
    return;
  }

  ctx.save();
  ctx.translate(x, entity.y);
  const barrierGlow = ctx.createLinearGradient(0, -size, 0, size);
  barrierGlow.addColorStop(0, "rgba(248, 113, 113, 0.95)");
  barrierGlow.addColorStop(1, "rgba(244, 114, 182, 0.78)");
  roundRect(ctx, -size * 1.05, -size * 0.62, size * 2.1, size * 1.24, 12);
  ctx.fillStyle = barrierGlow;
  ctx.fill();
  ctx.lineWidth = 2;
  ctx.strokeStyle = "rgba(255, 255, 255, 0.28)";
  ctx.stroke();
  ctx.restore();
}

function drawParticles(ctx: CanvasRenderingContext2D, particles: Particle[]) {
  for (const particle of particles) {
    const life = clamp(particle.life / particle.maxLife, 0, 1);
    ctx.fillStyle = `hsla(${particle.hue} 100% 70% / ${particle.alpha * life})`;
    ctx.beginPath();
    ctx.arc(particle.x, particle.y, particle.size * life, 0, Math.PI * 2);
    ctx.fill();
  }
}

function drawPlayer(ctx: CanvasRenderingContext2D, state: GameState) {
  ctx.save();
  ctx.translate(state.playerX, PLAYER_Y);

  const dashIntensity = state.dashTimer > 0 ? 1 : 0;
  const glow = ctx.createRadialGradient(0, 0, 10, 0, 0, 70);
  glow.addColorStop(0, dashIntensity ? "rgba(255, 242, 144, 0.92)" : "rgba(99, 102, 241, 0.75)");
  glow.addColorStop(1, "rgba(99, 102, 241, 0)");
  ctx.fillStyle = glow;
  ctx.beginPath();
  ctx.arc(0, 0, 70 + dashIntensity * 20, 0, Math.PI * 2);
  ctx.fill();

  ctx.fillStyle = "rgba(34, 211, 238, 0.2)";
  ctx.beginPath();
  ctx.ellipse(0, 30, 42, 12, 0, 0, Math.PI * 2);
  ctx.fill();

  ctx.rotate((state.playerLane - 1) * 0.04);
  const bodyGradient = ctx.createLinearGradient(0, -26, 0, 24);
  bodyGradient.addColorStop(0, dashIntensity ? "#fde047" : "#67e8f9");
  bodyGradient.addColorStop(1, dashIntensity ? "#f97316" : "#0f172a");
  roundRect(ctx, -32, -22, 64, 44, 18);
  ctx.fillStyle = bodyGradient;
  ctx.fill();
  ctx.lineWidth = 2;
  ctx.strokeStyle = "rgba(255, 255, 255, 0.25)";
  ctx.stroke();

  ctx.fillStyle = "#e0f2fe";
  roundRect(ctx, -18, -12, 36, 16, 10);
  ctx.fill();

  if (dashIntensity > 0) {
    ctx.strokeStyle = "rgba(254, 240, 138, 0.82)";
    ctx.lineWidth = 4;
    ctx.beginPath();
    ctx.arc(0, 0, 44 + dashIntensity * 9, 0, Math.PI * 2);
    ctx.stroke();
  }
  ctx.restore();
}

function drawHud(ctx: CanvasRenderingContext2D, state: GameState) {
  ctx.save();
  roundRect(ctx, 18, 18, 384, 72, 24);
  ctx.fillStyle = "rgba(6, 12, 24, 0.42)";
  ctx.fill();
  ctx.strokeStyle = "rgba(255, 255, 255, 0.1)";
  ctx.lineWidth = 1;
  ctx.stroke();

  ctx.fillStyle = "rgba(236, 254, 255, 0.84)";
  ctx.font = "600 13px ui-sans-serif, system-ui, sans-serif";
  ctx.fillText(`Score ${state.score}`, 36, 48);
  ctx.fillText(`Combo x${state.combo.toFixed(1)}`, 156, 48);
  ctx.fillText(`Shield ${state.shields}`, 286, 48);

  ctx.fillStyle = "rgba(148, 163, 184, 0.9)";
  ctx.font = "500 11px ui-sans-serif, system-ui, sans-serif";
  ctx.fillText(`Energy`, 36, 70);
  ctx.fillText(`Best ${state.bestScore}`, 304, 70);

  roundRect(ctx, 88, 58, 140, 10, 999);
  ctx.fillStyle = "rgba(30, 41, 59, 0.95)";
  ctx.fill();
  roundRect(ctx, 88, 58, 140 * (state.energy / 100), 10, 999);
  const meter = ctx.createLinearGradient(88, 0, 228, 0);
  meter.addColorStop(0, "#22d3ee");
  meter.addColorStop(1, state.energy >= 50 ? "#facc15" : "#38bdf8");
  ctx.fillStyle = meter;
  ctx.fill();
  ctx.restore();
}

function drawOverlay(ctx: CanvasRenderingContext2D, state: GameState) {
  if (state.mode === "playing") return;

  ctx.save();
  ctx.fillStyle = state.mode === "paused" ? "rgba(2, 6, 16, 0.42)" : "rgba(2, 6, 16, 0.64)";
  ctx.fillRect(0, 0, LOGICAL_WIDTH, LOGICAL_HEIGHT);

  ctx.fillStyle = "#e0f2fe";
  ctx.textAlign = "center";
  ctx.font = "700 30px ui-sans-serif, system-ui, sans-serif";
  ctx.fillText(
    state.mode === "gameover" ? "Run Complete" : state.mode === "paused" ? "Paused" : GAME_TITLE,
    LOGICAL_WIDTH / 2,
    212,
  );

  ctx.font = "500 14px ui-sans-serif, system-ui, sans-serif";
  ctx.fillStyle = "rgba(224, 242, 254, 0.82)";
  const subtitle =
    state.mode === "gameover"
      ? `Score ${state.score}  •  Best ${state.bestScore}`
      : state.mode === "paused"
        ? "Press P or tap launch to continue."
        : "Collect the bright orbs, dodge the blockers, and burst when the lane collapses.";
  ctx.fillText(subtitle, LOGICAL_WIDTH / 2, 244);

  const instructions =
    state.mode === "gameover"
      ? "Press Enter or Restart for another run."
      : "Arrow keys move, Space boosts, F toggles fullscreen.";
  ctx.fillStyle = "rgba(125, 211, 252, 0.95)";
  ctx.fillText(instructions, LOGICAL_WIDTH / 2, 286);
  ctx.restore();
}

function formatMode(mode: Mode) {
  if (mode === "menu") return "Ready";
  if (mode === "paused") return "Paused";
  if (mode === "gameover") return "Finished";
  return "Live";
}

function ArcadeGame() {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const shellRef = useRef<HTMLDivElement | null>(null);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const stateRef = useRef<GameState>(createState(readBestScore(), 1));
  const frameRef = useRef<number | null>(null);
  const previousTimeRef = useRef<number | null>(null);
  const panelTickRef = useRef(0);
  const fullscreenRef = useRef(false);
  const pointerStartRef = useRef<{ x: number; y: number } | null>(null);
  const [panel, setPanel] = useState<PanelState>(() =>
    buildPanelState(stateRef.current, false),
  );
  const panelRef = useRef(panel);

  const syncPanel = (force = false) => {
    const now = typeof performance === "undefined" ? 0 : performance.now();
    if (!force && now - panelTickRef.current < 90) return;
    panelTickRef.current = now;
    const next = buildPanelState(stateRef.current, fullscreenRef.current);
    if (!force && panelStatesMatch(panelRef.current, next)) return;
    panelRef.current = next;
    setPanel(next);
  };

  const renderGame = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    ctx.save();
    ctx.setTransform(1, 0, 0, 1, 0, 0);
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    ctx.restore();

    ctx.save();
    const scale = canvas.width / LOGICAL_WIDTH;
    ctx.scale(scale, scale);

    const state = stateRef.current;
    const shakeX = state.impactShake > 0 ? Math.sin(state.runTime * 95) * state.impactShake * 10 : 0;
    const shakeY = state.impactShake > 0 ? Math.cos(state.runTime * 70) * state.impactShake * 5 : 0;
    ctx.translate(shakeX, shakeY);

    drawBackdrop(ctx, state);
    drawTrack(ctx, state);
    for (const entity of state.entities) drawEntity(ctx, entity);
    drawParticles(ctx, state.particles);
    drawPlayer(ctx, state);
    drawHud(ctx, state);
    drawOverlay(ctx, state);
    ctx.restore();
  };

  const resizeCanvas = () => {
    const canvas = canvasRef.current;
    const container = containerRef.current;
    if (!canvas || !container) return;
    const bounds = container.getBoundingClientRect();
    const maxWidth = fullscreenRef.current ? Math.min(window.innerWidth - 48, 980) : 680;
    const width = Math.max(280, Math.min(bounds.width - 8, maxWidth));
    const height = width * (LOGICAL_HEIGHT / LOGICAL_WIDTH);
    canvas.width = width;
    canvas.height = height;
    canvas.style.width = `${width}px`;
    canvas.style.height = `${height}px`;
    renderGame();
  };

  const moveLane = (direction: -1 | 1) => {
    const state = stateRef.current;
    if (state.mode === "menu") {
      state.mode = "playing";
    }
    if (state.mode !== "playing") return;
    const nextLane = clamp(state.playerLane + direction, 0, 2);
    if (nextLane === state.playerLane) return;
    state.playerLane = nextLane;
    state.moveGlow = 0.22;
    state.lastAction = direction < 0 ? "Shifted left" : "Shifted right";
    emitParticles(state, state.playerX, PLAYER_Y + 12, 10, 190);
    syncPanel(true);
  };

  const launchBoost = () => {
    const state = stateRef.current;
    if (state.mode === "menu") {
      state.mode = "playing";
    }
    if (state.mode !== "playing" || state.energy < 50 || state.dashTimer > 0.12) return;
    state.energy = clamp(state.energy - 50, 0, 100);
    state.dashTimer = 0.44;
    state.collectionFlash = 0.24;
    state.lastAction = "Surge burst";
    emitParticles(state, state.playerX, PLAYER_Y - 12, 18, 46);
    syncPanel(true);
  };

  const startRun = () => {
    const previousBest = stateRef.current.bestScore;
    const nextRun = stateRef.current.run + 1;
    const next = createState(previousBest, nextRun);
    next.mode = "playing";
    next.lastAction = "Run live";
    stateRef.current = next;
    previousTimeRef.current = typeof performance === "undefined" ? 0 : performance.now();
    syncPanel(true);
    renderGame();
  };

  const togglePause = () => {
    const state = stateRef.current;
    if (state.mode === "menu") {
      startRun();
      return;
    }
    if (state.mode === "gameover") {
      startRun();
      return;
    }
    state.mode = state.mode === "paused" ? "playing" : "paused";
    state.lastAction = state.mode === "playing" ? "Run resumed" : "Run paused";
    previousTimeRef.current = typeof performance === "undefined" ? 0 : performance.now();
    syncPanel(true);
    renderGame();
  };

  const stepGame = (deltaSeconds: number) => {
    const state = stateRef.current;
    const dt = clamp(deltaSeconds, 0, 0.034);

    state.moveGlow = Math.max(0, state.moveGlow - dt);
    state.collectionFlash = Math.max(0, state.collectionFlash - dt);
    state.impactShake = Math.max(0, state.impactShake - dt * 2.8);

    for (let i = state.particles.length - 1; i >= 0; i -= 1) {
      const particle = state.particles[i];
      particle.life -= dt;
      if (particle.life <= 0) {
        state.particles.splice(i, 1);
        continue;
      }
      particle.x += particle.vx * dt;
      particle.y += particle.vy * dt;
      particle.vx *= 0.96;
      particle.vy = particle.vy * 0.97 + 36 * dt;
    }

    const targetX = laneXAtY(state.playerLane, PLAYER_Y);
    state.playerX = lerp(state.playerX, targetX, 1 - Math.exp(-dt * 14));

    if (state.mode !== "playing") return;

    state.runTime += dt;
    state.speed = 255 + Math.min(165, state.runTime * 10 + state.score * 0.015);
    state.distance += state.speed * dt;
    state.energy = clamp(state.energy + dt * 12, 0, 100);
    state.dashTimer = Math.max(0, state.dashTimer - dt);
    state.scoreFloat += dt * (24 + state.speed * 0.08 * state.combo);
    state.score = Math.floor(state.scoreFloat);
    state.spawnTimer -= dt;

    if (state.spawnTimer <= 0) {
      const roll = nextRandom(state);
      const laneOrder = [0, 1, 2].sort(() => nextRandom(state) - 0.5);
      const addEntity = (type: EntityType, lane: number, yOffset = 0) => {
        state.entities.push({
          id: state.nextEntityId++,
          type,
          lane,
          y: TRACK_TOP_Y - 42 - yOffset,
          speedScale: 0.94 + nextRandom(state) * 0.22,
          radius: type === "orb" ? 16 : 24,
        });
      };

      if (roll < 0.25) {
        addEntity("orb", laneOrder[0]);
        addEntity("orb", laneOrder[1], 92);
      } else if (roll < 0.52) {
        addEntity("barrier", laneOrder[0]);
      } else if (roll < 0.8) {
        addEntity("barrier", laneOrder[0]);
        addEntity("barrier", laneOrder[1], 86);
        addEntity("orb", laneOrder[2], 46);
      } else {
        addEntity("orb", laneOrder[0]);
        addEntity("barrier", laneOrder[1], 52);
        addEntity("orb", laneOrder[2], 104);
      }

      state.spawnTimer = clamp(0.88 - state.runTime * 0.02, 0.34, 0.88);
    }

    for (let i = state.entities.length - 1; i >= 0; i -= 1) {
      const entity = state.entities[i];
      entity.y += state.speed * entity.speedScale * dt;

      const playerTrackX = laneXAtY(entity.lane, PLAYER_Y);
      const aligned = Math.abs(state.playerX - playerTrackX) < 44;
      const close = Math.abs(entity.y - PLAYER_Y) < entity.radius + PLAYER_RADIUS;

      if (aligned && close) {
        if (entity.type === "orb") {
          state.collected += 1;
          state.scoreFloat += 120 * state.combo;
          state.score = Math.floor(state.scoreFloat);
          state.combo = clamp(state.combo + 0.35, 1, 6);
          state.energy = clamp(state.energy + 24, 0, 100);
          state.collectionFlash = 0.2;
          state.lastAction = "Orb banked";
          emitParticles(state, playerTrackX, entity.y, 14, 191);
        } else if (state.dashTimer > 0) {
          state.smashed += 1;
          state.scoreFloat += 95 * state.combo;
          state.score = Math.floor(state.scoreFloat);
          state.combo = clamp(state.combo + 0.2, 1, 6);
          state.lastAction = "Barrier shattered";
          emitParticles(state, playerTrackX, entity.y, 22, 18);
        } else {
          state.shields -= 1;
          state.combo = 1;
          state.impactShake = 0.45;
          state.lastAction = "Impact taken";
          emitParticles(state, playerTrackX, PLAYER_Y, 24, 350);
          if (state.shields <= 0) {
            state.mode = "gameover";
            state.lastAction = "Run ended";
            updateBestScore(state);
          }
        }

        state.entities.splice(i, 1);
        continue;
      }

      if (entity.y > LOGICAL_HEIGHT + 60) {
        if (entity.type === "orb") {
          state.combo = clamp(state.combo - 0.12, 1, 6);
        }
        state.entities.splice(i, 1);
      }
    }

    updateBestScore(state);
  };

  const handleFullscreenToggle = async () => {
    const host = shellRef.current;
    if (!host) return;
    if (document.fullscreenElement) {
      await document.exitFullscreen();
      return;
    }
    await host.requestFullscreen();
  };

  const renderState = () => {
    const state = stateRef.current;
    const payload = {
      page: "arcade",
      title: GAME_TITLE,
      mode: state.mode,
      coordinate_system: "origin top-left; x increases right; y increases down; logical canvas 420x720",
      controls: [
        "ArrowLeft/ArrowRight or A/D move lanes",
        "Space boosts through barriers",
        "P pauses",
        "R restarts",
        "F toggles fullscreen",
      ],
      buttons: {
        start: "#start-arcade-run",
        pause: "#pause-arcade-run",
        restart: "#restart-arcade-run",
      },
      player: {
        lane: state.playerLane,
        x: Math.round(state.playerX),
        y: PLAYER_Y,
        dash_active: state.dashTimer > 0,
      },
      hud: {
        score: state.score,
        combo: Number(state.combo.toFixed(1)),
        shields: state.shields,
        energy: Math.round(state.energy),
        distance: Math.round(state.distance),
        best_score: state.bestScore,
        fullscreen: fullscreenRef.current,
        last_action: state.lastAction,
      },
      entities: state.entities.slice(0, 8).map((entity) => ({
        type: entity.type,
        lane: entity.lane,
        x: Math.round(laneXAtY(entity.lane, entity.y)),
        y: Math.round(entity.y),
      })),
    };
    return JSON.stringify(payload);
  };

  useEffect(() => {
    resizeCanvas();
    renderGame();

    const loop = (timestamp: number) => {
      if (previousTimeRef.current == null) previousTimeRef.current = timestamp;
      const dt = (timestamp - previousTimeRef.current) / 1000;
      previousTimeRef.current = timestamp;
      stepGame(dt);
      renderGame();
      syncPanel();
      frameRef.current = window.requestAnimationFrame(loop);
    };

    frameRef.current = window.requestAnimationFrame(loop);

    const handleResize = () => resizeCanvas();
    const handleFullscreenChange = () => {
      fullscreenRef.current = Boolean(document.fullscreenElement);
      resizeCanvas();
      syncPanel(true);
    };
    const handleKeyDown = (event: KeyboardEvent) => {
      const target = event.target as HTMLElement | null;
      if (target?.closest("input, textarea, select, [contenteditable='true']")) return;

      const key = event.key.toLowerCase();
      if (["arrowleft", "arrowright", " ", "spacebar", "space", "enter", "p", "r", "f", "a", "d"].includes(key)) {
        event.preventDefault();
      }

      if (key === "arrowleft" || key === "a") moveLane(-1);
      else if (key === "arrowright" || key === "d") moveLane(1);
      else if (key === " " || key === "spacebar" || key === "space") launchBoost();
      else if (key === "enter") {
        if (stateRef.current.mode === "playing") launchBoost();
        else startRun();
      } else if (key === "p") togglePause();
      else if (key === "r") startRun();
      else if (key === "f") {
        handleFullscreenToggle().catch(() => {});
      }
    };

    window.addEventListener("resize", handleResize);
    document.addEventListener("fullscreenchange", handleFullscreenChange);
    window.addEventListener("keydown", handleKeyDown);

    const advanceTime = async (ms: number) => {
      const steps = Math.max(1, Math.round(ms / FRAME_MS));
      for (let index = 0; index < steps; index += 1) {
        stepGame(1 / 60);
      }
      previousTimeRef.current = typeof performance === "undefined" ? 0 : performance.now();
      renderGame();
      syncPanel(true);
    };

    window.advanceTime = advanceTime;
    window.render_game_to_text = renderState;

    return () => {
      if (frameRef.current != null) {
        window.cancelAnimationFrame(frameRef.current);
      }
      window.removeEventListener("resize", handleResize);
      document.removeEventListener("fullscreenchange", handleFullscreenChange);
      window.removeEventListener("keydown", handleKeyDown);
      if (window.advanceTime === advanceTime) delete window.advanceTime;
      if (window.render_game_to_text === renderState) delete window.render_game_to_text;
    };
  }, []);

  const handlePointerDown = (event: React.PointerEvent<HTMLCanvasElement>) => {
    pointerStartRef.current = { x: event.clientX, y: event.clientY };
  };

  const handlePointerUp = (event: React.PointerEvent<HTMLCanvasElement>) => {
    const start = pointerStartRef.current;
    pointerStartRef.current = null;

    const rect = event.currentTarget.getBoundingClientRect();
    const normalizedX = (event.clientX - rect.left) / rect.width;

    if (stateRef.current.mode === "menu" || stateRef.current.mode === "gameover") {
      startRun();
      return;
    }

    if (stateRef.current.mode === "paused") {
      togglePause();
      return;
    }

    if (start) {
      const dx = event.clientX - start.x;
      if (Math.abs(dx) > 24) {
        moveLane(dx > 0 ? 1 : -1);
        return;
      }
    }

    if (normalizedX < 0.34) moveLane(-1);
    else if (normalizedX > 0.66) moveLane(1);
    else launchBoost();
  };

  const statusLines = useMemo(
    () => [
      { label: "Status", value: formatMode(panel.mode) },
      { label: "Score", value: panel.score.toLocaleString() },
      { label: "Combo", value: `${panel.combo.toFixed(1)}x` },
      { label: "Shield", value: String(panel.shields) },
      { label: "Energy", value: `${Math.round(panel.energy)}%` },
      { label: "Best", value: panel.bestScore.toLocaleString() },
    ],
    [panel],
  );

  return (
    <div
      id="arcade-stage"
      ref={shellRef}
      className="relative overflow-hidden rounded-[34px] border border-white/12 bg-slate-950/65 p-4 shadow-[0_35px_100px_rgba(2,12,27,0.55)] backdrop-blur-xl sm:p-5"
    >
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_top,_rgba(34,211,238,0.18),_transparent_34%),radial-gradient(circle_at_bottom_right,_rgba(249,115,22,0.16),_transparent_30%)]" />
      <div className="relative z-10 flex flex-wrap items-center justify-between gap-3 border-b border-white/10 pb-4">
        <div>
          <p className="text-[0.7rem] uppercase tracking-[0.34em] text-cyan-200/72">Live Arcade Surface</p>
          <h2 className="mt-1 text-xl font-semibold text-white">{GAME_TITLE}</h2>
        </div>
        <div className="flex flex-wrap gap-2">
          <button
            id="start-arcade-run"
            onClick={startRun}
            className="arcade-action-button inline-flex items-center gap-2 rounded-full border border-cyan-300/25 bg-cyan-300/12 px-4 py-2 text-sm font-medium text-cyan-50 transition-colors hover:bg-cyan-300/20"
          >
            <Play size={15} />
            {panel.mode === "playing" ? "Restart Run" : "Launch Run"}
          </button>
          <button
            id="pause-arcade-run"
            onClick={togglePause}
            className="arcade-action-button inline-flex items-center gap-2 rounded-full border border-white/12 bg-white/6 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-white/12"
          >
            <Pause size={15} />
            {panel.mode === "paused" ? "Resume" : "Pause"}
          </button>
          <button
            id="restart-arcade-run"
            onClick={startRun}
            className="arcade-action-button inline-flex items-center gap-2 rounded-full border border-white/12 bg-white/6 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-white/12"
          >
            <RotateCcw size={15} />
            Reset
          </button>
          <button
            onClick={() => handleFullscreenToggle().catch(() => {})}
            className="arcade-action-button inline-flex items-center gap-2 rounded-full border border-white/12 bg-white/6 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-white/12"
          >
            <Maximize2 size={15} />
            {panel.fullscreen ? "Exit Fullscreen" : "Fullscreen"}
          </button>
        </div>
      </div>

      <div className="relative z-10 mt-4 rounded-[28px] border border-white/10 bg-[#030712] p-2.5 sm:p-3">
        <div ref={containerRef} className="relative mx-auto flex w-full justify-center overflow-hidden rounded-[22px] bg-black/40">
          <canvas
            ref={canvasRef}
            className="block w-full max-w-[680px] touch-none rounded-[22px]"
            onPointerDown={handlePointerDown}
            onPointerUp={handlePointerUp}
          />
        </div>
      </div>

      <div className="relative z-10 mt-4 grid gap-4 border-t border-white/10 pt-4 lg:grid-cols-[1fr_auto] lg:items-end">
        <div className="grid gap-2 sm:grid-cols-3">
          {statusLines.map((line) => (
            <div key={line.label} className="border-b border-white/8 pb-2">
              <div className="text-[0.68rem] uppercase tracking-[0.3em] text-slate-400">{line.label}</div>
              <div className="mt-1 text-lg font-semibold text-white">{line.value}</div>
            </div>
          ))}
        </div>

        <div className="grid grid-cols-3 gap-2">
          <button
            onClick={() => moveLane(-1)}
            className="arcade-control-button inline-flex min-h-14 items-center justify-center gap-2 rounded-[18px] border border-white/10 bg-white/6 px-4 py-3 text-sm font-medium text-white transition-transform hover:-translate-y-0.5 hover:bg-white/12"
          >
            <ArrowLeft size={18} />
            Left
          </button>
          <button
            onClick={launchBoost}
            className={`arcade-control-button inline-flex min-h-14 items-center justify-center gap-2 rounded-[18px] border px-4 py-3 text-sm font-medium transition-transform hover:-translate-y-0.5 ${
              panel.canBoost
                ? "border-amber-300/30 bg-amber-300/14 text-amber-50"
                : "border-white/10 bg-white/6 text-slate-300"
            }`}
          >
            <Zap size={18} />
            Boost
          </button>
          <button
            onClick={() => moveLane(1)}
            className="arcade-control-button inline-flex min-h-14 items-center justify-center gap-2 rounded-[18px] border border-white/10 bg-white/6 px-4 py-3 text-sm font-medium text-white transition-transform hover:-translate-y-0.5 hover:bg-white/12"
          >
            Right
            <ArrowRight size={18} />
          </button>
        </div>
      </div>

      <div className="relative z-10 mt-4 border-t border-white/10 pt-4 text-sm text-slate-300">
        <span className="text-cyan-200">Run note:</span> {panel.lastAction}
      </div>
    </div>
  );
}

export default function Arcade() {
  return (
    <div className="relative min-h-[calc(100svh-56px)] overflow-hidden">
      <div className="arcade-shell-bg absolute inset-0" />
      <div className="arcade-grid-overlay absolute inset-0" />
      <div className="arcade-noise absolute inset-0 opacity-25" />

      <section className="relative mx-auto flex max-w-7xl flex-col gap-10 px-4 py-8 sm:px-6 sm:py-10 lg:px-8 lg:py-12">
        <div className="grid gap-8 lg:grid-cols-[minmax(0,0.92fr)_minmax(460px,1.08fr)] lg:items-center">
          <div className="max-w-xl">
            <p className="arcade-poster-reveal text-[0.72rem] uppercase tracking-[0.38em] text-cyan-200/72">
              Arcade Tab
            </p>
            <h1 className="arcade-poster-reveal mt-4 text-4xl font-semibold tracking-tight text-white sm:text-6xl">
              Neon Skyline Rush
            </h1>
            <p className="arcade-poster-reveal mt-5 max-w-lg text-base leading-7 text-slate-300 sm:text-lg">
              A fast three-lane runner built for quick site visits, replay loops, and clean touch controls without losing the dashboard’s visual edge.
            </p>

            <div className="arcade-poster-reveal mt-7 flex flex-wrap gap-3">
              <a
                href="#arcade-stage"
                className="inline-flex items-center gap-2 rounded-full border border-cyan-300/25 bg-cyan-300/14 px-5 py-2.5 text-sm font-medium text-cyan-50 transition-colors hover:bg-cyan-300/22"
              >
                <Sparkles size={16} />
                Play The Run
              </a>
              <Link
                to="/game-on"
                className="inline-flex items-center gap-2 rounded-full border border-white/12 bg-white/6 px-5 py-2.5 text-sm font-medium text-white transition-colors hover:bg-white/12"
              >
                Back To Overdrive
              </Link>
            </div>
          </div>

          <ArcadeGame />
        </div>

        <div className="arcade-poster-reveal grid gap-4 border-t border-white/10 pt-6 sm:grid-cols-3">
          {heroFacts.map((fact) => (
            <div key={fact.label}>
              <div className="text-[0.68rem] uppercase tracking-[0.28em] text-slate-400">{fact.label}</div>
              <div className="mt-2 text-lg font-semibold text-white">{fact.value}</div>
            </div>
          ))}
        </div>

        <div className="grid overflow-hidden rounded-[28px] border border-white/10 bg-white/[0.03] backdrop-blur-sm md:grid-cols-3">
          {detailSections.map((section, index) => (
            <div
              key={section.label}
              className={`px-5 py-6 sm:px-6 sm:py-7 ${index < detailSections.length - 1 ? "border-b border-white/8 md:border-b-0 md:border-r" : ""}`}
            >
              <div className="text-[0.68rem] uppercase tracking-[0.32em] text-cyan-200/72">{section.label}</div>
              <h2 className="mt-3 text-2xl font-semibold text-white">{section.title}</h2>
              <p className="mt-3 text-sm leading-7 text-slate-300">{section.body}</p>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}
