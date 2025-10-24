// Функция для проверки блокировки сайта и получения статуса
function checkIfSiteBlocked() {
  const currentHost = window.location.hostname;
  
  chrome.runtime.sendMessage(
    {
      action: 'getBlockedSites'
    },
    function(response) {
      if (chrome.runtime.lastError) {
        console.log('Connection error:', chrome.runtime.lastError);
        return;
      }
      
      console.log('Current host:', currentHost);
      console.log('Blocked sites list:', response?.sites);
      
      if (response && response.sites) {
        const isBlocked = isDomainBlocked(currentHost, response.sites);
        console.log('Is site blocked?', isBlocked);
        
        if (isBlocked) {
          // Получаем детальный статус для отображения правильного интерфейса
          getSiteStatusAndShowBlockPage(currentHost);
        }
      }
    }
  );
}

// Функция для проверки блокировки домена (включая поддомены)
function isDomainBlocked(host, blockedSites) {
  const hostLower = host.toLowerCase();
  
  return blockedSites.some(blockedSite => {
    const blockedSiteLower = blockedSite.toLowerCase().trim();
    
    // Проверяем точное совпадение
    if (hostLower === blockedSiteLower) {
      return true;
    }
    
    // Проверяем поддомены (например: ru.yummyani.me для yummyani.me)
    if (hostLower.endsWith('.' + blockedSiteLower)) {
      return true;
    }
    
    return false;
  });
}

// Функция для получения статуса сайта и показа соответствующей страницы блокировки
function getSiteStatusAndShowBlockPage(host) {
  // Находим основной домен для проверки статуса
  const mainDomain = findMainDomain(host);
  
  chrome.runtime.sendMessage(
    {
      action: 'getSiteStatus', 
      siteDomain: mainDomain
    },
    function(response) {
      if (chrome.runtime.lastError) {
        console.log('Connection error:', chrome.runtime.lastError);
        return;
      }
      
      console.log('Site status for', mainDomain, ':', response);
      
      if (response && !response.error) {
        if (response.enabled) {
          // Сайт включен - показываем "заблокировано" без таймера
          showBlockedPage(host, 'blocked');
        } else if (response.isInDelay && response.timeLeft > 0) {
          // Сайт в режиме задержки - показываем таймер
          showBlockedPage(host, 'delay', response.timeLeft);
        } else {
          // Сайт выключен - не показываем блокировку
          console.log('Site is not blocked');
        }
      }
    }
  );
}

// Функция для нахождения основного домена из поддомена
function findMainDomain(host) {
  const parts = host.split('.');
  if (parts.length > 2) {
    // Для поддоменов типа ru.yummyani.me возвращаем yummyani.me
    return parts.slice(-2).join('.');
  }
  return host;
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
      .auto-reload-message {
        font-size: 14px;
        color: rgba(255, 255, 255, 0.8);
        margin-top: 10px;
      }
    </style>
  </head>
  <body>
    <div class="blocked-container">
      <h1>🚫 Сайт заблокирован</h1>
      <p>Доступ к сайту <strong>${blockedHost}</strong> был ограничен.</p>
      
      ${displayContent}
      
      <div class="buttons">
        <button id="reloadPage">Обновить страницу</button>
      </div>
      ${mode === 'delay' ? '<p class="auto-reload-message">Страница автоматически обновится после окончания таймера</p>' : ''}
    </div>
    
    <script>
      let timeLeft = ${initialTimeLeft};
      let countdownInterval;
      let autoReloadTimeout;
      
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
          
          if (countdownElement) {
            countdownElement.textContent = timeLeft + ' ' + secondsText;
          }
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
            if (countdownElement) countdownElement.style.color = '#ff4444';
            if (progressFill) progressFill.style.background = '#ff4444';
          } else if (timeLeft <= 30) {
            if (countdownElement) countdownElement.style.color = '#ff9800';
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
            countdownMessage.textContent = 'Страница обновится автоматически...';
          }
          if (progressFill) {
            progressFill.style.width = '0%';
            progressFill.style.background = '#4CAF50';
          }
          
          // Автоматически обновляем страницу через 2 секунды
          autoReloadTimeout = setTimeout(() => {
            console.log('Auto-reloading page after countdown');
            window.location.reload();
          }, 2000);
          
          // Показываем кнопку обновления (на всякий случай)
          if (reloadBtn) {
            reloadBtn.style.display = 'block';
          }
        }
      }
      
      document.getElementById('reloadPage').addEventListener('click', function() {
        if (autoReloadTimeout) clearTimeout(autoReloadTimeout);
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
    
    const currentHost = window.location.hostname;
    const mainDomain = findMainDomain(currentHost);
    
    // Проверяем, относится ли разблокировка к текущему сайту
    if (mainDomain === message.domain) {
      console.log('Auto-reloading page due to site unblocking');
      
      // Автоматически обновляем страницу
      setTimeout(() => {
        window.location.reload();
      }, 1000);
    }
  }
  
  if (message.action === 'siteBlocked') {
    console.log('Site was blocked:', message.domain);
    
    const currentHost = window.location.hostname;
    const mainDomain = findMainDomain(currentHost);
    
    // Проверяем, относится ли блокировка к текущему сайту
    if (mainDomain === message.domain) {
      // При блокировке перезагружаем страницу для применения изменений
      window.location.reload();
    }
  }
  
  if (message.action === 'updateCountdown') {
    console.log('Updating countdown:', message.timeLeft, 'for domain:', message.domain);
    
    const currentHost = window.location.hostname;
    const mainDomain = findMainDomain(currentHost);
    
    // Проверяем, относится ли обновление таймера к текущему сайту
    if (mainDomain === message.domain) {
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
        
        // Если время вышло, обновляем страницу
        if (timeLeft === 0) {
          console.log('Countdown finished, reloading page');
          setTimeout(() => {
            window.location.reload();
          }, 1000);
        }
      }
    }
  }
});