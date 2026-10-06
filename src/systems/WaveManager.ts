import { EnemyType } from '../entities/Enemy';

export interface WaveEvent {
  time: number; // Seconds into stage
  type: EnemyType | 'survivor';
  xRatio: number; // 0.1 to 0.9 screen width
  yOffset?: number;
  warning?: 'rear' | 'flank_left' | 'flank_right' | 'miniboss';
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

    if (stageId === 1) {
      // ==========================================
      // STAGE 1: ARCHIPELAGO INCURSION (~120s)
      // Boss: Heavy Gunship (boss1)
      // ==========================================
      // Phase 1 (0 - 25s): Patrols & Initial Air Superiority
      this.events.push({ time: 2, type: 'scout', xRatio: 0.5 });
      this.events.push({ time: 3.5, type: 'scout', xRatio: 0.3 });
      this.events.push({ time: 3.5, type: 'scout', xRatio: 0.7 });
      this.events.push({ time: 7, type: 'survivor', xRatio: 0.4 }); // Hostage 1
      this.events.push({ time: 10, type: 'interceptor', xRatio: 0.25 });
      this.events.push({ time: 12, type: 'interceptor', xRatio: 0.75 });
      this.events.push({ time: 15, type: 'turret', xRatio: 0.3 });
      this.events.push({ time: 16, type: 'scout', xRatio: 0.6 });
      this.events.push({ time: 18, type: 'chopper', xRatio: 0.5 });

      // SURPRISE ATTACK 1 (22s - 28s): Rear Ambush Interceptors!
      this.events.push({ time: 22, type: 'rear_interceptor', xRatio: 0.35, warning: 'rear' });
      this.events.push({ time: 22.8, type: 'rear_interceptor', xRatio: 0.65 });
      this.events.push({ time: 24, type: 'rear_interceptor', xRatio: 0.5 });

      // Phase 2 (30 - 55s): Ground Defenses & Flank Pressure
      this.events.push({ time: 30, type: 'turret', xRatio: 0.2 });
      this.events.push({ time: 32, type: 'turret', xRatio: 0.8 });
      this.events.push({ time: 34, type: 'tank', xRatio: 0.5 });
      this.events.push({ time: 38, type: 'survivor', xRatio: 0.6 }); // Hostage 2
      this.events.push({ time: 42, type: 'chopper', xRatio: 0.3 });
      this.events.push({ time: 44, type: 'chopper', xRatio: 0.7 });

      // SURPRISE ATTACK 2 (48s - 54s): West Side Flank Pincer!
      this.events.push({ time: 48, type: 'flanker_left', xRatio: 0.3, warning: 'flank_left' });
      this.events.push({ time: 49.5, type: 'flanker_left', xRatio: 0.45 });
      this.events.push({ time: 51, type: 'flanker_left', xRatio: 0.6 });

      // Phase 3 (58 - 75s): Mid-Stage Elite Encounter
      this.events.push({ time: 58, type: 'miniboss', xRatio: 0.5, warning: 'miniboss' });
      this.events.push({ time: 64, type: 'scout', xRatio: 0.2 });
      this.events.push({ time: 64, type: 'scout', xRatio: 0.8 });
      this.events.push({ time: 70, type: 'survivor', xRatio: 0.5 }); // Hostage 3

      // SURPRISE ATTACK 3 (76s - 85s): Dual Flank Crossfire Pincer!
      this.events.push({ time: 76, type: 'flanker_left', xRatio: 0.35, warning: 'flank_left' });
      this.events.push({ time: 76.5, type: 'flanker_right', xRatio: 0.45, warning: 'flank_right' });
      this.events.push({ time: 78, type: 'flanker_left', xRatio: 0.55 });
      this.events.push({ time: 78.5, type: 'flanker_right', xRatio: 0.65 });

      // Phase 4 (88 - 112s): Heavy Escalation
      this.events.push({ time: 88, type: 'tank', xRatio: 0.25 });
      this.events.push({ time: 89, type: 'tank', xRatio: 0.75 });
      this.events.push({ time: 92, type: 'chopper', xRatio: 0.5 });
      this.events.push({ time: 96, type: 'interceptor', xRatio: 0.2 });
      this.events.push({ time: 97, type: 'interceptor', xRatio: 0.8 });
      this.events.push({ time: 101, type: 'rear_interceptor', xRatio: 0.3, warning: 'rear' });
      this.events.push({ time: 102, type: 'rear_interceptor', xRatio: 0.7 });
      this.events.push({ time: 106, type: 'turret', xRatio: 0.4 });
      this.events.push({ time: 107, type: 'turret', xRatio: 0.6 });

      // STAGE 1 BOSS at 118s
      this.events.push({ time: 118, type: 'boss1', xRatio: 0.5 });

    } else if (stageId === 2) {
      // ==========================================
      // STAGE 2: FORTRESS STRONGHOLD (~120s)
      // Boss: Fortress Tank (boss2)
      // ==========================================
      this.events.push({ time: 2, type: 'tank', xRatio: 0.35 });
      this.events.push({ time: 3, type: 'tank', xRatio: 0.65 });
      this.events.push({ time: 6, type: 'interceptor', xRatio: 0.5 });
      this.events.push({ time: 9, type: 'survivor', xRatio: 0.3 }); // Hostage 1
      this.events.push({ time: 13, type: 'turret', xRatio: 0.2 });
      this.events.push({ time: 14, type: 'turret', xRatio: 0.8 });
      this.events.push({ time: 17, type: 'chopper', xRatio: 0.5 });

      // SURPRISE ATTACK 1 (22s - 28s): East Flank Squadron!
      this.events.push({ time: 22, type: 'flanker_right', xRatio: 0.4, warning: 'flank_right' });
      this.events.push({ time: 23.5, type: 'flanker_right', xRatio: 0.55 });
      this.events.push({ time: 25, type: 'flanker_right', xRatio: 0.7 });

      // Phase 2 (30 - 55s): Armored Column
      this.events.push({ time: 30, type: 'tank', xRatio: 0.25 });
      this.events.push({ time: 32, type: 'tank', xRatio: 0.75 });
      this.events.push({ time: 35, type: 'chopper', xRatio: 0.4 });
      this.events.push({ time: 36, type: 'chopper', xRatio: 0.6 });
      this.events.push({ time: 40, type: 'survivor', xRatio: 0.7 }); // Hostage 2

      // SURPRISE ATTACK 2 (46s - 52s): Rear Ambush Interceptors!
      this.events.push({ time: 46, type: 'rear_interceptor', xRatio: 0.25, warning: 'rear' });
      this.events.push({ time: 47, type: 'rear_interceptor', xRatio: 0.5 });
      this.events.push({ time: 48, type: 'rear_interceptor', xRatio: 0.75 });

      // Phase 3 (58 - 75s): Fortress Bastion & Mini-boss
      this.events.push({ time: 58, type: 'miniboss', xRatio: 0.5, warning: 'miniboss' });
      this.events.push({ time: 62, type: 'tank', xRatio: 0.2 });
      this.events.push({ time: 63, type: 'tank', xRatio: 0.8 });
      this.events.push({ time: 70, type: 'survivor', xRatio: 0.4 }); // Hostage 3

      // SURPRISE ATTACK 3 (75s - 85s): Coordinated Pincer
      this.events.push({ time: 75, type: 'flanker_left', xRatio: 0.35, warning: 'flank_left' });
      this.events.push({ time: 75.5, type: 'flanker_right', xRatio: 0.45, warning: 'flank_right' });
      this.events.push({ time: 78, type: 'rear_interceptor', xRatio: 0.5, warning: 'rear' });

      // Phase 4 (88 - 112s): Heavy Battery
      this.events.push({ time: 88, type: 'turret', xRatio: 0.25 });
      this.events.push({ time: 89, type: 'turret', xRatio: 0.75 });
      this.events.push({ time: 92, type: 'chopper', xRatio: 0.5 });
      this.events.push({ time: 96, type: 'tank', xRatio: 0.3 });
      this.events.push({ time: 98, type: 'tank', xRatio: 0.7 });
      this.events.push({ time: 104, type: 'rear_interceptor', xRatio: 0.4, warning: 'rear' });
      this.events.push({ time: 105, type: 'rear_interceptor', xRatio: 0.6 });

      // STAGE 2 BOSS at 118s
      this.events.push({ time: 118, type: 'boss2', xRatio: 0.5 });

    } else if (stageId === 3) {
      // ==========================================
      // STAGE 3: VOLCANIC CALDERA (~120s)
      // Boss: Stealth Dreadnought (boss3)
      // ==========================================
      this.events.push({ time: 2, type: 'interceptor', xRatio: 0.3 });
      this.events.push({ time: 2.5, type: 'interceptor', xRatio: 0.7 });
      this.events.push({ time: 5, type: 'chopper', xRatio: 0.5 });
      this.events.push({ time: 8, type: 'survivor', xRatio: 0.45 }); // Hostage 1
      this.events.push({ time: 12, type: 'tank', xRatio: 0.3 });
      this.events.push({ time: 13, type: 'tank', xRatio: 0.7 });
      this.events.push({ time: 16, type: 'turret', xRatio: 0.5 });

      // SURPRISE ATTACK 1 (22s - 28s): Rear High-Speed Interceptors!
      this.events.push({ time: 22, type: 'rear_interceptor', xRatio: 0.2, warning: 'rear' });
      this.events.push({ time: 22.8, type: 'rear_interceptor', xRatio: 0.5 });
      this.events.push({ time: 23.6, type: 'rear_interceptor', xRatio: 0.8 });

      // Phase 2 (30 - 55s): Intense Aerial Incursion
      this.events.push({ time: 30, type: 'chopper', xRatio: 0.25 });
      this.events.push({ time: 31, type: 'chopper', xRatio: 0.75 });
      this.events.push({ time: 35, type: 'survivor', xRatio: 0.35 }); // Hostage 2
      this.events.push({ time: 38, type: 'interceptor', xRatio: 0.4 });
      this.events.push({ time: 39, type: 'interceptor', xRatio: 0.6 });

      // SURPRISE ATTACK 2 (46s - 52s): Dual Flanker Swarm!
      this.events.push({ time: 46, type: 'flanker_left', xRatio: 0.3, warning: 'flank_left' });
      this.events.push({ time: 47, type: 'flanker_right', xRatio: 0.5, warning: 'flank_right' });
      this.events.push({ time: 48, type: 'flanker_left', xRatio: 0.6 });
      this.events.push({ time: 49, type: 'flanker_right', xRatio: 0.7 });

      // Phase 3 (58 - 75s): Elite Dreadnought Wing & Mini-boss
      this.events.push({ time: 58, type: 'miniboss', xRatio: 0.5, warning: 'miniboss' });
      this.events.push({ time: 64, type: 'chopper', xRatio: 0.3 });
      this.events.push({ time: 65, type: 'chopper', xRatio: 0.7 });
      this.events.push({ time: 70, type: 'survivor', xRatio: 0.55 }); // Hostage 3

      // SURPRISE ATTACK 3 (76s - 85s): Ambush & Flank Combination!
      this.events.push({ time: 76, type: 'rear_interceptor', xRatio: 0.35, warning: 'rear' });
      this.events.push({ time: 77, type: 'rear_interceptor', xRatio: 0.65 });
      this.events.push({ time: 79, type: 'flanker_left', xRatio: 0.4, warning: 'flank_left' });
      this.events.push({ time: 79.5, type: 'flanker_right', xRatio: 0.6, warning: 'flank_right' });

      // Phase 4 (88 - 112s): High-Speed Escalation
      this.events.push({ time: 88, type: 'tank', xRatio: 0.25 });
      this.events.push({ time: 89, type: 'tank', xRatio: 0.75 });
      this.events.push({ time: 94, type: 'turret', xRatio: 0.5 });
      this.events.push({ time: 98, type: 'chopper', xRatio: 0.35 });
      this.events.push({ time: 99, type: 'chopper', xRatio: 0.65 });
      this.events.push({ time: 104, type: 'rear_interceptor', xRatio: 0.5, warning: 'rear' });

      // STAGE 3 BOSS at 118s
      this.events.push({ time: 118, type: 'boss3', xRatio: 0.5 });

    } else {
      // ==========================================
      // STAGE 4: IRON CITADEL (~120s)
      // Boss: Mothership Citadel (boss4)
      // ==========================================
      this.events.push({ time: 2, type: 'tank', xRatio: 0.25 });
      this.events.push({ time: 2.5, type: 'tank', xRatio: 0.75 });
      this.events.push({ time: 5, type: 'turret', xRatio: 0.5 });
      this.events.push({ time: 8, type: 'survivor', xRatio: 0.5 }); // Hostage 1
      this.events.push({ time: 12, type: 'chopper', xRatio: 0.3 });
      this.events.push({ time: 13, type: 'chopper', xRatio: 0.7 });
      this.events.push({ time: 16, type: 'interceptor', xRatio: 0.4 });
      this.events.push({ time: 17, type: 'interceptor', xRatio: 0.6 });

      // SURPRISE ATTACK 1 (22s - 28s): Quad Rear Ambush!
      this.events.push({ time: 22, type: 'rear_interceptor', xRatio: 0.2, warning: 'rear' });
      this.events.push({ time: 22.6, type: 'rear_interceptor', xRatio: 0.4 });
      this.events.push({ time: 23.2, type: 'rear_interceptor', xRatio: 0.6 });
      this.events.push({ time: 23.8, type: 'rear_interceptor', xRatio: 0.8 });

      // Phase 2 (30 - 55s): Citadel Defense Perimeter
      this.events.push({ time: 30, type: 'turret', xRatio: 0.2 });
      this.events.push({ time: 31, type: 'turret', xRatio: 0.8 });
      this.events.push({ time: 34, type: 'tank', xRatio: 0.5 });
      this.events.push({ time: 38, type: 'survivor', xRatio: 0.3 }); // Hostage 2
      this.events.push({ time: 42, type: 'chopper', xRatio: 0.35 });
      this.events.push({ time: 43, type: 'chopper', xRatio: 0.65 });

      // SURPRISE ATTACK 2 (47s - 54s): Pincer Flankers + Interceptors!
      this.events.push({ time: 47, type: 'flanker_left', xRatio: 0.3, warning: 'flank_left' });
      this.events.push({ time: 47.5, type: 'flanker_right', xRatio: 0.5, warning: 'flank_right' });
      this.events.push({ time: 49, type: 'flanker_left', xRatio: 0.6 });
      this.events.push({ time: 49.5, type: 'flanker_right', xRatio: 0.7 });

      // Phase 3 (58 - 75s): Elite Bastion Mini-boss
      this.events.push({ time: 58, type: 'miniboss', xRatio: 0.5, warning: 'miniboss' });
      this.events.push({ time: 64, type: 'tank', xRatio: 0.3 });
      this.events.push({ time: 65, type: 'tank', xRatio: 0.7 });
      this.events.push({ time: 70, type: 'survivor', xRatio: 0.65 }); // Hostage 3

      // SURPRISE ATTACK 3 (76s - 86s): Full Fleet Ambush!
      this.events.push({ time: 76, type: 'rear_interceptor', xRatio: 0.25, warning: 'rear' });
      this.events.push({ time: 76.5, type: 'rear_interceptor', xRatio: 0.75 });
      this.events.push({ time: 78, type: 'flanker_left', xRatio: 0.4, warning: 'flank_left' });
      this.events.push({ time: 78.5, type: 'flanker_right', xRatio: 0.6, warning: 'flank_right' });

      // Phase 4 (88 - 112s): Fortress Overdrive
      this.events.push({ time: 88, type: 'turret', xRatio: 0.2 });
      this.events.push({ time: 89, type: 'turret', xRatio: 0.5 });
      this.events.push({ time: 90, type: 'turret', xRatio: 0.8 });
      this.events.push({ time: 95, type: 'chopper', xRatio: 0.35 });
      this.events.push({ time: 96, type: 'chopper', xRatio: 0.65 });
      this.events.push({ time: 102, type: 'rear_interceptor', xRatio: 0.3, warning: 'rear' });
      this.events.push({ time: 103, type: 'rear_interceptor', xRatio: 0.7 });

      // STAGE 4 FINAL BOSS at 118s
      this.events.push({ time: 118, type: 'boss4', xRatio: 0.5 });
    }

    this.totalEnemies = this.events.filter((e) => e.type !== 'survivor').length;
    this.totalSurvivors = this.events.filter((e) => e.type === 'survivor').length;
  }

  public update(
    deltaSeconds: number,
    onSpawnEnemy: (type: EnemyType, xRatio: number) => void,
    onSpawnSurvivor: (xRatio: number) => void,
    onTriggerWarning?: (warning: 'rear' | 'flank_left' | 'flank_right' | 'miniboss') => void
  ): void {
    this.currentTime += deltaSeconds;

    while (this.eventIndex < this.events.length) {
      const event = this.events[this.eventIndex];
      if (this.currentTime >= event.time) {
        if (event.warning && onTriggerWarning) {
          onTriggerWarning(event.warning);
        }

        if (event.type === 'survivor') {
          onSpawnSurvivor(event.xRatio);
        } else {
          if (
            event.type === 'boss1' ||
            event.type === 'boss2' ||
            event.type === 'boss3' ||
            event.type === 'boss4'
          ) {
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
    const totalTime = this.events[this.events.length - 1]?.time || 120;
    return Math.min(1, this.currentTime / totalTime);
  }
}
