/* import {
    engine,
    Transform,
  } from '@dcl/sdk/ecs' */
  
  import ReactEcs, { Button, Label, ReactEcsRenderer, UiEntity } from '@dcl/sdk/react-ecs'
import { Color4 } from '@dcl/sdk/math'

import { GameManager } from '../gameMgr'

export function PlayerInfoModule(_gameMgr: GameManager) {
    return (
      <UiEntity
      uiTransform={{
        width: '300 px',
        height: '40 px',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'space-between',
        positionType: 'absolute',
        position: { right: '100 px', top: '20 px' },
      }}

      uiBackground={{ color: Color4.create(0, 0, 0, 0.6) }}
      
      >
      <Label value={`Player Name: ${_gameMgr.playerMgr.playerInfoRec ? _gameMgr.playerMgr.playerUserData.data.displayName : "waiting for data..."}`} fontSize={18} textAlign="middle-center" />
      
      
    </UiEntity>






    )
  }