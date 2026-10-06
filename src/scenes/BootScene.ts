import Phaser from 'phaser';

export class BootScene extends Phaser.Scene {
  constructor() {
    super('BootScene');
  }

  preload(): void {
    const width = this.cameras.main.width;
    const height = this.cameras.main.height;

    // Loading display in canvas
    const progressBar = this.add.graphics();
    const progressBox = this.add.graphics();
    progressBox.fillStyle(0x10192e, 0.8);
    progressBox.fillRoundedRect(width / 2 - 160, height / 2 - 25, 320, 50, 10);

    const loadingText = this.add.text(width / 2, height / 2 - 50, 'INITIALIZING FIGHTER SYSTEMS...', {
      fontFamily: 'Orbitron, sans-serif',
      fontSize: '18px',
      color: '#00d2ff',
    }).setOrigin(0.5, 0.5);

    const percentText = this.add.text(width / 2, height / 2, '0%', {
      fontFamily: 'Rajdhani, sans-serif',
      fontSize: '20px',
      color: '#ffffff',
    }).setOrigin(0.5, 0.5);

    this.load.on('progress', (value: number) => {
      percentText.setText(Math.floor(value * 100) + '%');
      progressBar.clear();
      progressBar.fillStyle(0x00d2ff, 1);
      progressBar.fillRoundedRect(width / 2 - 150, height / 2 - 15, 300 * value, 30, 6);
    });

    this.load.on('complete', () => {
      progressBar.destroy();
      progressBox.destroy();
      loadingText.destroy();
      percentText.destroy();
    });

    // 1. Player ships
    this.load.image('player', '/assets/sprites/player.png');
    this.load.image('player_upgraded', '/assets/sprites/player_upgraded.png');
    this.load.image('player_heavy', '/assets/sprites/player_heavy.png');

    // 2. Enemies
    this.load.image('enemy_scout', '/assets/sprites/enemy_scout.png');
    this.load.image('enemy_interceptor', '/assets/sprites/enemy_interceptor.png');
    this.load.image('enemy_chopper', '/assets/sprites/enemy_chopper.png');
    this.load.image('enemy_heavy', '/assets/sprites/enemy_heavy.png');
    this.load.image('boss1', '/assets/sprites/boss1.png');
    this.load.image('boss2', '/assets/sprites/boss2.png');
    this.load.image('turret', '/assets/sprites/turret.png');
    this.load.image('tank', '/assets/sprites/tank.png');

    // 3. Projectiles
    this.load.image('laser_player', '/assets/sprites/laser_player.png');
    this.load.image('laser_wing', '/assets/sprites/laser_wing.png');
    this.load.image('laser_enemy', '/assets/sprites/laser_enemy.png');
    this.load.image('bullet_heavy', '/assets/sprites/bullet_heavy.png');
    this.load.image('missile', '/assets/sprites/missile.png');
    this.load.image('laser_beam', '/assets/sprites/laser_beam.png');

    // 4. Collectibles & Items
    this.load.image('star', '/assets/sprites/star.png');
    this.load.image('star_silver', '/assets/sprites/star_silver.png');
    this.load.image('item_shield', '/assets/sprites/item_shield.png');
    this.load.image('item_bomb', '/assets/sprites/item_bomb.png');
    this.load.image('item_laser', '/assets/sprites/item_laser.png');
    this.load.image('item_heal', '/assets/sprites/item_heal.png');
    this.load.image('item_magnet', '/assets/sprites/item_magnet.png');

    // 5. Effects & Animations
    this.load.image('shield_aura', '/assets/sprites/shield_aura.png');
    this.load.image('flame', '/assets/sprites/flame.png');
    this.load.image('explosion1', '/assets/sprites/explosion1.png');
    this.load.image('explosion2', '/assets/sprites/explosion2.png');
    this.load.image('explosion3', '/assets/sprites/explosion3.png');
    this.load.image('explosion4', '/assets/sprites/explosion4.png');
    this.load.image('explosion5', '/assets/sprites/explosion5.png');

    // 6. SVGs (Survivor + Cloud)
    this.load.svg('survivor', '/assets/sprites/survivor.svg', { width: 48, height: 48 });
    this.load.svg('cloud', '/assets/sprites/cloud.svg', { width: 220, height: 110 });

    // 7. Backgrounds
    this.load.image('water_bg', '/assets/backgrounds/water_bg.png');
    this.load.image('space_bg', '/assets/backgrounds/space_bg.png');
    this.load.image('deep_bg', '/assets/backgrounds/deep_bg.png');
  }

  create(): void {
    // Generate explosion animation
    this.anims.create({
      key: 'explode',
      frames: [
        { key: 'explosion1' },
        { key: 'explosion2' },
        { key: 'explosion3' },
        { key: 'explosion4' },
        { key: 'explosion5' },
      ],
      frameRate: 20,
      hideOnComplete: true,
    });

    // Transition to startup logo intro
    this.scene.start('IntroScene');
  }
}
