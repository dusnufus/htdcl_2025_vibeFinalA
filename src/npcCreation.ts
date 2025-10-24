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
        startPosition: Vector3.create(30, 6, 59),
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
                    { position: Vector3.create(32, 6, 56), rotation: Quaternion.fromEulerDegrees(0, 180, 0), waitTime: 0 },
                    { position: Vector3.create(30, 6, 44), rotation: Quaternion.fromEulerDegrees(0, 180, 0), waitTime: 0 }
                ],
                loopWaypoints: false,
                moveSpeed: 3.5,
                onComplete: () => {
                    //console.log('Girl ran out of house - ready for player interaction')
                    gameMgr.girl.startConversation('firstMeeting')
                }
            },
            'walkToFountain': {
                id: 'walkToFountain',
                waypoints: [
                    { position: Vector3.create(20, 7, 30), rotation: Quaternion.fromEulerDegrees(0, 90, 0), waitTime: 1 },
                    { position: Vector3.create(10, 8, 16), rotation: Quaternion.fromEulerDegrees(0, 270, 0), waitTime: 0 }
                ],
                loopWaypoints: false,
                moveSpeed: 2.0,
                // onComplete: () => {
                //     console.log('Girl arrived at fountain')
                //     gameMgr.girl.startConversation('atFountain')
                // }
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
                            //gameMgr.girlMet = true
                        }
                    }
                },
                onComplete: () => {
                    gameMgr.missionState = 'followingGirl'
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
                    gameMgr.missionState = 'collectingItems'
                    gameMgr.missionTitle = 'COLLECT RITUAL ITEMS'
                }
            }
        },
        
        canGiveItems: true,
        itemsToGive: ['key']
    })
}

export function createShopOwnerNPC(gameMgr: GameManager): NPC {
    //SHOP OWNER
    //-23,6,16 (BEHIND COUNTER)

    return new NPC(gameMgr, {
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
                            gameMgr.missionState = 'metShopOwner'
                        }
                    }
                }
            }
        },
        
        canGiveItems: false
    })
}

export function createTempleShamanNPC(gameMgr: GameManager): NPC {
    return new NPC(gameMgr, {
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

export function createOldLadyNPC(gameMgr: GameManager): NPC {
    return new NPC(gameMgr, {
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
        startPosition: Vector3.create(-26,6,5),
        startRotation: Quaternion.fromEulerDegrees(0,0,0),

        useAvatar: true,
        avatarData: {
            bodyShape: 'urn:decentraland:off-chain:base-avatars:BaseMale',
            wearables: [
                "urn:decentraland:matic:collections-v2:0xc714bac4b6af6c7407dd4f6587ed332aa21fad84:0", 
                "urn:decentraland:off-chain:base-avatars:brown_pants", 
                'urn:decentraland:matic:collections-v2:0xbcc888ae057f3490fa0b5c03977af9c80bdd9b49:0' 
            ]
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

