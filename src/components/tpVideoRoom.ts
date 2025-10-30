import { engine, Transform, GltfContainer, Entity, Material, VideoPlayer, GltfNodeModifiers, VideoState, videoEventsSystem } from '@dcl/sdk/ecs'
import { Vector3, Quaternion } from '@dcl/sdk/math'
import { GameManager } from '../gameMgr'
import { movePlayerTo } from '~system/RestrictedActions'

export class TpVideoRoom{

	roomEntity: Entity
    screenEntities: Array<Entity>
    gameMgr: GameManager

    // Video timing state management
    videoState: 'idle' | 'waitingToStart' | 'playing' | 'waitingAfterEnd' | 'complete' = 'idle'
    waitBeforeStart: number = 0
    waitAfterEnd: number = 0
    elapsedWaitTime: number = 0
    currentVideoSrc: string = ''
    
    // Fallback timer properties
    videoPlayingTime: number = 0
    expectedVideoDuration: number = 0  // videoLength + 5 second buffer
    videoViewingBoxRadius: number = 5  // Maximum distance from center before teleporting
    
    // Track if video player/modifiers are set up
    videoPlayerSetup: boolean = false

	constructor(_gameMgr: GameManager, _roomSrc: string, _screenSrc: string, _screenCount: number/* , second:boolean = false */){

        console.log("TpVideoRoom: constructor running")

        //store game manager reference
        this.gameMgr = _gameMgr

        //adding room entity
        this.roomEntity = engine.addEntity()
        GltfContainer.create(this.roomEntity, {
            src: _roomSrc
        })

        Transform.create(this.roomEntity, {
            position: Vector3.create(0,0,0),
            scale: Vector3.create(1,1,1),
            rotation: Quaternion.fromEulerDegrees(0,0,0)
        })

        //THIS WAS PART OF MY ATTEMPTED "second video player" fix
        /* if(second == true){
            Transform.create(this.roomEntity, {
                position: Vector3.create(10,0,10),
                scale: Vector3.create(1,1,1),
                rotation: Quaternion.fromEulerDegrees(0,0,0)
            })
        }
        else{
            Transform.create(this.roomEntity, {
                position: Vector3.create(0,0,0),
                scale: Vector3.create(1,1,1),
                rotation: Quaternion.fromEulerDegrees(0,0,0)
            })
        } */

        //adding screen entities
        let screenRotation = 360 / _screenCount
        
        this.screenEntities = []
        
        for(let i = 0; i < _screenCount; i++){
            var se = engine.addEntity()
            GltfContainer.create(se, {
                src: _screenSrc
            })
            Transform.create(se, {
                position: Vector3.create(0,0,0),
                rotation: Quaternion.fromEulerDegrees(0,screenRotation * i,0)
            })
            this.screenEntities.push(se)
        }

        // Add timing system for video wait periods
        engine.addSystem((dt: number) => {
            if (this.videoState === 'waitingToStart') {
                this.elapsedWaitTime += dt
                if (this.elapsedWaitTime >= this.waitBeforeStart) {
                    this.elapsedWaitTime = 0
                    this.videoState = 'playing'
                    this.videoPlayingTime = 0  // Reset video playing timer
                    this.playVideoNow()
                }
            } else if (this.videoState === 'playing') {
                // Fallback timer: track actual playing time
                this.videoPlayingTime += dt
                
                // Check if player is still in viewing box
                this.checkAndCorrectPlayerPosition()
                
                // If we've exceeded expected duration + buffer, force end
                if (this.expectedVideoDuration > 0 && 
                    this.videoPlayingTime >= this.expectedVideoDuration) {
                    console.log('Fallback timer triggered - forcing video end after ' + 
                                this.videoPlayingTime.toFixed(2) + ' seconds')
                    this.videoState = 'waitingAfterEnd'
                    this.elapsedWaitTime = 0
                }
            } else if (this.videoState === 'waitingAfterEnd') {
                this.elapsedWaitTime += dt
                if (this.elapsedWaitTime >= this.waitAfterEnd) {
                    this.elapsedWaitTime = 0
                    this.videoState = 'complete'
                    this.gameMgr.videoComplete()
                }
            }
        })

    }

    setVideo(_videoSrc: string, _waitBeforeStart: number, _waitAfterEnd: number){
        console.log(`setVideo: Setting new video ${_videoSrc}`)
        
        // Stop and completely remove old video to prevent stale frames
        if (VideoPlayer.has(this.screenEntities[0])) {
            const existingPlayer = VideoPlayer.getMutable(this.screenEntities[0])
            existingPlayer.playing = false
            VideoPlayer.deleteFrom(this.screenEntities[0])
            console.log('setVideo: Cleaned up old VideoPlayer')
        }
        
        // Remove old modifiers too
        for(let i = 0; i < this.screenEntities.length; i++){
            if (GltfNodeModifiers.has(this.screenEntities[i])) {
                GltfNodeModifiers.deleteFrom(this.screenEntities[i])
            }
        }
        
        this.currentVideoSrc = _videoSrc
        this.waitBeforeStart = _waitBeforeStart
        this.waitAfterEnd = _waitAfterEnd
        this.elapsedWaitTime = 0
        this.videoPlayingTime = 0
        this.expectedVideoDuration = 0  // Reset for new video
        this.videoState = 'waitingToStart'
        
        console.log(`setVideo: waiting ${_waitBeforeStart}s before starting ${_videoSrc}`)
    }

    playVideoNow(){
        console.log('playVideoNow: starting video', this.currentVideoSrc)
        
        // COMPLETE cleanup - delete everything first
        // Delete VideoPlayer completely
        if (VideoPlayer.has(this.screenEntities[0])) {
            const existingPlayer = VideoPlayer.getMutable(this.screenEntities[0])
            existingPlayer.playing = false
            VideoPlayer.deleteFrom(this.screenEntities[0])
            console.log('Deleted existing VideoPlayer')
        }
        
        // Delete ALL GltfNodeModifiers from all screens
        for(let i = 0; i < this.screenEntities.length; i++){
            if (GltfNodeModifiers.has(this.screenEntities[i])) {
                GltfNodeModifiers.deleteFrom(this.screenEntities[i])
            }
        }
        console.log('Deleted all existing GltfNodeModifiers')
        
        // Now create everything fresh
        VideoPlayer.create(this.screenEntities[0], {
            src: this.currentVideoSrc,
            playing: true,
        })
        console.log('Created NEW VideoPlayer with src:', this.currentVideoSrc)

        // Create fresh GltfNodeModifiers with new video texture reference
        for(let i = 0; i < this.screenEntities.length; i++){
            GltfNodeModifiers.create(
                this.screenEntities[i],
                {
                    modifiers: [{
                        path: '',  // Empty path applies to root/material
                        material: {
                            material: {
                                $case: 'pbr', pbr: {
                                    texture: Material.Texture.Video({
                                        videoPlayerEntity: this.screenEntities[0],
                                    }),
                                },
                            },
                        },
                    }],
                })
        }
        console.log('Created NEW GltfNodeModifiers with video texture for all screens')
        
        this.videoPlayerSetup = true

        videoEventsSystem.registerVideoEventsEntity(
            this.screenEntities[0],
            (videoEvent) => {
                // Only process if we're in playing state
                if (this.videoState !== 'playing') return
                
                // Capture video length when available and set fallback duration
                if (videoEvent.videoLength > 0 && this.expectedVideoDuration === 0) {
                    this.expectedVideoDuration = videoEvent.videoLength + 5  // Add 5 second buffer
                    console.log(`Video length detected: ${videoEvent.videoLength.toFixed(2)}s, ` + 
                               `fallback timer set to ${this.expectedVideoDuration.toFixed(2)}s`)
                }
        
                // Only check for completion if:
                // 1. Video is actually playing
                // 2. Video length is valid (> 0)
                // 3. Current offset is near the end (within 0.5s of end)
                // 4. We've played for at least 2 seconds (to prevent early triggers)
                if (videoEvent.state === VideoState.VS_PLAYING && 
                    videoEvent.videoLength > 0 && 
                    videoEvent.currentOffset >= videoEvent.videoLength - 0.5 &&
                    this.videoPlayingTime >= 2.0) {  // Minimum 2 seconds played
                    console.log('video ended (via video events), starting wait period')
                    this.videoState = 'waitingAfterEnd'
                    this.elapsedWaitTime = 0
                } else if (videoEvent.state === VideoState.VS_PAUSED && 
                           videoEvent.videoLength > 0 &&
                           videoEvent.currentOffset >= videoEvent.videoLength - 0.5 &&
                           this.videoPlayingTime >= 2.0) {
                    // Also handle paused state when video reaches end
                    console.log('video ended (paused at end), starting wait period')
                    this.videoState = 'waitingAfterEnd'
                    this.elapsedWaitTime = 0
                }
            }
        )
    }
    
    checkAndCorrectPlayerPosition() {
        const playerTransform = Transform.getOrNull(engine.PlayerEntity)
        if (!playerTransform) return
        
        const playerPos = playerTransform.position
        const viewingBoxCenter = Vector3.create(0, 0, 0)
        const distance = Vector3.distance(playerPos, viewingBoxCenter)
        
        // If player is outside the viewing box, teleport them back
        if (distance > this.videoViewingBoxRadius) {
            console.log(`Player outside viewing box (${distance.toFixed(2)}m), teleporting to viewing position`)
            
            // Use movePlayerTo for smooth teleport
            movePlayerTo({
                newRelativePosition: Vector3.create(0, 1, 0),
                cameraTarget: Vector3.create(0, 1, -5)  // Look at the video screens
            })
        }
    }
	
}