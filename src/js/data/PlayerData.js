const PlayerData = {
  firstNames: [
    '张伟', '李明', '王强', '刘洋', '陈杰', '杨光', '黄磊', '周涛',
    '吴鹏', '郑浩', '孙健', '马超', '林峰', '徐亮', '高峰', '胡军',
    '郭晨', '何宇', '罗飞', '梁栋', '宋博', '唐亮', '韩冰', '冯凯'
  ],
  
  lastNames: [
    '', '', '', '', '', '', '', '',
    '', '', '', '', '', '', '', '',
    '', '', '', '', '', '', '', ''
  ],

  positions: ['前锋', '中场', '后卫', '门将'],

  positionShort: {
    '前锋': 'FW',
    '中场': 'MF',
    '后卫': 'DF',
    '门将': 'GK'
  },

  generateName() {
    const firstName = this.firstNames[Math.floor(Math.random() * this.firstNames.length)];
    return firstName;
  },

  generateStats(position, age = null) {
    const playerAge = age || Math.floor(Math.random() * 18) + 18;
    
    let baseStrength, baseSpeed, baseTeamwork;
    
    switch (position) {
      case '前锋':
        baseStrength = 50 + Math.floor(Math.random() * 30);
        baseSpeed = 55 + Math.floor(Math.random() * 30);
        baseTeamwork = 40 + Math.floor(Math.random() * 30);
        break;
      case '中场':
        baseStrength = 45 + Math.floor(Math.random() * 25);
        baseSpeed = 50 + Math.floor(Math.random() * 25);
        baseTeamwork = 55 + Math.floor(Math.random() * 35);
        break;
      case '后卫':
        baseStrength = 55 + Math.floor(Math.random() * 30);
        baseSpeed = 45 + Math.floor(Math.random() * 25);
        baseTeamwork = 50 + Math.floor(Math.random() * 30);
        break;
      case '门将':
        baseStrength = 60 + Math.floor(Math.random() * 25);
        baseSpeed = 35 + Math.floor(Math.random() * 20);
        baseTeamwork = 45 + Math.floor(Math.random() * 25);
        break;
    }

    const ageMultiplier = playerAge < 25 ? 0.85 + (playerAge - 18) * 0.02 : 
                           playerAge > 30 ? 1.1 - (playerAge - 30) * 0.02 : 1.0;

    return {
      age: playerAge,
      strength: Math.min(99, Math.max(1, Math.floor(baseStrength * ageMultiplier))),
      speed: Math.min(99, Math.max(1, Math.floor(baseSpeed * ageMultiplier))),
      teamwork: Math.min(99, Math.max(1, Math.floor(baseTeamwork * ageMultiplier))),
      fatigue: 0,
      morale: 70 + Math.floor(Math.random() * 20),
      injury: 0,
      potential: playerAge < 22 ? 75 + Math.floor(Math.random() * 20) : 
                 playerAge < 25 ? 65 + Math.floor(Math.random() * 20) : 
                 Math.max(60, baseStrength + baseSpeed + baseTeamwork) / 3
    };
  },

  generateContract(age, overall) {
    const baseValue = Math.floor(overall * 1000 + age * 500);
    const years = age < 22 ? Math.floor(Math.random() * 3) + 3 :
                  age < 28 ? Math.floor(Math.random() * 3) + 2 :
                  Math.floor(Math.random() * 2) + 1;
    
    return {
      salary: Math.floor(baseValue * 0.08),
      years: years,
      yearsRemaining: years,
      value: baseValue,
      signed: Date.now()
    };
  },

  generatePlayer(position = null, age = null) {
    const pos = position || this.positions[Math.floor(Math.random() * this.positions.length)];
    const stats = this.generateStats(pos, age);
    const overall = Math.floor((stats.strength + stats.speed + stats.teamwork) / 3);
    
    return {
      id: 'player_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9),
      name: this.generateName(),
      position: pos,
      positionShort: this.positionShort[pos],
      number: Math.floor(Math.random() * 30) + 1,
      ...stats,
      overall: overall,
      contract: this.generateContract(stats.age, overall),
      goals: 0,
      assists: 0,
      cleanSheets: pos === '门将' ? 0 : undefined,
      appearances: 0,
      form: 50 + Math.floor(Math.random() * 30),
      isYouth: stats.age < 21 && overall < 60
    };
  },

  generateSquad(teamQuality = 50) {
    const squad = [];
    const playersPerPosition = {
      '门将': 2,
      '后卫': 4,
      '中场': 4,
      '前锋': 3
    };

    for (const [position, count] of Object.entries(playersPerPosition)) {
      for (let i = 0; i < count; i++) {
        const age = Math.floor(Math.random() * 16) + 19;
        const player = this.generatePlayer(position, age);
        
        const qualityMultiplier = 0.7 + (teamQuality / 100) * 0.6;
        player.strength = Math.min(99, Math.floor(player.strength * qualityMultiplier));
        player.speed = Math.min(99, Math.floor(player.speed * qualityMultiplier));
        player.teamwork = Math.min(99, Math.floor(player.teamwork * qualityMultiplier));
        player.overall = Math.floor((player.strength + player.speed + player.teamwork) / 3);
        
        squad.push(player);
      }
    }

    return squad;
  },

  generateTransferList(count = 8) {
    const list = [];
    const positions = ['前锋', '中场', '后卫', '门将'];
    
    for (let i = 0; i < count; i++) {
      const position = positions[i % 4];
      const age = Math.floor(Math.random() * 14) + 20;
      const player = this.generatePlayer(position, age);
      
      player.transferPrice = Math.floor(player.contract.value * (1.2 + Math.random() * 0.5));
      player.marketValue = player.contract.value;
      player.contract.yearsRemaining = Math.floor(Math.random() * 3) + 1;
      
      list.push(player);
    }
    
    return list;
  }
};
