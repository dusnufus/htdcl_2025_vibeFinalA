import ReactEcs, { Button, Label, UiEntity } from '@dcl/sdk/react-ecs'
import { Color4 } from '@dcl/sdk/math'
import { GameManager } from '../gameMgr'

export function DialogModule(_gameMgr: GameManager) {
    
    // Only show if dialog is active
    if (!_gameMgr.dialogActive) return null

    const isPlayer = _gameMgr.dialogSpeaker === 'player'
    const isNPC = _gameMgr.dialogSpeaker === 'npc'

    return (
        <UiEntity
            uiTransform={{
                width: '80%',
                height: '40%',
                position: { bottom: '5%' },
                positionType: 'absolute',
                flexDirection: 'row',
                justifyContent: 'space-between',
                padding: 10
            }}
            uiBackground={{ color: Color4.create(0, 0, 0, 0.1) }}
        >
            {/* PLAYER SIDE (LEFT) */}
            <UiEntity
                uiTransform={{
                    width: '48%',
                    height: '100%',
                    flexDirection: 'column',
                    justifyContent: 'flex-end',
                    padding: 15
                }}
                uiBackground={{ 
                    color: isPlayer 
                        ? Color4.create(0.2, 0.3, 0.5, 0.95)  // Active blue
                        : Color4.create(0.1, 0.1, 0.15, 0.3)  // Inactive/dim
                }}
            >
                {/* Player Avatar placeholder */}
                <UiEntity
                    uiTransform={{
                        width: 60,
                        height: 60,
                        margin: { bottom: 10 }
                    }}
                    uiBackground={{ color: Color4.create(0.3, 0.6, 0.8, 1) }}
                />
                
                <Label 
                    value="YOU" 
                    fontSize={20} 
                    color={Color4.create(0.7, 0.9, 1, 1)}
                    textAlign="middle-left"
                />
                
                {isPlayer && (
                    <UiEntity
                        uiTransform={{
                            width: '100%',
                            margin: { top: 10 },
                            padding: 10
                        }}
                    >
                        <Label 
                            value={_gameMgr.dialogText} 
                            fontSize={16} 
                            color={Color4.White()}
                            textAlign="middle-left"
                        />
                    </UiEntity>
                )}
            </UiEntity>

            {/* NPC SIDE (RIGHT) */}
            <UiEntity
                uiTransform={{
                    width: '48%',
                    height: '100%',
                    flexDirection: 'column',
                    justifyContent: 'flex-end',
                    padding: 15
                }}
                uiBackground={{ 
                    color: isNPC 
                        ? Color4.create(0.5, 0.3, 0.2, 0.95)  // Active orange/brown
                        : Color4.create(0.1, 0.1, 0.15, 0.3)  // Inactive/dim
                }}
            >
                {/* NPC Avatar placeholder */}
                <UiEntity
                    uiTransform={{
                        width: 60,
                        height: 60,
                        margin: { bottom: 10 },
                        alignSelf: 'flex-end'
                    }}
                    uiBackground={{ color: Color4.create(0.8, 0.6, 0.3, 1) }}
                />
                
                <Label 
                    value={_gameMgr.dialogNPCName.toUpperCase()} 
                    fontSize={20} 
                    color={Color4.Yellow()}
                    textAlign="middle-right"
                />
                
                {isNPC && (
                    <UiEntity
                        uiTransform={{
                            width: '100%',
                            margin: { top: 10 },
                            padding: 10
                        }}
                    >
                        <Label 
                            value={_gameMgr.dialogText} 
                            fontSize={16} 
                            color={Color4.White()}
                            textAlign="middle-right"
                        />
                    </UiEntity>
                )}
            </UiEntity>

            {/* BOTTOM CONTROLS */}
            <UiEntity
                uiTransform={{
                    width: '100%',
                    height: 60,
                    position: { bottom: 10 },
                    positionType: 'absolute',
                    flexDirection: 'row',
                    justifyContent: 'center',
                    alignItems: 'center'
                }}
            >
                {/* Player Choices (if any) */}
                {_gameMgr.dialogPlayerChoices && _gameMgr.dialogPlayerChoices.length > 0 ? (
                    <UiEntity
                        uiTransform={{
                            width: '100%',
                            flexDirection: 'row',
                            justifyContent: 'center'
                        }}
                    >
                        {_gameMgr.dialogPlayerChoices.map((choice, index) => (
                            <Button
                                key={`choice-${index}`}
                                value={choice.text}
                                variant="primary"
                                uiTransform={{ width: 200, height: 40, margin: { left: 5, right: 5 } }}
                                fontSize={14}
                                onMouseDown={() => {
                                    _gameMgr.selectDialogChoice(choice.nextDialogId)
                                }}
                            />
                        ))}
                    </UiEntity>
                ) : (
                    <UiEntity
                        uiTransform={{
                            width: '100%',
                            flexDirection: 'row',
                            justifyContent: 'center'
                        }}
                    >
                        {/* Standard Continue/Close buttons */}
                        {_gameMgr.dialogHasNext && (
                            <Button
                                value="Continue"
                                variant="primary"
                                uiTransform={{ width: 150, height: 40, margin: { right: 10 } }}
                                fontSize={16}
                                onMouseDown={() => {
                                    _gameMgr.advanceDialog()
                                }}
                            />
                        )}
                        <Button
                            value={_gameMgr.dialogHasNext ? "Skip" : "Close"}
                            variant="secondary"
                            uiTransform={{ width: 150, height: 40 }}
                            fontSize={16}
                            onMouseDown={() => {
                                _gameMgr.closeDialog()
                            }}
                        />
                    </UiEntity>
                )}
            </UiEntity>
        </UiEntity>
    )
}
