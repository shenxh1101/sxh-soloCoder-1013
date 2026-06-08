class Team {
  constructor(data) {
    this.id = data.id;
    this.name = data.name;
    this.shortName = data.shortName;
    this.color = data.color;
    this.city = data.city;
    this.squad = data.squad.map(p => p instanceof Player ? p : new Player(p));
    this.tactics = data.tactics || {
      formation: '4-3-3',
      attacking: 50,
      defensive: 50,
      pressing: 50,
      pace: 50
    };
    this.budget = data.budget || 5000000;
    this.reputation = data.reputation || 50;
    this.youthAcademy = data.youthAcademy || 3;
    this.trainingFacilities = data.trainingFacilities || 3;
    this.stadiumCapacity = data.stadiumCapacity || 30000;
    this.leaguePosition = data.leaguePosition || 0;
    this.points = data.points || 0;
    this.goalsFor = data.goalsFor || 0;
    this.goalsAgainst = data.goalsAgainst || 0;
    this.wins = data.wins || 0;
    this.draws = data.draws || 0;
    this.losses = data.losses || 0;
    this.isPlayerTeam = data.isPlayerTeam || false;
    this.tacticsHistory = data.tacticsHistory || [];
    this.transferHistory = data.transferHistory || [];
  }

  getBest11() {
    return TeamData.getBest11(this.squad, this.tactics.formation);
  }

  getSubstitutes() {
    const best11 = this.getBest11();
    return TeamData.getSubstitutes(this.squad, best11);
  }

  getAvailablePlayers() {
    return this.squad.filter(p => p.injury === 0);
  }

  getInjuredPlayers() {
    return this.squad.filter(p => p.injury > 0);
  }

  getAverageStats() {
    if (this.squad.length === 0) {
      return { strength: 0, speed: 0, teamwork: 0, overall: 0, morale: 0, fatigue: 0 };
    }

    const sum = this.squad.reduce((acc, p) => ({
      strength: acc.strength + p.strength,
      speed: acc.speed + p.speed,
      teamwork: acc.teamwork + p.teamwork,
      overall: acc.overall + p.overall,
      morale: acc.morale + p.morale,
      fatigue: acc.fatigue + p.fatigue
    }), { strength: 0, speed: 0, teamwork: 0, overall: 0, morale: 0, fatigue: 0 });

    return {
      strength: Math.floor(sum.strength / this.squad.length),
      speed: Math.floor(sum.speed / this.squad.length),
      teamwork: Math.floor(sum.teamwork / this.squad.length),
      overall: Math.floor(sum.overall / this.squad.length),
      morale: Math.floor(sum.morale / this.squad.length),
      fatigue: Math.floor(sum.fatigue / this.squad.length)
    };
  }

  getStrength() {
    return TeamData.calculateTeamStrength(this);
  }

  trainPlayer(playerId, type, intensity = 1) {
    const player = this.squad.find(p => p.id === playerId);
    if (!player) return { success: false, message: '球员不存在' };

    const facilityBonus = 1 + (this.trainingFacilities - 1) * 0.1;
    const adjustedIntensity = intensity * facilityBonus;
    
    const result = player.train(type, adjustedIntensity);
    return result;
  }

  trainAll(type, intensity = 1) {
    const results = [];
    const available = this.getAvailablePlayers();
    
    available.forEach(player => {
      const result = this.trainPlayer(player.id, type, intensity);
      results.push({ player, result });
    });
    
    return results;
  }

  restAll() {
    const results = [];
    this.squad.forEach(player => {
      const result = player.rest();
      results.push({ player, result });
    });
    return results;
  }

  buyPlayer(player, price) {
    if (this.budget < price) {
      return { success: false, message: '预算不足' };
    }

    if (this.squad.length >= 25) {
      return { success: false, message: '阵容已满（最多25人）' };
    }

    this.budget -= price;
    this.squad.push(player);
    this.transferHistory.push({
      type: 'buy',
      player: player.name,
      playerId: player.id,
      price,
      date: Date.now()
    });

    return { success: true, player, price };
  }

  sellPlayer(playerId, price) {
    const playerIndex = this.squad.findIndex(p => p.id === playerId);
    if (playerIndex === -1) {
      return { success: false, message: '球员不存在' };
    }

    const player = this.squad[playerIndex];
    if (player.contract.yearsRemaining <= 0) {
      return { success: false, message: '合同已到期球员无法出售' };
    }

    this.budget += price;
    this.squad.splice(playerIndex, 1);
    this.transferHistory.push({
      type: 'sell',
      player: player.name,
      playerId: player.id,
      price,
      date: Date.now()
    });

    return { success: true, player, price };
  }

  renewPlayerContract(playerId, years = 2, salaryIncrease = 0.1) {
    const player = this.squad.find(p => p.id === playerId);
    if (!player) return { success: false, message: '球员不存在' };

    const totalCost = player.contract.salary * (1 + salaryIncrease) * years * 52;
    if (this.budget < totalCost) {
      return { success: false, message: '预算不足以支付新合同' };
    }

    const result = player.renewContract(years, salaryIncrease);
    return { success: true, player, ...result };
  }

  setTactics(newTactics) {
    this.tactics = { ...this.tactics, ...newTactics };
    this.tacticsHistory.push({
      tactics: { ...this.tactics },
      date: Date.now()
    });
  }

  getWeeklyWageBill() {
    return this.squad.reduce((sum, p) => sum + p.weeklySalaryCost(), 0);
  }

  getWeeklyIncome() {
    const ticketIncome = Math.floor(this.stadiumCapacity * 15 * 0.4);
    const sponsorship = Math.floor(this.reputation * 5000);
    return ticketIncome + sponsorship;
  }

  processWeeklyFinances() {
    const wages = this.getWeeklyWageBill();
    const income = this.getWeeklyIncome();
    const net = income - wages;
    
    this.budget += net;
    
    return {
      income,
      wages,
      net,
      budget: this.budget
    };
  }

  processSeasonEnd(seasonResult) {
    const rewards = LeagueData.getSeasonRewards(this, seasonResult.leagueTier);
    this.budget += rewards.total;
    
    this.squad.forEach(player => {
      player.age++;
      player.contract.yearsRemaining--;
      
      if (player.age > 25) {
        const declineChance = (player.age - 25) * 0.1;
        if (Math.random() < declineChance) {
          player.strength = Math.max(1, player.strength - 1);
          player.speed = Math.max(1, player.speed - 1);
        }
      }
      
      if (player.age < 23 && player.overall < player.potential) {
        const growth = 0.5 + Math.random() * 1;
        player.strength = Math.min(99, player.strength + growth * 0.4);
        player.speed = Math.min(99, player.speed + growth * 0.4);
        player.teamwork = Math.min(99, player.teamwork + growth * 0.2);
      }
      
      player.updateOverall();
      player.goals = 0;
      player.assists = 0;
      player.cleanSheets = 0;
      player.appearances = 0;
      player.form = 50 + Math.floor(Math.random() * 20);
      player.fatigue = Math.max(0, player.fatigue - 30);
      player.morale = Math.min(100, player.morale + 10);
    });

    return rewards;
  }

  upgradeFacility(type) {
    const costs = {
      youthAcademy: [0, 500000, 1000000, 2000000, 4000000],
      trainingFacilities: [0, 400000, 800000, 1600000, 3200000],
      stadium: [0, 1000000, 2000000, 4000000, 8000000]
    };

    const currentLevel = type === 'stadium' ? Math.floor(this.stadiumCapacity / 10000) : this[type];
    
    if (currentLevel >= 5) {
      return { success: false, message: '已达到最高等级' };
    }

    const cost = costs[type][currentLevel];
    if (this.budget < cost) {
      return { success: false, message: '预算不足' };
    }

    this.budget -= cost;
    
    if (type === 'stadium') {
      this.stadiumCapacity += 10000;
    } else {
      this[type]++;
    }

    return { success: true, type, newLevel: type === 'stadium' ? this.stadiumCapacity : this[type], cost };
  }

  promoteYouthPlayer() {
    const youthQuality = 40 + this.youthAcademy * 8 + Math.floor(Math.random() * 20);
    const positions = ['前锋', '中场', '后卫', '门将'];
    const position = positions[Math.floor(Math.random() * positions.length)];
    const age = 17 + Math.floor(Math.random() * 3);
    
    let player = PlayerData.generatePlayer(position, age);
    const qualityMultiplier = youthQuality / 60;
    player.strength = Math.min(99, Math.floor(player.strength * qualityMultiplier));
    player.speed = Math.min(99, Math.floor(player.speed * qualityMultiplier));
    player.teamwork = Math.min(99, Math.floor(player.teamwork * qualityMultiplier));
    player.overall = Math.floor((player.strength + player.speed + player.teamwork) / 3);
    player.isYouth = true;
    player.contract = PlayerData.generateContract(age, player.overall);
    player.contract.salary = Math.floor(player.contract.salary * 0.5);
    
    player = new Player(player);
    this.squad.push(player);
    
    return player;
  }

  toJSON() {
    return {
      id: this.id,
      name: this.name,
      shortName: this.shortName,
      color: this.color,
      city: this.city,
      squad: this.squad.map(p => p.toJSON()),
      tactics: this.tactics,
      budget: this.budget,
      reputation: this.reputation,
      youthAcademy: this.youthAcademy,
      trainingFacilities: this.trainingFacilities,
      stadiumCapacity: this.stadiumCapacity,
      leaguePosition: this.leaguePosition,
      points: this.points,
      goalsFor: this.goalsFor,
      goalsAgainst: this.goalsAgainst,
      wins: this.wins,
      draws: this.draws,
      losses: this.losses,
      isPlayerTeam: this.isPlayerTeam,
      tacticsHistory: this.tacticsHistory,
      transferHistory: this.transferHistory
    };
  }

  static fromJSON(data) {
    return new Team(data);
  }
}
