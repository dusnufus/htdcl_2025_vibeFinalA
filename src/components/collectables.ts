import { engine, GltfContainer, Transform, Entity, pointerEventsSystem, InputAction } from '@dcl/sdk/ecs'

import { GameManager } from '../gameMgr'
import { Quaternion, Vector3 } from '@dcl/sdk/math'

export function CandleCollectable(_gameMgr: GameManager, _prompt:string, _targetTestZoneIndex: number, _targetSpawnIndex: number, _srcPath:string, _pos: Vector3, _scale: Vector3, _rot: Quaternion): Entity{

    var entity = engine.addEntity()
    GltfContainer.create(entity, {
        src: _srcPath
    })

    Transform.create(entity, {
        position: _pos,
        scale: _scale,
        rotation: _rot
    })

    pointerEventsSystem.onPointerDown(
        entity,
        () => {
            console.log("clicked candle")
            _gameMgr.candleCollected()
            //console.log("AreaIndex: " + this.areaMgr.areaIndex + ", targetAreaIndex: " + this.targetAreaIndex)
        },
        {
            button: InputAction.IA_POINTER,
            hoverText: _prompt
        }
    )

    return entity

}