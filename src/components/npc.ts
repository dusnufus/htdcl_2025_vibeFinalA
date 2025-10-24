import { 
    engine, Entity, Transform, AvatarShape, GltfContainer, 
    pointerEventsSystem, InputAction, TriggerArea, triggerAreaEventsSystem,
    ColliderLayer , MeshCollider,
    MeshRenderer
} from '@dcl/sdk/ecs'
import { Vector3, Quaternion } from '@dcl/sdk/math'
import { GameManager } from '../gameMgr'

export interface WaypointData {
    position: Vector3
    rotation: Quaternion
    waitTime?: number  // How long to wait at this point
}

export interface DialogData {
    text: string
    nextDialogId?: string  // For branching conversations
    action?: () => void    // Code to run when dialog shown
}

export interface NPCConfig {
    id: string
    name: string
    startPosition: Vector3
    startRotation: Quaternion
    
    // Model options
    useAvatar: boolean
    avatarData?: {
        bodyShape: string
        wearables: string[]
    }
    modelPath?: string  // For future 3D models
    
    // Interaction options
    clickable: boolean
    clickHoverText?: string
    hasProximityTrigger: boolean
    proximityRadius?: number
    
    // Movement
    waypoints?: WaypointData[]
    loopWaypoints?: boolean
    moveSpeed?: number
    
    // Dialog and missions
    dialogs: { [key: string]: DialogData }
    startDialogId?: string
    
    // Items and events
    canGiveItems?: boolean
    itemsToGive?: string[]
}

export class NPC {
    
    entity: Entity
    colliderEntity?: Entity
    proximityTrigger?: Entity
    config: NPCConfig
    gameMgr: GameManager
    
    // State management
    state: 'idle' | 'moving' | 'waiting' | 'talking' = 'idle'
    currentWaypointIndex: number = 0
    currentDialogId: string = ''
    waitTimeRemaining: number = 0
    hasInteracted: boolean = false
    itemsGiven: boolean = false
    
    // Movement tracking
    movementProgress: number = 0
    startMovePosition: Vector3 = Vector3.Zero()
    targetMovePosition: Vector3 = Vector3.Zero()
    
    constructor(_gameMgr: GameManager, _config: NPCConfig) {
        
        console.log(`NPC: Creating ${_config.name}`)
        
        this.gameMgr = _gameMgr
        this.config = _config
        this.currentDialogId = _config.startDialogId || ''
        
        // Create main entity
        this.entity = engine.addEntity()
        
        // Add visual representation
        if (_config.useAvatar && _config.avatarData) {
            AvatarShape.create(this.entity, {
                id: _config.id,
                name: _config.name,
                bodyShape: _config.avatarData.bodyShape,
                wearables: _config.avatarData.wearables,
                emotes: [],
                expressionTriggerId: 'wave',
                expressionTriggerTimestamp: 0
            })
            
            // Create a child entity for the collider
            this.colliderEntity = engine.addEntity()
            
            // Position it centered on the avatar (offset up by ~1 unit to center on body)
            Transform.create(this.colliderEntity, {
                parent: this.entity,  // Parent to the NPC entity
                position: Vector3.create(0, 1, 0),  // Offset up to center on body
                scale: Vector3.create(0.6, 1.7, 0.6)  // Make it avatar-sized (width, height, depth)
            })
            
            // Add the collider to the child entity
            MeshCollider.setBox(this.colliderEntity)
            
            // Optional: Add MeshRenderer to visualize during testing
             //MeshRenderer.setBox(this.colliderEntity)

        } else if (_config.modelPath) {
            GltfContainer.create(this.entity, {
                src: _config.modelPath
            })
        }
        
        // Set initial transform
        Transform.create(this.entity, {
            position: _config.startPosition,
            rotation: _config.startRotation,
            scale: Vector3.create(1, 1, 1)
        })
        
        // Add click interaction
        if (_config.clickable) {
            const targetEntity = this.colliderEntity || this.entity  // Use collider if it exists
            
            pointerEventsSystem.onPointerDown(
                targetEntity,
                () => {
                    this.onClicked()
                },
                {
                    button: InputAction.IA_POINTER,
                    hoverText: _config.clickHoverText || 'Talk'
                }
            )
        }
        
        // Add proximity trigger
        if (_config.hasProximityTrigger) {
            this.setupProximityTrigger(_config.proximityRadius || 3)
        }
        
        // Add update system for movement and state
        engine.addSystem((dt: number) => {
            this.update(dt)
        })
    }
    
    setupProximityTrigger(radius: number) {
        this.proximityTrigger = engine.addEntity()
        
        TriggerArea.setBox(this.proximityTrigger, ColliderLayer.CL_PLAYER)
        
        Transform.create(this.proximityTrigger, {
            position: this.config.startPosition,
            scale: Vector3.create(radius, radius * 2, radius)
        })
        
        triggerAreaEventsSystem.onTriggerEnter(this.proximityTrigger, () => {
            this.onProximityEnter()
        })
    }
    
    update(dt: number) {
        
        // Handle waiting state
        if (this.state === 'waiting') {
            this.waitTimeRemaining -= dt
            if (this.waitTimeRemaining <= 0) {
                this.state = 'idle'
                this.moveToNextWaypoint()
            }
        }
        
        // Handle movement
        if (this.state === 'moving' && this.config.waypoints) {
            const moveSpeed = this.config.moveSpeed || 2.0
            this.movementProgress += dt * moveSpeed
            
            const currentWaypoint = this.config.waypoints[this.currentWaypointIndex]
            const distance = Vector3.distance(this.startMovePosition, this.targetMovePosition)
            
            if (this.movementProgress >= distance) {
                // Reached waypoint
                this.arriveAtWaypoint(currentWaypoint)
            } else {
                // Interpolate position
                const t = this.movementProgress / distance
                const newPos = Vector3.lerp(this.startMovePosition, this.targetMovePosition, t)
                Transform.getMutable(this.entity).position = newPos
                
                // Update proximity trigger if it exists
                if (this.proximityTrigger) {
                    Transform.getMutable(this.proximityTrigger).position = newPos
                }
            }
        }
    }
    
    moveToNextWaypoint() {
        if (!this.config.waypoints || this.config.waypoints.length === 0) return
        
        this.currentWaypointIndex++
        
        if (this.currentWaypointIndex >= this.config.waypoints.length) {
            if (this.config.loopWaypoints) {
                this.currentWaypointIndex = 0
            } else {
                this.state = 'idle'
                return
            }
        }
        
        const nextWaypoint = this.config.waypoints[this.currentWaypointIndex]
        this.startMovePosition = Transform.get(this.entity).position
        this.targetMovePosition = nextWaypoint.position
        this.movementProgress = 0
        this.state = 'moving'
    }
    
    arriveAtWaypoint(waypoint: WaypointData) {
        // Set final position and rotation
        const transform = Transform.getMutable(this.entity)
        transform.position = waypoint.position
        transform.rotation = waypoint.rotation
        
        // Update proximity trigger
        if (this.proximityTrigger) {
            Transform.getMutable(this.proximityTrigger).position = waypoint.position
        }
        
        // Wait if specified
        if (waypoint.waitTime && waypoint.waitTime > 0) {
            this.state = 'waiting'
            this.waitTimeRemaining = waypoint.waitTime
        } else {
            this.state = 'idle'
            this.moveToNextWaypoint()
        }
    }
    
    onClicked() {
        console.log(`NPC ${this.config.name} clicked`)
        this.hasInteracted = true
        
        // Show current dialog
        if (this.currentDialogId && this.config.dialogs[this.currentDialogId]) {
            this.showDialog(this.currentDialogId)
        }
        
        // Give items if configured
        if (this.config.canGiveItems && !this.itemsGiven) {
            this.giveItems()
        }
    }
    
    onProximityEnter() {
        console.log(`Player entered proximity of ${this.config.name}`)
        // Override this or add config callbacks
    }
    
    showDialog(dialogId: string) {
        const dialog = this.config.dialogs[dialogId]
        if (!dialog) return
        
        // Show dialog through GameManager
        this.gameMgr.showDialog(
            this.config.name, 
            dialog.text, 
            !!dialog.nextDialogId,  // hasNext
            this  // pass NPC reference
        )
        
        // Run action if defined
        if (dialog.action) {
            dialog.action()
        }
        
        // Store next dialog ID for later
        if (dialog.nextDialogId) {
            this.currentDialogId = dialog.nextDialogId
        }
    }

    showNextDialog() {
        if (this.currentDialogId && this.config.dialogs[this.currentDialogId]) {
            this.showDialog(this.currentDialogId)
        } else {
            this.gameMgr.closeDialog()
        }
    }
    
    giveItems() {
        if (this.itemsGiven || !this.config.itemsToGive) return
        
        console.log(`${this.config.name} giving items: ${this.config.itemsToGive}`)
        // Implement item giving logic through GameManager
        this.itemsGiven = true
    }
    
    // Public methods to control NPC
    startMovement() {
        if (this.config.waypoints && this.config.waypoints.length > 0) {
            this.moveToNextWaypoint()
        }
    }
    
    stopMovement() {
        this.state = 'idle'
    }
    
    setDialog(dialogId: string) {
        this.currentDialogId = dialogId
    }
    
    teleportTo(position: Vector3, rotation?: Quaternion) {
        const transform = Transform.getMutable(this.entity)
        transform.position = position
        if (rotation) transform.rotation = rotation
        
        if (this.proximityTrigger) {
            Transform.getMutable(this.proximityTrigger).position = position
        }
    }
    
    destroy() {
        engine.removeEntity(this.entity)
        if (this.colliderEntity) {
            engine.removeEntity(this.colliderEntity)
        }
        if (this.proximityTrigger) {
            engine.removeEntity(this.proximityTrigger)
        }
    }
}

