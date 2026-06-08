class Season {
  constructor(data) {
    this.id = data.id || `season_${Date.now()}`;
    this.seasonNumber = data.seasonNumber || 1;
    this.leagueTier = data.leagueTier || 2;
    this.teams = data.teams ? data.teams.map(t => t instanceof Team ? t : new Team(t)) : [];
    this.playerTeamId = data.playerTeamId || null;
    this.fixtures = data.fixtures || [];
    this.cupFixtures = data.cupFixtures || [];
    this.currentRound = data.currentRound || 0;
    this.currentWeek = data.currentWeek || 0;
    this.totalRounds = data.totalRounds || 14;
    this.seasonStatus = data.seasonStatus || 'preseason';
    this.leagueTable = data.leagueTable || [];
    this.cupWinner = data.cupWinner || null;
    this.weeklyFinanceLog = data.weeklyFinanceLog || [];
    this.transferWindowOpen = data.transferWindowOpen || true;
    this.transferList = data.transferList || [];
    this.seasonHistory = data.seasonHistory || [];
    this.stats = data.stats || {
      totalGoals: 0,
      totalMatches: 0,
      cleanSheets: 0,
      underdogWins: 0,
      youthGoals: 0,
      topScorer: null,
      bestGoalkeeper: null
    };
  }

  initNewSeason(playerTeam, leagueTier = 2) {
    this.seasonStatus = 'preseason';
    this.leagueTier = leagueTier;
    this.currentRound = 0;
    this.currentWeek = 0;
    this.transferWindowOpen = true;
    
    const leagueTeams = TeamData.generateLeagueTeams(7);
    this.teams = [playerTeam, ...leagueTeams.map(t => new Team(t))];
    this.playerTeamId = playerTeam.id;
    this.totalRounds = (this.teams.length - 1) * 2;
    
    this.teams.forEach(team => {
      team.points = 0;
      team.wins = 0;
      team.draws = 0;
      team.losses = 0;
      team.goalsFor = 0;
      team.goalsAgainst = 0;
      team.leaguePosition = 0;
    });
    
    this.fixtures = LeagueData.generateFixtures(this.teams);
    this.cupFixtures = LeagueData.generateCupFixtures(this.teams);
    this.refreshTransferList();
    this.updateLeagueTable();
    
    return this;
  }

  startSeason() {
    if (this.seasonStatus !== 'preseason') return false;
    this.seasonStatus = 'in_progress';
    this.transferWindowOpen = false;
    return true;
  }

  getPlayerTeam() {
    return this.teams.find(t => t.id === this.playerTeamId);
  }

  getNextMatch() {
    if (this.currentRound >= this.totalRounds) return null;
    
    const roundFixtures = this.fixtures[this.currentRound];
    if (!roundFixtures) return null;
    
    const playerMatch = roundFixtures.find(
      m => m.home === this.playerTeamId || m.away === this.playerTeamId
    );
    
    if (playerMatch) {
      return playerMatch;
    }
    
    return null;
  }

  getRoundMatches(round) {
    return this.fixtures[round] || [];
  }

  playMatch(matchId, homeLineup = null, awayLineup = null, homeTactics = null) {
    const roundMatches = this.fixtures[this.currentRound];
    if (!roundMatches) return null;
    
    const matchData = roundMatches.find(m => m.id === matchId);
    if (!matchData || matchData.played) return null;
    
    const match = new Match(matchData);
    
    if (match.home === this.playerTeamId && homeLineup) {
      const awayTactics = this.generateAITactics(match.awayTeam);
      const awayLineup = this.generateAILineup(match.awayTeam);
      match.setupMatch(homeLineup, awayLineup, homeTactics, awayTactics);
    } else if (match.away === this.playerTeamId && awayLineup) {
      const homeTacticsAI = this.generateAITactics(match.homeTeam);
      const homeLineupAI = this.generateAILineup(match.homeTeam);
      match.setupMatch(homeLineupAI, awayLineup, homeTacticsAI, homeTactics);
    } else {
      const homeTacticsAI = this.generateAITactics(match.homeTeam);
      const awayTacticsAI = this.generateAITactics(match.awayTeam);
      const homeLineupAI = this.generateAILineup(match.homeTeam);
      const awayLineupAI = this.generateAILineup(match.awayTeam);
      match.setupMatch(homeLineupAI, awayLineupAI, homeTacticsAI, awayTacticsAI);
    }
    
    const result = match.simulateFullMatch();
    this.stats.totalMatches++;
    this.stats.totalGoals += match.homeScore + match.awayScore;
    
    if (match.homeScore === 0 || match.awayScore === 0) {
      this.stats.cleanSheets++;
    }
    
    const homeStrength = TeamData.calculateTeamStrength(match.homeTeam);
    const awayStrength = TeamData.calculateTeamStrength(match.awayTeam);
    if ((match.homeScore > match.awayScore && homeStrength < awayStrength - 10) ||
        (match.awayScore > match.homeScore && awayStrength < homeStrength - 10)) {
      this.stats.underdogWins++;
    }
    
    const playerTeam = this.getPlayerTeam();
    [match.homeGoalscorers, match.awayGoalscorers].forEach(scorers => {
      scorers.forEach(scorer => {
        if (playerTeam.squad.find(p => p.id === scorer.player.id)) {
          if (scorer.player.isYouth) {
            this.stats.youthGoals++;
          }
        }
      });
    });
    
    matchData.played = true;
    matchData.homeScore = match.homeScore;
    matchData.awayScore = match.awayScore;
    matchData.winner = match.winner;
    matchData.homeTeam = match.homeTeam;
    matchData.awayTeam = match.awayTeam;
    
    this.updateLeagueTable();
    
    return { match, result };
  }

  simulateRestOfRound(playerMatchId) {
    const roundMatches = this.fixtures[this.currentRound];
    if (!roundMatches) return [];
    
    const results = [];
    roundMatches.forEach(matchData => {
      if (matchData.id !== playerMatchId && !matchData.played) {
        const match = new Match(matchData);
        const homeLineup = this.generateAILineup(match.homeTeam);
        const awayLineup = this.generateAILineup(match.awayTeam);
        const homeTactics = this.generateAITactics(match.homeTeam);
        const awayTactics = this.generateAITactics(match.awayTeam);
        
        match.setupMatch(homeLineup, awayLineup, homeTactics, awayTactics);
        const result = match.simulateFullMatch();
        
        matchData.played = true;
        matchData.homeScore = match.homeScore;
        matchData.awayScore = match.awayScore;
        matchData.winner = match.winner;
        matchData.homeTeam = match.homeTeam;
        matchData.awayTeam = match.awayTeam;
        
        results.push(result);
      }
    });
    
    this.updateLeagueTable();
    return results;
  }

  advanceWeek() {
    const playerTeam = this.getPlayerTeam();
    
    const finances = playerTeam.processWeeklyFinances();
    this.weeklyFinanceLog.push({
      week: this.currentWeek,
      ...finances
    });
    
    playerTeam.squad.forEach(player => {
      player.fatigue = Math.max(0, player.fatigue - 5);
      player.morale = Math.max(0, Math.min(100, player.morale + 1));
      
      if (player.injury > 0) {
        player.injury--;
      }
    });
    
    this.currentWeek++;
    
    return { finances };
  }

  advanceRound() {
    this.currentRound++;
    
    if (this.currentRound >= this.totalRounds) {
      return this.endSeason();
    }
    
    return {
      nextRound: this.currentRound,
      matchesRemaining: this.totalRounds - this.currentRound
    };
  }

  generateAILineup(team) {
    return TeamData.getBest11(team.squad, team.tactics.formation);
  }

  generateAITactics(team) {
    const baseTactics = { ...team.tactics };
    
    baseTactics.attacking = Math.max(20, Math.min(80, baseTactics.attacking + Math.floor(Math.random() * 20) - 10));
    baseTactics.defensive = Math.max(20, Math.min(80, baseTactics.defensive + Math.floor(Math.random() * 20) - 10));
    
    return baseTactics;
  }

  updateLeagueTable() {
    this.leagueTable = LeagueData.updateLeagueTable(this.teams, this.fixtures);
  }

  refreshTransferList() {
    this.transferList = PlayerData.generateTransferList(10);
  }

  endSeason() {
    this.seasonStatus = 'ended';
    
    const playerTeam = this.getPlayerTeam();
    const finalPosition = playerTeam.leaguePosition;
    
    this.updateStats();
    
    const seasonResult = {
      seasonNumber: this.seasonNumber,
      leagueTier: this.leagueTier,
      finalPosition,
      points: playerTeam.points,
      wins: playerTeam.wins,
      draws: playerTeam.draws,
      losses: playerTeam.losses,
      goalsFor: playerTeam.goalsFor,
      goalsAgainst: playerTeam.goalsAgainst,
      totalMatches: playerTeam.wins + playerTeam.draws + playerTeam.losses,
      promoted: this.leagueTier > 1 && finalPosition <= 2,
      relegated: this.leagueTier === 1 && finalPosition >= 7,
      cupWon: this.cupWinner === this.playerTeamId,
      cupName: this.cupFixtures[0]?.[0]?.cupName || '国家杯',
      finalBudget: playerTeam.budget,
      stadiumCapacity: playerTeam.stadiumCapacity,
      cleanSheets: this.stats.cleanSheets,
      underdogWins: this.stats.underdogWins,
      youthGoals: this.stats.youthGoals,
      goalsFor: playerTeam.goalsFor,
      topScorer: this.stats.topScorer,
      bestGoalkeeper: this.stats.bestGoalkeeper
    };
    
    const rewards = playerTeam.processSeasonEnd(seasonResult);
    
    this.seasonHistory.push({
      ...seasonResult,
      rewards
    });
    
    return {
      seasonResult,
      rewards,
      trophies: this.checkTrophies(seasonResult)
    };
  }

  updateStats() {
    const playerTeam = this.getPlayerTeam();
    
    let topScorer = null;
    let maxGoals = 0;
    
    this.teams.forEach(team => {
      team.squad.forEach(player => {
        if (player.goals > maxGoals) {
          maxGoals = player.goals;
          topScorer = {
            name: player.name,
            goals: player.goals,
            team: team.name,
            isPlayer: team.isPlayerTeam
          };
        }
      });
    });
    
    let bestGK = null;
    let maxCleanSheets = 0;
    
    this.teams.forEach(team => {
      team.squad.forEach(player => {
        if (player.positionShort === 'GK' && player.cleanSheets > maxCleanSheets) {
          maxCleanSheets = player.cleanSheets;
          bestGK = {
            name: player.name,
            cleanSheets: player.cleanSheets,
            team: team.name,
            isPlayer: team.isPlayerTeam
          };
        }
      });
    });
    
    this.stats.topScorer = topScorer;
    this.stats.bestGoalkeeper = bestGK;
  }

  checkTrophies(seasonResult) {
    const playerTrophies = Storage.load('player_trophies', {});
    const unlocked = TrophyData.checkTrophies(seasonResult, playerTrophies);
    Storage.save('player_trophies', playerTrophies);
    return unlocked;
  }

  getNextSeason(playerTeam) {
    const nextTier = this.seasonHistory[this.seasonHistory.length - 1]?.promoted ? 
      this.leagueTier - 1 : 
      (this.seasonHistory[this.seasonHistory.length - 1]?.relegated ? this.leagueTier + 1 : this.leagueTier);
    
    const nextSeason = new Season({
      seasonNumber: this.seasonNumber + 1,
      leagueTier: Math.max(1, Math.min(2, nextTier))
    });
    
    return nextSeason.initNewSeason(playerTeam, nextSeason.leagueTier);
  }

  toJSON() {
    this.teams = this.teams.map(t => {
      if (t instanceof Team) {
        return t;
      }
      console.log('Converting team to Team instance:', t.name);
      return new Team(t);
    });
    return {
      id: this.id,
      seasonNumber: this.seasonNumber,
      leagueTier: this.leagueTier,
      teams: this.teams.map(t => {
        if (typeof t.toJSON === 'function') {
          return t.toJSON();
        }
        console.error('Team has no toJSON method:', t);
        return t;
      }),
      playerTeamId: this.playerTeamId,
      fixtures: this.fixtures,
      cupFixtures: this.cupFixtures,
      currentRound: this.currentRound,
      currentWeek: this.currentWeek,
      totalRounds: this.totalRounds,
      seasonStatus: this.seasonStatus,
      leagueTable: this.leagueTable.map(t => ({
        id: t.id,
        name: t.name,
        position: t.leaguePosition,
        points: t.points,
        wins: t.wins,
        draws: t.draws,
        losses: t.losses,
        goalsFor: t.goalsFor,
        goalsAgainst: t.goalsAgainst
      })),
      cupWinner: this.cupWinner,
      weeklyFinanceLog: this.weeklyFinanceLog,
      transferWindowOpen: this.transferWindowOpen,
      transferList: this.transferList,
      seasonHistory: this.seasonHistory,
      stats: this.stats
    };
  }

  static fromJSON(data) {
    return new Season(data);
  }
}
