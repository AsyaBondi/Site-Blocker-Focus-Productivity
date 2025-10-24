// Утилиты для локализации
const i18n = {
  translations: {},
  currentLanguage: 'en',
  
  init: async function() {
    // Загружаем выбранный язык из хранилища
    const result = await new Promise(resolve => {
      chrome.storage.sync.get(['language'], resolve);
    });
    
    this.currentLanguage = result.language || 'en';
    await this.loadTranslations(this.currentLanguage);
    this.applyTranslations();
  },
  
  loadTranslations: async function(lang) {
    try {
      const response = await fetch(`_locales/${lang}/messages.json`);
      this.translations = await response.json();
    } catch (error) {
      console.error('Error loading translations:', error);
    }
  },
  
  getMessage: function(key) {
    return this.translations[key]?.message || key;
  },
  
  applyTranslations: function() {
    // Обновляем все элементы с data-i18n атрибутом
    document.querySelectorAll('[data-i18n]').forEach(element => {
      const key = element.getAttribute('data-i18n');
      const translation = this.getMessage(key);
      
      if (element.tagName === 'INPUT' || element.tagName === 'TEXTAREA') {
        element.placeholder = translation;
      } else {
        element.textContent = translation;
      }
    });
    
    // Обновляем заголовок расширения
    document.getElementById('extensionTitle').textContent = this.getMessage('extensionName');
    
    // Обновляем кнопку добавления
    document.getElementById('addBtn').textContent = this.getMessage('addSite');
    
    // Обновляем placeholder поля ввода
    document.getElementById('siteInput').placeholder = this.getMessage('siteInputPlaceholder');
  },
  
  changeLanguage: async function(lang) {
    this.currentLanguage = lang;
    await this.loadTranslations(lang);
    this.applyTranslations();
    
    // Сохраняем выбор языка
    chrome.storage.sync.set({ language: lang });
    
    // Перезагружаем список сайтов для обновления текстов
    loadSites();
  }
};

// Основные функции
function loadSites() {
  chrome.runtime.sendMessage(
    {action: 'getSites'}, 
    function(response) {
      // Проверяем, не закрылось ли соединение
      if (chrome.runtime.lastError) {
        console.log('Connection closed, ignoring response');
        return;
      }
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
      if (chrome.runtime.lastError) return;
      
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
        alert(i18n.getMessage('siteAlreadyExists') || 'This site is already in the list');
      }
    }
  );
}

function toggleSite(siteDomain, currentState) {
  const newState = !currentState;
  
  console.log(`Toggling site ${siteDomain} from ${currentState} to ${newState}`);
  
  chrome.runtime.sendMessage(
    {
      action: 'toggleSite',
      siteDomain: siteDomain,
      enabled: newState
    },
    function(response) {
      if (chrome.runtime.lastError) {
        console.log('Toggle response error:', chrome.runtime.lastError);
        return;
      }
      
      if (response && response.success) {
        renderSitesList(response.sites);
        updateStats(response.sites);
        showNotification(response.message);
        
        // Если выключили сайт, запускаем обновление таймера
        if (!newState) {
          startCountdown(siteDomain);
        }
      } else {
        alert('Error: ' + (response?.error || 'unknown error'));
        // Возвращаем переключатель в исходное состояние
        loadSites();
      }
    }
  );
}

function removeSite(siteDomain) {
  if (confirm(`Remove ${siteDomain} from list?`)) {
    chrome.runtime.sendMessage(
      {action: 'getSites'},
      function(response) {
        if (chrome.runtime.lastError) return;
        
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
    // Обновляем список без отправки сообщения в background
    renderSitesList(sites);
    updateStats(sites);
    showNotification(i18n.getMessage('settingsSaved') || 'Settings saved');
  });
}

// Функция для отслеживания обратного отсчета
function startCountdown(siteDomain) {
  const updateCountdown = () => {
    chrome.runtime.sendMessage(
      {action: 'getSiteStatus', siteDomain: siteDomain},
      function(response) {
        if (chrome.runtime.lastError) return;
        
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
  const items = document.getElementById('blockedList').getElementsByClassName('blocked-item');
  for (let item of items) {
    const siteName = item.querySelector('.site-name');
    if (siteName && siteName.textContent === siteDomain) {
      const statusBadge = item.querySelector('.status-badge');
      if (statusBadge) {
        if (timeLeft > 0) {
          statusBadge.textContent = `${timeLeft}s`;
          statusBadge.className = 'status-badge status-delay';
        } else {
          statusBadge.textContent = i18n.getMessage('statusDisabled') || 'off';
          statusBadge.className = 'status-badge status-inactive';
        }
      }
      break;
    }
  }
}

function renderSitesList(sites) {
  const blockedList = document.getElementById('blockedList');
  blockedList.innerHTML = '';
  
  if (sites.length === 0) {
    const emptyMessage = document.createElement('div');
    emptyMessage.className = 'empty-message';
    emptyMessage.textContent = i18n.getMessage('emptyList') || 'No sites added yet';
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
      statusBadge.textContent = i18n.getMessage('statusEnabled') || 'on';
    } else if (isInDelay) {
      statusBadge.className = 'status-badge status-delay';
      const timeLeft = Math.ceil((new Date(site.disabledUntil) - now) / 1000);
      statusBadge.textContent = `${timeLeft}s`;
    } else {
      statusBadge.className = 'status-badge status-inactive';
      statusBadge.textContent = i18n.getMessage('statusDisabled') || 'off';
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
    toggleInput.disabled = isInDelay;
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
    removeBtn.title = i18n.getMessage('remove') || 'Remove';
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
  const stats = document.getElementById('stats');
  const total = sites.length;
  const enabled = sites.filter(s => s.enabled).length;
  const now = new Date();
  const inDelay = sites.filter(s => 
    !s.enabled && s.disabledUntil && new Date(s.disabledUntil) > now
  ).length;
  const disabled = total - enabled - inDelay;
  
  stats.innerHTML = `
    ${i18n.getMessage('totalSites') || 'Total'}: ${total} | 
    ${i18n.getMessage('blockedSites') || 'Blocked'}: <span style="color: #4CAF50">${enabled}</span> | 
    ${i18n.getMessage('inDelaySites') || 'In delay'}: <span style="color: #ff9800">${inDelay}</span> | 
    ${i18n.getMessage('availableSites') || 'Available'}: <span style="color: #f44336">${disabled}</span>
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

// Вспомогательные функции
function normalizeSite(site) {
  return site
    .replace(/^https?:\/\//, '')
    .replace(/^www\./, '')
    .replace(/\/.*$/, '')
    .trim()
    .toLowerCase();
}

function isValidSite(site) {
  return site.includes('.') && 
         !site.includes(' ') && 
         !site.includes('/') &&
         site.length > 3;
}

// Инициализация при загрузке страницы
document.addEventListener('DOMContentLoaded', async function() {
  const siteInput = document.getElementById('siteInput');
  const addBtn = document.getElementById('addBtn');
  const languageSelect = document.getElementById('languageSelect');
  
  // Инициализируем локализацию
  await i18n.init();
  
  // Устанавливаем выбранный язык в селекторе
  languageSelect.value = i18n.currentLanguage;
  
  // Обработчик смены языка
  languageSelect.addEventListener('change', function() {
    i18n.changeLanguage(this.value);
  });
  
  // Загружаем список сайтов
  loadSites();
  
  // Обработчик добавления сайта
  addBtn.addEventListener('click', function() {
    const site = normalizeSite(siteInput.value.trim());
    if (site && isValidSite(site)) {
      addSite(site);
      siteInput.value = '';
    } else {
      alert('Please enter a valid domain (e.g., youtube.com)');
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
});