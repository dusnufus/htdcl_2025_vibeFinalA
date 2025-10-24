import { engine, GltfContainer, Transform, Entity, TriggerArea, triggerAreaEventsSystem, MeshRenderer, ColliderLayer } from '@dcl/sdk/ecs'

import { GameManager } from '../gameMgr'
import { Vector3 } from '@dcl/sdk/math'

export function HouseTriggerZone(_gameMgr: GameManager, _pos: Vector3, _scale: Vector3, _debug: boolean = false): Entity{

    console.log("HouseTriggerZone: constructor running")
    var e = engine.addEntity()

    TriggerArea.setBox(e, ColliderLayer.CL_PLAYER)

    Transform.create(e, {
        position: _pos,
        scale: _scale
    })

    if(_debug){
        MeshRenderer.setBox(e)
    }

    // Event when trigger area activated
    triggerAreaEventsSystem.onTriggerEnter(e, (r) => {
        console.log("HouseTriggerZone: trigger area activated")
        _gameMgr.foundGirl()
    })


    return e

}