// Функция для проверки блокировки сайта и получения статуса
function checkIfSiteBlocked() {
  const currentHost = window.location.hostname;
  
  chrome.runtime.sendMessage(
    {
      action: 'getSiteStatus', 
      siteDomain: currentHost
    },
    function(response) {
      if (chrome.runtime.lastError) {
        console.log('Connection error:', chrome.runtime.lastError);
        return;
      }
      
      console.log('Site status:', currentHost, response);
      
      if (response && !response.error) {
        if (response.enabled) {
          // Сайт включен - показываем "заблокировано" без таймера
          showBlockedPage(currentHost, 'blocked');
        } else if (response.isInDelay && response.timeLeft > 0) {
          // Сайт в режиме задержки - показываем таймер
          showBlockedPage(currentHost, 'delay', response.timeLeft);
        } else {
          // Сайт выключен - не показываем блокировку
          console.log('Site is not blocked');
        }
      }
    }
  );
}

// Проверяем блокировку при загрузке страницы
checkIfSiteBlocked();

function showBlockedPage(blockedHost, mode, initialTimeLeft = 60) {
  // Останавливаем дальнейшую загрузку страницы
  window.stop();
  
  let displayContent = '';
  
  if (mode === 'blocked') {
    // Режим "заблокировано" - без таймера
    displayContent = `
      <div class="countdown">🚫 Заблокировано</div>
      <p>Сайт заблокирован расширением "Блокировщик сайтов".</p>
    `;
  } else {
    // Режим задержки - с таймером
    displayContent = `
      <div class="countdown" id="countdown">${initialTimeLeft} секунд</div>
      <div class="progress-bar">
        <div class="progress-fill" id="progressFill"></div>
      </div>
      <p id="countdownMessage">Сайт станет доступным через ${initialTimeLeft} секунд</p>
    `;
  }
  
  // Заменяем содержимое страницы
  document.documentElement.innerHTML = `
  <!DOCTYPE html>
  <html>
  <head>
    <meta charset="utf-8">
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
        text-align: center;
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
        margin-bottom: 20px;
      }
      .countdown {
        font-size: 1.8em;
        font-weight: bold;
        margin: 25px 0;
        padding: 15px;
        background: rgba(255, 255, 255, 0.2);
        border-radius: 10px;
        min-height: 30px;
      }
      .progress-bar {
        width: 100%;
        height: 8px;
        background: rgba(255, 255, 255, 0.3);
        border-radius: 4px;
        margin: 20px 0;
        overflow: hidden;
      }
      .progress-fill {
        height: 100%;
        background: #4CAF50;
        width: 100%;
        transition: width 1s linear;
      }
      .buttons {
        margin-top: 25px;
        display: flex;
        gap: 10px;
        justify-content: center;
        flex-wrap: wrap;
      }
      button {
        background: rgba(255, 255, 255, 0.2);
        border: 2px solid white;
        color: white;
        padding: 12px 24px;
        border-radius: 6px;
        cursor: pointer;
        font-size: 16px;
        transition: all 0.3s ease;
        min-width: 140px;
      }
      button:hover {
        background: white;
        color: #667eea;
      }
      #reloadPage {
        display: none;
        background: #4CAF50;
        border-color: #4CAF50;
      }
      p {
        line-height: 1.6;
        margin: 10px 0;
      }
    </style>
  </head>
  <body>
    <div class="blocked-container">
      <h1>🚫 Сайт заблокирован</h1>
      <p>Доступ к сайту <strong>${blockedHost}</strong> был ограничен.</p>
      
      ${displayContent}
      
      <div class="buttons">
        <button id="goBack">Вернуться назад</button>
        <button id="goHome">Перейти на главную</button>
        <button id="reloadPage">Обновить страницу</button>
      </div>
    </div>
    
    <script>
      let timeLeft = ${initialTimeLeft};
      let countdownInterval;
      
      function updateCountdown() {
        const countdownElement = document.getElementById('countdown');
        const progressFill = document.getElementById('progressFill');
        const countdownMessage = document.getElementById('countdownMessage');
        const reloadBtn = document.getElementById('reloadPage');
        
        if (timeLeft > 0) {
          timeLeft--;
          
          // Обновляем отображение
          let secondsText = 'секунд';
          if (timeLeft === 1) secondsText = 'секунда';
          else if (timeLeft > 1 && timeLeft < 5) secondsText = 'секунды';
          
          countdownElement.textContent = timeLeft + ' ' + secondsText;
          if (progressFill) {
            progressFill.style.width = (timeLeft / ${initialTimeLeft} * 100) + '%';
          }
          
          // Обновляем сообщение
          if (countdownMessage) {
            if (timeLeft > 30) {
              countdownMessage.textContent = 'Сайт станет доступным через ' + timeLeft + ' ' + secondsText;
            } else if (timeLeft > 10) {
              countdownMessage.textContent = 'Скоро... осталось ' + timeLeft + ' ' + secondsText;
            } else {
              countdownMessage.textContent = 'Почти готово! ' + timeLeft + ' ' + secondsText;
            }
          }
          
          // Меняем цвет когда осталось мало времени
          if (timeLeft <= 10) {
            countdownElement.style.color = '#ff4444';
            if (progressFill) progressFill.style.background = '#ff4444';
          } else if (timeLeft <= 30) {
            countdownElement.style.color = '#ff9800';
            if (progressFill) progressFill.style.background = '#ff9800';
          }
        } else {
          // Время вышло
          if (countdownInterval) clearInterval(countdownInterval);
          if (countdownElement) {
            countdownElement.textContent = 'Сайт разблокирован!';
            countdownElement.style.color = '#4CAF50';
          }
          if (countdownMessage) {
            countdownMessage.textContent = 'Нажмите "Обновить страницу" для доступа к сайту';
          }
          if (progressFill) {
            progressFill.style.width = '0%';
            progressFill.style.background = '#4CAF50';
          }
          
          // Показываем кнопку обновления
          if (reloadBtn) {
            reloadBtn.style.display = 'block';
          }
        }
      }
      
      document.getElementById('goBack').addEventListener('click', function() {
        window.history.back();
      });
      
      document.getElementById('goHome').addEventListener('click', function() {
        window.location.href = 'https://www.google.com';
      });
      
      document.getElementById('reloadPage').addEventListener('click', function() {
        window.location.reload();
      });
      
      // Запускаем обратный отсчет только в режиме задержки
      if (${mode === 'delay'}) {
        countdownInterval = setInterval(updateCountdown, 1000);
      }
    </script>
  </body>
  </html>
  `;
}

// Обработчик для обновления статуса в реальном времени
chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  if (message.action === 'siteUnblocked') {
    console.log('Site was unblocked:', message.domain);
    
    const reloadBtn = document.getElementById('reloadPage');
    const countdownElement = document.getElementById('countdown');
    const countdownMessage = document.getElementById('countdownMessage');
    
    if (reloadBtn) {
      // Останавливаем отсчет если он был
      if (window.countdownInterval) {
        clearInterval(window.countdownInterval);
      }
      
      // Обновляем интерфейс
      if (countdownElement) {
        countdownElement.textContent = 'Сайт разблокирован!';
        countdownElement.style.color = '#4CAF50';
      }
      if (countdownMessage) {
        countdownMessage.textContent = 'Нажмите "Обновить страницу" для доступа к сайту';
      }
      
      const progressFill = document.getElementById('progressFill');
      if (progressFill) {
        progressFill.style.width = '0%';
        progressFill.style.background = '#4CAF50';
      }
      
      reloadBtn.style.display = 'block';
    }
  }
  
  if (message.action === 'siteBlocked') {
    console.log('Site was blocked:', message.domain);
    // При блокировке перезагружаем страницу для применения изменений
    window.location.reload();
  }
  
  if (message.action === 'updateCountdown') {
    console.log('Updating countdown:', message.timeLeft);
    
    const countdownElement = document.getElementById('countdown');
    const progressFill = document.getElementById('progressFill');
    const countdownMessage = document.getElementById('countdownMessage');
    
    if (countdownElement && progressFill && countdownMessage) {
      // Синхронизируем таймер с расширением
      const timeLeft = message.timeLeft;
      
      let secondsText = 'секунд';
      if (timeLeft === 1) secondsText = 'секунда';
      else if (timeLeft > 1 && timeLeft < 5) secondsText = 'секунды';
      
      countdownElement.textContent = timeLeft + ' ' + secondsText;
      progressFill.style.width = (timeLeft / 60 * 100) + '%';
      
      if (timeLeft > 30) {
        countdownMessage.textContent = 'Сайт станет доступным через ' + timeLeft + ' ' + secondsText;
      } else if (timeLeft > 10) {
        countdownMessage.textContent = 'Скоро... осталось ' + timeLeft + ' ' + secondsText;
      } else {
        countdownMessage.textContent = 'Почти готово! ' + timeLeft + ' ' + secondsText;
      }
      
      // Меняем цвет когда осталось мало времени
      if (timeLeft <= 10) {
        countdownElement.style.color = '#ff4444';
        progressFill.style.background = '#ff4444';
      } else if (timeLeft <= 30) {
        countdownElement.style.color = '#ff9800';
        progressFill.style.background = '#ff9800';
      }
    }
  }
});