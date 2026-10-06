import Phaser from 'phaser';
import { AudioManager } from '../audio/AudioManager';

export type EnemyType =
  | 'scout'
  | 'interceptor'
  | 'chopper'
  | 'turret'
  | 'tank'
  | 'rear_interceptor'
  | 'flanker_left'
  | 'flanker_right'
  | 'miniboss'
  | 'boss1'
  | 'boss2'
  | 'boss3'
  | 'boss4';

export interface EnemyBullet {
  sprite: Phaser.GameObjects.Sprite;
  vx: number;
  vy: number;
  damage: number;
  isHoming?: boolean;
  homingTimer?: number;
  isMortar?: boolean;
  mortarTargetY?: number;
}

export class Enemy extends Phaser.GameObjects.Container {
  public enemyType: EnemyType;
  public maxHealth: number;
  public health: number;
  public scoreValue: number;
  public isBoss: boolean = false;
  public isDead: boolean = false;

  // Boss 2 Shield State
  public isShieldActive: boolean = false;
  private shieldSprite?: Phaser.GameObjects.Sprite;
  private shieldCycleTimer: number = 0;

  // Boss 3 Cloaking State
  public isCloaked: boolean = false;
  private cloakTimer: number = 0;

  // Boss 4 Multi-part Citadel State
  public leftWingAlive: boolean = true;
  public rightWingAlive: boolean = true;
  public leftWingHp: number = 900;
  public rightWingHp: number = 900;
  private leftTurretSprite?: Phaser.GameObjects.Sprite;
  private rightTurretSprite?: Phaser.GameObjects.Sprite;
  private coreGlow?: Phaser.GameObjects.Arc;
  private orbitalChargeTimer: number = 0;
  private orbitalWarningLine?: Phaser.GameObjects.Graphics;

  private sprite: Phaser.GameObjects.Sprite;
  private audio: AudioManager;
  private shootTimer: number = 0;
  private phase: number = 1;
  private timeAlive: number = 0;
  private initialX: number;
  private initialY: number;

  constructor(scene: Phaser.Scene, x: number, y: number, enemyType: EnemyType) {
    super(scene, x, y);
    this.initialX = x;
    this.initialY = y;
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
        this.maxHealth = 85;
        this.scoreValue = 300;
        scale = 0.8;
        break;
      case 'rear_interceptor':
        spriteKey = 'enemy_interceptor';
        this.maxHealth = 50;
        this.scoreValue = 250;
        scale = 0.85;
        break;
      case 'flanker_left':
      case 'flanker_right':
        spriteKey = 'enemy_scout';
        this.maxHealth = 40;
        this.scoreValue = 220;
        scale = 0.8;
        break;
      case 'miniboss':
        spriteKey = 'enemy_heavy';
        this.maxHealth = 500;
        this.scoreValue = 1800;
        scale = 1.35;
        break;
      case 'boss1':
        spriteKey = 'boss1';
        this.maxHealth = 1500;
        this.scoreValue = 5000;
        scale = 1.6;
        this.isBoss = true;
        break;
      case 'boss2':
        spriteKey = 'boss2';
        this.maxHealth = 2200;
        this.scoreValue = 8000;
        scale = 1.75;
        this.isBoss = true;
        break;
      case 'boss3':
        spriteKey = 'boss3';
        this.maxHealth = 2800;
        this.scoreValue = 12000;
        scale = 1.9;
        this.isBoss = true;
        break;
      case 'boss4':
        spriteKey = 'boss4';
        this.maxHealth = 3800;
        this.scoreValue = 20000;
        scale = 2.1;
        this.isBoss = true;
        break;
    }

    this.health = this.maxHealth;
    this.sprite = scene.add.sprite(0, 0, spriteKey).setOrigin(0.5, 0.5);
    this.sprite.setScale(scale);

    // Visual customizations for unique looks
    if (enemyType === 'boss3') {
      // Stealth Dreadnought: sleek obsidian violet
      this.sprite.setTint(0xaa44ff);
    } else if (enemyType === 'boss4') {
      // Citadel Mothership: menacing dark crimson
      this.sprite.setTint(0xff3344);
    } else if (enemyType === 'miniboss') {
      this.sprite.setTint(0xffaa22);
    } else if (enemyType === 'rear_interceptor') {
      this.sprite.setTint(0xff4444);
      this.sprite.rotation = Math.PI; // Face upward
    } else if (enemyType === 'flanker_left') {
      this.sprite.setTint(0x44ddff);
      this.sprite.rotation = -Math.PI / 4;
    } else if (enemyType === 'flanker_right') {
      this.sprite.setTint(0x44ddff);
      this.sprite.rotation = Math.PI / 4;
    }

    this.add(this.sprite);

    // Boss 2: Deflective Energy Shield setup
    if (enemyType === 'boss2') {
      this.shieldSprite = scene.add.sprite(0, 35, 'shield_aura').setOrigin(0.5, 0.5);
      this.shieldSprite.setScale(1.7, 0.7);
      this.shieldSprite.setTint(0x00d2ff);
      this.shieldSprite.setAlpha(0);
      this.add(this.shieldSprite);
    }

    // Boss 4: Citadel Turret Modules setup
    if (enemyType === 'boss4') {
      // Left Wing Turret
      this.leftTurretSprite = scene.add.sprite(-72, -10, 'turret').setOrigin(0.5, 0.5).setScale(0.85);
      this.leftTurretSprite.setTint(0xff7777);
      this.add(this.leftTurretSprite);

      // Right Wing Turret
      this.rightTurretSprite = scene.add.sprite(72, -10, 'turret').setOrigin(0.5, 0.5).setScale(0.85);
      this.rightTurretSprite.setTint(0xff7777);
      this.add(this.rightTurretSprite);

      // Core Reactor
      this.coreGlow = scene.add.circle(0, 10, 14, 0xff0044, 0.85);
      this.add(this.coreGlow);

      this.orbitalWarningLine = scene.add.graphics();
    }

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
        this.y += 180 * deltaSeconds;
        if (this.shootTimer > 1.8) {
          this.shootTimer = 0;
          this.fireAtPlayer(playerX, playerY, 260, 10, 'laser_enemy', spawnBullet);
        }
        break;

      case 'interceptor':
        this.y += 150 * deltaSeconds;
        this.x = this.initialX + Math.sin(this.timeAlive * 3) * 60;
        if (this.shootTimer > 1.4) {
          this.shootTimer = 0;
          this.fireAtPlayer(playerX, playerY, 300, 12, 'laser_enemy', spawnBullet);
        }
        break;

      case 'rear_interceptor':
        // Surprise Ambush: rockets UP from screen bottom
        this.y -= 280 * deltaSeconds;
        this.x = this.initialX + Math.sin(this.timeAlive * 4) * 45;
        if (this.shootTimer > 0.9) {
          this.shootTimer = 0;
          // Fires twin red bolts forward (upward)
          this.fireBullet(this.x - 12, this.y - 15, 0, -380, 15, 'laser_enemy', spawnBullet);
          this.fireBullet(this.x + 12, this.y - 15, 0, -380, 15, 'laser_enemy', spawnBullet);
        }
        break;

      case 'flanker_left':
        // Surprise Flank: crosses left to right
        this.x += 220 * deltaSeconds;
        this.y += 45 * deltaSeconds;
        if (this.shootTimer > 1.1) {
          this.shootTimer = 0;
          this.fireFan(playerX, playerY, 2, 0.3, 260, 12, 'laser_enemy', spawnBullet);
        }
        break;

      case 'flanker_right':
        // Surprise Flank: crosses right to left
        this.x -= 220 * deltaSeconds;
        this.y += 45 * deltaSeconds;
        if (this.shootTimer > 1.1) {
          this.shootTimer = 0;
          this.fireFan(playerX, playerY, 2, 0.3, 260, 12, 'laser_enemy', spawnBullet);
        }
        break;

      case 'miniboss':
        // Elite gunship: moves down to top third, hovers
        if (this.y < 160) {
          this.y += 100 * deltaSeconds;
        }
        this.x = this.initialX + Math.sin(this.timeAlive * 1.5) * 80;
        if (this.shootTimer > 1.5) {
          this.shootTimer = 0;
          this.fireFan(playerX, playerY, 4, 0.45, 270, 16, 'bullet_heavy', spawnBullet);
          // Homing seeker
          this.fireHomingOrb(playerX, playerY, 220, 18, spawnBullet);
        }
        break;

      case 'chopper':
        if (this.y < 220) {
          this.y += 100 * deltaSeconds;
        } else if (this.timeAlive > 7) {
          this.y += 120 * deltaSeconds;
        }
        this.x = this.initialX + Math.sin(this.timeAlive * 1.5) * 40;
        if (this.shootTimer > 2.0) {
          this.shootTimer = 0;
          this.fireFan(playerX, playerY, 3, 0.35, 240, 15, 'bullet_heavy', spawnBullet);
        }
        break;

      case 'turret':
        this.y += 50 * deltaSeconds;
        const angle = Phaser.Math.Angle.Between(this.x, this.y, playerX, playerY);
        this.sprite.rotation = angle + Math.PI / 2;
        if (this.shootTimer > 2.2) {
          this.shootTimer = 0;
          this.fireAtPlayer(playerX, playerY, 280, 15, 'bullet_heavy', spawnBullet);
        }
        break;

      case 'tank':
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

      case 'boss3':
        this.updateBoss3(deltaSeconds, playerX, playerY, spawnBullet);
        break;

      case 'boss4':
        this.updateBoss4(deltaSeconds, playerX, playerY, spawnBullet);
        break;
    }
  }

  // --- Boss 1: Heavy Gunship (Dual Gatling + Missile Barrage + Sweeping Laser) ---
  private updateBoss1(
    dt: number,
    pX: number,
    pY: number,
    spawnBullet: (b: EnemyBullet) => void
  ): void {
    if (this.y < 160) {
      this.y += 60 * dt;
      return;
    }

    this.x = this.initialX + Math.sin(this.timeAlive * 1.2) * 110;

    if (this.health < this.maxHealth * 0.5 && this.phase === 1) {
      this.phase = 2;
      this.audio.play('boss');
      this.sprite.setTint(0xff9900);
    }

    if (this.phase === 1) {
      // Rapid dual Gatling streams
      if (this.shootTimer > 0.35) {
        this.shootTimer = 0;
        this.fireBullet(this.x - 35, this.y + 30, 0, 360, 15, 'bullet_heavy', spawnBullet);
        this.fireBullet(this.x + 35, this.y + 30, 0, 360, 15, 'bullet_heavy', spawnBullet);
      }
    } else {
      // Phase 2: Rotating missile barrage + 5-way spread
      if (this.shootTimer > 0.65) {
        this.shootTimer = 0;
        this.fireFan(pX, pY, 5, 0.5, 300, 18, 'bullet_heavy', spawnBullet);
        this.fireBullet(this.x, this.y + 25, Math.sin(this.timeAlive * 4) * 120, 340, 16, 'laser_enemy', spawnBullet);
      }
    }
  }

  // --- Boss 2: Fortress Tank (Deflective Shield + Cluster Mortar + 360° Ring Hell) ---
  private updateBoss2(
    dt: number,
    pX: number,
    pY: number,
    spawnBullet: (b: EnemyBullet) => void
  ): void {
    if (this.y < 170) {
      this.y += 50 * dt;
      return;
    }

    this.x = this.initialX + Math.sin(this.timeAlive * 0.7) * 90;

    // Shield cycle: 3.5s ON, 3.5s OFF
    this.shieldCycleTimer += dt;
    if (this.shieldCycleTimer > 7.0) {
      this.shieldCycleTimer = 0;
    }

    const shouldHaveShield = this.shieldCycleTimer < 3.5;
    if (shouldHaveShield !== this.isShieldActive) {
      this.isShieldActive = shouldHaveShield;
      if (this.shieldSprite) {
        this.scene.tweens.killTweensOf(this.shieldSprite);
        this.scene.tweens.add({
          targets: this.shieldSprite,
          alpha: this.isShieldActive ? 0.9 : 0,
          scaleX: this.isShieldActive ? 1.8 : 1.2,
          duration: 300,
          ease: 'Sine.easeOut',
        });
      }
      if (this.isShieldActive) {
        this.audio.play('shield', 0.9);
      }
    }

    if (this.health < this.maxHealth * 0.45 && this.phase === 1) {
      this.phase = 2;
      this.audio.play('boss');
      this.sprite.setTint(0xff3333);
    }

    if (this.phase === 1) {
      // Cluster Mortar artillery shells
      if (this.shootTimer > 1.3) {
        this.shootTimer = 0;
        this.fireMortar(pX, pY, spawnBullet);
        this.fireFan(pX, pY, 3, 0.35, 260, 18, 'bullet_heavy', spawnBullet);
      }
    } else {
      // Phase 2: Double Spiral bullet hell rings + rapid mortars
      if (this.shootTimer > 0.8) {
        this.shootTimer = 0;
        this.fireRing(10, 230, 15, 'bullet_heavy', spawnBullet);
        this.fireMortar(pX, pY, spawnBullet);
      }
    }
  }

  // --- Boss 3: Stealth Dreadnought (Invisibility Cloak + Homing Plasma Orbs + Crossfire) ---
  private updateBoss3(
    dt: number,
    pX: number,
    pY: number,
    spawnBullet: (b: EnemyBullet) => void
  ): void {
    if (this.y < 165) {
      this.y += 65 * dt;
      return;
    }

    // Active Cloaking Cycle: every 5.5s, cloak for 2.6s and reposition swiftly
    this.cloakTimer += dt;
    if (this.cloakTimer > 5.5) {
      this.cloakTimer = 0;
      this.isCloaked = true;

      // Cloak fade tween
      this.scene.tweens.add({
        targets: this,
        alpha: 0.12,
        duration: 350,
        onComplete: () => {
          // Reposition to surprise flank
          const viewW = this.scene.cameras.main.width;
          const targetX = Phaser.Math.Clamp(pX + (Math.random() < 0.5 ? -140 : 140), 70, viewW - 70);
          this.scene.tweens.add({
            targets: this,
            x: targetX,
            duration: 1600,
            ease: 'Cubic.easeInOut',
            onComplete: () => {
              // Decloak shockwave
              this.isCloaked = false;
              this.scene.tweens.add({
                targets: this,
                alpha: 1.0,
                duration: 300,
              });
              this.audio.play('warning', 1.2);
              // Burst on decloak
              this.fireFan(pX, pY, 6, 0.7, 310, 18, 'bullet_heavy', spawnBullet);
            },
          });
        },
      });
    }

    if (!this.isCloaked) {
      this.x += Math.sin(this.timeAlive * 2.0) * 80 * dt;
    }

    if (this.health < this.maxHealth * 0.5 && this.phase === 1) {
      this.phase = 2;
      this.audio.play('boss');
      this.sprite.setTint(0xdd22ff);
    }

    // Attacks
    if (this.phase === 1) {
      if (this.shootTimer > 1.2 && !this.isCloaked) {
        this.shootTimer = 0;
        // Twin Homing Plasma Seekers
        this.fireHomingOrb(pX, pY, 210, 20, spawnBullet);
        this.fireFan(pX, pY, 4, 0.45, 270, 15, 'laser_enemy', spawnBullet);
      }
    } else {
      // Phase 2: Dual crossfire sweeping beams + Homing Seeker barrage
      if (this.shootTimer > 0.85 && !this.isCloaked) {
        this.shootTimer = 0;
        this.fireHomingOrb(pX, pY, 240, 22, spawnBullet);
        this.fireBullet(this.x - 45, this.y + 20, -120, 320, 18, 'laser_enemy', spawnBullet);
        this.fireBullet(this.x + 45, this.y + 20, 120, 320, 18, 'laser_enemy', spawnBullet);
        this.fireFan(pX, pY, 5, 0.55, 280, 16, 'bullet_heavy', spawnBullet);
      }
    }
  }

  // --- Boss 4: Mothership Citadel (Triple Destructible Modules + Orbital Strike + Ring Storm) ---
  private updateBoss4(
    dt: number,
    pX: number,
    pY: number,
    spawnBullet: (b: EnemyBullet) => void
  ): void {
    if (this.y < 170) {
      this.y += 45 * dt;
      return;
    }

    // Heavy majestic hover
    this.x = this.initialX + Math.sin(this.timeAlive * 0.6) * 100;

    // Core glow pulse
    if (this.coreGlow) {
      this.coreGlow.scale = 1 + Math.sin(this.timeAlive * 6) * 0.25;
    }

    if (this.health < this.maxHealth * 0.45 && this.phase === 1) {
      this.phase = 2;
      this.audio.play('boss');
      this.sprite.setTint(0xff1122);
      this.scene.cameras.main.shake(600, 0.025);
    }

    // 1. Destructible Wing Turret Gatling Attacks (only if modules survive)
    if (this.shootTimer > 0.45) {
      this.shootTimer = 0;
      if (this.leftWingAlive) {
        this.fireBullet(this.x - 72, this.y + 20, 0, 350, 15, 'bullet_heavy', spawnBullet);
      }
      if (this.rightWingAlive) {
        this.fireBullet(this.x + 72, this.y + 20, 0, 350, 15, 'bullet_heavy', spawnBullet);
      }
    }

    // 2. Orbital Beam Strike: Charges up and blasts vertical pillar on player's column
    this.orbitalChargeTimer += dt;
    if (this.orbitalChargeTimer > 4.5) {
      this.orbitalChargeTimer = 0;
      this.chargeOrbitalStrike(pX, pY, spawnBullet);
    }

    // 3. Phase 2: Relentless 12-way Citadel Ring Hell
    if (this.phase === 2 && Math.sin(this.timeAlive * 3.5) > 0.85 && this.shootTimer < 0.05) {
      this.fireRing(12, 240, 16, 'bullet_heavy', spawnBullet);
    }
  }

  private chargeOrbitalStrike(
    targetX: number,
    _pY: number,
    spawnBullet: (b: EnemyBullet) => void
  ): void {
    if (!this.orbitalWarningLine) return;
    const g = this.orbitalWarningLine;
    const viewH = this.scene.cameras.main.height;

    // Draw telegraph warning line at player's X
    this.audio.play('warning', 0.8);
    let flashStep = 0;
    const timer = this.scene.time.addEvent({
      delay: 80,
      repeat: 12,
      callback: () => {
        flashStep++;
        g.clear();
        if (flashStep % 2 === 0) {
          g.lineStyle(3, 0xff0044, 0.85);
          g.beginPath();
          g.moveTo(targetX, 0);
          g.lineTo(targetX, viewH);
          g.strokePath();
        }
      },
    });

    // Detonate orbital beam strike after telegraph completes (~1s)
    this.scene.time.delayedCall(1100, () => {
      timer.remove();
      g.clear();
      if (this.isDead) return;

      this.audio.play('bomb', 1.1);
      this.scene.cameras.main.shake(400, 0.02);

      // Heavy vertical beam visual + damage bullets
      for (let y = 60; y < viewH; y += 45) {
        this.fireBullet(targetX, y, 0, 0, 35, 'laser_beam', spawnBullet);
      }
    });
  }

  // --- Projectile Firing Helpers ---

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
    const step = count > 1 ? spreadArc / (count - 1) : 0;

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

  private fireHomingOrb(
    _pX: number,
    _pY: number,
    speed: number,
    damage: number,
    spawnBullet: (b: EnemyBullet) => void
  ): void {
    const s = this.scene.add.sprite(this.x, this.y + 20, 'bullet_heavy').setOrigin(0.5, 0.5);
    s.setScale(1.1);
    s.setTint(0xaa22ff);
    spawnBullet({
      sprite: s,
      vx: 0,
      vy: speed,
      damage,
      isHoming: true,
      homingTimer: 3.5,
    });
  }

  private fireMortar(
    pX: number,
    pY: number,
    spawnBullet: (b: EnemyBullet) => void
  ): void {
    const s = this.scene.add.sprite(this.x, this.y + 20, 'bullet_heavy').setOrigin(0.5, 0.5);
    s.setScale(1.2);
    s.setTint(0xffaa00);
    spawnBullet({
      sprite: s,
      vx: (pX - this.x) * 0.5,
      vy: 180,
      damage: 25,
      isMortar: true,
      mortarTargetY: pY - 30,
    });
  }

  // --- Damage, Shield Reflection & Module Destruction ---

  public takeDamage(amount: number, impactX?: number, impactY?: number): boolean {
    // 1. Boss 2 Deflective Shield check
    if (this.enemyType === 'boss2' && this.isShieldActive) {
      if (impactY === undefined || impactY >= this.y - 15) {
        // Deflected!
        this.audio.play('hit', 1.8);
        if (this.shieldSprite) {
          this.shieldSprite.setTint(0xffffff);
          this.scene.time.delayedCall(60, () => {
            if (this.shieldSprite) this.shieldSprite.setTint(0x00d2ff);
          });
        }
        return false;
      }
    }

    // 2. Boss 4 Citadel Module Destruction
    if (this.enemyType === 'boss4' && impactX !== undefined) {
      if (impactX < this.x - 35 && this.leftWingAlive) {
        this.leftWingHp -= amount;
        this.leftTurretSprite?.setTint(0xffffff);
        this.scene.time.delayedCall(60, () => {
          if (this.leftWingAlive) this.leftTurretSprite?.setTint(0xff7777);
        });
        if (this.leftWingHp <= 0) {
          this.destroyLeftWing();
        }
        return false;
      } else if (impactX > this.x + 35 && this.rightWingAlive) {
        this.rightWingHp -= amount;
        this.rightTurretSprite?.setTint(0xffffff);
        this.scene.time.delayedCall(60, () => {
          if (this.rightWingAlive) this.rightTurretSprite?.setTint(0xff7777);
        });
        if (this.rightWingHp <= 0) {
          this.destroyRightWing();
        }
        return false;
      }
    }

    // Standard body damage
    this.health -= amount;

    // Hit flash
    this.sprite.setTint(0xffffff);
    this.scene.time.delayedCall(70, () => {
      if (!this.isDead) {
        if (this.enemyType === 'boss1' && this.phase === 2) {
          this.sprite.setTint(0xff9900);
        } else if (this.enemyType === 'boss2' && this.phase === 2) {
          this.sprite.setTint(0xff3333);
        } else if (this.enemyType === 'boss3') {
          this.sprite.setTint(this.phase === 2 ? 0xdd22ff : 0xaa44ff);
        } else if (this.enemyType === 'boss4') {
          this.sprite.setTint(this.phase === 2 ? 0xff1122 : 0xff3344);
        } else if (this.enemyType === 'miniboss') {
          this.sprite.setTint(0xffaa22);
        } else if (this.enemyType === 'rear_interceptor') {
          this.sprite.setTint(0xff4444);
        } else {
          this.sprite.clearTint();
        }
      }
    });

    if (this.health <= 0) {
      this.isDead = true;
      if (this.orbitalWarningLine) {
        this.orbitalWarningLine.destroy();
      }
      return true;
    }
    return false;
  }

  private destroyLeftWing(): void {
    this.leftWingAlive = false;
    this.audio.play('explosion', 1.2);
    if (this.leftTurretSprite) {
      this.leftTurretSprite.setTint(0x222222);
      this.leftTurretSprite.setAlpha(0.4);
    }
    const boom = this.scene.add.sprite(this.x - 72, this.y, 'explosion1').setScale(1.2);
    boom.play('explode');
    boom.once('animationcomplete', () => boom.destroy());
  }

  private destroyRightWing(): void {
    this.rightWingAlive = false;
    this.audio.play('explosion', 1.2);
    if (this.rightTurretSprite) {
      this.rightTurretSprite.setTint(0x222222);
      this.rightTurretSprite.setAlpha(0.4);
    }
    const boom = this.scene.add.sprite(this.x + 72, this.y, 'explosion1').setScale(1.2);
    boom.play('explode');
    boom.once('animationcomplete', () => boom.destroy());
  }

  public destroy(fromScene?: boolean): void {
    if (this.orbitalWarningLine) {
      this.orbitalWarningLine.destroy();
    }
    super.destroy(fromScene);
  }
}
