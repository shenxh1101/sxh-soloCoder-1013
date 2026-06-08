class PixelRenderer {
  constructor(canvas) {
    this.canvas = canvas;
    this.ctx = canvas.getContext('2d');
    this.ctx.imageSmoothingEnabled = false;
    this.width = canvas.width;
    this.height = canvas.height;
    this.palette = {
      bg: '#1a1a2e',
      bgDark: '#0f0f1a',
      panel: '#2a2a4a',
      panelLight: '#3a3a5a',
      border: '#4a4a7a',
      borderLight: '#5a5a8a',
      text: '#e0e0ff',
      textMuted: '#8080a0',
      gold: '#ffcc00',
      goldDark: '#aa6600',
      red: '#ff4444',
      green: '#44ff44',
      blue: '#4488ff',
      yellow: '#ffcc44',
      purple: '#cc44ff',
      cyan: '#44ffff',
      orange: '#ff8844'
    };
  }

  clear(color = this.palette.bg) {
    this.ctx.fillStyle = color;
    this.ctx.fillRect(0, 0, this.width, this.height);
  }

  drawRect(x, y, w, h, color) {
    this.ctx.fillStyle = color;
    this.ctx.fillRect(Math.floor(x), Math.floor(y), Math.floor(w), Math.floor(h));
  }

  drawPixel(x, y, color) {
    this.drawRect(x, y, 1, 1, color);
  }

  drawBorder(x, y, w, h, borderColor, borderWidth = 2) {
    this.drawRect(x, y, w, borderWidth, borderColor);
    this.drawRect(x, y + h - borderWidth, w, borderWidth, borderColor);
    this.drawRect(x, y, borderWidth, h, borderColor);
    this.drawRect(x + w - borderWidth, y, borderWidth, h, borderColor);
  }

  drawPanel(x, y, w, h, color = null) {
    const bg = color || this.palette.panel;
    this.drawRect(x, y, w, h, bg);
    this.drawRect(x + 2, y + 2, w - 4, 2, this.palette.panelLight);
    this.drawRect(x + 2, y + 2, 2, h - 4, this.palette.panelLight);
    this.drawRect(x + 2, y + h - 4, w - 4, 2, this.palette.bgDark);
    this.drawRect(x + w - 4, y + 2, 2, h - 4, this.palette.bgDark);
    this.drawBorder(x, y, w, h, this.palette.border, 3);
  }

  drawText(text, x, y, color = this.palette.text, size = 12, shadow = true) {
    this.ctx.font = `${size}px "Press Start 2P", monospace`;
    this.ctx.textBaseline = 'top';
    if (shadow) {
      this.ctx.fillStyle = '#000';
      this.ctx.fillText(text, Math.floor(x) + 2, Math.floor(y) + 2);
    }
    this.ctx.fillStyle = color;
    this.ctx.fillText(text, Math.floor(x), Math.floor(y));
  }

  drawTextCentered(text, x, y, width, color = this.palette.text, size = 12) {
    this.ctx.font = `${size}px "Press Start 2P", monospace`;
    const textWidth = this.ctx.measureText(text).width;
    const textX = x + (width - textWidth) / 2;
    this.drawText(text, textX, y, color, size);
  }

  drawStatBar(x, y, width, height, value, maxValue, color) {
    this.drawRect(x, y, width, height, this.palette.bgDark);
    this.drawBorder(x, y, width, height, this.palette.border, 2);
    const fillWidth = Math.floor((value / maxValue) * (width - 4));
    if (fillWidth > 0) {
      this.drawRect(x + 2, y + 2, fillWidth, height - 4, color);
    }
  }

  drawButton(x, y, w, h, text, hovered = false, pressed = false, type = 'default') {
    let baseColor, lightColor, darkColor;
    switch (type) {
      case 'primary':
        baseColor = '#3d5c3d';
        lightColor = '#5a9a5a';
        darkColor = '#1a2e1a';
        break;
      case 'danger':
        baseColor = '#5c3d3d';
        lightColor = '#9a5a5a';
        darkColor = '#2e1a1a';
        break;
      default:
        baseColor = '#3d3d5c';
        lightColor = '#5a5a8a';
        darkColor = '#1a1a2e';
    }

    let offsetX = 0, offsetY = 0;
    if (pressed) {
      offsetX = 2;
      offsetY = 2;
    }

    const drawX = x + offsetX;
    const drawY = y + offsetY;

    this.drawRect(drawX, drawY, w, h, hovered ? '#4a4a7a' : baseColor);
    this.drawRect(drawX + 2, drawY + 2, w - 4, 2, lightColor);
    this.drawRect(drawX + 2, drawY + 2, 2, h - 4, lightColor);
    this.drawRect(drawX + 2, drawY + h - 4, w - 4, 2, darkColor);
    this.drawRect(drawX + w - 4, drawY + 2, 2, h - 4, darkColor);
    this.drawBorder(drawX, drawY, w, h, this.palette.border, 3);

    if (!pressed) {
      this.drawRect(drawX + w, drawY + 4, 4, h, this.palette.bgDark);
      this.drawRect(drawX + 4, drawY + h, w, 4, this.palette.bgDark);
    }

    this.drawTextCentered(text, drawX, drawY + (h - 12) / 2, w, pressed ? '#c0c0e0' : this.palette.text, 10);
  }

  drawPixelSprite(x, y, spriteData, scale = 1) {
    for (let py = 0; py < spriteData.length; py++) {
      for (let px = 0; px < spriteData[py].length; px++) {
        const colorIndex = spriteData[py][px];
        if (colorIndex !== 0) {
          const color = this.palette[Object.keys(this.palette)[colorIndex - 1]] || '#fff';
          this.drawRect(
            x + px * scale,
            y + py * scale,
            scale,
            scale,
            color
          );
        }
      }
    }
  }

  drawStadiumBackground() {
    this.drawRect(0, 0, this.width, this.height, '#1a3a1a');
    this.drawRect(50, 80, this.width - 100, this.height - 160, '#2a5a2a');
    
    for (let i = 0; i < 10; i++) {
      const stripeX = 50 + i * ((this.width - 100) / 10);
      const stripeW = (this.width - 100) / 20;
      this.drawRect(stripeX, 80, stripeW, this.height - 160, '#1f4a1f');
    }
    
    this.drawRect(50, (this.height - 40) / 2, this.width - 100, 2, '#ffffff');
    this.drawRect((this.width - 120) / 2, (this.height - 160) / 2 + 80, 120, 2, '#ffffff');
    
    this.drawRect(50, 120, 80, this.height - 240, '#2a5a2a');
    this.drawBorder(50, 120, 80, this.height - 240, '#ffffff', 2);
    this.drawRect(this.width - 130, 120, 80, this.height - 240, '#2a5a2a');
    this.drawBorder(this.width - 130, 120, 80, this.height - 240, '#ffffff', 2);
  }

  drawMenuBackground() {
    this.drawRect(0, 0, this.width, this.height, this.palette.bgDark);
    
    for (let i = 0; i < 50; i++) {
      const x = (i * 73) % this.width;
      const y = (i * 47) % this.height;
      const size = (i % 3) + 1;
      this.drawRect(x, y, size, size, i % 2 === 0 ? '#2a2a4a' : '#1a1a2e');
    }
    
    for (let i = 0; i < 8; i++) {
      const x = (i * 120 + 50) % this.width;
      const y = 100 + (i % 3) * 200;
      this.drawPixelPlayer(x, y, (i % 4) + 1);
    }
  }

  drawPixelPlayer(x, y, teamColor = 1, scale = 2) {
    const colors = {
      1: { shirt: '#ff4444', shorts: '#222244' },
      2: { shirt: '#4444ff', shorts: '#ffffff' },
      3: { shirt: '#44ff44', shorts: '#222222' },
      4: { shirt: '#ffcc00', shorts: '#442200' }
    };
    const c = colors[teamColor] || colors[1];

    this.drawRect(x + 4 * scale, y, 4 * scale, 4 * scale, '#ffcc99');
    this.drawRect(x + 5 * scale, y + scale, 2 * scale, 2 * scale, '#000');
    
    this.drawRect(x + 3 * scale, y + 4 * scale, 6 * scale, 6 * scale, c.shirt);
    this.drawRect(x + 2 * scale, y + 5 * scale, scale, 4 * scale, c.shirt);
    this.drawRect(x + 9 * scale, y + 5 * scale, scale, 4 * scale, c.shirt);
    
    this.drawRect(x + 4 * scale, y + 10 * scale, 4 * scale, 5 * scale, c.shorts);
    
    this.drawRect(x + 4 * scale, y + 15 * scale, 2 * scale, 3 * scale, '#222');
    this.drawRect(x + 6 * scale, y + 15 * scale, 2 * scale, 3 * scale, '#222');
    
    this.drawRect(x + 3 * scale, y + 17 * scale, 3 * scale, scale, '#000');
    this.drawRect(x + 6 * scale, y + 17 * scale, 3 * scale, scale, '#000');
  }

  drawTrophy(x, y, scale = 2, unlocked = true) {
    const color = unlocked ? this.palette.gold : '#555';
    const colorDark = unlocked ? this.palette.goldDark : '#333';

    this.drawRect(x + 3 * scale, y, 6 * scale, 2 * scale, color);
    this.drawRect(x + 2 * scale, y + 2 * scale, 8 * scale, 8 * scale, color);
    this.drawRect(x + scale, y + 3 * scale, scale, 6 * scale, color);
    this.drawRect(x + 10 * scale, y + 3 * scale, scale, 6 * scale, color);
    
    this.drawRect(x + 3 * scale, y + 3 * scale, 6 * scale, 6 * scale, colorDark);
    
    this.drawRect(x + 4 * scale, y + 10 * scale, 4 * scale, scale, color);
    this.drawRect(x + 3 * scale, y + 11 * scale, 6 * scale, 2 * scale, colorDark);
    this.drawRect(x + scale, y + 13 * scale, 10 * scale, 2 * scale, color);
    
    if (unlocked) {
      this.drawRect(x + 4 * scale, y + 4 * scale, scale, scale, '#ffffff');
    }
  }

  drawTrainingIcon(x, y, type, scale = 3) {
    const colors = {
      strength: '#ff4444',
      speed: '#44ff44',
      teamwork: '#4488ff',
      recovery: '#ffcc00'
    };
    const color = colors[type] || '#fff';

    this.drawPanel(x, y, 32 * scale / 3, 32 * scale / 3, this.palette.panel);

    switch (type) {
      case 'strength':
        this.drawRect(x + 4 * scale / 3, y + 12 * scale / 3, 24 * scale / 3, 8 * scale / 3, color);
        this.drawRect(x + 2 * scale / 3, y + 10 * scale / 3, 4 * scale / 3, 12 * scale / 3, color);
        this.drawRect(x + 26 * scale / 3, y + 10 * scale / 3, 4 * scale / 3, 12 * scale / 3, color);
        break;
      case 'speed':
        this.drawRect(x + 8 * scale / 3, y + 6 * scale / 3, 12 * scale / 3, 4 * scale / 3, color);
        this.drawRect(x + 6 * scale / 3, y + 10 * scale / 3, 12 * scale / 3, 4 * scale / 3, color);
        this.drawRect(x + 4 * scale / 3, y + 14 * scale / 3, 12 * scale / 3, 4 * scale / 3, color);
        this.drawRect(x + 18 * scale / 3, y + 18 * scale / 3, 8 * scale / 3, 6 * scale / 3, color);
        break;
      case 'teamwork':
        this.drawPixelPlayer(x + 2 * scale / 3, y + 4 * scale / 3, 1, scale / 3);
        this.drawPixelPlayer(x + 16 * scale / 3, y + 4 * scale / 3, 2, scale / 3);
        this.drawRect(x + 10 * scale / 3, y + 16 * scale / 3, 12 * scale / 3, 2 * scale / 3, color);
        break;
      case 'recovery':
        this.drawRect(x + 14 * scale / 3, y + 4 * scale / 3, 4 * scale / 3, 24 * scale / 3, color);
        this.drawRect(x + 4 * scale / 3, y + 14 * scale / 3, 24 * scale / 3, 4 * scale / 3, color);
        break;
    }
  }

  isPointInRect(px, py, rx, ry, rw, rh) {
    return px >= rx && px <= rx + rw && py >= ry && py <= ry + rh;
  }
}
