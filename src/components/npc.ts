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

export interface WaypointSet {
    id: string
    waypoints: WaypointData[]
    loopWaypoints?: boolean
    moveSpeed?: number
    onComplete?: () => void  // Called when waypoint set finishes (not called for looping sets)
}

export interface DialogLine {
    speaker: 'player' | 'npc'  // Who is speaking
    text: string
    nextDialogId?: string
    action?: () => void
    
    // Optional: Player choices for branching
    playerChoices?: {
        text: string
        nextDialogId: string
    }[]
}

export interface ConversationSet {
    id: string
    startDialogId: string
    dialogs: { [key: string]: DialogLine }
    onComplete?: () => void
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
    
    // Movement - use waypoint sets
    waypointSets?: { [key: string]: WaypointSet }
    
    // Dialog system
    defaultDialogs: string[]  // Random one-liners when clicked with no active conversation
    conversationSets?: { [key: string]: ConversationSet }  // Named conversation chains
    
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
    currentWaypointSetId: string = ''
    currentWaypointSet: WaypointSet | null = null
    currentDialogId: string = ''
    currentConversationId: string = ''
    currentConversationSet: ConversationSet | null = null
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
        this.currentDialogId = ''
        
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
        if (this.state === 'moving' && this.currentWaypointSet) {
            const moveSpeed = this.currentWaypointSet.moveSpeed || 2.0
            this.movementProgress += dt * moveSpeed
            
            const currentWaypoint = this.currentWaypointSet.waypoints[this.currentWaypointIndex]
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
        if (!this.currentWaypointSet || this.currentWaypointSet.waypoints.length === 0) return
        
        this.currentWaypointIndex++
        
        if (this.currentWaypointIndex >= this.currentWaypointSet.waypoints.length) {
            if (this.currentWaypointSet.loopWaypoints) {
                this.currentWaypointIndex = 0
            } else {
                this.state = 'idle'
                console.log(`${this.config.name} completed waypoint set: ${this.currentWaypointSetId}`)
                
                // Call onComplete callback if defined
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
        
        // If there's an active conversation, continue it
        if (this.currentConversationSet && this.currentDialogId) {
            this.showDialog(this.currentDialogId)
        } 
        // Otherwise show random default dialog
        else if (this.config.defaultDialogs && this.config.defaultDialogs.length > 0) {
            const randomIndex = Math.floor(Math.random() * this.config.defaultDialogs.length)
            const randomDialog = this.config.defaultDialogs[randomIndex]
            this.gameMgr.showDialog(this.config.name, randomDialog, 'npc', false, [], this)
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
    
    startConversation(conversationId: string) {
        if (!this.config.conversationSets || !this.config.conversationSets[conversationId]) {
            console.log(`WARNING: Conversation ${conversationId} not found for ${this.config.name}`)
            return
        }
        
        this.currentConversationId = conversationId
        this.currentConversationSet = this.config.conversationSets[conversationId]
        this.currentDialogId = this.currentConversationSet.startDialogId
        
        console.log(`${this.config.name} starting conversation: ${conversationId}`)
        
        // Show first dialog
        this.showDialog(this.currentDialogId)
    }
    
    showDialog(dialogId: string) {
        if (!this.currentConversationSet) return
        
        const dialogLine = this.currentConversationSet.dialogs[dialogId]
        if (!dialogLine) return
        
        // Show dialog through GameManager with speaker info
        this.gameMgr.showDialog(
            this.config.name, 
            dialogLine.text,
            dialogLine.speaker,
            !!(dialogLine.nextDialogId || dialogLine.playerChoices),
            dialogLine.playerChoices || [],
            this
        )
        
        // Run action if defined
        if (dialogLine.action) {
            dialogLine.action()
        }
        
        // Store next dialog ID
        if (dialogLine.nextDialogId) {
            this.currentDialogId = dialogLine.nextDialogId
        }
    }

    showNextDialog() {
        if (!this.currentConversationSet) {
            this.gameMgr.closeDialog()
            return
        }
        
        if (this.currentDialogId && this.currentConversationSet.dialogs[this.currentDialogId]) {
            this.showDialog(this.currentDialogId)
        } else {
            // Conversation is complete
            this.endConversation()
        }
    }
    
    jumpToDialog(dialogId: string) {
        this.currentDialogId = dialogId
        this.showDialog(dialogId)
    }
    
    endConversation() {
        console.log(`${this.config.name} conversation complete: ${this.currentConversationId}`)
        
        // Call completion callback if defined
        if (this.currentConversationSet && this.currentConversationSet.onComplete) {
            this.currentConversationSet.onComplete()
        }
        
        // Clear current conversation
        this.currentConversationId = ''
        this.currentConversationSet = null
        this.currentDialogId = ''
        
        this.gameMgr.closeDialog()
    }
    
    giveItems() {
        if (this.itemsGiven || !this.config.itemsToGive) return
        
        console.log(`${this.config.name} giving items: ${this.config.itemsToGive}`)
        // Implement item giving logic through GameManager
        this.itemsGiven = true
    }
    
    // Public methods to control NPC
    startWaypointSet(setId: string) {
        if (!this.config.waypointSets || !this.config.waypointSets[setId]) {
            console.log(`WARNING: Waypoint set ${setId} not found for ${this.config.name}`)
            return
        }
        
        this.currentWaypointSetId = setId
        this.currentWaypointSet = this.config.waypointSets[setId]
        this.currentWaypointIndex = 0
        
        console.log(`${this.config.name} starting waypoint set: ${setId}`)
        this.moveToNextWaypoint()
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

