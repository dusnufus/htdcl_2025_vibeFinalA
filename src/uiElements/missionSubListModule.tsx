
  
  import ReactEcs, { Button, Label, ReactEcsRenderer, UiEntity } from '@dcl/sdk/react-ecs'
import { Color4 } from '@dcl/sdk/math'

import { GameManager } from '../gameMgr'

export function MissionSubListModule(_gameMgr: GameManager) {
    return (
    //start MAIN container
    <UiEntity
            uiTransform={{
                width: '300 px',
                height: '250 px',
                flexDirection: 'column',
                alignItems: 'center',
                justifyContent: 'space-between',
                positionType: 'absolute',
                position: { right: '20 px', top: '300 px' },
            }}

            //uiBackground={{ color: Color4.create(0, 0, 0, 0.6) }}
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
      //sub-mission list
                        uiTransform={{
                        width: '300 px',
                        height: '200 px',
                        flexDirection: 'column',
                alignItems: 'center',
                justifyContent: 'space-between',
                        positionType: 'absolute',
                            position: {top: '20 px' },
                        }}
                    >
                        
                        <Label value={`Candles: ${_gameMgr.playerMgr.candleCount}`} fontSize={18} textAlign="middle-center" font='serif' />
                        <Label value={`Paper and Pen: ${_gameMgr.playerMgr.hasPenPaper}`} fontSize={18} textAlign="middle-center" />
                        <Label value={`Cat Toy: ${_gameMgr.playerMgr.hasToy}`} fontSize={18} textAlign="middle-center" />
                        <Label value={`Photo: ${_gameMgr.playerMgr.hasPicture}`} fontSize={18} textAlign="middle-center" />
                        <Label value={`Cat Food: ${_gameMgr.playerMgr.hasFood}`} fontSize={18} textAlign="middle-center" />
    
      </UiEntity>

      
    
    </UiEntity>
//end main container





    )
  }