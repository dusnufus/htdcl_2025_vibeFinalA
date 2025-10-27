//import { worldInfo } from './worldData'
import { PlayerManager } from './playerMgr'

import {ColliderLayer, engine, Entity, GltfContainer, MeshCollider, MeshRenderer, Transform, TriggerArea, triggerAreaEventsSystem, AvatarShape} from '@dcl/sdk/ecs'
import {Vector3, Quaternion} from '@dcl/sdk/math'
import {setUiForMissionState } from './uiMgr'
import { CandleCollectable, JarCollectable } from './components/collectables'

import { HouseTriggerZone, CheckpointTriggerZone, FallTriggerZone, DisableCheckpointsTriggerZone, ReverseCheckpointsTriggerZone, ToggleUpperFallZoneTriggerZone} from './components/triggerZones'
//import { TempZoneClicker } from './components/tempZoneClickers'
import { TpVideoRoom } from './components/tpVideoRoom'
//import { GameTimer } from './gameTimer'
import { movePlayerTo, triggerEmote  } from '~system/RestrictedActions'
import { NPC } from './components/npc'

import { 
    createGirlNPC, 
    createShopOwnerNPC, 
    createTempleShamanNPC, 
    createOldLadyNPC, 
    createDoormanNPC, 
    createLibrarianNPC
} from './npcCreation'

export class GameManager{

    //player manager class ref
	playerMgr: PlayerManager

    staticEntities: Array<Entity>

    girl!: NPC
    shopKeeper!: NPC
    templeShaman!: NPC  
    oldLady!: NPC
    doorman!: NPC
    librarian!: NPC

    //this string will control all the transitions and progression
    missionState: string = "introPlaying"

    //mission title (macro scale)
    //this shows up in the main title of the UI display
    missionTitle: string = ""

    girlHouseTrigger: any

    tpVideoRoom: TpVideoRoom

    // Dialog system
    dialogActive: boolean = false
    dialogNPCName: string = ""
    dialogText: string = ""
    dialogSpeaker: 'player' | 'npc' = 'npc'
    dialogHasNext: boolean = false
    dialogPlayerChoices: { text: string, nextDialogId: string }[] = []
    currentDialogNPC: any = null
    
    //tempGirlHouseClicker: any

    messageText: string = "nothing"

    candles: Array<Entity>
    candleIndexCollected: Array<number>

    jar: any

    checkpointTriggerZones: Array<Entity>
    fallTriggerZone: any
    disableCheckpointsTriggerZone: any
    reverseCheckpointsTriggerZone: Entity
    upperFallZoneToggleTriggerZone: Entity

	constructor(){
		//console.log("GameManager: constructor running")

        this.playerMgr = new PlayerManager(this)

		this.staticEntities = []
        this.placeStaticEntities()

        //create NPCs
        this.girl = createGirlNPC(this)
        this.shopKeeper = createShopOwnerNPC(this)
        this.templeShaman = createTempleShamanNPC(this)
        this.oldLady = createOldLadyNPC(this)
        this.doorman = createDoormanNPC(this)
        this.librarian = createLibrarianNPC(this)

        //init mission state and display title
        this.missionState = "introPlaying"
        this.missionTitle = "EXPLORE THE TOWN"

        //activate a trigger for the girl's house
        this.girlHouseTrigger = HouseTriggerZone(this, Vector3.create(34,16,57), Vector3.create(28,7,32), true)
	
        //set the UI for the mission state
        setUiForMissionState(this, this.missionState)
        
        //create the video room and set the intro video
		this.tpVideoRoom = new TpVideoRoom(this, "models/test/tpVideoRoomA.gltf", "models/test/tpVideoScreenA_noTex.gltf", 5)
        this.tpVideoRoom.setVideo("videos/toTitleA_medium.mp4", 3, 3)
        
        //init any arrays/vars that will be used later in the game progression
        this.candles = []
        this.candleIndexCollected = []

        this.checkpointTriggerZones = []
        //in the beginning, we are comingup the tunnel and spawn the upward checkpoint trigger zones
        for(var ctz = 0; ctz < data.checkpointTriggerZones_up.length; ctz++){
            this.checkpointTriggerZones.push(CheckpointTriggerZone( this, data.checkpointTriggerZones_up[ctz].name, 
                                                                    data.checkpointTriggerZones_up[ctz].pos, 
                                                                    data.checkpointTriggerZones_up[ctz].scale, 
                                                                    data.checkpointTriggerZones_up[ctz].respawnPos, 
                                                                    data.checkpointTriggerZones_up[ctz].respawnRot, 
                                                                    true))
        }
        
        //the fall zone should not be on at this point, but would only be on if checkpoints were being used already
        if(this.playerMgr.checkpointSet == true){
            console.log("GameManager: turning on fall zone")
            this.turnOnFallZone()
        }

        this.reverseCheckpointsTriggerZone = ReverseCheckpointsTriggerZone(this, Vector3.create(-39.5,46,53), Vector3.create(6,6,6), true)

        this.upperFallZoneToggleTriggerZone = ToggleUpperFallZoneTriggerZone(this, Vector3.create(1.75,40,58), Vector3.create(6,6,6), true)
	}

    adjustUpperFallZone(){
        if(this.playerMgr.upperZoneActive == false){
            this.playerMgr.upperZoneActive = true
            const mutableTransform_fz = Transform.getMutable(this.fallTriggerZone)
            mutableTransform_fz.position = Vector3.create(0,22,0)

            const mutableTransform_toggle = Transform.getMutable(this.upperFallZoneToggleTriggerZone)
            mutableTransform_toggle.position = Vector3.create(11.82,36,58.3)
        } else {
            this.playerMgr.upperZoneActive = false
            const mutableTransform_fz = Transform.getMutable(this.fallTriggerZone)
            mutableTransform_fz.position = Vector3.create(0,10,0)

            const mutableTransform_toggle = Transform.getMutable(this.upperFallZoneToggleTriggerZone)
            mutableTransform_toggle.position = Vector3.create(1.75,40,58)
        }

    }

    reverseCheckpoints(){
        //remove the reverse checkpoints trigger zone )from current location)
        engine.removeEntity(this.reverseCheckpointsTriggerZone)

        //remove the current checkpoint trigger zones
        for(var ctz = 0; ctz < this.checkpointTriggerZones.length; ctz++){
            engine.removeEntity(this.checkpointTriggerZones[ctz])
        }
        //zero out the array
        this.checkpointTriggerZones = []

        if(this.playerMgr.headedUp == true){
            //turn the player around
            this.playerMgr.headedUp = false
            //create the downward checkpoint trigger zones
            for(var ctz = 0; ctz < data.checkpointTriggerZones_down.length; ctz++){
                this.checkpointTriggerZones.push(CheckpointTriggerZone( this, data.checkpointTriggerZones_down[ctz].name, 
                                                                        data.checkpointTriggerZones_down[ctz].pos, 
                                                                        data.checkpointTriggerZones_down[ctz].scale, 
                                                                        data.checkpointTriggerZones_down[ctz].respawnPos, 
                                                                        data.checkpointTriggerZones_down[ctz].respawnRot, 
                                                                        true))
            }
            //spawn the reverse checkpoints trigger zone (at bottom of the bone bridge)
            this.reverseCheckpointsTriggerZone = ReverseCheckpointsTriggerZone(this, Vector3.create(-46,30,-23.4), Vector3.create(8,8,8), true)
        } else {
            //turn the player around
            this.playerMgr.headedUp = true
            //create the upward checkpoint trigger zones
            for(var ctz = 0; ctz < data.checkpointTriggerZones_up.length; ctz++){
                this.checkpointTriggerZones.push(CheckpointTriggerZone( this, data.checkpointTriggerZones_up[ctz].name, 
                                                                        data.checkpointTriggerZones_up[ctz].pos, 
                                                                        data.checkpointTriggerZones_up[ctz].scale, 
                                                                        data.checkpointTriggerZones_up[ctz].respawnPos, 
                                                                        data.checkpointTriggerZones_up[ctz].respawnRot, 
                                                                        true))
            }
            //spawn the reverse checkpoints trigger zone (at temple landing)
            this.reverseCheckpointsTriggerZone = ReverseCheckpointsTriggerZone(this, Vector3.create(-39.5,46,53), Vector3.create(6,6,6), true)
        }
    }

    turnOnFallZone(){
        this.fallTriggerZone = FallTriggerZone(this, Vector3.create(0,10,0), Vector3.create(160,20,160), true)
        //also, create the disable checkpoints trigger zone
        this.disableCheckpointsTriggerZone = DisableCheckpointsTriggerZone(this, Vector3.create(-60,30,-37.5), Vector3.create(6,6,6), true)
    }

    turnOffFallZone(){
        engine.removeEntity(this.fallTriggerZone)
        engine.removeEntity(this.disableCheckpointsTriggerZone)
    }

    videoComplete(){

        console.log('GameManager: video playback complete')

        // Handle video completion based on missionState

        //when intro cutscene is complete..
        if(this.missionState == "introPlaying"){
            //change the mission state to exploring town
            this.missionState = "exploringTown"

            //this.messageText = "Video complete!"

            //move the player to the player's house starting point
            movePlayerTo({
                //-34,50,52 (temple landing)
                newRelativePosition: Vector3.create(37.5,21,-19),//37.5,19,-19 (player's house position)
                cameraTarget: Vector3.create(10,27,9)
            })

            //recall the UI for the new mission state
            setUiForMissionState(this, this.missionState)
        }
        else if(this.missionState == "ritualCutscenePlaying"){
            //handle end of the ritual cutscene
        }
        else if(this.missionState == "endCutscenePlaying"){
            //handle the end of the game
        }
    }

    foundGirl(){

        //this is run when the player triggers the girl's house trigger

        //remove the girl house trigger
        engine.removeEntity(this.girlHouseTrigger)

        //start the girl running out of the house
        this.girl.startWaypointSet('runOutOfHouse')
        
    }

    candleMissionInit(){

        this.girl.startWaypointSet('walkToChurch')

        //spawn candles
        for(var c = 0; c < data.candleCollectables.length; c++){
			
            var e: Entity = CandleCollectable(    this, 
                                                        c, 
                                                        data.candleCollectables[c].src, 
                                                        data.candleCollectables[c].pos, 
                                                        data.candleCollectables[c].scale, 
                                                        data.candleCollectables[c].rot
                                                    )
                                

			this.candles.push(e)
		}
    }

    candleCollected(_candleIndex:number){
        if(!this.candleIndexCollected.includes(_candleIndex) && this.playerMgr.candleCount <= 7){
            this.candleIndexCollected.push(_candleIndex)
            this.playerMgr.candleCount ++;
            engine.removeEntity(this.candles[_candleIndex])

            //the item check would only be if we do all the ritual collections in any order. 
            //for now, we just check if we have enough candles.
            if(this.playerMgr.candleCount >= 7){
                this.candleMissionComplete()
            }
            //this.itemCheck();
        }
    }

    candleMissionComplete(){
        //remove candles
        /* for(var c = 0; c < this.candles.length; c++){
            engine.removeEntity(this.candles[c])
        }
        this.candles = [] */
        this.missionState = 'candlesCollected'
        this.missionTitle = 'TALK TO THE GIRL'
        this.girl.startWaypointSet('endTheSearch')
    }

    shopKeeperGivingJar(){
        this.missionState = 'takeTheJar'
        this.missionTitle = 'TAKE THE JAR'
        //spawn the jar
        this.jar = JarCollectable(this, "models/final/emptyJarB.gltf", Vector3.create(-23.65,11.85,16.55), Vector3.create(1,1,1), Quaternion.fromEulerDegrees(0,0,0))
        
    }

    jarCollected(){

        this.missionState = 'haveTheJar'
        this.missionTitle = 'TALK TO THE GIRL'

        this.girl.prepareConversation('tellAboutJar')

        engine.removeEntity(this.jar)
        //this.jar = null
    }

    prepareTheGraveyard(){

        //TODO: add the graveyard trigger zone
        

        this.missionState = 'headed to the graveyard'
        this.missionTitle = 'COLLECT THE WHISPER'
        this.girl.startWaypointSet('walkToGraveyard')
    }

    arrivedAtGraveyard(){
        this.missionState = 'arrivedAtGraveyard'
        //TODO: animate the gate opening
        //TODO: remove the collider keeping player out of the graveyard?
    }

    itemCheck(){
        //check if all the items are collected
        if( this.playerMgr.candleCount >= 7 && 
            this.playerMgr.hasPenPaper == true &&
            this.playerMgr.hasFood == true &&
            this.playerMgr.hasToy == true && 
            this.playerMgr.hasPicture
        ){
            //ALL RITUAL SUB-MISSIONS COMPLETE

            //move to the next part of the ritual missions

            //change the macro mission title
            this.missionTitle = "FIND THE RITUAL TREE"
        }
    }

    showDialog(npcName: string, text: string, speaker: 'player' | 'npc', hasNext: boolean = false, choices: any[] = [], npc?: any) {
        this.dialogActive = true
        this.dialogNPCName = npcName
        this.dialogText = text
        this.dialogSpeaker = speaker
        this.dialogHasNext = hasNext
        this.dialogPlayerChoices = choices || []
        this.currentDialogNPC = npc || null
        
        console.log(`Showing dialog - ${speaker === 'player' ? 'Player' : npcName}: ${text}`)
    }

    closeDialog() {
        // End the conversation on the NPC before closing
        if (this.currentDialogNPC) {
            this.currentDialogNPC.endConversation()
        }
        
        this.dialogActive = false
        this.dialogText = ""
        this.dialogNPCName = ""
        this.dialogSpeaker = 'npc'
        this.dialogHasNext = false
        this.dialogPlayerChoices = []
        this.currentDialogNPC = null
    }

    advanceDialog() {
        if (this.currentDialogNPC) {
            // Tell the NPC to show next dialog
            this.currentDialogNPC.showNextDialog()
        }
    }

    selectDialogChoice(nextDialogId: string) {
        if (this.currentDialogNPC) {
            this.currentDialogNPC.jumpToDialog(nextDialogId)
        }
	}

    placeStaticEntities(){
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
    }  
}

const data = {
        staticParts: [

            {name: "tempTerrain_withPaths", pos: Vector3.create(0,10,0), rot: Quaternion.fromEulerDegrees(0,180,0), src: "models/final/lowerTerrainB_paths.gltf", scale: Vector3.create(1,1,1)},
            
            
            {name: "cliffs", pos: Vector3.create(0,10,0), rot: Quaternion.fromEulerDegrees(0,180,0), src: "models/final/cliffsB.gltf", scale: Vector3.create(1,1,1)},

            //{name: "lowerTerrain", pos: Vector3.create(0,10,0), rot: Quaternion.fromEulerDegrees(0,180,0), src: "models/final/lowerTerrainB.gltf", scale: Vector3.create(1,1,1)},
            {name: "playerHouseLevel", pos: Vector3.create(0,10,0), rot: Quaternion.fromEulerDegrees(0,180,0), src: "models/final/playerHouseLevelB.gltf", scale: Vector3.create(1,1,1)},
            {name: "templeRun", pos: Vector3.create(0,10,0), rot: Quaternion.fromEulerDegrees(0,180,0), src: "models/final/templeRunB.gltf", scale: Vector3.create(1,1,1)},
            {name: "skyBlocker", pos: Vector3.create(0,60,0), rot: Quaternion.fromEulerDegrees(0,0,0), src: "models/final/skyBlockerB.gltf", scale: Vector3.create(1,1,1)},
            {name: "boneBridgeLanding", pos: Vector3.create(0,10,0), rot: Quaternion.fromEulerDegrees(0,180,0), src: "models/final/boneBridgeLandingB.gltf", scale: Vector3.create(1,1,1)},
            {name: "boneBridge", pos: Vector3.create(0,10,0), rot: Quaternion.fromEulerDegrees(0,180,0), src: "models/final/boneBridgeB.gltf", scale: Vector3.create(1,1,1)},
            {name: "tempBridges", pos: Vector3.create(0,10,0), rot: Quaternion.fromEulerDegrees(0,180,0), src: "models/final/tempBridgesB.gltf", scale: Vector3.create(1,1,1)},
            {name: "cemetaryGate", pos: Vector3.create(2.6,11.85,22), rot: Quaternion.fromEulerDegrees(0,335,0), src: "models/final/cemetaryGateB.gltf", scale: Vector3.create(1,1,1)},

            {name: "fountain", pos: Vector3.create(7.5,12.5,11.125), rot: Quaternion.fromEulerDegrees(0,0,0), src: "models/final/origBuildings/fountain.glb", scale: Vector3.create(1,1,1)},
            {name: "apartment", pos: Vector3.create(-25.5,10,-11), rot: Quaternion.fromEulerDegrees(0,30,0), src: "models/final/origBuildings/apartments.glb", scale: Vector3.create(1,1,1)},
            {name: "playerHouse", pos: Vector3.create(42,18.5,-26), rot: Quaternion.fromEulerDegrees(0,330,0), src: "models/final/origBuildings/playerHouse.glb", scale: Vector3.create(1,1,1)},
            {name: "girlHouse", pos: Vector3.create(34,12.25,57), rot: Quaternion.fromEulerDegrees(0,190,0), src: "models/final/origBuildings/girlHouse.glb", scale: Vector3.create(1,1,1)},
            {name: "library", pos: Vector3.create(-63,24.25,27), rot: Quaternion.fromEulerDegrees(0,125,0), src: "models/final/origBuildings/library.glb", scale: Vector3.create(1,1,1)},
            {name: "temple", pos: Vector3.create(-33.5,43.75,65), rot: Quaternion.fromEulerDegrees(0,180,0), src: "models/final/origBuildings/temple.glb", scale: Vector3.create(1,1,1)},
            {name: "shop", pos: Vector3.create(-22,10.5,16.5), rot: Quaternion.fromEulerDegrees(0,145,0), src: "models/final/origBuildings/shop.glb", scale: Vector3.create(1,1,1)},
            {name: "church", pos: Vector3.create(36,13,15.5), rot: Quaternion.fromEulerDegrees(0,-100,0), src: "models/final/origBuildings/church.glb", scale: Vector3.create(1,1,1)},
            {name: "townHall", pos: Vector3.create(7.5,11.4,-9), rot: Quaternion.fromEulerDegrees(0,0,0), src: "models/final/origBuildings/townHall.glb", scale: Vector3.create(1,1,1)},
            

            //graveyard
            {name: "coffinBase", pos: Vector3.create(4.4,11.6,31.5), rot: Quaternion.fromEulerDegrees(0,238,0), src: "models/ch/HWN20_Grave_01.glb", scale: Vector3.create(1,1,1)},
            {name: "coffinLid", pos: Vector3.create(1.85,11.3,34), rot: Quaternion.fromEulerDegrees(0,182,0), src: "models/ch/HWN20_Grave_02.glb", scale: Vector3.create(1,1,1)},
        
            //{name: "tpVideoRoom", pos: Vector3.create(0,0,0), rot: Quaternion.fromEulerDegrees(0,0,0), src: "models/test/tpVideoRoomA.gltf", scale: Vector3.create(1,1,1)},
            //{name: "tpVideoScreenA", pos: Vector3.create(0,0,0), rot: Quaternion.fromEulerDegrees(0,0,0), src: "models/test/tpVideoScreenA.gltf", scale: Vector3.create(1,1,1)},
            //{name: "tpVideoScreenA", pos: Vector3.create(0,0,0), rot: Quaternion.fromEulerDegrees(0,120,0), src: "models/test/tpVideoScreenA.gltf", scale: Vector3.create(1,1,1)},
            //{name: "tpVideoScreenA", pos: Vector3.create(0,0,0), rot: Quaternion.fromEulerDegrees(0,240,0), src: "models/test/tpVideoScreenA.gltf", scale: Vector3.create(1,1,1)},
            //{name: "stretchedLayoutB", pos: Vector3.create(0,0,0), rot: Quaternion.fromEulerDegrees(0,180,0), src: "models/test/stretchedLayoutB.glb", scale: Vector3.create(1,1,1)},
            //{name: "stretchedLayoutB_justLibs", pos: Vector3.create(0,0,0), rot: Quaternion.fromEulerDegrees(0,180,0), src: "models/test/stretchedLayoutB_libraries.glb", scale: Vector3.create(1,1,1)},
            //{name: "stretchedLayoutB_justLibs", pos: Vector3.create(0,0,0), rot: Quaternion.fromEulerDegrees(0,180,0), src: "models/test/stretchedLayoutB_aptTownHall.glb", scale: Vector3.create(1,1,1)},
            
            //{name: "groundPartsA_00", pos: Vector3.create(20,0,0), rot: Quaternion.fromEulerDegrees(0,0,0), src: "models/test/groundPartsA_00.gltf", scale: Vector3.create(1,1,1)},
            //{name: "groundPartsA_00", pos: Vector3.create(0,0,0), rot: Quaternion.fromEulerDegrees(0,0,0), src: "models/test/groundPartsA_00.gltf", scale: Vector3.create(

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
        movingEntities: [

            //blue platformA
            //{name: "2x2_movPlat", movementType: "twoPointLoop", startPos: Vector3.create(-10,1.25,22), endPos: Vector3.create(-10,5,22), duration: 2000, rot: Quaternion.fromEulerDegrees(0,0,0), src: "models/alPvpZone/pvpPartsA/step_2x2.gltf", scale: Vector3.create(1,1,1)},
            
        ],
        candleCollectables: [

            {name: "candle17", pos: Vector3.create(22.25,16,15), rot: Quaternion.fromEulerDegrees(0,0,0), src: "models/ch/HWN20_Candle_17.glb", scale: Vector3.create(1,1,1)},
            {name: "candle18", pos: Vector3.create(22.25,16,14.5), rot: Quaternion.fromEulerDegrees(0,0,0), src: "models/ch/HWN20_Candle_18.glb", scale: Vector3.create(1,1,1)},
            {name: "candle19", pos: Vector3.create(22.25,16,14), rot: Quaternion.fromEulerDegrees(0,0,0), src: "models/ch/HWN20_Candle_19.glb", scale: Vector3.create(1,1,1)},
            {name: "candle21", pos: Vector3.create(22.25,16,13.5), rot: Quaternion.fromEulerDegrees(0,0,0), src: "models/ch/HWN20_Candle_21.glb", scale: Vector3.create(1,1,1)},
            {name: "candle17", pos: Vector3.create(22.25,16,13), rot: Quaternion.fromEulerDegrees(0,0,0), src: "models/ch/HWN20_Candle_17.glb", scale: Vector3.create(1,1,1)},
            {name: "candle20", pos: Vector3.create(22.25,16,12.5), rot: Quaternion.fromEulerDegrees(0,0,0), src: "models/ch/HWN20_Candle_20.glb", scale: Vector3.create(1,1,1)},
            {name: "candle21", pos: Vector3.create(22.25,16,12), rot: Quaternion.fromEulerDegrees(0,0,0), src: "models/ch/HWN20_Candle_21.glb", scale: Vector3.create(1,1,1)},
            
        ],
        placementZones: [

        ],
        checkpointTriggerZones_up: [        
            {name: "topOfTunnel", pos: Vector3.create(-46.95,32,-26.75), scale: Vector3.create(14,14,14), respawnPos: Vector3.create(-46,28,-23.4), respawnRot: Quaternion.fromEulerDegrees(0,344,0)},
            {name: "topOfBoneBridge", pos: Vector3.create(-47.8,29.87,11.3), scale: Vector3.create(10,10,10), respawnPos: Vector3.create(-44.5,27,14.9), respawnRot: Quaternion.fromEulerDegrees(0,71,0)},
            {name: "endOfRun", pos: Vector3.create(17,34,50.25), scale: Vector3.create(6,6,6), respawnPos: Vector3.create(18.8,33,51.1), respawnRot: Quaternion.fromEulerDegrees(0,359,0)},
            {name: "landingD", pos: Vector3.create(1.75,40,58), scale: Vector3.create(6,6,6), respawnPos: Vector3.create(2.65,39,59.5), respawnRot: Quaternion.fromEulerDegrees(0,250,0)},
            {name: "landingC", pos: Vector3.create(-10.75,42,55), scale: Vector3.create(6,6,6), respawnPos: Vector3.create(-10.6,41,56.6), respawnRot: Quaternion.fromEulerDegrees(0,206,0)},
            {name: "landingB", pos: Vector3.create(-23,44,31.6), scale: Vector3.create(6,6,6), respawnPos: Vector3.create(-21.4,43,29.75), respawnRot: Quaternion.fromEulerDegrees(0,290,0)},
            {name: "landingA", pos: Vector3.create(-44.5,46,39.5), scale: Vector3.create(6,6,6), respawnPos: Vector3.create(-46.75,45,37.5), respawnRot: Quaternion.fromEulerDegrees(0,14,0)},
        ],
        checkpointTriggerZones_down: [        
            {name: "templeLanding", pos: Vector3.create(-39.5,46,53), scale: Vector3.create(6,6,6), respawnPos: Vector3.create(-34.5,45,54), respawnRot: Quaternion.fromEulerDegrees(0,256,0)},
            {name: "landingA", pos: Vector3.create(-44.5,46,39.5), scale: Vector3.create(6,6,6), respawnPos: Vector3.create(-46.75,45,39.25), respawnRot: Quaternion.fromEulerDegrees(0,95,0)},
            {name: "landingB", pos: Vector3.create(-23,44,31.6), scale: Vector3.create(6,6,6), respawnPos: Vector3.create(-23,43,28.65), respawnRot: Quaternion.fromEulerDegrees(0,37,0)},
            {name: "landingC", pos: Vector3.create(-10.75,42,55), scale: Vector3.create(6,6,6), respawnPos: Vector3.create(-12.7,41,54.9), respawnRot: Quaternion.fromEulerDegrees(0,73,0)},
            {name: "landingD", pos: Vector3.create(1.75,40,58), scale: Vector3.create(6,6,6), respawnPos: Vector3.create(-0.25,39,58.75), respawnRot: Quaternion.fromEulerDegrees(0,76,0)},
            {name: "bottomOfStairs", pos: Vector3.create(17,34,50.25), scale: Vector3.create(6,6,6), respawnPos: Vector3.create(18.65,33,50.85), respawnRot: Quaternion.fromEulerDegrees(0,238,0)},
            {name: "libraryEndOfRun", pos: Vector3.create(-35.85,30,16), scale: Vector3.create(14,14,14), respawnPos: Vector3.create(-43.3,27,17), respawnRot: Quaternion.fromEulerDegrees(0,244,0)}
        ],
    }