import Phaser from 'phaser';
import { AudioManager } from '../audio/AudioManager';

export type EnemyType =
  | 'scout'
  | 'interceptor'
  | 'chopper'
  | 'turret'
  | 'tank'
  | 'boss1'
  | 'boss2';

export interface EnemyBullet {
  sprite: Phaser.GameObjects.Sprite;
  vx: number;
  vy: number;
  damage: number;
}

export class Enemy extends Phaser.GameObjects.Container {
  public enemyType: EnemyType;
  public maxHealth: number;
  public health: number;
  public scoreValue: number;
  public isBoss: boolean = false;
  public isDead: boolean = false;

  private sprite: Phaser.GameObjects.Sprite;
  private audio: AudioManager;
  private shootTimer: number = 0;
  private phase: number = 1;
  private timeAlive: number = 0;
  private initialX: number;

  constructor(scene: Phaser.Scene, x: number, y: number, enemyType: EnemyType) {
    super(scene, x, y);
    this.initialX = x;
    this.enemyType = enemyType;
    this.audio = AudioManager.getInstance();

    let spriteKey = 'enemy_scout';
    let scale = 0.8;
    this.maxHealth = 25;
    this.scoreValue = 100;

    switch (enemyType) {
      case 'scout':
        spriteKey = 'enemy_scout';
        this.maxHealth = 25;
        this.scoreValue = 100;
        scale = 0.75;
        break;
      case 'interceptor':
        spriteKey = 'enemy_interceptor';
        this.maxHealth = 40;
        this.scoreValue = 180;
        scale = 0.8;
        break;
      case 'chopper':
        spriteKey = 'enemy_chopper';
        this.maxHealth = 90;
        this.scoreValue = 350;
        scale = 0.9;
        break;
      case 'turret':
        spriteKey = 'turret';
        this.maxHealth = 60;
        this.scoreValue = 200;
        scale = 0.75;
        break;
      case 'tank':
        spriteKey = 'tank';
        this.maxHealth = 80;
        this.scoreValue = 300;
        scale = 0.8;
        break;
      case 'boss1':
        spriteKey = 'boss1';
        this.maxHealth = 1200;
        this.scoreValue = 5000;
        scale = 1.6;
        this.isBoss = true;
        break;
      case 'boss2':
        spriteKey = 'boss2';
        this.maxHealth = 1800;
        this.scoreValue = 8000;
        scale = 1.7;
        this.isBoss = true;
        break;
    }

    this.health = this.maxHealth;
    this.sprite = scene.add.sprite(0, 0, spriteKey).setOrigin(0.5, 0.5);
    this.sprite.setScale(scale);
    this.add(this.sprite);

    scene.add.existing(this);
  }

  public updateEnemy(
    deltaSeconds: number,
    playerX: number,
    playerY: number,
    spawnBullet: (bullet: EnemyBullet) => void
  ): void {
    if (this.isDead) return;
    this.timeAlive += deltaSeconds;
    this.shootTimer += deltaSeconds;

    switch (this.enemyType) {
      case 'scout':
        // Fast straight swoop
        this.y += 180 * deltaSeconds;
        if (this.shootTimer > 1.8) {
          this.shootTimer = 0;
          this.fireAtPlayer(playerX, playerY, 260, 10, 'laser_enemy', spawnBullet);
        }
        break;

      case 'interceptor':
        // Sine wave swoop
        this.y += 150 * deltaSeconds;
        this.x = this.initialX + Math.sin(this.timeAlive * 3) * 60;
        if (this.shootTimer > 1.4) {
          this.shootTimer = 0;
          this.fireAtPlayer(playerX, playerY, 300, 12, 'laser_enemy', spawnBullet);
        }
        break;

      case 'chopper':
        // Hovers down slowly, stops mid-screen, then continues
        if (this.y < 220) {
          this.y += 100 * deltaSeconds;
        } else if (this.timeAlive > 7) {
          this.y += 120 * deltaSeconds;
        }
        this.x = this.initialX + Math.sin(this.timeAlive * 1.5) * 40;

        if (this.shootTimer > 2.0) {
          this.shootTimer = 0;
          // 3-bullet fan spread
          this.fireFan(playerX, playerY, 3, 0.35, 240, 15, 'bullet_heavy', spawnBullet);
        }
        break;

      case 'turret':
        // Stationary ground unit, tracks player angle
        this.y += 50 * deltaSeconds; // Scrolls down with ground
        const angle = Phaser.Math.Angle.Between(this.x, this.y, playerX, playerY);
        this.sprite.rotation = angle + Math.PI / 2;

        if (this.shootTimer > 2.2) {
          this.shootTimer = 0;
          this.fireAtPlayer(playerX, playerY, 280, 15, 'bullet_heavy', spawnBullet);
        }
        break;

      case 'tank':
        // Ground patrol
        this.y += 55 * deltaSeconds;
        this.x = this.initialX + Math.sin(this.timeAlive * 0.8) * 70;
        if (this.shootTimer > 2.5) {
          this.shootTimer = 0;
          this.fireAtPlayer(playerX, playerY, 260, 20, 'bullet_heavy', spawnBullet);
        }
        break;

      case 'boss1':
        this.updateBoss1(deltaSeconds, playerX, playerY, spawnBullet);
        break;

      case 'boss2':
        this.updateBoss2(deltaSeconds, playerX, playerY, spawnBullet);
        break;
    }
  }

  private updateBoss1(
    dt: number,
    pX: number,
    pY: number,
    spawnBullet: (b: EnemyBullet) => void
  ): void {
    // Stage 1 Boss: Heavy Gunship
    if (this.y < 160) {
      this.y += 60 * dt;
      return;
    }

    // Sway horizontally
    this.x = this.initialX + Math.sin(this.timeAlive * 1.2) * 110;

    // Phase transition at 50% HP
    if (this.health < this.maxHealth * 0.5 && this.phase === 1) {
      this.phase = 2;
      this.audio.play('boss');
      // Visual damage smoke / flash
      this.sprite.setTint(0xff9900);
    }

    if (this.phase === 1) {
      // Dual Gatling bursts
      if (this.shootTimer > 0.45) {
        this.shootTimer = 0;
        this.fireBullet(this.x - 35, this.y + 30, 0, 360, 15, 'bullet_heavy', spawnBullet);
        this.fireBullet(this.x + 35, this.y + 30, 0, 360, 15, 'bullet_heavy', spawnBullet);
      }
    } else {
      // Phase 2: Rotating missile barrages and 5-way fan spread
      if (this.shootTimer > 0.8) {
        this.shootTimer = 0;
        this.fireFan(pX, pY, 5, 0.5, 280, 18, 'bullet_heavy', spawnBullet);
      }
    }
  }

  private updateBoss2(
    dt: number,
    pX: number,
    pY: number,
    spawnBullet: (b: EnemyBullet) => void
  ): void {
    // Stage 2 Boss: Fortress Tank
    if (this.y < 170) {
      this.y += 50 * dt;
      return;
    }

    this.x = this.initialX + Math.sin(this.timeAlive * 0.7) * 90;

    if (this.health < this.maxHealth * 0.45 && this.phase === 1) {
      this.phase = 2;
      this.audio.play('boss');
      this.sprite.setTint(0xff3333);
    }

    if (this.phase === 1) {
      // Front shields + Mortar aimed shell bursts
      if (this.shootTimer > 1.2) {
        this.shootTimer = 0;
        this.fireFan(pX, pY, 3, 0.4, 250, 20, 'bullet_heavy', spawnBullet);
      }
    } else {
      // Phase 2: Ring bullet hell
      if (this.shootTimer > 0.9) {
        this.shootTimer = 0;
        this.fireRing(8, 220, 15, 'bullet_heavy', spawnBullet);
      }
    }
  }

  private fireBullet(
    x: number,
    y: number,
    vx: number,
    vy: number,
    damage: number,
    spriteKey: string,
    spawnBullet: (b: EnemyBullet) => void
  ): void {
    const s = this.scene.add.sprite(x, y, spriteKey).setOrigin(0.5, 0.5);
    s.setScale(0.8);
    spawnBullet({ sprite: s, vx, vy, damage });
  }

  private fireAtPlayer(
    pX: number,
    pY: number,
    speed: number,
    damage: number,
    spriteKey: string,
    spawnBullet: (b: EnemyBullet) => void
  ): void {
    const angle = Phaser.Math.Angle.Between(this.x, this.y, pX, pY);
    const vx = Math.cos(angle) * speed;
    const vy = Math.sin(angle) * speed;
    this.fireBullet(this.x, this.y + 15, vx, vy, damage, spriteKey, spawnBullet);
  }

  private fireFan(
    pX: number,
    pY: number,
    count: number,
    spreadArc: number,
    speed: number,
    damage: number,
    spriteKey: string,
    spawnBullet: (b: EnemyBullet) => void
  ): void {
    const baseAngle = Phaser.Math.Angle.Between(this.x, this.y, pX, pY);
    const startAngle = baseAngle - spreadArc / 2;
    const step = spreadArc / (count - 1);

    for (let i = 0; i < count; i++) {
      const a = startAngle + i * step;
      const vx = Math.cos(a) * speed;
      const vy = Math.sin(a) * speed;
      this.fireBullet(this.x, this.y + 20, vx, vy, damage, spriteKey, spawnBullet);
    }
  }

  private fireRing(
    count: number,
    speed: number,
    damage: number,
    spriteKey: string,
    spawnBullet: (b: EnemyBullet) => void
  ): void {
    const step = (Math.PI * 2) / count;
    for (let i = 0; i < count; i++) {
      const a = i * step + this.timeAlive;
      const vx = Math.cos(a) * speed;
      const vy = Math.sin(a) * speed;
      this.fireBullet(this.x, this.y, vx, vy, damage, spriteKey, spawnBullet);
    }
  }

  public takeDamage(amount: number): boolean {
    this.health -= amount;

    // Hit flash
    this.sprite.setTint(0xffffff);
    this.scene.time.delayedCall(70, () => {
      if (!this.isDead) {
        if (this.phase === 2) {
          this.sprite.setTint(this.enemyType === 'boss1' ? 0xff9900 : 0xff3333);
        } else {
          this.sprite.clearTint();
        }
      }
    });

    if (this.health <= 0) {
      this.isDead = true;
      return true;
    }
    return false;
  }
}
