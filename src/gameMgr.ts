//import { worldInfo } from './worldData'
import { PlayerManager } from './playerMgr'

import {engine, Entity, GltfContainer, Transform} from '@dcl/sdk/ecs'
import {Vector3, Quaternion} from '@dcl/sdk/math'
import { initUi } from './uiMgr'

export class GameManager{

	playerMgr: PlayerManager

    staticEntities: Array<Entity>
	
	constructor(){

		console.log("GameManager: constructor running")

		this.staticEntities = [];

		for(var se = 0; se < data.staticParts.length; se++){
			var e = engine.addEntity()

			GltfContainer.create(e, {
				src: data.staticParts[se].src
			})

			Transform.create(e, {
				position: data.staticParts[se].pos,
				scale: data.staticParts[se].scale,
				rotation: data.staticParts[se].rot
			})

			this.staticEntities.push(e)
		}
		
		
		this.playerMgr = new PlayerManager()
	
        initUi(this)
        
		
	}
}

const data = {
        staticParts: [

            {name: "stretchedLayoutB_justLibs", pos: Vector3.create(0,0,0), rot: Quaternion.fromEulerDegrees(0,180,0), src: "models/test/stretchedLayoutB_allMovedA.glb", scale: Vector3.create(1,1,1)},
            
            //{name: "stretchedLayoutB", pos: Vector3.create(0,0,0), rot: Quaternion.fromEulerDegrees(0,180,0), src: "models/test/stretchedLayoutB.glb", scale: Vector3.create(1,1,1)},
            //{name: "stretchedLayoutB_justLibs", pos: Vector3.create(0,0,0), rot: Quaternion.fromEulerDegrees(0,180,0), src: "models/test/stretchedLayoutB_libraries.glb", scale: Vector3.create(1,1,1)},
            //{name: "stretchedLayoutB_justLibs", pos: Vector3.create(0,0,0), rot: Quaternion.fromEulerDegrees(0,180,0), src: "models/test/stretchedLayoutB_aptTownHall.glb", scale: Vector3.create(1,1,1)},
            
            {name: "candle17", pos: Vector3.create(21,3,13), rot: Quaternion.fromEulerDegrees(0,0,0), src: "models/ch/HWN20_Candle_17.glb", scale: Vector3.create(1,1,1)},
            {name: "candle18", pos: Vector3.create(21,3,12.5), rot: Quaternion.fromEulerDegrees(0,0,0), src: "models/ch/HWN20_Candle_18.glb", scale: Vector3.create(1,1,1)},
            {name: "candle19", pos: Vector3.create(21,3,12), rot: Quaternion.fromEulerDegrees(0,0,0), src: "models/ch/HWN20_Candle_19.glb", scale: Vector3.create(1,1,1)},
            {name: "candle21", pos: Vector3.create(21,3,11.5), rot: Quaternion.fromEulerDegrees(0,0,0), src: "models/ch/HWN20_Candle_21.glb", scale: Vector3.create(1,1,1)},
            {name: "candle17", pos: Vector3.create(21,3,11), rot: Quaternion.fromEulerDegrees(0,0,0), src: "models/ch/HWN20_Candle_17.glb", scale: Vector3.create(1,1,1)},
            {name: "candle20", pos: Vector3.create(21,3,10.5), rot: Quaternion.fromEulerDegrees(0,0,0), src: "models/ch/HWN20_Candle_20.glb", scale: Vector3.create(1,1,1)},
            {name: "candle21", pos: Vector3.create(21,3,10), rot: Quaternion.fromEulerDegrees(0,0,0), src: "models/ch/HWN20_Candle_21.glb", scale: Vector3.create(1,1,1)},
            

            
            //{name: "groundPartsA_00", pos: Vector3.create(20,0,0), rot: Quaternion.fromEulerDegrees(0,0,0), src: "models/test/groundPartsA_00.gltf", scale: Vector3.create(1,1,1)},
            //{name: "groundPartsA_00", pos: Vector3.create(0,0,0), rot: Quaternion.fromEulerDegrees(0,0,0), src: "models/test/groundPartsA_00.gltf", scale: Vector3.create(1,1,1)},
            
            //{name: "church", pos: Vector3.create(0,0,0), rot: Quaternion.fromEulerDegrees(0,0,0), src: "models/test/church1_finalA.gltf", scale: Vector3.create(1,1,1)},


            //{name: "testTerrain", pos: Vector3.create(0,0,0), rot: Quaternion.fromEulerDegrees(0,0,0), src: "models/testTerrain_temp.glb", scale: Vector3.create(1,1,1)},
            //{name: "halfGateA", pos: Vector3.create(-8,1,-30), rot: Quaternion.fromEulerDegrees(0,0,0), src: "models/halfGateA.gltf", scale: Vector3.create(1,1,1)},
            
            /* {name: "tree1", pos: Vector3.create(-3,2,-26), rot: Quaternion.fromEulerDegrees(0,0,0), src: "models/ch/hw/HWN20_Tree_01.glb", scale: Vector3.create(1,1,1)},
            {name: "tree1", pos: Vector3.create(4,2,-25), rot: Quaternion.fromEulerDegrees(0,0,0), src: "models/ch/hw/HWN20_Tree_02.glb", scale: Vector3.create(1,1,1)},
            {name: "tree1", pos: Vector3.create(-3,2,-22), rot: Quaternion.fromEulerDegrees(0,0,0), src: "models/ch/hw/HWN20_Tree_03.glb", scale: Vector3.create(1,1,1)},
            {name: "tree1", pos: Vector3.create(8,2,-20), rot: Quaternion.fromEulerDegrees(0,0,0), src: "models/ch/hw/HWN20_Tree_04.glb", scale: Vector3.create(1,1,1)},
            {name: "tree1", pos: Vector3.create(14,2,-22), rot: Quaternion.fromEulerDegrees(0,0,0), src: "models/ch/hw/HWN20_Tree_05.glb", scale: Vector3.create(1,1,1)},
            {name: "tree1", pos: Vector3.create(0,0,0), rot: Quaternion.fromEulerDegrees(0,0,0), src: "models/ch/hw/HWN20_Tree_06.glb", scale: Vector3.create(1,1,1)},
            {name: "tree1", pos: Vector3.create(0,0,0), rot: Quaternion.fromEulerDegrees(0,0,0), src: "models/ch/hw/HWN20_Tree_07.glb", scale: Vector3.create(1,1,1)},
            {name: "tree1", pos: Vector3.create(0,0,0), rot: Quaternion.fromEulerDegrees(0,0,0), src: "models/ch/hw/HWN20_Tree_08.glb", scale: Vector3.create(1,1,1)},
            {name: "tree1", pos: Vector3.create(0,0,0), rot: Quaternion.fromEulerDegrees(0,0,0), src: "models/ch/hw/HWN20_Tree_09.glb", scale: Vector3.create(1,1,1)}, */

            //{name: "roughPitA", pos: Vector3.create(0,0,0), rot: Quaternion.fromEulerDegrees(0,180,0), src: "models/roughPitA.gltf", scale: Vector3.create(1,1,1)},


            /* {name: "glowingFloor", pos: Vector3.create(0,0,0), rot: Quaternion.fromEulerDegrees(0,0,0), src: "models/8px8p_glowingPlane.glb", scale: Vector3.create(1,1,1)},

            
            {name: "bed2", pos: Vector3.create(18,0,-17.4), rot: Quaternion.fromEulerDegrees(0,0,0), src: "models/bed2_rough.glb", scale: Vector3.create(1,1,1)},
            {name: "church1", pos: Vector3.create(0,0,57), rot: Quaternion.fromEulerDegrees(0,0,0), src: "models/church1_rough.glb", scale: Vector3.create(1,1,1)},

            {name: "townSquare3", pos: Vector3.create(0,0,0), rot: Quaternion.fromEulerDegrees(0,180,0), src: "models/townSquare3_rough.glb", scale: Vector3.create(1,1,1)},
            {name: "house4", pos: Vector3.create(20,0,0), rot: Quaternion.fromEulerDegrees(0,0,0), src: "models/house4_rough.glb", scale: Vector3.create(2,2,2)},
            {name: "house3", pos: Vector3.create(-20,0,0), rot: Quaternion.fromEulerDegrees(0,180,0), src: "models/house3_rough.glb", scale: Vector3.create(1,1,1)},
            {name: "groundSkull", pos: Vector3.create(0,3,0), rot: Quaternion.fromEulerDegrees(0,-90,0), src: "models/groundSkull_rough.glb", scale: Vector3.create(1,1,1)},
            {name: "apartment6", pos: Vector3.create(0,0,-20), rot: Quaternion.fromEulerDegrees(0,180,0), src: "models/apartment6_rough.glb", scale: Vector3.create(1,1,1)},

            {name: "shop4", pos: Vector3.create(-20,0,20), rot: Quaternion.fromEulerDegrees(0,90,0), src: "models/shop4_rough.glb", scale: Vector3.create(1.5,1.5,1.5)},
            {name: "library1", pos: Vector3.create(20,0,20), rot: Quaternion.fromEulerDegrees(0,180,0), src: "models/library1_rough.glb", scale: Vector3.create(1,1,1)},
            {name: "library3", pos: Vector3.create(30,0,40), rot: Quaternion.fromEulerDegrees(0,0,0), src: "models/library3_rough.glb", scale: Vector3.create(1,1,1)}, */
            
        ],
        tpInteractables: [
            //{name: "tpToLandingAreaTestZone", promptText: "TP TO LANDING AREA TEST ZONE", destTestZoneIndex: 0, targetSpawnIndex: 0, pos: Vector3.create(10,.25,100), rot: Quaternion.fromEulerDegrees(0,0,0), src: "models/landingZone/tpMachine_lz.glb", scale: Vector3.create(1,1,1)},
        ],
        movingEntities: [

            //blue platformA
            //{name: "2x2_movPlat", movementType: "twoPointLoop", startPos: Vector3.create(-10,1.25,22), endPos: Vector3.create(-10,5,22), duration: 2000, rot: Quaternion.fromEulerDegrees(0,0,0), src: "models/alPvpZone/pvpPartsA/step_2x2.gltf", scale: Vector3.create(1,1,1)},
            
        ],
        collectables: [
            
        ],
    }