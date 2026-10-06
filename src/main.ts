import Phaser from 'phaser';
import { BootScene } from './scenes/BootScene';
import { IntroScene } from './scenes/IntroScene';
import { GameScene } from './scenes/GameScene';
import { UIManager, HUDData, SummaryData } from './ui/UIManager';

// Viewport settings for vertical top-down shmup
const GAME_WIDTH = 540;
const GAME_HEIGHT = 960;

const config: Phaser.Types.Core.GameConfig = {
  type: Phaser.AUTO,
  width: GAME_WIDTH,
  height: GAME_HEIGHT,
  parent: 'phaser-root',
  backgroundColor: '#080d1a',
  scale: {
    mode: Phaser.Scale.FIT,
    autoCenter: Phaser.Scale.CENTER_BOTH,
  },
  physics: {
    default: 'arcade',
    arcade: {
      gravity: { x: 0, y: 0 },
      debug: false,
    },
  },
  scene: [BootScene, IntroScene, GameScene],
};

function syncOverlayToCanvas(game: Phaser.Game): void {
  const canvas = game.canvas;
  const overlay = document.getElementById('ui-overlay');
  if (canvas && overlay) {
    const rect = canvas.getBoundingClientRect();
    if (rect.width > 0 && rect.height > 0) {
      overlay.style.position = 'fixed';
      overlay.style.left = `${rect.left}px`;
      overlay.style.top = `${rect.top}px`;
      overlay.style.width = `${rect.width}px`;
      overlay.style.height = `${rect.height}px`;
      overlay.style.maxWidth = `${rect.width}px`;
      overlay.style.maxHeight = `${rect.height}px`;
    }
  }
}

window.addEventListener('DOMContentLoaded', () => {
  const game = new Phaser.Game(config);
  const uiManager = new UIManager('ui-overlay');

  // Continually sync overlay bounding box with Phaser canvas
  const doSync = () => syncOverlayToCanvas(game);
  window.addEventListener('resize', doSync);
  game.scale.on('resize', doSync);

  // Check periodically during boot to adapt as soon as canvas attaches
  let attempts = 0;
  const pollTimer = setInterval(() => {
    doSync();
    attempts++;
    if (attempts > 20) clearInterval(pollTimer);
  }, 100);

  // Connect UIManager callbacks to Phaser scene
  uiManager.setCallbacks({
    onStartStage: (stageId: number) => {
      const gameScene = game.scene.getScene('GameScene') as GameScene;
      if (gameScene) {
        game.scene.stop('GameScene');
        game.scene.start('GameScene', { stageId });
      }
      setTimeout(doSync, 50);
    },
    onTriggerAbility: (ability: 'laser' | 'shield' | 'bomb') => {
      const gameScene = game.scene.getScene('GameScene') as GameScene;
      if (gameScene && gameScene.scene.isActive()) {
        if (ability === 'laser') gameScene.triggerLaserBeam();
        if (ability === 'shield') gameScene.triggerEnergyShield();
        if (ability === 'bomb') gameScene.triggerMegaBomb();
      }
    },
    onTogglePause: () => {
      const gameScene = game.scene.getScene('GameScene') as GameScene;
      if (gameScene && gameScene.scene.isActive()) {
        gameScene.togglePause();
      }
    },
    onRestart: () => {
      const gameScene = game.scene.getScene('GameScene') as GameScene;
      if (gameScene) {
        const id = gameScene.currentStageId || 1;
        game.scene.stop('GameScene');
        game.scene.start('GameScene', { stageId: id });
      }
      setTimeout(doSync, 50);
    },
    onToggleAutoFire: () => {
      const gameScene = game.scene.getScene('GameScene') as GameScene;
      if (gameScene && gameScene.scene.isActive()) {
        gameScene.toggleAutoFire();
      }
    },
  });

  // Listen to Intro Scene finished
  game.events.on('ui:intro-finished', () => {
    uiManager.renderMainMenu();
    doSync();
  });

  // Listen to Phaser scene events
  game.events.on('ui:hud-update', (data: HUDData) => {
    uiManager.updateHUD(data);
  });

  game.events.on('ui:dialogue', (data: { speaker: string; text: string; portrait: string }) => {
    uiManager.showDialogue(data.speaker, data.text, data.portrait);
  });

  game.events.on('ui:toast', (message: string) => {
    uiManager.showToast(message);
  });

  game.events.on('ui:pause-state', (isPaused: boolean) => {
    uiManager.showPauseModal(isPaused);
  });

  game.events.on('ui:mission-summary', (data: SummaryData) => {
    uiManager.renderMissionSummary(data);
  });
});
