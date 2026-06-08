const TrophyData = {
  trophies: [
    {
      id: 'league_champion_tier1',
      name: '甲级联赛冠军',
      description: '赢得甲级联赛冠军',
      type: 'league',
      rarity: 'legendary',
      unlocked: false,
      condition: (seasonResult) => {
        return seasonResult.leagueTier === 1 && seasonResult.finalPosition === 1;
      }
    },
    {
      id: 'league_champion_tier2',
      name: '乙级联赛冠军',
      description: '赢得乙级联赛冠军',
      type: 'league',
      rarity: 'rare',
      unlocked: false,
      condition: (seasonResult) => {
        return seasonResult.leagueTier === 2 && seasonResult.finalPosition === 1;
      }
    },
    {
      id: 'league_runner_up',
      name: '联赛亚军',
      description: '获得联赛第二名',
      type: 'league',
      rarity: 'uncommon',
      unlocked: false,
      condition: (seasonResult) => {
        return seasonResult.finalPosition === 2;
      }
    },
    {
      id: 'promotion',
      name: '升级成功',
      description: '成功晋级到更高一级联赛',
      type: 'league',
      rarity: 'uncommon',
      unlocked: false,
      condition: (seasonResult) => {
        return seasonResult.promoted;
      }
    },
    {
      id: 'cup_winner',
      name: '国家杯冠军',
      description: '赢得国家杯冠军',
      type: 'cup',
      rarity: 'rare',
      unlocked: false,
      condition: (seasonResult) => {
        return seasonResult.cupWon && seasonResult.cupName === '国家杯';
      }
    },
    {
      id: 'league_cup_winner',
      name: '联赛杯冠军',
      description: '赢得联赛杯冠军',
      type: 'cup',
      rarity: 'uncommon',
      unlocked: false,
      condition: (seasonResult) => {
        return seasonResult.cupWon && seasonResult.cupName === '联赛杯';
      }
    },
    {
      id: 'domestic_double',
      name: '双冠王',
      description: '在同一赛季赢得联赛和杯赛冠军',
      type: 'achievement',
      rarity: 'legendary',
      unlocked: false,
      condition: (seasonResult) => {
        return seasonResult.finalPosition === 1 && seasonResult.cupWon;
      }
    },
    {
      id: 'invincible',
      name: '不败赛季',
      description: '整个赛季保持不败',
      type: 'achievement',
      rarity: 'legendary',
      unlocked: false,
      condition: (seasonResult) => {
        return seasonResult.losses === 0 && seasonResult.totalMatches >= 14;
      }
    },
    {
      id: 'top_scorer',
      name: '金靴奖',
      description: '你的球员获得联赛最佳射手',
      type: 'individual',
      rarity: 'rare',
      unlocked: false,
      condition: (seasonResult) => {
        return seasonResult.topScorer && seasonResult.topScorer.isPlayer;
      }
    },
    {
      id: 'best_goalkeeper',
      name: '金手套奖',
      description: '你的门将获得联赛最佳门将',
      type: 'individual',
      rarity: 'rare',
      unlocked: false,
      condition: (seasonResult) => {
        return seasonResult.bestGoalkeeper && seasonResult.bestGoalkeeper.isPlayer;
      }
    },
    {
      id: 'youth_breakthrough',
      name: '青训突破',
      description: '一名青训球员在赛季中打进10球以上',
      type: 'youth',
      rarity: 'rare',
      unlocked: false,
      condition: (seasonResult) => {
        return seasonResult.youthGoals >= 10;
      }
    },
    {
      id: 'financial_stability',
      name: '财务稳健',
      description: '赛季结束时预算超过1000万',
      type: 'achievement',
      rarity: 'uncommon',
      unlocked: false,
      condition: (seasonResult) => {
        return seasonResult.finalBudget >= 10000000;
      }
    },
    {
      id: 'stadium_upgrade',
      name: '球场扩建',
      description: '将球场容量提升到50000以上',
      type: 'achievement',
      rarity: 'uncommon',
      unlocked: false,
      condition: (seasonResult) => {
        return seasonResult.stadiumCapacity >= 50000;
      }
    },
    {
      id: 'underdog_victory',
      name: '以弱胜强',
      description: '在杯赛中击败实力强于你的球队',
      type: 'achievement',
      rarity: 'uncommon',
      unlocked: false,
      condition: (seasonResult) => {
        return seasonResult.underdogWins >= 1;
      }
    },
    {
      id: 'clean_sheet_record',
      name: '钢铁防线',
      description: '单赛季零封场次达到10场',
      type: 'achievement',
      rarity: 'rare',
      unlocked: false,
      condition: (seasonResult) => {
        return seasonResult.cleanSheets >= 10;
      }
    },
    {
      id: 'goal_fest',
      name: '进球狂魔',
      description: '单赛季进球达到50个',
      type: 'achievement',
      rarity: 'rare',
      unlocked: false,
      condition: (seasonResult) => {
        return seasonResult.goalsFor >= 50;
      }
    }
  ],

  rarityColors: {
    common: '#909090',
    uncommon: '#44ff44',
    rare: '#4488ff',
    legendary: '#ffcc00'
  },

  checkTrophies(seasonResult, playerTrophies) {
    const unlocked = [];
    
    this.trophies.forEach(trophy => {
      if (!playerTrophies[trophy.id] && trophy.condition(seasonResult)) {
        unlocked.push(trophy);
        playerTrophies[trophy.id] = {
          unlocked: true,
          date: new Date().toISOString(),
          season: seasonResult.seasonNumber
        };
      }
    });
    
    return unlocked;
  },

  getTrophyById(id) {
    return this.trophies.find(t => t.id === id);
  }
};
