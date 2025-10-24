import { engine, Transform, GltfContainer, Entity, Material, VideoPlayer, GltfNodeModifiers, VideoState, videoEventsSystem } from '@dcl/sdk/ecs'
import { Vector3, Quaternion } from '@dcl/sdk/math'
import { GameManager } from '../gameMgr'

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
                    this.playVideoNow()
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
        this.currentVideoSrc = _videoSrc
        this.waitBeforeStart = _waitBeforeStart
        this.waitAfterEnd = _waitAfterEnd
        this.elapsedWaitTime = 0
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

            GltfNodeModifiers.create(
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

        videoEventsSystem.registerVideoEventsEntity(
            this.screenEntities[0],
            (videoEvent) => {
                /* console.log(
                    'video event - state: ' +
                        videoEvent.state +
                        '\ncurrent offset:' +
                        videoEvent.currentOffset +
                        '\nvideo length:' +
                        videoEvent.videoLength
                ) */

                if (this.videoState === 'playing' && 
                    (videoEvent.currentOffset >= videoEvent.videoLength - 0.5 || videoEvent.state != VideoState.VS_PLAYING)) {
                    console.log('video ended, starting wait period')
                    this.videoState = 'waitingAfterEnd'
                }
        
                /* switch (videoEvent.state) {
                    case VideoState.VS_READY:
                        console.log('video event - video is READY')
                        break
                    case VideoState.VS_NONE:
                        console.log('video event - video is in NO STATE')
                        break
                    case VideoState.VS_ERROR:
                        console.log('video event - video ERROR')
                        break
                    case VideoState.VS_SEEKING:
                        console.log('video event - video is SEEKING')
                        break
                    case VideoState.VS_LOADING:
                        console.log('video event - video is LOADING')
                        break
                    case VideoState.VS_BUFFERING:
                        console.log('video event - video is BUFFERING')
                        break
                    case VideoState.VS_PLAYING:
                        console.log('video event - video started PLAYING')
                        break
                    case VideoState.VS_PAUSED:
                        console.log('video event - video is PAUSED')
                        // Check if video ended (currentOffset near videoLength)
                        if (this.videoState === 'playing' && 
                            videoEvent.currentOffset >= videoEvent.videoLength - 0.5) {
                            console.log('video ended, starting wait period')
                            this.videoState = 'waitingAfterEnd'
                        }
                        break
                } */
            }
        )

    }
    
	
}