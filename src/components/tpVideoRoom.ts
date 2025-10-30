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

    // Incremented every time a new video is scheduled
    playSessionId: number = 0

	constructor(_gameMgr: GameManager, _roomSrc: string, _screenSrc: string, _screenCount: number){

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

        // Ensure previous video is stopped/cleaned before scheduling a new one
        this.stopVideo()

        this.playSessionId++   // NEW: mark a new play cycle

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
        console.log('playVideoNow: starting video')
        
        VideoPlayer.create(this.screenEntities[0], {
            src: this.currentVideoSrc,
            playing: true,
            //loop: true,
        })

        //set the same video texture for all the screens
        for(let i = 0; i < this.screenEntities.length; i++){

            GltfNodeModifiers.createOrReplace(
                this.screenEntities[i],
                {
                    modifiers: [{
                        path: '',
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

        if (this.screenEntities.length > 0) {
            videoEventsSystem.registerVideoEventsEntity(
                this.screenEntities[0],
                (videoEvent) => {
                    // Only process if we're in playing state
                    if (this.videoState !== 'playing') return

                    if (videoEvent.videoLength > 0) {
                        this.expectedVideoDuration = videoEvent.videoLength + 5
                    }

                    if (videoEvent.state === VideoState.VS_PLAYING && 
                        videoEvent.videoLength > 0 && 
                        videoEvent.currentOffset >= videoEvent.videoLength - 0.5 &&
                        this.videoPlayingTime >= 2.0) {
                        console.log('video ended (via video events), starting wait period')
                        this.videoState = 'waitingAfterEnd'
                        this.elapsedWaitTime = 0
                    } else if (videoEvent.state === VideoState.VS_PAUSED && 
                               videoEvent.videoLength > 0 &&
                               videoEvent.currentOffset >= videoEvent.videoLength - 0.5 &&
                               this.videoPlayingTime >= 2.0) {
                        console.log('video ended (paused at end), starting wait period')
                        this.videoState = 'waitingAfterEnd'
                        this.elapsedWaitTime = 0
                    }
                }
            )
        }
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

    // NEW: stop/cleanup current video safely before playing a new one
    private stopVideo() {
        const e = this.screenEntities?.[0]
        if (!e) return
        const vp = VideoPlayer.getOrNull(e)
        if (vp) {
            const m = VideoPlayer.getMutable(e)
            m.playing = false
            // Optionally clear component to force a clean recreate next time
            VideoPlayer.deleteFrom(e)
        }
        // Reset materials to avoid dangling video textures (optional)
        for (let i = 0; i < this.screenEntities.length; i++) {
            GltfNodeModifiers.createOrReplace(
                this.screenEntities[i],
                {
                    modifiers: [{
                        path: '',
                        material: {
                            material: {
                                $case: 'pbr', pbr: {} // no texture
                            }
                        }
                    }]
                }
            )
        }
    }
	
}