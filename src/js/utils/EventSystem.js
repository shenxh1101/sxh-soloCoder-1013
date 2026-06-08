class EventSystem {
  constructor() {
    this.listeners = {};
    this.mouseX = 0;
    this.mouseY = 0;
    this.buttons = {};
  }

  on(event, callback) {
    if (!this.listeners[event]) {
      this.listeners[event] = [];
    }
    this.listeners[event].push(callback);
  }

  off(event, callback) {
    if (!this.listeners[event]) return;
    this.listeners[event] = this.listeners[event].filter(cb => cb !== callback);
  }

  emit(event, data = null) {
    if (!this.listeners[event]) return;
    this.listeners[event].forEach(callback => callback(data));
  }

  bindCanvas(canvas) {
    canvas.addEventListener('mousemove', (e) => {
      const rect = canvas.getBoundingClientRect();
      this.mouseX = (e.clientX - rect.left) * (canvas.width / rect.width);
      this.mouseY = (e.clientY - rect.top) * (canvas.height / rect.height);
      this.emit('mousemove', { x: this.mouseX, y: this.mouseY });
    });

    canvas.addEventListener('mousedown', (e) => {
      this.buttons[e.button] = true;
      this.emit('mousedown', { x: this.mouseX, y: this.mouseY, button: e.button });
    });

    canvas.addEventListener('mouseup', (e) => {
      this.buttons[e.button] = false;
      this.emit('mouseup', { x: this.mouseX, y: this.mouseY, button: e.button });
    });

    canvas.addEventListener('click', (e) => {
      const rect = canvas.getBoundingClientRect();
      const x = (e.clientX - rect.left) * (canvas.width / rect.width);
      const y = (e.clientY - rect.top) * (canvas.height / rect.height);
      this.emit('click', { x, y, button: e.button });
    });

    window.addEventListener('keydown', (e) => {
      this.emit('keydown', { key: e.key, code: e.code });
    });

    window.addEventListener('keyup', (e) => {
      this.emit('keyup', { key: e.key, code: e.code });
    });
  }

  isButtonPressed(button = 0) {
    return this.buttons[button] === true;
  }
}
