// Кэш для таймеров задержки
const delayTimers = new Map();

// Функция для преобразования сайтов в правила
function sitesToRules(sites) {
  const now = new Date();
  
  // Блокируем сайты которые: включены ИЛИ выключены но с активной задержкой
  const sitesToBlock = sites.filter(site => {
    if (site.enabled) return true;
    if (site.disabledUntil && new Date(site.disabledUntil) > now) return true;
    return false;
  });
  
  return sitesToBlock.map((site, index) => ({
    id: index + 1,
    priority: 1,
    action: {
      type: "block"
    },
    condition: {
      urlFilter: `||${site.domain}`,
      resourceTypes: [
        "main_frame",
        "sub_frame",
        "script",
        "image",
        "stylesheet",
        "object",
        "xmlhttprequest",
        "other"
      ]
    }
  }));
}

// Функция для обновления правил блокировки
async function updateBlockRules(sites) {
  try {
    // Получаем текущие динамические правила
    const currentRules = await chrome.declarativeNetRequest.getDynamicRules();
    const currentRuleIds = currentRules.map(rule => rule.id);

    // Удаляем старые правила
    if (currentRuleIds.length > 0) {
      await chrome.declarativeNetRequest.updateDynamicRules({
        removeRuleIds: currentRuleIds
      });
    }

    // Добавляем новые правила
    const newRules = sitesToRules(sites);
    if (newRules.length > 0) {
      await chrome.declarativeNetRequest.updateDynamicRules({
        addRules: newRules
      });
    }

    return { success: true };
  } catch (error) {
    console.error('Ошибка при обновлении правил:', error);
    return { success: false, error: error.message };
  }
}

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

// Функция для выключения сайта с задержкой
async function disableSiteWithDelay(siteDomain) {
  const sites = await loadSites();
  const disabledUntil = new Date(Date.now() + 60000); // +1 минута
  
  const updatedSites = sites.map(site => 
    site.domain === siteDomain 
      ? {...site, enabled: false, disabledUntil: disabledUntil.toISOString()}
      : site
  );
  
  await saveSites(updatedSites);
  
  // Устанавливаем таймер на 1 минуту для снятия блокировки
  const timerId = setTimeout(async () => {
    const currentSites = await loadSites();
    const site = currentSites.find(s => s.domain === siteDomain);
    
    // Если сайт все еще выключен, обновляем правила (снимаем блокировку)
    if (site && !site.enabled) {
      await updateBlockRules(currentSites);
    }
    delayTimers.delete(siteDomain);
  }, 60000);
  
  delayTimers.set(siteDomain, timerId);
  
  // Немедленно обновляем правила (сайт продолжает блокироваться)
  await updateBlockRules(updatedSites);
  
  return updatedSites;
}

// Функция для включения сайта (сразу начинает блокировать)
async function enableSite(siteDomain) {
  // Отменяем таймер задержки, если он есть
  const timerId = delayTimers.get(siteDomain);
  if (timerId) {
    clearTimeout(timerId);
    delayTimers.delete(siteDomain);
  }
  
  const sites = await loadSites();
  const updatedSites = sites.map(site => 
    site.domain === siteDomain 
      ? {...site, enabled: true, disabledUntil: null}
      : site
  );
  
  await saveSites(updatedSites);
  await updateBlockRules(updatedSites);
  
  return updatedSites;
}

// Восстановление таймеров при запуске
async function initializeTimers() {
  const sites = await loadSites();
  const now = new Date();
  
  for (const site of sites) {
    if (site.disabledUntil && new Date(site.disabledUntil) > now) {
      const timeLeft = new Date(site.disabledUntil) - now;
      const timerId = setTimeout(async () => {
        const currentSites = await loadSites();
        await updateBlockRules(currentSites);
        delayTimers.delete(site.domain);
      }, timeLeft);
      
      delayTimers.set(site.domain, timerId);
    }
  }
}

// Инициализация расширения
chrome.runtime.onInstalled.addListener(async () => {
  await initializeTimers();
  const sites = await loadSites();
  await updateBlockRules(sites);
});

// Обработчик сообщений
chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  if (message.action === 'updateBlockedSites') {
    updateBlockRules(message.sites)
      .then(result => sendResponse(result))
      .catch(error => sendResponse({ success: false, error: error.message }));
    return true;
  }
  
  if (message.action === 'getSites') {
    chrome.storage.sync.get(['sites'], function(result) {
      sendResponse({ sites: result.sites || [] });
    });
    return true;
  }
  
  if (message.action === 'toggleSite') {
    const { siteDomain, enabled } = message;
    
    if (enabled) {
      // Включение сайта - сразу блокируем
      enableSite(siteDomain)
        .then(sites => sendResponse({ 
          success: true, 
          sites,
          message: 'Сайт заблокирован'
        }))
        .catch(error => sendResponse({ success: false, error: error.message }));
    } else {
      // Выключение сайта - блокируем еще 60 секунд
      disableSiteWithDelay(siteDomain)
        .then(sites => sendResponse({ 
          success: true, 
          sites,
          message: 'Сайт будет разблокирован через 1 минуту'
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
});

// Обработчик обновления вкладок
chrome.tabs.onUpdated.addListener(async (tabId, changeInfo, tab) => {
  if (changeInfo.status === 'loading' && tab.url) {
    const sites = await loadSites();
    const now = new Date();
    
    const isBlocked = sites.some(site => {
      try {
        const url = new URL(tab.url);
        const matchesDomain = url.hostname.includes(site.domain) || 
                            url.hostname.endsWith('.' + site.domain);
        
        if (!matchesDomain) return false;
        
        // Сайт блокируется если:
        // 1. Включен (enabled: true) ИЛИ
        // 2. Выключен но находится в периоде задержки (disabledUntil > now)
        return site.enabled || (site.disabledUntil && new Date(site.disabledUntil) > now);
      } catch {
        return false;
      }
    });

    if (isBlocked) {
      // Показываем страницу блокировки
      chrome.scripting.executeScript({
        target: { tabId: tabId },
        func: function() {
          const blockedHost = window.location.hostname;
          document.body.innerHTML = `
            <div style="font-family: Arial, sans-serif; text-align: center; padding: 50px; background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); height: 100vh; display: flex; flex-direction: column; justify-content: center; align-items: center; color: white;">
              <div style="background: rgba(255, 255, 255, 0.1); padding: 40px; border-radius: 20px; backdrop-filter: blur(10px); max-width: 500px;">
                <div style="font-size: 4em; margin-bottom: 20px;">🚫</div>
                <h1 style="margin-top: 0; font-size: 2.5em; margin-bottom: 20px;">Сайт заблокирован</h1>
                <div style="line-height: 1.6; opacity: 0.9; margin-bottom: 20px;">
                  <p>Доступ к этому сайту ограничен расширением <strong>"Блокировщик сайтов"</strong>.</p>
                  <p>Это помогает сосредоточиться на работе и избежать отвлекающих факторов.</p>
                </div>
                <div style="background: rgba(255, 255, 255, 0.2); padding: 15px; border-radius: 8px; margin: 20px 0; word-break: break-all; font-size: 1.1em;">
                  <strong>${blockedHost}</strong>
                </div>
                <div style="margin-top: 30px; display: flex; gap: 15px; justify-content: center; flex-wrap: wrap;">
                  <button onclick="window.history.back()" style="background: rgba(255, 255, 255, 0.2); border: 2px solid white; color: white; padding: 12px 24px; border-radius: 8px; cursor: pointer; font-size: 16px; font-weight: 600; transition: all 0.3s ease; min-width: 140px;">← Назад</button>
                  <button onclick="window.location.href='https://www.google.com'" style="background: rgba(255, 255, 255, 0.2); border: 2px solid white; color: white; padding: 12px 24px; border-radius: 8px; cursor: pointer; font-size: 16px; font-weight: 600; transition: all 0.3s ease; min-width: 140px;">Домашняя страница</button>
                </div>
              </div>
            </div>
          `;
        }
      });
    }
  }
});