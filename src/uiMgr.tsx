//import { engine, Transform,} from '@dcl/sdk/ecs'
//import { Color4 } from '@dcl/sdk/math'
import {ReactEcsRenderer } from '@dcl/sdk/react-ecs'

import { GameManager } from './gameMgr'

import { CoordsModule } from './uiElements/coordInfoModule'
import { PlayerInfoModule } from './uiElements/playerInfoModule'
import { MissionListModule } from './uiElements/missionListModule'
import { MessageModule } from './uiElements/messageModule'

let gameMgr: GameManager

export function initUi(_gameMgr: GameManager) {

  gameMgr = _gameMgr

  ReactEcsRenderer.setUiRenderer(uiInit)
}

const uiInit = () => [
  CoordsModule(),
  //PlayerInfoModule(gameMgr),
  MissionListModule(gameMgr),
  MessageModule(gameMgr)
]