class HonorWall extends Scene {
  constructor(game) {
    super(game);
    this.unlockedTrophies = {};
    this.selectedTrophy = null;
    this.filter = 'all';
    this.animationFrame = 0;
  }

  init() {
    super.init();
    this.loadTrophies();
    this.buildUI();
  }

  loadTrophies() {
    this.unlockedTrophies = Storage.load('player_trophies', {});
  }

  buildUI() {
    this.clearUIElements();
    
    this.drawButton(20, 20, 150, 40, '← 返回', () => this.game.goToScene('mainMenu'), 'default');
    
    ['all', 'league', 'cup', 'achievement', 'individual', 'youth'].forEach((type, index) => {
      const names = {
        all: '全部', league: '联赛', cup: '杯赛', 
        achievement: '成就', individual: '个人', youth: '青训'
      };
      this.drawButton(200 + index * 120, 20, 110, 40, names[type],
        () => { this.filter = type; this.buildUI();
        },
        this.filter === type ? 'primary' : 'default');
    });
  }

  getFilteredTrophies() {
    return TrophyData.trophies.filter(t => {
      if (this.filter === 'all') return true;
      return t.type === this.filter;
    });
  }

  selectTrophy(trophy) {
    this.selectedTrophy = trophy;
    this.buildUI();
  }

  update(deltaTime) {
    super.update(deltaTime);
    this.animationFrame++;
  }

  render() {
    this.renderer.clear();
    
    this.renderer.drawRect(0, 0, this.renderer.width, 80, '#2a2a4a');
    this.renderer.drawBorder(0, 0, this.renderer.width, 80, this.renderer.palette.border, 3);
    
    this.renderer.drawTextCentered('荣誉墙', 0, 20, this.renderer.width, this.renderer.palette.gold, 24);
    
    const unlockedCount = Object.keys(this.unlockedTrophies).length;
    const totalCount = TrophyData.trophies.length;
    this.renderer.drawTextCentered(`已解锁: ${unlockedCount}/${totalCount}`, 0, 55, this.renderer.width, this.renderer.palette.text, 12);
    
    const trophies = this.getFilteredTrophies();
    
    this.drawPanel(20, 90, 920, 530, '奖杯陈列室');
    
    const startX = 60;
    const startY = 110;
    const trophySize = 120;
    const padding = 30;
    const perRow = 6;
    
    trophies.forEach((trophy, index) => {
      const row = Math.floor(index / perRow);
      const col = index % perRow;
      const x = startX + col * (trophySize + padding);
      const y = startY + row * (trophySize + 40);
      
      const unlocked = !!this.unlockedTrophies[trophy.id];
      const isSelected = this.selectedTrophy?.id === trophy.id;
      
      if (isSelected) {
        this.renderer.drawRect(x - 5, y - 5, trophySize + 10, trophySize + 40, 'rgba(255, 204, 0, 0.2)');
        this.renderer.drawBorder(x - 5, y - 5, trophySize + 10, trophySize + 40, this.renderer.palette.gold, 2);
      }
      
      const scale = 4;
      this.renderer.drawTrophy(x + trophySize / 2 - 12 * scale / 2, y + 10, scale, unlocked);
      
      const rarityColor = TrophyData.rarityColors[trophy.rarity] || '#fff';
      
      if (unlocked) {
        this.renderer.drawTextCentered(trophy.name, x, y + trophySize - 20, trophySize, rarityColor, 8);
        const info = this.unlockedTrophies[trophy.id];
        this.renderer.drawTextCentered(`第${info.season}赛季`, x, y + trophySize, trophySize, this.renderer.palette.textMuted, 7);
      } else {
        this.renderer.drawTextCentered('???', x, y + trophySize - 20, trophySize, this.renderer.palette.textMuted, 8);
        this.renderer.drawTextCentered('未解锁', x, y + trophySize, trophySize, this.renderer.palette.textMuted, 7);
      }
      
      if (this.renderer.isPointInRect(this.events.mouseX, this.events.mouseY, x - 5, y - 5, trophySize + 10, trophySize + 40)) {
        this.showTooltip(trophy, unlocked);
      }
    });
    
    if (this.selectedTrophy) {
      this.drawPanel(20, 570, 920, 50, null);
      
      const t = this.selectedTrophy;
      const unlocked = !!this.unlockedTrophies[t.id];
      const rarityColor = TrophyData.rarityColors[t.rarity] || '#fff';
      
      this.renderer.drawText(t.name, 40, 580, rarityColor, 12);
      this.renderer.drawText(`[${this.getRarityName(t.rarity)}]`, 200, 582, rarityColor, 10);
      
      if (unlocked) {
        this.renderer.drawText(t.description, 40, 600, this.renderer.palette.text, 10);
        const info = this.unlockedTrophies[t.id];
        this.renderer.drawText(`获得时间: ${new Date(info.date).toLocaleDateString()}`, 600, 600, this.renderer.palette.textMuted, 9);
      } else {
        this.renderer.drawText(`解锁条件: ${t.description}`, 40, 600, this.renderer.palette.textMuted, 10);
      }
    }
    
    this.drawPanel(20, 625, 920, 10, null);
    this.renderer.drawText(`按ESC返回主菜单 | 点击奖杯查看详情`, 30, 628, this.renderer.palette.textMuted, 8);
    
    super.render();
  }

  getRarityName(rarity) {
    const names = {
      common: '普通',
      uncommon: '稀有',
      rare: '珍贵',
      legendary: '传说'
    };
    return names[rarity] || rarity;
  }

  showTooltip(trophy, unlocked) {
    const x = this.events.mouseX + 10;
    const y = this.events.mouseY + 10;
    
    const rarityColor = TrophyData.rarityColors[trophy.rarity] || '#fff';
    
    this.renderer.drawRect(x, y, 200, 80, 'rgba(26, 26, 46, 0.95)');
    this.renderer.drawBorder(x, y, 200, 80, rarityColor, 2);
    
    this.renderer.drawText(trophy.name, x + 10, y + 10, rarityColor, 10);
    this.renderer.drawText(`[${this.getRarityName(trophy.rarity)}]`, x + 10, y + 25, rarityColor, 8);
    this.renderer.drawText(trophy.description, x + 10, y + 45, this.renderer.palette.text, 8);
    
    if (unlocked) {
      const info = this.unlockedTrophies[trophy.id];
      this.renderer.drawText(`赛季: 第${info.season}赛季`, x + 10, y + 60, this.renderer.palette.green, 8);
    } else {
      this.renderer.drawText('未解锁', x + 10, y + 60, this.renderer.palette.red, 8);
    }
  }

  handleClick(e) {
    if (!this.active) return;
    
    super.handleClick(e);
    
    const trophies = this.getFilteredTrophies();
    const startX = 60;
    const startY = 110;
    const trophySize = 120;
    const padding = 30;
    const perRow = 6;
    
    trophies.forEach((trophy, index) => {
      const row = Math.floor(index / perRow);
      const col = index % perRow;
      const x = startX + col * (trophySize + padding);
      const y = startY + row * (trophySize + 40);
      
      if (this.renderer.isPointInRect(e.x, e.y, x - 5, y - 5, trophySize + 10, trophySize + 40)) {
        this.selectTrophy(trophy);
      }
    });
  }
}
