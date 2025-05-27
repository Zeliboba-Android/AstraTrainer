const commandInput = document.getElementById('command-input');

// Функция для прокрутки терминала вниз
function scrollTerminalToBottom() {
    const terminal = document.getElementById('terminal');
    terminal.scrollTop = terminal.scrollHeight;
}

// Функция для выполнения команды
function runCommand(commandLine) {
    const parsed = parseCommandLine(commandLine);
    const [command, ...args] = parsed;
    const action = commands[command];

    // Добавляем введенную команду в терминал
    const promptLine = document.createElement('div');
    promptLine.className = 'prompt-line';
    promptLine.innerHTML = `
    <span class="prompt">${getPrompt()}</span>
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

    updatePrompts();
}
function parseCommandLine(input) {
    const argsMatch = input.match(/(?:[^\s"']+|["'][^"']*["'])+/g) || [];
    return argsMatch.map(arg => {
        if ((arg.startsWith('"') && arg.endsWith('"')) ||
            (arg.startsWith("'") && arg.endsWith("'"))) {
            return arg.slice(1, -1);
        }
        return arg;
    });
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
// Добавьте в начало скрипта инициализацию подсказки
document.addEventListener('DOMContentLoaded', () => {
    updatePrompts();
    commandInput.focus(); // Автофокус на поле ввода
});