class TrainingGym extends Scene {
  constructor(game) {
    super(game);
    this.selectedPlayer = null;
    this.selectedTraining = null;
    this.intensity = 1;
    this.animationFrame = 0;
    this.trainingTypes = [
      { id: 'strength', name: '力量训练', color: '#ff4444', stat: 'strength', desc: '提升球员力量属性' },
      { id: 'speed', name: '速度训练', color: '#44ff44', stat: 'speed', desc: '提升球员速度属性' },
      { id: 'teamwork', name: '配合训练', color: '#4488ff', stat: 'teamwork', desc: '提升球员配合属性' },
      { id: 'recovery', name: '恢复训练', color: '#ffcc00', stat: null, desc: '恢复疲劳和伤病' }
    ];
  }

  init() {
    super.init();
    this.buildUI();
  }

  buildUI() {
    this.clearUIElements();
    
    const team = this.getPlayerTeam();
    if (!team) return;
    
    this.drawButton(20, 20, 150, 40, '← 返回', () => this.game.goToScene('mainMenu'), 'default');
    
    if (this.game.season && this.game.season.seasonStatus !== 'preseason') {
      this.drawButton(790, 20, 150, 40, '下一周', () => this.advanceWeek(), 'primary');
    }
    
    this.drawButton(790, 80, 150, 40, '全体休息', () => this.restAll(), 'default');
    
    const trainingY = 140;
    this.trainingTypes.forEach((training, index) => {
      const x = 20 + index * 230;
      this.renderer.drawTrainingIcon(x, trainingY, training.id);
      
      this.drawButton(x + 10, trainingY + 110, 210, 30, training.name, 
        () => this.selectTraining(training.id), 
        this.selectedTraining === training.id ? 'primary' : 'default');
    });
    
    this.drawButton(680, 140, 130, 30, '强度: 低', () => this.setIntensity(0.5), 
      this.intensity === 0.5 ? 'primary' : 'default');
    this.drawButton(680, 180, 130, 30, '强度: 中', () => this.setIntensity(1), 
      this.intensity === 1 ? 'primary' : 'default');
    this.drawButton(680, 220, 130, 30, '强度: 高', () => this.setIntensity(1.5), 
      this.intensity === 1.5 ? 'primary' : 'default');
    
    this.buildPlayerList();
  }

  buildPlayerList() {
    const team = this.getPlayerTeam();
    if (!team) return;
    
    const startY = 300;
    const cardWidth = 170;
    const cardHeight = 140;
    const padding = 15;
    const perRow = 5;
    
    team.squad.forEach((player, index) => {
      const row = Math.floor(index / perRow);
      const col = index % perRow;
      const x = 20 + col * (cardWidth + padding);
      const y = startY + row * (cardHeight + padding);
      
      this.drawButton(x, y, cardWidth, cardHeight, '', 
        () => this.selectPlayer(player), 
        this.selectedPlayer?.id === player.id ? 'primary' : 'default');
    });
  }

  selectTraining(type) {
    this.selectedTraining = type;
    this.buildUI();
  }

  setIntensity(intensity) {
    this.intensity = intensity;
    this.buildUI();
  }

  selectPlayer(player) {
    this.selectedPlayer = player;
    this.buildUI();
    
    if (this.selectedTraining) {
      this.trainSelectedPlayer();
    }
  }

  trainSelectedPlayer() {
    if (!this.selectedPlayer || !this.selectedTraining) return;
    
    const team = this.getPlayerTeam();
    const result = team.trainPlayer(this.selectedPlayer.id, this.selectedTraining, this.intensity);
    
    if (result.success) {
      const trainingName = this.trainingTypes.find(t => t.id === this.selectedTraining)?.name || '';
      let msg = `${this.selectedPlayer.name} 完成了${trainingName}！`;
      if (result.statGain > 0) {
        msg += ' 属性+' + result.statGain;
      }
      if (result.injuryRisk) {
        msg += ` 受伤了！休息${result.injuryDuration}周`;
        this.showNotification(msg, 'error');
      } else {
        this.showNotification(msg, 'success');
      }
      this.game.saveGame();
    } else {
      this.showNotification(result.message, 'error');
    }
    
    this.buildUI();
  }

  restAll() {
    const team = this.getPlayerTeam();
    const results = team.restAll();
    
    let recovered = results.filter(r => r.result.fatigueRecovery > 10).length;
    let healed = results.filter(r => r.result.injuryHealed).length;
    
    let msg = `${recovered}名球员恢复了体力`;
    if (healed > 0) {
      msg += `，${healed}名球员伤愈归队`;
    }
    this.showNotification(msg, 'success');
    this.game.saveGame();
    this.buildUI();
  }

  advanceWeek() {
    const result = this.game.season.advanceWeek();
    this.showNotification(`第${this.game.season.currentWeek}周`, 'info');
    
    if (result.finances.net >= 0) {
      this.showNotification(`本周收入: +${this.formatCurrency(result.finances.income)} 支出: -${this.formatCurrency(result.finances.wages)} 净收入: ${this.formatCurrency(result.finances.net)}`, 'success');
    } else {
      this.showNotification(`本周亏损: 收入: +${this.formatCurrency(result.finances.income)} 支出: -${this.formatCurrency(result.finances.wages)} 净收入: ${this.formatCurrency(result.finances.net)}`, 'error');
    }
    
    if (this.game.season.currentRound < this.game.season.totalRounds) {
      const nextMatch = this.game.season.getNextMatch();
      if (nextMatch) {
        if (confirm(`下一轮比赛即将开始！\n对手: ${nextMatch.home === this.game.season.getPlayerTeam().id === nextMatch.home ? nextMatch.awayTeam.name : nextMatch.homeTeam.name}\n是否前往比赛日？`)) {
          this.game.goToScene('matchDay');
          return;
        }
      }
    }
    
    this.game.saveGame();
    this.buildUI();
  }

  update(deltaTime) {
    super.update(deltaTime);
    this.animationFrame = (this.animationFrame + 1) % 60;
  }

  render() {
    this.renderer.clear();
    
    this.renderer.drawRect(0, 0, this.renderer.width, 80, '#2a2a4a');
    this.renderer.drawBorder(0, 0, this.renderer.width, 80, this.renderer.palette.border, 3);
    
    this.renderer.drawTextCentered('训练馆', 0, 25, this.renderer.width, this.renderer.palette.gold, 20);
    
    const team = this.getPlayerTeam();
    if (team) {
      const stats = team.getAverageStats();
      this.renderer.drawText(`预算: ${this.formatCurrency(team.budget)}`, 200, 30, this.renderer.palette.gold, 10);
      this.renderer.drawText(`球队实力: ${stats.overall}`, 400, 30, this.renderer.palette.text, 10);
      this.renderer.drawText(`士气: ${stats.morale}%`, 550, 30, this.renderer.palette.text, 10);
      this.renderer.drawText(`伤病: ${team.getInjuredPlayers().length}人`, 680, 30, this.renderer.palette.red, 10);
    }
    
    if (this.game.season) {
      this.renderer.drawText(`赛季: ${this.game.season.seasonNumber}`, 20, 55, this.renderer.palette.text, 10);
      this.renderer.drawText(`轮次: ${this.game.season.currentRound}/${this.game.season.totalRounds}`, 150, 55, this.renderer.palette.text, 10);
      this.renderer.drawText(`周数: ${this.game.season.currentWeek}`, 280, 55, this.renderer.palette.text, 10);
    }
    
    this.drawPanel(20, 100, 920, 180, '训练项目');
    
    this.trainingTypes.forEach((training, index) => {
      const x = 30 + index * 230;
      this.renderer.drawText(training.desc, x + 10, 260, this.renderer.palette.textMuted, 8);
    });
    
    if (this.selectedTraining) {
      const training = this.trainingTypes.find(t => t.id === this.selectedTraining);
      this.renderer.drawText(`已选择: ${training?.name || ''}`, 820, 265, training?.color || '#fff', 10);
    }
    
    this.drawPanel(20, 290, 920, 330, '球员列表');
    
    const teamData = this.getPlayerTeam();
    if (teamData) {
      const startY = 310;
      const cardWidth = 170;
      const cardHeight = 140;
      const padding = 15;
      const perRow = 5;
      
      teamData.squad.forEach((player, index) => {
        const row = Math.floor(index / perRow);
        const col = index % perRow;
        const x = 20 + col * (cardWidth + padding);
        const y = startY + row * (cardHeight + padding);
        
        const isSelected = this.selectedPlayer?.id === player.id;
        const isInjured = player.injury > 0;
        const isFatigued = player.fatigue > 70;
        
        if (isSelected) {
          this.renderer.drawPanel(x, y, cardWidth, cardHeight, null);
          this.renderer.drawBorder(x, y, cardWidth, cardHeight, this.renderer.palette.gold, 3);
        } else {
          this.renderer.drawPanel(x, y, cardWidth, cardHeight, null);
        }
        
        const statusColor = isInjured ? this.renderer.palette.red : 
                        isFatigued ? this.renderer.palette.yellow : this.renderer.palette.green;
        
        this.renderer.drawPixelPlayer(x + 60, y + 5, 1, 2);
        
        this.renderer.drawText(player.name, x + 10, y + 50, this.renderer.palette.text, 10);
        this.renderer.drawText(`${player.positionShort} #${player.number}`, x + 10, y + 65, statusColor, 8);
        this.renderer.drawText(`能力: ${player.overall}`, x + 10, y + 80, this.renderer.palette.text, 8);
        this.renderer.drawText(`年龄: ${player.age}`, x + 90, y + 80, this.renderer.palette.text, 8);
        
        this.renderer.drawStatBar(x + 10, y + 100, 70, 10, player.strength, 99, '#ff4444');
        this.renderer.drawStatBar(x + 90, y + 100, 70, 10, player.speed, 99, '#44ff44');
        this.renderer.drawStatBar(x + 10, y + 115, 70, 10, player.teamwork, 99, '#4488ff');
        this.renderer.drawStatBar(x + 90, y + 115, 70, 10, player.fatigue, 100, '#ffaa00');
        
        if (isInjured) {
          this.renderer.drawText(`伤停${player.injury}周`, x + 10, y + 130, this.renderer.palette.red, 8);
        } else if (player.fatigue > 50) {
          this.renderer.drawText('疲劳', x + 10, y + 130, this.renderer.palette.yellow, 8);
        } else {
          this.renderer.drawText(`士气: ${player.morale}`, x + 10, y + 130, this.renderer.palette.text, 8);
        }
      });
    }
    
    if (this.selectedPlayer) {
      this.drawPanel(20, 530, 920, 90, '球员详情');
      
      const p = this.selectedPlayer;
      this.renderer.drawPixelPlayer(40, 550, 1, 3);
      
      this.renderer.drawText(p.name, 120, 550, this.renderer.palette.gold, 12);
      this.renderer.drawText(`${p.position} #${p.number}`, 120, 570, this.renderer.palette.text, 10);
      this.renderer.drawText(`年龄: ${p.age}岁`, 120, 585, this.renderer.palette.text, 9);
      this.renderer.drawText(`能力: ${p.overall}`, 220, 550, this.renderer.palette.gold, 10);
      this.renderer.drawText(`潜力: ${p.potential}`, 220, 570, this.renderer.palette.text, 9);
      this.renderer.drawText(`合同: ${p.contract.yearsRemaining}年`, 220, 585, this.renderer.palette.text, 9);
      
      this.renderer.drawText(`力量: ${p.strength}`, 320, 550, '#ff4444', 10);
      this.renderer.drawStatBar(320, 565, 120, 12, p.strength, 99, '#ff4444');
      this.renderer.drawText(`速度: ${p.speed}`, 460, 550, '#44ff44', 10);
      this.renderer.drawStatBar(460, 565, 120, 12, p.speed, 99, '#44ff44');
      this.renderer.drawText(`配合: ${p.teamwork}`, 600, 550, '#4488ff', 10);
      this.renderer.drawStatBar(600, 565, 120, 12, p.teamwork, 99, '#4488ff');
      
      this.renderer.drawText(`疲劳: ${p.fatigue}%`, 740, 550, '#ffaa00', 10);
      this.renderer.drawStatBar(740, 565, 80, 12, p.fatigue, 100, '#ffaa00');
      this.renderer.drawText(`士气: ${p.morale}%`, 840, 550, '#ff44ff', 10);
      this.renderer.drawStatBar(840, 565, 80, 12, p.morale, 100, '#ff44ff');
      
      this.renderer.drawText(`进球: ${p.goals}`, 320, 590, this.renderer.palette.text, 8);
      this.renderer.drawText(`助攻: ${p.assists}`, 400, 590, this.renderer.palette.text, 8);
      this.renderer.drawText(`出场: ${p.appearances}`, 480, 590, this.renderer.palette.text, 8);
      this.renderer.drawText(`身价: ${this.formatCurrency(p.getValue())}`, 580, 590, this.renderer.palette.gold, 8);
      this.renderer.drawText(`周薪: ${this.formatCurrency(p.contract.salary)}`, 720, 590, this.renderer.palette.gold, 8);
    }
    
    super.render();
  }
}
