class Match {
  constructor(data) {
    this.id = data.id;
    this.round = data.round;
    this.home = data.home;
    this.away = data.away;
    this.homeTeam = data.homeTeam instanceof Team ? data.homeTeam : new Team(data.homeTeam);
    this.awayTeam = data.awayTeam instanceof Team ? data.awayTeam : new Team(data.awayTeam);
    this.played = data.played || false;
    this.homeScore = data.homeScore || 0;
    this.awayScore = data.awayScore || 0;
    this.date = data.date || 0;
    this.isCup = data.isCup || false;
    this.cupName = data.cupName || null;
    this.winner = data.winner || null;
    this.nextRound = data.nextRound || null;
    
    this.homeLineup = null;
    this.awayLineup = null;
    this.homeSubs = null;
    this.awaySubs = null;
    this.homeTactics = null;
    this.awayTactics = null;
    this.events = [];
    this.matchTime = 0;
    this.isLive = false;
    this.paused = false;
    this.homeGoalscorers = [];
    this.awayGoalscorers = [];
    this.substitutions = { home: [], away: [] };
    this.injuries = { home: [], away: [] };
  }

  setupMatch(homeLineup, awayLineup, homeTactics = null, awayTactics = null) {
    this.homeLineup = homeLineup;
    this.awayLineup = awayLineup;
    this.homeSubs = this.homeTeam.getSubstitutes();
    this.awaySubs = this.awayTeam.getSubstitutes();
    this.homeTactics = homeTactics || { ...this.homeTeam.tactics };
    this.awayTactics = awayTactics || { ...this.awayTeam.tactics };
  }

  simulateMinute() {
    if (this.matchTime >= 90) return null;
    
    this.matchTime++;
    
    const event = this.generateEvent();
    if (event) {
      this.events.push(event);
      
      if (event.type === 'goal') {
        if (event.team === 'home') {
          this.homeScore++;
          this.homeGoalscorers.push({ player: event.player, time: this.matchTime });
          event.player.scoreGoal();
          if (event.assistPlayer) {
            event.assistPlayer.getAssist();
          }
        } else {
          this.awayScore++;
          this.awayGoalscorers.push({ player: event.player, time: this.matchTime });
          event.player.scoreGoal();
          if (event.assistPlayer) {
            event.assistPlayer.getAssist();
          }
        }
      } else if (event.type === 'substitution') {
        this.substitutions[event.team].push({
          out: event.outPlayer,
          in: event.inPlayer,
          time: this.matchTime
        });
      } else if (event.type === 'injury') {
        this.injuries[event.team].push({
          player: event.player,
          time: this.matchTime,
          duration: event.duration
        });
      }
    }
    
    return event;
  }

  generateEvent() {
    const homeAttack = this.calculateAttackPower('home');
    const awayAttack = this.calculateAttackPower('away');
    const homeDefense = this.calculateDefensePower('home');
    const awayDefense = this.calculateDefensePower('away');
    
    const homeChance = (homeAttack / (homeAttack + awayDefense)) * 0.08;
    const awayChance = (awayAttack / (awayAttack + homeDefense)) * 0.08;
    
    const rand = Math.random();
    
    if (rand < homeChance) {
      return this.createGoalChance('home', homeAttack, awayDefense);
    } else if (rand < homeChance + awayChance) {
      return this.createGoalChance('away', awayAttack, homeDefense);
    }
    
    if (Math.random() < 0.02) {
      return { type: 'chance', time: this.matchTime, team: Math.random() < 0.5 ? 'home' : 'away', converted: false };
    }
    
    return null;
  }

  createGoalChance(team, attack, defense) {
    const scoringChance = attack / (attack + defense);
    const rand = Math.random();
    
    const lineup = team === 'home' ? this.homeLineup : this.awayLineup;
    const attackingPlayers = lineup.filter(p => p.positionShort !== 'GK');
    const assistPlayers = lineup.filter(p => p.positionShort !== 'GK');
    
    const scoringPlayer = attackingPlayers[Math.floor(Math.random() * attackingPlayers.length)];
    const assistPlayer = Math.random() < 0.6 ? assistPlayers[Math.floor(Math.random() * assistPlayers.length)] : null;
    
    if (rand < scoringChance) {
      return {
        type: 'goal',
        time: this.matchTime,
        team,
        player: scoringPlayer,
        assistPlayer: assistPlayer !== scoringPlayer ? assistPlayer : null,
        converted: true
      };
    }
    
    return {
      type: 'chance',
      time: this.matchTime,
      team,
      player: scoringPlayer,
      converted: false
    };
  }

  calculateAttackPower(team) {
    const lineup = team === 'home' ? this.homeLineup : this.awayLineup;
    const tactics = team === 'home' ? this.homeTactics : this.awayTactics;
    const isHome = team === 'home';
    
    let attack = 0;
    lineup.forEach((player, index) => {
      const positionBonus = this.getPositionAttackBonus(player.positionShort, index, lineup.length);
      const playerAttack = (player.strength * 0.4 + player.speed * 0.3 + player.teamwork * 0.3);
      const fitness = 1 - (player.fatigue / 200);
      const morale = player.morale / 100;
      const form = 0.7 + (player.form / 100) * 0.6;
      
      attack += playerAttack * positionBonus * fitness * morale * form;
    });
    
    attack = attack / lineup.length * 10;
    
    const tacticsBonus = 0.8 + (tactics.attacking / 100) * 0.4;
    const homeBonus = isHome ? 1.1 : 1;
    const formationBonus = this.getFormationAttackBonus(tactics.formation);
    
    return attack * tacticsBonus * homeBonus * formationBonus;
  }

  calculateDefensePower(team) {
    const lineup = team === 'home' ? this.homeLineup : this.awayLineup;
    const tactics = team === 'home' ? this.homeTactics : this.awayTactics;
    const isHome = team === 'home';
    
    let defense = 0;
    lineup.forEach((player, index) => {
      const positionBonus = this.getPositionDefenseBonus(player.positionShort, index, lineup.length);
      const playerDefense = (player.strength * 0.5 + player.teamwork * 0.3 + player.speed * 0.2);
      const fitness = 1 - (player.fatigue / 200);
      const morale = player.morale / 100;
      const form = 0.7 + (player.form / 100) * 0.6;
      
      defense += playerDefense * positionBonus * fitness * morale * form;
    });
    
    defense = defense / lineup.length * 10;
    
    const tacticsBonus = 0.8 + (tactics.defensive / 100) * 0.4;
    const homeBonus = isHome ? 1.05 : 1;
    const formationBonus = this.getFormationDefenseBonus(tactics.formation);
    
    return defense * tacticsBonus * homeBonus * formationBonus;
  }

  getPositionAttackBonus(position, index, total) {
    const bonuses = {
      'FW': 1.4,
      'MF': 1.0,
      'DF': 0.6,
      'GK': 0.1
    };
    return bonuses[position] || 0.8;
  }

  getPositionDefenseBonus(position, index, total) {
    const bonuses = {
      'FW': 0.5,
      'MF': 0.9,
      'DF': 1.4,
      'GK': 1.8
    };
    return bonuses[position] || 0.8;
  }

  getFormationAttackBonus(formation) {
    const bonuses = {
      '4-3-3': 1.1,
      '4-4-2': 1.0,
      '3-5-2': 1.05,
      '5-3-2': 0.9,
      '4-2-3-1': 1.0
    };
    return bonuses[formation] || 1.0;
  }

  getFormationDefenseBonus(formation) {
    const bonuses = {
      '4-3-3': 0.95,
      '4-4-2': 1.0,
      '3-5-2': 0.95,
      '5-3-2': 1.15,
      '4-2-3-1': 1.05
    };
    return bonuses[formation] || 1.0;
  }

  makeSubstitution(team, outPlayer, inPlayer) {
    const subs = team === 'home' ? this.homeSubs : this.awaySubs;
    const lineup = team === 'home' ? this.homeLineup : this.awayLineup;
    const maxSubs = this.isCup ? 5 : 3;
    const currentSubs = this.substitutions[team].length;
    
    if (currentSubs >= maxSubs) {
      return { success: false, message: '已用完换人名额' };
    }
    
    const outIndex = lineup.findIndex(p => p.id === outPlayer.id);
    const inIndex = subs.findIndex(p => p.id === inPlayer.id);
    
    if (outIndex === -1 || inIndex === -1) {
      return { success: false, message: '球员不在阵容中' };
    }
    
    lineup[outIndex] = inPlayer;
    subs.splice(inIndex, 1);
    subs.push(outPlayer);
    
    this.events.push({
      type: 'substitution',
      time: this.matchTime,
      team,
      outPlayer,
      inPlayer
    });
    
    return { success: true, outPlayer, inPlayer };
  }

  changeTactics(team, newTactics) {
    if (team === 'home') {
      this.homeTactics = { ...this.homeTactics, ...newTactics };
    } else {
      this.awayTactics = { ...this.awayTactics, ...newTactics };
    }
    
    this.events.push({
      type: 'tactics',
      time: this.matchTime,
      team,
      tactics: newTactics
    });
  }

  simulateFullMatch() {
    while (this.matchTime < 90) {
      this.simulateMinute();
    }
    return this.getResult();
  }

  finalize() {
    this.played = true;
    
    if (this.homeScore > this.awayScore) {
      this.winner = this.home;
    } else if (this.awayScore > this.homeScore) {
      this.winner = this.away;
    } else {
      this.winner = this.isCup ? (Math.random() < 0.5 ? this.home : this.away) : null;
    }
    
    this.homeLineup.forEach(p => p.playMatch());
    this.awayLineup.forEach(p => p.playMatch());
    
    if (this.homeScore === 0) {
      const awayGK = this.awayLineup.find(p => p.positionShort === 'GK');
      if (awayGK) awayGK.keepCleanSheet();
    }
    if (this.awayScore === 0) {
      const homeGK = this.homeLineup.find(p => p.positionShort === 'GK');
      if (homeGK) homeGK.keepCleanSheet();
    }
    
    if (this.nextRound && this.winner) {
      const winnerTeam = this.winner === this.home ? this.homeTeam : this.awayTeam;
      this.nextRound.push(winnerTeam);
    }
    
    return this.getResult();
  }

  getResult() {
    return {
      id: this.id,
      round: this.round,
      home: this.home,
      away: this.away,
      homeTeam: { name: this.homeTeam.name, shortName: this.homeTeam.shortName },
      awayTeam: { name: this.awayTeam.name, shortName: this.awayTeam.shortName },
      homeScore: this.homeScore,
      awayScore: this.awayScore,
      winner: this.winner,
      played: this.played,
      isCup: this.isCup,
      homeGoalscorers: this.homeGoalscorers.map(g => ({ name: g.player.name, time: g.time })),
      awayGoalscorers: this.awayGoalscorers.map(g => ({ name: g.player.name, time: g.time })),
      events: this.events.length
    };
  }

  getScoreText() {
    return `${this.homeScore} - ${this.awayScore}`;
  }

  toJSON() {
    return {
      id: this.id,
      round: this.round,
      home: this.home,
      away: this.away,
      homeTeam: this.homeTeam.toJSON(),
      awayTeam: this.awayTeam.toJSON(),
      played: this.played,
      homeScore: this.homeScore,
      awayScore: this.awayScore,
      date: this.date,
      isCup: this.isCup,
      cupName: this.cupName,
      winner: this.winner
    };
  }

  static fromJSON(data) {
    return new Match(data);
  }
}
