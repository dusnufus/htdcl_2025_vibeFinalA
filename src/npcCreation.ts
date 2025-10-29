import { Vector3, Quaternion } from '@dcl/sdk/math'
import { NPC } from './components/npc'
import { GameManager } from './gameMgr'

export function createGirlNPC(gameMgr: GameManager): NPC {
    //30,6,59 (start in house)
    //32,6,56 (house doorway)
    //30,6,44 (meet you and wave)
    //10,8,16 (by fountain looking at townhall)

    return new NPC(gameMgr, {
        id: 'girl',
        name: 'Girl',
        startPosition: Vector3.create(30, 12.8, 54.5),
        startRotation: Quaternion.fromEulerDegrees(0, 180, 0),
        
        useAvatar: false,
        useDefaultAvatar: false,
        /* avatarData: {
            bodyShape: 'urn:decentraland:off-chain:base-avatars:BaseFemale',
            wearables: [
                'urn:decentraland:off-chain:base-avatars:brown_pants',
                'urn:decentraland:off-chain:base-avatars:blue_tshirt',
                //'urn:decentraland:matic:collections-v2:0x768c1027b1f1a452ecb8dab017a1e630a75f0d30:0',//(spopky girl)
            ]
        }, */

        modelPath: 'models/char/theGirl.glb',

        // NEW: Define animations with loop and speed defaults
        animations: [
            { name: 'Walking', loop: true, speed: 1.0 },
            { name: 'Walking_Woman', loop: true, speed: 1.2 },
            { name: 'Talk_with_Left_Hand_Raised', loop: true, speed: 1 },
            { name: 'Talk_with_Hands_Open', loop: true, speed: 1 },
            { name: 'Running', loop: false, speed: 1.0 },
            { name: 'Jump_Run', loop: true, speed: 1 },
            { name: 'Jump_Over_Obstacle_2', loop: false, speed: 1.0 },
            { name: 'Idle', loop: true, speed: 1 },
            { name: 'Idle_7', loop: false, speed: 1.0 },
            { name: 'Idle_6', loop: false, speed: 1.0 }
        ],
        defaultAnimation: 'Walking',

        // ADD THIS - Maps the system's concept of "idle" and "walk" to your actual animation names
        animationNames: {
            idle: 'Idle',    // What to play when not moving
            walk: 'Walking_Woman',    // What to play when walking
            run: 'Running',     // What to play when running (if needed)
            talk: 'Talk_with_Hands_Open' // What to play when talking (if needed)
        },
        
        clickable: true,
        clickHoverText: 'Talk to Girl',
        hasProximityTrigger: true,
        proximityRadius: 4,
        
        waypointSets: {
            'runOutOfHouse': {
                id: 'runOutOfHouse',
                waypoints: [
                    { position: Vector3.create(32.3, 12.8, 51.5), rotation: Quaternion.fromEulerDegrees(0, 180, 0), waitTime: 0 },
                    { position: Vector3.create(32.25, 12.35, 44.5), rotation: Quaternion.fromEulerDegrees(0, 180, 0), waitTime: 0 }
                ],
                loopWaypoints: false,
                moveSpeed: 3.5,
                onComplete: () => {
                    //console.log('Girl ran out of house - ready for player interaction')
                    gameMgr.girl.playAnimation('Talk_with_Hands_Open', true, 1, true)
                    gameMgr.girl.prepareConversation('firstMeeting')
                }
            },
            'walkToFountain': {
                id: 'walkToFountain',
                waypoints: [
                    { position: Vector3.create(30.3,12.3,41.6), rotation: Quaternion.fromEulerDegrees(0, 215, 0), waitTime: 0 },
                    { position: Vector3.create(28.85,12.25,38.2), rotation: Quaternion.fromEulerDegrees(0, 215, 0), waitTime: 0 },
                    { position: Vector3.create(24.25,12.25,35.75), rotation: Quaternion.fromEulerDegrees(0, 215, 0), waitTime: 0 },
                    { position: Vector3.create(20.3,12.15,34.8), rotation: Quaternion.fromEulerDegrees(0, 215, 0), waitTime: 0 },
                    { position: Vector3.create(17.15,12.15,31.15), rotation: Quaternion.fromEulerDegrees(0, 270, 0), waitTime: 0 },
                    { position: Vector3.create(13.85,12.25,23.9), rotation: Quaternion.fromEulerDegrees(0, 270, 0), waitTime: 0 },
                    { position: Vector3.create(4.1,12.1,19.8), rotation: Quaternion.fromEulerDegrees(0, 90, 0), waitTime: 0 },
                    { position: Vector3.create(4.25,12.6,15.65), rotation: Quaternion.fromEulerDegrees(0, 270, 0), waitTime: 0 },
                    { position: Vector3.create(2.2,12.6,11.65), rotation: Quaternion.fromEulerDegrees(0, 154, 0), waitTime: 0 },
                ],
                loopWaypoints: false,
                moveSpeed: 3.5,
                 onComplete: () => {
                    console.log('Girl arrived at fountain')
                     //gameMgr.girl.startConversation('atFountain')
                     gameMgr.girl.prepareConversation('atFountain')
                 }
            },
            'walkToChurch': {
                id: 'walkToChurch',
                waypoints: [
                    { position: Vector3.create(9,12.6,6), rotation: Quaternion.fromEulerDegrees(0, 0, 0), waitTime: 0 },
                    { position: Vector3.create(12.8,12.6,12.3), rotation: Quaternion.fromEulerDegrees(0, 80, 0), waitTime: 0 },
                    { position: Vector3.create(18.75,12.6,12.5), rotation: Quaternion.fromEulerDegrees(0, 80, 0), waitTime: 0 },
                    { position: Vector3.create(24.5,15.55,11.9), rotation: Quaternion.fromEulerDegrees(0, 285, 0), waitTime: 0 },
                ],
                loopWaypoints: false,
                moveSpeed: 3.5,
                onComplete: () => {
                   //now start the searching the church waypoints
                   gameMgr.girl.startWaypointSet('searchInsideChurch')
                   gameMgr.girl.playAnimation('Idle', true, 1, true)
                }
            },
            'searchInsideChurch': {
                id: 'searchInsideChurch',
                waypoints: [                    
                    { position: Vector3.create(29.75,15.65,12.1), rotation: Quaternion.fromEulerDegrees(0, 165, 0), waitTime: 0 },
                    { position: Vector3.create(33,15.55,14.25), rotation: Quaternion.fromEulerDegrees(0, 45, 0), waitTime: 0 },
                    { position: Vector3.create(38.25,15.75,13.65), rotation: Quaternion.fromEulerDegrees(0, 115, 0), waitTime: 0 },
                    { position: Vector3.create(37.6,15.75,18.1), rotation: Quaternion.fromEulerDegrees(0, 15, 0), waitTime: 0 },
                    { position: Vector3.create(32.3,15.55,16), rotation: Quaternion.fromEulerDegrees(0, 245, 0), waitTime: 0 },
                    { position: Vector3.create(26.45,15.65,16.45), rotation: Quaternion.fromEulerDegrees(0, 275, 0), waitTime: 0 },
                ],
                loopWaypoints: true,
                moveSpeed: 1.5,
            },
            'endTheSearch': {
                id: 'endTheSearch',
                waypoints: [
                    { position: Vector3.create(32.5,15.55,15), rotation: Quaternion.fromEulerDegrees(0, 265, 0), waitTime: 0 },
                ],
                loopWaypoints: false,
                moveSpeed: 4,
                onComplete: () => {
                    gameMgr.girl.prepareConversation('afterCandlesCollected')
                }
            },
            'walkToShop': {
                id: 'walkToShop',
                waypoints: [
                    { position: Vector3.create(24,15.6,13.45), rotation: Quaternion.fromEulerDegrees(0, 254, 0), waitTime: 0 },
                    { position: Vector3.create(18.6,12.58,12.65), rotation: Quaternion.fromEulerDegrees(0, 266, 0), waitTime: 0 },
                    { position: Vector3.create(12,12.58,13.4), rotation: Quaternion.fromEulerDegrees(0, 318, 0), waitTime: 0 },
                    { position: Vector3.create(5.25,12.55,16.4), rotation: Quaternion.fromEulerDegrees(0, 330, 0), waitTime: 0 },
                    { position: Vector3.create(2.85,12.1,19.4), rotation: Quaternion.fromEulerDegrees(0, 288, 0), waitTime: 0 },
                    { position: Vector3.create(-5.1,11.9,14.65), rotation: Quaternion.fromEulerDegrees(0, 238, 0), waitTime: 0 },
                    { position: Vector3.create(-14.4,10.85,7.45), rotation: Quaternion.fromEulerDegrees(0, 292, 0), waitTime: 0 },
                    { position: Vector3.create(-18.75,11.1,11.1), rotation: Quaternion.fromEulerDegrees(0, 65, 0), waitTime: 0 },
                ],
                loopWaypoints: false,
                moveSpeed: 3.5,
                onComplete: () => {
                    gameMgr.girl.prepareConversation('gotToShop')
                }
            },
            'walkToGraveyard': {
                id: 'walkToGraveyard',
                waypoints: [
                    { position: Vector3.create(-14.23,10.86,7.5), rotation: Quaternion.fromEulerDegrees(0, 48, 0), waitTime: 0 },
                    { position: Vector3.create(-9.1,11.45,11.45), rotation: Quaternion.fromEulerDegrees(0, 48.5, 0), waitTime: 0 },
                    { position: Vector3.create(-3.75,12.1,15.1), rotation: Quaternion.fromEulerDegrees(0, 55, 0), waitTime: 0 },
                    { position: Vector3.create(4.4,12.1,20), rotation: Quaternion.fromEulerDegrees(0, 318, 0), waitTime: 0 },
                ],
                loopWaypoints: false,
                moveSpeed: 3.5,
                onComplete: () => {
                    gameMgr.arrivedAtGraveyard()
                    gameMgr.girl.prepareConversation('optionalGraveyardAssist')
                }
            },
            'walkIntoGraveyard': {
                id: 'walkIntoGraveyard',
                waypoints: [
                    { position: Vector3.create(1.7,11.75,23.55), rotation: Quaternion.fromEulerDegrees(0, 333, 0), waitTime: 0 },
                ],
                loopWaypoints: false,
                moveSpeed: 3.5,
                onComplete: () => {
                    gameMgr.girl.startWaypointSet('distractShadows')
                    //TODO: also animate the shadows to follow the girl
                }
            },
            'distractShadows': {
                id: 'distractShadows',
                waypoints: [
                    { position: Vector3.create(6.55,11.9,26), rotation: Quaternion.fromEulerDegrees(0, 77, 0), waitTime: 0 },
                    { position: Vector3.create(10.7,12.1,27.75), rotation: Quaternion.fromEulerDegrees(0, 352, 0), waitTime: 0 },
                    { position: Vector3.create(8.15,12,32), rotation: Quaternion.fromEulerDegrees(0, 288, 0), waitTime: 0 },
                    { position: Vector3.create(2.8,11.5,35.7), rotation: Quaternion.fromEulerDegrees(0, 297, 0), waitTime: 0 },
                    { position: Vector3.create(-7.4,10.4,33.15), rotation: Quaternion.fromEulerDegrees(0, 235, 0), waitTime: 0 },
                    { position: Vector3.create(-10.45,11.3,23.15), rotation: Quaternion.fromEulerDegrees(0, 216, 0), waitTime: 0 },
                    { position: Vector3.create(-7.2,11.7,20), rotation: Quaternion.fromEulerDegrees(0, 76, 0), waitTime: 0 },
                    { position: Vector3.create(2,11.7,24), rotation: Quaternion.fromEulerDegrees(0, 62, 0), waitTime: 0 },
                ],
                loopWaypoints: true,
                moveSpeed: 6
            },
            'runOutOfGraveyard': {
                id: 'runOutOfGraveyard',
                waypoints: [
                    { position: Vector3.create(1.7,11.75,23.55), rotation: Quaternion.fromEulerDegrees(0, 333, 0), waitTime: 0 },
                    { position: Vector3.create(2.7,12.1,20.3), rotation: Quaternion.fromEulerDegrees(0, 115, 0), waitTime: 0 },
                ],
                loopWaypoints: false,
                moveSpeed: 6,
                onComplete: () => {
                    gameMgr.girl.prepareConversation('thatWasClose')
                }
            },
            'backToTheShop': {
                id: 'backToTheShop',
                waypoints: [
                    { position: Vector3.create(-5.1,11.9,14.65), rotation: Quaternion.fromEulerDegrees(0, 238, 0), waitTime: 0 },
                    { position: Vector3.create(-14.4,10.85,7.45), rotation: Quaternion.fromEulerDegrees(0, 292, 0), waitTime: 0 },
                    { position: Vector3.create(-17.6,11.1,12.4), rotation: Quaternion.fromEulerDegrees(0, 321, 0), waitTime: 0 },
                    { position: Vector3.create(-20.65,11.25,16), rotation: Quaternion.fromEulerDegrees(0, 308, 0), waitTime: 0 },
                    { position: Vector3.create(-22.3,11.25,17.7), rotation: Quaternion.fromEulerDegrees(0, 262, 0), waitTime: 0 },
                ],
                loopWaypoints: false,
                moveSpeed: 6,
                onComplete: () => {
                    gameMgr.shopKeeper.prepareConversation('returnTheWhisper')
                }
            },
            'outsideTheShop': {
                id: 'outsideTheShop',
                waypoints: [
                    { position: Vector3.create(-20.65,11.25,16), rotation: Quaternion.fromEulerDegrees(0, 137, 0), waitTime: 0 },
                    { position: Vector3.create(-17.6,11.1,12.4), rotation: Quaternion.fromEulerDegrees(0, 137, 0), waitTime: 0 },
                    { position: Vector3.create(-14.7,10.85,7.65), rotation: Quaternion.fromEulerDegrees(0, 204, 0), waitTime: 0 },
                ],
                loopWaypoints: false,
                moveSpeed: 3.5,
                onComplete: () => {
                    gameMgr.girl.prepareConversation('lookAtApartments')
                }
            },
            'toTheApartmentBuilding': {
                id: 'toTheApartmentBuilding',
                waypoints: [
                    { position: Vector3.create(-16.85,10.2,3.8), rotation: Quaternion.fromEulerDegrees(0, 207, 0), waitTime: 0 },
                    { position: Vector3.create(-20,10.15,-3.85), rotation: Quaternion.fromEulerDegrees(0, 202, 0), waitTime: 0 },
                ],
                loopWaypoints: false,
                moveSpeed: 3.5,
                onComplete: () => {
                    //gameMgr.girl.prepareConversation('lookAtApartments')
                }
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
                        text: 'Hello! I’m sorry to bother you, but I need help!',
                        nextDialogId: 'player1'
                    },
                    'player1': {
                        speaker: 'player',
                        text: 'What\'s wrong? How can I help?',
                        nextDialogId: 'girl2'
                    },
                    'girl2': {
                        speaker: 'npc',
                        text: 'This isn’t my city — I don’t know what’s happening or how I got here. Please, help me find a way out.',
                        nextDialogId: 'player2'
                    },
                    'player2': {
                        speaker: 'player',
                        text: 'I ended up here by accident too. I’ll help you. Do you know anything about this place?',
                        nextDialogId: 'girl3'
                        /* action: () => {
                            //console.log('Player agreed to help')
                            //gameMgr.girlMet = true
                            console.log('Girl first meeting complete_action')
                            //gameMgr.missionState = 'followingGirl'
                            //gameMgr.missionTitle = 'FOLLOW THE GIRL'
                            //gameMgr.girl.startWaypointSet('walkToFountain')
                        } */
                    },
                    'girl3': {
                        speaker: 'npc',
                        text: 'It’s strange… It looks a bit like the city I know, but this one feels empty. Dead. Let’s go check it out some more.'
                    },
                },
                onComplete: () => {
                    console.log('Girl first meeting complete_onComplete')
                    gameMgr.missionState = 'followingGirl'
                    gameMgr.missionTitle = 'FOLLOW THE GIRL'
                    gameMgr.girl.startWaypointSet('walkToFountain')
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
                        text: 'It\'s October 27th',
                        nextDialogId: 'fountain2'
                    },
                    'fountain2': {
                        speaker: 'npc',
                        text: 'October 27… the night when the veil grows thin  when the gate to the Spirit Realm opens, and the souls of animals return to those who remember them.',
                        nextDialogId: 'fountain3'
                    },
                    'fountain3': {
                        speaker: 'npc',
                        text: 'My cat… she always found me, no matter where I was. If we perform the ritual, she’ll come - and she’ll help us find the way out.',
                        nextDialogId: 'player_question'
                    },
                    'player_question': {
                        speaker: 'player',
                        text: 'A ritual?',
                        nextDialogId: 'fountain4'
                    },
                    'fountain4': {
                        speaker: 'npc',
                        text: 'Yes. But we’ll need to prepare everything first…',
                        nextDialogId: 'fountain5'
                    },
                    'fountain5': {
                        speaker: 'npc',
                        text: 'I know... CANDLES! There should be some in the church.'
                    },
                },
                onComplete: () => {
                    gameMgr.missionState = 'collectingCandles'
                    gameMgr.missionTitle = 'COLLECT 7 CANDLES FROM THE CHURCH'
                    gameMgr.candleMissionInit()
                    
                }
            },
            'afterCandlesCollected': {
                id: 'afterCandlesCollected',
                startDialogId: 'postCandles1',
                dialogs: {
                    'postCandles1': {
                        speaker: 'npc',
                        text: 'Great job! Hang onto those candles. We need them for the ritual.',
                        nextDialogId: 'postCandles2'
                    },
                    'postCandles2': {
                        speaker: 'npc',
                        text: 'The next thing we for the ritual is my cat\'s favorite food.',
                        nextDialogId: 'postCandles3'
                    },
                    'postCandles3': {
                        speaker: 'npc',
                        text: 'That was Happy Murmur. Do you think they would have that at the shop?',
                        nextDialogId: 'player_response'
                    },
                    'player_response': {
                        speaker: 'player',
                        text: 'Let\'s go check it out.'
                    },
                },
                onComplete: () => {
                    gameMgr.missionState = 'headingToShop'
                    gameMgr.missionTitle = 'HEAD TO THE SHOP'
                    gameMgr.girl.startWaypointSet('walkToShop')
                }
            },
            'gotToShop': {
                id: 'gotToShop',
                startDialogId: 'postCandles1',
                dialogs: {
                    'postCandles1': {
                        speaker: 'npc',
                        text: 'I don\'t like the look of this shop... it\'s creepy. I\'ll wait here while you go in and get the food.'
                    },
                },
                onComplete: () => {
                    gameMgr.missionState = 'checkForFood'
                    gameMgr.missionTitle = 'TALK TO THE SHOPKEEPER'
                    gameMgr.shopKeeper.prepareConversation('initialShopTalk')
                }
            },
            'tellAboutJar': {
                id: 'tellAboutJar',
                startDialogId: 'haveJar1',
                dialogs: {
                    'haveJar1': {
                        speaker: 'player',
                        text: 'That was weird. He won\'t take my money. He says we need a whisper from the graveyard.',
                        nextDialogId: 'girlJar1'
                    },
                    'girlJar1': {
                        speaker: 'npc',
                        text: 'Well, we don\'t have much time. We need to get the food and perform the ritual.',
                        nextDialogId: 'haveJar2'
                    },
                    'haveJar2': {
                        speaker: 'player',
                        text: 'He gave me this jar to collect the whisper. Let\'s get this over with...',
                    },
                },
                onComplete: () => {
                    gameMgr.prepareTheGraveyard()
                }
            },
            'optionalGraveyardAssist': {
                id: 'optionalGraveyardAssist',
                startDialogId: 'assist1',
                dialogs: {
                    'assist1': {
                        speaker: 'npc',
                        text: 'I don\'t like the look of those shadows swirling around in there. Stay away from them.',
                        nextDialogId: 'assist2'
                    },
                    'assist2': {
                        speaker: 'npc',
                        text: 'I know... I will distract them while you collect the whisper.',
                    },
                },
                onComplete: () => {
                    gameMgr.girl.startWaypointSet('walkIntoGraveyard')
                }
            },
            'thatWasClose': {
                id: 'thatWasClose',
                startDialogId: 'close1',
                dialogs: {
                    'close1': {
                        speaker: 'npc',
                        text: 'That was close! We need to get back to the shop.',
                    }
                },
                onComplete: () => {
                    gameMgr.missionState = 'backToTheShop'
                    gameMgr.missionTitle = 'RETURN TO THE SHOP'
                    gameMgr.girl.startWaypointSet('backToTheShop')
                }
            },
            'lookAtApartments': {
                id: 'lookAtApartments',
                startDialogId: 'lookAt1',
                dialogs: {
                    'lookAt1': {
                        speaker: 'npc',
                        text: 'I need to write a letter for the ritual. We will need a paper and a pen.',
                        nextDialogId: 'lookAt2'
                    },
                    'lookAt2': {
                        speaker: 'npc',
                        text: 'If this is anything like the city I know, there should be a writer that lives in that building right there.',
                        nextDialogId: 'playerLook1'
                    },
                    'playerLook1': {
                        speaker: 'player',
                        text: 'The tall one?',
                        nextDialogId: 'lookAt3'
                    },
                    'lookAt3': {
                        speaker: 'npc',
                        text: 'Yep. I just need to remember which apartment she lives in. I know it was on the top floor.',
                    }
                },
                onComplete: () => {
                    gameMgr.missionState = 'headedToApartments'
                    gameMgr.missionTitle = 'FIND THE WRITER'
                    gameMgr.girl.startWaypointSet('toTheApartmentBuilding')
                }
            }
        },
        
        canGiveItems: true,
        itemsToGive: ['key']
    })
}

export function createShopOwnerNPC(gameMgr: GameManager): NPC {
    //SHOP OWNER
    //-25,11.25,17.5 (BEHIND COUNTER)

    return new NPC(gameMgr, {
        id: 'shopKeeper',
        name: 'Shop Keeper',
        startPosition: Vector3.create(-25,11.25,17.5),
        startRotation: Quaternion.fromEulerDegrees(0,150,0),

        useAvatar: false,
        useDefaultAvatar: false,
        /* avatarData: {
            bodyShape: 'urn:decentraland:off-chain:base-avatars:BaseFemale',
            wearables: [
                'urn:decentraland:off-chain:base-avatars:brown_pants',
                'urn:decentraland:off-chain:base-avatars:blue_tshirt',
                //'urn:decentraland:matic:collections-v2:0x768c1027b1f1a452ecb8dab017a1e630a75f0d30:0',//(spopky girl)
            ]
        }, */

        modelPath: 'models/char/shopkeepA.glb',

        // NEW: Define animations with loop and speed defaults
        animations: [
            { name: 'Walking', loop: true, speed: 1.0 },
            { name: 'Talk_with_Left_Hand_on_Hip', loop: true, speed: 1.2 },
            { name: 'Talk_with_Hands_Open', loop: true, speed: 1 },
            { name: 'Talk_Passionately', loop: true, speed: 1 },
            { name: 'Shrug', loop: false, speed: 1.0 },
            { name: 'Running', loop: true, speed: 1 },
            { name: 'Male_Bend_Over_Pick_Up', loop: false, speed: 1.0 },
            { name: 'Idle_9', loop: true, speed: 1 },
            { name: 'Checkout_Gesture', loop: false, speed: 1.0 }
        ],
        defaultAnimation: 'Talk_Passionately',

        // ADD THIS - Maps the system's concept of "idle" and "walk" to your actual animation names
        animationNames: {
            idle: 'Idle_9',    // What to play when not moving
            walk: 'Walking',    // What to play when walking
            run: 'Running',     // What to play when running (if needed)
            talk: 'Talk_Passionately' // What to play when talking (if needed)
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
                moveSpeed: 2.0,
                // onComplete: () => {
                //     console.log('Shop keeper returned to counter')
                // }
            },
            'walkToStorage': {
                id: 'walkToStorage',
                waypoints: [
                    { position: Vector3.create(-26, 6, 16), rotation: Quaternion.fromEulerDegrees(0, 270, 0), waitTime: 1 },
                    { position: Vector3.create(-23, 6, 16), rotation: Quaternion.fromEulerDegrees(0, 180, 0), waitTime: 0 }
                ],
                loopWaypoints: false,
                moveSpeed: 2.0,
                // onComplete: () => {
                //     console.log('Shop keeper retrieved item from storage')
                // }
            }
        },
        
        defaultDialogs: [
            "Welcome to my shop!",
            "Looking for something?",
            "Sorry, we're out of stock on that."
        ],
        
        conversationSets: {
            'initialShopTalk': {
                id: 'initialShopTalk',
                startDialogId: 'shop1',
                dialogs: {
                    'shop1': {
                        speaker: 'npc',
                        text: 'Hello! Looking for supplies?',
                        nextDialogId: 'player1'
                    },
                    'player1': {
                        speaker: 'player',
                        text: 'Yes, we need a can of Happy Murmur cat food. Do you have that?',
                        nextDialogId: 'shop2'
                    },
                    'shop2': {
                        speaker: 'npc',
                        text: 'It just so happens I have one can left.',
                        nextDialogId: 'player2'
                    },
                    'player2': {
                        speaker: 'player',
                        text: 'How much does it cost? (pulling out some coins)',
                        nextDialogId: 'shop3'
                    },
                    'shop3': {
                        speaker: 'npc',
                        text: 'We don\'t trade in coins here. Our currency is memory, breath, and whispers of the lost.',
                        nextDialogId: 'shop4'
                    },
                    'shop4': {
                        speaker: 'npc',
                        text: 'Bring me a whisper from the graveyard — the voice of one who won\'t rest. Then we\'ll talk.',
                        nextDialogId: 'shop5'
                    },
                    'shop5': {
                        speaker: 'npc',
                        text: 'Use this to catch it… but be careful — the dead don\'t like to be disturbed.'
                    }
                },
                onComplete: () => {
                    gameMgr.shopKeeperGivingJar()
                }
            },
            'returnTheWhisper': {
                id: 'returnTheWhisper',
                startDialogId: 'whisper1',
                dialogs: {
                    'whisper1': {
                        speaker: 'npc',
                        text: 'Well, I didn\'t expect to see you again. Did you bring the whisper?',
                        nextDialogId: 'playerWhisper1'
                    },
                    'playerWhisper1': {
                        speaker: 'player',
                        text: 'Guess you underestimated us. We got the whisper.',
                        nextDialogId: 'whisper2'
                    },
                    'whisper2': {
                        speaker: 'npc',
                        text: 'Fair enough. Here\'s your can of Happy Murmur.',
                        nextDialogId: 'whisper3'
                    },
                    'whisper3': {
                        speaker: 'npc',
                        text: 'Best of luck on your journey. May the spirits guide you.',
                    }
                },
                onComplete: () => {
                    gameMgr.missionState = 'haveTheCatFood'
                    gameMgr.missionTitle = 'FOLLOW THE GIRL'
                    gameMgr.girl.startWaypointSet('outsideTheShop')
                }
            },
        },
        
        canGiveItems: false
    })
}

export function createTempleShamanNPC(gameMgr: GameManager): NPC {
    return new NPC(gameMgr, {
        id: 'templeShaman',
        name: 'Temple Shaman',
        startPosition: Vector3.create(-32.25,45.35,59),
        startRotation: Quaternion.fromEulerDegrees(0,180,0),

        useAvatar: true,
        useDefaultAvatar: false,
        avatarData: {
            bodyShape: 'urn:decentraland:off-chain:base-avatars:BaseMale',
            wearables: [
                'urn:decentraland:off-chain:base-avatars:brown_pants',
                'urn:decentraland:off-chain:base-avatars:blue_tshirt',
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
                moveSpeed: 1.5,
                // onComplete: () => {
                //     console.log('Temple Shaman reached altar - performing ritual')
                // }
            },
            'walkToEntrance': {
                id: 'walkToEntrance',
                waypoints: [
                    { position: Vector3.create(-34, 39, 48), rotation: Quaternion.fromEulerDegrees(0, 180, 0), waitTime: 1 },
                    { position: Vector3.create(-34, 39, 52), rotation: Quaternion.fromEulerDegrees(0, 0, 0), waitTime: 0 }
                ],
                loopWaypoints: false,
                moveSpeed: 1.5,
                // onComplete: () => {
                //     console.log('Temple Shaman returned to entrance')
                // }
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
                            gameMgr.missionState = 'metTempleShaman'
                        }
                    }
                }
            }
        },
        
        canGiveItems: false
    })
}

export function createOldLadyNPC(gameMgr: GameManager, pos: Vector3, rot: Quaternion): NPC {
    return new NPC(gameMgr, {
        id: 'oldLady',
        name: 'Old Lady',
       //startPosition: Vector3.create(-27,10.55,2.5),
        //startRotation: Quaternion.fromEulerDegrees(0,0,0),
        startPosition: pos,
        startRotation: rot,
        useAvatar: false,
        useDefaultAvatar: false,
        /* avatarData: {
            bodyShape: 'urn:decentraland:off-chain:base-avatars:BaseFemale',
            wearables: [
                'urn:decentraland:off-chain:base-avatars:brown_pants',
                'urn:decentraland:off-chain:base-avatars:blue_tshirt',
                //'urn:decentraland:matic:collections-v2:0x768c1027b1f1a452ecb8dab017a1e630a75f0d30:0',//(spopky girl)
            ]
        }, */

        modelPath: 'models/char/oldLadyA.glb',

        // NEW: Define animations with loop and speed defaults
        animations: [
            { name: 'Walking', loop: true, speed: 1.0 },
            { name: 'open_door', loop: true, speed: 1.2 },
            { name: 'Sitting_Answering_Questions', loop: true, speed: 1 },
            { name: 'Sit_and_Drink', loop: true, speed: 1 },
            { name: 'Running', loop: false, speed: 1.0 },
            { name: 'Elderly_Shaky_Walk_inplace', loop: true, speed: 1 },
            //{ name: 'Jump_Over_Obstacle_2', loop: false, speed: 1.0 },
            { name: 'Idle_4', loop: true, speed: 1 },
            //{ name: 'Idle_7', loop: false, speed: 1.0 },
            //{ name: 'Idle_6', loop: false, speed: 1.0 }
        ],
        defaultAnimation: 'Idle_4',

        // ADD THIS - Maps the system's concept of "idle" and "walk" to your actual animation names
        animationNames: {
            idle: 'Idle_4',    // What to play when not moving
            walk: 'Elderly_Shaky_Walk_inplace',    // What to play when walking
            run: 'Running',     // What to play when running (if needed)
            talk: 'Idle_4' // What to play when talking (if needed)
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
                moveSpeed: 1.0,
                // onComplete: () => {
                //     console.log('Old Lady sat down on bench to rest')
                // }
            },
            'walkToGarden': {
                id: 'walkToGarden',
                waypoints: [
                    { position: Vector3.create(-26, 6, 4), rotation: Quaternion.fromEulerDegrees(0, 180, 0), waitTime: 2 },
                    { position: Vector3.create(-26, 6, 1), rotation: Quaternion.fromEulerDegrees(0, 0, 0), waitTime: 0 }
                ],
                loopWaypoints: false,
                moveSpeed: 1.0,
                // onComplete: () => {
                //     console.log('Old Lady admiring the garden')
                // }
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
                            gameMgr.missionState = 'metOldLady'
                        }
                    }
                }
            }
        },
        
        canGiveItems: false
    })
}

export function createDoormanNPC(gameMgr: GameManager): NPC {
    return new NPC(gameMgr, {
        id: 'doorman',
        name: 'Doorman',
        startPosition: Vector3.create(-21.75,10.1,-1.75),
        startRotation: Quaternion.fromEulerDegrees(0,0,0),

        useAvatar: false,
        useDefaultAvatar: false,
        /* avatarData: {
            bodyShape: 'urn:decentraland:off-chain:base-avatars:BaseFemale',
            wearables: [
                'urn:decentraland:off-chain:base-avatars:brown_pants',
                'urn:decentraland:off-chain:base-avatars:blue_tshirt',
                //'urn:decentraland:matic:collections-v2:0x768c1027b1f1a452ecb8dab017a1e630a75f0d30:0',//(spopky girl)
            ]
        }, */

        modelPath: 'models/char/oldManA1.glb',

        // NEW: Define animations with loop and speed defaults
        animations: [
            { name: 'Walking', loop: true, speed: 1.0 },
            /* 
            { name: 'Talk_with_Left_Hand_on_Hip', loop: true, speed: 1.2 },
            { name: 'Talk_with_Hands_Open', loop: true, speed: 1 },
            { name: 'Talk_Passionately', loop: true, speed: 1 },
            { name: 'Shrug', loop: false, speed: 1.0 },
            { name: 'Running', loop: true, speed: 1 },
            { name: 'Male_Bend_Over_Pick_Up', loop: false, speed: 1.0 },
            { name: 'Idle_9', loop: true, speed: 1 },
            { name: 'Checkout_Gesture', loop: false, speed: 1.0 } */
        ],
        defaultAnimation: 'idle',

        // ADD THIS - Maps the system's concept of "idle" and "walk" to your actual animation names
        animationNames: {
            idle: 'idle',    // What to play when not moving
            walk: 'walk',    // What to play when walking
            run: 'run',     // What to play when running (if needed)
            talk: 'talk' // What to play when talking (if needed)
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
                // Note: onComplete won't trigger for looping waypoint sets
            },
            'walkToGate': {
                id: 'walkToGate',
                waypoints: [
                    { position: Vector3.create(-26, 6, 10), rotation: Quaternion.fromEulerDegrees(0, 180, 0), waitTime: 1 },
                    { position: Vector3.create(-26, 6, 5), rotation: Quaternion.fromEulerDegrees(0, 0, 0), waitTime: 0 }
                ],
                loopWaypoints: false,
                moveSpeed: 2.0,
                // onComplete: () => {
                //     console.log('Doorman investigated disturbance and returned')
                // }
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
                            gameMgr.missionState = 'metDoorman'
                        }
                    }
                }
            }
        },
        
        canGiveItems: false
    })
}

export function createLibrarianNPC(gameMgr: GameManager): NPC {
    return new NPC(gameMgr, {
        id: 'librarian',
        name: 'Librarian',
        startPosition: Vector3.create(-53,27.25,21.5),
        startRotation: Quaternion.fromEulerDegrees(0,110,0),

        useAvatar: true,
        useDefaultAvatar: false,
        avatarData: {
            bodyShape: 'urn:decentraland:off-chain:base-avatars:BaseFemale',
            wearables: [
                'urn:decentraland:off-chain:base-avatars:brown_pants',
                'urn:decentraland:off-chain:base-avatars:blue_tshirt',
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
                moveSpeed: 1.5,
                // onComplete: () => {
                //     console.log('Librarian found the book and returned')
                // }
            },
            'walkToDesk': {
                id: 'walkToDesk',
                waypoints: [
                    { position: Vector3.create(-26, 6, 4), rotation: Quaternion.fromEulerDegrees(0, 180, 0), waitTime: 1 },
                    { position: Vector3.create(-26, 6, 1), rotation: Quaternion.fromEulerDegrees(0, 0, 0), waitTime: 0 }
                ],
                loopWaypoints: false,
                moveSpeed: 1.5,
                // onComplete: () => {
                //     console.log('Librarian back at desk ready to help')
                // }
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
                            gameMgr.missionState = 'metLibrarian'
                        }
                    }
                }
            }
        },
        
        canGiveItems: false
    })
}

export function createMonsterNPC(gameMgr: GameManager): NPC {
    return new NPC(gameMgr, {
        id: 'monster',
        name: 'monster',
        startPosition: Vector3.create(14.25,12.6,11.5),
        startRotation: Quaternion.fromEulerDegrees(0,319,0),

        useAvatar: false,
        useDefaultAvatar: false,
        /* 
        avatarData: {
            bodyShape: 'urn:decentraland:off-chain:base-avatars:BaseFemale',
            wearables: [
                'urn:decentraland:off-chain:base-avatars:brown_pants',
                'urn:decentraland:off-chain:base-avatars:blue_tshirt',
            ]
        }, */
        modelPath: 'models/char/monsterA.glb',

        // NEW: Define animations with loop and speed defaults
        animations: [
            { name: 'Walking', loop: true, speed: 1.0 },
            { name: 'Zombie_Scream', loop: true, speed: 1.2 },
            { name: 'Unsteady_Walk', loop: true, speed: 1 },
            { name: 'Female_Run_Forward_Pick_Up_Right', loop: true, speed: 1 },
            { name: 'Running', loop: false, speed: 1.0 }
        ],
        defaultAnimation: 'Walking',

        // ADD THIS - Maps the system's concept of "idle" and "walk" to your actual animation names
        animationNames: {
            idle: 'Unsteady_Walk',    // What to play when not moving
            walk: 'Walking',    // What to play when walking
            run: 'Running',     // What to play when running (if needed)
            talk: 'Zombie_Scream' // What to play when talking (if needed)
        },

        clickable: false,
        clickHoverText: 'YOU BETTER RUN!',
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
                moveSpeed: 1.5,
                // onComplete: () => {
                //     console.log('Librarian found the book and returned')
                // }
            },
            'walkToDesk': {
                id: 'walkToDesk',
                waypoints: [
                    { position: Vector3.create(-26, 6, 4), rotation: Quaternion.fromEulerDegrees(0, 180, 0), waitTime: 1 },
                    { position: Vector3.create(-26, 6, 1), rotation: Quaternion.fromEulerDegrees(0, 0, 0), waitTime: 0 }
                ],
                loopWaypoints: false,
                moveSpeed: 1.5,
                // onComplete: () => {
                //     console.log('Librarian back at desk ready to help')
                // }
            }
        },
        
        defaultDialogs: [
            /* "Welcome to the library.",
            "Please keep quiet.",
            "All books must be returned in two weeks." */
        ],
        
        conversationSets: {
            /* 'librarianTalk': {
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
                            gameMgr.missionState = 'metLibrarian'
                        }
                    }
                }
            } */
        },
        
        canGiveItems: false
    })
}

