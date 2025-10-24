  
import ReactEcs, { Button, Label, ReactEcsRenderer, UiEntity } from '@dcl/sdk/react-ecs'
import { Color4 } from '@dcl/sdk/math'
import { GameManager } from '../gameMgr'

export function MessageModule(_gameMgr: GameManager) {
    return (
      <UiEntity
      uiTransform={{
        width: 600,
        height: 20,
        margin: {bottom: '-100 px' },
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'space-between',
      }}
      uiBackground={{ color: Color4.create(0, 0, 0, 0.6) }}
    >
      <Label value={`message: ${_gameMgr.messageText}`} fontSize={18} textAlign="middle-center" />

      </UiEntity>
      
    )
  }