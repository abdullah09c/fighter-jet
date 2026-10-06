import Phaser from 'phaser';
import { AudioManager } from '../audio/AudioManager';

export class Survivor extends Phaser.GameObjects.Container {
  public isRescued = false;
  private rescueProgress = 0;
  private rescueTimeRequired = 2.0; // 2 seconds to rescue
  private rescueRadius = 75;
  private ringGraphics: Phaser.GameObjects.Graphics;
  private sprite: Phaser.GameObjects.Sprite;
  private audio: AudioManager;
  private pingTimer = 0;

  constructor(scene: Phaser.Scene, x: number, y: number) {
    super(scene, x, y);

    this.audio = AudioManager.getInstance();

    // Stranded pilot sprite
    this.sprite = scene.add.sprite(0, 0, 'survivor').setOrigin(0.5, 0.5);
    this.add(this.sprite);

    // Indicator graphics
    this.ringGraphics = scene.add.graphics();
    this.add(this.ringGraphics);

    scene.add.existing(this);

    // Subtle breathing pulse
    scene.tweens.add({
      targets: this.sprite,
      scaleX: 1.1,
      scaleY: 1.1,
      duration: 600,
      yoyo: true,
      repeat: -1,
      ease: 'Sine.easeInOut',
    });
  }

  public updateRescue(deltaSeconds: number, playerX: number, playerY: number, onComplete: () => void): void {
    if (this.isRescued) return;

    const dist = Phaser.Math.Distance.Between(this.x, this.y, playerX, playerY);
    this.ringGraphics.clear();

    if (dist <= this.rescueRadius) {
      this.rescueProgress += deltaSeconds;
      this.pingTimer += deltaSeconds;

      if (this.pingTimer >= 0.4) {
        this.pingTimer = 0;
        this.audio.play('warning', 1.4);
      }

      // Draw active rescue ring
      const progressFraction = Math.min(1, this.rescueProgress / this.rescueTimeRequired);
      this.ringGraphics.lineStyle(4, 0x00d2ff, 0.9);
      this.ringGraphics.strokeCircle(0, 0, this.rescueRadius);

      // Radial progress arc
      this.ringGraphics.lineStyle(6, 0xffd200, 1);
      this.ringGraphics.beginPath();
      this.ringGraphics.arc(
        0,
        0,
        this.rescueRadius,
        -Math.PI / 2,
        -Math.PI / 2 + Math.PI * 2 * progressFraction,
        false
      );
      this.ringGraphics.strokePath();

      if (this.rescueProgress >= this.rescueTimeRequired) {
        this.completeRescue(onComplete);
      }
    } else {
      // Player left zone, progress slowly decays
      this.rescueProgress = Math.max(0, this.rescueProgress - deltaSeconds * 1.5);
      // Idle dashed ring
      this.ringGraphics.lineStyle(2, 0xffaa00, 0.5);
      this.ringGraphics.strokeCircle(0, 0, this.rescueRadius);
    }
  }

  private completeRescue(onComplete: () => void): void {
    this.isRescued = true;
    this.audio.play('rescue');
    this.ringGraphics.clear();

    // Fly up to extraction helicopter/sky
    this.scene.tweens.add({
      targets: this,
      y: this.y - 150,
      alpha: 0,
      scaleX: 0.2,
      scaleY: 0.2,
      duration: 700,
      ease: 'Back.easeIn',
      onComplete: () => {
        onComplete();
        this.destroy();
      },
    });
  }
}
