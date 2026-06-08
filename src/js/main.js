let game;

window.addEventListener('DOMContentLoaded', () => {
  console.log('Pixel Sports Club - Loading...');
  
  try {
    game = new Game();
    window.game = game;
    console.log('Game initialized successfully');
    
    window.addEventListener('beforeunload', (e) => {
      if (game && game.season) {
        game.saveGame();
      }
    });
    
    window.addEventListener('keydown', (e) => {
      if (e.key === 'F5') {
        e.preventDefault();
        if (game) game.saveGame();
      }
      
      if (e.ctrlKey && e.key === 's') {
        e.preventDefault();
        if (game) game.saveGame();
      }
    });
    
  } catch (error) {
    console.error('Failed to initialize game:', error);
    
    const errorDiv = document.createElement('div');
    errorDiv.style.position = 'fixed';
    errorDiv.style.top = '50%';
    errorDiv.style.left = '50%';
    errorDiv.style.transform = 'translate(-50%, -50%)';
    errorDiv.style.background = '#1a1a2e';
    errorDiv.style.color = '#ff4444';
    errorDiv.style.padding = '30px';
    errorDiv.style.fontFamily = 'monospace';
    errorDiv.style.border = '3px solid #ff4444';
    errorDiv.style.zIndex = '9999';
    errorDiv.style.textAlign = 'center';
    errorDiv.innerHTML = `
      <h2>游戏启动失败</h2>
      <p>${error.message}</p>
      <p>请查看控制台获取详细信息</p>
    `;
    document.body.appendChild(errorDiv);
  }
});
