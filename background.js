// Кэш для таймеров задержки
const delayTimers = new Map();

// Загрузка сайтов из хранилища
async function loadSites() {
  return new Promise((resolve) => {
    chrome.storage.sync.get(['sites'], function(result) {
      const sites = result.sites || [];
      resolve(sites);
    });
  });
}

// Сохранение сайтов в хранилище
async function saveSites(sites) {
  return new Promise((resolve) => {
    chrome.storage.sync.set({sites: sites}, function() {
      resolve();
    });
  });
}

// Функция для отправки обновлений таймера во все вкладки
function updateCountdownInTabs(siteDomain, timeLeft) {
  chrome.tabs.query({}, function(tabs) {
    tabs.forEach(tab => {
      if (tab.url && tab.url.includes(siteDomain)) {
        try {
          chrome.tabs.sendMessage(tab.id, {
            action: 'updateCountdown',
            timeLeft: timeLeft,
            domain: siteDomain
          });
        } catch (error) {
          console.log('Could not update countdown in tab:', error);
        }
      }
    });
  });
}

// Функция для завершения задержки и полного разблокирования сайта
async function completeSiteDelay(siteDomain) {
  console.log(`Completing delay for site: ${siteDomain}`);
  
  const sites = await loadSites();
  const updatedSites = sites.map(site => 
    site.domain === siteDomain 
      ? {...site, disabledUntil: null}
      : site
  );
  
  await saveSites(updatedSites);
  
  // Очищаем таймеры
  const timerData = delayTimers.get(siteDomain);
  if (timerData) {
    clearInterval(timerData.updateInterval);
    delayTimers.delete(siteDomain);
  }
  
  // Уведомляем все вкладки с этим сайтом о разблокировке
  chrome.tabs.query({}, function(tabs) {
    tabs.forEach(tab => {
      if (tab.url && tab.url.includes(siteDomain)) {
        try {
          chrome.tabs.sendMessage(tab.id, {
            action: 'siteUnblocked', 
            domain: siteDomain
          });
        } catch (error) {
          console.log('Could not send message to tab:', error);
        }
      }
    });
  });
  
  console.log(`Site ${siteDomain} is now fully unblocked`);
  return updatedSites;
}

// Функция для выключения сайта с задержкой
async function disableSiteWithDelay(siteDomain) {
  console.log(`Disabling site with 60-second delay: ${siteDomain}`);
  
  const sites = await loadSites();
  const disabledUntil = new Date(Date.now() + 60000);
  
  const updatedSites = sites.map(site => 
    site.domain === siteDomain 
      ? {...site, enabled: false, disabledUntil: disabledUntil.toISOString()}
      : site
  );
  
  await saveSites(updatedSites);
  
  // Сразу отправляем начальное значение таймера во все вкладки
  updateCountdownInTabs(siteDomain, 60);
  
  // Устанавливаем таймер на 60 секунд с периодическим обновлением
  let timeLeft = 60;
  const updateInterval = setInterval(() => {
    timeLeft--;
    if (timeLeft > 0) {
      updateCountdownInTabs(siteDomain, timeLeft);
    }
  }, 1000);
  
  const timerId = setTimeout(async () => {
    clearInterval(updateInterval);
    console.log(`60-second delay expired for ${siteDomain}`);
    await completeSiteDelay(siteDomain);
  }, 60000);
  
  // Сохраняем оба таймера
  delayTimers.set(siteDomain, {timerId, updateInterval});
  
  return updatedSites;
}

// Функция для включения сайта
async function enableSite(siteDomain) {
  console.log(`Enabling site: ${siteDomain}`);
  
  // Отменяем таймер задержки, если он есть
  const timerData = delayTimers.get(siteDomain);
  if (timerData) {
    clearTimeout(timerData.timerId);
    clearInterval(timerData.updateInterval);
    delayTimers.delete(siteDomain);
  }
  
  const sites = await loadSites();
  const updatedSites = sites.map(site => 
    site.domain === siteDomain 
      ? {...site, enabled: true, disabledUntil: null}
      : site
  );
  
  await saveSites(updatedSites);
  
  // Уведомляем все вкладки о блокировке
  chrome.tabs.query({}, function(tabs) {
    tabs.forEach(tab => {
      if (tab.url && tab.url.includes(siteDomain)) {
        try {
          chrome.tabs.sendMessage(tab.id, {
            action: 'siteBlocked',
            domain: siteDomain
          });
        } catch (error) {
          console.log('Could not notify tab about blocking:', error);
        }
      }
    });
  });
  
  console.log(`Site ${siteDomain} is now blocked`);
  return updatedSites;
}

// Восстановление таймеров при запуске
async function initializeTimers() {
  const sites = await loadSites();
  const now = new Date();
  
  for (const site of sites) {
    if (site.disabledUntil && new Date(site.disabledUntil) > now) {
      const timeLeftMs = new Date(site.disabledUntil) - now;
      const timeLeftSeconds = Math.ceil(timeLeftMs / 1000);
      
      console.log(`Restoring timer for ${site.domain}, time left: ${timeLeftSeconds}s`);
      
      // Сразу отправляем текущее значение таймера
      updateCountdownInTabs(site.domain, timeLeftSeconds);
      
      // Устанавливаем таймер с периодическим обновлением
      let currentTimeLeft = timeLeftSeconds;
      const updateInterval = setInterval(() => {
        currentTimeLeft--;
        if (currentTimeLeft > 0) {
          updateCountdownInTabs(site.domain, currentTimeLeft);
        }
      }, 1000);
      
      const timerId = setTimeout(async () => {
        clearInterval(updateInterval);
        console.log(`Restored timer expired for ${site.domain}`);
        await completeSiteDelay(site.domain);
      }, timeLeftMs);
      
      delayTimers.set(site.domain, {timerId, updateInterval});
      
    } else if (site.disabledUntil && new Date(site.disabledUntil) <= now) {
      // Если задержка уже истекла, но сайт еще не обновлен
      console.log(`Cleaning up expired delay for ${site.domain}`);
      await completeSiteDelay(site.domain);
    }
  }
}

// Инициализация расширения
chrome.runtime.onInstalled.addListener(async () => {
  console.log('Extension installed/updated');
  await initializeTimers();
});

// Обработчик сообщений
chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  if (message.action === 'getSites') {
    chrome.storage.sync.get(['sites'], function(result) {
      sendResponse({ sites: result.sites || [] });
    });
    return true;
  }
  
  if (message.action === 'toggleSite') {
    const { siteDomain, enabled } = message;
    
    if (enabled) {
      // Включение сайта
      enableSite(siteDomain)
        .then(sites => sendResponse({ 
          success: true, 
          sites,
          message: 'Site is now blocked'
        }))
        .catch(error => sendResponse({ success: false, error: error.message }));
    } else {
      // Выключение сайта - блокируем еще 60 секунд
      disableSiteWithDelay(siteDomain)
        .then(sites => sendResponse({ 
          success: true, 
          sites,
          message: 'Site will be unblocked in 60 seconds'
        }))
        .catch(error => sendResponse({ success: false, error: error.message }));
    }
    return true;
  }
  
  if (message.action === 'getSiteStatus') {
    chrome.storage.sync.get(['sites'], function(result) {
      const sites = result.sites || [];
      const site = sites.find(s => s.domain === message.siteDomain);
      
      if (site) {
        const now = new Date();
        const isInDelay = site.disabledUntil && new Date(site.disabledUntil) > now;
        const timeLeft = isInDelay ? Math.ceil((new Date(site.disabledUntil) - now) / 1000) : 0;
        
        sendResponse({
          enabled: site.enabled,
          isInDelay: isInDelay,
          timeLeft: timeLeft
        });
      } else {
        sendResponse({ error: 'Site not found' });
      }
    });
    return true;
  }
  
  if (message.action === 'getBlockedSites') {
    // Для content script - получить список заблокированных сайтов
    chrome.storage.sync.get(['sites'], function(result) {
      const sites = result.sites || [];
      const now = new Date();
      const blockedSites = sites.filter(site => 
        site.enabled || (site.disabledUntil && new Date(site.disabledUntil) > now)
      ).map(site => site.domain);
      
      sendResponse({ sites: blockedSites });
    });
    return true;
  }
  
  if (message.action === 'checkSiteBlocked') {
    // Проверка конкретного сайта для content script
    chrome.storage.sync.get(['sites'], function(result) {
      const sites = result.sites || [];
      const now = new Date();
      const isBlocked = sites.some(site => 
        site.domain === message.siteDomain && 
        (site.enabled || (site.disabledUntil && new Date(site.disabledUntil) > now))
      );
      
      sendResponse({ blocked: isBlocked });
    });
    return true;
  }
  
  if (message.action === 'forceUnblockSite') {
    // Принудительное разблокирование сайта (для тестирования)
    completeSiteDelay(message.siteDomain)
      .then(sites => sendResponse({ success: true, sites }))
      .catch(error => sendResponse({ success: false, error: error.message }));
    return true;
  }
});