class MainMenu extends Scene {
  constructor(game) {
    super(game);
    this.animationFrame = 0;
    this.menuItems = [];
  }

  init() {
    super.init();
    this.buildMenu();
  }

  buildMenu() {
    this.clearUIElements();
    this.menuItems = [];
    
    const centerX = this.renderer.width / 2;
    const startY = 180;
    const buttonWidth = 280;
    const buttonHeight = 50;
    const spacing = 65;
    
    const hasSave = Storage.hasSave();
    const hasSeason = this.game.season !== null;
    
    if (!hasSeason) {
      this.menuItems.push({
        text: '新游戏',
        y: startY,
        action: () => this.startNewGame()
      });
      
      if (hasSave) {
        this.menuItems.push({
          text: '读取存档',
          y: startY + spacing,
          action: () => {
            this.game.loadGame();
            this.showNotification('存档已读取！', 'success');
            setTimeout(() => this.buildMenu(), 500);
          }
        });
      }
      
      this.menuItems.push({
        text: '荣誉墙',
        y: startY + spacing * 2,
        action: () => this.game.goToScene('honorWall')
      });
      
      this.menuItems.push({
        text: '退出',
        y: startY + spacing * 3,
        action: () => this.quitGame()
      });
    } else {
      const col1X = centerX - 300;
      const col2X = centerX + 20;
      
      this.menuItems.push({
        text: '训练馆',
        x: col1X,
        y: startY,
        action: () => this.game.goToScene('trainingGym')
      });
      
      this.menuItems.push({
        text: '球员宿舍',
        x: col2X,
        y: startY,
        action: () => this.game.goToScene('playerDorm')
      });
      
      this.menuItems.push({
        text: '比赛日',
        x: col1X,
        y: startY + spacing,
        action: () => this.game.goToScene('matchDay')
      });
      
      this.menuItems.push({
        text: '转会市场',
        x: col2X,
        y: startY + spacing,
        action: () => this.game.goToScene('transferMarket')
      });
      
      this.menuItems.push({
        text: '荣誉墙',
        x: col1X,
        y: startY + spacing * 2,
        action: () => this.game.goToScene('honorWall')
      });
      
      this.menuItems.push({
        text: '保存游戏',
        x: col2X,
        y: startY + spacing * 2,
        action: () => {
          this.game.saveGame();
          this.showNotification('游戏已保存！', 'success');
        }
      });
      
      this.menuItems.push({
        text: '新游戏',
        x: col1X,
        y: startY + spacing * 3,
        action: () => this.confirmNewGame()
      });
      
      this.menuItems.push({
        text: '退出',
        x: col2X,
        y: startY + spacing * 3,
        action: () => this.quitGame()
      });
    }
    
    this.menuItems.forEach((item, index) => {
      const btnX = item.x || (centerX - buttonWidth / 2);
      this.drawButton(
        btnX,
        item.y,
        buttonWidth,
        buttonHeight,
        item.text,
        () => item.action(),
        index === 0 && !hasSeason ? 'primary' : 'default'
      );
    });
  }

  startNewGame() {
    this.showNotification('正在创建新赛季...', 'info');
    
    setTimeout(() => {
      const playerTeam = new Team(TeamData.generateTeam(0, true));
      const season = new Season({});
      season.initNewSeason(playerTeam, 2);
      
      this.game.season = season;
      this.game.saveGame();
      
      this.showNotification('新赛季开始！祝你好运！', 'success');
      setTimeout(() => {
        this.game.goToScene('mainMenu');
      }, 1000);
    }, 500);
  }

  confirmNewGame() {
    if (confirm('开始新游戏将覆盖现有存档，确定吗？')) {
      Storage.delete('pixel_sports_save');
      this.game.season = null;
      this.startNewGame();
    }
  }

  showSettings() {
    this.showNotification('设置功能开发中...', 'info');
  }

  quitGame() {
    if (confirm('确定要退出游戏吗？')) {
      if (this.game.season) {
        this.game.saveGame();
      }
      window.close();
    }
  }

  update(deltaTime) {
    super.update(deltaTime);
    this.animationFrame = (this.animationFrame + 1) % 60;
  }

  render() {
    this.renderer.drawMenuBackground();
    
    const centerX = this.renderer.width / 2;
    
    if (!this.game.season) {
      this.renderer.drawRect(centerX - 300, 80, 600, 120, 'rgba(26, 26, 46, 0.9)');
      this.renderer.drawBorder(centerX - 300, 80, 600, 120, this.renderer.palette.gold, 4);
      
      this.renderer.drawTextCentered('像素体育俱乐部', centerX - 300, 100, 600, this.renderer.palette.gold, 28);
      this.renderer.drawTextCentered('PIXEL SPORTS CLUB', centerX - 300, 145, 600, this.renderer.palette.textMuted, 12);
      this.renderer.drawTextCentered('⚽ 经营你的冠军球队 ⚽', centerX - 300, 175, 600, this.renderer.palette.cyan, 10);
    } else {
      const season = this.game.season;
      const team = season.getPlayerTeam();
      
      this.renderer.drawPanel(centerX - 300, 70, 600, 90, null);
      this.renderer.drawTextCentered(team.name, centerX - 300, 85, 600, this.renderer.palette.gold, 18);
      const leagueTier = season.leagueTier === 1 ? '甲级' : '乙级';
      this.renderer.drawTextCentered(
        `赛季 ${season.seasonNumber} | ${leagueTier}联赛 | 第${season.currentRound}/${season.totalRounds}轮`,
        centerX - 300, 115, 600, this.renderer.palette.text, 10
      );
      this.renderer.drawTextCentered(
        `积分: ${team.points} | 排名: 第${team.leaguePosition}名 | 预算: ${this.formatCurrency(team.budget)}`,
        centerX - 300, 135, 600, this.renderer.palette.gold, 10
      );
    }
    
    super.render();
    
    this.renderer.drawText('© 2024 PIXEL SPORTS', this.renderer.width - 200, this.renderer.height - 25, this.renderer.palette.textMuted, 8);
    this.renderer.drawText('v1.0.0', 15, this.renderer.height - 25, this.renderer.palette.textMuted, 8);
  }
}
