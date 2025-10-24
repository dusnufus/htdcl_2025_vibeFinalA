//import { worldInfo } from './worldData'
import { PlayerManager } from './playerMgr'

import {ColliderLayer, engine, Entity, GltfContainer, MeshCollider, MeshRenderer, Transform, TriggerArea, triggerAreaEventsSystem, AvatarShape} from '@dcl/sdk/ecs'
import {Vector3, Quaternion} from '@dcl/sdk/math'
import {setUiForMissionState } from './uiMgr'
import { CandleCollectable } from './components/collectables'
import { HouseTriggerZone} from './components/triggerZones'
import { TempZoneClicker } from './components/tempZoneClickers'
import { TpVideoRoom } from './components/tpVideoRoom'
import { GameTimer } from './gameTimer'
import { movePlayerTo, triggerEmote  } from '~system/RestrictedActions'
import { NPC } from './components/npc'

export class GameManager{

    //player manager class ref
	playerMgr: PlayerManager


    //this string will control all the transitions and progression
    missionState: string = "introPlaying"
    //introLoading, introPostLoad, introPlaying, introPostWait, 
    // mission1 (EXPLORE THE TOWN)
    //foundGirl
    //triggers animation of girl to you outside the house
    //interact with girl to start dialog
    //dialog where she asks for help
    //girl walks toward fountain and stops there
    //when you catch up to her, she asks what day it is ... intro to ritual dialog
    //girl walks back to her house and waits outside for you to go in and find the picture for her
    //collect picture
    //come back to the girl and interact
    //dialog for starting shop/food mission
    //she wanders to the shop to wait for you to get cat food
    //interact with shop owner to start shop mission
    //shop owner dialog 
    //new sub-mission : ????
    




    // mission2 (FIND THE RITUAL TREE)
    // mission3 (COMPLETE THE RITUAL)
    // mission4 (COMPLETE THE GAME)


    //mission states (macro)
    introLoaded: boolean = false
    introComplete: boolean = false
    girlMet: boolean
    allItemsCollected: boolean
    ritualComplete: boolean

    //mission title (macro scale)
    //this shows up in the main title of the UI display
    missionTitle: string = ""

    messageText: string = "nothing"
    videoWatched: boolean = false

    staticEntities: Array<Entity>

    girlHouseTrigger: any
    tempGirlHouseClicker: any

    candles: Array<Entity>
    candleIndexCollected: Array<number>

    tpVideoRoom: TpVideoRoom

    doorman: any
    girl!: NPC
	
	constructor(){

		console.log("GameManager: constructor running")

		this.staticEntities = []

        //init missionTitle
        this.missionTitle = "EXPLORE THE TOWN"

        //TODO: activate a trigger for the girl's house
        this.girlHouseTrigger = HouseTriggerZone(this, Vector3.create(30,6,55), Vector3.create(15,2.5,15), true)

        this.playerMgr = new PlayerManager()





        //init mission states (macro scale only in game manager)
        this.girlMet = false
        this.allItemsCollected = false
        this.ritualComplete = false


        //test the npc avatar system
        this.doorman = engine.addEntity()
        AvatarShape.create(this.doorman, {
            id: "doorman",
            name: "Doorman",
            bodyShape: "urn:decentraland:off-chain:base-avatars:BaseMale",
            wearables: ["urn:decentraland:matic:collections-v2:0xc714bac4b6af6c7407dd4f6587ed332aa21fad84:0", "urn:decentraland:off-chain:base-avatars:brown_pants", 'urn:decentraland:matic:collections-v2:0xbcc888ae057f3490fa0b5c03977af9c80bdd9b49:0' ],
            emotes: [],
            expressionTriggerId: "clap",
            expressionTriggerTimestamp: 0
        })  
        Transform.create(this.doorman, {
            position: Vector3.create(-26,6,1),
            scale: Vector3.create(1,1,1)
        })

        //create NPCs
        this.createGirlNPC()

        //SHOP OWNER
        //23,6,16 (BEHIND COUNTER)
        

        this.candles = []
        this.candleIndexCollected = []


        //this.foundGirl()
		
		this.placeStaticEntities()
	
        setUiForMissionState(this, this.missionState)
        
		this.tpVideoRoom = new TpVideoRoom(this, "models/test/tpVideoRoomA.gltf", "models/test/tpVideoScreenA_noTex.gltf", 5)
        this.tpVideoRoom.setVideo("videos/toTitleA_medium.mp4", 3, 3)
        
	}

    createGirlNPC(){
        //30,6,59 (start in house)
        //32,6,56 (house doorway)
        //30,6,44 (meet you and wave)
        //10,8,16 (by fountain looking at townhall)

        this.girl = new NPC(this, {
            id: 'girl',
            name: 'Girl',
            startPosition: Vector3.create(30, 6, 44),
            startRotation: Quaternion.fromEulerDegrees(0, 180, 0),
            
            useAvatar: true,
            avatarData: {
                bodyShape: 'urn:decentraland:off-chain:base-avatars:BaseFemale',
                wearables: [
                    'urn:decentraland:matic:collections-v2:0x768c1027b1f1a452ecb8dab017a1e630a75f0d30:0',
                    'urn:decentraland:off-chain:base-avatars:brown_pants'
                ]
            },
            
            clickable: true,
            clickHoverText: 'Talk to Girl',
            hasProximityTrigger: true,
            proximityRadius: 4,
            
            waypoints: [
                { position: Vector3.create(30, 6, 44), rotation: Quaternion.fromEulerDegrees(0, 180, 0), waitTime: 3 },
                { position: Vector3.create(10, 8, 16), rotation: Quaternion.fromEulerDegrees(0, 90, 0), waitTime: 5 },
                { position: Vector3.create(30, 6, 59), rotation: Quaternion.fromEulerDegrees(0, 0, 0), waitTime: 2 }
            ],
            loopWaypoints: true,//false
            moveSpeed: 2.0,
            
            dialogs: {
                'intro': {
                    text: 'Help! I need your help!',
                    nextDialogId: 'quest1',
                    action: () => {
                        this.missionState = 'metGirl'
                    }
                },
                'quest1': {
                    text: 'Can you find my picture in the house?',
                    action: () => {
                        this.girlMet = true
                    }
                }
            },
            startDialogId: 'intro',
            
            canGiveItems: true,
            itemsToGive: ['key']
        })

        this.girl.startMovement()
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

    videoComplete(){
        console.log('GameManager: video playback complete')
        // Handle video completion based on missionState
        if(this.missionState == "introPlaying"){
            this.missionState = "exploringTown"
            //this.messageText = "Video complete!"
            // Do whatever comes next after intro video
            console.log("moving player to exploring town")
            movePlayerTo({
                newRelativePosition: Vector3.create(0,20,0),
                cameraTarget: Vector3.create(-26,30, 10)
            })
            setUiForMissionState(this, this.missionState)
        }
    }

    candleCollected(_candleIndex:number){

        if(!this.candleIndexCollected.includes(_candleIndex) && this.playerMgr.candleCount <= 7){
            this.candleIndexCollected.push(_candleIndex)
            this.playerMgr.candleCount ++;
            engine.removeEntity(this.candles[_candleIndex])
            this.itemCheck();
        }
        
        
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

            //mark allItemsComplete
            this.allItemsCollected = true

            //change the macro mission title
            this.missionTitle = "FIND THE RITUAL TREE"
        }
    }

    foundGirl(){

        engine.removeEntity(this.girlHouseTrigger)
        this.messageText = "in"


        console.log("foundGirl: true")
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
}

const data = {
        staticParts: [

            {name: "stretchedLayoutB", pos: Vector3.create(0,5,0), rot: Quaternion.fromEulerDegrees(0,180,0), src: "models/test/stretchedLayoutB.glb", scale: Vector3.create(1,1,1)},
            //{name: "tpVideoRoom", pos: Vector3.create(0,0,0), rot: Quaternion.fromEulerDegrees(0,0,0), src: "models/test/tpVideoRoomA.gltf", scale: Vector3.create(1,1,1)},
            //{name: "tpVideoScreenA", pos: Vector3.create(0,0,0), rot: Quaternion.fromEulerDegrees(0,0,0), src: "models/test/tpVideoScreenA.gltf", scale: Vector3.create(1,1,1)},
            //{name: "tpVideoScreenA", pos: Vector3.create(0,0,0), rot: Quaternion.fromEulerDegrees(0,120,0), src: "models/test/tpVideoScreenA.gltf", scale: Vector3.create(1,1,1)},
            //{name: "tpVideoScreenA", pos: Vector3.create(0,0,0), rot: Quaternion.fromEulerDegrees(0,240,0), src: "models/test/tpVideoScreenA.gltf", scale: Vector3.create(1,1,1)},
            //{name: "stretchedLayoutB", pos: Vector3.create(0,0,0), rot: Quaternion.fromEulerDegrees(0,180,0), src: "models/test/stretchedLayoutB.glb", scale: Vector3.create(1,1,1)},
            //{name: "stretchedLayoutB_justLibs", pos: Vector3.create(0,0,0), rot: Quaternion.fromEulerDegrees(0,180,0), src: "models/test/stretchedLayoutB_libraries.glb", scale: Vector3.create(1,1,1)},
            //{name: "stretchedLayoutB_justLibs", pos: Vector3.create(0,0,0), rot: Quaternion.fromEulerDegrees(0,180,0), src: "models/test/stretchedLayoutB_aptTownHall.glb", scale: Vector3.create(1,1,1)},
            
            

            
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
        movingEntities: [

            //blue platformA
            //{name: "2x2_movPlat", movementType: "twoPointLoop", startPos: Vector3.create(-10,1.25,22), endPos: Vector3.create(-10,5,22), duration: 2000, rot: Quaternion.fromEulerDegrees(0,0,0), src: "models/alPvpZone/pvpPartsA/step_2x2.gltf", scale: Vector3.create(1,1,1)},
            
        ],
        candleCollectables: [

            {name: "candle17", pos: Vector3.create(21,8,13), rot: Quaternion.fromEulerDegrees(0,0,0), src: "models/ch/HWN20_Candle_17.glb", scale: Vector3.create(1,1,1)},
            {name: "candle18", pos: Vector3.create(21,8,12.5), rot: Quaternion.fromEulerDegrees(0,0,0), src: "models/ch/HWN20_Candle_18.glb", scale: Vector3.create(1,1,1)},
            {name: "candle19", pos: Vector3.create(21,8,12), rot: Quaternion.fromEulerDegrees(0,0,0), src: "models/ch/HWN20_Candle_19.glb", scale: Vector3.create(1,1,1)},
            {name: "candle21", pos: Vector3.create(21,8,11.5), rot: Quaternion.fromEulerDegrees(0,0,0), src: "models/ch/HWN20_Candle_21.glb", scale: Vector3.create(1,1,1)},
            {name: "candle17", pos: Vector3.create(21,8,11), rot: Quaternion.fromEulerDegrees(0,0,0), src: "models/ch/HWN20_Candle_17.glb", scale: Vector3.create(1,1,1)},
            {name: "candle20", pos: Vector3.create(21,8,10.5), rot: Quaternion.fromEulerDegrees(0,0,0), src: "models/ch/HWN20_Candle_20.glb", scale: Vector3.create(1,1,1)},
            {name: "candle21", pos: Vector3.create(21,8,10), rot: Quaternion.fromEulerDegrees(0,0,0), src: "models/ch/HWN20_Candle_21.glb", scale: Vector3.create(1,1,1)},
            
        ],
        placementZones: [

        ],
        triggerZones: [

        ],
    }