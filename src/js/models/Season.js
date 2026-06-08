class Season {
  constructor(data) {
    this.id = data.id || `season_${Date.now()}`;
    this.seasonNumber = data.seasonNumber || 1;
    this.leagueTier = data.leagueTier || 2;
    this.teams = data.teams ? data.teams.map(t => t instanceof Team ? t : new Team(t)) : [];
    this.playerTeamId = data.playerTeamId || null;
    this.fixtures = data.fixtures || [];
    this.cupFixtures = data.cupFixtures || [];
    this.cupCurrentRound = data.cupCurrentRound || 1;
    this.cupTeamStatus = data.cupTeamStatus || {};
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
      consecutiveCleanSheets: 0,
      maxConsecutiveCleanSheets: 0,
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
    this.cupCurrentRound = 1;
    this.cupTeamStatus = {};
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
      this.cupTeamStatus[team.id] = 'active';
    });
    
    this.fixtures = LeagueData.generateFixtures(this.teams);
    const firstCupRound = LeagueData.generateCupFixtures(this.teams, 1);
    this.cupFixtures = [firstCupRound];
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
    const cupMatch = this.getNextCupMatch();
    if (cupMatch) {
      return cupMatch;
    }
    
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

  getNextCupMatch() {
    if (!this.cupFixtures || this.cupFixtures.length === 0) return null;
    if (this.cupWinner) return null;
    
    const playerStatus = this.cupTeamStatus[this.playerTeamId];
    if (playerStatus === 'eliminated') return null;
    
    const currentCupRoundIdx = this.cupCurrentRound - 1;
    if (currentCupRoundIdx >= this.cupFixtures.length) return null;
    
    const roundMatches = this.cupFixtures[currentCupRoundIdx];
    if (!roundMatches) return null;
    
    const playerMatch = roundMatches.find(
      m => !m.played && (m.home === this.playerTeamId || m.away === this.playerTeamId)
    );
    
    if (playerMatch) {
      return playerMatch;
    }
    
    return null;
  }

  isCurrentMatchCup() {
    const nextMatch = this.getNextMatch();
    return nextMatch && nextMatch.isCup === true;
  }

  getCupRound() {
    const nextMatch = this.getNextCupMatch();
    if (!nextMatch) return null;
    return nextMatch.round;
  }

  getRoundMatches(round) {
    return this.fixtures[round] || [];
  }

  updateCleanSheetStats(match, isPlayerMatch) {
    const playerTeam = this.getPlayerTeam();
    let playerCleanSheet = false;
    
    if (isPlayerMatch) {
      if (match.home === this.playerTeamId && match.awayScore === 0) {
        playerCleanSheet = true;
      } else if (match.away === this.playerTeamId && match.homeScore === 0) {
        playerCleanSheet = true;
      }
      
      if (playerCleanSheet) {
        this.stats.consecutiveCleanSheets++;
        if (this.stats.consecutiveCleanSheets > this.stats.maxConsecutiveCleanSheets) {
          this.stats.maxConsecutiveCleanSheets = this.stats.consecutiveCleanSheets;
        }
      } else {
        this.stats.consecutiveCleanSheets = 0;
      }
    }
  }

  playMatch(matchId, homeLineup = null, awayLineup = null, homeTactics = null) {
    let matchData = null;
    let isCup = false;
    let cupRoundIdx = -1;
    
    const roundMatches = this.fixtures[this.currentRound];
    if (roundMatches) {
      matchData = roundMatches.find(m => m.id === matchId);
    }
    
    if (!matchData) {
      for (let r = 0; r < this.cupFixtures.length; r++) {
        const cupRound = this.cupFixtures[r];
        matchData = cupRound.find(m => m.id === matchId);
        if (matchData) {
          isCup = true;
          cupRoundIdx = r;
          break;
        }
      }
    }
    
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
    
    let cleanSheetCount = 0;
    if (match.homeScore === 0) cleanSheetCount++;
    if (match.awayScore === 0) cleanSheetCount++;
    this.stats.cleanSheets += cleanSheetCount;
    
    const isPlayerMatch = match.home === this.playerTeamId || match.away === this.playerTeamId;
    this.updateCleanSheetStats(match, isPlayerMatch);
    
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
    
    if (isCup) {
      if (match.winner) {
        const loserId = match.winner === match.home ? match.away : match.home;
        this.cupTeamStatus[loserId] = 'eliminated';
      }
      
      this.checkAndGenerateNextCupRound();
    }
    
    if (!isCup) {
      this.updateLeagueTable();
    }
    
    return { match, result, isCup };
  }

  simulateRestOfRound(playerMatchId) {
    const roundMatches = this.fixtures[this.currentRound];
    if (roundMatches) {
      roundMatches.forEach(matchData => {
        if (matchData.id !== playerMatchId && !matchData.played) {
          const match = new Match(matchData);
          const homeLineup = this.generateAILineup(match.homeTeam);
          const awayLineup = this.generateAILineup(match.awayTeam);
          const homeTactics = this.generateAITactics(match.homeTeam);
          const awayTactics = this.generateAITactics(match.awayTeam);
          
          match.setupMatch(homeLineup, awayLineup, homeTactics, awayTactics);
          match.simulateFullMatch();
          
          matchData.played = true;
          matchData.homeScore = match.homeScore;
          matchData.awayScore = match.awayScore;
          matchData.winner = match.winner;
          matchData.homeTeam = match.homeTeam;
          matchData.awayTeam = match.awayTeam;
          
          let cleanSheetCount = 0;
          if (match.homeScore === 0) cleanSheetCount++;
          if (match.awayScore === 0) cleanSheetCount++;
          this.stats.cleanSheets += cleanSheetCount;
        }
      });
      
      this.updateLeagueTable();
    }
    
    this.simulateRestOfCup(playerMatchId);
    
    return [];
  }

  simulateRestOfCup(playerMatchId) {
    if (!this.cupFixtures || this.cupWinner) return;
    
    const currentCupRoundIdx = this.cupCurrentRound - 1;
    if (currentCupRoundIdx >= this.cupFixtures.length) return;
    
    const cupRound = this.cupFixtures[currentCupRoundIdx];
    if (!cupRound) return;
    
    cupRound.forEach(matchData => {
      if (matchData.id !== playerMatchId && !matchData.played) {
        const match = new Match(matchData);
        const homeLineup = this.generateAILineup(match.homeTeam);
        const awayLineup = this.generateAILineup(match.awayTeam);
        const homeTactics = this.generateAITactics(match.homeTeam);
        const awayTactics = this.generateAITactics(match.awayTeam);
        
        match.setupMatch(homeLineup, awayLineup, homeTactics, awayTactics);
        match.simulateFullMatch();
        
        matchData.played = true;
        matchData.homeScore = match.homeScore;
        matchData.awayScore = match.awayScore;
        matchData.winner = match.winner;
        matchData.homeTeam = match.homeTeam;
        matchData.awayTeam = match.awayTeam;
        
        if (match.winner) {
          const loserId = match.winner === match.home ? match.away : match.home;
          this.cupTeamStatus[loserId] = 'eliminated';
        }
        
        let cleanSheetCount = 0;
        if (match.homeScore === 0) cleanSheetCount++;
        if (match.awayScore === 0) cleanSheetCount++;
        this.stats.cleanSheets += cleanSheetCount;
      }
    });
    
    this.checkAndGenerateNextCupRound();
    
    if (this.cupTeamStatus[this.playerTeamId] === 'eliminated') {
      this.autoSimulateRemainingCup();
    }
  }

  autoSimulateRemainingCup() {
    if (this.cupWinner) return;
    
    let safetyCounter = 0;
    while (!this.cupWinner && safetyCounter < 10) {
      safetyCounter++;
      const currentCupRoundIdx = this.cupCurrentRound - 1;
      if (currentCupRoundIdx >= this.cupFixtures.length) break;
      
      const cupRound = this.cupFixtures[currentCupRoundIdx];
      if (!cupRound) break;
      
      let hasUnplayed = false;
      cupRound.forEach(matchData => {
        if (!matchData.played) {
          hasUnplayed = true;
          const match = new Match(matchData);
          const homeLineup = this.generateAILineup(match.homeTeam);
          const awayLineup = this.generateAILineup(match.awayTeam);
          const homeTactics = this.generateAITactics(match.homeTeam);
          const awayTactics = this.generateAITactics(match.awayTeam);
          
          match.setupMatch(homeLineup, awayLineup, homeTactics, awayTactics);
          match.simulateFullMatch();
          
          matchData.played = true;
          matchData.homeScore = match.homeScore;
          matchData.awayScore = match.awayScore;
          matchData.winner = match.winner;
          matchData.homeTeam = match.homeTeam;
          matchData.awayTeam = match.awayTeam;
          
          if (match.winner) {
            const loserId = match.winner === match.home ? match.away : match.home;
            this.cupTeamStatus[loserId] = 'eliminated';
          }
          
          let cleanSheetCount = 0;
          if (match.homeScore === 0) cleanSheetCount++;
          if (match.awayScore === 0) cleanSheetCount++;
          this.stats.cleanSheets += cleanSheetCount;
        }
      });
      
      if (!hasUnplayed) {
        this.checkAndGenerateNextCupRound();
      }
    }
  }

  checkAndGenerateNextCupRound() {
    const currentCupRoundIdx = this.cupCurrentRound - 1;
    if (currentCupRoundIdx >= this.cupFixtures.length) return;
    
    const currentRound = this.cupFixtures[currentCupRoundIdx];
    if (!currentRound) return;
    
    const allPlayed = currentRound.every(m => m.played);
    if (!allPlayed) return;
    
    const winners = [];
    currentRound.forEach(m => {
      if (m.winner) {
        const winnerTeam = m.winner === m.home ? m.homeTeam : m.awayTeam;
        winners.push(winnerTeam);
      }
    });
    
    if (winners.length === 1) {
      this.cupWinner = winners[0].id;
      return;
    }
    
    if (winners.length > 1) {
      const nextRoundNum = this.cupCurrentRound + 1;
      const cupName = currentRound[0]?.cupName || '国家杯';
      const nextRound = LeagueData.generateNextCupRound(winners, nextRoundNum, cupName);
      if (nextRound) {
        this.cupFixtures.push(nextRound);
        this.cupCurrentRound = nextRoundNum;
      }
    }
  }

  checkCupWinner() {
    if (!this.cupFixtures || this.cupFixtures.length === 0) return;
    
    const lastRound = this.cupFixtures[this.cupFixtures.length - 1];
    if (lastRound && lastRound.length === 1 && lastRound[0].played) {
      const finalMatch = lastRound[0];
      if (finalMatch.winner) {
        const winnerTeam = finalMatch.winner === finalMatch.home ? finalMatch.homeTeam : finalMatch.awayTeam;
        this.cupWinner = winnerTeam.id;
      }
    }
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

  calculatePlayerTeamCleanSheets() {
    const playerTeam = this.getPlayerTeam();
    let cleanSheets = 0;
    
    this.fixtures.forEach(round => {
      round.forEach(match => {
        if (match.played) {
          if (match.home === this.playerTeamId && match.awayScore === 0) {
            cleanSheets++;
          } else if (match.away === this.playerTeamId && match.homeScore === 0) {
            cleanSheets++;
          }
        }
      });
    });
    
    this.cupFixtures.forEach(round => {
      round.forEach(match => {
        if (match.played) {
          if (match.home === this.playerTeamId && match.awayScore === 0) {
            cleanSheets++;
          } else if (match.away === this.playerTeamId && match.homeScore === 0) {
            cleanSheets++;
          }
        }
      });
    });
    
    return cleanSheets;
  }

  endSeason() {
    this.seasonStatus = 'ended';
    
    const playerTeam = this.getPlayerTeam();
    const finalPosition = playerTeam.leaguePosition;
    
    this.updateStats();
    
    const playerCleanSheets = this.calculatePlayerTeamCleanSheets();
    
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
      cleanSheets: playerCleanSheets,
      totalCleanSheetsAllTeams: this.stats.cleanSheets,
      maxConsecutiveCleanSheets: this.stats.maxConsecutiveCleanSheets,
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
      cupCurrentRound: this.cupCurrentRound,
      cupTeamStatus: this.cupTeamStatus,
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
