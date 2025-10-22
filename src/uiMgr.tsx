import {
  engine,
  Transform,
} from '@dcl/sdk/ecs'
import { Color4 } from '@dcl/sdk/math'
import ReactEcs, { Button, Label, ReactEcsRenderer, UiEntity } from '@dcl/sdk/react-ecs'

import { GameManager } from './gameMgr'

import { CoordsModule } from './uiElements/coordInfoModule'
import { PlayerInfoModule } from './uiElements/playerInfoModule'

let gameMgr: GameManager

export function initUi(_gameMgr: GameManager) {

  gameMgr = _gameMgr

  ReactEcsRenderer.setUiRenderer(uiInit)
}

const uiInit = () => [
  CoordsModule(),
  PlayerInfoModule(gameMgr)
]