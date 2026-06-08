class MatchDay extends Scene {
  constructor(game) {
    super(game);
    this.currentMatch = null;
    this.selectedPlayers = [];
    this.substitutes = [];
    this.tactics = {
      formation: '4-3-3',
      attacking: 50,
      defensive: 50,
      pressing: 50,
      pace: 50
    };
    this.phase = 'setup';
    this.matchEvents = [];
    this.matchTime = 0;
    this.liveMatch = null;
    this.simulationSpeed = 1;
    this.isPaused = false;
    this.animationFrame = 0;
    this.availableFormations = ['4-3-3', '4-4-2', '3-5-2', '5-3-2', '4-2-3-1'];
  }

  init() {
    super.init();
    this.phase = 'setup';
    this.matchTime = 0;
    this.matchEvents = [];
    this.selectedPlayers = [];
    this.substitutes = [];
    
    const team = this.getPlayerTeam();
    if (team) {
      this.tactics = { ...team.tactics };
    }
    
    if (this.game.season) {
      const nextMatch = this.game.season.getNextMatch();
      if (nextMatch) {
        this.currentMatch = nextMatch;
        this.autoSelectBest11();
      }
    }
    
    this.buildUI();
  }

  autoSelectBest11() {
    const team = this.getPlayerTeam();
    if (!team) return;
    
    this.selectedPlayers = team.getBest11();
    this.substitutes = team.getSubstitutes();
  }

  buildUI() {
    this.clearUIElements();
    
    const team = this.getPlayerTeam();
    if (!team) return;
    
    this.drawButton(20, 20, 150, 40, '← 返回', () => this.game.goToScene('mainMenu'), 'default');
    
    if (this.phase === 'setup') {
      this.drawButton(790, 20, 150, 40, '开始比赛', () => this.startMatch(), 
        this.selectedPlayers.length === 11 ? 'primary' : 'default');
      
      this.drawButton(790, 70, 150, 40, '自动选择', () => this.autoSelectBest11(), 'default');
      
      this.availableFormations.forEach((formation, index) => {
        this.drawButton(200 + index * 120, 20, 110, 40, formation,
          () => { this.tactics.formation = formation; this.buildUI();
          },
          this.tactics.formation === formation ? 'primary' : 'default');
      });
      
      this.drawButton(790, 130, 150, 30, '进攻 +', () => { 
        this.tactics.attacking = Math.min(100, this.tactics.attacking + 10); this.buildUI();
      }, 'default');
      this.drawButton(790, 170, 150, 30, '防守 +', () => { 
        this.tactics.defensive = Math.min(100, this.tactics.defensive + 10); this.buildUI();
      }, 'default');
      
    } else if (this.phase === 'live' || this.phase === 'result') {
      this.drawButton(790, 20, 150, 40, '暂停/继续', () => this.togglePause(), 'default');
      this.drawButton(790, 70, 150, 40, '加速', () => this.changeSpeed(), 'default');
      
      if (this.phase === 'result') {
        this.drawButton(790, 120, 150, 40, '继续', () => this.continueAfterMatch(), 'primary');
      }
    }
    
    this.buildPlayerSelectionUI();
  }

  buildPlayerSelectionUI() {
    const team = this.getPlayerTeam();
    if (!team) return;
    
    const available = team.squad.filter(p => p.injury === 0);
    
    const startY = 180;
    const cardWidth = 140;
    const cardHeight = 80;
    const padding = 10;
    const perRow = 6;
    
    available.forEach((player, index) => {
      const row = Math.floor(index / perRow);
      const col = index % perRow;
      const x = 20 + col * (cardWidth + padding);
      const y = startY + row * (cardHeight + padding);
      
      const isSelected = this.selectedPlayers.find(p => p.id === player.id);
      const isSub = this.substitutes.find(p => p.id === player.id);
      
      this.drawButton(x, y, cardWidth, cardHeight, '',
        () => this.togglePlayerSelection(player),
        isSelected ? 'primary' : (isSub ? 'default' : 'default'));
    });
  }

  togglePlayerSelection(player) {
    const inSelected = this.selectedPlayers.findIndex(p => p.id === player.id);
    const inSubs = this.substitutes.findIndex(p => p.id === player.id);
    
    if (inSelected > -1) {
      this.selectedPlayers.splice(inSelected, 1);
      this.substitutes.push(player);
    } else if (inSubs > -1) {
      this.substitutes.splice(inSubs, 1);
    } else {
      if (this.selectedPlayers.length < 11) {
        this.selectedPlayers.push(player);
      } else if (this.substitutes.length < 5) {
        this.substitutes.push(player);
      }
    }
    
    this.buildUI();
  }

  startMatch() {
    if (this.selectedPlayers.length !== 11) {
      this.showNotification('请选择11名首发球员', 'warning');
      return;
    }
    
    const team = this.getPlayerTeam();
    team.setTactics(this.tactics);
    
    this.phase = 'live';
    this.matchTime = 0;
    this.matchEvents = [];
    
    const nextMatch = this.game.season.getNextMatch();
    this.liveMatch = new Match(nextMatch);
    
    const isHome = nextMatch.home === this.game.season.getPlayerTeam().id;
    
    const awayLineup = this.game.season.generateAILineup(
      isHome ? nextMatch.awayTeam : nextMatch.homeTeam
    );
    const awayTactics = this.game.season.generateAITactics(
      isHome ? nextMatch.awayTeam : nextMatch.homeTeam
    );
    
    if (isHome) {
      this.liveMatch.setupMatch(this.selectedPlayers, awayLineup, this.tactics, awayTactics);
    } else {
      this.liveMatch.setupMatch(awayLineup, this.selectedPlayers, awayTactics, this.tactics);
    }
    
    this.buildUI();
  }

  togglePause() {
    this.isPaused = !this.isPaused;
    this.showNotification(this.isPaused ? '比赛暂停' : '比赛继续', 'info');
  }

  changeSpeed() {
    this.simulationSpeed = this.simulationSpeed === 1 ? 2 : (this.simulationSpeed === 2 ? 5 : 1);
    this.showNotification(`比赛速度: ${this.simulationSpeed}x`, 'info');
  }

  update(deltaTime) {
    super.update(deltaTime);
    this.animationFrame++;
    
    if (this.phase === 'live' && !this.isPaused && this.liveMatch) {
      if (this.animationFrame % Math.max(1, Math.floor(30 / this.simulationSpeed)) === 0) {
        for (let i = 0; i < this.simulationSpeed; i++) {
          const event = this.liveMatch.simulateMinute();
          this.matchTime = this.liveMatch.matchTime;
          
          if (event) {
            this.matchEvents.push(event);
            if (event.type === 'goal') {
              const teamName = event.team === 'home' ? 
                this.liveMatch.homeTeam.shortName : 
                this.liveMatch.awayTeam.shortName;
              const goalMsg = event.time + "' " + teamName + ' 进球! ' + event.player.name;
              const isHomeTeam = this.currentMatch.home === this.game.season.getPlayerTeam().id;
              const goalType = (event.team === 'home') === isHomeTeam ? 'success' : 'error';
              this.showNotification(goalMsg, goalType, 2000);
            }
          }
          
          if (this.liveMatch.matchTime >= 90) {
            this.endMatch();
            break;
          }
        }
      }
    }
  }

  endMatch() {
    this.phase = 'result';
    const result = this.liveMatch.finalize();
    
    const nextMatch = this.game.season.getNextMatch();
    const isCup = nextMatch && nextMatch.isCup === true;
    
    nextMatch.played = true;
    nextMatch.homeScore = this.liveMatch.homeScore;
    nextMatch.awayScore = this.liveMatch.awayScore;
    nextMatch.winner = this.liveMatch.winner;
    
    this.game.season.stats.totalMatches++;
    this.game.season.stats.totalGoals += this.liveMatch.homeScore + this.liveMatch.awayScore;
    
    let cleanSheetCount = 0;
    if (this.liveMatch.homeScore === 0) cleanSheetCount++;
    if (this.liveMatch.awayScore === 0) cleanSheetCount++;
    this.game.season.stats.cleanSheets += cleanSheetCount;
    
    this.game.season.updateCleanSheetStats(this.liveMatch, true);
    
    if (isCup && this.liveMatch.winner) {
      const loserId = this.liveMatch.winner === this.liveMatch.home ? this.liveMatch.away : this.liveMatch.home;
      this.game.season.cupTeamStatus[loserId] = 'eliminated';
      this.game.season.checkAndGenerateNextCupRound();
    }
    
    if (!isCup) {
      this.game.season.updateLeagueTable();
    }
    
    this.game.saveGame();
    
    this.buildUI();
  }

  continueAfterMatch() {
    const isCupMatch = this.currentMatch && this.currentMatch.isCup === true;
    
    this.game.season.simulateRestOfRound(this.currentMatch.id);
    
    if (!isCupMatch) {
      const advanceResult = this.game.season.advanceRound();
      
      if (this.game.season.currentRound >= this.game.season.totalRounds) {
        const endResult = this.game.season.endSeason();
        
        let message = `赛季结束！\n排名: 第${endResult.seasonResult.finalPosition}名\n积分: ${endResult.seasonResult.points}分\n奖金: ${this.formatCurrency(endResult.rewards.total)}元`;
        
        if (endResult.trophies.length > 0) {
          const trophyNames = endResult.trophies.map(t => t.name).join(', ');
          message += `\n\n解锁奖杯: ${trophyNames}`;
        }
        
        alert(message);
        
        if (confirm('是否开始新赛季？')) {
          const newSeason = this.game.season.getNextSeason(this.getPlayerTeam());
          this.game.season = newSeason;
          this.game.saveGame();
          this.game.goToScene('mainMenu');
        } else {
          this.game.goToScene('mainMenu');
        }
      } else {
        this.showNotification(`第${advanceResult.nextRound}轮开始！`, 'info');
        this.game.season.advanceWeek();
        this.game.saveGame();
        this.init();
      }
    } else {
      const hasMoreCupMatches = this.game.season.getNextCupMatch() !== null;
      const hasMoreLeagueMatches = this.game.season.getNextMatch() !== null;
      
      if (hasMoreCupMatches || hasMoreLeagueMatches) {
        const cupRound = this.game.season.getCupRound();
        const roundText = cupRound ? `杯赛第${cupRound}轮` : '下一场比赛';
        this.showNotification(`${roundText}即将开始！`, 'info');
        this.game.season.advanceWeek();
        this.game.saveGame();
        this.init();
      } else {
        this.game.season.advanceWeek();
        this.game.saveGame();
        this.game.goToScene('mainMenu');
      }
    }
  }

  render() {
    this.renderer.clear();
    
    if (this.phase === 'setup') {
      this.renderSetupPhase();
    } else if (this.phase === 'live' || this.phase === 'result') {
      this.renderLiveMatch();
    }
    
    super.render();
  }

  renderSetupPhase() {
    this.renderer.drawRect(0, 0, this.renderer.width, 170, '#2a2a4a');
    this.renderer.drawBorder(0, 0, this.renderer.width, 170, this.renderer.palette.border, 3);
    
    const isCup = this.currentMatch && this.currentMatch.isCup === true;
    const titleText = isCup ? `比赛日 - ${this.currentMatch.cupName || '杯赛'}` : '比赛日 - 赛前准备';
    this.renderer.drawTextCentered(titleText, 0, 15, this.renderer.width, this.renderer.palette.gold, 18);
    
    if (this.currentMatch) {
      const isHome = this.currentMatch.home === this.game.season.getPlayerTeam().id;
      const homeTeam = this.currentMatch.homeTeam;
      const awayTeam = this.currentMatch.awayTeam;
      const playerTeam = this.game.season.getPlayerTeam();
      
      if (isCup) {
        const cupRound = this.game.season.getCupRound();
        if (cupRound) {
          this.renderer.drawTextCentered(`第${cupRound}轮`, 0, 40, this.renderer.width, this.renderer.palette.cyan, 10);
        }
      }
      
      this.renderer.drawText(homeTeam.name, 100, 60, this.renderer.palette.text, 14);
      this.renderer.drawText(`VS`, 450, 60, this.renderer.palette.gold, 20);
      this.renderer.drawText(awayTeam.name, 650, 60, this.renderer.palette.text, 14);
      
      this.renderer.drawText(`主场`, 100, 85, this.renderer.palette.textMuted, 10);
      this.renderer.drawText(`客场`, 650, 85, this.renderer.palette.textMuted, 10);
      
      const homeStrength = Math.floor(TeamData.calculateTeamStrength(homeTeam));
      const awayStrength = Math.floor(TeamData.calculateTeamStrength(awayTeam));
      
      this.renderer.drawText(`实力: ${homeStrength}`, 100, 110, this.renderer.palette.gold, 12);
      this.renderer.drawText(`实力: ${awayStrength}`, 650, 110, this.renderer.palette.gold, 12);
      
      this.renderer.drawText(`阵型: ${this.tactics.formation}`, 100, 135, this.renderer.palette.text, 10);
      this.renderer.drawText(`进攻: ${this.tactics.attacking}`, 250, 135, '#ff4444', 10);
      this.renderer.drawText(`防守: ${this.tactics.defensive}`, 380, 135, '#44ff44', 10);
    }
    
    const panelTitle = `选择首发球员 (${this.selectedPlayers.length}/11)`;
    this.drawPanel(20, 170, 920, 450, panelTitle);
    
    const team = this.getPlayerTeam();
    if (!team) return;
    
    const available = team.squad.filter(p => p.injury === 0);
    
    const startY = 190;
    const cardWidth = 140;
    const cardHeight = 80;
    const padding = 10;
    const perRow = 6;
    
    available.forEach((player, index) => {
      const row = Math.floor(index / perRow);
      const col = index % perRow;
      const x = 20 + col * (cardWidth + padding);
      const y = startY + row * (cardHeight + padding);
      
      const isSelected = this.selectedPlayers.find(p => p.id === player.id);
      const isSub = this.substitutes.find(p => p.id === player.id);
      
      if (isSelected) {
        this.renderer.drawPanel(x, y, cardWidth, cardHeight, null);
        this.renderer.drawBorder(x, y, cardWidth, cardHeight, this.renderer.palette.gold, 3);
      } else if (isSub) {
        this.renderer.drawPanel(x, y, cardWidth, cardHeight, null);
        this.renderer.drawBorder(x, y, cardWidth, cardHeight, this.renderer.palette.blue, 2);
      } else {
        this.renderer.drawPanel(x, y, cardWidth, cardHeight, null);
      }
      
      this.renderer.drawPixelPlayer(x + 5, y + 5, 1, 1.5);
      
      this.renderer.drawText(player.name, x + 35, y + 10, this.renderer.palette.text, 9);
      this.renderer.drawText(`${player.positionShort}`, x + 35, y + 25, this.renderer.palette.textMuted, 8);
      this.renderer.drawText(`能力: ${player.overall}`, x + 35, y + 40, this.renderer.palette.gold, 9);
      
      this.renderer.drawStatBar(x + 5, y + 55, 60, 8, player.fatigue, 100, '#ffaa00');
      this.renderer.drawStatBar(x + 70, y + 55, 60, 8, player.morale, 100, '#ff44ff');
      
      if (isSelected) {
        this.renderer.drawText('首发', x + 110, y + 55, this.renderer.palette.green, 7);
      } else if (isSub) {
        this.renderer.drawText('替补', x + 110, y + 55, this.renderer.palette.blue, 7);
      }
    });
    
    this.drawPanel(20, 625, 920, 10, null);
    this.renderer.drawText(`已选首发: ${this.selectedPlayers.length}/11 | 替补: ${this.substitutes.length}/5`, 30, 628, this.renderer.palette.text, 9);
    
    const positions = TeamData.getFormationPositions(this.tactics.formation);
    const positionCounts = {};
    this.selectedPlayers.forEach(p => {
      positionCounts[p.positionShort] = (positionCounts[p.positionShort] || 0) + 1;
    });
    
    let posText = '阵容: ';
    ['GK', 'DF', 'MF', 'FW'].forEach(pos => {
      posText += pos + ':' + (positionCounts[pos] || 0) + ' ';
    });
    this.renderer.drawText(posText, 300, 628, this.renderer.palette.text, 9);
  }

  renderLiveMatch() {
    this.renderer.drawStadiumBackground();
    
    this.renderer.drawRect(0, 0, this.renderer.width, 80, 'rgba(26, 26, 46, 0.95)');
    this.renderer.drawBorder(0, 0, this.renderer.width, 80, this.renderer.palette.border, 3);
    
    if (this.liveMatch) {
      const homeTeam = this.liveMatch.homeTeam;
      const awayTeam = this.liveMatch.awayTeam;
      
      this.renderer.drawText(homeTeam.shortName, 150, 25, this.renderer.palette.text, 16);
      const homeScore = this.liveMatch.homeScore.toString();
      const awayScore = this.liveMatch.awayScore.toString();
      this.renderer.drawText(homeScore, 350, 20, this.renderer.palette.gold, 28);
      this.renderer.drawText(awayScore, 570, 20, this.renderer.palette.gold, 28);
      this.renderer.drawText(awayTeam.shortName, 720, 25, this.renderer.palette.text, 16);
      
      const timeText = this.matchTime + "'";
      const timeColor = this.phase === 'result' ? this.renderer.palette.red : this.renderer.palette.text;
      this.renderer.drawTextCentered(timeText, 0, 55, this.renderer.width, timeColor, 12);
      
      if (this.isPaused) {
        this.renderer.drawTextCentered('暂停', 0, 55, this.renderer.palette.yellow, 12);
      }
      
      this.renderer.drawText(`阵型: ${this.liveMatch.homeTactics.formation}`, 150, 55, this.renderer.palette.textMuted, 9);
      this.renderer.drawText(`阵型: ${this.liveMatch.awayTactics.formation}`, 700, 55, this.renderer.palette.textMuted, 9);
      
      const homeX = 100;
      const awayX = 820;
      
      for (let i = 0; i < this.liveMatch.homeLineup.length; i++) {
        const homePlayer = this.liveMatch.homeLineup[i];
        const awayPlayer = this.liveMatch.awayLineup[i];
        const y = 120 + (i % 4) * 45;
        
        if (homePlayer) {
          this.renderer.drawPixelPlayer(homeX, y, homeTeam.color, 2);
          this.renderer.drawText(homePlayer.name, homeX + 30, y + 10, this.renderer.palette.text, 8);
        }
        if (awayPlayer) {
          this.renderer.drawPixelPlayer(awayX, y, awayTeam.color, 2);
          this.renderer.drawText(awayPlayer.name, awayX - 80, y + 10, this.renderer.palette.text, 8);
        }
      }
    }
    
    this.drawPanel(200, 420, 560, 200, '比赛事件');
    
    const recentEvents = this.matchEvents.slice(-8);
    recentEvents.forEach((event, index) => {
      const y = 440 + index * 22;
      let text = '';
      let color = this.renderer.palette.text;
      
      if (event.type === 'goal') {
        const teamName = event.team === 'home' ? 
          this.liveMatch.homeTeam.shortName : 
          this.liveMatch.awayTeam.shortName;
        text = event.time + "' " + teamName + ' 进球! ' + event.player.name;
        color = event.team === 'home' === (this.currentMatch.home === this.game.season.getPlayerTeam().id) ? 
          this.renderer.palette.green : this.renderer.palette.red;
      } else if (event.type === 'chance') {
        const teamName = event.team === 'home' ? 
          this.liveMatch.homeTeam.shortName : 
          this.liveMatch.awayTeam.shortName;
        const chanceResult = event.converted ? '进球!' : '偏出';
        text = event.time + "' " + teamName + ' 射门...' + chanceResult;
      } else if (event.type === 'substitution') {
        text = event.time + "' 换人: " + event.outPlayer.name + ' → ' + event.inPlayer.name;
        color = this.renderer.palette.blue;
      }
      
      this.renderer.drawText(text, 210, y, color, 9);
    });
    
    if (this.phase === 'result') {
      this.renderer.drawRect(280, 200, 400, 150, 'rgba(0, 0, 0, 0.9)');
      this.renderer.drawBorder(280, 200, 400, 150, this.renderer.palette.gold, 3);
      
      const result = this.liveMatch.getResult();
      const isWin = result.winner === this.game.season.getPlayerTeam().id;
      const isDraw = result.winner === null;
      
      let resultText, resultColor;
      if (isDraw) {
        resultText = '平局!';
        resultColor = this.renderer.palette.yellow;
      } else if (isWin) {
        resultText = '胜利!';
        resultColor = this.renderer.palette.green;
      } else {
        resultText = '失败';
        resultColor = this.renderer.palette.red;
      }
      
      this.renderer.drawTextCentered(resultText, 280, 230, 400, resultColor, 24);
      this.renderer.drawTextCentered(`${result.homeTeam.shortName} ${result.homeScore} - ${result.awayScore} ${result.awayTeam.shortName}`, 280, 270, 400, this.renderer.palette.text, 14);
      
      if (result.homeGoalscorers.length > 0) {
        const homeScorers = result.homeGoalscorers.map(g => `${g.name} ${g.time}'`).join(', ');
        this.renderer.drawText(`进球: ${homeScorers}`, 300, 300, this.renderer.palette.green, 10);
      }
      if (result.awayGoalscorers.length > 0) {
        const awayScorers = result.awayGoalscorers.map(g => `${g.name} ${g.time}'`).join(', ');
        this.renderer.drawText(`进球: ${awayScorers}`, 300, 320, this.renderer.palette.red, 10);
      }
    }
  }
}
