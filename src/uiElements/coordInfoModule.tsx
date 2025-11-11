import {
    engine,
    Transform,
  } from '@dcl/sdk/ecs'
  
  import ReactEcs, { Button, Label, ReactEcsRenderer, UiEntity } from '@dcl/sdk/react-ecs'
import { Color4, Quaternion } from '@dcl/sdk/math'

import { GameManager } from '../gameMgr'

export function CoordsModule(_gameMgr: GameManager) {
    return (
      <UiEntity
      uiTransform={{
        width: 300,
        height: 80,
        margin: { left: '220 px', top: '0 px' },
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'space-between',
      }}
      uiBackground={{ color: Color4.create(0, 0, 0, 0.6) }}
    >
      <Label
        value={`${getPlayerPosition()}`}
        fontSize={10}
        textAlign="middle-center"
      />
      <Label
          value={`${getPlayerCheckpoint(_gameMgr)}`}
          fontSize={20}
          textAlign="middle-center"
      />

      </UiEntity>
      
    )
  }

  function getPlayerPosition() {
    const playerPosition = Transform.getOrNull(engine.PlayerEntity)
    if (!playerPosition) return ' no data yet'
    let { x, y, z } = playerPosition.position
    let rotation = playerPosition.rotation
      
    // Convert quaternion to Euler angles (in radians) then to degrees
    const euler = Quaternion.toEulerAngles(rotation)
    //the Quaternion to euler is giving degrees, so we don't need to convert
    
    return `Pos: {X: ${x.toFixed(2)}, Y: ${y.toFixed(2)}, Z: ${z.toFixed(2)}}\nRot: Y: ${euler.y.toFixed(2)}`
  }

  function getPlayerCheckpoint(_gameMgr: GameManager) {
    return `Checkpoint: ${_gameMgr.playerMgr.currentCheckpoint}`
  }