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

    // Dialog system
    dialogActive: boolean = false
    dialogNPCName: string = ""
    dialogText: string = ""
    dialogSpeaker: 'player' | 'npc' = 'npc'
    dialogHasNext: boolean = false
    dialogPlayerChoices: { text: string, nextDialogId: string }[] = []
    currentDialogNPC: any = null

    staticEntities: Array<Entity>

    girlHouseTrigger: any
    tempGirlHouseClicker: any

    candles: Array<Entity>
    candleIndexCollected: Array<number>

    tpVideoRoom: TpVideoRoom

    girl!: NPC
    shopKeeper!: NPC
    templeShaman!: NPC  
    oldLady!: NPC
    doorman!: NPC
    librarian!: NPC
	
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

        //create NPCs
        this.createGirlNPC()
        this.createShopOwnerNPC()
        this.createTempleShamanNPC()
        this.createOldLadyNPC()
        this.createDoormanNPC()
        this.createLibrarianNPC()

        this.candles = []
        this.candleIndexCollected = []

        //this.foundGirl()
		
		this.placeStaticEntities()
	
        setUiForMissionState(this, this.missionState)
        
		this.tpVideoRoom = new TpVideoRoom(this, "models/test/tpVideoRoomA.gltf", "models/test/tpVideoScreenA_noTex.gltf", 5)
        this.tpVideoRoom.setVideo("videos/toTitleA_medium.mp4", 3, 3)
        
	}

    createDoormanNPC(){
        this.doorman = new NPC(this, {
            id: 'doorman',
            name: 'Doorman',
            startPosition: Vector3.create(-26,6,5),
            startRotation: Quaternion.fromEulerDegrees(0,0,0),

            useAvatar: true,
            avatarData: {
                bodyShape: 'urn:decentraland:off-chain:base-avatars:BaseMale',
                wearables: ["urn:decentraland:matic:collections-v2:0xc714bac4b6af6c7407dd4f6587ed332aa21fad84:0", 
                    "urn:decentraland:off-chain:base-avatars:brown_pants", 
                    'urn:decentraland:matic:collections-v2:0xbcc888ae057f3490fa0b5c03977af9c80bdd9b49:0' 
                ],
                /* emotes: [],
                expressionTriggerId: "clap",
                expressionTriggerTimestamp: 0 */
            },
            clickable: true,
            clickHoverText: 'Talk to Doorman',
            hasProximityTrigger: true,
            proximityRadius: 4,
            
            waypointSets: {
                'patrolArea': {
                    id: 'patrolArea',
                    waypoints: [
                        { position: Vector3.create(-26, 6, 8), rotation: Quaternion.fromEulerDegrees(0, 180, 0), waitTime: 2 },
                        { position: Vector3.create(-26, 6, 5), rotation: Quaternion.fromEulerDegrees(0, 0, 0), waitTime: 2 }
                    ],
                    loopWaypoints: true,
                    moveSpeed: 1.5
                },
                'walkToGate': {
                    id: 'walkToGate',
                    waypoints: [
                        { position: Vector3.create(-26, 6, 10), rotation: Quaternion.fromEulerDegrees(0, 180, 0), waitTime: 1 },
                        { position: Vector3.create(-26, 6, 5), rotation: Quaternion.fromEulerDegrees(0, 0, 0), waitTime: 0 }
                    ],
                    loopWaypoints: false,
                    moveSpeed: 2.0
                }
            },
            
            defaultDialogs: [
                "Move along, please.",
                "I'm watching this area.",
                "Nothing to see here."
            ],
            
            conversationSets: {
                'greeting': {
                    id: 'greeting',
                    startDialogId: 'door1',
                    dialogs: {
                        'door1': {
                            speaker: 'npc',
                            text: 'Welcome. I guard this entrance.',
                            nextDialogId: 'player1'
                        },
                        'player1': {
                            speaker: 'player',
                            text: 'Nice to meet you.',
                            action: () => {
                                this.missionState = 'metDoorman'
                            }
                        }
                    }
                }
            },
            
            canGiveItems: false
        })
    }

    createOldLadyNPC(){
        this.oldLady = new NPC(this, {
            id: 'oldLady',
            name: 'Old Lady',
            startPosition: Vector3.create(-26,6,1),
            startRotation: Quaternion.fromEulerDegrees(0,0,0),

            useAvatar: true,
            avatarData: {
                bodyShape: 'urn:decentraland:off-chain:base-avatars:BaseFemale',
                wearables: [
                    'urn:decentraland:matic:collections-v2:0x768c1027b1f1a452ecb8dab017a1e630a75f0d30:0',
                    'urn:decentraland:off-chain:base-avatars:brown_pants'
                ]
            },
            clickable: true,
            clickHoverText: 'Talk to Old Lady',
            hasProximityTrigger: true,
            proximityRadius: 4,
            
            waypointSets: {
                'walkToBench': {
                    id: 'walkToBench',
                    waypoints: [
                        { position: Vector3.create(-24, 6, 1), rotation: Quaternion.fromEulerDegrees(0, 90, 0), waitTime: 3 },
                        { position: Vector3.create(-26, 6, 1), rotation: Quaternion.fromEulerDegrees(0, 0, 0), waitTime: 0 }
                    ],
                    loopWaypoints: false,
                    moveSpeed: 1.0
                },
                'walkToGarden': {
                    id: 'walkToGarden',
                    waypoints: [
                        { position: Vector3.create(-26, 6, 4), rotation: Quaternion.fromEulerDegrees(0, 180, 0), waitTime: 2 },
                        { position: Vector3.create(-26, 6, 1), rotation: Quaternion.fromEulerDegrees(0, 0, 0), waitTime: 0 }
                    ],
                    loopWaypoints: false,
                    moveSpeed: 1.0
                }
            },
            
            defaultDialogs: [
                "Good day, dear.",
                "My bones ache today.",
                "The weather is nice, isn't it?"
            ],
            
            conversationSets: {
                'wisdom': {
                    id: 'wisdom',
                    startDialogId: 'lady1',
                    dialogs: {
                        'lady1': {
                            speaker: 'npc',
                            text: 'I remember when this town was different...',
                            nextDialogId: 'player1'
                        },
                        'player1': {
                            speaker: 'player',
                            text: 'What was it like?',
                            nextDialogId: 'lady2'
                        },
                        'lady2': {
                            speaker: 'npc',
                            text: 'Full of life and laughter. Now... it\'s changed.',
                            action: () => {
                                this.missionState = 'metOldLady'
                            }
                        }
                    }
                }
            },
            
            canGiveItems: false
        })
    }

    createTempleShamanNPC(){
        this.templeShaman = new NPC(this, {
            id: 'templeShaman',
            name: 'Temple Shaman',
            startPosition: Vector3.create(-34,39,52),
            startRotation: Quaternion.fromEulerDegrees(0,0,0),

            useAvatar: true,
            avatarData: {
                bodyShape: 'urn:decentraland:off-chain:base-avatars:BaseMale',
                wearables: [
                    'urn:decentraland:matic:collections-v2:0x768c1027b1f1a452ecb8dab017a1e630a75f0d30:0',
                    'urn:decentraland:off-chain:base-avatars:brown_pants'
                ]
            },
            clickable: true,
            clickHoverText: 'Talk to Temple Shaman',
            hasProximityTrigger: true,
            proximityRadius: 4,
            
            waypointSets: {
                'walkToAltar': {
                    id: 'walkToAltar',
                    waypoints: [
                        { position: Vector3.create(-32, 39, 52), rotation: Quaternion.fromEulerDegrees(0, 90, 0), waitTime: 2 },
                        { position: Vector3.create(-34, 39, 54), rotation: Quaternion.fromEulerDegrees(0, 0, 0), waitTime: 0 }
                    ],
                    loopWaypoints: false,
                    moveSpeed: 1.5
                },
                'walkToEntrance': {
                    id: 'walkToEntrance',
                    waypoints: [
                        { position: Vector3.create(-34, 39, 48), rotation: Quaternion.fromEulerDegrees(0, 180, 0), waitTime: 1 },
                        { position: Vector3.create(-34, 39, 52), rotation: Quaternion.fromEulerDegrees(0, 0, 0), waitTime: 0 }
                    ],
                    loopWaypoints: false,
                    moveSpeed: 1.5
                }
            },
            
            defaultDialogs: [
                "Peace be with you.",
                "The spirits are restless tonight.",
                "Meditate and find clarity."
            ],
            
            conversationSets: {
                'blessing': {
                    id: 'blessing',
                    startDialogId: 'shaman1',
                    dialogs: {
                        'shaman1': {
                            speaker: 'npc',
                            text: 'Welcome, traveler. You seek guidance?',
                            nextDialogId: 'player1'
                        },
                        'player1': {
                            speaker: 'player',
                            text: 'Yes, what can you tell me about this place?',
                            nextDialogId: 'shaman2'
                        },
                        'shaman2': {
                            speaker: 'npc',
                            text: 'The temple holds many secrets. Tread carefully.',
                            action: () => {
                                this.missionState = 'metTempleShaman'
                            }
                        }
                    }
                }
            },
            
            canGiveItems: false
        })
    }

    createShopOwnerNPC(){

        //SHOP OWNER
        //-23,6,16 (BEHIND COUNTER)


        this.shopKeeper = new NPC(this, {
            id: 'shopKeeper',
            name: 'Shop Keeper',
            startPosition: Vector3.create(-23,6,16),
            startRotation: Quaternion.fromEulerDegrees(0,180,0),

            useAvatar: true,
            avatarData: {
                bodyShape: 'urn:decentraland:off-chain:base-avatars:BaseFemale',
                wearables: [
                    'urn:decentraland:matic:collections-v2:0x768c1027b1f1a452ecb8dab017a1e630a75f0d30:0',
                    'urn:decentraland:off-chain:base-avatars:brown_pants'
                ]
            },
            clickable: true,
            clickHoverText: 'Talk to ShopKeeper',
            hasProximityTrigger: true,
            proximityRadius: 4,
            
            waypointSets: {
                'walkToCounter': {
                    id: 'walkToCounter',
                    waypoints: [
                        { position: Vector3.create(-23, 6, 18), rotation: Quaternion.fromEulerDegrees(0, 90, 0), waitTime: 2 },
                        { position: Vector3.create(-23, 6, 16), rotation: Quaternion.fromEulerDegrees(0, 180, 0), waitTime: 0 }
                    ],
                    loopWaypoints: false,
                    moveSpeed: 2.0
                },
                'walkToStorage': {
                    id: 'walkToStorage',
                    waypoints: [
                        { position: Vector3.create(-26, 6, 16), rotation: Quaternion.fromEulerDegrees(0, 270, 0), waitTime: 1 },
                        { position: Vector3.create(-23, 6, 16), rotation: Quaternion.fromEulerDegrees(0, 180, 0), waitTime: 0 }
                    ],
                    loopWaypoints: false,
                    moveSpeed: 2.0
                }
            },
            
            defaultDialogs: [
                "Welcome to my shop!",
                "Looking for something?",
                "Sorry, we're out of stock on that."
            ],
            
            conversationSets: {
                'shopTalk': {
                    id: 'shopTalk',
                    startDialogId: 'shop1',
                    dialogs: {
                        'shop1': {
                            speaker: 'npc',
                            text: 'Hello! Looking for supplies?',
                            nextDialogId: 'player1'
                        },
                        'player1': {
                            speaker: 'player',
                            text: 'Yes, what do you have available?',
                            nextDialogId: 'shop2'
                        },
                        'shop2': {
                            speaker: 'npc',
                            text: 'I have various items. Let me know what you need.',
                            action: () => {
                                this.missionState = 'metShopOwner'
                            }
                        }
                    }
                }
            },
            
            canGiveItems: false
        })
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
            
            waypointSets: {
                'runOutOfHouse': {
                    id: 'runOutOfHouse',
                    waypoints: [
                        { position: Vector3.create(32, 6, 56), rotation: Quaternion.fromEulerDegrees(0, 180, 0), waitTime: 1 },
                        { position: Vector3.create(30, 6, 44), rotation: Quaternion.fromEulerDegrees(0, 180, 0), waitTime: 0 }
                    ],
                    loopWaypoints: false,
                    moveSpeed: 3.5
                },
                'walkToFountain': {
                    id: 'walkToFountain',
                    waypoints: [
                        { position: Vector3.create(20, 7, 30), rotation: Quaternion.fromEulerDegrees(0, 90, 0), waitTime: 1 },
                        { position: Vector3.create(10, 8, 16), rotation: Quaternion.fromEulerDegrees(0, 270, 0), waitTime: 0 }
                    ],
                    loopWaypoints: false,
                    moveSpeed: 2.0
                }
            },
            
            // Default random dialogs
            defaultDialogs: [
                "Hi there...",
                "I don't have time to talk right now.",
                "It's a spooky day, isn't it?",
                "Have you seen my cat?"
            ],
            
            // Named conversation sets
            conversationSets: {
                'firstMeeting': {
                    id: 'firstMeeting',
                    startDialogId: 'girl1',
                    dialogs: {
                        'girl1': {
                            speaker: 'npc',
                            text: 'Help! I need your help!',
                            nextDialogId: 'player1'
                        },
                        'player1': {
                            speaker: 'player',
                            text: 'What\'s wrong? How can I help?',
                            nextDialogId: 'girl2'
                        },
                        'girl2': {
                            speaker: 'npc',
                            text: 'This town... it\'s so spooky. Will you help me look around?',
                            nextDialogId: 'player2'
                        },
                        'player2': {
                            speaker: 'player',
                            text: 'Of course! Let\'s explore together.',
                            action: () => {
                                console.log('Player agreed to help')
                                this.girlMet = true
                            }
                        }
                    },
                    onComplete: () => {
                        this.missionState = 'followingGirl'
                        this.girl.startWaypointSet('walkToFountain')
                    }
                },
                'atFountain': {
                    id: 'atFountain',
                    startDialogId: 'fountain1',
                    dialogs: {
                        'fountain1': {
                            speaker: 'npc',
                            text: 'What day is it today?',
                            nextDialogId: 'player_answer'
                        },
                        'player_answer': {
                            speaker: 'player',
                            text: 'It\'s October 31st... Halloween.',
                            nextDialogId: 'fountain2'
                        },
                        'fountain2': {
                            speaker: 'npc',
                            text: 'Oh no! The ritual is tonight!',
                            nextDialogId: 'fountain3'
                        },
                        'fountain3': {
                            speaker: 'npc',
                            text: 'We need to find the items quickly!'
                        }
                    },
                    onComplete: () => {
                        this.missionState = 'collectingItems'
                        this.missionTitle = 'COLLECT RITUAL ITEMS'
                    }
                }
            },
            
            canGiveItems: true,
            itemsToGive: ['key']
        })
    }
    
    createLibrarianNPC(){
        this.librarian = new NPC(this, {
            id: 'librarian',
            name: 'Librarian',
            startPosition: Vector3.create(-48,21,19),
            startRotation: Quaternion.fromEulerDegrees(0,0,0),
    
            useAvatar: true,
            avatarData: {
                bodyShape: 'urn:decentraland:off-chain:base-avatars:BaseFemale',
                wearables: [
                    'urn:decentraland:matic:collections-v2:0x768c1027b1f1a452ecb8dab017a1e630a75f0d30:0',
                    'urn:decentraland:off-chain:base-avatars:brown_pants'
                ]
            },
            clickable: true,
            clickHoverText: 'Talk to Librarian',
            hasProximityTrigger: true,
            proximityRadius: 4,
            
            waypointSets: {
                'walkToShelves': {
                    id: 'walkToShelves',
                    waypoints: [
                        { position: Vector3.create(-24, 6, 1), rotation: Quaternion.fromEulerDegrees(0, 90, 0), waitTime: 2 },
                        { position: Vector3.create(-26, 6, 1), rotation: Quaternion.fromEulerDegrees(0, 0, 0), waitTime: 0 }
                    ],
                    loopWaypoints: false,
                    moveSpeed: 1.5
                },
                'walkToDesk': {
                    id: 'walkToDesk',
                    waypoints: [
                        { position: Vector3.create(-26, 6, 4), rotation: Quaternion.fromEulerDegrees(0, 180, 0), waitTime: 1 },
                        { position: Vector3.create(-26, 6, 1), rotation: Quaternion.fromEulerDegrees(0, 0, 0), waitTime: 0 }
                    ],
                    loopWaypoints: false,
                    moveSpeed: 1.5
                }
            },
            
            defaultDialogs: [
                "Welcome to the library.",
                "Please keep quiet.",
                "All books must be returned in two weeks."
            ],
            
            conversationSets: {
                'librarianTalk': {
                    id: 'librarianTalk',
                    startDialogId: 'librarian1',
                    dialogs: {
                        'librarian1': {
                            speaker: 'npc',
                            text: 'Hello! How can I help you today?',
                            nextDialogId: 'player1'
                        },
                        'player1': {
                            speaker: 'player',
                            text: 'I\'m looking for a book about the history of this town.',
                            nextDialogId: 'librarian2'
                        },
                        'librarian2': {
                            speaker: 'npc',
                            text: 'Ah yes, we have several books on local history. Let me show you.',
                            action: () => {
                                this.missionState = 'metLibrarian'
                            }
                        }
                    }
                }
            },
            
            canGiveItems: false
        })
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
                newRelativePosition: Vector3.create(-34,50,52),//22,20,-18 (player's house position)
                cameraTarget: Vector3.create(-26,30, 10)
            })
            setUiForMissionState(this, this.missionState)
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