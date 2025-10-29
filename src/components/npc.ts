import { 
    engine, Entity, Transform, AvatarShape, GltfContainer, 
    pointerEventsSystem, InputAction, TriggerArea, triggerAreaEventsSystem,
    ColliderLayer , MeshCollider,
    MeshRenderer, Animator
} from '@dcl/sdk/ecs'
import { Vector3, Quaternion } from '@dcl/sdk/math'
import { GameManager } from '../gameMgr'

export interface AnimationConfig {
    name: string
    loop: boolean
    speed: number
}

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
    useDefaultAvatar: boolean
    avatarData?: {
        bodyShape: string
        wearables: string[]
    }
    modelPath?: string  // For future 3D models
    animations?: AnimationConfig[]  // Animation configurations for GLB models
    defaultAnimation?: string       // Default animation to play on start
    
    // NEW: Animation name mapping (optional)
    animationNames?: {
        idle?: string      // Animation to play when idle
        walk?: string       // Animation to play when walking
        run?: string        // Animation to play when running (if exists)
        talk?: string       // Animation to play when talking
    }
    
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
    
    // Animation state (for GLB models)
    currentAnimation: string = ''
    animationConfigs: Map<string, AnimationConfig> = new Map()
    animationNames: { idle?: string, walk?: string, run?: string, talk?: string } = {}  // NEW
    
    // Movement tracking
    movementProgress: number = 0
    startMovePosition: Vector3 = Vector3.Zero()
    targetMovePosition: Vector3 = Vector3.Zero()
    
    constructor(_gameMgr: GameManager, _config: NPCConfig) {
        
        console.log(`NPC: Creating ${_config.name}`)
        
        this.gameMgr = _gameMgr
        this.config = _config
        this.currentDialogId = ''

        this.animationNames = _config.animationNames || {}
        
        // Create main entity
        this.entity = engine.addEntity()
        
        // Add visual representation
        if (_config.useAvatar) {

            if (_config.avatarData && !_config.useDefaultAvatar) {
                    AvatarShape.create(this.entity, {
                    id: _config.id,
                    name: _config.name,
                    bodyShape: _config.avatarData.bodyShape,
                    wearables: _config.avatarData.wearables,
                    emotes: [],
                    expressionTriggerId: 'wave',
                    expressionTriggerTimestamp: 0
                })
            }
            else {
                AvatarShape.create(this.entity)
            }

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
            
            // Set up Animator if animations are defined
            if (_config.animations && _config.animations.length > 0) {
                // Store animation configs in a map for easy lookup
                _config.animations.forEach(animConfig => {
                    this.animationConfigs.set(animConfig.name, animConfig)
                })
                
                // Create animator states from configs
                const animatorStates = _config.animations.map(animConfig => ({
                    clip: animConfig.name,
                    loop: animConfig.loop,
                    playing: false,  // Start all as not playing
                    weight: 0,
                    speed: animConfig.speed
                }))
                
                Animator.create(this.entity, {
                    states: animatorStates
                })
                
                // Play default animation if specified
                const defaultAnim = _config.defaultAnimation || _config.animations[0].name
                if (this.animationConfigs.has(defaultAnim)) {
                    this.playAnimation(defaultAnim)
                }

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
                //sMeshRenderer.setBox(this.colliderEntity)

            }
        }else {
            // No visual representation specified - this is an error
            console.error(`ERROR: NPC ${_config.name} has no visual representation! Set useAvatar=true OR provide modelPath`)
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
                
                // Play idle animation when waypoint set completes
                if (this.animationNames.idle && this.animationConfigs.has(this.animationNames.idle)) {
                    this.playAnimation(this.animationNames.idle)
                }
                
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
        
        // Play walk animation when starting to move
        if (this.animationNames.walk && this.animationConfigs.has(this.animationNames.walk)) {
            this.playAnimation(this.animationNames.walk)
        }
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
            
            // Play idle animation while waiting
            if (this.animationNames.idle && this.animationConfigs.has(this.animationNames.idle)) {
                this.playAnimation(this.animationNames.idle)
            }
        } else {
            this.state = 'idle'
            
            // Play idle animation when arrived
            if (this.animationNames.idle && this.animationConfigs.has(this.animationNames.idle)) {
                this.playAnimation(this.animationNames.idle)
            }
            
            this.moveToNextWaypoint()
        }
    }
    
    onClicked() {
        console.log(`NPC ${this.config.name} clicked`)
        this.hasInteracted = true
        
        // If there's a prepared conversation, start it
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

        this.state = 'talking'
        
        this.currentConversationId = conversationId
        this.currentConversationSet = this.config.conversationSets[conversationId]
        this.currentDialogId = this.currentConversationSet.startDialogId
        
        console.log(`${this.config.name} starting conversation: ${conversationId}`)
        
        // Show first dialog
        this.showDialog(this.currentDialogId)
    }

    prepareConversation(conversationId: string) {
        if (!this.config.conversationSets || !this.config.conversationSets[conversationId]) {
            console.log(`WARNING: Conversation ${conversationId} not found for ${this.config.name}`)
            return
        }
        
        // Set up the conversation but don't show dialog yet
        this.currentConversationId = conversationId
        this.currentConversationSet = this.config.conversationSets[conversationId]
        this.currentDialogId = this.currentConversationSet.startDialogId
        
        console.log(`${this.config.name} prepared conversation: ${conversationId} (will start on next click)`)
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
        
        // Store next dialog ID or clear if this is the last dialog
        if (dialogLine.nextDialogId) {
            this.currentDialogId = dialogLine.nextDialogId
        } else {
            // This is the last dialog in the conversation
            this.currentDialogId = ''
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
        
        // Note: UI closing is handled by GameManager.closeDialog()
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
        this.currentWaypointIndex = -1  // Changed from 0 to -1
        
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
    
    playAnimation(
        animationName: string, 
        overrideLoop?: boolean, 
        overrideSpeed?: number, 
        resetIfSame: boolean = false
    ) {
        // Check if this is a GLB model with animations
        if (this.animationConfigs.size === 0) {
            console.log(`NPC ${this.config.name}: No animations available`)
            return
        }
        
        // Check if animation exists
        if (!this.animationConfigs.has(animationName)) {
            console.log(`NPC ${this.config.name}: Animation '${animationName}' not found`)
            return
        }
        
        // If already playing this animation and resetIfSame is false, do nothing
        if (this.currentAnimation === animationName && !resetIfSame) {
            return
        }
        
        const config = this.animationConfigs.get(animationName)!
        
        // Use override values or fall back to config defaults
        const loop = overrideLoop !== undefined ? overrideLoop : config.loop
        const speed = overrideSpeed !== undefined ? overrideSpeed : config.speed
        
        console.log(`NPC ${this.config.name}: Playing animation '${animationName}' (loop: ${loop}, speed: ${speed})`)
        
        // Stop all animations
        Animator.stopAllAnimations(this.entity)
        
        // Update the animation state with override values
        const animator = Animator.getMutable(this.entity)
        const stateIndex = animator.states.findIndex(s => s.clip === animationName)
        
        if (stateIndex >= 0) {
            animator.states[stateIndex].speed = speed
            animator.states[stateIndex].playing = true
            animator.states[stateIndex].weight = 1.0
            animator.states[stateIndex].loop = loop
            
            // Set other states to not playing
            animator.states.forEach((s, index) => {
                if (index !== stateIndex) {
                    s.playing = false
                    s.weight = 0
                }
            })
        }
        
        this.currentAnimation = animationName
    }
    
    stopAnimation(animationName?: string) {
        if (animationName) {
            const animator = Animator.getMutable(this.entity)
            const state = animator.states.find(s => s.clip === animationName)
            if (state) {
                state.playing = false
                state.weight = 0
            }
            
            if (this.currentAnimation === animationName) {
                this.currentAnimation = ''
            }
        } else {
            const animator = Animator.getMutable(this.entity)
            animator.states.forEach(state => {
                state.playing = false
                state.weight = 0
            })
            this.currentAnimation = ''
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

