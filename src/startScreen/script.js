const terminalOutput = document.getElementById('terminal-output');
const commandInput = document.getElementById('command-input');

let helpButtonDisabled = false; // Флаг, который отслеживает состояние кнопки помощи

function runCommand(commandLine) {
  const [command, ...args] = commandLine.split(' ');
  const action = commands[command];

  if (action) {
    const pathBefore = currentPath; // Сохраняем путь до выполнения команды
    const result = action(args);
    if (result) {
      terminalOutput.innerHTML += `\n${pathBefore} $ ${commandLine}\n${result}`;
    }
  } else {
    terminalOutput.innerHTML += `\n${currentPath} $ ${commandLine}\nCommand not found.`;
  }
}

document.getElementById('run-btn').addEventListener('click', () => {
  const command = commandInput.value.trim();
  if (command) {
    runCommand(command);
    commandInput.value = '';
    helpButtonDisabled = false; // Разрешаем нажимать кнопку help после ввода команды
    document.getElementById('help-btn').disabled = false; // Активируем кнопку help
  }
});

document.getElementById('clear-btn').addEventListener('click', () => {
  commands.clear();
});

document.getElementById('help-btn').addEventListener('click', () => {
  if (!helpButtonDisabled) {  // Проверяем, не заблокирована ли кнопка help
    terminalOutput.innerHTML += `\n${commands.help()}`;
    helpButtonDisabled = true; // Блокируем кнопку help
    document.getElementById('help-btn').disabled = true; // Делаем кнопку help неактивной
  }
});

commandInput.addEventListener('keydown', (e) => {
  if (e.key === 'Enter') {
    const command = commandInput.value.trim();
    if (command) {
      runCommand(command);
      commandInput.value = '';
      helpButtonDisabled = false; // Разрешаем нажимать кнопку help после ввода команды
      document.getElementById('help-btn').disabled = false; // Активируем кнопку help
    }
  }
});

