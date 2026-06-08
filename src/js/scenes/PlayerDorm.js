class PlayerDorm extends Scene {
  constructor(game) {
    super(game);
    this.selectedPlayer = null;
    this.viewMode = 'all';
    this.sortBy = 'overall';
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
    
    this.drawButton(790, 20, 150, 40, '训练馆', () => this.game.goToScene('trainingGym'), 'primary');
    
    this.drawButton(20, 80, 120, 35, '全部', () => { this.viewMode = 'all'; this.buildUI(); }, this.viewMode === 'all' ? 'primary' : 'default');
    this.drawButton(150, 80, 120, 35, '伤病', () => { this.viewMode = 'injured'; this.buildUI(); }, this.viewMode === 'injured' ? 'primary' : 'default');
    this.drawButton(280, 80, 120, 35, '疲劳', () => { this.viewMode = 'fatigued'; this.buildUI(); }, this.viewMode === 'fatigued' ? 'primary' : 'default');
    this.drawButton(410, 80, 120, 35, '合同', () => { this.viewMode = 'contract'; this.buildUI(); }, this.viewMode === 'contract' ? 'primary' : 'default');
    
    this.drawButton(790, 80, 150, 35, '续约合同', () => this.renewSelectedContract(), 
      this.selectedPlayer ? 'primary' : 'default');
    
    this.buildPlayerList();
  }

  getFilteredPlayers() {
    const team = this.getPlayerTeam();
    if (!team) return [];
    
    let players = [...team.squad];
    
    switch (this.viewMode) {
      case 'injured':
        return players.filter(p => p.injury > 0);
      case 'fatigued':
        return players.filter(p => p.fatigue > 50);
      case 'contract':
        return players.filter(p => p.contract.yearsRemaining <= 1);
      default:
        return players;
    }
  }

  buildPlayerList() {
    const players = this.getFilteredPlayers();
    
    players.sort((a, b) => {
      switch (this.sortBy) {
        case 'overall': return b.overall - a.overall;
        case 'position': return a.position.localeCompare(b.position);
        case 'age': return a.age - b.age;
        case 'contract': return a.contract.yearsRemaining - b.contract.yearsRemaining;
        default: return b.overall - a.overall;
      }
    });
    
    const startY = 140;
    const cardWidth = 170;
    const cardHeight = 120;
    const padding = 15;
    const perRow = 5;
    
    players.forEach((player, index) => {
      const row = Math.floor(index / perRow);
      const col = index % perRow;
      const x = 20 + col * (cardWidth + padding);
      const y = startY + row * (cardHeight + padding);
      
      this.drawButton(x, y, cardWidth, cardHeight, '', 
        () => this.selectPlayer(player), 
        this.selectedPlayer?.id === player.id ? 'primary' : 'default');
    });
  }

  selectPlayer(player) {
    this.selectedPlayer = player;
    this.buildUI();
  }

  renewSelectedContract() {
    if (!this.selectedPlayer) {
      this.showNotification('请先选择一名球员', 'warning');
      return;
    }
    
    const team = this.getPlayerTeam();
    const p = this.selectedPlayer;
    
    if (p.contract.yearsRemaining > 2) {
      const contractMsg = '该球员合同还有' + p.contract.yearsRemaining + '年，不需要续约太早了';
      this.showNotification(contractMsg, 'warning');
      return;
    }
    
    const salaryIncrease = 0.15;
    const years = 2;
    const result = team.renewPlayerContract(p.id, years, salaryIncrease);
    
    if (result.success) {
      this.showNotification(`${p.name} 续约成功！新周薪: ${this.formatCurrency(result.newSalary)}`, 'success');
      this.game.saveGame();
    } else {
      this.showNotification(result.message, 'error');
    }
    
    this.buildUI();
  }

  update(deltaTime) {
    super.update(deltaTime);
  }

  render() {
    this.renderer.clear();
    
    this.renderer.drawRect(0, 0, this.renderer.width, 70, '#2a2a4a');
    this.renderer.drawBorder(0, 0, this.renderer.width, 70, this.renderer.palette.border, 3);
    
    this.renderer.drawTextCentered('球员宿舍', 0, 20, this.renderer.width, this.renderer.palette.gold, 20);
    
    const team = this.getPlayerTeam();
    if (team) {
      this.renderer.drawText(`预算: ${this.formatCurrency(team.budget)}`, 250, 30, this.renderer.palette.gold, 10);
      this.renderer.drawText(`阵容: ${team.squad.length}/25`, 400, 30, this.renderer.palette.text, 10);
      this.renderer.drawText(`周薪总额: ${this.formatCurrency(team.getWeeklyWageBill())}`, 550, 30, this.renderer.palette.red, 10);
      this.renderer.drawText(`周收入: ${this.formatCurrency(team.getWeeklyIncome())}`, 750, 30, this.renderer.palette.green, 10);
    }
    
    const players = this.getFilteredPlayers();
    
    let titleText = '全部球员';
    if (this.viewMode === 'injured') titleText = '伤病球员';
    else if (this.viewMode === 'fatigued') titleText = '疲劳球员';
    else if (this.viewMode === 'contract') titleText = '合同到期球员';
    
    this.drawPanel(20, 130, 920, 450, titleText);
    
    const startY = 150;
    const cardWidth = 170;
    const cardHeight = 120;
    const padding = 15;
    const perRow = 5;
    
    players.forEach((player, index) => {
      const row = Math.floor(index / perRow);
      const col = index % perRow;
      const x = 20 + col * (cardWidth + padding);
      const y = startY + row * (cardHeight + padding);
      
      const isSelected = this.selectedPlayer?.id === player.id;
      const isInjured = player.injury > 0;
      const isFatigued = player.fatigue > 70;
      const contractWarning = player.contract.yearsRemaining <= 1;
      
      if (isSelected) {
        this.renderer.drawPanel(x, y, cardWidth, cardHeight, null);
        this.renderer.drawBorder(x, y, cardWidth, cardHeight, this.renderer.palette.gold, 3);
      } else {
        this.renderer.drawPanel(x, y, cardWidth, cardHeight, null);
      }
      
      this.renderer.drawPixelPlayer(x + 10, y + 5, 1, 2);
      
      this.renderer.drawText(player.name, x + 55, y + 10, this.renderer.palette.text, 10);
      this.renderer.drawText(`${player.positionShort} #${player.number}`, x + 55, y + 25, this.renderer.palette.textMuted, 8);
      this.renderer.drawText(`能力: ${player.overall}`, x + 55, y + 40, this.renderer.palette.gold, 9);
      this.renderer.drawText(`年龄: ${player.age}`, x + 120, y + 40, this.renderer.palette.text, 9);
      
      this.renderer.drawStatBar(x + 10, y + 55, 70, 8, player.fatigue, 100, '#ffaa00');
      this.renderer.drawText(`疲劳`, x + 85, y + 55, this.renderer.palette.text, 7);
      this.renderer.drawStatBar(x + 10, y + 70, 70, 8, player.morale, 100, '#ff44ff');
      this.renderer.drawText(`士气`, x + 85, y + 70, this.renderer.palette.text, 7);
      
      const contractColor = contractWarning ? this.renderer.palette.red : this.renderer.palette.green;
      this.renderer.drawText(`合同: ${player.contract.yearsRemaining}年`, x + 10, y + 85, contractColor, 8);
      this.renderer.drawText(`周薪: ${this.formatCurrency(player.contract.salary)}`, x + 90, y + 85, this.renderer.palette.gold, 7);
      
      if (isInjured) {
        this.renderer.drawText(`伤停${player.injury}周`, x + 10, y + 100, this.renderer.palette.red, 8);
      } else if (isFatigued) {
        this.renderer.drawText('需要休息', x + 10, y + 100, this.renderer.palette.yellow, 8);
      } else if (contractWarning) {
        this.renderer.drawText('续约谈判', x + 10, y + 100, this.renderer.palette.red, 8);
      } else {
        this.renderer.drawText(`状态良好`, x + 10, y + 100, this.renderer.palette.green, 8);
      }
      
      this.renderer.drawText(`进球: ${player.goals}`, x + 60, y + 100, this.renderer.palette.text, 7);
      this.renderer.drawText(`助攻: ${player.assists}`, x + 110, y + 100, this.renderer.palette.text, 7);
    });
    
    if (this.selectedPlayer) {
      const p = this.selectedPlayer;
      this.drawPanel(20, 590, 920, 30, null);
      
      let statusText = '';
      if (p.injury > 0) {
        statusText = `伤病恢复中，还需${p.injury}周`;
      } else if (p.fatigue > 70) {
        statusText = '过于疲劳，需要休息';
      } else if (p.morale < 50) {
        statusText = '士气低落';
      } else if (p.contract.yearsRemaining <= 1) {
        statusText = '合同即将到期';
      } else {
        statusText = '状态良好';
      }
      
      this.renderer.drawText(`${p.name} - ${statusText}`, 30, 600, 
        p.injury > 0 || p.fatigue > 70 || p.contract.yearsRemaining <= 1 ? 
        this.renderer.palette.yellow : this.renderer.palette.green, 10);
      
      if (p.contract.yearsRemaining <= 1) {
        const contractMsg = p.contract.yearsRemaining === 0 ? '立即续约' : `还剩${p.contract.yearsRemaining}年合同`;
        this.renderer.drawText(`建议续约！剩余${contractMsg}`, 350, 600, this.renderer.palette.red, 10);
      }
      
      if (p.injury > 0) {
        this.renderer.drawText(`预计${p.injury}周后伤愈`, 600, 600, this.renderer.palette.yellow, 10);
      }
    }
    
    super.render();
  }
}
