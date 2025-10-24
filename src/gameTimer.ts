
import { GameManager } from './gameMgr'

import {engine} from '@dcl/sdk/ecs'


export class GameTimer{
    gameMgr: GameManager
    msElapsedInGame: number = 0
    targetTime: number = 0
    waiting:boolean = false
    stop:boolean = false
	
	constructor(_gameMgr: GameManager){

		console.log("GameTimer: constructor running")
        
        this.gameMgr = _gameMgr
        engine.addSystem(this.timerSystem)

	}

    timerSystem(dt: number) {

        
        

        if(this.msElapsedInGame == undefined || this.msElapsedInGame == null){
            console.log("msElapsedInGame is undefined or null, setting to 0")
            this.msElapsedInGame = 0
        }

        /* if(this.gameMgr.messageText){
            this.gameMgr.messageText = this.msElapsedInGame.toString()
        } */

        /* if(this.msElapsedInGame > 0){
            this.gameMgr.messageText = this.msElapsedInGame.toString()
        } */

        //console.log("dt: ", dt)
        if(!this.stop){
        //console.log("elapsedBefore: ", this.msElapsedInGame)
        this.msElapsedInGame += dt
        //console.log("elapsedAfter: ", this.msElapsedInGame)
        //this.stop = true
        }

        //console.log("total time elapsed in game: ", this.msElapsedInGame)

        if(this.waiting && this.msElapsedInGame >= this.targetTime){
            this.waiting = false
            //this.gameMgr.timerComplete()
        }

    }

    setWaitTime(_waitTime: number){
        
        this.targetTime = this.msElapsedInGame + _waitTime
        console.log("setting target time to: ", this.targetTime)
        this.waiting = true
    }
    
}