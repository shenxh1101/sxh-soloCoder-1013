class Player {
  constructor(data) {
    this.id = data.id;
    this.name = data.name;
    this.position = data.position;
    this.positionShort = data.positionShort;
    this.number = data.number;
    this.age = data.age;
    this.strength = data.strength;
    this.speed = data.speed;
    this.teamwork = data.teamwork;
    this.fatigue = data.fatigue || 0;
    this.morale = data.morale || 70;
    this.injury = data.injury || 0;
    this.potential = data.potential;
    this.overall = data.overall || Math.floor((this.strength + this.speed + this.teamwork) / 3);
    this.contract = data.contract;
    this.goals = data.goals || 0;
    this.assists = data.assists || 0;
    this.cleanSheets = data.cleanSheets || 0;
    this.appearances = data.appearances || 0;
    this.form = data.form || 50;
    this.isYouth = data.isYouth || (this.age < 21 && this.overall < 60);
    this.trainingHistory = data.trainingHistory || [];
    this.injuryHistory = data.injuryHistory || [];
  }

  train(type, intensity = 1) {
    const trainingEffects = {
      strength: { stat: 'strength', fatigueCost: 15, moraleCost: 5 },
      speed: { stat: 'speed', fatigueCost: 12, moraleCost: 3 },
      teamwork: { stat: 'teamwork', fatigueCost: 8, moraleCost: 2 },
      recovery: { stat: null, fatigueCost: -20, moraleCost: -10 }
    };

    const effect = trainingEffects[type];
    if (!effect) return false;

    if (this.injury > 0 && type !== 'recovery') {
      return { success: false, message: `${this.name} 正在养伤，无法训练` };
    }

    if (this.fatigue + effect.fatigueCost * intensity > 95 && type !== 'recovery') {
      return { success: false, message: `${this.name} 过于疲劳，需要休息` };
    }

    const results = {
      success: true,
      statGain: 0,
      fatigueChange: 0,
      moraleChange: 0,
      injuryRisk: false
    };

    if (effect.stat) {
      const baseGain = (0.3 + Math.random() * 0.7) * intensity;
      const ageModifier = this.age < 23 ? 1.5 : this.age > 30 ? 0.5 : 1;
      const potentialModifier = (this.potential - this.overall) / 50;
      const gain = Math.max(0, Math.min(5, baseGain * ageModifier * (1 + potentialModifier)));
      
      this[effect.stat] = Math.min(99, this[effect.stat] + gain);
      results.statGain = parseFloat(gain.toFixed(1));
    }

    this.fatigue = Math.max(0, Math.min(100, this.fatigue + effect.fatigueCost * intensity));
    results.fatigueChange = effect.fatigueCost * intensity;

    this.morale = Math.max(0, Math.min(100, this.morale + effect.moraleCost * intensity));
    results.moraleChange = effect.moraleCost * intensity;

    if (type !== 'recovery' && this.fatigue > 70 && Math.random() < 0.15 * intensity) {
      this.injury = Math.floor(Math.random() * 3) + 1;
      results.injuryRisk = true;
      results.injuryDuration = this.injury;
    }

    this.updateOverall();
    this.trainingHistory.push({ type, date: Date.now(), intensity, results });

    return results;
  }

  rest() {
    const fatigueRecovery = 10 + Math.floor(Math.random() * 10);
    const moraleRecovery = 5 + Math.floor(Math.random() * 5);
    
    this.fatigue = Math.max(0, this.fatigue - fatigueRecovery);
    this.morale = Math.min(100, this.morale + moraleRecovery);
    
    if (this.injury > 0) {
      this.injury--;
    }

    return { fatigueRecovery, moraleRecovery, injuryHealed: this.injury === 0 };
  }

  playMatch(matchImportance = 1) {
    if (this.injury > 0) {
      return { canPlay: false, reason: 'injury' };
    }

    const basePerformance = this.overall * (1 - this.fatigue / 200) * (this.morale / 100);
    const formFactor = 0.7 + (this.form / 100) * 0.6;
    const performance = basePerformance * formFactor * (0.9 + Math.random() * 0.2);

    this.fatigue = Math.min(100, this.fatigue + 15 + matchImportance * 5);
    this.morale = Math.max(0, Math.min(100, this.morale - 2));
    this.appearances++;

    if (Math.random() < 0.05 * (this.fatigue / 100)) {
      this.injury = Math.floor(Math.random() * 4) + 1;
      return { canPlay: true, performance, injured: true, injuryDuration: this.injury };
    }

    return { canPlay: true, performance };
  }

  scoreGoal() {
    this.goals++;
    this.form = Math.min(100, this.form + 5);
    this.morale = Math.min(100, this.morale + 5);
  }

  getAssist() {
    this.assists++;
    this.form = Math.min(100, this.form + 3);
    this.morale = Math.min(100, this.morale + 3);
  }

  keepCleanSheet() {
    if (this.position === '门将') {
      this.cleanSheets++;
      this.form = Math.min(100, this.form + 5);
      this.morale = Math.min(100, this.morale + 5);
    }
  }

  updateOverall() {
    this.overall = Math.floor((this.strength + this.speed + this.teamwork) / 3);
  }

  getValue() {
    const baseValue = this.overall * 1000 + this.age * 500;
    const formMultiplier = 0.8 + (this.form / 100) * 0.4;
    const contractMultiplier = 0.5 + (this.contract.yearsRemaining / 5) * 0.6;
    const ageMultiplier = this.age < 25 ? 1.2 : this.age > 30 ? 0.7 : 1;
    
    return Math.floor(baseValue * formMultiplier * contractMultiplier * ageMultiplier);
  }

  renewContract(years = 2, salaryIncrease = 0.1) {
    const newSalary = Math.floor(this.contract.salary * (1 + salaryIncrease));
    this.contract.years += years;
    this.contract.yearsRemaining += years;
    this.contract.salary = newSalary;
    this.morale = Math.min(100, this.morale + 15);
    
    return { newSalary, yearsAdded: years };
  }

  weeklySalaryCost() {
    return this.contract.salary;
  }

  toJSON() {
    return {
      id: this.id,
      name: this.name,
      position: this.position,
      positionShort: this.positionShort,
      number: this.number,
      age: this.age,
      strength: this.strength,
      speed: this.speed,
      teamwork: this.teamwork,
      fatigue: this.fatigue,
      morale: this.morale,
      injury: this.injury,
      potential: this.potential,
      overall: this.overall,
      contract: this.contract,
      goals: this.goals,
      assists: this.assists,
      cleanSheets: this.cleanSheets,
      appearances: this.appearances,
      form: this.form,
      isYouth: this.isYouth,
      trainingHistory: this.trainingHistory,
      injuryHistory: this.injuryHistory
    };
  }

  static fromJSON(data) {
    return new Player(data);
  }
}
