import { engine, GltfContainer, Transform, Entity, TriggerArea, triggerAreaEventsSystem, MeshRenderer, ColliderLayer, Material } from '@dcl/sdk/ecs'

import { GameManager } from '../gameMgr'
import { Vector3, Quaternion,Color4 } from '@dcl/sdk/math'

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
        Material.setPbrMaterial(e, {
            albedoColor: Color4.create(0,0,1,0.5),
        })
    }

    // Event when trigger area activated
    triggerAreaEventsSystem.onTriggerEnter(e, (r) => {
        console.log("HouseTriggerZone: trigger area activated")
        _gameMgr.foundGirl()
    })


    return e

}

export function CheckpointTriggerZone(
    _gameMgr: GameManager, 
    _checkpointId: string,
    _pos: Vector3, 
    _scale: Vector3, 
    _respawnPos: Vector3,
    _respawnRot: Quaternion,
    _debug: boolean = false
): Entity {

    console.log(`CheckpointTriggerZone: creating ${_checkpointId}`)
    var e = engine.addEntity()

    TriggerArea.setBox(e, ColliderLayer.CL_PLAYER)

    Transform.create(e, {
        position: _pos,
        scale: _scale
    })

    if(_debug){
        MeshRenderer.setBox(e)
        Material.setPbrMaterial(e, {
            albedoColor: Color4.create(0,1,0,0.5),
        })
    }

    // Event when trigger area activated
    triggerAreaEventsSystem.onTriggerEnter(e, (r) => {
        // Only update if this isn't already the current checkpoint
        if (_gameMgr.playerMgr.currentCheckpoint !== _checkpointId) {
            console.log(`CheckpointTriggerZone: ${_checkpointId} activated`)
            _gameMgr.playerMgr.setCheckpoint(_checkpointId, _respawnPos, _respawnRot)
            
            // Optional: Show a message to the player
            //_gameMgr.showMessage(`Checkpoint: ${_checkpointId}`)
        }

        //no matter if this is the current checkpoint, we need to check if the checkpoints are active
        //if they are not active, we need to activate them. 
        if(_gameMgr.playerMgr.checkpointSet == false){
			_gameMgr.playerMgr.checkpointSet = true
			_gameMgr.turnOnFallZone()
		}
    })

    return e
}

export function FallTriggerZone(_gameMgr: GameManager, _pos: Vector3, _scale: Vector3, _debug: boolean = false): Entity{

    console.log("FallTriggerZone: constructor running")
    var e = engine.addEntity()

    TriggerArea.setBox(e, ColliderLayer.CL_PLAYER)

    Transform.create(e, {
        position: _pos,
        scale: _scale
    })

    if(_debug){
        MeshRenderer.setBox(e)
        /* Material.setPbrMaterial(e, {
            albedoColor: Color4.create(1,0,0,0.5),
        }) */
    }

    // Event when trigger area activated (player fell)
    triggerAreaEventsSystem.onTriggerEnter(e, (r) => {
        console.log("FallTriggerZone: player fell, respawning at checkpoint")
        _gameMgr.playerMgr.respawnAtCheckpoint()
        
        // Optional: Show a message to the player
        //_gameMgr.showMessage("Respawning at checkpoint...")
    })

    return e
}

export function DisableCheckpointsTriggerZone(_gameMgr: GameManager, _pos: Vector3, _scale: Vector3, _debug: boolean = false): Entity{
    console.log("DisableCheckpointsTriggerZone: constructor running")
    var e = engine.addEntity()

    TriggerArea.setBox(e, ColliderLayer.CL_PLAYER)

    Transform.create(e, {
        position: _pos,
        scale: _scale
    })

    if(_debug){
        MeshRenderer.setBox(e)
        Material.setPbrMaterial(e, {
            albedoColor: Color4.create(1,0,0,0.5),
        })
    }

    // Event when trigger area activated (player fell)
    triggerAreaEventsSystem.onTriggerEnter(e, (r) => {
        console.log("DisableCheckpointsTriggerZone: disabling checkpoints")
        _gameMgr.playerMgr.disableCheckpoints()
        
    })

    return e
}

export function ReverseCheckpointsTriggerZone(_gameMgr: GameManager, _pos: Vector3, _scale: Vector3, _debug: boolean = false): Entity{

    console.log("ReverseCheckpointsTriggerZone: constructor running")
    var e = engine.addEntity()

    TriggerArea.setBox(e, ColliderLayer.CL_PLAYER)

    Transform.create(e, {
        position: _pos,
        scale: _scale
    })

    if(_debug){
        MeshRenderer.setBox(e)
        Material.setPbrMaterial(e, {
            albedoColor: Color4.create(1,0,0,0.5),
        })
    }

    // Event when trigger area activated (player fell)
    triggerAreaEventsSystem.onTriggerEnter(e, (r) => {
        console.log("ReverseCheckpointsTriggerZone: reversing checkpoints")
        _gameMgr.reverseCheckpoints()
    })

    return e    
}

export function ToggleUpperFallZoneTriggerZone(_gameMgr: GameManager, _pos: Vector3, _scale: Vector3, _debug: boolean = false): Entity{
    console.log("DisableCheckpointsTriggerZone: constructor running")
    var e = engine.addEntity()

    TriggerArea.setBox(e, ColliderLayer.CL_PLAYER)

    Transform.create(e, {
        position: _pos,
        scale: _scale
    })

    if(_debug){
        MeshRenderer.setBox(e)
        Material.setPbrMaterial(e, {
            albedoColor: Color4.create(1,0,1,0.5),
        })
    }

    // Event when trigger area activated (player fell)
    triggerAreaEventsSystem.onTriggerEnter(e, (r) => {
        console.log("DisableCheckpointsTriggerZone: disabling checkpoints")
        /* if(_gameMgr.playerMgr.upperZoneActive == false){
            _gameMgr.playerMgr.upperZoneActive = true
        } else {
            _gameMgr.playerMgr.upperZoneActive = false
        } */
        _gameMgr.adjustUpperFallZone()
    })

    return e
}