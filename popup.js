document.addEventListener('DOMContentLoaded', function() {
  const siteInput = document.getElementById('siteInput');
  const addBtn = document.getElementById('addBtn');
  const blockedList = document.getElementById('blockedList');
  const stats = document.getElementById('stats');
  
  // Загружаем список сайтов
  loadSites();
  
  // Обработчик добавления сайта
  addBtn.addEventListener('click', function() {
    const site = normalizeSite(siteInput.value.trim());
    if (site && isValidSite(site)) {
      addSite(site);
      siteInput.value = '';
    } else {
      alert('Пожалуйста, введите корректный домен сайта (например: youtube.com)');
    }
  });
  
  // Обработчик нажатия Enter
  siteInput.addEventListener('keypress', function(e) {
    if (e.key === 'Enter') {
      addBtn.click();
    }
  });
  
  // Фокусируемся на поле ввода
  siteInput.focus();
  
  // Нормализация введенного сайта
  function normalizeSite(site) {
    return site
      .replace(/^https?:\/\//, '')
      .replace(/^www\./, '')
      .replace(/\/.*$/, '')
      .trim()
      .toLowerCase();
  }
  
  // Проверка валидности сайта
  function isValidSite(site) {
    return site.includes('.') && 
           !site.includes(' ') && 
           !site.includes('/') &&
           site.length > 3;
  }
  
  function loadSites() {
    chrome.runtime.sendMessage(
      {action: 'getSites'}, 
      function(response) {
        if (response && response.sites) {
          renderSitesList(response.sites);
          updateStats(response.sites);
        }
      }
    );
  }
  
  function addSite(site) {
    chrome.runtime.sendMessage(
      {action: 'getSites'},
      function(response) {
        const currentSites = response?.sites || [];
        
        // Проверяем, нет ли уже такого сайта в списке
        const existingSite = currentSites.find(s => s.domain === site);
        if (!existingSite) {
          const newSite = {
            domain: site,
            enabled: true,
            added: new Date().toISOString()
          };
          const newSites = [...currentSites, newSite];
          
          saveSites(newSites);
        } else {
          alert('Этот сайт уже есть в списке');
        }
      }
    );
  }
  
  function toggleSite(siteDomain, currentState) {
    const newState = !currentState;
    
    chrome.runtime.sendMessage(
      {
        action: 'toggleSite',
        siteDomain: siteDomain,
        enabled: newState
      },
      function(response) {
        if (response && response.success) {
          renderSitesList(response.sites);
          updateStats(response.sites);
          showNotification(response.message);
          
          // Если выключили сайт, запускаем обновление таймера
          if (!newState) {
            startCountdown(siteDomain);
          }
        } else {
          alert('Ошибка при переключении: ' + (response?.error || 'неизвестная ошибка'));
          // Возвращаем переключатель в исходное состояние
          loadSites();
        }
      }
    );
  }
  
  function removeSite(siteDomain) {
    if (confirm(`Удалить ${siteDomain} из списка?`)) {
      chrome.runtime.sendMessage(
        {action: 'getSites'},
        function(response) {
          const currentSites = response?.sites || [];
          const newSites = currentSites.filter(site => site.domain !== siteDomain);
          
          saveSites(newSites);
        }
      );
    }
  }
  
  function saveSites(sites) {
    // Сохраняем в хранилище
    chrome.storage.sync.set({sites: sites}, function() {
      // Обновляем правила блокировки
      chrome.runtime.sendMessage(
        {action: 'updateBlockedSites', sites: sites},
        function(response) {
          if (response && response.success) {
            renderSitesList(sites);
            updateStats(sites);
          } else {
            alert('Ошибка при сохранении: ' + (response?.error || 'неизвестная ошибка'));
          }
        }
      );
    });
  }
  
  // Функция для отслеживания обратного отсчета
  function startCountdown(siteDomain) {
    const updateCountdown = () => {
      chrome.runtime.sendMessage(
        {action: 'getSiteStatus', siteDomain: siteDomain},
        function(response) {
          if (response && !response.error) {
            if (response.isInDelay && response.timeLeft > 0) {
              // Обновляем отображение времени
              updateSiteDisplay(siteDomain, response.timeLeft);
              setTimeout(updateCountdown, 1000);
            } else {
              // Задержка завершена, обновляем список
              updateSiteDisplay(siteDomain, 0);
              loadSites();
            }
          }
        }
      );
    };
    
    updateCountdown();
  }
  
  // Обновление отображения сайта с таймером
  function updateSiteDisplay(siteDomain, timeLeft) {
    const items = blockedList.getElementsByClassName('blocked-item');
    for (let item of items) {
      const siteName = item.querySelector('.site-name');
      if (siteName && siteName.textContent === siteDomain) {
        const statusBadge = item.querySelector('.status-badge');
        if (statusBadge) {
          if (timeLeft > 0) {
            statusBadge.textContent = `${timeLeft}с`;
            statusBadge.className = 'status-badge status-delay';
            statusBadge.title = 'Сайт будет разблокирован через ' + timeLeft + ' секунд';
          } else {
            statusBadge.textContent = 'выкл';
            statusBadge.className = 'status-badge status-inactive';
            statusBadge.title = 'Сайт выключен (доступен)';
          }
        }
        break;
      }
    }
  }
  
  function renderSitesList(sites) {
    blockedList.innerHTML = '';
    
    if (sites.length === 0) {
      const emptyMessage = document.createElement('div');
      emptyMessage.className = 'empty-message';
      emptyMessage.textContent = 'Список сайтов пуст\nДобавьте сайты для блокировки';
      blockedList.appendChild(emptyMessage);
      return;
    }
    
    // Сортируем сайты: сначала активные, потом с задержкой, потом выключенные
    const sortedSites = [...sites].sort((a, b) => {
      const now = new Date();
      const aInDelay = a.disabledUntil && new Date(a.disabledUntil) > now;
      const bInDelay = b.disabledUntil && new Date(b.disabledUntil) > now;
      
      if (a.enabled !== b.enabled) return a.enabled ? -1 : 1;
      if (aInDelay !== bInDelay) return aInDelay ? -1 : 1;
      return a.domain.localeCompare(b.domain);
    });
    
    sortedSites.forEach(site => {
      const item = document.createElement('div');
      item.className = 'blocked-item';
      
      const siteInfo = document.createElement('div');
      siteInfo.className = 'site-info';
      
      const siteName = document.createElement('span');
      siteName.className = 'site-name';
      siteName.textContent = site.domain;
      siteName.title = site.domain;
      
      // Бейдж статуса
      const statusBadge = document.createElement('span');
      const now = new Date();
      const isInDelay = site.disabledUntil && new Date(site.disabledUntil) > now;
      
      if (site.enabled) {
        statusBadge.className = 'status-badge status-active';
        statusBadge.textContent = 'вкл';
        statusBadge.title = 'Сайт заблокирован';
      } else if (isInDelay) {
        statusBadge.className = 'status-badge status-delay';
        const timeLeft = Math.ceil((new Date(site.disabledUntil) - now) / 1000);
        statusBadge.textContent = `${timeLeft}с`;
        statusBadge.title = 'Сайт будет разблокирован через ' + timeLeft + ' секунд';
      } else {
        statusBadge.className = 'status-badge status-inactive';
        statusBadge.textContent = 'выкл';
        statusBadge.title = 'Сайт выключен (доступен)';
      }
      
      // Контейнер для элементов управления
      const controls = document.createElement('div');
      controls.className = 'controls';
      
      // Переключатель
      const toggleLabel = document.createElement('label');
      toggleLabel.className = 'toggle-switch';
      
      const toggleInput = document.createElement('input');
      toggleInput.type = 'checkbox';
      toggleInput.checked = site.enabled;
      toggleInput.disabled = isInDelay; // Отключаем переключатель во время задержки
      toggleInput.addEventListener('change', function() {
        if (!isInDelay) {
          toggleSite(site.domain, site.enabled);
        }
      });
      
      const toggleSlider = document.createElement('span');
      toggleSlider.className = 'slider';
      
      toggleLabel.appendChild(toggleInput);
      toggleLabel.appendChild(toggleSlider);
      
      // Кнопка удаления
      const removeBtn = document.createElement('button');
      removeBtn.className = 'remove-btn';
      removeBtn.innerHTML = '×';
      removeBtn.title = 'Удалить сайт';
      removeBtn.addEventListener('click', function() {
        removeSite(site.domain);
      });
      
      // Собираем структуру
      siteInfo.appendChild(siteName);
      siteInfo.appendChild(statusBadge);
      
      controls.appendChild(toggleLabel);
      controls.appendChild(removeBtn);
      
      item.appendChild(siteInfo);
      item.appendChild(controls);
      blockedList.appendChild(item);
      
      // Запускаем отсчет времени для сайтов в задержке
      if (isInDelay) {
        startCountdown(site.domain);
      }
    });
  }
  
  function updateStats(sites) {
    const total = sites.length;
    const enabled = sites.filter(s => s.enabled).length;
    const now = new Date();
    const inDelay = sites.filter(s => 
      !s.enabled && s.disabledUntil && new Date(s.disabledUntil) > now
    ).length;
    const disabled = total - enabled - inDelay;
    
    stats.innerHTML = `
      Всего: ${total} | 
      Заблокировано: <span style="color: #4CAF50">${enabled}</span> | 
      В задержке: <span style="color: #ff9800">${inDelay}</span> | 
      Доступно: <span style="color: #f44336">${disabled}</span>
    `;
  }
  
  function showNotification(message) {
    // Создаем элемент уведомления
    const notification = document.createElement('div');
    notification.style.cssText = `
      position: fixed;
      top: 10px;
      right: 10px;
      background: #4CAF50;
      color: white;
      padding: 10px 15px;
      border-radius: 4px;
      z-index: 1000;
      font-size: 14px;
      box-shadow: 0 2px 5px rgba(0,0,0,0.2);
    `;
    notification.textContent = message;
    document.body.appendChild(notification);
    
    // Удаляем уведомление через 3 секунды
    setTimeout(() => {
      if (notification.parentNode) {
        document.body.removeChild(notification);
      }
    }, 3000);
  }
});