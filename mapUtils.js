import * as THREE from "three";
import * as CANNON from "cannon-es";

function addBoxPart(
  { scene, world, defaultMaterial },
  position,
  size,
  color,
  rotation = { x: 0, y: 0, z: 0 }
) {
  const mesh = new THREE.Mesh(
    new THREE.BoxGeometry(size.width, size.height, size.length),
    new THREE.MeshStandardMaterial({ color, roughness: 0.8 })
  );

  mesh.position.set(position.x, position.y, position.z);
  mesh.rotation.set(rotation.x, rotation.y, rotation.z);
  mesh.castShadow = true;
  mesh.receiveShadow = true;
  scene.add(mesh);

  const body = new CANNON.Body({
    type: CANNON.Body.STATIC,
    material: defaultMaterial,
    shape: new CANNON.Box(
      new CANNON.Vec3(size.width / 2, size.height / 2, size.length / 2)
    )
  });

  body.position.set(position.x, position.y, position.z);
  body.quaternion.setFromEuler(rotation.x, rotation.y, rotation.z);
  world.addBody(body);

  return { mesh, body };
}

export function createFlat(context, position, size, color) {
  return addBoxPart(
    context,
    position,
    {
      width: size.width,
      length: size.length,
      height: size.thickness
    },
    color
  );
}

export function createRamp(context, position, size, color) {
  const angle = Math.atan2(size.rise, size.run);
  const slopeLength = Math.hypot(size.run, size.rise);
  const thickness = 0.3;

  return addBoxPart(
    context,
    position,
    {
      width: size.width,
      length: slopeLength,
      height: thickness
    },
    color,
    { x: -angle, y: 0, z: 0 }
  );
}

export function createTurnRight(context, position, size, color) {
  return [
    createFlat(
      context,
      { x: position.x, y: position.y, z: position.z - size.length / 2 },
      size,
      color
    ),
    addBoxPart(
      context,
      { x: position.x + size.length / 2, y: position.y, z: position.z },
      {
        width: size.width,
        length: size.length,
        height: size.thickness
      },
      color,
      { x: 0, y: Math.PI / 2, z: 0 }
    )
  ];
}

export function createTurnLeft(context, position, size, color) {
  return [
    createFlat(
      context,
      { x: position.x, y: position.y, z: position.z - size.length / 2 },
      size,
      color
    ),
    addBoxPart(
      context,
      { x: position.x - size.length / 2, y: position.y, z: position.z },
      {
        width: size.width,
        length: size.length,
        height: size.thickness
      },
      color,
      { x: 0, y: -Math.PI / 2, z: 0 }
    )
  ];
}

export function createHoleAndFlag({ scene }, position, holeRadius = 0.45) {
  const holePosition = new THREE.Vector3(
    position.x,
    position.y,
    position.z
  );

  const hole = new THREE.Mesh(
    new THREE.CylinderGeometry(holeRadius, holeRadius, 0.03, 32),
    new THREE.MeshStandardMaterial({ color: 0x111111, roughness: 1 })
  );
  hole.position.set(holePosition.x, holePosition.y + 0.015, holePosition.z);
  hole.receiveShadow = true;
  scene.add(hole);

  const flagPole = new THREE.Mesh(
    new THREE.CylinderGeometry(0.025, 0.025, 2, 12),
    new THREE.MeshStandardMaterial({ color: 0xffffff })
  );
  flagPole.position.set(holePosition.x, holePosition.y + 1, holePosition.z);
  flagPole.castShadow = true;
  scene.add(flagPole);

  const flag = new THREE.Mesh(
    new THREE.PlaneGeometry(0.7, 0.4),
    new THREE.MeshStandardMaterial({
      color: 0xff3333,
      side: THREE.DoubleSide
    })
  );
  flag.position.set(
    holePosition.x + 0.35,
    holePosition.y + 1.7,
    holePosition.z
  );
  flag.castShadow = true;
  scene.add(flag);

  return { holePosition, holeRadius, hole, flagPole, flag };
}

// Fonction d'ajout d'obstacles
export function addBoxObstacle(context, position, size, color = 0x8b4513) {
  return addBoxPart(
    context,
    position,
    {
      width: size.x,
      height: size.y,
      length: size.z
    },
    color
  );
}

// Fonction d'ajout d'obstacles cylindriques
export function cylindreObstacles(
  { scene, world, defaultMaterial },
  position,
  size,
  color = 0xd2691e
) {
  const radius = size.radius ?? 0.5;
  const height = size.height ?? 0.7;

  const mesh = new THREE.Mesh(
    new THREE.CylinderGeometry(radius, radius, height, 24),
    new THREE.MeshStandardMaterial({ color, roughness: 0.7 })
  );
  mesh.position.set(position.x, position.y, position.z);
  mesh.castShadow = true;
  mesh.receiveShadow = true;
  scene.add(mesh);

  const body = new CANNON.Body({
    type: CANNON.Body.STATIC,
    material: defaultMaterial,
    shape: new CANNON.Cylinder(radius, radius, height, 24)
  });
  body.position.set(position.x, position.y, position.z);
  world.addBody(body);

  return { mesh, body };
}



