import {
    engine,
    Transform,
  } from '@dcl/sdk/ecs'
  
  import ReactEcs, { Button, Label, ReactEcsRenderer, UiEntity } from '@dcl/sdk/react-ecs'
import { Color4 } from '@dcl/sdk/math'

import { GameManager } from '../gameMgr'

export function PlayerInfoModule(_gameMgr: GameManager) {
    return (
      <UiEntity
      uiTransform={{
        width: '400 px',
        height: '100 px',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'space-between',
        positionType: 'absolute',
        position: { right: '100 px', top: '0 px' },
      }}
      uiBackground={{ color: Color4.create(0, 0, 0, 0.6) }}
    >
      <Label value={`Player Name: ${_gameMgr.playerMgr.playerUserData.data.displayName}`} fontSize={18} textAlign="middle-center" />
      <Label value={`Candles: ${_gameMgr.playerMgr.candleCount}`} fontSize={18} textAlign="middle-center" />
      <Label value={`Paper and Pen: ${_gameMgr.playerMgr.hasPenPaper}`} fontSize={18} textAlign="middle-center" />
      <Label value={`Cat Toy: ${_gameMgr.playerMgr.hasToy}`} fontSize={18} textAlign="middle-center" />
      <Label value={`Photo: ${_gameMgr.playerMgr.hasPicture}`} fontSize={18} textAlign="middle-center" />
      <Label value={`Cat Food: ${_gameMgr.playerMgr.hasFood}`} fontSize={18} textAlign="middle-center" />
      <Label value={`Ritual Complete: ${_gameMgr.playerMgr.ritualComplete}`} fontSize={18} textAlign="middle-center" />
    </UiEntity>
    )
  }