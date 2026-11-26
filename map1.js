import {
  addBoxObstacle,
  createFlat,
  createHoleAndFlag,
  createRamp,
  createTurnRight
} from "./mapUtils.js";

export function createMap({ scene, world, defaultMaterial }) {
    const physicsObjects = [];
    const context = { scene, world, defaultMaterial };
    const holeVisuals = createHoleAndFlag(
      context,
      { x: 2, y: 6.35, z: 35 },
      0.45
    );

    physicsObjects.push(
        createRamp(
            context,
            { x: 0, y: 3, z: 20 },
            { width: 10, run: 20, rise: 6.3},
            0x3c9b57
        )
        );
    physicsObjects.push(
    createFlat(
        context,
        { x: 0, y: 6.2, z: 37.5 },
        { width: 10, length: 15, thickness: 0.2 },
        0x2e8b57
        )
        );

        physicsObjects.push(addBoxObstacle(context,{ x: -10, y: 0.35, z: 0 }, { x: 0.7, y: 0.7, z: 20 }));
        physicsObjects.push(addBoxObstacle(context,{ x: 10, y: 0.35, z: 0 }, { x: 0.7, y: 0.7, z: 20 }));
        physicsObjects.push(addBoxObstacle(context,{ x: 7.5, y: 0.35, z: 10 }, { x: 5, y: 0.7, z: 0.7 }));
        physicsObjects.push(addBoxObstacle(context,{ x: -7.5, y: 0.35, z: 10 }, { x: 5, y: 0.7, z: 0.7 }));
        physicsObjects.push(addBoxObstacle(context,{ x: 0, y: 0.35, z: -10 }, { x: 20, y: 0.7, z: 0.7 }));
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
