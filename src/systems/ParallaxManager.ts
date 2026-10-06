import Phaser from 'phaser';

export class ParallaxManager {
  private scene: Phaser.Scene;
  private bgTile: Phaser.GameObjects.TileSprite;
  private clouds: Phaser.GameObjects.Sprite[] = [];
  private baseScrollSpeed = 120; // px/sec

  constructor(scene: Phaser.Scene, bgKey: string = 'water_bg') {
    this.scene = scene;
    const { width, height } = scene.cameras.main;

    // Layer 1: Background TileSprite
    this.bgTile = scene.add.tileSprite(0, 0, width, height, bgKey).setOrigin(0, 0);
    this.bgTile.setDepth(-10);

    // Layer 3: Foreground Clouds
    this.initClouds(width, height);
  }

  private initClouds(viewW: number, viewH: number): void {
    const cloudCount = 4;
    for (let i = 0; i < cloudCount; i++) {
      const x = Phaser.Math.Between(40, viewW - 40);
      const y = Phaser.Math.Between(-viewH, viewH);
      const cloud = this.scene.add.sprite(x, y, 'cloud');
      cloud.setAlpha(Phaser.Math.FloatBetween(0.25, 0.45));
      cloud.setScale(Phaser.Math.FloatBetween(0.8, 1.4));
      cloud.setDepth(20); // Above action layer
      this.clouds.push(cloud);
    }
  }

  public update(deltaSeconds: number): void {
    // Scroll background
    this.bgTile.tilePositionY -= this.baseScrollSpeed * deltaSeconds;

    // Drift clouds faster (foreground parallax)
    const viewW = this.scene.cameras.main.width;
    const viewH = this.scene.cameras.main.height;
    const cloudSpeed = this.baseScrollSpeed * 2.2;

    for (const cloud of this.clouds) {
      cloud.y += cloudSpeed * deltaSeconds;
      if (cloud.y > viewH + 120) {
        cloud.y = -Phaser.Math.Between(100, 300);
        cloud.x = Phaser.Math.Between(40, viewW - 40);
        cloud.setAlpha(Phaser.Math.FloatBetween(0.25, 0.45));
        cloud.setScale(Phaser.Math.FloatBetween(0.8, 1.4));
      }
    }
  }

  public setBackground(bgKey: string): void {
    this.bgTile.setTexture(bgKey);
  }
}
