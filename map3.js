// maps/map3.js
import * as THREE from "three";
import {
  createFlat,
  createHoleAndFlag,
  addBoxObstacle,
  cylindreObstacles
} from "./mapUtils.js";

function addWallAlongZ(context, physicsObjects, xCenter, zStart, zEnd, wallHeight, wallThick, wallY) {
  const length = zEnd - zStart;
  const zCenter = (zStart + zEnd) / 2;
  physicsObjects.push(
    addBoxObstacle(
      context,
      { x: xCenter, y: wallY, z: zCenter },
      { x: wallThick, y: wallHeight, z: length }
    )
  );
}

function addWallAlongX(context, physicsObjects, zCenter, xStart, xEnd, wallHeight, wallThick, wallY) {
  const width = xEnd - xStart;
  const xCenter = (xStart + xEnd) / 2;
  physicsObjects.push(
    addBoxObstacle(
      context,
      { x: xCenter, y: wallY, z: zCenter },
      { x: width, y: wallHeight, z: wallThick }
    )
  );
}

export function createMap({ scene, world, defaultMaterial }) {
  const physicsObjects = [];
  const context = { scene, world, defaultMaterial };

  // Paramètres du couloir linéaire (sans virage)
  const trackWidth = 6;
  const trackThickness = 0.2;
  const trackY = -0.1; // Surface supérieure à y = 0
  const trackColor = 0x2e8b57;

  const wallHeight = 0.7;
  const wallThick = 0.5;
  const wallY = 0.35; // Base à y = 0, sommet à y = 0.7
  const obstacleColor = 0x8b4513;
  const cylinderColor = 0xd2691e;

  // =========================================================================
  // 1. ZONE DE DÉPART (Sol dans index.js : x in [-10, 10], z in [-10, 10])
  // Sortie vers +Z sur x in [-3, 3] à z = 10.
  // =========================================================================
  addWallAlongX(context, physicsObjects, -10.25, -10.5, 10.5, wallHeight, wallThick, wallY);
  addWallAlongZ(context, physicsObjects, -10.25, -10.0, 10.0, wallHeight, wallThick, wallY);
  addWallAlongZ(context, physicsObjects, 10.25, -10.0, 10.0, wallHeight, wallThick, wallY);
  addWallAlongX(context, physicsObjects, 10.25, -10.5, -3.0, wallHeight, wallThick, wallY);
  addWallAlongX(context, physicsObjects, 10.25, 3.0, 10.5, wallHeight, wallThick, wallY);

  // =========================================================================
  // 2. COULOIR LINÉAIRE (Vers +Z) :
  // x in [-3, 3], z in [10, 46] -> longueur = 36, centre (0, trackY, 28)
  // =========================================================================
  physicsObjects.push(
    createFlat(
      context,
      { x: 0, y: trackY, z: 28 },
      { width: trackWidth, length: 36, thickness: trackThickness },
      trackColor
    )
  );

  // Bordures gauche, droite et fond du couloir
  addWallAlongZ(context, physicsObjects, -3.25, 10.0, 46.5, wallHeight, wallThick, wallY);
  addWallAlongZ(context, physicsObjects, 3.25, 10.0, 46.5, wallHeight, wallThick, wallY);
  addWallAlongX(context, physicsObjects, 46.25, -3.5, 3.5, wallHeight, wallThick, wallY);

  // =========================================================================
  // 3. OBSTACLES SUR LE CHEMIN VERS LE DRAPEAU (addBoxObstacle + cylindreObstacles)
  // =========================================================================
  // Obstacle 1 : bloc côté gauche (x in [-3.0, -0.2], z in [17.5, 18.7])
  physicsObjects.push(
    addBoxObstacle(
      context,
      { x: -1.6, y: wallY, z: 18.1 },
      { x: 2.8, y: wallHeight, z: 1.2 },
      obstacleColor
    )
  );

  // Poteaux cylindriques intermédiaires en quinconce (z = 22)
  physicsObjects.push(
    cylindreObstacles(
      context,
      { x: -1.1, y: wallY, z: 22.0 },
      { radius: 0.45, height: wallHeight },
      cylinderColor
    )
  );
  physicsObjects.push(
    cylindreObstacles(
      context,
      { x: 1.3, y: wallY, z: 22.0 },
      { radius: 0.45, height: wallHeight },
      cylinderColor
    )
  );

  // Obstacle 2 : bloc côté droit (x in [0.2, 3.0], z in [25.5, 26.7])
  physicsObjects.push(
    addBoxObstacle(
      context,
      { x: 1.6, y: wallY, z: 26.1 },
      { x: 2.8, y: wallHeight, z: 1.2 },
      obstacleColor
    )
  );

  // Poteau cylindrique central (z = 30)
  physicsObjects.push(
    cylindreObstacles(
      context,
      { x: 0, y: wallY, z: 30.0 },
      { radius: 0.55, height: wallHeight },
      cylinderColor
    )
  );

  // Obstacle 3 : bloc côté gauche avant la zone finale (x in [-3.0, -0.3], z in [33.5, 34.7])
  physicsObjects.push(
    addBoxObstacle(
      context,
      { x: -1.65, y: wallY, z: 34.1 },
      { x: 2.7, y: wallHeight, z: 1.2 },
      obstacleColor
    )
  );

  // Obstacle 4 : double chicane laissant un passage central étroit (x in [-1.1, 1.1], z in [37.5, 38.3])
  physicsObjects.push(
    addBoxObstacle(
      context,
      { x: -2.05, y: wallY, z: 37.9 },
      { x: 1.9, y: wallHeight, z: 0.8 },
      obstacleColor
    )
  );
  physicsObjects.push(
    addBoxObstacle(
      context,
      { x: 2.05, y: wallY, z: 37.9 },
      { x: 1.9, y: wallHeight, z: 0.8 },
      obstacleColor
    )
  );

  // Poteaux cylindriques de défense juste devant le trou (z = 40.2)
  physicsObjects.push(
    cylindreObstacles(
      context,
      { x: -0.9, y: wallY, z: 40.2 },
      { radius: 0.35, height: wallHeight },
      cylinderColor
    )
  );
  physicsObjects.push(
    cylindreObstacles(
      context,
      { x: 0.9, y: wallY, z: 40.2 },
      { radius: 0.35, height: wallHeight },
      cylinderColor
    )
  );

  // =========================================================================
  // 4. TROU ET DRAPEAU À LA FIN DU COULOIR (surface y = 0)
  // =========================================================================
  const holeRadius = 0.45;
  const holeVisuals = createHoleAndFlag(
    context,
    { x: 0, y: 0, z: 42 },
    holeRadius
  );

  return {
    physicsObjects,
    visualObjects: [
      holeVisuals.hole,
      holeVisuals.flagPole,
      holeVisuals.flag
    ],
    holePosition: holeVisuals.holePosition,
    holeRadius: holeVisuals.holeRadius
  };
}