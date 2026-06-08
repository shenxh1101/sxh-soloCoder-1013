class TransferMarket extends Scene {
  constructor(game) {
    super(game);
    this.selectedPlayer = null;
    this.selectedMarketPlayer = null;
    this.viewMode = 'squad';
    this.transferList = [];
    this.sortBy = 'value';
  }

  init() {
    super.init();
    
    if (this.game.season) {
      this.transferList = [...this.game.season.transferList];
    }
    
    this.buildUI();
  }

  buildUI() {
    this.clearUIElements();
    
    const team = this.getPlayerTeam();
    if (!team) return;
    
    this.drawButton(20, 20, 150, 40, '← 返回', () => this.game.goToScene('mainMenu'), 'default');
    
    this.drawButton(180, 20, 150, 40, '我的球队', () => { this.viewMode = 'squad'; this.buildUI(); },
      this.viewMode === 'squad' ? 'primary' : 'default');
    this.drawButton(340, 20, 150, 40, '转会市场', () => { this.viewMode = 'market'; this.buildUI(); },
      this.viewMode === 'market' ? 'primary' : 'default');
    
    if (this.game.season?.transferWindowOpen) {
      this.drawButton(790, 20, 150, 40, '刷新球员', () => this.refreshMarket(), 'default');
    } else {
      this.drawButton(790, 20, 150, 40, '窗口关闭', () => {}, 'danger');
    }
    
    this.drawButton(790, 70, 150, 40, '提拔青训', () => this.promoteYouth(), 'primary');
    
    if (this.viewMode === 'squad') {
      this.drawButton(790, 120, 150, 40, '出售球员', () => this.sellSelectedPlayer(), 
        this.selectedPlayer ? 'danger' : 'default');
    } else {
      this.drawButton(790, 120, 150, 40, '签下球员', () => this.buySelectedPlayer(), 
        this.selectedMarketPlayer ? 'primary' : 'default');
    }
    
    this.buildPlayerList();
  }

  buildPlayerList() {
    const team = this.getPlayerTeam();
    if (!team) return;
    
    const players = this.viewMode === 'squad' ? team.squad : this.transferList;
    
    const startY = 180;
    const cardWidth = 170;
    const cardHeight = 130;
    const padding = 15;
    const perRow = 5;
    
    players.forEach((player, index) => {
      const row = Math.floor(index / perRow);
      const col = index % perRow;
      const x = 20 + col * (cardWidth + padding);
      const y = startY + row * (cardHeight + padding);
      
      const isSelected = this.viewMode === 'squad' ? 
        this.selectedPlayer?.id === player.id : 
        this.selectedMarketPlayer?.id === player.id;
      
      this.drawButton(x, y, cardWidth, cardHeight, '',
        () => this.selectPlayer(player),
        isSelected ? 'primary' : 'default');
    });
  }

  selectPlayer(player) {
    if (this.viewMode === 'squad') {
      this.selectedPlayer = player;
      this.selectedMarketPlayer = null;
    } else {
      this.selectedMarketPlayer = player;
      this.selectedPlayer = null;
    }
    this.buildUI();
  }

  sellSelectedPlayer() {
    if (!this.selectedPlayer) {
      this.showNotification('请先选择一名球员', 'warning');
      return;
    }
    
    const team = this.getPlayerTeam();
    const p = this.selectedPlayer;
    
    if (!this.game.season.transferWindowOpen) {
      this.showNotification('转会窗口已关闭', 'error');
      return;
    }
    
    if (p.contract.yearsRemaining <= 0) {
      this.showNotification('合同到期的球员无法出售', 'error');
      return;
    }
    
    const sellPrice = Math.floor(p.getValue() * (0.9 + Math.random() * 0.3));
    
    if (confirm(`确定出售 ${p.name} 吗？\n售价: ${this.formatCurrency(sellPrice)} 元`)) {
      const result = team.sellPlayer(p.id, sellPrice);
      if (result.success) {
        const sellMsg = `成功出售 ${p.name}，获得 ${this.formatCurrency(sellPrice)} 元`;
        this.showNotification(sellMsg, 'success');
        this.selectedPlayer = null;
        this.game.saveGame();
      } else {
        this.showNotification(result.message, 'error');
      }
    }
    
    this.buildUI();
  }

  buySelectedPlayer() {
    if (!this.selectedMarketPlayer) {
      this.showNotification('请先选择一名市场上的球员', 'warning');
      return;
    }
    
    const team = this.getPlayerTeam();
    const p = this.selectedMarketPlayer;
    
    if (!this.game.season.transferWindowOpen) {
      this.showNotification('转会窗口已关闭', 'error');
      return;
    }
    
    if (team.budget < p.transferPrice) {
      this.showNotification('预算不足', 'error');
      return;
    }
    
    if (confirm(`确定签下 ${p.name} 吗？\n转会费: ${this.formatCurrency(p.transferPrice)} 元\n周薪: ${this.formatCurrency(p.contract.salary)} 元`)) {
      const playerInstance = new Player(p);
      const result = team.buyPlayer(playerInstance, p.transferPrice);
      
      if (result.success) {
        const index = this.transferList.findIndex(pl => pl.id === p.id);
        if (index > -1) {
          this.transferList.splice(index, 1);
        }
        this.showNotification(`成功签下 ${p.name}！`, 'success');
        this.selectedMarketPlayer = null;
        this.game.saveGame();
      } else {
        this.showNotification(result.message, 'error');
      }
    }
    
    this.buildUI();
  }

  refreshMarket() {
    if (!this.game.season) {
      this.game.season.refreshTransferList();
      this.transferList = this.game.season.transferList;
      this.showNotification('转会市场已刷新', 'success');
      this.game.saveGame();
      this.buildUI();
    }
  }

  promoteYouth() {
    const team = this.getPlayerTeam();
    if (!team) return;
    
    const cost = 50000 * team.youthAcademy;
    
    if (team.budget < cost) {
      const budgetMsg = '预算不足，需要 ' + this.formatCurrency(cost) + ' 元';
      this.showNotification(budgetMsg, 'error');
      return;
    }
    
    if (confirm(`确定提拔一名青训球员吗？\n费用: ${this.formatCurrency(cost)} 元`)) {
      team.budget -= cost;
      const newPlayer = team.promoteYouthPlayer();
      const youthMsg = '青训球员 ' + newPlayer.name + ' (' + newPlayer.position + ') 加入球队！能力: ' + newPlayer.overall;
      this.showNotification(youthMsg, 'success');
      this.game.saveGame();
      this.buildUI();
    }
  }

  update(deltaTime) {
    super.update(deltaTime);
  }

  render() {
    this.renderer.clear();
    
    this.renderer.drawRect(0, 0, this.renderer.width, 170, '#2a2a4a');
    this.renderer.drawBorder(0, 0, this.renderer.width, 170, this.renderer.palette.border, 3);
    
    this.renderer.drawTextCentered('转会市场', 0, 15, this.renderer.width, this.renderer.palette.gold, 20);
    
    const team = this.getPlayerTeam();
    if (team) {
      this.renderer.drawText(`预算: ${this.formatCurrency(team.budget)}`, 200, 50, this.renderer.palette.gold, 12);
      this.renderer.drawText(`阵容: ${team.squad.length}/25`, 400, 50, this.renderer.palette.text, 10);
      this.renderer.drawText(`青训等级: ${team.youthAcademy}`, 550, 50, this.renderer.palette.text, 10);
      this.renderer.drawText(`训练设施: ${team.trainingFacilities}`, 700, 50, this.renderer.palette.text, 10);
      
      if (!this.game.season?.transferWindowOpen) {
        this.renderer.drawTextCentered('转会窗口已关闭', 0, 80, this.renderer.width, this.renderer.palette.red, 14);
      } else {
        this.renderer.drawTextCentered('转会窗口开放中', 0, 80, this.renderer.width, this.renderer.palette.green, 14);
      }
    }
    
    const players = this.viewMode === 'squad' ? team.squad : this.transferList;
    
    this.drawPanel(20, 170, 920, 450, this.viewMode === 'squad' ? '我的球队' : '可用球员');
    
    const startY = 190;
    const cardWidth = 170;
    const cardHeight = 130;
    const padding = 15;
    const perRow = 5;
    
    players.forEach((player, index) => {
      const row = Math.floor(index / perRow);
      const col = index % perRow;
      const x = 20 + col * (cardWidth + padding);
      const y = startY + row * (cardHeight + padding);
      
      const isSelected = this.viewMode === 'squad' ? 
        this.selectedPlayer?.id === player.id : 
        this.selectedMarketPlayer?.id === player.id;
      
      if (isSelected) {
        this.renderer.drawPanel(x, y, cardWidth, cardHeight, null);
        this.renderer.drawBorder(x, y, cardWidth, cardHeight, this.renderer.palette.gold, 3);
      } else {
        this.renderer.drawPanel(x, y, cardWidth, cardHeight, null);
      }
      
      this.renderer.drawPixelPlayer(x + 60, y + 5, 1, 2);
      
      this.renderer.drawText(player.name, x + 10, y + 45, this.renderer.palette.text, 10);
      this.renderer.drawText(`${player.positionShort} #${player.number}`, x + 10, y + 60, this.renderer.palette.textMuted, 8);
      this.renderer.drawText(`能力: ${player.overall}`, x + 10, y + 75, this.renderer.palette.gold, 9);
      this.renderer.drawText(`年龄: ${player.age}`, x + 90, y + 75, this.renderer.palette.text, 9);
      
      this.renderer.drawStatBar(x + 10, y + 90, 70, 8, player.strength, 99, '#ff4444');
      this.renderer.drawStatBar(x + 90, y + 90, 70, 8, player.speed, 99, '#44ff44');
      const valueLabel = this.viewMode === 'squad' ? '身价' : '转会费';
      const valueAmount = this.viewMode === 'squad' ? player.getValue() : player.transferPrice;
      this.renderer.drawText(valueLabel + ': ' + this.formatCurrency(valueAmount), x + 10, y + 105, this.renderer.palette.gold, 8);
      
      if (this.viewMode === 'squad') {
        this.renderer.drawText(`合同: ${player.contract.yearsRemaining}年`, x + 10, y + 115, this.renderer.palette.text, 8);
      } else {
        this.renderer.drawText('周薪: ' + this.formatCurrency(player.contract.salary), x + 10, y + 115, this.renderer.palette.text, 8);
      }
    });
    
    if (this.selectedPlayer || this.selectedMarketPlayer) {
      const p = this.selectedPlayer || this.selectedMarketPlayer;
      this.drawPanel(20, 625, 920, 10, null);
      
      let infoText = `${p.name} - ${p.position} | 能力: ${p.overall} | 年龄: ${p.age}岁 | 潜力: ${p.potential}`;
      this.renderer.drawText(infoText, 30, 628, this.renderer.palette.text, 9);
      
      if (this.viewMode === 'squad') {
        const sellPrice = Math.floor(p.getValue() * 0.95);
        const sellText = '预计售价: ' + this.formatCurrency(sellPrice) + ' 元';
        this.renderer.drawText(sellText, 500, 628, this.renderer.palette.green, 9);
      } else {
        const transferText = '转会费: ' + this.formatCurrency(p.transferPrice) + ' 元 | 周薪: ' + this.formatCurrency(p.contract.salary) + ' 元 | 合同: ' + p.contract.yearsRemaining + '年';
        this.renderer.drawText(transferText, 500, 628, this.renderer.palette.gold, 9);
      }
    }
    
    super.render();
  }
}
