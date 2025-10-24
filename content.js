// Показываем страницу блокировки, если сайт заблокирован
chrome.runtime.sendMessage({action: 'getBlockedSites'}, function(response) {
  if (response && response.sites) {
    const currentHost = window.location.hostname;
    const isBlocked = response.sites.some(site => {
      const siteLower = site.toLowerCase().trim();
      return currentHost === siteLower || 
             currentHost.endsWith('.' + siteLower) ||
             currentHost.includes(siteLower);
    });
    
    if (isBlocked) {
      showBlockedPage(currentHost);
    }
  }
});

function showBlockedPage(blockedHost) {
  // Сохраняем оригинальный URL для возможности вернуться
  const originalUrl = window.location.href;
  
  // Заменяем содержимое страницы
  document.documentElement.innerHTML = `
  <!DOCTYPE html>
  <html>
  <head>
    <title>Сайт заблокирован</title>
    <style>
      body {
        font-family: Arial, sans-serif;
        background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
        margin: 0;
        padding: 0;
        display: flex;
        justify-content: center;
        align-items: center;
        height: 100vh;
        color: white;
      }
      .blocked-container {
        background: rgba(255, 255, 255, 0.1);
        backdrop-filter: blur(10px);
        padding: 40px;
        border-radius: 15px;
        text-align: center;
        max-width: 500px;
        box-shadow: 0 8px 32px rgba(0, 0, 0, 0.3);
      }
      h1 {
        margin-top: 0;
        font-size: 2em;
      }
      .buttons {
        margin-top: 20px;
      }
      button {
        background: rgba(255, 255, 255, 0.2);
        border: 2px solid white;
        color: white;
        padding: 10px 20px;
        margin: 0 10px;
        border-radius: 5px;
        cursor: pointer;
        font-size: 16px;
        transition: all 0.3s ease;
      }
      button:hover {
        background: white;
        color: #667eea;
      }
    </style>
  </head>
  <body>
    <div class="blocked-container">
      <h1>🚫 Сайт заблокирован</h1>
      <p>Доступ к сайту <strong>${blockedHost}</strong> был ограничен расширением "Блокировщик сайтов".</p>
      <p>Это помогает сосредоточиться на работе и избежать отвлекающих факторов.</p>
      <div class="buttons">
        <button id="goBack">Вернуться назад</button>
        <button id="goHome">Перейти на главную</button>
      </div>
    </div>
    
    <script>
      document.getElementById('goBack').addEventListener('click', function() {
        window.history.back();
      });
      
      document.getElementById('goHome').addEventListener('click', function() {
        window.location.href = 'https://www.google.com';
      });
    </script>
  </body>
  </html>
  `;
}