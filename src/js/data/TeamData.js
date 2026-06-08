const TeamData = {
  teamNames: [
    { name: '城市联队', shortName: '城联', color: 1, city: '新城' },
    { name: '流浪者FC', shortName: '流浪', color: 2, city: '北方' },
    { name: '竞技队', shortName: '竞技', color: 3, city: '南方' },
    { name: '猛虎队', shortName: '猛虎', color: 4, city: '东方' },
    { name: '雄鹰俱乐部', shortName: '雄鹰', color: 1, city: '西方' },
    { name: '闪电队', shortName: '闪电', color: 2, city: '中心' },
    { name: '钢铁FC', shortName: '钢铁', color: 3, city: '工业' },
    { name: '荣耀队', shortName: '荣耀', color: 4, city: '古都' }
  ],

  generateTeam(index, isPlayer = false) {
    const teamInfo = this.teamNames[index % this.teamNames.length];
    const baseQuality = isPlayer ? 55 : 40 + (index * 8) % 50;
    
    return {
      id: 'team_' + (isPlayer ? 'player' : index),
      name: isPlayer ? '我的俱乐部' : teamInfo.name,
      shortName: isPlayer ? '我的' : teamInfo.shortName,
      color: teamInfo.color,
      city: teamInfo.city,
      squad: PlayerData.generateSquad(baseQuality),
      tactics: {
        formation: '4-3-3',
        attacking: 50,
        defensive: 50,
        pressing: 50,
        pace: 50
      },
      budget: isPlayer ? 5000000 : 3000000 + Math.random() * 5000000,
      reputation: baseQuality,
      youthAcademy: isPlayer ? 3 : 1 + Math.floor(Math.random() * 3),
      trainingFacilities: isPlayer ? 3 : 1 + Math.floor(Math.random() * 3),
      stadiumCapacity: isPlayer ? 30000 : 15000 + Math.floor(Math.random() * 30000),
      leaguePosition: 0,
      points: 0,
      goalsFor: 0,
      goalsAgainst: 0,
      wins: 0,
      draws: 0,
      losses: 0,
      isPlayerTeam: isPlayer
    };
  },

  generateLeagueTeams(count = 8) {
    const teams = [];
    for (let i = 0; i < count; i++) {
      teams.push(this.generateTeam(i, false));
    }
    return teams;
  },

  getFormationPositions(formation) {
    const formations = {
      '4-3-3': ['GK', 'DF', 'DF', 'DF', 'DF', 'MF', 'MF', 'MF', 'FW', 'FW', 'FW'],
      '4-4-2': ['GK', 'DF', 'DF', 'DF', 'DF', 'MF', 'MF', 'MF', 'MF', 'FW', 'FW'],
      '3-5-2': ['GK', 'DF', 'DF', 'DF', 'MF', 'MF', 'MF', 'MF', 'MF', 'FW', 'FW'],
      '5-3-2': ['GK', 'DF', 'DF', 'DF', 'DF', 'DF', 'MF', 'MF', 'MF', 'FW', 'FW'],
      '4-2-3-1': ['GK', 'DF', 'DF', 'DF', 'DF', 'MF', 'MF', 'MF', 'MF', 'MF', 'FW']
    };
    return formations[formation] || formations['4-3-3'];
  },

  getBest11(squad, formation) {
    const positions = this.getFormationPositions(formation);
    const available = [...squad].filter(p => p.injury === 0);
    const best11 = [];

    const byPosition = {};
    ['GK', 'DF', 'MF', 'FW'].forEach(pos => {
      byPosition[pos] = available
        .filter(p => p.positionShort === pos)
        .sort((a, b) => b.overall - a.overall);
    });

    positions.forEach(pos => {
      if (byPosition[pos] && byPosition[pos].length > 0) {
        const player = byPosition[pos].shift();
        best11.push(player);
      } else {
        const allAvailable = available.filter(p => !best11.includes(p));
        if (allAvailable.length > 0) {
          const player = allAvailable.sort((a, b) => b.overall - a.overall)[0];
          best11.push(player);
          const playerPos = byPosition[player.positionShort];
          if (playerPos) {
            const idx = playerPos.indexOf(player);
            if (idx > -1) playerPos.splice(idx, 1);
          }
        }
      }
    });

    return best11;
  },

  getSubstitutes(squad, best11) {
    return squad
      .filter(p => !best11.includes(p) && p.injury === 0)
      .sort((a, b) => b.overall - a.overall)
      .slice(0, 5);
  },

  calculateTeamStrength(team) {
    const best11 = this.getBest11(team.squad, team.tactics.formation);
    const avgOverall = best11.reduce((sum, p) => sum + p.overall, 0) / best11.length;
    const avgMorale = best11.reduce((sum, p) => sum + p.morale, 0) / best11.length;
    const avgFatigue = best11.reduce((sum, p) => sum + p.fatigue, 0) / best11.length;
    const avgForm = best11.reduce((sum, p) => sum + p.form, 0) / best11.length;

    const fatiguePenalty = avgFatigue / 200;
    const moraleBonus = (avgMorale - 50) / 200;
    const formBonus = (avgForm - 50) / 200;
    const tacticsBonus = (team.tactics.attacking + team.tactics.defensive) / 400;

    return Math.max(10, Math.min(99, 
      avgOverall * (1 - fatiguePenalty + moraleBonus + formBonus + tacticsBonus)
    ));
  }
};
