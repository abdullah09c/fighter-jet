import Phaser from 'phaser';
import { GameStore } from '../state/GameStore';
import { AudioManager } from '../audio/AudioManager';

export interface LaserProjectile {
  sprite: Phaser.GameObjects.Sprite;
  vx: number;
  vy: number;
  damage: number;
  isPlayer: boolean;
  piercing?: boolean;
}

export interface MissileProjectile {
  sprite: Phaser.GameObjects.Sprite;
  vx: number;
  vy: number;
  target?: Phaser.GameObjects.Sprite | null;
  damage: number;
  lifeTime: number;
}

export class Player extends Phaser.GameObjects.Container {
  public shipSprite: Phaser.GameObjects.Sprite;
  private flameSprite: Phaser.GameObjects.Sprite;
  private shieldAura: Phaser.GameObjects.Sprite;
  private laserBeamSprite: Phaser.GameObjects.Sprite | null = null;

  public maxHealth: number = 100;
  public health: number = 100;
  public isInvulnerable: boolean = false;
  public hasShield: boolean = false;
  public isFiringBeam: boolean = false;
  public isUntouched: boolean = true;

  private speed: number = 420;
  private lastFired: number = 0;
  private lastMissileFired: number = 0;
  private beamTimer: number = 0;
  private shieldTimer: number = 0;
  private invulnTimer: number = 0;

  private store: GameStore;
  private audio: AudioManager;

  // Active projectiles pools managed by GameScene
  public lasers: LaserProjectile[] = [];
  public missiles: MissileProjectile[] = [];

  constructor(scene: Phaser.Scene, x: number, y: number) {
    super(scene, x, y);

    this.store = GameStore.getInstance();
    this.audio = AudioManager.getInstance();

    const upgrades = this.store.getState().upgrades;

    // Pick sprite based on hull armor level
    const spriteKey =
      upgrades.healthArmorLevel >= 7
        ? 'player_heavy'
        : upgrades.healthArmorLevel >= 4
        ? 'player_upgraded'
        : 'player';

    // Ship body
    this.shipSprite = scene.add.sprite(0, 0, spriteKey).setOrigin(0.5, 0.5);
    this.shipSprite.setScale(0.85);

    // Thruster flame
    this.flameSprite = scene.add.sprite(0, 36, 'flame').setOrigin(0.5, 0);
    this.flameSprite.setScale(0.8);

    // Shield aura (hidden by default)
    this.shieldAura = scene.add.sprite(0, 0, 'shield_aura').setOrigin(0.5, 0.5);
    this.shieldAura.setScale(1.15);
    this.shieldAura.setAlpha(0);

    this.add(this.flameSprite);
    this.add(this.shipSprite);
    this.add(this.shieldAura);

    // Flame flicker animation
    scene.tweens.add({
      targets: this.flameSprite,
      scaleY: 1.1,
      scaleX: 0.9,
      alpha: 0.7,
      duration: 80,
      yoyo: true,
      repeat: -1,
    });

    this.applyUpgrades();
    scene.add.existing(this);
  }

  public applyUpgrades(): void {
    const upgrades = this.store.getState().upgrades;
    this.maxHealth = 100 + upgrades.healthArmorLevel * 25;
    this.health = this.maxHealth;
  }

  public updatePlayer(
    time: number,
    delta: number,
    keys: {
      left: boolean;
      right: boolean;
      up: boolean;
      down: boolean;
      fire: boolean;
    },
    targetPos?: { x: number; y: number } | null
  ): void {
    const dt = delta / 1000;
    const viewW = this.scene.cameras.main.width;
    const viewH = this.scene.cameras.main.height;

    let moveX = 0;
    let moveY = 0;

    // Keyboard input
    if (keys.left) moveX -= 1;
    if (keys.right) moveX += 1;
    if (keys.up) moveY -= 1;
    if (keys.down) moveY += 1;

    let bankFactor = 0;

    // Pointer touch / mouse dragging (relative follow)
    if (targetPos) {
      const prevX = this.x;
      this.x = Phaser.Math.Linear(this.x, targetPos.x, 0.45);
      this.y = Phaser.Math.Linear(this.y, targetPos.y, 0.45);
      bankFactor = (this.x - prevX) / 3;
    } else {
      // Keyboard input
      this.x += moveX * this.speed * dt;
      this.y += moveY * this.speed * dt;
      bankFactor = moveX;
    }

    // Viewport clamping
    const pad = 35;
    this.x = Phaser.Math.Clamp(this.x, pad, viewW - pad);
    this.y = Phaser.Math.Clamp(this.y, pad, viewH - pad);

    // Roll banking animation
    const targetAngle = Phaser.Math.Clamp(bankFactor * 10, -18, 18);
    this.shipSprite.angle = Phaser.Math.Linear(this.shipSprite.angle, targetAngle, 0.2);

    // Shield timer
    if (this.hasShield) {
      this.shieldTimer -= dt;
      this.shieldAura.angle += 3;
      if (this.shieldTimer <= 0) {
        this.deactivateShield();
      }
    }

    // Invulnerability flashing
    if (this.isInvulnerable && !this.hasShield) {
      this.invulnTimer -= dt;
      this.alpha = Math.floor(time / 80) % 2 === 0 ? 0.3 : 1;
      if (this.invulnTimer <= 0) {
        this.isInvulnerable = false;
        this.alpha = 1;
      }
    }

    // Laser beam active handling
    if (this.isFiringBeam) {
      this.beamTimer -= dt;
      if (this.laserBeamSprite) {
        this.laserBeamSprite.setPosition(this.x, this.y - 320);
      }
      if (this.beamTimer <= 0) {
        this.stopLaserBeam();
      }
    }

    // Firing Primary Cannons
    const upgrades = this.store.getState().upgrades;
    const fireInterval = Math.max(110, 240 - upgrades.mainCannonLevel * 12);

    if (keys.fire && time > this.lastFired) {
      this.fireWeapons();
      this.lastFired = time + fireInterval;
    }

    // Auto Homing Missiles
    if (upgrades.missileLauncherLevel > 0) {
      const missileInterval = Math.max(1200, 3000 - upgrades.missileLauncherLevel * 350);
      if (time > this.lastMissileFired) {
        this.fireMissile();
        this.lastMissileFired = time + missileInterval;
      }
    }
  }

  private fireWeapons(): void {
    const upgrades = this.store.getState().upgrades;
    const damage = 12 + upgrades.mainCannonLevel * 6;

    this.audio.play('laser1', 1.0 + Math.random() * 0.1);

    // Primary Cannon (single or dual)
    if (upgrades.mainCannonLevel >= 5) {
      this.spawnLaser(this.x - 14, this.y - 20, 0, -850, damage, 'laser_player');
      this.spawnLaser(this.x + 14, this.y - 20, 0, -850, damage, 'laser_player');
    } else {
      this.spawnLaser(this.x, this.y - 24, 0, -800, damage, 'laser_player');
    }

    // Wing Cannons
    if (upgrades.wingCannonsLevel > 0) {
      const wingDmg = 8 + upgrades.wingCannonsLevel * 4;
      this.spawnLaser(this.x - 28, this.y - 5, -120, -750, wingDmg, 'laser_wing');
      this.spawnLaser(this.x + 28, this.y - 5, 120, -750, wingDmg, 'laser_wing');

      if (upgrades.wingCannonsLevel >= 6) {
        this.spawnLaser(this.x - 34, this.y, -240, -700, wingDmg, 'laser_wing');
        this.spawnLaser(this.x + 34, this.y, 240, -700, wingDmg, 'laser_wing');
      }
    }
  }

  private spawnLaser(
    x: number,
    y: number,
    vx: number,
    vy: number,
    damage: number,
    spriteKey: string
  ): void {
    const laser = this.scene.add.sprite(x, y, spriteKey).setOrigin(0.5, 0.5);
    laser.setScale(0.8);
    this.lasers.push({
      sprite: laser,
      vx,
      vy,
      damage,
      isPlayer: true,
    });
  }

  private fireMissile(): void {
    this.audio.play('laser3', 0.9);
    const missile = this.scene.add.sprite(this.x, this.y, 'missile').setOrigin(0.5, 0.5);
    missile.setScale(0.85);

    this.missiles.push({
      sprite: missile,
      vx: (Math.random() - 0.5) * 80,
      vy: -400,
      damage: 45 + this.store.getState().upgrades.missileLauncherLevel * 20,
      lifeTime: 3.5,
    });
  }

  // --- Consumable Abilities ---

  public activateLaserBeam(): boolean {
    if (this.isFiringBeam) return false;
    if (!this.store.consumeAbility('laser')) return false;

    this.isFiringBeam = true;
    this.beamTimer = 3.5;
    this.audio.play('laser2', 0.8);

    this.laserBeamSprite = this.scene.add
      .sprite(this.x, this.y - 320, 'laser_beam')
      .setOrigin(0.5, 0.5);
    this.laserBeamSprite.setScale(2.5, 14);
    this.laserBeamSprite.setAlpha(0.9);
    this.laserBeamSprite.setTint(0x00d2ff);

    this.scene.tweens.add({
      targets: this.laserBeamSprite,
      alpha: 0.6,
      scaleX: 2.8,
      duration: 100,
      yoyo: true,
      repeat: -1,
    });

    return true;
  }

  private stopLaserBeam(): void {
    this.isFiringBeam = false;
    if (this.laserBeamSprite) {
      this.laserBeamSprite.destroy();
      this.laserBeamSprite = null;
    }
  }

  public activateEnergyShield(): boolean {
    if (this.hasShield) return false;
    if (!this.store.consumeAbility('shield')) return false;

    this.hasShield = true;
    this.isInvulnerable = true;
    this.shieldTimer = 6.0;
    this.shieldAura.setAlpha(0.85);
    this.audio.play('shield');

    this.scene.tweens.add({
      targets: this.shieldAura,
      alpha: 0.5,
      scaleX: 1.25,
      scaleY: 1.25,
      duration: 300,
      yoyo: true,
      repeat: -1,
    });

    return true;
  }

  private deactivateShield(): void {
    this.hasShield = false;
    this.isInvulnerable = false;
    this.shieldAura.setAlpha(0);
  }

  public takeDamage(amount: number): boolean {
    if (this.isInvulnerable || this.hasShield) return false;

    this.isUntouched = false;
    this.health = Math.max(0, this.health - amount);
    this.isInvulnerable = true;
    this.invulnTimer = 0.8;

    this.audio.play('hit');
    this.scene.cameras.main.shake(200, 0.015);

    // Directional red flash
    this.shipSprite.setTint(0xff3366);
    this.scene.time.delayedCall(120, () => {
      this.shipSprite.clearTint();
    });

    return this.health <= 0;
  }

  public heal(amount: number): void {
    this.health = Math.min(this.maxHealth, this.health + amount);
    this.audio.play('powerup');
  }

  public getMagnetRadius(): number {
    const level = this.store.getState().upgrades.magnetRadiusLevel;
    return 70 + level * 50;
  }

  public destroyPlayer(onComplete: () => void): void {
    this.audio.play('explosion');
    const boom = this.scene.add.sprite(this.x, this.y, 'explosion1').setScale(1.8);
    boom.play('explode');
    boom.once('animationcomplete', () => {
      boom.destroy();
      onComplete();
    });
    this.destroy();
  }
}
