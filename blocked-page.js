// Content script для страницы блокировки
(function() {
  'use strict';
  
  // Проверяем, находимся ли мы на странице блокировки
  if (document.querySelector('.blocked-container')) {
    initializeCountdown();
  }
  
  function initializeCountdown() {
    const countdownElement = document.getElementById('countdown');
    const progressFill = document.getElementById('progressFill');
    const countdownMessage = document.getElementById('countdownMessage');
    const reloadBtn = document.getElementById('reloadPage');
    
    if (!countdownElement) return;
    
    // Получаем начальное время из атрибута данных
    let timeLeft = parseInt(countdownElement.dataset.timeLeft || '0');
    
    function formatTime(seconds) {
      if (seconds > 60) {
        const minutes = Math.floor(seconds / 60);
        const secs = seconds % 60;
        return `${minutes}:${secs.toString().padStart(2, '0')}`;
      }
      return `${seconds} секунд`;
    }
    
    function getCountdownMessage(seconds) {
      if (seconds > 60) {
        const minutes = Math.ceil(seconds / 60);
        return `Осталось ${minutes} минут${minutes === 1 ? 'а' : minutes < 5 ? 'ы' : ''}`;
      }
      return 'Осталось менее минуты';
    }
    
    function updateCountdown() {
      if (timeLeft > 0) {
        timeLeft--;
        
        // Обновляем отображение
        countdownElement.textContent = formatTime(timeLeft);
        if (countdownMessage) {
          countdownMessage.textContent = getCountdownMessage(timeLeft);
        }
        
        // Обновляем прогресс-бар
        if (progressFill) {
          const progressPercent = (timeLeft / 60) * 100;
          progressFill.style.width = progressPercent + '%';
        }
        
        // Меняем цвет когда осталось мало времени
        if (timeLeft <= 10) {
          countdownElement.style.color = '#ff4444';
          if (progressFill) progressFill.style.background = '#ff4444';
        } else if (timeLeft <= 30) {
          countdownElement.style.color = '#ff9800';
          if (progressFill) progressFill.style.background = '#ff9800';
        }
        
        setTimeout(updateCountdown, 1000);
      } else {
        // Время вышло
        countdownElement.textContent = 'Сайт разблокирован!';
        countdownElement.style.color = '#4CAF50';
        if (countdownMessage) {
          countdownMessage.textContent = 'Нажмите "Обновить страницу" для доступа';
        }
        if (progressFill) {
          progressFill.style.width = '0%';
        }
        
        // Показываем кнопку обновления
        if (reloadBtn) {
          reloadBtn.style.display = 'block';
        }
      }
    }
    
    // Обработчик кнопки обновления
    if (reloadBtn) {
      reloadBtn.addEventListener('click', function() {
        window.location.reload();
      });
    }
    
    // Запускаем обратный отсчет
    if (timeLeft > 0) {
      updateCountdown();
    }
  }
})();