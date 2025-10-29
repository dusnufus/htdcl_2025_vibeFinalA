// src/interactiveEntityCreation.ts

import { Vector3, Quaternion } from '@dcl/sdk/math'
import { InteractiveEntity } from './components/interactiveEntity'
import { GameManager } from './gameMgr'

export function createZombieEnemy(gameMgr: GameManager): InteractiveEntity {
    return new InteractiveEntity(gameMgr, {
        id: 'zombie1',
        modelPath: 'models/enemies/zombie.glb',
        position: Vector3.create(10, 0, 10),
        rotation: Quaternion.fromEulerDegrees(0, 180, 0),
        
        animations: [
            { name: 'Idle', loop: true, speed: 1.0 },
            { name: 'Walk', loop: true, speed: 1.2 },
            { name: 'Chase', loop: true, speed: 1.5 },
            { name: 'Attack', loop: false, speed: 2.0 }
        ],
        defaultAnimation: 'Idle',
        animationNames: {
            idle: 'Idle',
            walk: 'Walk',
            attack: 'Attack'
        },
        chaseAnimation: 'Chase',
        
        waypointSets: {
            patrol: {
                id: 'patrol',
                waypoints: [
                    { position: Vector3.create(10, 0, 10), rotation: Quaternion.fromEulerDegrees(0, 0, 0), waitTime: 2 },
                    { position: Vector3.create(20, 0, 10), rotation: Quaternion.fromEulerDegrees(0, 0, 0), waitTime: 0 }
                ],
                loopWaypoints: true,
                moveSpeed: 1.5
            }
        },
        autoStartWaypointSet: 'patrol',
        soundOnWaypointComplete: {
            clip: 'sounds/groan.wav',
            volume: 0.7
        },
        
        chaseSpeed: 4.0,
        soundOnChaseStart: {
            clip: 'sounds/zombie_alert.wav',
            volume: 1.0
        },
        onChaseStart: () => {
            console.log('Zombie alerted!')
        },
        onChaseReached: () => {
            console.log('Player caught!')
            gameMgr.playerMgr.respawnAtCheckpoint()
        },
        
        hasCollision: true,
        collisionScale: Vector3.create(1.5, 2, 1.5),
        soundOnPlayerCollide: {
            clip: 'sounds/attack.wav',
            volume: 1.0
        },
        damageOnCollide: 50,
        onPlayerCollide: () => {
            console.log('Player takes damage!')
        }
    })
}

export function createShadowEnemy(gameMgr: GameManager): InteractiveEntity {
    return new InteractiveEntity(gameMgr, {
        id: 'shadow1',
        modelPath: 'models/enemies/shadow.glb',
        position: Vector3.create(15, 0, 15),
        rotation: Quaternion.fromEulerDegrees(0, 90, 0),
        
        animations: [
            { name: 'idle', loop: true, speed: 1.0 },
            { name: 'chase', loop: true, speed: 1.5 }
        ],
        defaultAnimation: 'idle',
        animationNames: {
            idle: 'idle'
        },
        chaseAnimation: 'chase',
        
        waypointSets: {
            float: {
                id: 'float',
                waypoints: [
                    { position: Vector3.create(15, 0, 15), rotation: Quaternion.fromEulerDegrees(0, 90, 0), waitTime: 3 },
                    { position: Vector3.create(20, 0, 20), rotation: Quaternion.fromEulerDegrees(0, 90, 0), waitTime: 3 }
                ],
                loopWaypoints: true,
                moveSpeed: 2.0
            }
        },
        autoStartWaypointSet: 'float',
        
        chaseSpeed: 3.0,
        onChaseStart: () => {
            console.log('Shadow started chasing player!')
        },
        onChaseReached: () => {
            console.log('Player caught by shadow!')
            gameMgr.playerMgr.respawnAtCheckpoint()
        },
        
        hasCollision: true,
        collisionScale: Vector3.create(1.0, 1.5, 1.0),
        collisionShape: 'sphere',
        damageOnCollide: 30
    })
}

// Add more enemy creation functions as needed...

//--skeleton animations
//run_fast_8_inplace
//Zoombie_Scream
//Walking
//Unsteady_Walk
//Running

//--Shop anamations
//Walking
//Talk_with_Left_Hand_on_Hip
//Talk_with_Hands_Open
//Talk_Passionately
//Shrug
//Running
//Male_Bend_Over_Pick_Up
//Idle_9
//Checkout_Gesture


//--library animations
//Walking
//Running
//Idle_4
//Elderly_Shaky_Walk
//Confused_Scratch
//Checkout_Gesture
//Chair_Sit_Idle_F

//NOT SURE animations
//Walking
//Talk_with_Left_Hand_on_Hip
//Running
//Idle_4
//Elderly_Shaky_Walk
//Confused_Scratch
//Checkout_Gesture
//Chair_Sit_Idle_F
