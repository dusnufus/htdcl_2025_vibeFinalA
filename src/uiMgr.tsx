//import { engine, Transform,} from '@dcl/sdk/ecs'
//import { Color4 } from '@dcl/sdk/math'
import {ReactEcsRenderer } from '@dcl/sdk/react-ecs'

import { GameManager } from './gameMgr'

import { CoordsModule } from './uiElements/coordInfoModule'
import { PlayerInfoModule } from './uiElements/playerInfoModule'
import { MissionListModule } from './uiElements/missionListModule'
import { MissionSubListModule } from './uiElements/missionSubListModule'
import { MessageModule } from './uiElements/messageModule'

let gameMgr: GameManager

export function setUiForMissionState(_gameMgr: GameManager, _missionState: string) {

  gameMgr = _gameMgr

  switch(_missionState){
    case "introPlaying":
      ReactEcsRenderer.setUiRenderer(uiInit)
      break
    case "exploringTown":
      ReactEcsRenderer.setUiRenderer(uiExploringTown)
      break
  }


}



const uiInit = () => [
  CoordsModule(),
  //PlayerInfoModule(gameMgr),
  //MissionListModule(gameMgr),
  //MessageModule(gameMgr)
]

const uiExploringTown = () => [
  CoordsModule(),
  PlayerInfoModule(gameMgr),
  MissionListModule(gameMgr),
  //MissionSubListModule(gameMgr),
  MessageModule(gameMgr)
]