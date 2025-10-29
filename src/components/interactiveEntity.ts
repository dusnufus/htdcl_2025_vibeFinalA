// src/components/interactiveEntity.ts

import { 
    engine, Entity, Transform, GltfContainer,
    MeshCollider, MeshRenderer, Animator, AudioSource,TriggerArea,triggerAreaEventsSystem
} from '@dcl/sdk/ecs'
import { Vector3, Quaternion } from '@dcl/sdk/math'
import { GameManager } from '../gameMgr'

// Import shared interfaces from npc.ts
export interface AnimationConfig {
    name: string
    loop: boolean
    speed: number
}

export interface WaypointData {
    position: Vector3
    rotation: Quaternion
    waitTime?: number
}

export interface WaypointSet {
    id: string
    waypoints: WaypointData[]
    loopWaypoints?: boolean
    moveSpeed?: number
    onComplete?: () => void
}

export interface SoundConfig {
    clip: string
    volume?: number
    loop?: boolean
}

export interface ReactiveEntityConfig extends InteractiveEntityConfig {
    // Reactive animation system (simplified)
    animateOnAnimation?: string      // Animation name for "on" state (e.g., "AnimateOn")
    animateOffAnimation?: string     // Animation name for "off" state (e.g., "AnimateOff")
    animationSpeed?: number          // Speed for both animations (default: 1.0)
    
    // Trigger zone
    triggerRadius?: number           // For proximity trigger
    triggerBox?: Vector3             // For box trigger
    
    // Sound triggers
    soundOnTriggerEnter?: SoundConfig
    soundOnAnimationComplete?: SoundConfig
    soundOnReverseComplete?: SoundConfig
    
    // Callbacks
    onAnimationComplete?: () => void
    onReverseComplete?: () => void
}

export interface InteractiveEntityConfig {
    id: string
    modelPath: string
    position: Vector3
    rotation: Quaternion
    scale?: Vector3
    enabled?: boolean
    
    // Animation system
    animations?: AnimationConfig[]
    defaultAnimation?: string
    animationNames?: { [state: string]: string }
    chaseAnimation?: string
    
    // Waypoint system
    waypointSets?: { [key: string]: WaypointSet }
    autoStartWaypointSet?: string
    soundOnWaypointComplete?: SoundConfig
    
    // Chase system
    chaseSpeed?: number
    soundOnChaseStart?: SoundConfig
    onChaseStart?: () => void
    onChaseReached?: () => void
    
    // Collision system
    hasCollision?: boolean
    collisionScale?: Vector3
    collisionOffset?: Vector3
    collisionShape?: 'box' | 'sphere'
    soundOnPlayerCollide?: SoundConfig
    onPlayerCollide?: () => void
    damageOnCollide?: number
    
    // Manual sound trigger
    soundOnCustom?: SoundConfig
}

export class InteractiveEntity {
    entity: Entity
    collisionEntity?: Entity
    config: InteractiveEntityConfig
    gameMgr: GameManager
    
    // State
    isEnabled: boolean = true
    state: 'idle' | 'moving' | 'chasing' | 'waiting' | 'disabled' = 'idle'
    previousState: 'idle' | 'moving' | 'chasing' | 'waiting' | 'disabled' = 'idle'
    
    // Animation
    currentAnimation: string = ''
    animationConfigs: Map<string, AnimationConfig> = new Map()
    animationNames: { [state: string]: string } = {}
    
    // Movement
    currentWaypointSet?: WaypointSet
    currentWaypointIndex: number = -1
    movementProgress: number = 0
    startMovePosition: Vector3 = Vector3.Zero()
    targetMovePosition: Vector3 = Vector3.Zero()
    waitTimeRemaining: number = 0
    
    // Chasing
    chaseTarget?: Entity
    chaseSpeed: number = 3.0
    
    constructor(_gameMgr: GameManager, _config: InteractiveEntityConfig) {
        console.log(`InteractiveEntity: Creating ${_config.id}`)
        
        this.gameMgr = _gameMgr
        this.config = _config
        this.isEnabled = _config.enabled !== false  // Default true
        this.animationNames = _config.animationNames || {}
        
        // Create entity
        this.entity = engine.addEntity()
        
        // Load model
        GltfContainer.create(this.entity, {
            src: _config.modelPath
        })
        
        // Set transform
        Transform.create(this.entity, {
            position: _config.position,
            rotation: _config.rotation,
            scale: _config.scale || Vector3.create(1, 1, 1)
        })
        
        // Setup animations
        if (_config.animations && _config.animations.length > 0) {
            _config.animations.forEach(animConfig => {
                this.animationConfigs.set(animConfig.name, animConfig)
            })
            
            const animatorStates = _config.animations.map(animConfig => ({
                clip: animConfig.name,
                loop: animConfig.loop,
                playing: false,
                weight: 0,
                speed: animConfig.speed
            }))
            
            Animator.create(this.entity, {
                states: animatorStates
            })
            
            // Play default animation
            const defaultAnim = _config.defaultAnimation || _config.animations[0].name
            if (this.animationConfigs.has(defaultAnim)) {
                this.playAnimation(defaultAnim)
            }
        }
        
        // Setup collision
        if (_config.hasCollision) {
            const colliderSize = _config.collisionScale || Vector3.create(1, 2, 1)
            const colliderOffset = _config.collisionOffset || Vector3.Zero()
            
            this.collisionEntity = engine.addEntity()
            Transform.create(this.collisionEntity, {
                parent: this.entity,
                position: colliderOffset,
                scale: colliderSize
            })
            
            if (_config.collisionShape === 'sphere') {
                MeshCollider.setSphere(this.collisionEntity)
            } else {
                MeshCollider.setBox(this.collisionEntity)
            }
        }
        
        // Start auto waypoint set if specified
        if (_config.autoStartWaypointSet) {
            this.startWaypointSet(_config.autoStartWaypointSet)
        }
        
        // Add update system
        engine.addSystem((dt: number) => {
            this.update(dt)
        })
    }
    
    update(dt: number) {
        if (!this.isEnabled) return
        
        // Handle waiting
        if (this.state === 'waiting') {
            this.waitTimeRemaining -= dt
            if (this.waitTimeRemaining <= 0) {
                this.state = 'idle'
                this.moveToNextWaypoint()
            }
        }
        
        // Handle waypoint movement
        if (this.state === 'moving' && this.currentWaypointSet) {
            const moveSpeed = this.currentWaypointSet.moveSpeed || 2.0
            this.movementProgress += dt * moveSpeed
            
            const distance = Vector3.distance(this.startMovePosition, this.targetMovePosition)
            
            if (this.movementProgress >= distance) {
                this.arriveAtWaypoint()
            } else {
                const t = this.movementProgress / distance
                const newPos = Vector3.lerp(this.startMovePosition, this.targetMovePosition, t)
                Transform.getMutable(this.entity).position = newPos
            }
        }
        
        // Handle chasing
        if (this.state === 'chasing' && this.chaseTarget) {
            this.updateChase(dt)
        }
    }
    
    updateChase(dt: number) {
        if (!this.chaseTarget || !Transform.has(this.chaseTarget)) {
            this.stopChase()
            return
        }
        
        const targetPosition = Transform.get(this.chaseTarget).position
        const currentPosition = Transform.get(this.entity).position
        
        const direction = Vector3.subtract(targetPosition, currentPosition)
        const distance = Vector3.length(direction)
        
        if (distance < 0.5) {
            if (this.config.onChaseReached) {
                this.config.onChaseReached()
            }
            this.stopChase()
            return
        }
        
        const normalizedDir = Vector3.normalize(direction)
        const newPosition = Vector3.add(currentPosition, 
            Vector3.scale(normalizedDir, this.chaseSpeed * dt))
        
        Transform.getMutable(this.entity).position = newPosition
        
        const lookDirection = Vector3.create(normalizedDir.x, 0, normalizedDir.z)
        if (Vector3.length(lookDirection) > 0) {
            const lookRotation = Quaternion.lookRotation(lookDirection)
            Transform.getMutable(this.entity).rotation = lookRotation
        }
    }
    
    startChase(targetEntity: Entity, speed?: number) {
        this.stopMovement()
        this.chaseTarget = targetEntity
        this.chaseSpeed = speed || this.config.chaseSpeed || 3.0
        this.state = 'chasing'
        
        if (this.config.chaseAnimation) {
            this.playAnimation(this.config.chaseAnimation)
        }
        
        if (this.config.soundOnChaseStart) {
            this.playSound(this.config.soundOnChaseStart)
        }
        
        if (this.config.onChaseStart) {
            this.config.onChaseStart()
        }
    }
    
    stopChase() {
        this.chaseTarget = undefined
        this.state = 'idle'
        
        if (this.animationNames.idle) {
            this.playAnimation(this.animationNames.idle)
        }
    }
    
    startWaypointSet(setId: string) {
        if (!this.config.waypointSets || !this.config.waypointSets[setId]) return
        
        this.currentWaypointSet = this.config.waypointSets[setId]
        this.currentWaypointIndex = -1
        this.moveToNextWaypoint()
    }
    
    moveToNextWaypoint() {
        if (!this.currentWaypointSet) return
        
        this.currentWaypointIndex++
        
        if (this.currentWaypointIndex >= this.currentWaypointSet.waypoints.length) {
            if (this.currentWaypointSet.loopWaypoints) {
                this.currentWaypointIndex = 0
            } else {
                this.state = 'idle'
                
                if (this.config.soundOnWaypointComplete) {
                    this.playSound(this.config.soundOnWaypointComplete)
                }
                
                if (this.currentWaypointSet.onComplete) {
                    this.currentWaypointSet.onComplete()
                }
                return
            }
        }
        
        const nextWaypoint = this.currentWaypointSet.waypoints[this.currentWaypointIndex]
        this.startMovePosition = Transform.get(this.entity).position
        this.targetMovePosition = nextWaypoint.position
        this.movementProgress = 0
        this.state = 'moving'
        
        if (this.animationNames.walk) {
            this.playAnimation(this.animationNames.walk)
        }
    }
    
    arriveAtWaypoint() {
        const waypoint = this.currentWaypointSet!.waypoints[this.currentWaypointIndex]
        Transform.getMutable(this.entity).position = waypoint.position
        Transform.getMutable(this.entity).rotation = waypoint.rotation
        
        if (waypoint.waitTime && waypoint.waitTime > 0) {
            this.state = 'waiting'
            this.waitTimeRemaining = waypoint.waitTime
            
            if (this.animationNames.idle) {
                this.playAnimation(this.animationNames.idle)
            }
        } else {
            this.state = 'idle'
            if (this.animationNames.idle) {
                this.playAnimation(this.animationNames.idle)
            }
            this.moveToNextWaypoint()
        }
    }
    
    stopMovement() {
        this.state = 'idle'
        this.currentWaypointSet = undefined
    }
    
    enable() {
        if (!this.isEnabled) {
            this.isEnabled = true
            this.state = this.previousState
        }
    }
    
    disable() {
        if (this.isEnabled) {
            this.previousState = this.state
            this.isEnabled = false
            this.state = 'disabled'
        }
    }
    
    playAnimation(name: string, overrideLoop?: boolean, overrideSpeed?: number, resetIfSame: boolean = false) {
        if (this.animationConfigs.size === 0) return
        if (!this.animationConfigs.has(name)) return
        if (this.currentAnimation === name && !resetIfSame) return
        
        const config = this.animationConfigs.get(name)!
        const loop = overrideLoop !== undefined ? overrideLoop : config.loop
        const speed = overrideSpeed !== undefined ? overrideSpeed : config.speed
        
        Animator.stopAllAnimations(this.entity)
        const animator = Animator.getMutable(this.entity)
        const stateIndex = animator.states.findIndex(s => s.clip === name)
        
        if (stateIndex >= 0) {
            animator.states[stateIndex].speed = speed
            animator.states[stateIndex].playing = true
            animator.states[stateIndex].weight = 1.0
            animator.states[stateIndex].loop = loop
            
            animator.states.forEach((s, index) => {
                if (index !== stateIndex) {
                    s.playing = false
                    s.weight = 0
                }
            })
        }
        
        this.currentAnimation = name
    }
    
    stopAnimation(name?: string) {
        if (name) {
            const animator = Animator.getMutable(this.entity)
            const state = animator.states.find(s => s.clip === name)
            if (state) {
                state.playing = false
                state.weight = 0
            }
        } else {
            Animator.stopAllAnimations(this.entity)
        }
    }
    
    playSound(soundConfig: SoundConfig) {
        if (!soundConfig) return
        
        AudioSource.createOrReplace(this.entity, {
            audioClipUrl: soundConfig.clip,
            loop: soundConfig.loop || false,
            playing: true,
            volume: soundConfig.volume || 1.0
        })
    }
    
    triggerSound() {
        if (this.config.soundOnCustom) {
            this.playSound(this.config.soundOnCustom)
        }
    }
    
    destroy() {
        engine.removeEntity(this.entity)
        if (this.collisionEntity) {
            engine.removeEntity(this.collisionEntity)
        }
    }
}

export class ReactiveEntity extends InteractiveEntity {
    config: ReactiveEntityConfig  // Override the parent's config type
    triggerEntity?: Entity
    isInTriggerZone: boolean = false
    
    constructor(gameMgr: GameManager, config: ReactiveEntityConfig) {
        super(gameMgr, config)
        this.config = config
        
        // Set up trigger zone if specified
        if (config.triggerRadius || config.triggerBox) {
            this.createTriggerZone(config)
        }
    }
    
    createTriggerZone(config: ReactiveEntityConfig) {
        this.triggerEntity = engine.addEntity()
        
        if (config.triggerRadius) {
            // Sphere trigger
            Transform.create(this.triggerEntity, {
                position: config.position,
                scale: Vector3.create(config.triggerRadius * 2, config.triggerRadius * 2, config.triggerRadius * 2)
            })
            
            const triggerShape = engine.addEntity()
            MeshRenderer.setSphere(triggerShape) // For visualization
            MeshCollider.setSphere(triggerShape)
            Transform.create(triggerShape, {
                parent: this.triggerEntity
            })
        } else if (config.triggerBox) {
            // Box trigger
            Transform.create(this.triggerEntity, {
                position: config.position,
                scale: config.triggerBox
            })
            
            const triggerShape = engine.addEntity()
            MeshRenderer.setBox(triggerShape) // For visualization
            MeshCollider.setBox(triggerShape)
            Transform.create(triggerShape, {
                parent: this.triggerEntity
            })
        }
    }
    
    onPlayerEnter() {
        if (this.isInTriggerZone) return
        this.isInTriggerZone = true
        
        // Play "on" animation
        if (this.config.animateOnAnimation) {
            const speed = this.config.animationSpeed || 1.0
            this.playAnimation(this.config.animateOnAnimation, false, speed)
        }
        
        // Play sound on trigger
        if (this.config.soundOnTriggerEnter) {
            this.playSound(this.config.soundOnTriggerEnter)
        }
    }
    
    onPlayerExit() {
        if (!this.isInTriggerZone) return
        this.isInTriggerZone = false
        
        // Play "off" animation
        if (this.config.animateOffAnimation) {
            const speed = this.config.animationSpeed || 1.0
            this.playAnimation(this.config.animateOffAnimation, false, speed)
        }
        
        if (this.config.onReverseComplete) {
            this.config.onReverseComplete()
        }
    }
    
    // Method to manually trigger animations (for testing or direct control)
    triggerOn() {
        if (this.config.animateOnAnimation) {
            const speed = this.config.animationSpeed || 1.0
            this.playAnimation(this.config.animateOnAnimation, false, speed)
        }
    }
    
    triggerOff() {
        if (this.config.animateOffAnimation) {
            const speed = this.config.animationSpeed || 1.0
            this.playAnimation(this.config.animateOffAnimation, false, speed)
        }
    }
    
    destroy() {
        super.destroy()
        if (this.triggerEntity) {
            engine.removeEntity(this.triggerEntity)
        }
    }
}