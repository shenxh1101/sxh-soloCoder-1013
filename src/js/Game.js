class Game {
  constructor() {
    this.canvas = document.getElementById('game-canvas');
    this.uiOverlay = document.getElementById('ui-overlay');
    
    this.renderer = new PixelRenderer(this.canvas);
    this.events = new EventSystem();
    this.events.bindCanvas(this.canvas);
    
    this.scenes = {};
    this.currentScene = null;
    this.currentSceneName = null;
    
    this.season = null;
    
    this.lastTime = 0;
    this.running = false;
    this.fps = 0;
    this.frameCount = 0;
    this.lastFpsUpdate = 0;
    
    this.init();
  }

  init() {
    this.initScenes();
    this.loadGame();
    
    if (!this.season) {
      this.goToScene('mainMenu');
    } else {
      this.goToScene('mainMenu');
    }
    
    this.running = true;
    this.gameLoop(0);
  }

  initScenes() {
    this.scenes = {
      mainMenu: new MainMenu(this),
      trainingGym: new TrainingGym(this),
      playerDorm: new PlayerDorm(this),
      matchDay: new MatchDay(this),
      transferMarket: new TransferMarket(this),
      honorWall: new HonorWall(this)
    };
  }

  goToScene(sceneName) {
    if (!this.scenes[sceneName]) {
      console.error('Scene not found:', sceneName);
      return;
    }
    
    if (this.currentScene) {
      this.currentScene.cleanup();
    }
    
    this.currentSceneName = sceneName;
    this.currentScene = this.scenes[sceneName];
    this.currentScene.init();
    
    console.log('Switched to scene:', sceneName);
  }

  gameLoop(currentTime) {
    if (!this.running) return;
    
    const deltaTime = currentTime - this.lastTime;
    this.lastTime = currentTime;
    
    this.update(deltaTime);
    this.render();
    
    this.frameCount++;
    if (currentTime - this.lastFpsUpdate >= 1000) {
      this.fps = this.frameCount;
      this.frameCount = 0;
      this.lastFpsUpdate = currentTime;
    }
    
    requestAnimationFrame((t) => this.gameLoop(t));
  }

  update(deltaTime) {
    if (this.currentScene) {
      this.currentScene.update(deltaTime);
    }
  }

  render() {
    this.renderer.clear();
    
    if (this.currentScene) {
      this.currentScene.render();
    }
  }

  saveGame() {
    if (this.season) {
      const saveData = {
        version: '1.0.0',
        timestamp: Date.now(),
        season: this.season.toJSON()
      };
      
      const result = Storage.saveGame(saveData);
      if (result) {
        console.log('Game saved successfully');
        this.showNotification('游戏已保存', 'info');
      } else {
        console.error('Failed to save game');
      }
    }
  }

  loadGame() {
    const saveData = Storage.loadGame();
    
    if (saveData && saveData.season) {
      try {
        this.season = Season.fromJSON(saveData.season);
        console.log('Game loaded successfully');
        return true;
      } catch (e) {
        console.error('Failed to load game:', e);
        return false;
      }
    }
    return false;
  }

  showNotification(message, type = 'info', duration = 3000) {
    if (this.currentScene) {
      this.currentScene.showNotification(message, type, duration);
    }
  }

  getCurrentScene() {
    return this.currentScene;
  }

  getPlayerTeam() {
    return this.season?.getPlayerTeam();
  }

  startNewGame() {
    const playerTeam = new Team(TeamData.generateTeam(0, true));
    this.season = new Season({});
    this.season.initNewSeason(playerTeam, 2);
    this.saveGame();
    this.goToScene('mainMenu');
  }

  getFps() {
    return this.fps;
  }

  destroy() {
    this.running = false;
    if (this.currentScene) {
      this.currentScene.cleanup();
    }
  }
}
