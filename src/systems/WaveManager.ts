import { Enemy, EnemyType } from '../entities/Enemy';

export interface WaveEvent {
  time: number; // Seconds into stage
  type: EnemyType | 'survivor';
  xRatio: number; // 0.1 to 0.9 screen width
  yOffset?: number;
}

export class WaveManager {
  private events: WaveEvent[] = [];
  private currentTime = 0;
  private eventIndex = 0;
  public totalEnemies = 0;
  public totalSurvivors = 0;
  public bossSpawned = false;
  private stageId: number;

  constructor(stageId: number) {
    this.stageId = stageId;
    this.generateStageEvents(stageId);
  }

  private generateStageEvents(stageId: number): void {
    this.events = [];

    // Stage 1: Archipelago Incursion (Scouts, Choppers, Turrets, Boss 1)
    if (stageId === 1) {
      // Wave 1: Scout V-formation
      this.events.push({ time: 2, type: 'scout', xRatio: 0.5 });
      this.events.push({ time: 3, type: 'scout', xRatio: 0.3 });
      this.events.push({ time: 3, type: 'scout', xRatio: 0.7 });

      // Hostage 1
      this.events.push({ time: 6, type: 'survivor', xRatio: 0.4 });

      // Wave 2: Turret and Interceptor
      this.events.push({ time: 9, type: 'turret', xRatio: 0.25 });
      this.events.push({ time: 10, type: 'interceptor', xRatio: 0.75 });
      this.events.push({ time: 12, type: 'scout', xRatio: 0.2 });
      this.events.push({ time: 12, type: 'scout', xRatio: 0.8 });

      // Wave 3: Heavy Chopper + Turret
      this.events.push({ time: 16, type: 'chopper', xRatio: 0.5 });
      this.events.push({ time: 18, type: 'turret', xRatio: 0.8 });

      // Hostage 2
      this.events.push({ time: 22, type: 'survivor', xRatio: 0.65 });

      // Wave 4: Scout Squadron
      this.events.push({ time: 25, type: 'scout', xRatio: 0.2 });
      this.events.push({ time: 26, type: 'scout', xRatio: 0.4 });
      this.events.push({ time: 27, type: 'scout', xRatio: 0.6 });
      this.events.push({ time: 28, type: 'scout', xRatio: 0.8 });

      // Wave 5: Chopper + Interceptor
      this.events.push({ time: 32, type: 'chopper', xRatio: 0.35 });
      this.events.push({ time: 34, type: 'interceptor', xRatio: 0.7 });

      // Boss 1 at ~40 seconds
      this.events.push({ time: 40, type: 'boss1', xRatio: 0.5 });
    } else {
      // Stage 2+: Fortress Stronghold (Tanks, Heavy Choppers, Interceptors, Boss 2)
      this.events.push({ time: 2, type: 'tank', xRatio: 0.3 });
      this.events.push({ time: 3, type: 'interceptor', xRatio: 0.7 });

      this.events.push({ time: 6, type: 'survivor', xRatio: 0.5 });

      this.events.push({ time: 9, type: 'chopper', xRatio: 0.4 });
      this.events.push({ time: 11, type: 'turret', xRatio: 0.8 });
      this.events.push({ time: 12, type: 'tank', xRatio: 0.25 });

      this.events.push({ time: 16, type: 'interceptor', xRatio: 0.3 });
      this.events.push({ time: 17, type: 'interceptor', xRatio: 0.6 });

      this.events.push({ time: 21, type: 'survivor', xRatio: 0.35 });

      this.events.push({ time: 24, type: 'chopper', xRatio: 0.5 });
      this.events.push({ time: 26, type: 'tank', xRatio: 0.75 });
      this.events.push({ time: 29, type: 'interceptor', xRatio: 0.2 });

      // Boss 2 at ~38 seconds
      this.events.push({ time: 38, type: 'boss2', xRatio: 0.5 });
    }

    this.totalEnemies = this.events.filter((e) => e.type !== 'survivor').length;
    this.totalSurvivors = this.events.filter((e) => e.type === 'survivor').length;
  }

  public update(
    deltaSeconds: number,
    onSpawnEnemy: (type: EnemyType, xRatio: number) => void,
    onSpawnSurvivor: (xRatio: number) => void
  ): void {
    this.currentTime += deltaSeconds;

    while (this.eventIndex < this.events.length) {
      const event = this.events[this.eventIndex];
      if (this.currentTime >= event.time) {
        if (event.type === 'survivor') {
          onSpawnSurvivor(event.xRatio);
        } else {
          if (event.type === 'boss1' || event.type === 'boss2') {
            this.bossSpawned = true;
          }
          onSpawnEnemy(event.type, event.xRatio);
        }
        this.eventIndex++;
      } else {
        break;
      }
    }
  }

  public getProgress(): number {
    const totalTime = this.events[this.events.length - 1]?.time || 40;
    return Math.min(1, this.currentTime / totalTime);
  }
}
