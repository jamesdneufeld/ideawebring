// IDEA Coding Club Mascot

// ================= CONFIGURATION =================
const CONFIG = {
  speed: 11, // Mascot movement speed (px/frame)
  minFollowDistance: 24, // Distance before mascot stops following
  interactionTrigger: 10, // Mouse moves before triggering first behavior
  idleChance: 0.005, // Chance per frame to start idle animation
  spriteSize: 32, // Sprite width/height in pixels
  spritePath: "assets/coding-club-mascot.gif", // Sprite sheet path
  interactionTimeout: 5000, // Reset interaction counter after 5s of inactivity
  cursorYOffsetRatio: 2.5, // Vertical offset ratio of sprite size
  cursorXBufferRatio: 3, // Horizontal buffer ratio of sprite size
};

// Derived dynamic offsets
CONFIG.cursorYOffset = CONFIG.spriteSize * CONFIG.cursorYOffsetRatio;
CONFIG.cursorXBuffer = CONFIG.spriteSize * CONFIG.cursorXBufferRatio;

// ================= INITIALIZATION =================
let mascotPos = { x: 0, y: 30 };
const mascotEl = document.createElement("div");

let mousePos = { x: 0, y: 0 };
let frameCount = 0;
let idleTime = 0;
let idleAnim = null;
let idleFrame = 0;
let interactionCount = 0;
let lastInteraction = Date.now();

// ================= SPRITE DEFINITIONS =================
const sprites = {
  idle: [[-3, -3]],
  alert: [[-7, -3]],
  thinking: [[-3, -2]],
  coding: [
    [-5, 0],
    [-6, 0],
    [-7, 0],
  ],
  sleeping: [
    [-2, 0],
    [-2, -1],
  ],
  dancing: [
    [-1, 0],
    [-1, -1],
    [-2, 0],
    [-2, -1],
  ],
  N: [
    [-1, -2],
    [-1, -3],
  ],
  NE: [
    [0, -2],
    [0, -3],
  ],
  E: [
    [-3, 0],
    [-3, -1],
  ],
  SE: [
    [-5, -1],
    [-5, -2],
  ],
  S: [
    [-6, -3],
    [-7, -2],
  ],
  SW: [
    [-5, -3],
    [-6, -1],
  ],
  W: [
    [-4, -2],
    [-4, -3],
  ],
  NW: [
    [-1, 0],
    [-1, -1],
  ],
};

const idleAnims = [
  { name: "sleeping", frames: 192, sprite: (f) => (f < 8 ? "thinking" : "sleeping") },
  { name: "coding", frames: 9, sprite: () => "coding" },
];

// ================= BEHAVIORS =================
const behaviors = [
  {
    name: "dancing",
    condition: (dist) => dist < 50,
    update: (diff, f) => {
      mascotPos.x += Math.sin(f * 0.2) * 3;
      mascotPos.y += Math.cos(f * 0.3) * 2;
      return "dancing";
    },
    shouldComplete: (f, dist) => f > 100 || dist > 100,
    next: "coding",
  },
  {
    name: "coding",
    condition: () => true,
    update: () => "coding",
    shouldComplete: (f) => f > 80,
    next: "sleeping",
  },
  {
    name: "sleeping",
    condition: () => true,
    update: () => "sleeping",
    shouldComplete: (f) => f > 200,
    next: null,
  },
];

let behaviorQueue = [];

// ================= HELPER FUNCTIONS =================
const startBehavior = (name) => {
  const b = behaviors.find((b) => b.name === name);
  if (b) behaviorQueue.push({ ...b, frame: 0 });
};

const setSprite = (name, frame = 0) => {
  if (!sprites[name]) return;
  const [x, y] = sprites[name][frame % sprites[name].length];
  mascotEl.style.backgroundPosition = `${x * CONFIG.spriteSize}px ${y * CONFIG.spriteSize}px`;
};

const getClosestCursor = () => ({
  x: mousePos.x,
  y: mousePos.y,
  ry: mousePos.y,
  real: true,
  dist: Math.hypot(mascotPos.x - mousePos.x, mascotPos.y - mousePos.y),
});

const pickIdle = () => {
  if (!idleAnim && Math.random() < CONFIG.idleChance) idleAnim = idleAnims[Math.floor(Math.random() * idleAnims.length)];
};

const handleIdle = () => {
  if (!idleAnim) return setSprite("idle");
  setSprite(idleAnim.sprite(idleFrame), idleFrame);
  if (++idleFrame > idleAnim.frames) idleAnim = null;
};

const getDir = (diff, dist) => (diff.y / dist > 0.5 ? "N" : "") + (diff.y / dist < -0.5 ? "S" : "") + (diff.x / dist > 0.5 ? "W" : "") + (diff.x / dist < -0.5 ? "E" : "");

const clamp = () => {
  const halfSize = CONFIG.spriteSize / 2;
  mascotPos.x = Math.max(halfSize, Math.min(innerWidth - halfSize, mascotPos.x));
  mascotPos.y = Math.max(halfSize, Math.min(innerHeight - halfSize, mascotPos.y));
};

const moveMascot = (targetX, targetY) => {
  const diff = { x: mascotPos.x - targetX, y: mascotPos.y - targetY };
  const dist = Math.hypot(diff.x, diff.y);

  if (behaviorQueue.length > 0) {
    const current = behaviorQueue[0];
    if (current.condition(dist)) {
      setSprite(current.update(diff, current.frame), frameCount);
      if (current.shouldComplete(current.frame, dist)) {
        behaviorQueue.shift();
        if (current.next) startBehavior(current.next);
      } else {
        current.frame++;
      }
      clamp();
      return true;
    } else {
      behaviorQueue.shift();
    }
  }

  if (dist < CONFIG.speed || dist < CONFIG.minFollowDistance) return false;

  mascotPos.x -= (diff.x / dist) * CONFIG.speed;
  mascotPos.y -= (diff.y / dist) * CONFIG.speed;
  setSprite(getDir(diff, dist), frameCount);
  clamp();
  return true;
};

const correctCursor = (c) => {
  if (!c) return;
  const halfSize = CONFIG.spriteSize / 2;
  if (c.x > innerWidth - CONFIG.cursorXBuffer - halfSize) {
    c.x = innerWidth - CONFIG.cursorXBuffer - halfSize;
  }
  if (c.x < CONFIG.cursorXBuffer + halfSize) {
    c.x = CONFIG.cursorXBuffer + halfSize;
  }
};

// ================= MASCOT INITIAL STYLING =================
Object.assign(mascotEl.style, {
  position: "fixed",
  pointerEvents: "none",
  zIndex: 9999,
  width: `${CONFIG.spriteSize}px`,
  height: `${CONFIG.spriteSize}px`,
  imageRendering: "pixelated",
  backgroundImage: `url('${CONFIG.spritePath}')`,
  left: `${mascotPos.x}px`,
  top: `${mascotPos.y}px`,
});

mascotEl.onerror = () => {
  console.warn("Coding club mascot sprite not found");
  mascotEl.style.backgroundColor = "#ff6b6b";
  mascotEl.style.border = "2px solid #333";
};

document.body.appendChild(mascotEl);

// ================= EVENT LISTENERS =================
document.onmousemove = (e) => {
  mousePos.x = e.clientX;
  mousePos.y = e.clientY;

  if (Date.now() - lastInteraction > CONFIG.interactionTimeout) interactionCount = 0;
  lastInteraction = Date.now();

  if (++interactionCount === CONFIG.interactionTrigger && behaviorQueue.length === 0) {
    startBehavior("dancing");
  }
};

document.addEventListener("keypress", (e) => {
  if (e.key === "d") startBehavior("dancing");
  if (e.key === "c") startBehavior("coding");
  if (e.key === "s") startBehavior("sleeping");
  if (e.key === "x") behaviorQueue = [];
});

window.addEventListener("resize", () => clamp());

// Cleanup on page unload
window.addEventListener("beforeunload", () => clearInterval(window.codingMascotInterval));

// ================= MAIN LOOP =================
function frame() {
  frameCount++;
  const cursor = getClosestCursor();
  correctCursor(cursor);

  if (!cursor) {
    handleIdle();
    return;
  }

  const halfSize = CONFIG.spriteSize / 2;
  const targetX = cursor.x;
  const targetY = cursor.y - CONFIG.cursorYOffset;

  if (!moveMascot(targetX, targetY)) {
    idleTime++;
    if (idleTime > 10) {
      pickIdle();
      handleIdle();
    }
    return;
  }

  // Update mascot position in DOM, centered
  mascotEl.style.left = `${mascotPos.x - halfSize}px`;
  mascotEl.style.top = `${mascotPos.y - halfSize}px`;

  idleAnim = null;
  idleFrame = 0;

  if (idleTime > 1) {
    setSprite("alert", 0);
    idleTime = Math.min(idleTime, 7) - 1;
  }
}

// Start the animation loop
console.log("IDEA Coding Club Mascot initialized!");
window.codingMascotInterval = setInterval(frame, 100);
