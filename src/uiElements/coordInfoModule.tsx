import {
    engine,
    Transform,
  } from '@dcl/sdk/ecs'
  
  import ReactEcs, { Button, Label, ReactEcsRenderer, UiEntity } from '@dcl/sdk/react-ecs'
import { Color4 } from '@dcl/sdk/math'

export function CoordsModule() {
    return (
      <UiEntity
      uiTransform={{
        width: 300,
        height: 20,
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

      </UiEntity>
      
    )
  }

  function getPlayerPosition() {
    const playerPosition = Transform.getOrNull(engine.PlayerEntity)
    if (!playerPosition) return ' no data yet'
    let { x, y, z } = playerPosition.position

    //temp adjustments for placing items
   /*  x -= 192;
    y -= 18;
    z += 32; */
    
    return `{X: ${x.toFixed(2)}, Y: ${y.toFixed(2)}, z: ${z.toFixed(2)} }`
  }