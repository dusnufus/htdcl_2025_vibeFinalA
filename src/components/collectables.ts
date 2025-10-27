import { engine, GltfContainer, Transform, Entity, pointerEventsSystem, InputAction } from '@dcl/sdk/ecs'

import { GameManager } from '../gameMgr'
import { Quaternion, Vector3 } from '@dcl/sdk/math'

export function CandleCollectable(_gameMgr: GameManager, _index:number, _srcPath:string, _pos: Vector3, _scale: Vector3, _rot: Quaternion): Entity{

    var e = engine.addEntity()
    GltfContainer.create(e, {
        src: _srcPath
    })

    Transform.create(e, {
        position: _pos,
        scale: _scale,
        rotation: _rot
    })

    pointerEventsSystem.onPointerDown(
        e,
        () => {
            console.log("clicked candle: " + _index)
            _gameMgr.candleCollected(_index)
        },
        {
            button: InputAction.IA_POINTER,
            hoverText: "PICK UP CANDLE"
        }
    )

    return e

}

export function JarCollectable(_gameMgr: GameManager,_srcPath:string, _pos: Vector3, _scale: Vector3, _rot: Quaternion): Entity{

    var e = engine.addEntity()
    GltfContainer.create(e, {
        src: _srcPath
    })

    Transform.create(e, {
        position: _pos,
        scale: _scale,
        rotation: _rot
    })

    pointerEventsSystem.onPointerDown(
        e,
        () => {
            _gameMgr.jarCollected()
        },
        {
            button: InputAction.IA_POINTER,
            hoverText: "TAKE THE JAR"
        }
    )

    return e

}