import * as THREE from "three";
import * as CANNON from "cannon-es";
import { OrbitControls } from "three/addons/controls/OrbitControls.js";

//renderer
const renderer = new THREE.WebGLRenderer();
renderer.setSize(window.innerWidth, window.innerHeight);
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
camera.position.set(10, 5, 3);

//light
const light = new THREE.DirectionalLight(0xffffff, 1);
light.position.set(5, 10, 5);
scene.add(light);

scene.add(new THREE.AmbientLight(0xffffff, 0.4));

//World Physics
const world = new CANNON.World({
    gravity : new CANNON.Vec3(0,-9.81,0)
});

// Friction / Restitution
const defaultMaterial = new CANNON.Material('default');
const contactMaterial = new CANNON.ContactMaterial(defaultMaterial, defaultMaterial, {
    friction: 0.4,
    restitution: 0.2
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
golfBody.position.set(1, 1, 1);
golfBody.linearDamping = 0.25; // ralentit le déplacement de la balle
golfBody.angularDamping = 0.5; // ralentit sa rotation
world.addBody(golfBody);

const previousBallPosition = golfBody.position.clone();

const physicsObjects = []; //list des obstacles ajouté

// Fonction d'ajout d'obstacles
function addBoxObstacle(position, size, color = 0x8b4513) {
  const mesh = new THREE.Mesh(
    new THREE.BoxGeometry(size.x, size.y, size.z),
    new THREE.MeshStandardMaterial({ color, roughness: 0.8 })
  );
  mesh.position.set(position.x, position.y, position.z);
  mesh.castShadow = true;
  mesh.receiveShadow = true;
  scene.add(mesh);

  const body = new CANNON.Body({
    type: CANNON.Body.Static,
    material: defaultMaterial,
    shape: new CANNON.Box(
      new CANNON.Vec3(size.x / 2, size.y / 2, size.z / 2)
    )
  });
  body.position.set(position.x, position.y, position.z);
  world.addBody(body);
  physicsObjects.push({ mesh, body });
}

function addCylinderObstacle(position, radius, height, color = 0x8b4513) {
  const mesh = new THREE.Mesh(
    new THREE.CylinderGeometry(radius, radius, height, 24),
    new THREE.MeshStandardMaterial({ color, roughness: 0.8 })
  );
  mesh.position.set(position.x, position.y, position.z);
  mesh.castShadow = true;
  mesh.receiveShadow = true;
  scene.add(mesh);

  const body = new CANNON.Body({
    type: CANNON.Body.Static,
    material: defaultMaterial,
    shape: new CANNON.Cylinder(radius, radius, height, 24)
  });
  body.position.set(position.x, position.y, position.z);
  world.addBody(body);
  physicsObjects.push({ mesh, body });
}

addBoxObstacle({ x: -1, y: 0.5, z: 0 }, { x: 0.8, y: 1, z: 3 });
addBoxObstacle({ x: 2, y: 0.35, z: -2 }, { x: 3, y: 0.7, z: 0.7 });
addCylinderObstacle({ x: 3, y: 0.5, z: 1 }, 0.5, 1);

// Mur de Bordures
addBoxObstacle({ x: -10, y: 0.35, z: 0 }, { x: 0.7, y: 0.7, z: 20 });
addBoxObstacle({ x: 10, y: 0.35, z: 0 }, { x: 0.7, y: 0.7, z: 20 });
addBoxObstacle({ x: 0, y: 0.35, z: 10 }, { x: 20, y: 0.7, z: 0.7 });
addBoxObstacle({ x: 0, y: 0.35, z: -10 }, { x: 20, y: 0.7, z: 0.7 });

// Hole + Flag
const holePosition = new THREE.Vector3(4, 0, -3);
const holeRadius = 0.45;
const hole = new THREE.Mesh(
  new THREE.CylinderGeometry(holeRadius, holeRadius, 0.03, 32),
  new THREE.MeshStandardMaterial({ color: 0x111111, roughness: 1 })
);
hole.position.copy(holePosition);
hole.position.y = 0.015;
hole.receiveShadow = true;
scene.add(hole);

const flagPole = new THREE.Mesh(
  new THREE.CylinderGeometry(0.025, 0.025, 2, 12),
  new THREE.MeshStandardMaterial({ color: 0xffffff })
);
flagPole.position.set(holePosition.x, 1, holePosition.z);
flagPole.castShadow = true;
scene.add(flagPole);

const flag = new THREE.Mesh(
  new THREE.PlaneGeometry(0.7, 0.4),
  new THREE.MeshStandardMaterial({
    color: 0xff3333,
    side: THREE.DoubleSide
  })
);
flag.position.set(holePosition.x + 0.35, 1.7, holePosition.z);
scene.add(flag);

let holeCompleted = false;
const timeStamp = 1/60;

const controls = new OrbitControls(camera, renderer.domElement);

controls.target.copy(ground.position);
controls.enableDamping = true;
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
let dragStart = { x: 0, y: 0 };
let shootPower = 0;
const shootDirection = new THREE.Vector3();

window.addEventListener("pointerdown", (event) => {
  if (holeCompleted || golfBody.velocity.length() > 0.2) {
    return;
  }

  isDragging = true;
  dragStart.x = event.clientX;
  dragStart.y = event.clientY;
  arrowHelper.visible = true;
  controls.enabled = false;
});

window.addEventListener("pointermove", (event) => {
  if (!isDragging) {
    return;
  }

  const dx = dragStart.x - event.clientX;
  const dy = dragStart.y - event.clientY;

  shootPower = Math.min(Math.hypot(dx, dy) / 10, 25);

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

window.addEventListener("pointerup", () => {
  if (!isDragging) {
    return;
  }

  isDragging = false;
  arrowHelper.visible = false;
  controls.enabled = true;

  if (shootPower > 0.5) {
    const impulse = new CANNON.Vec3(
      shootDirection.x * shootPower,
      0,
      shootDirection.z * shootPower
    );

    golfBody.applyImpulse(impulse, golfBody.position);
  }

  shootPower = 0;
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
      console.log("Bravo ! La balle est dans le trou.");
    }

    // Détection de chute dans le vide (hors de la map)
    if (golfBody.position.y < -5) {
      isDragging = false;
      arrowHelper.visible = false;
      controls.enabled = true;
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