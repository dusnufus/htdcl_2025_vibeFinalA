import { 
    engine, Entity, Transform, GltfContainer,
    pointerEventsSystem, InputAction, Tween, TweenSequence, EasingFunction,
    MeshRenderer, MeshCollider
} from '@dcl/sdk/ecs'
import { Vector3, Quaternion } from '@dcl/sdk/math'

export interface FloorData {
    id: string          // 'G', '1', '2', '3', '4', '5', 'PH'
    yPosition: number   // Height of this floor
    label: string       // Display name like "Ground Floor", "Penthouse"
}

export interface ElevatorConfig {
    carPosition: Vector3          // Starting position of elevator car
    carRotation: Quaternion       // Starting rotation of elevator car
    carModelPath: string          // Path to car model
    doorModelPath: string         // Path to door model
    doorOffset: Vector3           // Door position relative to car
    doorOpenRotation: Vector3     // Euler degrees for open state
    doorClosedRotation: Vector3   // Euler degrees for closed state
    floors: FloorData[]           // Array of floor definitions
    moveSpeed: number             // Speed of elevator movement (units per second)
    doorSpeed: number             // Speed of door animation (seconds)
    buttonPositions: { [key: string]: Vector3 }  // Button positions relative to car
    callButtonOffset: Vector3     // NEW: Position offset for call buttons at each floor (relative to car X/Z)
}

export class Elevator {
    
    // Entity references
    carEntity: Entity
    doorEntity: Entity
    buttonEntities: Map<string, Entity> = new Map()
    callButtonEntities: Map<string, Entity> = new Map()  // NEW: Call buttons at each floor
    
    
    // Configuration
    config: ElevatorConfig
    
    // State management
    currentFloor: string = 'G'
    targetFloor: string = 'G'
    state: 'idle' | 'closing' | 'moving' | 'opening' = 'idle'
    isOperating: boolean = false
    
    // Movement tracking
    movementProgress: number = 0
    startYPosition: number = 0
    targetYPosition: number = 0
    
    // Door tracking
    doorProgress: number = 0
    isDoorOpen: boolean = true
    
    constructor(_config: ElevatorConfig) {
        console.log('Elevator: Creating elevator system')
        
        this.config = _config
        
        // Set starting floor position
        const startFloor = this.config.floors.find(f => f.id === this.currentFloor)
        if (startFloor) {
            this.config.carPosition.y = startFloor.yPosition
        }
        
        // Create elevator car
        this.carEntity = engine.addEntity()
        Transform.create(this.carEntity, {
            position: this.config.carPosition,
            rotation: this.config.carRotation,
            scale: Vector3.create(1, 1, 1)
        })
        
        if (this.config.carModelPath) {
            GltfContainer.create(this.carEntity, {
                src: this.config.carModelPath
            })
        }
        
        // Create door (parented to car)
        this.doorEntity = engine.addEntity()
        Transform.create(this.doorEntity, {
            parent: this.carEntity,
            position: this.config.doorOffset,
            rotation: Quaternion.fromEulerDegrees(
                this.config.doorOpenRotation.x,
                this.config.doorOpenRotation.y,
                this.config.doorOpenRotation.z
            ),
            scale: Vector3.create(1, 1, 1)
        })
        
        if (this.config.doorModelPath) {
            GltfContainer.create(this.doorEntity, {
                src: this.config.doorModelPath
            })
        }
        
        // Create buttons (parented to car)
        this.createButtons()

        // Create call buttons at each floor (NOT parented to car)
        this.createCallButtons()
        
        // Add update system
        engine.addSystem((dt: number) => {
            this.update(dt)
        })
        
        console.log(`Elevator: Created at floor ${this.currentFloor}`)
    }
    
    createButtons() {
        this.config.floors.forEach(floor => {
            const buttonPos = this.config.buttonPositions[floor.id]
            if (!buttonPos) {
                console.log(`No button position defined for floor ${floor.id}`)
                return
            }
            
            const buttonEntity = engine.addEntity()
            
            Transform.create(buttonEntity, {
                parent: this.carEntity,
                position: buttonPos,
                scale: Vector3.create(0.2, 0.2, 0.05), // Small button size
                rotation: Quaternion.fromEulerDegrees(0,55,0)
            })
            MeshRenderer.setBox(buttonEntity)
            MeshCollider.setBox(buttonEntity)
            
            // Add click interaction
            pointerEventsSystem.onPointerDown(
                buttonEntity,
                () => {
                    this.onButtonClicked(floor.id)
                },
                {
                    button: InputAction.IA_POINTER,
                    hoverText: `Floor ${floor.label}`
                }
            )
            
            this.buttonEntities.set(floor.id, buttonEntity)
            console.log(`Created button for floor ${floor.id} at ${floor.label}`)
        })
    }

    createCallButtons() {
        console.log('Elevator: Creating call buttons at each floor')
        
        this.config.floors.forEach(floor => {
            const callButtonEntity = engine.addEntity()
            
            // Position at floor height with offset from elevator shaft
            const callButtonPosition = Vector3.create(
                this.config.carPosition.x + this.config.callButtonOffset.x,
                floor.yPosition + this.config.callButtonOffset.y,
                this.config.carPosition.z + this.config.callButtonOffset.z
            )
            
            Transform.create(callButtonEntity, {
                position: callButtonPosition,
                scale: Vector3.create(0.2, 0.3, 0.1),  // Slightly larger than interior buttons
                rotation: Quaternion.fromEulerDegrees(0,0,0)
            })
            
            MeshRenderer.setBox(callButtonEntity)
            MeshCollider.setBox(callButtonEntity)
            
            // Add click interaction
            pointerEventsSystem.onPointerDown(
                callButtonEntity,
                () => {
                    this.onCallButtonClicked(floor.id)
                },
                {
                    button: InputAction.IA_POINTER,
                    hoverText: `Call Elevator to ${floor.label}`
                }
            )
            
            this.callButtonEntities.set(floor.id, callButtonEntity)
            console.log(`Created call button for floor ${floor.id} at Y: ${floor.yPosition}`)
        })
    }
    
    update(dt: number) {
        switch (this.state) {
            case 'closing':
                this.updateDoorClosing(dt)
                break
            case 'moving':
                this.updateMovement(dt)
                break
            case 'opening':
                this.updateDoorOpening(dt)
                break
        }
    }
    
    updateDoorClosing(dt: number) {
        this.doorProgress += dt / this.config.doorSpeed
        
        if (this.doorProgress >= 1.0) {
            // Door fully closed
            this.doorProgress = 1.0
            this.isDoorOpen = false
            this.setDoorRotation(this.config.doorClosedRotation)
            
            // Start moving
            this.state = 'moving'
            this.movementProgress = 0
            console.log(`Elevator: Door closed, starting movement to floor ${this.targetFloor}`)
        } else {
            // Interpolate door rotation
            this.interpolateDoorRotation(this.doorProgress)
        }
    }
    
    updateMovement(dt: number) {
        const distance = Math.abs(this.targetYPosition - this.startYPosition)
        const moveTime = distance / this.config.moveSpeed
        
        this.movementProgress += dt / moveTime
        
        if (this.movementProgress >= 1.0) {
            // Arrived at floor
            this.movementProgress = 1.0
            const carTransform = Transform.getMutable(this.carEntity)
            carTransform.position.y = this.targetYPosition
            
            this.currentFloor = this.targetFloor
            this.state = 'opening'
            this.doorProgress = 0
            console.log(`Elevator: Arrived at floor ${this.currentFloor}, opening door`)
        } else {
            // Interpolate position
            const carTransform = Transform.getMutable(this.carEntity)
            carTransform.position.y = this.startYPosition + 
                (this.targetYPosition - this.startYPosition) * this.movementProgress
        }
    }
    
    updateDoorOpening(dt: number) {
        this.doorProgress += dt / this.config.doorSpeed
        
        if (this.doorProgress >= 1.0) {
            // Door fully open
            this.doorProgress = 1.0
            this.isDoorOpen = true
            this.setDoorRotation(this.config.doorOpenRotation)
            
            // Return to idle
            this.state = 'idle'
            this.isOperating = false
            console.log(`Elevator: Door open, ready for next command`)
        } else {
            // Interpolate door rotation (reverse)
            this.interpolateDoorRotation(1.0 - this.doorProgress)
        }
    }
    
    interpolateDoorRotation(t: number) {
        const openRot = this.config.doorOpenRotation
        const closedRot = this.config.doorClosedRotation
        
        const currentRotEuler = Vector3.create(
            openRot.x + (closedRot.x - openRot.x) * t,
            openRot.y + (closedRot.y - openRot.y) * t,
            openRot.z + (closedRot.z - openRot.z) * t
        )
        
        this.setDoorRotation(currentRotEuler)
    }
    
    setDoorRotation(eulerDegrees: Vector3) {
        const doorTransform = Transform.getMutable(this.doorEntity)
        doorTransform.rotation = Quaternion.fromEulerDegrees(
            eulerDegrees.x,
            eulerDegrees.y,
            eulerDegrees.z
        )
    }
    
    onButtonClicked(floorId: string) {
        console.log(`Elevator: Button clicked for floor ${floorId}`)
        
        // Check if already on this floor
        if (this.currentFloor === floorId) {
            console.log(`Elevator: Already on floor ${floorId}`)
            return
        }
        
        // Check if elevator is already operating
        if (this.isOperating) {
            console.log('Elevator: Already in operation, please wait')
            return
        }
        
        // Find target floor
        const targetFloor = this.config.floors.find(f => f.id === floorId)
        if (!targetFloor) {
            console.warn(`Elevator: Floor ${floorId} not found`)
            return
        }
        
        // Start elevator sequence
        this.moveToFloor(floorId, targetFloor.yPosition)
    }

    onCallButtonClicked(floorId: string) {
        console.log(`Elevator: Call button clicked for floor ${floorId}`)
        
        // Check if already on this floor
        if (this.currentFloor === floorId && this.state === 'idle') {
            console.log(`Elevator: Already at floor ${floorId}`)
            // Could trigger door opening if it was closed
            if (!this.isDoorOpen) {
                this.forceOpenDoor()
            }
            return
        }
        
        // Check if elevator is already operating
        if (this.isOperating) {
            console.log('Elevator: Already in operation, please wait')
            // TODO: Could add to a queue system here
            return
        }
        
        // Find target floor
        const targetFloor = this.config.floors.find(f => f.id === floorId)
        if (!targetFloor) {
            console.warn(`Elevator: Floor ${floorId} not found`)
            return
        }
        
        // Call elevator to this floor
        this.moveToFloor(floorId, targetFloor.yPosition)
    }
    
    moveToFloor(floorId: string, yPosition: number) {
        console.log(`Elevator: Moving from floor ${this.currentFloor} to floor ${floorId}`)
        
        this.isOperating = true
        this.targetFloor = floorId
        this.targetYPosition = yPosition
        this.startYPosition = Transform.get(this.carEntity).position.y
        
        // Start door closing
        this.state = 'closing'
        this.doorProgress = 0
    }
    
    // Manual control methods
    emergencyStop() {
        this.state = 'idle'
        this.isOperating = false
        console.log('Elevator: Emergency stop activated')
    }
    
    forceOpenDoor() {
        this.state = 'opening'
        this.doorProgress = 0
        console.log('Elevator: Forcing door open')
    }
    
    destroy() {
        engine.removeEntity(this.carEntity)
        engine.removeEntity(this.doorEntity)
        this.buttonEntities.forEach(button => engine.removeEntity(button))
        this.callButtonEntities.forEach(callButton => engine.removeEntity(callButton))  // NEW
    }
}