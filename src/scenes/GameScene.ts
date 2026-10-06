import Phaser from 'phaser';
import { Player, LaserProjectile, MissileProjectile } from '../entities/Player';
import { Enemy, EnemyType, EnemyBullet } from '../entities/Enemy';
import { Survivor } from '../entities/Survivor';
import { ParallaxManager } from '../systems/ParallaxManager';
import { WaveManager } from '../systems/WaveManager';
import { AudioManager } from '../audio/AudioManager';
import { GameStore } from '../state/GameStore';

export interface Collectible {
  sprite: Phaser.GameObjects.Sprite;
  type: 'star' | 'star_silver' | 'shield' | 'bomb' | 'laser' | 'heal';
  vx: number;
  vy: number;
}

export class GameScene extends Phaser.Scene {
  private player!: Player;
  private parallax!: ParallaxManager;
  private waveManager!: WaveManager;
  private audio!: AudioManager;
  private store!: GameStore;

  private enemies: Enemy[] = [];
  private enemyBullets: EnemyBullet[] = [];
  private survivors: Survivor[] = [];
  private collectibles: Collectible[] = [];

  // Stage Tracking Stats
  public currentStageId = 1;
  public score = 0;
  public stageStars = 0;
  public enemiesKilled = 0;
  public totalEnemiesInStage = 0;
  public survivorsRescued = 0;
  public totalSurvivorsInStage = 0;
  public isGameOver = false;
  public isPaused = false;
  public autoFire = false;

  // Input states
  private cursors!: Phaser.Types.Input.Keyboard.CursorKeys;
  private keyW!: Phaser.Input.Keyboard.Key;
  private keyA!: Phaser.Input.Keyboard.Key;
  private keyS!: Phaser.Input.Keyboard.Key;
  private keyD!: Phaser.Input.Keyboard.Key;
  private keySpace!: Phaser.Input.Keyboard.Key;
  private key1!: Phaser.Input.Keyboard.Key;
  private key2!: Phaser.Input.Keyboard.Key;
  private key3!: Phaser.Input.Keyboard.Key;
  private keyP!: Phaser.Input.Keyboard.Key;
  private keyEsc!: Phaser.Input.Keyboard.Key;

  private pointerTarget: { x: number; y: number } | null = null;
  private isPointerDown = false;

  constructor() {
    super('GameScene');
  }

  create(data?: { stageId?: number; pausedForMenu?: boolean }): void {
    this.currentStageId = data?.stageId || 1;
    this.score = 0;
    this.stageStars = 0;
    this.enemiesKilled = 0;
    this.survivorsRescued = 0;
    this.isGameOver = false;
    this.isPaused = Boolean(data?.pausedForMenu);

    this.enemies = [];
    this.enemyBullets = [];
    this.survivors = [];
    this.collectibles = [];

    this.store = GameStore.getInstance();
    this.audio = AudioManager.getInstance();

    const bgMap: Record<number, string> = {
      1: 'water_bg',
      2: 'space_bg',
      3: 'deep_bg',
      4: 'space_bg',
    };
    this.parallax = new ParallaxManager(this, bgMap[this.currentStageId] || 'water_bg');

    // Spawn player at bottom center
    const { width, height } = this.cameras.main;
    this.player = new Player(this, width / 2, height - 120);

    // Initialize WaveManager
    this.waveManager = new WaveManager(this.currentStageId);
    this.totalEnemiesInStage = this.waveManager.totalEnemies;
    this.totalSurvivorsInStage = this.waveManager.totalSurvivors;

    // Start background music
    this.audio.startMusic('ambient');

    // Set up Keyboard controls
    if (this.input.keyboard) {
      this.cursors = this.input.keyboard.createCursorKeys();
      this.keyW = this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.W);
      this.keyA = this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.A);
      this.keyS = this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.S);
      this.keyD = this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.D);
      this.keySpace = this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.SPACE);
      this.key1 = this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.ONE);
      this.key2 = this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.TWO);
      this.key3 = this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.THREE);
      this.keyP = this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.P);
      this.keyEsc = this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.ESC);
    }

    // Touch & Pointer Drag controls
    this.input.on('pointerdown', (pointer: Phaser.Input.Pointer) => {
      this.isPointerDown = true;
      this.pointerTarget = { x: pointer.x, y: pointer.y - 40 }; // Offset so finger does not cover plane
    });
    this.input.on('pointermove', (pointer: Phaser.Input.Pointer) => {
      if (this.isPointerDown) {
        this.pointerTarget = { x: pointer.x, y: pointer.y - 40 };
      }
    });
    this.input.on('pointerup', () => {
      this.isPointerDown = false;
      this.pointerTarget = null;
    });

    // Notify initial mission brief dialogue if actively starting mission
    if (!data?.pausedForMenu) {
      this.game.events.emit('ui:dialogue', {
        speaker: 'COMMANDER RAIN',
        text: `Stage ${this.currentStageId}: Infiltrate enemy airspace. Destroy hostiles and rescue all stranded pilots!`,
        portrait: 'commander',
      });
    }
  }

  update(time: number, delta: number): void {
    if (this.isGameOver || this.isPaused) return;
    const dt = delta / 1000;

    // Pause shortcuts
    if (
      (Phaser.Input.Keyboard.JustDown(this.keyP) ||
        Phaser.Input.Keyboard.JustDown(this.keyEsc))
    ) {
      this.togglePause();
      return;
    }

    // Toggle Autofire via Spacebar
    if (Phaser.Input.Keyboard.JustDown(this.keySpace)) {
      this.toggleAutoFire();
    }

    // Ability shortcuts
    if (Phaser.Input.Keyboard.JustDown(this.key1)) {
      this.triggerLaserBeam();
    }
    if (Phaser.Input.Keyboard.JustDown(this.key2)) {
      this.triggerEnergyShield();
    }
    if (Phaser.Input.Keyboard.JustDown(this.key3)) {
      this.triggerMegaBomb();
    }

    // Parallax update
    this.parallax.update(dt);

    // Update Player
    const keys = {
      left: Boolean(this.cursors?.left.isDown || this.keyA?.isDown),
      right: Boolean(this.cursors?.right.isDown || this.keyD?.isDown),
      up: Boolean(this.cursors?.up.isDown || this.keyW?.isDown),
      down: Boolean(this.cursors?.down.isDown || this.keyS?.isDown),
      fire: Boolean(this.autoFire || this.isPointerDown),
    };
    this.player.updatePlayer(time, delta, keys, this.pointerTarget);

    // Update Projectiles
    this.updatePlayerLasers(dt);
    this.updatePlayerMissiles(dt);
    this.updateEnemyBullets(dt);

    // Update Enemies & Spawns
    this.waveManager.update(
      dt,
      (type, xRatio) => this.spawnEnemy(type, xRatio),
      (xRatio) => this.spawnSurvivor(xRatio)
    );
    this.updateEnemies(dt);

    // Update Survivors
    for (let i = this.survivors.length - 1; i >= 0; i--) {
      const s = this.survivors[i];
      s.y += 45 * dt; // Scroll with terrain
      s.updateRescue(dt, this.player.x, this.player.y, () => {
        this.survivorsRescued++;
        this.stageStars += 50;
        this.score += 1500;
        this.game.events.emit('ui:toast', '+50 STARS - PILOT RESCUED!');
      });
      if (s.y > this.cameras.main.height + 100) {
        s.destroy();
        this.survivors.splice(i, 1);
      }
    }

    // Update Collectibles
    this.updateCollectibles(dt);

    // Emit HUD telemetry to UI Overlay
    this.game.events.emit('ui:hud-update', {
      hp: this.player.health,
      maxHp: this.player.maxHealth,
      score: this.score,
      stars: this.stageStars,
      progress: this.waveManager.getProgress(),
      laserCount: this.store.getState().upgrades.laserCount,
      shieldCount: this.store.getState().upgrades.shieldCount,
      bombCount: this.store.getState().upgrades.bombCount,
      hasShield: this.player.hasShield,
      autoFire: this.autoFire,
    });
  }

  public toggleAutoFire(): void {
    this.autoFire = !this.autoFire;
    this.game.events.emit('ui:toast', this.autoFire ? '⚡ AUTO-FIRE: ENABLED' : '⚡ AUTO-FIRE: DISABLED');
    this.audio.play('powerup', this.autoFire ? 1.2 : 0.85);
  }

  // --- Spawning Handlers ---

  private spawnEnemy(type: EnemyType, xRatio: number): void {
    const viewW = this.cameras.main.width;
    const x = viewW * xRatio;
    const enemy = new Enemy(this, x, -60, type);
    this.enemies.push(enemy);

    if (enemy.isBoss) {
      this.audio.play('boss');
      this.audio.setMusicMode('boss');
      this.cameras.main.shake(500, 0.02);

      this.game.events.emit('ui:dialogue', {
        speaker: 'WARSHIP COMMAND',
        text: 'Warning! High energy signature detected. Heavy Boss approaching!',
        portrait: 'boss',
      });
    } else {
      if (this.audio) this.audio.setMusicMode('combat');
    }
  }

  private spawnSurvivor(xRatio: number): void {
    const viewW = this.cameras.main.width;
    const x = viewW * xRatio;
    const survivor = new Survivor(this, x, -50);
    this.survivors.push(survivor);
  }

  // --- Projectile Mechanics ---

  private updatePlayerLasers(dt: number): void {
    const viewH = this.cameras.main.height;
    for (let i = this.player.lasers.length - 1; i >= 0; i--) {
      const l = this.player.lasers[i];
      l.sprite.x += l.vx * dt;
      l.sprite.y += l.vy * dt;

      // Check collision with living enemies
      let hit = false;
      for (const enemy of this.enemies) {
        if (enemy.isDead) continue;
        if (this.checkOverlap(l.sprite, enemy, 35)) {
          hit = true;
          const killed = enemy.takeDamage(l.damage);
          if (killed) {
            this.handleEnemyKilled(enemy);
          }
          break;
        }
      }

      if (hit || l.sprite.y < -30) {
        l.sprite.destroy();
        this.player.lasers.splice(i, 1);
      }
    }
  }

  private updatePlayerMissiles(dt: number): void {
    for (let i = this.player.missiles.length - 1; i >= 0; i--) {
      const m = this.player.missiles[i];
      m.lifeTime -= dt;

      // Find closest living enemy
      let closest: Enemy | null = null;
      let minDist = 9999;
      for (const enemy of this.enemies) {
        if (enemy.isDead) continue;
        const dist = Phaser.Math.Distance.Between(m.sprite.x, m.sprite.y, enemy.x, enemy.y);
        if (dist < minDist) {
          minDist = dist;
          closest = enemy;
        }
      }

      if (closest) {
        const targetAngle = Phaser.Math.Angle.Between(
          m.sprite.x,
          m.sprite.y,
          closest.x,
          closest.y
        );
        const speed = 550;
        m.vx = Phaser.Math.Linear(m.vx, Math.cos(targetAngle) * speed, 0.1);
        m.vy = Phaser.Math.Linear(m.vy, Math.sin(targetAngle) * speed, 0.1);
        m.sprite.rotation = targetAngle + Math.PI / 2;
      }

      m.sprite.x += m.vx * dt;
      m.sprite.y += m.vy * dt;

      // Collision check
      let hit = false;
      for (const enemy of this.enemies) {
        if (enemy.isDead) continue;
        if (this.checkOverlap(m.sprite, enemy, 40)) {
          hit = true;
          const killed = enemy.takeDamage(m.damage);
          if (killed) {
            this.handleEnemyKilled(enemy);
          }
          break;
        }
      }

      if (hit || m.lifeTime <= 0 || m.sprite.y < -50) {
        // Missile blast
        this.audio.play('hit', 0.8);
        m.sprite.destroy();
        this.player.missiles.splice(i, 1);
      }
    }
  }

  private updateEnemyBullets(dt: number): void {
    const { width, height } = this.cameras.main;
    for (let i = this.enemyBullets.length - 1; i >= 0; i--) {
      const b = this.enemyBullets[i];
      b.sprite.x += b.vx * dt;
      b.sprite.y += b.vy * dt;

      // Collision with player
      if (this.checkOverlap(b.sprite, this.player, 32)) {
        b.sprite.destroy();
        this.enemyBullets.splice(i, 1);
        const dead = this.player.takeDamage(b.damage);
        if (dead) {
          this.handlePlayerDeath();
        }
        continue;
      }

      // Out of bounds
      if (
        b.sprite.x < -30 ||
        b.sprite.x > width + 30 ||
        b.sprite.y < -30 ||
        b.sprite.y > height + 30
      ) {
        b.sprite.destroy();
        this.enemyBullets.splice(i, 1);
      }
    }
  }

  private updateEnemies(dt: number): void {
    const viewH = this.cameras.main.height;
    for (let i = this.enemies.length - 1; i >= 0; i--) {
      const enemy = this.enemies[i];

      // Update enemy movement & shooting
      enemy.updateEnemy(dt, this.player.x, this.player.y, (bullet) => {
        this.enemyBullets.push(bullet);
      });

      // Continuous laser beam damage
      if (this.player.isFiringBeam) {
        if (Math.abs(enemy.x - this.player.x) < 55 && enemy.y < this.player.y) {
          const killed = enemy.takeDamage(85 * dt);
          if (killed) {
            this.handleEnemyKilled(enemy);
          }
        }
      }

      // Ramming collision with player
      if (!enemy.isDead && this.checkOverlap(enemy, this.player, 45)) {
        if (this.player.hasShield) {
          // Shield instantly crushes enemy
          const killed = enemy.takeDamage(120);
          if (killed) this.handleEnemyKilled(enemy);
        } else {
          this.player.takeDamage(35);
          enemy.takeDamage(40);
        }
      }

      // Offscreen cleanup
      if (enemy.y > viewH + 120 && !enemy.isBoss) {
        enemy.destroy();
        this.enemies.splice(i, 1);
      }
    }
  }

  private handleEnemyKilled(enemy: Enemy): void {
    this.enemiesKilled++;
    this.score += enemy.scoreValue;
    this.audio.play('explosion', enemy.isBoss ? 0.7 : 1.1);

    // Spawn explosion sprite
    const boom = this.add
      .sprite(enemy.x, enemy.y, 'explosion1')
      .setScale(enemy.isBoss ? 2.5 : 1.2);
    boom.play('explode');
    boom.once('animationcomplete', () => boom.destroy());

    // Camera shake
    this.cameras.main.shake(enemy.isBoss ? 450 : 150, enemy.isBoss ? 0.025 : 0.008);

    // Drop loot: Stars and Powerups
    this.spawnLoot(enemy.x, enemy.y, enemy.isBoss);

    // Check boss victory
    if (enemy.isBoss) {
      this.time.delayedCall(1600, () => {
        this.handleStageVictory();
      });
    }

    // Cleanup
    const idx = this.enemies.indexOf(enemy);
    if (idx !== -1) this.enemies.splice(idx, 1);
    enemy.destroy();
  }

  private spawnLoot(x: number, y: number, isBoss: boolean): void {
    const starCount = isBoss ? 20 : Phaser.Math.Between(1, 4);

    for (let i = 0; i < starCount; i++) {
      const isSilver = Math.random() < 0.2;
      const key = isSilver ? 'star_silver' : 'star';
      const sprite = this.add.sprite(
        x + Phaser.Math.Between(-25, 25),
        y + Phaser.Math.Between(-25, 25),
        key
      );
      sprite.setScale(isSilver ? 0.75 : 0.65);

      this.collectibles.push({
        sprite,
        type: isSilver ? 'star_silver' : 'star',
        vx: (Math.random() - 0.5) * 80,
        vy: Phaser.Math.Between(40, 90),
      });
    }

    // Chance to drop power-up capsule
    if (isBoss || Math.random() < 0.15) {
      const types: ('shield' | 'bomb' | 'laser' | 'heal')[] = ['shield', 'bomb', 'laser', 'heal'];
      const pick = types[Math.floor(Math.random() * types.length)];
      const spriteKey =
        pick === 'shield'
          ? 'item_shield'
          : pick === 'bomb'
          ? 'item_bomb'
          : pick === 'laser'
          ? 'item_laser'
          : 'item_heal';

      const itemSprite = this.add.sprite(x, y, spriteKey).setScale(0.8);
      this.collectibles.push({
        sprite: itemSprite,
        type: pick,
        vx: 0,
        vy: 60,
      });
    }
  }

  private updateCollectibles(dt: number): void {
    const magnetRadius = this.player.getMagnetRadius();

    for (let i = this.collectibles.length - 1; i >= 0; i--) {
      const item = this.collectibles[i];
      const dist = Phaser.Math.Distance.Between(
        item.sprite.x,
        item.sprite.y,
        this.player.x,
        this.player.y
      );

      // Magnet attraction
      if (dist < magnetRadius) {
        const angle = Phaser.Math.Angle.Between(
          item.sprite.x,
          item.sprite.y,
          this.player.x,
          this.player.y
        );
        const magnetSpeed = 480;
        item.vx = Math.cos(angle) * magnetSpeed;
        item.vy = Math.sin(angle) * magnetSpeed;
      }

      item.sprite.x += item.vx * dt;
      item.sprite.y += item.vy * dt;

      // Pickup collision
      if (dist < 32) {
        this.collectItem(item);
        item.sprite.destroy();
        this.collectibles.splice(i, 1);
        continue;
      }

      // Offscreen bottom
      if (item.sprite.y > this.cameras.main.height + 40) {
        item.sprite.destroy();
        this.collectibles.splice(i, 1);
      }
    }
  }

  private collectItem(item: Collectible): void {
    if (item.type === 'star') {
      this.stageStars += 1;
      this.score += 25;
      this.audio.play('star', 1.0 + Math.random() * 0.2);
    } else if (item.type === 'star_silver') {
      this.stageStars += 5;
      this.score += 150;
      this.audio.play('star', 1.4);
    } else if (item.type === 'heal') {
      this.player.heal(40);
      this.game.events.emit('ui:toast', '+40 ARMOR REPAIRED');
    } else if (item.type === 'shield') {
      this.store.getState().upgrades.shieldCount++;
      this.store.saveState();
      this.audio.play('powerup');
      this.game.events.emit('ui:toast', '+1 ENERGY SHIELD ACQUIRED');
    } else if (item.type === 'bomb') {
      this.store.getState().upgrades.bombCount++;
      this.store.saveState();
      this.audio.play('powerup');
      this.game.events.emit('ui:toast', '+1 MEGA BOMB ACQUIRED');
    } else if (item.type === 'laser') {
      this.store.getState().upgrades.laserCount++;
      this.store.saveState();
      this.audio.play('powerup');
      this.game.events.emit('ui:toast', '+1 LASER BEAM ACQUIRED');
    }
  }

  // --- Active Consumable Commands ---

  public triggerLaserBeam(): void {
    if (this.player.activateLaserBeam()) {
      this.game.events.emit('ui:toast', 'LASER BEAM ACTIVATED!');
    }
  }

  public triggerEnergyShield(): void {
    if (this.player.activateEnergyShield()) {
      this.game.events.emit('ui:toast', 'ENERGY SHIELD ONLINE!');
    }
  }

  public triggerMegaBomb(): void {
    if (!this.store.consumeAbility('bomb')) return;

    this.audio.play('bomb');
    this.cameras.main.shake(600, 0.035);

    // Shockwave ring visual
    const wave = this.add.circle(this.player.x, this.player.y, 10, 0xff3366, 0.85);
    this.tweens.add({
      targets: wave,
      radius: 900,
      alpha: 0,
      duration: 650,
      ease: 'Quad.easeOut',
      onComplete: () => wave.destroy(),
    });

    // Destroy all active enemy bullets
    for (const b of this.enemyBullets) {
      b.sprite.destroy();
    }
    this.enemyBullets = [];

    // Damage all enemies on screen
    for (const enemy of [...this.enemies]) {
      const killed = enemy.takeDamage(320);
      if (killed) {
        this.handleEnemyKilled(enemy);
      }
    }

    this.game.events.emit('ui:toast', 'MEGA BOMB DETONATED!');
  }

  // --- Victory & Defeat Handlers ---

  private handlePlayerDeath(): void {
    this.isGameOver = true;
    this.audio.stopMusic();
    this.audio.play('defeat');

    this.player.destroyPlayer(() => {
      const destroyPercent = Math.round((this.enemiesKilled / Math.max(1, this.totalEnemiesInStage)) * 100);
      this.game.events.emit('ui:mission-summary', {
        victory: false,
        stageId: this.currentStageId,
        score: this.score,
        starsCollected: this.stageStars,
        destroyPercent,
        rescuedPilots: this.survivorsRescued,
        totalPilots: this.totalSurvivorsInStage,
        medals: {
          destroy70Percent: false,
          destroy100Percent: false,
          rescueAllHumans: false,
          untouched: false,
        },
      });
    });
  }

  private handleStageVictory(): void {
    this.isGameOver = true;
    this.audio.stopMusic();
    this.audio.play('victory');

    const destroyPercent = Math.min(100, Math.round((this.enemiesKilled / Math.max(1, this.totalEnemiesInStage)) * 100));
    const medals = {
      destroy70Percent: destroyPercent >= 70,
      destroy100Percent: destroyPercent >= 100,
      rescueAllHumans: this.survivorsRescued >= this.totalSurvivorsInStage && this.totalSurvivorsInStage > 0,
      untouched: this.player.isUntouched,
    };

    // Save record to GameStore
    this.store.recordStageCompletion(this.currentStageId, this.score, this.stageStars, medals);

    this.game.events.emit('ui:mission-summary', {
      victory: true,
      stageId: this.currentStageId,
      score: this.score,
      starsCollected: this.stageStars,
      destroyPercent,
      rescuedPilots: this.survivorsRescued,
      totalPilots: this.totalSurvivorsInStage,
      medals,
    });
  }

  public togglePause(): void {
    this.isPaused = !this.isPaused;
    this.game.events.emit('ui:pause-state', this.isPaused);
  }

  private checkOverlap(
    objA: Phaser.GameObjects.Components.Transform,
    objB: Phaser.GameObjects.Components.Transform,
    radius: number
  ): boolean {
    const dx = objA.x - objB.x;
    const dy = objA.y - objB.y;
    return dx * dx + dy * dy < radius * radius;
  }
}
