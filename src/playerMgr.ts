import { engine, Transform, executeTask } from '@dcl/sdk/ecs'
import { Vector3, Quaternion } from '@dcl/sdk/math'
import { getUserData, UserData } from '~system/UserIdentity'

export class PlayerManager{

	playerInfoRec: boolean
	playerUserData: any
	pos: Vector3
	rot: Quaternion

    candleCount: number = 0
    hasPenPaper: boolean = false
    hasToy: boolean = false
    hasFood: boolean = false
    hasPicture: boolean = false

	constructor(){

		console.log("PlayerManager: constructor running")

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
	
}