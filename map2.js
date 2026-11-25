import {
  createFlat,
  createHoleAndFlag,
  addBoxObstacle
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

  // Paramètres généraux : piste de largeur 6, surface à y = 0
  const W = 6;
  const trackThickness = 0.2;
  const trackY = -0.1; // Dessus de la dalle à y = 0
  const trackColor = 0x2e8b57;

  const wallHeight = 0.7;
  const wallThick = 0.5;
  const wallY = 0.35; // Base à y = 0, sommet à y = 0.7

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
  // 2. LIGNE DROITE 1 (Vers +Z) :
  // x in [-3, 3], z in [10, 22] -> centre (0, trackY, 16)
  // =========================================================================
  physicsObjects.push(
    createFlat(
      context,
      { x: 0, y: trackY, z: 16 },
      { width: W, length: 12, thickness: trackThickness },
      trackColor
    )
  );
  addWallAlongZ(context, physicsObjects, -3.25, 10.0, 22.0, wallHeight, wallThick, wallY);
  addWallAlongZ(context, physicsObjects, 3.25, 10.0, 22.0, wallHeight, wallThick, wallY);

  // =========================================================================
  // 3. VIRAGE 1 (Vers +X) avec 2 createFlat sans trou :
  // - Flat 1A : x in [-3, 3], z in [22, 28] -> centre (0, trackY, 25)
  // - Flat 1B : x in [3, 9], z in [22, 28] -> centre (6, trackY, 25)
  // =========================================================================
  physicsObjects.push(
    createFlat(
      context,
      { x: 0, y: trackY, z: 25 },
      { width: W, length: 6, thickness: trackThickness },
      trackColor
    )
  );
  physicsObjects.push(
    createFlat(
      context,
      { x: 6, y: trackY, z: 25 },
      { width: 6, length: 6, thickness: trackThickness },
      trackColor
    )
  );
  addWallAlongZ(context, physicsObjects, -3.25, 22.0, 28.5, wallHeight, wallThick, wallY);
  addWallAlongX(context, physicsObjects, 28.25, -3.5, 9.0, wallHeight, wallThick, wallY);
  addWallAlongX(context, physicsObjects, 21.75, 3.0, 9.0, wallHeight, wallThick, wallY);

  // =========================================================================
  // 4. LIGNE DROITE 2 (Vers +X) :
  // x in [9, 21], z in [22, 28] -> centre (15, trackY, 25)
  // =========================================================================
  physicsObjects.push(
    createFlat(
      context,
      { x: 15, y: trackY, z: 25 },
      { width: 12, length: W, thickness: trackThickness },
      trackColor
    )
  );
  addWallAlongX(context, physicsObjects, 28.25, 9.0, 21.0, wallHeight, wallThick, wallY);
  addWallAlongX(context, physicsObjects, 21.75, 9.0, 21.5, wallHeight, wallThick, wallY);

  // =========================================================================
  // 5. VIRAGE 2 (Vers +Z) avec 2 createFlat sans trou :
  // - Flat 2A : x in [21, 27], z in [22, 28] -> centre (24, trackY, 25)
  // - Flat 2B : x in [21, 27], z in [28, 34] -> centre (24, trackY, 31)
  // Le passage vers +Z est ouvert sur tout x in [21, 27] à z = 28 !
  // =========================================================================
  physicsObjects.push(
    createFlat(
      context,
      { x: 24, y: trackY, z: 25 },
      { width: 6, length: 6, thickness: trackThickness },
      trackColor
    )
  );
  physicsObjects.push(
    createFlat(
      context,
      { x: 24, y: trackY, z: 31 },
      { width: W, length: 6, thickness: trackThickness },
      trackColor
    )
  );
  // Bordure extérieure Est continue de z = 21.5 à z = 34
  addWallAlongZ(context, physicsObjects, 27.25, 21.5, 34.0, wallHeight, wallThick, wallY);
  // Bordure intérieure Ouest de Flat 2B (z de 28 à 34)
  addWallAlongZ(context, physicsObjects, 20.75, 28.0, 34.0, wallHeight, wallThick, wallY);

  // =========================================================================
  // 6. LIGNE DROITE FINALE (Vers +Z) :
  // x in [21, 27], z in [34, 46] -> centre (24, trackY, 40)
  // =========================================================================
  physicsObjects.push(
    createFlat(
      context,
      { x: 24, y: trackY, z: 40 },
      { width: W, length: 12, thickness: trackThickness },
      0x3c9b57
    )
  );
  addWallAlongZ(context, physicsObjects, 20.75, 34.0, 46.5, wallHeight, wallThick, wallY);
  addWallAlongZ(context, physicsObjects, 27.25, 34.0, 46.5, wallHeight, wallThick, wallY);
  addWallAlongX(context, physicsObjects, 46.25, 20.5, 27.5, wallHeight, wallThick, wallY);

  // =========================================================================
  // 7. TROU ET DRAPEAU À LA FIN DE LA COURSE (surface y = 0)
  // =========================================================================
  const holeVisuals = createHoleAndFlag(
    context,
    { x: 24, y: 0, z: 42 },
    0.45
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