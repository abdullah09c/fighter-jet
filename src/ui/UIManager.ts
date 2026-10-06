import { GameStore, PlayerUpgrades, StageData } from '../state/GameStore';
import { AudioManager } from '../audio/AudioManager';

export interface HUDData {
  hp: number;
  maxHp: number;
  score: number;
  stars: number;
  progress: number;
  laserCount: number;
  shieldCount: number;
  bombCount: number;
  hasShield: boolean;
  autoFire: boolean;
}

export interface SummaryData {
  victory: boolean;
  stageId: number;
  score: number;
  starsCollected: number;
  destroyPercent: number;
  rescuedPilots: number;
  totalPilots: number;
  campaignComplete?: boolean;
  medals: {
    destroy70Percent: boolean;
    destroy100Percent: boolean;
    rescueAllHumans: boolean;
    untouched: boolean;
  };
}

export class UIManager {
  private container: HTMLElement;
  private store: GameStore;
  private audio: AudioManager;
  private activeScreen: 'menu' | 'stages' | 'hangar' | 'scores' | 'hud' | 'summary' = 'menu';
  private onStartStageCallback?: (stageId: number) => void;
  private onTriggerAbilityCallback?: (ability: 'laser' | 'shield' | 'bomb') => void;
  private onTogglePauseCallback?: () => void;
  private onRestartCallback?: () => void;
  private onToggleAutoFireCallback?: () => void;

  constructor(containerId: string) {
    const el = document.getElementById(containerId);
    if (!el) throw new Error(`Container #${containerId} not found`);
    this.container = el;
    this.store = GameStore.getInstance();
    this.audio = AudioManager.getInstance();

    this.clear();
  }

  public clear(): void {
    this.container.innerHTML = '';
  }

  public getActiveScreen(): string {
    return this.activeScreen;
  }

  public setCallbacks(callbacks: {
    onStartStage: (stageId: number) => void;
    onTriggerAbility: (ability: 'laser' | 'shield' | 'bomb') => void;
    onTogglePause: () => void;
    onRestart: () => void;
    onToggleAutoFire: () => void;
  }): void {
    this.onStartStageCallback = callbacks.onStartStage;
    this.onTriggerAbilityCallback = callbacks.onTriggerAbility;
    this.onTogglePauseCallback = callbacks.onTogglePause;
    this.onRestartCallback = callbacks.onRestart;
    this.onToggleAutoFireCallback = callbacks.onToggleAutoFire;
  }

  // --- 1. MODERN MAIN MENU ---

  public renderMainMenu(): void {
    this.activeScreen = 'menu';
    this.audio.startMusic('menu');
    const state = this.store.getState();
    const highestStage = this.store.getHighestUnlockedStage();
    const currentStageName = state.stages.find((s) => s.id === highestStage)?.name || 'Mission Active';
    const totalScore = this.store.getTotalScore();
    const totalMedals = this.store.getTotalMedalsCount();

    this.container.innerHTML = `
      <div class="pointer-events-auto w-full h-full flex flex-col justify-between p-3.5 sm:p-5 bg-skyforce-dark/95 backdrop-blur-md overflow-hidden select-none">
        
        <!-- Animated Hero Branding -->
        <div class="text-center mt-1 sm:mt-2 shrink-0">
          <div class="inline-flex items-center gap-1.5 px-3 py-0.5 text-[9px] sm:text-[10px] font-bold tracking-widest text-skyforce-accent uppercase border border-skyforce-accent/40 rounded-full mb-1 bg-skyforce-accent/10">
            <span class="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse"></span>
            TACTICAL AIR COMBAT SIM
          </div>
          <h1 class="text-3xl sm:text-4xl font-black tracking-wider text-white cyan-glow leading-none">
            FIGHTER JET
          </h1>
          <h2 class="text-lg sm:text-xl font-bold tracking-widest text-skyforce-gold gold-glow mt-0.5">
            RELOADED
          </h2>
        </div>

        <!-- Pilot Service Record Bar -->
        <div class="w-full bg-skyforce-panel/80 tech-border rounded-lg py-1.5 px-3 flex justify-around items-center my-1 shrink-0 text-xs shadow-inner">
          <div class="flex items-center gap-1">
            <span class="text-skyforce-gold">⭐</span>
            <span class="font-mono font-bold text-white">${state.stars}</span>
            <span class="text-[9px] text-gray-400">STARS</span>
          </div>
          <div class="h-3 w-px bg-white/10"></div>
          <div class="flex items-center gap-1">
            <span class="text-skyforce-accent">🏆</span>
            <span class="font-mono font-bold text-white">${totalScore.toLocaleString()}</span>
            <span class="text-[9px] text-gray-400">PTS</span>
          </div>
          <div class="h-3 w-px bg-white/10"></div>
          <div class="flex items-center gap-1">
            <span class="text-emerald-400">🎖️</span>
            <span class="font-mono font-bold text-white">${totalMedals}/16</span>
            <span class="text-[9px] text-gray-400">MEDALS</span>
          </div>
        </div>

        <!-- Modern Primary Menu Stack -->
        <div class="w-full flex-1 flex flex-col justify-center gap-2.5 my-1 min-h-0 overflow-y-auto pr-1">
          
          <!-- 1. CONTINUE -->
          <button id="btn-menu-continue" class="group relative w-full p-3 rounded-xl bg-gradient-to-r from-skyforce-panel to-skyforce-dark border border-skyforce-accent/60 hover:border-skyforce-accent hover:from-skyforce-accent/25 hover:to-skyforce-panel transition-all duration-200 text-left shadow-lg shadow-skyforce-accent/10 hover:shadow-skyforce-accent/25 active:scale-[0.99]">
            <div class="flex justify-between items-center">
              <div>
                <div class="flex items-center gap-2">
                  <span class="text-base text-skyforce-accent group-hover:translate-x-0.5 transition-transform">▶</span>
                  <span class="font-heading font-black text-white text-base tracking-wider group-hover:text-cyan-300">CONTINUE</span>
                  <span class="text-[9px] font-mono bg-skyforce-accent/20 text-skyforce-accent px-1.5 py-0.2 rounded font-bold">STAGE 0${highestStage}</span>
                </div>
                <p class="text-[10px] text-gray-400 mt-0.5 ml-6">${currentStageName}</p>
              </div>
            </div>
          </button>

          <!-- 2. NEW GAME -->
          <button id="btn-menu-newgame" class="group relative w-full p-2.5 rounded-xl bg-skyforce-panel/80 border border-white/15 hover:border-cyan-400 hover:bg-skyforce-accent/15 transition-all duration-200 text-left shadow-sm active:scale-[0.99]">
            <div class="flex justify-between items-center">
              <div>
                <div class="flex items-center gap-2">
                  <span class="text-sm text-cyan-400">⚡</span>
                  <span class="font-heading font-bold text-white text-sm tracking-wider">NEW GAME</span>
                </div>
                <p class="text-[10px] text-gray-400 mt-0.2 ml-5">Launch campaign from Stage 01</p>
              </div>
            </div>
          </button>

          <!-- 3. SHOPS & HANGAR -->
          <button id="btn-menu-shop" class="group relative w-full p-2.5 rounded-xl bg-skyforce-panel/80 border border-skyforce-gold/40 hover:border-skyforce-gold hover:bg-skyforce-gold/15 transition-all duration-200 text-left shadow-sm active:scale-[0.99]">
            <div class="flex justify-between items-center">
              <div>
                <div class="flex items-center gap-2">
                  <span class="text-sm text-skyforce-gold">🛠️</span>
                  <span class="font-heading font-bold text-white text-sm tracking-wider group-hover:text-amber-200">SHOPS & HANGAR</span>
                  <span class="text-[9px] font-mono bg-skyforce-gold/20 text-skyforce-gold px-1.5 py-0.2 rounded font-bold">UPGRADE</span>
                </div>
                <p class="text-[10px] text-gray-400 mt-0.2 ml-5">Avionics, cannons, armor & special ordnance</p>
              </div>
            </div>
          </button>

          <!-- 4. HIGH SCORES -->
          <button id="btn-menu-scores" class="group relative w-full p-2.5 rounded-xl bg-skyforce-panel/80 border border-emerald-500/30 hover:border-emerald-400 hover:bg-emerald-500/15 transition-all duration-200 text-left shadow-sm active:scale-[0.99]">
            <div class="flex justify-between items-center">
              <div>
                <div class="flex items-center gap-2">
                  <span class="text-sm text-emerald-400">🏆</span>
                  <span class="font-heading font-bold text-white text-sm tracking-wider group-hover:text-emerald-200">HIGH SCORES</span>
                </div>
                <p class="text-[10px] text-gray-400 mt-0.2 ml-5">Mission records, pilot medals & stats</p>
              </div>
            </div>
          </button>

          <!-- 5. SELECT MISSION -->
          <button id="btn-menu-stages" class="group relative w-full p-2.5 rounded-xl bg-skyforce-panel/80 border border-white/15 hover:border-white/30 hover:bg-white/5 transition-all duration-200 text-left shadow-sm active:scale-[0.99]">
            <div class="flex justify-between items-center">
              <div>
                <div class="flex items-center gap-2">
                  <span class="text-sm text-gray-300">🗺️</span>
                  <span class="font-heading font-bold text-white text-sm tracking-wider">SELECT MISSION</span>
                </div>
                <p class="text-[10px] text-gray-400 mt-0.2 ml-5">Browse and deploy to unlocked operations</p>
              </div>
            </div>
          </button>

        </div>

        <!-- Controls Hint -->
        <div class="text-center my-0.5 shrink-0">
          <span class="text-[9px] sm:text-[10px] text-skyforce-accent/90 bg-skyforce-dark/80 px-2 py-0.5 rounded-full border border-skyforce-accent/30 font-medium">
            ⌨️ SPACE: Auto-Fire &bull; 1/2/3: Abilities &bull; WASD / Drag: Move
          </span>
        </div>

        <!-- Footer Bar with Quick Audio Controls -->
        <div class="flex items-center justify-between gap-2 mt-1 shrink-0 border-t border-white/10 pt-1.5">
          <div class="text-[10px] text-gray-400 flex items-center gap-1 font-mono">
            <span>SYS VER 1.0</span>
          </div>
          <div class="flex items-center gap-2">
            <button id="btn-sound-toggle" class="px-2.5 py-1.5 rounded-lg bg-skyforce-panel border border-white/20 text-xs text-gray-300 hover:text-white transition-all flex items-center gap-1">
              <span>${state.soundMuted ? '🔇' : '🔊'}</span>
              <span class="text-[10px]">SFX</span>
            </button>
            <button id="btn-music-toggle" class="px-2.5 py-1.5 rounded-lg bg-skyforce-panel border border-white/20 text-xs text-gray-300 hover:text-white transition-all flex items-center gap-1">
              <span>${state.musicMuted ? '🔇' : '🎵'}</span>
              <span class="text-[10px]">BGM</span>
            </button>
          </div>
        </div>
      </div>
    `;

    // Bind Continue -> Launch Highest Unlocked Stage
    this.container.querySelector('#btn-menu-continue')?.addEventListener('click', () => {
      this.audio.play('powerup');
      this.renderHUD();
      this.onStartStageCallback?.(highestStage);
    });

    // Bind New Game
    this.container.querySelector('#btn-menu-newgame')?.addEventListener('click', () => {
      this.audio.play('hit');
      this.showNewGameModal();
    });

    // Bind Shops & Hangar
    this.container.querySelector('#btn-menu-shop')?.addEventListener('click', () => {
      this.audio.play('powerup');
      this.renderHangar();
    });

    // Bind High Scores
    this.container.querySelector('#btn-menu-scores')?.addEventListener('click', () => {
      this.audio.play('powerup');
      this.renderHighScores();
    });

    // Bind Select Mission
    this.container.querySelector('#btn-menu-stages')?.addEventListener('click', () => {
      this.audio.play('powerup');
      this.renderStageSelect();
    });

    // Audio toggles
    this.container.querySelector('#btn-sound-toggle')?.addEventListener('click', () => {
      this.store.toggleSound();
      this.renderMainMenu();
    });
    this.container.querySelector('#btn-music-toggle')?.addEventListener('click', () => {
      this.store.toggleMusic();
      this.renderMainMenu();
    });
  }

  // --- 2. STAGE SELECTION VIEW ---

  public renderStageSelect(): void {
    this.activeScreen = 'stages';
    const state = this.store.getState();

    this.container.innerHTML = `
      <div class="pointer-events-auto w-full h-full flex flex-col justify-between p-3.5 sm:p-5 bg-skyforce-dark/95 backdrop-blur-md overflow-hidden select-none">
        <!-- Top Bar -->
        <div class="w-full flex justify-between items-center border-b border-skyforce-accent/30 pb-2 shrink-0">
          <div class="flex items-center gap-2">
            <button id="btn-back-menu" class="px-2.5 py-1 rounded bg-skyforce-panel tech-border text-xs text-skyforce-accent font-bold hover:bg-skyforce-accent/20">
              ← BACK
            </button>
            <h2 class="text-base sm:text-lg font-black text-white cyan-glow tracking-wider">SELECT MISSION</h2>
          </div>
          <div class="flex items-center gap-1.5 bg-skyforce-panel tech-border px-2.5 py-1 rounded-lg text-xs">
            <span class="text-skyforce-gold font-bold">⭐ ${state.stars}</span>
          </div>
        </div>

        <!-- Stage Cards List -->
        <div class="w-full flex-1 overflow-y-auto space-y-2.5 my-2 pr-1 min-h-0">
          ${state.stages
            .map(
              (stage) => `
            <div class="relative p-3 rounded-xl border ${
              stage.unlocked
                ? 'border-skyforce-accent/50 bg-skyforce-panel/90 hover:border-skyforce-accent hover:bg-skyforce-accent/15 cursor-pointer stage-card shadow-md'
                : 'border-white/10 bg-black/50 opacity-50 cursor-not-allowed'
            } transition-all duration-150" data-stage="${stage.id}">
              <div class="flex justify-between items-start">
                <div>
                  <span class="text-[10px] text-skyforce-accent font-bold font-mono">STAGE 0${stage.id}</span>
                  <h3 class="font-bold text-white text-sm sm:text-base leading-tight">${stage.name}</h3>
                </div>
                ${
                  stage.unlocked
                    ? '<span class="text-[10px] bg-emerald-500/20 text-emerald-300 px-2 py-0.5 rounded border border-emerald-500/40 font-bold">DEPLOYABLE</span>'
                    : '<span class="text-[10px] bg-red-500/20 text-red-400 px-2 py-0.5 rounded border border-red-500/40 font-bold">CLASSIFIED</span>'
                }
              </div>
              
              <div class="mt-2 flex items-center justify-between text-xs text-gray-400">
                <span>BEST: <b class="text-white font-mono">${stage.highScore.toLocaleString()}</b></span>
                <div class="flex items-center gap-1.5 text-sm">
                  <span title="70% Elimination" class="${stage.medals.destroy70Percent ? 'text-skyforce-gold drop-shadow' : 'text-gray-700'}">🎖️</span>
                  <span title="100% Elimination" class="${stage.medals.destroy100Percent ? 'text-skyforce-gold drop-shadow' : 'text-gray-700'}">🏆</span>
                  <span title="Rescue All" class="${stage.medals.rescueAllHumans ? 'text-emerald-400 drop-shadow' : 'text-gray-700'}">🆘</span>
                  <span title="Untouched Wings" class="${stage.medals.untouched ? 'text-cyan-400 drop-shadow' : 'text-gray-700'}">🛡️</span>
                </div>
              </div>
            </div>
          `
            )
            .join('')}
        </div>

        <!-- Footer -->
        <div class="w-full flex justify-end shrink-0 pt-1">
          <button id="btn-stages-hangar" class="py-2 px-4 rounded-lg bg-skyforce-panel tech-border text-skyforce-gold text-xs font-bold hover:bg-skyforce-gold/20 flex items-center gap-1.5">
            🛠️ OPEN HANGAR SHOP
          </button>
        </div>
      </div>
    `;

    // Bind Back
    this.container.querySelector('#btn-back-menu')?.addEventListener('click', () => {
      this.audio.play('powerup');
      this.renderMainMenu();
    });

    // Bind Hangar
    this.container.querySelector('#btn-stages-hangar')?.addEventListener('click', () => {
      this.audio.play('powerup');
      this.renderHangar();
    });

    // Bind Stage card clicks
    this.container.querySelectorAll('.stage-card').forEach((el) => {
      el.addEventListener('click', () => {
        const stageId = parseInt(el.getAttribute('data-stage') || '1', 10);
        this.audio.play('powerup');
        this.renderHUD();
        this.onStartStageCallback?.(stageId);
      });
    });
  }

  // --- 3. HIGH SCORES & MEDALS VIEW ---

  public renderHighScores(): void {
    this.activeScreen = 'scores';
    const state = this.store.getState();
    const totalScore = this.store.getTotalScore();
    const totalMedals = this.store.getTotalMedalsCount();

    this.container.innerHTML = `
      <div class="pointer-events-auto w-full h-full flex flex-col justify-between p-3.5 sm:p-5 bg-skyforce-dark/95 backdrop-blur-md overflow-hidden select-none">
        <!-- Top Bar -->
        <div class="w-full flex justify-between items-center border-b border-skyforce-accent/30 pb-2 shrink-0">
          <div class="flex items-center gap-2">
            <button id="btn-back-menu" class="px-2.5 py-1 rounded bg-skyforce-panel tech-border text-xs text-skyforce-accent font-bold hover:bg-skyforce-accent/20">
              ← BACK
            </button>
            <h2 class="text-base sm:text-lg font-black text-white cyan-glow tracking-wider">HIGH SCORES</h2>
          </div>
          <div class="flex items-center gap-1.5 bg-skyforce-panel tech-border px-2.5 py-1 rounded-lg text-xs">
            <span class="text-skyforce-gold font-bold">⭐ ${state.stars}</span>
          </div>
        </div>

        <!-- Career Banner -->
        <div class="w-full bg-gradient-to-r from-skyforce-panel via-skyforce-dark to-skyforce-panel tech-border rounded-xl p-3 my-2 text-center shrink-0">
          <span class="text-[10px] text-skyforce-accent font-bold tracking-widest uppercase block">TOTAL CAREER SCORE</span>
          <div class="text-2xl sm:text-3xl font-black text-white cyan-glow font-mono mt-0.5">
            ${totalScore.toLocaleString()}
          </div>
          <div class="flex justify-center items-center gap-4 mt-2 text-xs text-gray-300">
            <span>MEDALS: <b class="text-emerald-400 font-mono">${totalMedals} / 16</b></span>
            <span>&bull;</span>
            <span>STARS: <b class="text-skyforce-gold font-mono">${state.stars}</b></span>
          </div>
        </div>

        <!-- Stage By Stage Breakdown (Scrollable) -->
        <div class="w-full flex-1 overflow-y-auto space-y-2 pr-1 min-h-0">
          <span class="text-[10px] font-bold tracking-widest text-gray-400 uppercase block mb-1">OPERATION RECORDS</span>
          ${state.stages
            .map(
              (stage) => `
            <div class="bg-skyforce-panel/80 tech-border rounded-lg p-2.5 flex justify-between items-center">
              <div>
                <span class="text-[9px] text-skyforce-accent font-bold font-mono">STAGE 0${stage.id}</span>
                <h4 class="font-bold text-white text-xs sm:text-sm">${stage.name}</h4>
                <div class="text-[11px] text-gray-400 mt-0.5">
                  BEST: <span class="font-mono font-bold text-skyforce-accent">${stage.highScore.toLocaleString()}</span> PTS
                </div>
              </div>

              <!-- Medals -->
              <div class="flex items-center gap-1.5 text-base bg-black/40 px-2.5 py-1 rounded-lg border border-white/5">
                <span title="70% Forces Destroyed" class="${stage.medals.destroy70Percent ? 'text-skyforce-gold drop-shadow' : 'text-gray-700 opacity-40'}">🎖️</span>
                <span title="100% Annihilation" class="${stage.medals.destroy100Percent ? 'text-skyforce-gold drop-shadow' : 'text-gray-700 opacity-40'}">🏆</span>
                <span title="Rescued All Pilots" class="${stage.medals.rescueAllHumans ? 'text-emerald-400 drop-shadow' : 'text-gray-700 opacity-40'}">🆘</span>
                <span title="Untouched Hull" class="${stage.medals.untouched ? 'text-cyan-400 drop-shadow' : 'text-gray-700 opacity-40'}">🛡️</span>
              </div>
            </div>
          `
            )
            .join('')}

          <!-- Medals Legend Card -->
          <div class="bg-skyforce-panel/50 border border-white/10 rounded-lg p-2 mt-2 text-[10px] text-gray-400 space-y-1">
            <span class="font-bold text-gray-300 block">MEDAL CRITERIA:</span>
            <div class="grid grid-cols-2 gap-1 text-[9px]">
              <div>🎖️ 70% Forces Destroyed</div>
              <div>🏆 100% Complete Annihilation</div>
              <div>🆘 All Stranded Pilots Rescued</div>
              <div>🛡️ Untouched (0 Hull Damage)</div>
            </div>
          </div>
        </div>

        <!-- Footer -->
        <div class="w-full flex justify-end shrink-0 pt-1">
          <button id="btn-scores-back" class="w-full py-2 rounded-lg bg-skyforce-accent text-skyforce-dark font-bold text-xs hover:brightness-110">
            RETURN TO MAIN MENU
          </button>
        </div>
      </div>
    `;

    this.container.querySelector('#btn-back-menu')?.addEventListener('click', () => {
      this.audio.play('powerup');
      this.renderMainMenu();
    });
    this.container.querySelector('#btn-scores-back')?.addEventListener('click', () => {
      this.audio.play('powerup');
      this.renderMainMenu();
    });
  }

  // --- 4. NEW GAME CONFIRMATION MODAL ---

  private showNewGameModal(): void {
    const existing = document.getElementById('modal-newgame');
    if (existing) existing.remove();

    const modal = document.createElement('div');
    modal.id = 'modal-newgame';
    modal.className =
      'pointer-events-auto absolute inset-0 bg-skyforce-dark/90 backdrop-blur-md flex items-center justify-center z-30 p-4 select-none';
    modal.innerHTML = `
      <div class="bg-skyforce-panel tech-border rounded-xl p-5 max-w-xs w-full text-center space-y-3 shadow-2xl animate-fade-in">
        <div class="w-12 h-12 rounded-full bg-cyan-500/20 border border-cyan-500/40 mx-auto flex items-center justify-center text-2xl">
          ⚡
        </div>
        <h2 class="text-lg font-black text-white cyan-glow tracking-wider">START NEW CAMPAIGN?</h2>
        <p class="text-xs text-gray-300 leading-relaxed">
          This will reset mission progression and high score records back to Stage 01. Ready to launch, Commander?
        </p>
        
        <div class="space-y-2 pt-1">
          <button id="btn-confirm-newgame" class="w-full py-2.5 rounded bg-skyforce-accent text-skyforce-dark font-bold hover:brightness-110 text-xs shadow-md shadow-skyforce-accent/30">
            CONFIRM & LAUNCH STAGE 01
          </button>
          <button id="btn-cancel-newgame" class="w-full py-2 rounded bg-skyforce-panel border border-white/20 text-gray-300 font-bold hover:text-white text-xs">
            CANCEL
          </button>
        </div>
      </div>
    `;
    this.container.appendChild(modal);

    modal.querySelector('#btn-confirm-newgame')?.addEventListener('click', () => {
      modal.remove();
      this.store.resetNewGame();
      this.audio.play('powerup');
      this.renderHUD();
      this.onStartStageCallback?.(1);
    });

    modal.querySelector('#btn-cancel-newgame')?.addEventListener('click', () => {
      modal.remove();
    });
  }

  // --- 5. SHOPS & HANGAR SCREEN ---

  public renderHangar(): void {
    this.activeScreen = 'hangar';
    const state = this.store.getState();
    const up = state.upgrades;

    const upgradeItems: {
      key: keyof PlayerUpgrades;
      title: string;
      desc: string;
      level: number;
      max: number;
    }[] = [
      { key: 'mainCannonLevel', title: 'Main Cannon', desc: 'Increases damage & rate of fire', level: up.mainCannonLevel, max: 10 },
      { key: 'wingCannonsLevel', title: 'Wing Cannons', desc: 'Adds angled side-spread volleys', level: up.wingCannonsLevel, max: 10 },
      { key: 'magnetRadiusLevel', title: 'Star Magnet', desc: 'Widens star attraction magnetic field', level: up.magnetRadiusLevel, max: 5 },
      { key: 'healthArmorLevel', title: 'Hull Armor', desc: 'Reinforces plating with higher max HP', level: up.healthArmorLevel, max: 10 },
      { key: 'missileLauncherLevel', title: 'Missile Pods', desc: 'Auto-fires homing rocket salvos', level: up.missileLauncherLevel, max: 5 },
    ];

    this.container.innerHTML = `
      <div class="pointer-events-auto w-full h-full flex flex-col justify-between p-3.5 sm:p-5 bg-skyforce-dark/95 backdrop-blur-md overflow-hidden select-none">
        <!-- Top Bar -->
        <div class="w-full flex justify-between items-center border-b border-skyforce-accent/30 pb-2 shrink-0">
          <div class="flex items-center gap-2">
            <button id="btn-back-menu" class="px-2.5 py-1 rounded bg-skyforce-panel tech-border text-xs text-skyforce-accent font-bold hover:bg-skyforce-accent/20">
              ← BACK
            </button>
            <h2 class="text-base sm:text-lg font-black text-white cyan-glow tracking-wider">HANGAR SHOPS</h2>
          </div>
          <div class="flex items-center gap-1.5 bg-skyforce-panel tech-border px-3 py-1 rounded-lg">
            <span class="text-skyforce-gold font-bold text-sm">⭐ ${state.stars}</span>
          </div>
        </div>

        <!-- Upgrade Content (Scrollable) -->
        <div class="w-full flex-1 overflow-y-auto space-y-3 my-2 pr-1 min-h-0">
          <!-- Avionics Upgrades -->
          <div class="space-y-2">
            <span class="text-[10px] font-bold tracking-widest text-skyforce-accent uppercase block">AVIONICS & WEAPONS</span>
            ${upgradeItems
              .map((item) => {
                const cost = this.store.getUpgradeCost(item.key);
                const isMax = item.level >= item.max;
                const canAfford = state.stars >= cost && !isMax;

                return `
                <div class="bg-skyforce-panel/80 tech-border rounded-lg p-2.5 flex justify-between items-center">
                  <div class="flex-1 mr-2">
                    <div class="flex items-center gap-2">
                      <span class="font-bold text-white text-xs sm:text-sm leading-tight">${item.title}</span>
                      <span class="text-[10px] bg-skyforce-accent/20 text-skyforce-accent px-1.5 py-0.2 rounded font-mono font-bold">
                        LVL ${item.level}/${item.max}
                      </span>
                    </div>
                    <p class="text-[10px] text-gray-400 leading-tight mt-0.5">${item.desc}</p>
                    <div class="w-full max-w-[120px] bg-black/60 rounded-full h-1.5 mt-1.5 overflow-hidden border border-white/10">
                      <div class="bg-skyforce-accent h-full" style="width: ${(item.level / item.max) * 100}%"></div>
                    </div>
                  </div>

                  <div class="shrink-0">
                    ${
                      isMax
                        ? '<span class="text-[10px] text-emerald-400 font-bold px-2 py-1 rounded bg-emerald-500/10 border border-emerald-500/30">MAX</span>'
                        : `
                      <button class="btn-upgrade px-3 py-1.5 rounded font-bold text-xs flex flex-col items-center gap-0 transition-all ${
                        canAfford
                          ? 'bg-skyforce-accent text-skyforce-dark hover:brightness-110 shadow-md shadow-skyforce-accent/30'
                          : 'bg-white/10 text-gray-500 cursor-not-allowed'
                      }" data-key="${item.key}">
                        <span>UPGRADE</span>
                        <span class="text-[9px] font-mono opacity-90">⭐ ${cost}</span>
                      </button>
                    `
                    }
                  </div>
                </div>
              `;
              })
              .join('')}
          </div>

          <!-- Special Ordnance -->
          <div class="space-y-2 pt-1">
            <span class="text-[10px] font-bold tracking-widest text-skyforce-gold uppercase block">SPECIAL ORDNANCE DEPOT</span>
            
            <div class="bg-skyforce-panel/80 tech-border rounded-lg p-2.5 flex justify-between items-center">
              <div>
                <div class="flex items-center gap-2">
                  <span class="font-bold text-cyan-400 text-xs sm:text-sm">Laser Beam</span>
                  <span class="text-[10px] bg-cyan-500/20 text-cyan-300 px-1.5 py-0.2 rounded font-mono font-bold">QTY: ${up.laserCount}</span>
                </div>
                <p class="text-[10px] text-gray-400">Piercing column laser (Key 1)</p>
              </div>
              <button class="btn-buy-consumable px-3 py-1.5 rounded font-bold text-xs flex flex-col items-center bg-skyforce-gold text-skyforce-dark hover:brightness-110" data-item="laser">
                <span>BUY +1</span>
                <span class="text-[9px] font-mono opacity-90">⭐ 100</span>
              </button>
            </div>

            <div class="bg-skyforce-panel/80 tech-border rounded-lg p-2.5 flex justify-between items-center">
              <div>
                <div class="flex items-center gap-2">
                  <span class="font-bold text-emerald-400 text-xs sm:text-sm">Energy Shield</span>
                  <span class="text-[10px] bg-emerald-500/20 text-emerald-300 px-1.5 py-0.2 rounded font-mono font-bold">QTY: ${up.shieldCount}</span>
                </div>
                <p class="text-[10px] text-gray-400">Invulnerability & ramming shock (Key 2)</p>
              </div>
              <button class="btn-buy-consumable px-3 py-1.5 rounded font-bold text-xs flex flex-col items-center bg-skyforce-gold text-skyforce-dark hover:brightness-110" data-item="shield">
                <span>BUY +1</span>
                <span class="text-[9px] font-mono opacity-90">⭐ 80</span>
              </button>
            </div>

            <div class="bg-skyforce-panel/80 tech-border rounded-lg p-2.5 flex justify-between items-center">
              <div>
                <div class="flex items-center gap-2">
                  <span class="font-bold text-rose-400 text-xs sm:text-sm">Mega Bomb</span>
                  <span class="text-[10px] bg-rose-500/20 text-rose-300 px-1.5 py-0.2 rounded font-mono font-bold">QTY: ${up.bombCount}</span>
                </div>
                <p class="text-[10px] text-gray-400">Screen-clearing shockwave (Key 3)</p>
              </div>
              <button class="btn-buy-consumable px-3 py-1.5 rounded font-bold text-xs flex flex-col items-center bg-skyforce-gold text-skyforce-dark hover:brightness-110" data-item="bomb">
                <span>BUY +1</span>
                <span class="text-[9px] font-mono opacity-90">⭐ 150</span>
              </button>
            </div>
          </div>
        </div>

        <!-- Launch Button -->
        <div class="w-full flex justify-end pt-1 shrink-0">
          <button id="btn-launch-hangar" class="w-full py-2.5 rounded-lg bg-skyforce-accent text-skyforce-dark font-black tracking-wider hover:brightness-110 shadow-lg shadow-skyforce-accent/40 text-sm">
            DEPLOY TO MISSION
          </button>
        </div>
      </div>
    `;

    // Bind Back & Launch
    this.container.querySelector('#btn-back-menu')?.addEventListener('click', () => {
      this.audio.play('powerup');
      this.renderMainMenu();
    });
    this.container.querySelector('#btn-launch-hangar')?.addEventListener('click', () => {
      this.audio.play('powerup');
      const highest = this.store.getHighestUnlockedStage();
      this.renderHUD();
      this.onStartStageCallback?.(highest);
    });

    // Bind Upgrades
    this.container.querySelectorAll('.btn-upgrade').forEach((el) => {
      el.addEventListener('click', () => {
        const key = el.getAttribute('data-key') as keyof PlayerUpgrades;
        if (this.store.upgradeItem(key)) {
          this.audio.play('powerup');
          this.renderHangar();
        } else {
          this.audio.play('warning');
        }
      });
    });

    // Bind Consumables
    this.container.querySelectorAll('.btn-buy-consumable').forEach((el) => {
      el.addEventListener('click', () => {
        const item = el.getAttribute('data-item') as 'laser' | 'shield' | 'bomb';
        const cost = item === 'laser' ? 100 : item === 'shield' ? 80 : 150;
        if (this.store.spendStars(cost)) {
          if (item === 'laser') this.store.getState().upgrades.laserCount++;
          if (item === 'shield') this.store.getState().upgrades.shieldCount++;
          if (item === 'bomb') this.store.getState().upgrades.bombCount++;
          this.store.saveState();
          this.audio.play('powerup');
          this.renderHangar();
        } else {
          this.audio.play('warning');
        }
      });
    });
  }

  // --- 6. HUD OVERLAY ---

  public renderHUD(): void {
    this.activeScreen = 'hud';

    this.container.innerHTML = `
      <!-- Top HUD Bar (Fitted to game width) -->
      <div class="pointer-events-auto w-full bg-skyforce-panel/90 tech-border rounded-xl px-3 py-1.5 backdrop-blur-md shadow-lg select-none">
        <div class="flex justify-between items-center gap-2">
          <!-- Hull Health Bar -->
          <div class="flex items-center gap-1.5 flex-1 max-w-[170px]">
            <div class="flex flex-col w-full">
              <div class="flex justify-between items-center text-[9px] font-bold text-gray-400 tracking-wider">
                <span>ARMOR</span>
                <span id="hud-hp-text" class="text-white font-mono">100%</span>
              </div>
              <div class="w-full bg-black/60 rounded-full h-2.5 border border-white/10 overflow-hidden relative mt-0.5">
                <div id="hud-hp-bar" class="bg-emerald-400 h-full transition-all duration-150" style="width: 100%"></div>
              </div>
            </div>
          </div>

          <!-- Autofire Toggle & Progress -->
          <div class="flex flex-col items-center shrink-0">
            <button id="btn-toggle-autofire" class="px-2 py-0.5 rounded text-[10px] font-bold tracking-wider transition-all duration-150 border bg-white/5 text-gray-400 border-white/10 hover:text-white" title="Press SPACE to toggle">
              ⚡ AUTO: OFF (SPACE)
            </button>
            <div class="w-20 bg-black/60 rounded-full h-1 mt-1 border border-white/10 overflow-hidden">
              <div id="hud-progress-bar" class="bg-skyforce-accent h-full transition-all duration-200" style="width: 0%"></div>
            </div>
          </div>

          <!-- Stars & Score & Pause -->
          <div class="flex items-center gap-2 shrink-0">
            <div class="flex items-center gap-1 text-skyforce-gold font-bold text-xs">
              <span>⭐</span>
              <span id="hud-stars" class="font-mono">0</span>
            </div>
            <div class="text-right">
              <span id="hud-score" class="font-mono font-bold text-xs text-white block">0</span>
            </div>
            <button id="btn-pause" class="px-2 py-1 rounded bg-skyforce-dark tech-border text-xs text-skyforce-accent font-bold hover:bg-skyforce-accent/20">
              ⏸️
            </button>
          </div>
        </div>
      </div>

      <!-- Dialogue & Toast Slot -->
      <div id="dialogue-slot" class="w-full my-auto flex flex-col items-center justify-center gap-2 pointer-events-none px-2"></div>

      <!-- Ability Hotbar (Large Mobile Thumb Targets) -->
      <div class="pointer-events-auto w-full flex justify-center items-center gap-2 px-1 mb-2 select-none">
        <button id="btn-ability-laser" class="flex-1 min-h-[56px] sm:min-h-[62px] bg-skyforce-panel/95 border-2 border-cyan-400/60 hover:border-cyan-400 active:scale-95 active:bg-cyan-500/25 text-white rounded-xl py-2 px-1 flex flex-col items-center justify-center transition-all duration-100 shadow-md shadow-cyan-500/20 cursor-pointer">
          <div class="flex items-center gap-1">
            <span class="text-xs">⚡</span>
            <span class="text-[11px] sm:text-xs font-bold text-cyan-300 font-heading tracking-wider">LASER</span>
          </div>
          <span id="hud-laser-count" class="text-[11px] font-mono font-bold text-white mt-0.5 bg-cyan-900/40 px-2 rounded-full border border-cyan-500/30">2</span>
        </button>

        <button id="btn-ability-shield" class="flex-1 min-h-[56px] sm:min-h-[62px] bg-skyforce-panel/95 border-2 border-emerald-400/60 hover:border-emerald-400 active:scale-95 active:bg-emerald-500/25 text-white rounded-xl py-2 px-1 flex flex-col items-center justify-center transition-all duration-100 shadow-md shadow-emerald-500/20 cursor-pointer">
          <div class="flex items-center gap-1">
            <span class="text-xs">🛡️</span>
            <span class="text-[11px] sm:text-xs font-bold text-emerald-300 font-heading tracking-wider">SHIELD</span>
          </div>
          <span id="hud-shield-count" class="text-[11px] font-mono font-bold text-white mt-0.5 bg-emerald-900/40 px-2 rounded-full border border-emerald-500/30">2</span>
        </button>

        <button id="btn-ability-bomb" class="flex-1 min-h-[56px] sm:min-h-[62px] bg-skyforce-panel/95 border-2 border-rose-400/60 hover:border-rose-400 active:scale-95 active:bg-rose-500/25 text-white rounded-xl py-2 px-1 flex flex-col items-center justify-center transition-all duration-100 shadow-md shadow-rose-500/20 cursor-pointer">
          <div class="flex items-center gap-1">
            <span class="text-xs">💣</span>
            <span class="text-[11px] sm:text-xs font-bold text-rose-300 font-heading tracking-wider">BOMB</span>
          </div>
          <span id="hud-bomb-count" class="text-[11px] font-mono font-bold text-white mt-0.5 bg-rose-900/40 px-2 rounded-full border border-rose-500/30">1</span>
        </button>
      </div>
    `;

    // Touch-safe event bindings (stops event bleeding to canvas)
    const bindTouchAction = (selector: string, callback?: () => void) => {
      const el = this.container.querySelector(selector);
      if (!el) return;
      el.addEventListener('pointerdown', (e) => {
        e.stopPropagation();
      });
      el.addEventListener('click', (e) => {
        e.stopPropagation();
        callback?.();
      });
    };

    bindTouchAction('#btn-ability-laser', () => this.onTriggerAbilityCallback?.('laser'));
    bindTouchAction('#btn-ability-shield', () => this.onTriggerAbilityCallback?.('shield'));
    bindTouchAction('#btn-ability-bomb', () => this.onTriggerAbilityCallback?.('bomb'));
    bindTouchAction('#btn-pause', () => this.onTogglePauseCallback?.());
    bindTouchAction('#btn-toggle-autofire', () => this.onToggleAutoFireCallback?.());
  }

  public updateHUD(data: HUDData): void {
    if (this.activeScreen !== 'hud') return;

    // HP Bar
    const hpBar = document.getElementById('hud-hp-bar');
    const hpText = document.getElementById('hud-hp-text');
    if (hpBar && hpText) {
      const pct = Math.max(0, Math.min(100, Math.round((data.hp / data.maxHp) * 100)));
      hpBar.style.width = `${pct}%`;
      hpText.innerText = `${pct}%`;

      if (pct > 50) {
        hpBar.className = 'bg-emerald-400 h-full transition-all duration-150';
      } else if (pct > 25) {
        hpBar.className = 'bg-amber-400 h-full transition-all duration-150';
      } else {
        hpBar.className = 'bg-rose-500 h-full transition-all duration-150 animate-pulse';
      }
    }

    // Autofire Button
    const autoFireBtn = document.getElementById('btn-toggle-autofire');
    if (autoFireBtn) {
      if (data.autoFire) {
        autoFireBtn.className =
          'px-2 py-0.5 rounded text-[10px] font-bold tracking-wider transition-all duration-150 border bg-emerald-500/25 text-emerald-300 border-emerald-500/50 shadow-sm shadow-emerald-500/40';
        autoFireBtn.innerText = '⚡ AUTO: ON (SPACE)';
      } else {
        autoFireBtn.className =
          'px-2 py-0.5 rounded text-[10px] font-bold tracking-wider transition-all duration-150 border bg-white/5 text-gray-400 border-white/10 hover:text-white';
        autoFireBtn.innerText = '⚡ AUTO: OFF (SPACE)';
      }
    }

    // Progress Bar
    const progBar = document.getElementById('hud-progress-bar');
    if (progBar) {
      progBar.style.width = `${Math.min(100, Math.round(data.progress * 100))}%`;
    }

    // Counters
    const starsEl = document.getElementById('hud-stars');
    if (starsEl) starsEl.innerText = data.stars.toString();

    const scoreEl = document.getElementById('hud-score');
    if (scoreEl) scoreEl.innerText = data.score.toLocaleString();

    // Hotbar counts
    const lCount = document.getElementById('hud-laser-count');
    if (lCount) lCount.innerText = data.laserCount.toString();

    const sCount = document.getElementById('hud-shield-count');
    if (sCount) sCount.innerText = data.shieldCount.toString();

    const bCount = document.getElementById('hud-bomb-count');
    if (bCount) bCount.innerText = data.bombCount.toString();
  }

  public showToast(message: string): void {
    const slot = document.getElementById('dialogue-slot');
    if (!slot) return;

    const toast = document.createElement('div');
    toast.className =
      'pointer-events-auto bg-skyforce-dark/95 border border-skyforce-gold text-skyforce-gold font-bold px-3.5 py-1 rounded-full text-xs shadow-lg animate-bounce select-none';
    toast.innerText = message;
    slot.appendChild(toast);

    setTimeout(() => {
      toast.remove();
    }, 2000);
  }

  public showDialogue(speaker: string, text: string, portrait: string): void {
    const slot = document.getElementById('dialogue-slot');
    if (!slot) return;

    slot.innerHTML = `
      <div class="pointer-events-auto bg-skyforce-panel/95 tech-border rounded-xl p-3 max-w-sm w-full shadow-2xl flex items-start gap-2.5 backdrop-blur-md select-none">
        <div class="w-10 h-10 rounded-lg bg-skyforce-dark border border-skyforce-accent/50 flex items-center justify-center text-xl shrink-0">
          ${portrait === 'commander' ? '👨‍✈️' : portrait === 'boss' ? '🤖' : '👩‍✈️'}
        </div>
        <div class="flex-1">
          <div class="text-[9px] font-bold text-skyforce-accent tracking-widest uppercase">${speaker}</div>
          <p class="text-[11px] text-gray-200 mt-0.5 leading-snug">${text}</p>
        </div>
        <button id="btn-dismiss-dialogue" class="text-xs text-gray-400 hover:text-white px-1">✕</button>
      </div>
    `;

    slot.querySelector('#btn-dismiss-dialogue')?.addEventListener('click', () => {
      slot.innerHTML = '';
    });

    setTimeout(() => {
      if (slot.innerHTML.includes(speaker)) {
        slot.innerHTML = '';
      }
    }, 4500);
  }

  public showPauseModal(isPaused: boolean): void {
    const existing = document.getElementById('modal-pause');
    if (!isPaused) {
      existing?.remove();
      return;
    }
    if (existing) return;

    const modal = document.createElement('div');
    modal.id = 'modal-pause';
    modal.className =
      'pointer-events-auto absolute inset-0 bg-skyforce-dark/85 backdrop-blur-md flex items-center justify-center z-30 p-4 select-none';
    modal.innerHTML = `
      <div class="bg-skyforce-panel tech-border rounded-xl p-5 max-w-xs w-full text-center space-y-3 shadow-2xl">
        <h2 class="text-xl font-black text-white cyan-glow tracking-wider">TACTICAL PAUSE</h2>
        
        <div class="space-y-2">
          <button id="btn-resume" class="w-full py-2.5 rounded bg-skyforce-accent text-skyforce-dark font-bold hover:brightness-110 text-xs">
            RESUME MISSION
          </button>
          <button id="btn-restart" class="w-full py-2.5 rounded bg-skyforce-panel tech-border text-white font-bold hover:bg-skyforce-accent/20 text-xs">
            RESTART STAGE
          </button>
          <button id="btn-menu" class="w-full py-2.5 rounded bg-skyforce-panel border border-white/20 text-gray-300 font-bold hover:text-white text-xs">
            ABORT TO MAIN MENU
          </button>
        </div>
      </div>
    `;
    this.container.appendChild(modal);

    modal.querySelector('#btn-resume')?.addEventListener('click', () => {
      this.onTogglePauseCallback?.();
    });
    modal.querySelector('#btn-restart')?.addEventListener('click', () => {
      modal.remove();
      this.onRestartCallback?.();
    });
    modal.querySelector('#btn-menu')?.addEventListener('click', () => {
      modal.remove();
      this.renderMainMenu();
    });
  }

  public renderMissionSummary(data: SummaryData): void {
    this.activeScreen = 'summary';

    if (data.campaignComplete && data.victory) {
      this.container.innerHTML = `
        <div class="pointer-events-auto w-full h-full flex items-center justify-center p-4 bg-skyforce-dark/95 backdrop-blur-md select-none">
          <div class="bg-skyforce-panel border-2 border-skyforce-gold rounded-2xl p-6 max-w-sm w-full text-center space-y-4 shadow-2xl relative overflow-hidden">
            <div class="absolute -top-12 -left-12 w-28 h-28 bg-skyforce-gold/20 rounded-full blur-2xl pointer-events-none"></div>
            <div class="absolute -bottom-12 -right-12 w-28 h-28 bg-skyforce-accent/20 rounded-full blur-2xl pointer-events-none"></div>

            <div class="inline-flex items-center gap-1.5 px-3 py-1 text-[10px] font-black tracking-widest text-skyforce-gold uppercase border border-skyforce-gold/50 rounded-full bg-skyforce-gold/10">
              <span>🏆</span>
              CAMPAIGN CONQUERED
            </div>

            <div>
              <h2 class="text-2xl sm:text-3xl font-black tracking-wider text-white cyan-glow">
                CITADEL DESTROYED
              </h2>
              <p class="text-xs text-skyforce-accent font-bold mt-1">COMMENDATION FROM SUPREME COMMAND</p>
            </div>

            <div class="bg-black/50 rounded-xl p-3 text-left border border-white/10 text-xs space-y-2">
              <p class="text-gray-300 leading-relaxed text-[11px]">
                Supreme salute to <strong class="text-white">Commander Abdullah</strong>! All 4 hostile airspace sectors have been liberated and the mothership core eradicated.
              </p>
              <div class="h-px bg-white/10"></div>
              <div class="flex justify-between text-[11px]">
                <span class="text-gray-400">Total Score:</span>
                <span class="font-mono font-bold text-white">${data.score.toLocaleString()}</span>
              </div>
              <div class="flex justify-between text-[11px]">
                <span class="text-gray-400">Stars Recovered:</span>
                <span class="font-mono font-bold text-skyforce-gold">⭐ +${data.starsCollected}</span>
              </div>
            </div>

            <div class="py-2">
              <div class="text-xl sm:text-2xl font-black text-skyforce-gold gold-glow tracking-widest animate-pulse">
                TO BE CONTINUED...
              </div>
              <p class="text-[10px] text-gray-400 mt-1">New campaign theatres and boss threats await in future updates.</p>
            </div>

            <button id="btn-campaign-menu" class="w-full py-3 rounded-xl bg-gradient-to-r from-skyforce-accent to-cyan-500 text-skyforce-dark font-black tracking-wider text-sm hover:brightness-110 active:scale-[0.98] shadow-lg shadow-skyforce-accent/30">
              RETURN TO MAIN MENU
            </button>
          </div>
        </div>
      `;

      this.container.querySelector('#btn-campaign-menu')?.addEventListener('click', () => {
        this.renderMainMenu();
      });
      return;
    }

    this.container.innerHTML = `
      <div class="pointer-events-auto w-full h-full flex items-center justify-center p-4 bg-skyforce-dark/95 backdrop-blur-md select-none">
        <div class="bg-skyforce-panel tech-border rounded-xl p-5 max-w-xs sm:max-w-sm w-full text-center space-y-3 shadow-2xl">
          <!-- Title Banner -->
          <div>
            <h2 class="text-2xl font-black tracking-wider ${
              data.victory ? 'text-skyforce-gold gold-glow' : 'text-rose-500 danger-glow'
            }">
              ${data.victory ? 'MISSION COMPLETE' : 'AIRCRAFT LOST'}
            </h2>
            <p class="text-[10px] text-gray-400 mt-0.5">STAGE 0${data.stageId} COMBAT DEBRIEF</p>
          </div>

          <!-- Mission Stats -->
          <div class="bg-black/40 rounded-lg p-3 space-y-1.5 text-left border border-white/10 text-[11px]">
            <div class="flex justify-between">
              <span class="text-gray-400">Total Score:</span>
              <span class="font-mono font-bold text-white">${data.score.toLocaleString()}</span>
            </div>
            <div class="flex justify-between">
              <span class="text-gray-400">Stars Recovered:</span>
              <span class="font-mono font-bold text-skyforce-gold">⭐ +${data.starsCollected}</span>
            </div>
            <div class="flex justify-between">
              <span class="text-gray-400">Forces Destroyed:</span>
              <span class="font-mono font-bold ${data.destroyPercent >= 70 ? 'text-emerald-400' : 'text-gray-300'}">
                ${data.destroyPercent}%
              </span>
            </div>
            <div class="flex justify-between">
              <span class="text-gray-400">Pilots Rescued:</span>
              <span class="font-mono font-bold ${data.rescuedPilots === data.totalPilots ? 'text-emerald-400' : 'text-gray-300'}">
                ${data.rescuedPilots} / ${data.totalPilots}
              </span>
            </div>
          </div>

          <!-- Objective Medals -->
          <div>
            <div class="text-[9px] font-bold text-skyforce-accent uppercase tracking-wider mb-1.5">STAGE MEDALS EARNED</div>
            <div class="grid grid-cols-4 gap-1.5">
              <div class="p-1.5 rounded border ${data.medals.destroy70Percent ? 'border-skyforce-gold bg-skyforce-gold/10' : 'border-white/5 bg-black/20 opacity-40'}">
                <span class="text-base">🎖️</span>
                <span class="text-[8px] block text-gray-300">70% Kills</span>
              </div>
              <div class="p-1.5 rounded border ${data.medals.destroy100Percent ? 'border-skyforce-gold bg-skyforce-gold/10' : 'border-white/5 bg-black/20 opacity-40'}">
                <span class="text-base">🏆</span>
                <span class="text-[8px] block text-gray-300">100% Kills</span>
              </div>
              <div class="p-1.5 rounded border ${data.medals.rescueAllHumans ? 'border-emerald-400 bg-emerald-500/10' : 'border-white/5 bg-black/20 opacity-40'}">
                <span class="text-base">🆘</span>
                <span class="text-[8px] block text-gray-300">All Pilots</span>
              </div>
              <div class="p-1.5 rounded border ${data.medals.untouched ? 'border-cyan-400 bg-cyan-500/10' : 'border-white/5 bg-black/20 opacity-40'}">
                <span class="text-base">🛡️</span>
                <span class="text-[8px] block text-gray-300">Untouched</span>
              </div>
            </div>
          </div>

          <!-- Actions -->
          <div class="flex gap-2 pt-1">
            <button id="btn-summary-replay" class="flex-1 py-2 rounded bg-skyforce-panel tech-border text-white text-xs font-bold hover:bg-skyforce-accent/20">
              RETRY
            </button>
            <button id="btn-summary-hangar" class="flex-1 py-2 rounded bg-skyforce-accent text-skyforce-dark text-xs font-bold hover:brightness-110">
              HANGAR
            </button>
            <button id="btn-summary-menu" class="py-2 px-3 rounded bg-skyforce-panel border border-white/20 text-gray-300 text-xs font-bold hover:text-white">
              MENU
            </button>
          </div>
        </div>
      </div>
    `;

    this.container.querySelector('#btn-summary-replay')?.addEventListener('click', () => {
      this.renderHUD();
      this.onRestartCallback?.();
    });
    this.container.querySelector('#btn-summary-hangar')?.addEventListener('click', () => {
      this.renderHangar();
    });
    this.container.querySelector('#btn-summary-menu')?.addEventListener('click', () => {
      this.renderMainMenu();
    });
  }
}
