import ReactEcs, { Button, Label, UiEntity } from '@dcl/sdk/react-ecs'
import { Color4 } from '@dcl/sdk/math'
import { GameManager } from '../gameMgr'

export function DialogModule(_gameMgr: GameManager) {
    
    // Only show if dialog is active
    if (!_gameMgr.dialogActive) return null

    return (
        <UiEntity
            uiTransform={{
                width: '70%',
                height: '35%',
                position: { bottom: '5%' },
                positionType: 'absolute',
                flexDirection: 'column',
                alignItems: 'center',
                justifyContent: 'space-between',
                padding: 20
            }}
            uiBackground={{ color: Color4.create(0.1, 0.1, 0.15, 0.95) }}
        >
            {/* NPC Name */}
            <UiEntity
                uiTransform={{
                    width: '100%',
                    height: 40,
                    justifyContent: 'flex-start',
                    alignItems: 'center'
                }}
            >
                <Label 
                    value={_gameMgr.dialogNPCName} 
                    fontSize={24} 
                    color={Color4.Yellow()}
                    textAlign="middle-left"
                />
            </UiEntity>

            {/* Dialog Text */}
            <UiEntity
                uiTransform={{
                    width: '100%',
                    height: '60%',
                    justifyContent: 'center',
                    alignItems: 'center'
                }}
            >
                <Label 
                    value={_gameMgr.dialogText} 
                    fontSize={18} 
                    color={Color4.White()}
                    textAlign="middle-center"
                />
            </UiEntity>

            {/* Buttons */}
            <UiEntity
                uiTransform={{
                    width: '100%',
                    height: 50,
                    flexDirection: 'row',
                    justifyContent: 'space-around',
                    alignItems: 'center'
                }}
            >
                {/* Continue/Next button */}
                {_gameMgr.dialogHasNext && (
                    <Button
                        value="Continue"
                        variant="primary"
                        uiTransform={{ width: 150, height: 40 }}
                        fontSize={16}
                        onMouseDown={() => {
                            _gameMgr.advanceDialog()
                        }}
                    />
                )}

                {/* Close button */}
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
        </UiEntity>
    )
}

