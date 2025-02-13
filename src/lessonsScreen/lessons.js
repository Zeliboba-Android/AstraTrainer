let lesson1Status = localStorage.getItem('lesson1Status') || 'not-started';
const requiredCommands = ['cd Documents', 'mkdir MyFolder', 'ls'];
let completedCommands = JSON.parse(localStorage.getItem('lesson1CompletedCommands')) || [];

function createFireworks() {
  const colors = ['#ff0', '#f00', '#0f0', '#00f', '#fff'];
  const fireworksCount = 50;

  for (let i = 0; i < fireworksCount; i++) {
    const firework = document.createElement('div');
    firework.className = 'firework';

    // Случайная позиция по горизонтали
    const x = Math.random() * window.innerWidth;
    const y = window.innerHeight + 100;

    // Случайная задержка и продолжительность анимации
    const delay = Math.random() * 0.5;
    const duration = 1 + Math.random() * 0.5;

    firework.style.left = `${x}px`;
    firework.style.top = `${y}px`;
    firework.style.animationDelay = `${delay}s`;
    firework.style.animationDuration = `${duration}s`;
    firework.style.backgroundColor = colors[Math.floor(Math.random() * colors.length)];

    document.body.appendChild(firework);

    // Удаляем элемент после завершения анимации
    setTimeout(() => firework.remove(), (duration + 1) * 1000);
  }
}


function showHint(hintId) {
  const hint = document.getElementById(hintId);
  hint.style.display = 'block';
}

function executeCommand() {
  const input = document.getElementById('command-input').value.trim();
  const output = document.getElementById('terminal-output');

  if (input === '') {
    return; // Не выполняем ничего, если команда пустая
  }

  // Добавляем введенную команду в вывод
  output.textContent += `\n> ${input}\n`;

  // Обработка команд
  const response = handleCommand(input);
  output.textContent += response + '\n';

  // Очищаем поле ввода
  document.getElementById('command-input').value = '';

  // Прокручиваем терминал вниз
  output.scrollTop = output.scrollHeight;

  // Обновляем статус урока
  updateLessonStatus(input);
}

function clearTerminal() {
  document.getElementById('terminal-output').textContent = 'Welcome to CLI Trainer!\nType "help" for a list of commands.';
}

function handleCommand(command) {
  // Пример обработки команд
  const commands = {
    'help': 'Available commands: help, cd, mkdir, ls, clear',
    'cd Documents': 'Changed directory to "Documents".',
    'mkdir MyFolder': 'Directory "MyFolder" created.',
    'ls': 'MyFolder\nfile1.txt\nfile2.txt',
    'clear': '', // Очистка терминала уже обрабатывается в clearTerminal()
  };

  if (commands[command]) {
    return commands[command];
  } else {
    return `Command not found: ${command}`;
  }
}

function updateLessonStatus(command) {
  // Нормализация ввода: удаление лишних пробелов и приведение к нижнему регистру
  const normalizedCommand = command.trim().replace(/\s+/g, ' ').toLowerCase();
  const isRequired = requiredCommands.some(cmd =>
    cmd.trim().replace(/\s+/g, ' ').toLowerCase() === normalizedCommand
  );

  if (isRequired && !completedCommands.some(cmd =>
    cmd.trim().replace(/\s+/g, ' ').toLowerCase() === normalizedCommand
  )) {
    // Находим оригинальную команду из requiredCommands
    const originalCommand = requiredCommands.find(cmd =>
      cmd.trim().replace(/\s+/g, ' ').toLowerCase() === normalizedCommand
    );

    completedCommands.push(originalCommand);
    localStorage.setItem('lesson1CompletedCommands', JSON.stringify(completedCommands));

    if (lesson1Status === 'not-started') {
      lesson1Status = 'in-progress';
      localStorage.setItem('lesson1Status', lesson1Status);
    }

    if (completedCommands.length === requiredCommands.length) {
      lesson1Status = 'completed';
      localStorage.setItem('lesson1Status', lesson1Status);

      // Запускаем салют и поздравление одновременно
      createFireworks();
      showCongratulations();
    }

    // Обновляем DOM только если элемент существует
    const statusElement = document.getElementById('lesson1-status');
    if (statusElement) {
      statusElement.textContent =
        lesson1Status === 'completed' ? 'Completed' :
          lesson1Status === 'in-progress' ? 'In Progress' : 'Not Started';
      statusElement.className = `status ${lesson1Status}`;
    }
  }
}

function showCongratulations() {
  const congrats = document.createElement('div');
  congrats.textContent = '🎉 Congratulations! Lesson Completed! 🎉';
  congrats.style.position = 'fixed';
  congrats.style.top = '50%';
  congrats.style.left = '50%';
  congrats.style.transform = 'translate(-50%, -50%)';
  congrats.style.fontSize = '2em';
  congrats.style.color = '#fff';
  congrats.style.textShadow = '0 0 10px #000';
  congrats.style.zIndex = '10000';
  congrats.style.animation = 'zoomInOut 4s forwards'; // Добавили forwards
  congrats.style.pointerEvents = 'none'; // Чтобы текст не мешал взаимодействию

  document.body.appendChild(congrats);

  // Удаляем сообщение только после завершения анимации
  setTimeout(() => {
    congrats.remove();
  }, 4000); // Время должно совпадать с продолжительностью анимации
}
document.addEventListener('DOMContentLoaded', function() {
  const statusElement = document.getElementById('lesson1-status');
  if (statusElement) {
    const savedStatus = localStorage.getItem('lesson1Status') || 'not-started';
    const completed = JSON.parse(localStorage.getItem('lesson1CompletedCommands')) || [];

    let displayStatus = savedStatus;
    if (completed.length === requiredCommands.length) {
      displayStatus = 'completed';
    } else if (completed.length > 0) {
      displayStatus = 'in-progress';
    }

    statusElement.textContent =
      displayStatus === 'completed' ? 'Completed' :
        displayStatus === 'in-progress' ? 'In Progress' : 'Not Started';
    statusElement.className = `status ${displayStatus}`;
  }
});