class Storage {
  static save(key, data) {
    try {
      localStorage.setItem(key, JSON.stringify(data));
      return true;
    } catch (e) {
      console.error('Storage save error:', e);
      return false;
    }
  }

  static load(key, defaultValue = null) {
    try {
      const data = localStorage.getItem(key);
      return data ? JSON.parse(data) : defaultValue;
    } catch (e) {
      console.error('Storage load error:', e);
      return defaultValue;
    }
  }

  static delete(key) {
    try {
      localStorage.removeItem(key);
      return true;
    } catch (e) {
      console.error('Storage delete error:', e);
      return false;
    }
  }

  static clear() {
    try {
      localStorage.clear();
      return true;
    } catch (e) {
      console.error('Storage clear error:', e);
      return false;
    }
  }

  static saveGame(gameState) {
    return this.save('pixel_sports_save', gameState);
  }

  static loadGame() {
    return this.load('pixel_sports_save', null);
  }

  static hasSave() {
    return this.load('pixel_sports_save', null) !== null;
  }
}
