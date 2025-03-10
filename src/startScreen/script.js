const commandInput = document.getElementById('command-input');

let helpButtonDisabled = false; // Флаг, который отслеживает состояние кнопки помощи

// Функция для прокрутки терминала вниз
function scrollTerminalToBottom() {
  const terminal = document.getElementById('terminal');
  terminal.scrollTop = terminal.scrollHeight;
}

// Функция для выполнения команды
function runCommand(commandLine) {
  const [command, ...args] = commandLine.split(' ');
  const action = commands[command];

  // Добавляем введенную команду в терминал
  const promptLine = document.createElement('div');
  promptLine.className = 'prompt-line';
  promptLine.innerHTML = `
    <span class="prompt">user@astra:~$</span>
    <span class="command">${commandLine}</span>
  `;
  terminalOutput.appendChild(promptLine);

  // Обрабатываем команду
  let result = '';
  if (action) {
    result = action(args);
  } else {
    result = `Command not found: ${command}`;
  }

  // Добавляем результат выполнения команды
  const outputLine = document.createElement('div');
  outputLine.className = 'output';
  outputLine.textContent = result;
  terminalOutput.appendChild(outputLine);

  // Прокручиваем терминал вниз
  scrollTerminalToBottom();
}

// Обработка нажатия Enter в поле ввода
commandInput.addEventListener('keydown', (e) => {
  if (e.key === 'Enter') {
    const command = commandInput.value.trim();
    if (command) {
      runCommand(command);
      commandInput.value = '';
    }
  }
});