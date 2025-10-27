import { engine, Transform, executeTask } from '@dcl/sdk/ecs'
import { Vector3, Quaternion } from '@dcl/sdk/math'
import { getUserData, UserData } from '~system/UserIdentity'
import { GameManager } from './gameMgr'

import { movePlayerTo, triggerEmote  } from '~system/RestrictedActions'
import { FallTriggerZone } from './components/triggerZones'

export class PlayerManager{

	gameMgr: GameManager

	playerInfoRec: boolean
	playerUserData: any
	pos: Vector3
	rot: Quaternion

    candleCount: number = 0
    hasPenPaper: boolean = false
    hasToy: boolean = false
    hasFood: boolean = false
    hasPicture: boolean = false
    ritualComplete: boolean = false

	// Checkpoint system
    currentCheckpoint: string = 'start'
    checkpointPosition: Vector3 = Vector3.create(0, 0, 0)
    checkpointRotation: Quaternion = Quaternion.fromEulerDegrees(0, 0, 0)

	checkpointSet: boolean = false
	headedUp: boolean = true
	upperZoneActive: boolean = false

	constructor(_gameMgr: GameManager){

		console.log("PlayerManager: constructor running")

		this.gameMgr = _gameMgr

        //init player info status
		this.playerInfoRec = false
		this.pos = Vector3.create(0,0,0)
		this.rot = Quaternion.fromEulerDegrees(0,0,0)

        //init all progression
		this.candleCount = 0
        this.hasPenPaper = false
        this.hasToy = false
        this.hasFood = false
        this. hasPicture = false
        this.ritualComplete = false

		//init checkpoint
        this.currentCheckpoint = 'start'
        this.checkpointPosition = Vector3.create(0, 0, 0)
        this.checkpointRotation = Quaternion.fromEulerDegrees(0, 0, 0)
		
		this.checkpointSet = false
		this.headedUp = true
		this.upperZoneActive = false

        //start async function to get player data
		executeTask(async () => {
		  this.playerUserData = await getUserData({})
		  this.initPlayerTracking()
		  //console.log('PLAYER DATA NAME.....' + this.playerUserData.data.displayName)
		})
		
	}

	initPlayerTracking(){

		//grab the players current position as the starting value
		this.pos = Transform.get(engine.PlayerEntity).position
		this.rot = Transform.get(engine.PlayerEntity).rotation

		//start the tracking system for pos/rot
		engine.addSystem(  () => {
			this.pos = Transform.get(engine.PlayerEntity).position
			this.rot = Transform.get(engine.PlayerEntity).rotation
		})

		//mark that we are all set up
		this.playerInfoRec = true
	}

	// Set a new checkpoint
    setCheckpoint(checkpointId: string, position: Vector3, rotation: Quaternion) {
        this.currentCheckpoint = checkpointId
        this.checkpointPosition = position
        this.checkpointRotation = rotation
        console.log(`Checkpoint set: ${checkpointId}`)

		/* if(this.checkpointSet == false){
			this.checkpointSet = true
			this.gameMgr.turnOnFallZone()
		} */
    }

    // Respawn at current checkpoint
    respawnAtCheckpoint() {
        console.log(`Respawning at checkpoint: ${this.currentCheckpoint}`)
        //const playerTransform = Transform.getMutable(engine.PlayerEntity)
		movePlayerTo({
			//-34,50,52 (temple landing)
			newRelativePosition: this.checkpointPosition,
			cameraTarget: this.checkpointRotation
		})
        //playerTransform.position = this.checkpointPosition
        //playerTransform.rotation = this.checkpointRotation
    }

	disableCheckpoints(){
		this.checkpointSet = false
		this.gameMgr.turnOffFallZone()
	}
	
}