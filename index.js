import * as THREE from "three";
import * as CANNON from "cannon-es";
import { OrbitControls } from "three/addons/controls/OrbitControls.js";
import { createMap as createMap1 } from "./map1.js";
import { createMap as createMap2 } from "./map2.js";
import { createMap as createMap3 } from "./map3.js";

//renderer
const renderer = new THREE.WebGLRenderer({ antialias: true });
renderer.setSize(window.innerWidth, window.innerHeight);
renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
renderer.shadowMap.enabled = true;
renderer.shadowMap.type = THREE.PCFSoftShadowMap;
document.body.appendChild(renderer.domElement);

//scene
const scene = new THREE.Scene();
scene.background = new THREE.Color(0x87ceeb);

//Camera
const camera = new THREE.PerspectiveCamera(
  75,
  window.innerWidth / window.innerHeight,
  0.1,
  1000);
camera.position.set(0, 5, -5);

//light
const light = new THREE.DirectionalLight(0xffffff, 2.2);
light.position.set(28, 38, -2);
light.target.position.set(8, 1, 18);
light.castShadow = true;
light.shadow.mapSize.set(2048, 2048);
light.shadow.camera.left = -35;
light.shadow.camera.right = 35;
light.shadow.camera.top = 35;
light.shadow.camera.bottom = -35;
light.shadow.camera.near = 10;
light.shadow.camera.far = 90;
light.shadow.bias = -0.0005;
light.shadow.normalBias = 0.02;
scene.add(light);
scene.add(light.target);

scene.add(new THREE.HemisphereLight(0x87ceeb, 0x2b5a3a, 0.7));
scene.add(new THREE.AmbientLight(0xffffff, 0.25));

//World Physics
const world = new CANNON.World({
    gravity : new CANNON.Vec3(0,-9.81,0)
});

// Friction / Restitution
const defaultMaterial = new CANNON.Material('default');
const contactMaterial = new CANNON.ContactMaterial(defaultMaterial, defaultMaterial, {
    friction: 0.1,
    restitution: 0.45
});
world.addContactMaterial(contactMaterial);

//Ground
const groundThickness = 0.5;
const groundGeometry = new THREE.BoxGeometry(20, groundThickness, 20);
const groundMateriel = new THREE.MeshStandardMaterial({
  color: 0x2e8b57,
  roughness: 0.9,
  metalness: 0
});
const ground = new THREE.Mesh(groundGeometry,groundMateriel);
ground.receiveShadow = true;
scene.add(ground);

//sphere
const radius = 0.3;
const geometry = new THREE.SphereGeometry(radius); 
const material = new THREE.MeshStandardMaterial( { color: 0xffffff  ,roughness: 0.4} ); 
const golf = new THREE.Mesh( geometry, material ); 
golf.castShadow = true;
golf.receiveShadow = true;
scene.add(golf);

const groundBody = new CANNON.Body({
    shape: new CANNON.Box(new CANNON.Vec3(10, groundThickness / 2, 10)),
    type: CANNON.Body.Static, //mass 0
    material: defaultMaterial,
    position: new CANNON.Vec3(0, -groundThickness / 2, 0)
});
world.addBody(groundBody);

const golfBody = new CANNON.Body({
    shape : new CANNON.Sphere(radius),
    mass:1,
    material : defaultMaterial
});
golfBody.position.set(0, 1, 0);
golfBody.linearDamping = 0.25; // ralentit le déplacement de la balle
golfBody.angularDamping = 0.5; // ralentit sa rotation
world.addBody(golfBody);

const previousBallPosition = golfBody.position.clone();

const physicsObjects = [];
const levels = [
  { label: "L1", name: "Level 1", par: 3, create: createMap1 },
  { label: "L2", name: "Level 2", par: 4, create: createMap2 },
  { label: "L3", name: "Level 3", par: 4, create: createMap3 }
];
const levelScores = levels.map(() => null);
let currentMapIndex = 0;
let activeMap = levels[currentMapIndex].create({
  scene,
  world,
  defaultMaterial
});
let holePosition = activeMap.holePosition;
let holeRadius = activeMap.holeRadius;
physicsObjects.push(...activeMap.physicsObjects);

let holeCompleted = false;
let strokes = 0;
const MAX_SHOOT_POWER = 50;
const timeStamp = 1/60;

const levelButtonsContainer = document.getElementById("level-buttons");
const prevLevelBtn = document.getElementById("prev-level-btn");
const nextLevelBtn = document.getElementById("next-level-btn");
const resetBtn = document.getElementById("reset-btn");
const strokesValueEl = document.getElementById("strokes-value");
const totalStrokesValueEl = document.getElementById("total-strokes-value");
const powerFillEl = document.getElementById("power-fill");
const powerValueEl = document.getElementById("power-value");
const levelModalEl = document.getElementById("level-modal");
const modalKickerEl = document.getElementById("modal-kicker");
const modalTitleEl = document.getElementById("modal-title");
const modalScoreTagEl = document.getElementById("modal-score-tag");
const modalStrokesEl = document.getElementById("modal-strokes");
const modalParEl = document.getElementById("modal-par");
const modalTotalEl = document.getElementById("modal-total");
const modalScorecardEl = document.getElementById("modal-scorecard");
const modalRestartBtn = document.getElementById("modal-restart-btn");
const modalNextBtn = document.getElementById("modal-next-btn");

const levelButtonEls = levels.map((level, index) => {
  const button = document.createElement("button");
  button.type = "button";
  button.className = "hud-btn";
  button.textContent = level.name;
  button.addEventListener("click", () => {
    loadMap(index);
  });
  levelButtonsContainer.appendChild(button);
  return button;
});

function getTotalStrokes() {
  return levelScores.reduce(
    (sum, score, index) => sum + (index === currentMapIndex ? strokes : score ?? 0),
    0
  );
}

function formatParResult(holeStrokes, par) {
  if (holeStrokes === 1) {
    return "Hole in One";
  }

  const diff = holeStrokes - par;
  if (diff === -2) return "Eagle (-2)";
  if (diff === -1) return "Birdie (-1)";
  if (diff === 0) return "Even Par";
  if (diff === 1) return "Bogey (+1)";
  if (diff === 2) return "Double Bogey (+2)";
  return diff < 0 ? `${diff} Under Par` : `+${diff} Over Par`;
}

function updatePowerUI(power) {
  const percent = Math.round((power / MAX_SHOOT_POWER) * 100);
  powerFillEl.style.width = `${percent}%`;
  powerValueEl.textContent = `${percent}%`;
}

function updateHudUI() {
  strokesValueEl.textContent = String(strokes);
  totalStrokesValueEl.textContent = String(getTotalStrokes());
  prevLevelBtn.disabled = currentMapIndex === 0;
  nextLevelBtn.disabled = currentMapIndex === levels.length - 1;

  levelButtonEls.forEach((button, index) => {
    button.classList.toggle("active", index === currentMapIndex);
  });
}

function showLevelModal() {
  const currentLevel = levels[currentMapIndex];
  const isFinalLevel = currentMapIndex === levels.length - 1;
  const total = getTotalStrokes();
  const isOverPar = strokes > currentLevel.par;

  modalKickerEl.textContent = `${currentLevel.name} Complete`;
  modalTitleEl.textContent = isFinalLevel ? "Course Complete" : "Hole Completed";
  modalScoreTagEl.textContent = formatParResult(strokes, currentLevel.par);
  modalScoreTagEl.classList.toggle("over", isOverPar);

  modalStrokesEl.textContent = String(strokes);
  modalParEl.textContent = String(currentLevel.par);
  modalTotalEl.textContent = String(total);

  modalScorecardEl.replaceChildren(
    ...levels.map((level, index) => {
      const item = document.createElement("div");
      item.className = "scorecard-item";
      const label = document.createElement("span");
      label.textContent = level.label;
      const value = document.createElement("strong");
      value.textContent = levelScores[index] === null ? "-" : String(levelScores[index]);
      item.append(label, value);
      return item;
    })
  );

  modalNextBtn.textContent = isFinalLevel ? "Play Again" : "Next Level";
  modalNextBtn.onclick = isFinalLevel
    ? () => loadMap(0, { resetTotal: true })
    : switchToNextMap;

  levelModalEl.hidden = false;
}

function hideLevelModal() {
  levelModalEl.hidden = true;
  modalNextBtn.onclick = null;
}

const controls = new OrbitControls(camera, renderer.domElement);

controls.target.copy(ground.position);
controls.enableDamping = true;
controls.enablePan = false;
controls.enableRotate = false;
controls.mouseButtons = {
  LEFT: THREE.MOUSE.PAN,
  MIDDLE: THREE.MOUSE.DOLLY,
  RIGHT: THREE.MOUSE.PAN
};
controls.minDistance = 2;
controls.maxDistance = 10;

// Logique de mouvement
const arrowHelper = new THREE.ArrowHelper(
  new THREE.Vector3(0, 0, -1),
  new THREE.Vector3(),
  2,
  0xffff00
);

arrowHelper.visible = false;
scene.add(arrowHelper);

let isDragging = false;
let isCtrlPressed = false;
let isOrbitDragging = false;
let dragStart = { x: 0, y: 0 };
let shootPower = 0;
const shootDirection = new THREE.Vector3();

function cancelBallDrag() {
  isDragging = false;
  shootPower = 0;
  arrowHelper.visible = false;
  updatePowerUI(0);
}

function syncControlsWithModifier(ctrlPressed) {
  isCtrlPressed = ctrlPressed;
  controls.enableRotate = ctrlPressed;

  if (ctrlPressed) {
    controls.enabled = true;
    cancelBallDrag();
  } else {
    controls.enabled = !isOrbitDragging;
  }
}

function removeMesh(mesh) {
  scene.remove(mesh);
  mesh.geometry.dispose();

  const materials = Array.isArray(mesh.material)
    ? mesh.material
    : [mesh.material];

  for (const meshMaterial of materials) {
    meshMaterial.dispose();
  }
}

function loadMap(targetIndex, { resetTotal = false } = {}) {
  if (targetIndex < 0 || targetIndex >= levels.length) {
    return;
  }

  const cameraOffset = camera.position.clone().sub(controls.target);

  for (const { mesh, body } of activeMap.physicsObjects) {
    world.removeBody(body);
    removeMesh(mesh);
  }

  for (const mesh of activeMap.visualObjects ?? []) {
    removeMesh(mesh);
  }

  physicsObjects.length = 0;
  currentMapIndex = targetIndex;
  activeMap = levels[currentMapIndex].create({
    scene,
    world,
    defaultMaterial
  });
  physicsObjects.push(...activeMap.physicsObjects);

  holePosition = activeMap.holePosition;
  holeRadius = activeMap.holeRadius;

  golfBody.position.set(0, 1, 0);
  golfBody.velocity.setZero();
  golfBody.angularVelocity.setZero();
  golfBody.force.setZero();
  golfBody.torque.setZero();
  golfBody.wakeUp();

  golf.position.copy(golfBody.position);
  golf.visible = true;
  previousBallPosition.copy(golfBody.position);

  holeCompleted = false;
  strokes = 0;
  if (resetTotal) {
    levelScores.fill(null);
  } else {
    levelScores[currentMapIndex] = null;
  }
  hideLevelModal();
  cancelBallDrag();
  syncControlsWithModifier(isCtrlPressed);
  updateHudUI();

  controls.target.copy(golfBody.position);
  camera.position.copy(golfBody.position).add(cameraOffset);
  controls.update();
}

function switchToNextMap() {
  if (currentMapIndex >= levels.length - 1) {
    return;
  }

  loadMap(currentMapIndex + 1);
}

prevLevelBtn.addEventListener("click", () => {
  loadMap(currentMapIndex - 1);
});

nextLevelBtn.addEventListener("click", () => {
  loadMap(currentMapIndex + 1);
});

resetBtn.addEventListener("click", () => {
  loadMap(currentMapIndex);
});

modalRestartBtn.addEventListener("click", () => {
  loadMap(currentMapIndex);
});

updateHudUI();
updatePowerUI(0);

window.addEventListener("keydown", (event) => {
  if (event.key === "Control" || event.ctrlKey) {
    syncControlsWithModifier(true);
  }
});

window.addEventListener("keyup", (event) => {
  if (event.key === "Control" || !event.ctrlKey) {
    syncControlsWithModifier(false);
  }
});

window.addEventListener("blur", () => {
  cancelBallDrag();
  syncControlsWithModifier(false);
});

window.addEventListener(
  "pointerdown",
  (event) => {
    if (event.target !== renderer.domElement) {
      return;
    }

    isOrbitDragging = event.ctrlKey;
    syncControlsWithModifier(event.ctrlKey);

    if (!event.ctrlKey) {
      controls.enabled = false;
    }
  },
  { capture: true }
);

window.addEventListener(
  "pointermove",
  (event) => {
    if (isOrbitDragging && !event.ctrlKey) {
      syncControlsWithModifier(false);
    }
  },
  { capture: true }
);

function handlePointerEndCapture() {
  if (isOrbitDragging) {
    // Allow OrbitControls' pointerup listener to clean up internal drag state.
    controls.enabled = true;
  }
}

window.addEventListener("pointerup", handlePointerEndCapture, { capture: true });
window.addEventListener("pointercancel", handlePointerEndCapture, { capture: true });

window.addEventListener("pointerdown", (event) => {
  if (
    event.target !== renderer.domElement ||
    event.ctrlKey ||
    isCtrlPressed ||
    event.button !== 0 ||
    holeCompleted ||
    golfBody.velocity.length() > 0.2
  ) {
    return;
  }

  isDragging = true;
  dragStart.x = event.clientX;
  dragStart.y = event.clientY;
  arrowHelper.visible = true;
});

window.addEventListener("pointermove", (event) => {
  if (event.ctrlKey || isCtrlPressed) {
    if (isDragging) {
      cancelBallDrag();
    }
    return;
  }

  if (!isDragging) {
    return;
  }

  const dx = dragStart.x - event.clientX;
  const dy = dragStart.y - event.clientY;

  shootPower = Math.min(Math.hypot(dx, dy) / 10, MAX_SHOOT_POWER);
  updatePowerUI(shootPower);

  const cameraDirection = new THREE.Vector3();
  camera.getWorldDirection(cameraDirection);
  cameraDirection.y = 0;
  cameraDirection.normalize();

  const cameraRight = new THREE.Vector3(
    cameraDirection.z,
    0,
    -cameraDirection.x
  );

  shootDirection
    .copy(cameraRight)
    .multiplyScalar(dx)
    .add(cameraDirection.multiplyScalar(dy))
    .normalize();

  arrowHelper.position.copy(golf.position);
  arrowHelper.setDirection(shootDirection);
  arrowHelper.setLength(1 + shootPower / 5);
});

function handlePointerEnd(event) {
  isOrbitDragging = false;

  if (isDragging && !event.ctrlKey && !isCtrlPressed && shootPower > 0.5) {
    const impulse = new CANNON.Vec3(
      shootDirection.x * shootPower,
      0,
      shootDirection.z * shootPower
    );

    golfBody.applyImpulse(impulse);
    strokes += 1;
    updateHudUI();
  }

  cancelBallDrag();
  syncControlsWithModifier(event.ctrlKey);
}

window.addEventListener("pointerup", handlePointerEnd);
window.addEventListener("pointercancel", (event) => {
  isOrbitDragging = false;
  cancelBallDrag();
  syncControlsWithModifier(event.ctrlKey);
});


function animate(){
    requestAnimationFrame(animate);

    world.step(timeStamp);

    ground.position.copy(groundBody.position);
    ground.quaternion.copy(groundBody.quaternion);

    golf.position.copy(golfBody.position);
    golf.quaternion.copy(golfBody.quaternion);

    const ballMovement = golfBody.position.vsub(previousBallPosition);

    camera.position.x += ballMovement.x;
    camera.position.y += ballMovement.y;
    camera.position.z += ballMovement.z;

    controls.target.x += ballMovement.x;
    controls.target.y += ballMovement.y;
    controls.target.z += ballMovement.z;

    previousBallPosition.copy(golfBody.position);

    for (const { mesh, body } of physicsObjects) {
      mesh.position.copy(body.position);
      mesh.quaternion.copy(body.quaternion);
    }

    // Détection du trou
    const distanceToHole = Math.hypot(
      golfBody.position.x - holePosition.x,
      golfBody.position.z - holePosition.z
    );
    if (!holeCompleted && distanceToHole < holeRadius) {
      holeCompleted = true;
      golf.visible = false;
      golfBody.velocity.setZero();
      golfBody.angularVelocity.setZero();
      cancelBallDrag();
      levelScores[currentMapIndex] = strokes;
      updateHudUI();
      showLevelModal();
    }

    // Détection de chute dans le vide (hors de la map)
    if (golfBody.position.y < -5) {
      cancelBallDrag();
      syncControlsWithModifier(isCtrlPressed);
      golfBody.velocity.setZero();
      golfBody.angularVelocity.setZero();
      golfBody.position.set(1, 1, 1);
      previousBallPosition.copy(golfBody.position);
      camera.position.set(10, 5, 3);
      controls.target.set(0, 0, 0);
      console.log("La balle est tombée dans le vide ! Réinitialisation...");
    }

    controls.update();
    renderer.render(scene,camera);
}

animate();

window.addEventListener("resize", () => {
  camera.aspect = window.innerWidth / window.innerHeight;
  camera.updateProjectionMatrix();
  renderer.setSize(window.innerWidth, window.innerHeight);
});