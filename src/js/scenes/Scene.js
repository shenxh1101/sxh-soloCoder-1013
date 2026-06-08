class Scene {
  constructor(game) {
    this.game = game;
    this.renderer = game.renderer;
    this.events = game.events;
    this.uiElements = [];
    this.active = false;
    this.hoveredElement = null;
    this.selectedElement = null;
    this.notifications = [];
  }

  init() {
    this.active = true;
    this.setupEventListeners();
  }

  cleanup() {
    this.active = false;
    this.removeEventListeners();
  }

  setupEventListeners() {
    this.clickHandler = (e) => this.handleClick(e);
    this.mouseMoveHandler = (e) => this.handleMouseMove(e);
    this.keyHandler = (e) => this.handleKeyDown(e);

    this.events.on('click', this.clickHandler);
    this.events.on('mousemove', this.mouseMoveHandler);
    this.events.on('keydown', this.keyHandler);
  }

  removeEventListeners() {
    this.events.off('click', this.clickHandler);
    this.events.off('mousemove', this.mouseMoveHandler);
    this.events.off('keydown', this.keyHandler);
  }

  handleClick(e) {
    if (!this.active) return;
    
    this.uiElements.forEach(element => {
      if (element.onClick && this.renderer.isPointInRect(e.x, e.y, element.x, element.y, element.w, element.h)) {
        element.onClick(e, element);
      }
    });
  }

  handleMouseMove(e) {
    if (!this.active) return;
    
    let found = null;
    this.uiElements.forEach(element => {
      if (this.renderer.isPointInRect(e.x, e.y, element.x, element.y, element.w, element.h)) {
        found = element;
      }
    });
    
    if (found !== this.hoveredElement) {
      if (this.hoveredElement && this.hoveredElement.onHoverOut) {
        this.hoveredElement.onHoverOut(e, this.hoveredElement);
      }
      this.hoveredElement = found;
      if (found && found.onHover) {
        found.onHover(e, found);
      }
    }
  }

  handleKeyDown(e) {
    if (!this.active) return;
    
    if (e.key === 'Escape') {
      this.game.goToScene('mainMenu');
    }
  }

  addUIElement(element) {
    this.uiElements.push(element);
    return element;
  }

  removeUIElement(element) {
    const index = this.uiElements.indexOf(element);
    if (index > -1) {
      this.uiElements.splice(index, 1);
    }
  }

  clearUIElements() {
    this.uiElements = [];
  }

  showNotification(message, type = 'info', duration = 3000) {
    const notification = {
      message,
      type,
      startTime: Date.now(),
      duration
    };
    this.notifications.push(notification);
    
    setTimeout(() => {
      const index = this.notifications.indexOf(notification);
      if (index > -1) {
        this.notifications.splice(index, 1);
      }
    }, duration);
  }

  drawButton(x, y, w, h, text, onClick, type = 'default', data = null) {
    const element = { x, y, w, h, text, type, data, onClick };
    return this.addUIElement(element);
  }

  drawPanel(x, y, w, h, title = null) {
    this.renderer.drawPanel(x, y, w, h);
    if (title) {
      this.renderer.drawTextCentered(title, x, y + 8, w, this.renderer.palette.gold, 12);
    }
  }

  update(deltaTime) {
  }

  render() {
    this.uiElements.forEach(element => {
      const isHovered = element === this.hoveredElement;
      const isPressed = element === this.selectedElement;
      
      if (element.text) {
        this.renderer.drawButton(
          element.x, element.y, element.w, element.h,
          element.text, isHovered, isPressed, element.type
        );
      }
    });

    this.renderNotifications();
  }

  renderNotifications() {
    const now = Date.now();
    let yOffset = 10;
    
    this.notifications.forEach(notification => {
      const elapsed = now - notification.startTime;
      const alpha = Math.max(0, 1 - elapsed / notification.duration);
      
      if (alpha > 0) {
        let bgColor, textColor;
        switch (notification.type) {
          case 'success':
            bgColor = 'rgba(74, 122, 74, 0.9)';
            textColor = '#44ff44';
            break;
          case 'error':
            bgColor = 'rgba(122, 74, 74, 0.9)';
            textColor = '#ff4444';
            break;
          case 'warning':
            bgColor = 'rgba(122, 100, 50, 0.9)';
            textColor = '#ffcc00';
            break;
          default:
            bgColor = 'rgba(42, 42, 74, 0.9)';
            textColor = '#e0e0ff';
        }
        
        const textWidth = this.renderer.ctx.measureText(notification.message).width;
        const boxWidth = Math.min(400, textWidth + 40);
        const x = (this.renderer.width - boxWidth) / 2;
        
        this.renderer.drawRect(x, yOffset, boxWidth, 40, bgColor);
        this.renderer.drawBorder(x, yOffset, boxWidth, 40, this.renderer.palette.border, 2);
        this.renderer.drawTextCentered(notification.message, x, yOffset + 14, boxWidth, textColor, 10);
        
        yOffset += 50;
      }
    });
  }

  formatCurrency(amount) {
    if (amount >= 1000000) {
      return `${(amount / 1000000).toFixed(1)}M`;
    } else if (amount >= 1000) {
      return `${(amount / 1000).toFixed(0)}K`;
    }
    return amount.toString();
  }

  goToScene(sceneName) {
    this.game.goToScene(sceneName);
  }

  getPlayerTeam() {
    return this.game.season?.getPlayerTeam();
  }

  getSeason() {
    return this.game.season;
  }
}
