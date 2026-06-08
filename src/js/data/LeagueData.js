const LeagueData = {
  leagueNames: [
    { name: '甲级联赛', tier: 1, teams: 8 },
    { name: '乙级联赛', tier: 2, teams: 8 }
  ],

  cupNames: [
    '国家杯', '联赛杯', '超级杯'
  ],

  generateFixtures(teams) {
    const fixtures = [];
    const teamCount = teams.length;
    const rounds = (teamCount - 1) * 2;
    
    for (let round = 0; round < rounds; round++) {
      const roundMatches = [];
      const half = teamCount / 2;
      
      for (let i = 0; i < half; i++) {
        let homeIdx, awayIdx;
        if (round % 2 === 0) {
          homeIdx = i;
          awayIdx = teamCount - 1 - i;
        } else {
          homeIdx = teamCount - 1 - i;
          awayIdx = i;
        }
        
        if (round >= teamCount - 1) {
          const temp = homeIdx;
          homeIdx = awayIdx;
          awayIdx = temp;
        }
        
        if (homeIdx !== awayIdx) {
          roundMatches.push({
            id: `match_${round}_${i}`,
            round: round + 1,
            home: teams[homeIdx].id,
            away: teams[awayIdx].id,
            homeTeam: teams[homeIdx],
            awayTeam: teams[awayIdx],
            played: false,
            homeScore: 0,
            awayScore: 0,
            date: round,
            isCup: false
          });
        }
      }
      
      fixtures.push(roundMatches);
    }
    
    return fixtures;
  },

  generateCupFixtures(teams) {
    const shuffled = [...teams].sort(() => Math.random() - 0.5);
    const fixtures = [];
    let roundTeams = shuffled;
    let roundNum = 1;
    
    while (roundTeams.length > 1) {
      const roundMatches = [];
      const nextRound = [];
      
      for (let i = 0; i < roundTeams.length; i += 2) {
        if (i + 1 < roundTeams.length) {
          roundMatches.push({
            id: `cup_${roundNum}_${i}`,
            round: roundNum,
            home: roundTeams[i].id,
            away: roundTeams[i + 1].id,
            homeTeam: roundTeams[i],
            awayTeam: roundTeams[i + 1],
            played: false,
            homeScore: 0,
            awayScore: 0,
            date: 10 + roundNum * 4,
            isCup: true,
            cupName: this.cupNames[0],
            winner: null,
            nextRound: nextRound
          });
        }
      }
      
      fixtures.push(roundMatches);
      roundTeams = nextRound;
      roundNum++;
    }
    
    return fixtures;
  },

  updateLeagueTable(teams, fixtures) {
    teams.forEach(team => {
      team.points = 0;
      team.wins = 0;
      team.draws = 0;
      team.losses = 0;
      team.goalsFor = 0;
      team.goalsAgainst = 0;
    });

    fixtures.forEach(round => {
      round.forEach(match => {
        if (match.played) {
          const homeTeam = teams.find(t => t.id === match.home);
          const awayTeam = teams.find(t => t.id === match.away);
          
          if (homeTeam && awayTeam) {
            homeTeam.goalsFor += match.homeScore;
            homeTeam.goalsAgainst += match.awayScore;
            awayTeam.goalsFor += match.awayScore;
            awayTeam.goalsAgainst += match.homeScore;
            
            if (match.homeScore > match.awayScore) {
              homeTeam.points += 3;
              homeTeam.wins++;
              awayTeam.losses++;
            } else if (match.homeScore < match.awayScore) {
              awayTeam.points += 3;
              awayTeam.wins++;
              homeTeam.losses++;
            } else {
              homeTeam.points++;
              awayTeam.points++;
              homeTeam.draws++;
              awayTeam.draws++;
            }
          }
        }
      });
    });

    teams.sort((a, b) => {
      if (b.points !== a.points) return b.points - a.points;
      const gdA = a.goalsFor - a.goalsAgainst;
      const gdB = b.goalsFor - b.goalsAgainst;
      if (gdB !== gdA) return gdB - gdA;
      return b.goalsFor - a.goalsFor;
    });

    teams.forEach((team, index) => {
      team.leaguePosition = index + 1;
    });

    return teams;
  },

  getSeasonRewards(team, leagueTier = 1) {
    const basePrize = leagueTier === 1 ? 1000000 : 500000;
    const positionPrize = Math.max(0, basePrize - (team.leaguePosition - 1) * (basePrize / 8));
    const winBonus = team.wins * 10000;
    const attendanceBonus = Math.floor(team.stadiumCapacity * team.wins * 10);
    
    return {
      positionPrize: Math.floor(positionPrize),
      winBonus,
      attendanceBonus,
      total: Math.floor(positionPrize + winBonus + attendanceBonus)
    };
  },

  getPromotionRelegation(teams, leagueTier = 1) {
    if (leagueTier === 1) {
      return {
        relegated: teams.slice(-2).map(t => t.id),
        promoted: []
      };
    } else {
      return {
        relegated: [],
        promoted: teams.slice(0, 2).map(t => t.id)
      };
    }
  }
};
