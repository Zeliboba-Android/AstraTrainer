const LESSON_STORAGE_PREFIX = 'lesson5-';
window.LESSON_STORAGE_PREFIX = 'lesson5-';
window.LESSON_STATUS_ELEMENT_ID = 'lesson5-status';
window.CURRENT_LESSON_ID = 5;

let lesson5Status = localStorage.getItem(LESSON_STORAGE_PREFIX + 'Status') || 'not-started';
let completedCommands = JSON.parse(localStorage.getItem(LESSON_STORAGE_PREFIX + 'CompletedCommands')) || [];
let currentDirectory = localStorage.getItem(LESSON_STORAGE_PREFIX + 'CurrentDirectory') || '/';
let fileSystem = JSON.parse(localStorage.getItem(LESSON_STORAGE_PREFIX + 'FileSystem')) || {'/': []};
let fileContents = JSON.parse(localStorage.getItem(LESSON_STORAGE_PREFIX + 'FileContents')) || {};

// Инициализация файлов при первом запуске
if (Object.keys(fileContents).length === 0) {
  initializeFileSystem();
}

function initializeFileSystem() {
  const initialLogs = [
    "INFO: System booted",
    "ERROR: Disk space low",
    "INFO: User 'admin' logged in",
    "WARNING: High memory usage",
    "ERROR: Network timeout",
    "INFO: Backup started",
    "ERROR: File not found",
    "INFO: Database connection established",
    "ERROR: Permission denied",
    "WARNING: CPU temperature high",
    "INFO: Task completed successfully",
    "ERROR: Connection refused",
    "INFO: New device detected",
    "WARNING: Unexpected process termination",
    "INFO: System shutdown"
  ].join('\n');

  if (!fileSystem['/'].includes('logs.txt')) {
    fileSystem['/'].push('logs.txt');
  }
  fileContents['/logs.txt'] = initialLogs;
  saveState();
}

function resolvePath(path) {
  if (path.startsWith('/')) return path;
  let current = currentDirectory;
  const parts = path.split('/').filter(p => p !== '');
  for (const part of parts) {
    if (part === '..') {
      current = current.substring(0, current.lastIndexOf('/')) || '/';
    } else if (part !== '.') {
      current = current === '/' ? `/${part}` : `${current}/${part}`;
    }
  }
  return current;
}

function normalizeCommand(command) {
  return command
    .replace(/\s+/g, ' ')
    .trim()
    .replace(/-n\s+/g, '-n');
}

function handleCommand(command) {
  let result = '';
  const originalCommand = command;
  command = command.replace(/"/g, '');
  const [cmd, ...args] = command.split(' ');
  const normalizedCmd = normalizeCommand(originalCommand);

  switch (cmd.toLowerCase()) {
    case 'help':
      result = 'Available commands: help, echo, grep, wc, ping, ifconfig, cat, ls, clear';
      break;

    // Добавляем обработку команды echo
    case 'echo':
      let interpretEscapes = false;
      let argsCopy = [...args];

      // Обрабатываем флаг -e и удаляем его из аргументов
      if (argsCopy[0] === '-e') {
        interpretEscapes = true;
        argsCopy = argsCopy.slice(1);
      }

      // Объединяем все аргументы перед разделением по >/>>
      let fullText = argsCopy.join(' ');
      let parts = fullText.split(/(>>?)/g);

      // Разделяем текст и операторы перенаправления
      let textPart = parts[0].trim();
      let redirectOperator = parts[1];
      let outputFile = parts[2]?.trim();

      // Обрабатываем экранированные последовательности
      if (interpretEscapes) {
        textPart = textPart
          .replace(/\\n/g, '\n')
          .replace(/\\t/g, '\t')
          .replace(/\\"/g, '"')
          .replace(/\\\\/g, '\\');
      }

      // Обработка перенаправления вывода
      if (redirectOperator && outputFile) {
        const filePath = resolvePath(outputFile);
        const dirPath = filePath.substring(0, filePath.lastIndexOf('/')) || '/';
        const fileName = filePath.split('/').pop();

        if (!fileSystem[dirPath]) {
          result = `echo: cannot create file '${outputFile}': No such directory`;
          break;
        }

        const content = textPart + '\n'; // Добавляем явный перенос строки
        if (redirectOperator === '>') {
          fileContents[filePath] = content;
          if (!fileSystem[dirPath].includes(fileName)) {
            fileSystem[dirPath].push(fileName);
          }
        } else { // >>
          fileContents[filePath] = (fileContents[filePath] || '') + content;
        }
        result = '';
      } else {
        result = textPart;
      }
      if (!redirectOperator) {
        result = textPart.replace(/\n/g, '\n\r');
      }
      break;
    case 'grep':
      if (args.length < 2) {
        result = 'Usage: grep <pattern> <file>';
        break;
      }
      const pattern = args[0];
      const grepFilePath = resolvePath(args[1]);
      if (!fileContents[grepFilePath]) {
        result = `grep: ${args[1]}: No such file`;
        break;
      }
      const lines = fileContents[grepFilePath].split('\n');
      const matches = lines.filter(line => line.includes(pattern));

      // Обработка перенаправления вывода
      const redirectIndex = args.findIndex(a => a === '>' || a === '>>');
      if (redirectIndex !== -1 && redirectIndex < args.length - 1) {
        const outputFile = resolvePath(args[redirectIndex + 1]);
        const dirPath = outputFile.substring(0, outputFile.lastIndexOf('/')) || '/';
        const fileName = outputFile.split('/').pop();

        if (!fileSystem[dirPath]) {
          result = `grep: cannot create file: No such directory`;
          break;
        }

        if (!fileSystem[dirPath].includes(fileName)) {
          fileSystem[dirPath].push(fileName);
        }
        fileContents[outputFile] = matches.join('\n');
        result = '';
      } else {
        result = matches.join('\n');
      }
      break;

    case 'wc':
      if (args.length < 2 || args[0] !== '-l') {
        result = 'Usage: wc -l <file>';
        break;
      }
      const wcFilePath = resolvePath(args[1]);
      if (!fileContents[wcFilePath]) {
        result = `wc: ${args[1]}: No such file`;
        break;
      }
      const lineCount = fileContents[wcFilePath].split('\n').length;
      result = ` ${lineCount} ${args[1]}`;
      break;

    case 'ping':
      const host = args[0] || '127.0.0.1';
      if (host === '127.0.0.1') {
        result = `PING ${host} (127.0.0.1) 56(84) bytes of data.
64 bytes from 127.0.0.1: icmp_seq=1 ttl=64 time=0.1 ms
64 bytes from 127.0.0.1: icmp_seq=2 ttl=64 time=0.2 ms
64 bytes from 127.0.0.1: icmp_seq=3 ttl=64 time=0.1 ms

--- ${host} ping statistics ---
3 packets transmitted, 3 received, 0% packet loss, time 2048ms
rtt min/avg/max/mdev = 0.100/0.133/0.200/0.045 ms`;
      } else {
        result = `ping: ${host}: Temporary failure in name resolution`;
      }
      break;

    case 'ifconfig':
      result = `lo: flags=73<UP,LOOPBACK,RUNNING>  mtu 65536
        inet 127.0.0.1  netmask 255.0.0.0
        inet6 ::1  prefixlen 128  scopeid 0x10<host>
        loop  txqueuelen 1000  (Local Loopback)

eth0: flags=4163<UP,BROADCAST,RUNNING,MULTICAST>  mtu 1500
        inet 192.168.1.2  netmask 255.255.255.0  broadcast 192.168.1.255
        ether 00:11:22:33:44:55  txqueuelen 1000  (Ethernet)`;
      break;

    case 'cat':
      if (args.length < 1) {
        result = 'Usage: cat <file>';
        break;
      }
      const catFilePath = resolvePath(args[0]);
      if (!fileContents[catFilePath]) {
        result = `cat: ${args[0]}: No such file`;
        break;
      }
      result = fileContents[catFilePath];
      break;

    case 'ls':
      result = fileSystem[currentDirectory].join('\n') || 'Directory is empty';
      break;

    case 'clear':
      result = '';
      break;

    default:
      result = `command not found: ${cmd}`;
  }
  if (window.checkFinalState()) {
    lesson5Status = 'completed';
    localStorage.setItem(LESSON_STORAGE_PREFIX + 'Status', 'completed');
    // Обновление UI
    const statusElement = document.getElementById(window.LESSON_STATUS_ELEMENT_ID);
    if (statusElement) {
      statusElement.textContent = 'Status: Completed';
      statusElement.className = 'status completed';
    }
  }
  if (window.isRelevantCommand(originalCommand)) {
    completedCommands.push(normalizedCmd);
  }
  saveState();
  checkFinalState();
  return result;
}

function checkFinalState() {
  try {
    // 1. Проверка наличия errors.txt
    if (!fileSystem['/'].includes('errors.txt')) return false;

    // 2. Проверка количества ошибок (ровно 5)
    const errorContent = fileContents['/errors.txt'] || '';
    const errorLines = errorContent.split('\n').filter(l => l.includes('ERROR'));
    if (errorLines.length !== 5) return false;

    // 3. Проверка выполнения ключевых команд
    const requiredCommands = [
      'echo -e',
      'grep error',
      'wc -l',
      'ping',
      'ifconfig'
    ];

    // Нормализация выполненных команд
    const normalizedCompleted = completedCommands.map(c => c.toLowerCase());

    // Проверяем наличие всех частей команд
    const passed = requiredCommands.every(rc => {
      const pattern = rc.toLowerCase();
      return normalizedCompleted.some(c => c.includes(pattern));
    });

    return passed;
  } catch (e) {
    console.error('Check error:', e);
    return false;
  }
}

window.checkFinalState = checkFinalState;

function saveState() {
  localStorage.setItem(LESSON_STORAGE_PREFIX + 'CompletedCommands', JSON.stringify(completedCommands));
  localStorage.setItem(LESSON_STORAGE_PREFIX + 'CurrentDirectory', currentDirectory);
  localStorage.setItem(LESSON_STORAGE_PREFIX + 'FileSystem', JSON.stringify(fileSystem));
  localStorage.setItem(LESSON_STORAGE_PREFIX + 'FileContents', JSON.stringify(fileContents));
}

document.addEventListener('DOMContentLoaded', () => {
  currentDirectory = localStorage.getItem(LESSON_STORAGE_PREFIX + 'CurrentDirectory') || '/';
  fileSystem = JSON.parse(localStorage.getItem(LESSON_STORAGE_PREFIX + 'FileSystem')) || {'/': []};
  fileContents = JSON.parse(localStorage.getItem(LESSON_STORAGE_PREFIX + 'FileContents')) || {};
  const statusElement = document.getElementById(`lesson${window.CURRENT_LESSON_ID}-status`);

  if (statusElement) {
    statusElement.textContent =
      lesson5Status === 'completed' ? 'Completed' :
        lesson5Status === 'in-progress' ? 'In Progress' : 'Not Started';
    statusElement.className = `status ${lesson5Status}`;
  }
});

window.isRelevantCommand = function(command) {
  const relevantCommands = ['echo', 'grep', 'wc', 'ping', 'ifconfig', 'cat']; // Добавлен 'echo'
  return relevantCommands.some(cmd => command.toLowerCase().startsWith(cmd));
};

// Обновление статуса при загрузке
document.addEventListener('DOMContentLoaded', function() {
  const status = localStorage.getItem(LESSON_STORAGE_PREFIX + 'Status') || 'not-started';
  const statusElement = document.getElementById(window.LESSON_STATUS_ELEMENT_ID);

  if (statusElement) {
    statusElement.textContent = `Status: ${status.charAt(0).toUpperCase() + status.slice(1).replace('-', ' ')}`;
    statusElement.className = `status ${status}`;
  }
});