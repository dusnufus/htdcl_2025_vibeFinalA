import { engine, GltfContainer, Transform, Entity, pointerEventsSystem, InputAction, MeshRenderer, MeshCollider } from '@dcl/sdk/ecs'

import { GameManager } from '../gameMgr'
import { Quaternion, Vector3 } from '@dcl/sdk/math'

export function TempZoneClicker(_gameMgr: GameManager, _cbMessage:string, _pos: Vector3, _scale: Vector3): Entity{

    var e = engine.addEntity()

    MeshRenderer.setBox(e)
    MeshCollider.setBox(e)

    Transform.create(e, {
        position: _pos,
        scale: _scale
    })

    pointerEventsSystem.onPointerDown(
        e,
        () => {
            if(_cbMessage == "foundGirl"){
                _gameMgr.foundGirl()
            }
        },
        {
            button: InputAction.IA_POINTER,
            hoverText: "FAKE FIND GIRL TRIGGER"
        }
    )

    return e

}