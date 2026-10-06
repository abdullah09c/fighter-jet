export interface PlayerUpgrades {
  mainCannonLevel: number;    // Max 10
  wingCannonsLevel: number;   // Max 10
  magnetRadiusLevel: number;  // Max 5
  healthArmorLevel: number;   // Max 10
  missileLauncherLevel: number; // Max 5
  laserCount: number;
  shieldCount: number;
  bombCount: number;
}

export interface StageMedals {
  destroy70Percent: boolean;
  destroy100Percent: boolean;
  rescueAllHumans: boolean;
  untouched: boolean;
}

export interface StageData {
  id: number;
  name: string;
  unlocked: boolean;
  highScore: number;
  medals: StageMedals;
}

export interface GameState {
  stars: number;
  upgrades: PlayerUpgrades;
  stages: StageData[];
  soundMuted: boolean;
  musicMuted: boolean;
}

const STORAGE_KEY = 'fighter_jet_reloaded_save_v1';

const DEFAULT_STATE: GameState = {
  stars: 250, // Starting star bonus for immediate upgrades
  upgrades: {
    mainCannonLevel: 1,
    wingCannonsLevel: 0,
    magnetRadiusLevel: 1,
    healthArmorLevel: 1,
    missileLauncherLevel: 0,
    laserCount: 2,
    shieldCount: 2,
    bombCount: 1,
  },
  stages: [
    {
      id: 1,
      name: 'Archipelago Incursion',
      unlocked: true,
      highScore: 0,
      medals: { destroy70Percent: false, destroy100Percent: false, rescueAllHumans: false, untouched: false },
    },
    {
      id: 2,
      name: 'Fortress Stronghold',
      unlocked: false,
      highScore: 0,
      medals: { destroy70Percent: false, destroy100Percent: false, rescueAllHumans: false, untouched: false },
    },
    {
      id: 3,
      name: 'Volcanic Caldera',
      unlocked: false,
      highScore: 0,
      medals: { destroy70Percent: false, destroy100Percent: false, rescueAllHumans: false, untouched: false },
    },
    {
      id: 4,
      name: 'Iron Citadel',
      unlocked: false,
      highScore: 0,
      medals: { destroy70Percent: false, destroy100Percent: false, rescueAllHumans: false, untouched: false },
    },
  ],
  soundMuted: false,
  musicMuted: false,
};

export class GameStore {
  private static instance: GameStore;
  private state: GameState;
  private listeners: Array<(state: GameState) => void> = [];

  private constructor() {
    this.state = this.loadState();
  }

  public static getInstance(): GameStore {
    if (!GameStore.instance) {
      GameStore.instance = new GameStore();
    }
    return GameStore.instance;
  }

  private loadState(): GameState {
    try {
      const serialized = localStorage.getItem(STORAGE_KEY);
      if (serialized) {
        const parsed = JSON.parse(serialized);
        return {
          ...DEFAULT_STATE,
          ...parsed,
          upgrades: { ...DEFAULT_STATE.upgrades, ...(parsed.upgrades || {}) },
          stages: DEFAULT_STATE.stages.map((st, idx) => {
            const savedSt = parsed.stages?.[idx];
            return savedSt ? { ...st, ...savedSt, medals: { ...st.medals, ...(savedSt.medals || {}) } } : st;
          }),
        };
      }
    } catch (e) {
      console.warn('Failed to load save from localStorage:', e);
    }
    return JSON.parse(JSON.stringify(DEFAULT_STATE));
  }

  public saveState(): void {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(this.state));
    } catch (e) {
      console.warn('Failed to save to localStorage:', e);
    }
    this.notify();
  }

  public getState(): GameState {
    return this.state;
  }

  public subscribe(listener: (state: GameState) => void): () => void {
    this.listeners.push(listener);
    listener(this.state);
    return () => {
      this.listeners = this.listeners.filter((l) => l !== listener);
    };
  }

  private notify(): void {
    for (const listener of this.listeners) {
      listener(this.state);
    }
  }

  public addStars(amount: number): void {
    this.state.stars += Math.max(0, amount);
    this.saveState();
  }

  public spendStars(amount: number): boolean {
    if (this.state.stars >= amount) {
      this.state.stars -= amount;
      this.saveState();
      return true;
    }
    return false;
  }

  public getUpgradeCost(key: keyof PlayerUpgrades): number {
    const current = this.state.upgrades[key];
    switch (key) {
      case 'mainCannonLevel':
        return (current + 1) * 75;
      case 'wingCannonsLevel':
        return (current + 1) * 120;
      case 'magnetRadiusLevel':
        return (current + 1) * 90;
      case 'healthArmorLevel':
        return (current + 1) * 80;
      case 'missileLauncherLevel':
        return (current + 1) * 150;
      case 'laserCount':
        return 100;
      case 'shieldCount':
        return 80;
      case 'bombCount':
        return 150;
      default:
        return 100;
    }
  }

  public getMaxLevel(key: keyof PlayerUpgrades): number {
    switch (key) {
      case 'mainCannonLevel':
      case 'wingCannonsLevel':
      case 'healthArmorLevel':
        return 10;
      case 'magnetRadiusLevel':
      case 'missileLauncherLevel':
        return 5;
      case 'laserCount':
      case 'shieldCount':
      case 'bombCount':
        return 99;
      default:
        return 10;
    }
  }

  public upgradeItem(key: keyof PlayerUpgrades): boolean {
    const current = this.state.upgrades[key];
    const max = this.getMaxLevel(key);
    if (current >= max) return false;

    const cost = this.getUpgradeCost(key);
    if (this.spendStars(cost)) {
      this.state.upgrades[key] += 1;
      this.saveState();
      return true;
    }
    return false;
  }

  public consumeAbility(ability: 'laser' | 'shield' | 'bomb'): boolean {
    if (ability === 'laser' && this.state.upgrades.laserCount > 0) {
      this.state.upgrades.laserCount--;
      this.saveState();
      return true;
    }
    if (ability === 'shield' && this.state.upgrades.shieldCount > 0) {
      this.state.upgrades.shieldCount--;
      this.saveState();
      return true;
    }
    if (ability === 'bomb' && this.state.upgrades.bombCount > 0) {
      this.state.upgrades.bombCount--;
      this.saveState();
      return true;
    }
    return false;
  }

  public recordStageCompletion(
    stageId: number,
    score: number,
    starsCollected: number,
    medals: Partial<StageMedals>
  ): void {
    this.addStars(starsCollected);
    const stage = this.state.stages.find((s) => s.id === stageId);
    if (stage) {
      stage.highScore = Math.max(stage.highScore, score);
      if (medals.destroy70Percent) stage.medals.destroy70Percent = true;
      if (medals.destroy100Percent) stage.medals.destroy100Percent = true;
      if (medals.rescueAllHumans) stage.medals.rescueAllHumans = true;
      if (medals.untouched) stage.medals.untouched = true;

      // Unlock next stage if this stage completed with at least 70% destroyed
      const nextStage = this.state.stages.find((s) => s.id === stageId + 1);
      if (nextStage && (medals.destroy70Percent || medals.destroy100Percent)) {
        nextStage.unlocked = true;
      }
    }
    this.saveState();
  }

  public toggleSound(): boolean {
    this.state.soundMuted = !this.state.soundMuted;
    this.saveState();
    return this.state.soundMuted;
  }

  public toggleMusic(): boolean {
    this.state.musicMuted = !this.state.musicMuted;
    this.saveState();
    return this.state.musicMuted;
  }

  public getHighestUnlockedStage(): number {
    const unlocked = this.state.stages.filter((s) => s.unlocked);
    return unlocked.length > 0 ? Math.max(...unlocked.map((s) => s.id)) : 1;
  }

  public getTotalScore(): number {
    return this.state.stages.reduce((sum, s) => sum + s.highScore, 0);
  }

  public getTotalMedalsCount(): number {
    let count = 0;
    for (const s of this.state.stages) {
      if (s.medals.destroy70Percent) count++;
      if (s.medals.destroy100Percent) count++;
      if (s.medals.rescueAllHumans) count++;
      if (s.medals.untouched) count++;
    }
    return count;
  }

  public resetNewGame(): void {
    this.state.stars = 250;
    this.state.upgrades = { ...DEFAULT_STATE.upgrades };
    this.state.stages = DEFAULT_STATE.stages.map((s) => ({
      ...s,
      highScore: 0,
      medals: { destroy70Percent: false, destroy100Percent: false, rescueAllHumans: false, untouched: false },
    }));
    this.saveState();
  }
}

