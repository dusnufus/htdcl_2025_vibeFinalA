/* import {
    engine,
    Transform,
  } from '@dcl/sdk/ecs' */
  
  import ReactEcs, { Button, Label, ReactEcsRenderer, UiEntity } from '@dcl/sdk/react-ecs'
import { Color4 } from '@dcl/sdk/math'

import { GameManager } from '../gameMgr'

export function MissionListModule(_gameMgr: GameManager) {
    return (
    //start MAIN container
    <UiEntity
            uiTransform={{
                width: '300 px',
                height: '150 px',
                flexDirection: 'column',
                alignItems: 'center',
                justifyContent: 'space-between',
                positionType: 'absolute',
                position: { right: '20 px', top: '100 px' },
            }}

            
            uiBackground={{
                    textureMode: 'nine-slices',
                    texture: {
                    src: 'images/ui_9sliceA_50perc.png'
                    },
                    textureSlices: {
                    top: 0.3333,
                    bottom: 0.3333,
                    left: 0.3333,
                    right: 0.3333
                    }
                }}
      >

      <UiEntity
        uiTransform={{
          width: '300 px',
          height: '42 px',
          positionType: 'absolute',
            position: {top: '20 px' },
        }}
        uiBackground={{
              texture: {
                src: 'images/missionTitleA_150perc.png'
              }
          }}
      ></UiEntity>

      <UiEntity
        uiTransform={{
          width: '300 px',
          height: '42 px',
          flexDirection: 'column',
                alignItems: 'center',
                justifyContent: 'space-between',
          positionType: 'absolute',
            position: {top: '62 px' },
        }}
      >
        <Label value={`${_gameMgr.missionTitle}`} fontSize={18} textAlign="middle-center" />
      </UiEntity>

        

      
    
    </UiEntity>
//end main container





    )
  }