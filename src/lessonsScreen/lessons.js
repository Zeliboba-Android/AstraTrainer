let lesson1Status = localStorage.getItem('lesson1Status') || 'not-started';
const requiredCommands = ['cd Documents', 'mkdir MyFolder', 'ls'];
let completedCommands = JSON.parse(localStorage.getItem('lesson1CompletedCommands')) || [];

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