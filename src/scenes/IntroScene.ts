import Phaser from 'phaser';
import { AudioManager } from '../audio/AudioManager';

export class IntroScene extends Phaser.Scene {
  private hasSkipped = false;
  private audio!: AudioManager;
  private timerEvent?: Phaser.Time.TimerEvent;

  constructor() {
    super('IntroScene');
  }

  create(): void {
    this.hasSkipped = false;
    this.audio = AudioManager.getInstance();

    const { width, height } = this.cameras.main;

    // Dark background
    this.cameras.main.setBackgroundColor('#080d1a');

    // Skip handlers (Space, Enter, Click)
    const handleSkip = () => {
      if (!this.hasSkipped) {
        this.finishIntro();
      }
    };

    if (this.input.keyboard) {
      this.input.keyboard.on('keydown-SPACE', handleSkip);
      this.input.keyboard.on('keydown-ENTER', handleSkip);
    }
    this.input.on('pointerdown', handleSkip);

    // 1. Supersonic Jet Flyby
    const jet = this.add.sprite(width / 2, height + 80, 'player_heavy').setOrigin(0.5, 0.5);
    jet.setScale(1.1);

    const flame = this.add.sprite(width / 2, height + 130, 'flame').setOrigin(0.5, 0);
    flame.setScale(1.3, 2.5);

    // Audio: Jet supersonic flyby whoosh + sonic boom + logo reveal chime
    this.audio.play('flyby', 1.0);
    this.time.delayedCall(260, () => {
      this.audio.play('bomb', 1.2);
    });
    this.time.delayedCall(420, () => {
      this.audio.play('logo_reveal', 1.0);
    });

    // Jet flyby tween (bottom to off top)
    this.tweens.add({
      targets: [jet, flame],
      y: '-=1200',
      duration: 650,
      ease: 'Quad.easeIn',
      onComplete: () => {
        jet.destroy();
        flame.destroy();
      },
    });

    // Camera shake on sonic boom pass
    this.time.delayedCall(300, () => {
      this.cameras.main.shake(250, 0.02);

      // Sonic boom expanding ring
      const shockwave = this.add.circle(width / 2, height / 2, 20, 0x00d2ff, 0.8);
      this.tweens.add({
        targets: shockwave,
        radius: 400,
        alpha: 0,
        duration: 500,
        ease: 'Quad.easeOut',
        onComplete: () => shockwave.destroy(),
      });
    });

    // 2. Logo Reveal Container
    const logoContainer = this.add.container(width / 2, height / 2 - 20);
    logoContainer.setAlpha(0);

    // Emblem Badge Wings
    const badgeGlow = this.add.graphics();
    badgeGlow.lineStyle(2, 0x00d2ff, 0.6);
    badgeGlow.strokeRoundedRect(-140, -50, 280, 100, 12);
    badgeGlow.lineStyle(1, 0xffd200, 0.4);
    badgeGlow.strokeRoundedRect(-146, -56, 292, 112, 16);
    logoContainer.add(badgeGlow);

    // Tagline: "CREATIVE STUDIOS" / "PRESENTS"
    const topTag = this.add.text(0, -32, '◆  A B D U L L A H 0 9 C  ◆', {
      fontFamily: 'Orbitron, sans-serif',
      fontSize: '12px',
      color: '#00d2ff',
    }).setOrigin(0.5, 0.5);
    logoContainer.add(topTag);

    // Main Logo Text: "abdullah09c"
    const mainLogo = this.add.text(0, 0, 'abdullah09c', {
      fontFamily: 'Orbitron, sans-serif',
      fontSize: '34px',
      fontStyle: 'bold',
      color: '#ffffff',
    }).setOrigin(0.5, 0.5);
    logoContainer.add(mainLogo);

    // Subtitle: "PRESENTS"
    const subText = this.add.text(0, 32, 'P R E S E N T S', {
      fontFamily: 'Rajdhani, sans-serif',
      fontSize: '14px',
      color: '#ffd200',
      letterSpacing: 6,
    }).setOrigin(0.5, 0.5);
    logoContainer.add(subText);

    // Reveal logo with scale and glow
    this.time.delayedCall(400, () => {
      this.tweens.add({
        targets: logoContainer,
        alpha: 1,
        scaleX: { from: 0.8, to: 1 },
        scaleY: { from: 0.8, to: 1 },
        duration: 600,
        ease: 'Back.easeOut',
      });
    });

    // Glint animation across text
    const glint = this.add.circle(width / 2 - 120, height / 2 - 20, 4, 0xffffff, 0.9);
    glint.setAlpha(0);
    this.time.delayedCall(850, () => {
      this.audio.play('star', 1.5);
      glint.setAlpha(1);
      this.tweens.add({
        targets: glint,
        x: width / 2 + 120,
        alpha: 0,
        duration: 700,
        ease: 'Sine.easeInOut',
        onComplete: () => glint.destroy(),
      });
    });

    // Skip prompt at bottom
    const skipText = this.add.text(width / 2, height - 60, 'SPACE or TAP to skip', {
      fontFamily: 'Rajdhani, sans-serif',
      fontSize: '12px',
      color: '#667799',
    }).setOrigin(0.5, 0.5);
    skipText.setAlpha(0);

    this.time.delayedCall(700, () => {
      this.tweens.add({
        targets: skipText,
        alpha: 0.7,
        duration: 400,
      });
    });

    // 3. Auto-finish after 2.6 seconds
    this.timerEvent = this.time.delayedCall(2600, () => {
      this.finishIntro();
    });
  }

  private finishIntro(): void {
    if (this.hasSkipped) return;
    this.hasSkipped = true;

    if (this.timerEvent) {
      this.timerEvent.destroy();
    }

    // Fade camera out smoothly
    this.cameras.main.fade(300, 8, 13, 26);
    this.time.delayedCall(300, () => {
      // Notify main.ts to show Main Menu and transition to idle GameScene
      this.game.events.emit('ui:intro-finished');
      this.scene.start('GameScene', { stageId: 1, pausedForMenu: true });
    });
  }
}
