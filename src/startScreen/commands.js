let fileSystem;
let currentPath;
let virtualUsers;
let currentUser = null;
// Инициализация файловой системы
(function loadState() {
  const savedFileSystem = localStorage.getItem('fileSystem');
  const savedCurrentPath = localStorage.getItem('currentPath');
  const savedVirtualUsers = localStorage.getItem('virtualUsers');
  const savedCurrentUser = localStorage.getItem('currentUser'); // Загружаем текущего пользователя

  fileSystem = savedFileSystem ? JSON.parse(savedFileSystem) : { /* ... */ };
  currentPath = savedCurrentPath || '/';
  virtualUsers = savedVirtualUsers ? JSON.parse(savedVirtualUsers) : {};
  currentUser = savedCurrentUser ? JSON.parse(savedCurrentUser) : null; // Инициализируем текущего пользователя
})();
(function restoreMainState() {
  if(localStorage.getItem('mainFileSystem')) {
    fileSystem = JSON.parse(localStorage.getItem('mainFileSystem'));
    currentPath = localStorage.getItem('mainCurrentPath') || '/';

    localStorage.removeItem('mainFileSystem');
    localStorage.removeItem('mainCurrentPath');
    saveState();
  }
})();
function getPrompt() {
  const username = currentUser || 'user';
  let displayPath = currentPath;

  if (currentUser) {
    const homePath = `/home/${username}`;
    if (currentPath === homePath) {
      displayPath = '~';
    } else if (currentPath.startsWith(`${homePath}/`)) {
      displayPath = `~${currentPath.slice(homePath.length)}`;
    }
  }

  return `${username}@astra:${displayPath}$`;
}

function updatePrompts() {
  // Обновляем приглашение ввода
  document.getElementById('input-prompt').textContent = getPrompt();

  // Обновляем последнее приглашение в выводе терминала
  const prompts = document.querySelectorAll('.prompt-line .prompt');
  if (prompts.length > 0) {
    prompts[prompts.length - 1].textContent = getPrompt();
  }
}
function saveState() {
  localStorage.setItem('fileSystem', JSON.stringify(fileSystem));
  localStorage.setItem('currentPath', currentPath);
  localStorage.setItem('virtualUsers', JSON.stringify(virtualUsers));
  localStorage.setItem('currentUser', JSON.stringify(currentUser)); // Сохраняем текущего пользователя
}

function parseFields(fieldStr) {
  return fieldStr.split(',')
    .flatMap(range => {
      if (range.includes('-')) {
        const [start, end] = range.split('-').map(Number);
        return Array.from({ length: end - start + 1 }, (_, i) => start + i);
      }
      return Number(range);
    })
    .filter(n => !isNaN(n) && n > 0);
}

function resolvePath(path) {
  const pathParts = path.split('/').filter(Boolean);
  let dir = fileSystem;
  for (const part of pathParts) {
    if (dir[part] === undefined) return null;
    dir = dir[part];
  }
  return dir;
}
// Генератор случайных MAC-адресов
function randomMAC() {
  return 'XX:XX:XX:XX:XX:XX'.replace(/X/g, () =>
    Math.floor(Math.random() * 16).toString(16).toUpperCase()
  );
}

// Генератор случайных IP-адресов
function randomIP() {
  return `192.168.${Math.floor(Math.random() * 255)}.${Math.floor(Math.random() * 255)}`;
}

// Состояние сетевой статистики
const networkState = {
  rxBytes: Math.floor(Math.random() * 1e6),
  txBytes: Math.floor(Math.random() * 1e6),
  rxErrors: Math.floor(Math.random() * 100),
  txErrors: Math.floor(Math.random() * 100),
  connections: []
};

// Обновление состояния сетевых соединений
function updateNetworkState() {
  networkState.connections = Array.from({length: 5}, (_, i) => ({
    proto: Math.random() > 0.5 ? 'tcp' : 'udp',
    local: `${randomIP()}:${Math.floor(1000 + Math.random() * 60000)}`,
    foreign: `${randomIP()}:${Math.floor(1000 + Math.random() * 60000)}`,
    state: ['ESTABLISHED', 'LISTEN', 'TIME_WAIT'][Math.floor(Math.random() * 3)],
    pid: Math.floor(1000 + Math.random() * 9000)
  }));
}
const commandHelp = {
  ls: {
    description: "List directory contents",
    syntax: "ls",
    examples: ["ls"]
  },
  cd: {
    description: "Change current directory",
    syntax: "cd <directory>",
    examples: ["cd /home", "cd ..", "cd subdir"]
  },
  mkdir: {
    description: "Create new directory",
    syntax: "mkdir <directory>",
    examples: ["mkdir new_folder"]
  },
  rm: {
    description: "Remove files or directories",
    syntax: "rm [-r] <target>",
    options: ["-r: Recursively remove directories"],
    examples: ["rm file.txt", "rm -r old_dir"]
  },
  cp: {
    description: "Copy files",
    syntax: "cp <source> <destination>",
    examples: ["cp file.txt backup.txt"]
  },
  mv: {
    description: "Move/rename files or directories",
    syntax: "mv <source> <destination>",
    examples: ["mv old.txt new.txt", "mv file.txt /backup/"]
  },
  rmdir: {
    description: "Remove empty directory",
    syntax: "rmdir <directory>",
    examples: ["rmdir empty_dir"]
  },
  pwd: {
    description: "Print current directory path",
    syntax: "pwd",
    examples: ["pwd"]
  },
  touch: {
    description: "Create new empty file",
    syntax: "touch <filename>",
    examples: ["touch new_file.txt"]
  },
  cat: {
    description: "Display file contents",
    syntax: "cat <file>",
    examples: ["cat document.txt"]
  },
  echo: {
    description: "Write text to file (use >> to append)",
    syntax: 'echo "text" >> <file>',
    examples: ['echo "Hello" >> greeting.txt', 'echo "Line1\\nLine2" >> multi.txt']
  },
  head: {
    description: "Show first lines of file",
    syntax: "head [-n <number>] <file>",
    options: ["-n: Number of lines to show (default: 10)"],
    examples: ["head log.txt", "head -n 5 data.csv"]
  },
  tail: {
    description: "Show last lines of file",
    syntax: "tail [-n <number>] <file>",
    options: ["-n: Number of lines to show (default: 10)"],
    examples: ["tail log.txt", "tail -n 20 access.log"]
  },
  wc: {
    description: "Count lines, words and characters",
    syntax: "wc <file>",
    examples: ["wc document.txt"]
  },
  sort: {
    description: "Sort lines alphabetically",
    syntax: "sort <file>",
    examples: ["sort names.txt"]
  },
  uniq: {
    description: "Remove consecutive duplicates",
    syntax: "uniq <file>",
    examples: ["uniq duplicates.txt"]
  },
  clear: {
    description: "Reset terminal and filesystem",
    syntax: "clear",
    examples: ["clear"]
  },
  cut: {
    description: "Extract columns from text",
    syntax: "cut -d<delimiter> -f<fields> <file>",
    options: [
      "-d: Specify delimiter (default: tab)",
      "-f: Select fields (columns) to extract"
    ],
    examples: [
      "cut -d':' -f1 file.txt",
      "cut -f2 data.csv"
    ]
  },
  ping: {
    description: "Эмуляция проверки доступности хоста",
    syntax: "ping <host>",
    examples: ["ping google.com", "ping 127.0.0.1"]
  },
  ifconfig: {
    description: "Вывод фиктивных настроек сетевых интерфейсов",
    syntax: "ifconfig",
    examples: ["ifconfig"]
  },
  netstat: {
    description: "Вывод фиктивных сетевых соединений",
    syntax: "netstat",
    examples: ["netstat"]
  },
  grep: {
    description: "Поиск текста в файле",
    syntax: 'grep "pattern" <file>',
    options: [
      "-i: Игнорировать регистр (не реализовано)",
      "-v: Инвертировать совпадения (не реализовано)"
    ],
    examples: [
      'grep "error" log.txt',
      'grep "TODO" notes.txt'
    ]
  },
  adduser: {
    description: "Create virtual user",
    syntax: "adduser <username>",
    examples: ["adduser john"]
  },
  passwd: {
    description: "Change user password",
    syntax: "passwd <username> <newpassword>",
    examples: ["passwd john 12345"]
  },
  logout: {
    description: "End virtual session",
    syntax: "logout",
    examples: ["logout"]
  },
  login: {
    description: "Log in as a virtual user",
    syntax: "login <username> <password>",
    examples: [
      "login john 12345"
    ]
  },
  whoami: {
    description: "Display the current logged-in user",
    syntax: "whoami",
    examples: ["whoami"]
  }
};
const commands = {
  ls: () => {
    const dir = resolvePath(currentPath);
    if (!dir) return 'Directory not found.';
    return Object.keys(dir).join('  ');
  },

  cd: (args) => {
    const target = args[0];
    if (!target) return 'Usage: cd <directory>';

    let newPath;
    if (target === '/') {
      newPath = '/';
    } else if (target === '..') {
      const pathParts = currentPath.split('/').filter(Boolean);
      pathParts.pop();
      newPath = '/' + pathParts.join('/');
    } else {
      newPath = currentPath === '/' ? `/${target}` : `${currentPath}/${target}`;
    }

    if (!resolvePath(newPath)) {
      return `Directory ${target} not found.`;
    }

    currentPath = newPath;
    saveState();
    updatePrompts();
    return ` `;
  },

  pwd: () => {
    return currentPath;
  },

  mkdir: (args) => {
    const dirName = args[0];
    if (!dirName) return 'Usage: mkdir <directory>';

    const dir = resolvePath(currentPath);
    if (!dir) return 'Directory not found.';

    if (dir[dirName] !== undefined) {
      if (dir[dirName] === null) {
        return `Cannot create directory - file exists: ${dirName}`;
      }
      return `Directory exists: ${dirName}`;
    }

    dir[dirName] = {};
    saveState();
    return `Directory created: ${dirName}`;
  },

  rm: (args) => {
    let recursive = false;
    const filteredArgs = args.filter(arg => {
      if (arg === '-r') {
        recursive = true;
        return false;
      }
      return true;
    });

    const target = filteredArgs[0];
    if (!target) return 'Usage: rm [-r] <file>';

    const dir = resolvePath(currentPath);
    if (!dir) return 'Directory not found.';

    if (dir[target] === undefined) {
      return `File or directory ${target} not found.`;
    }

    // Если это файл (не объект), просто удаляем
    if (dir[target] === null || typeof dir[target] !== 'object') {
      delete dir[target];
      saveState();
      return `File ${target} deleted.`;
    }

    // Если это директория
    if (typeof dir[target] === 'object') {
      // Если флаг -r не указан, возвращаем ошибку
      if (!recursive) {
        return `${target} is a directory. Use 'rmdir' to remove empty directories or 'rm -r' to delete directories recursively.`;
      }

      // Удаляем директорию рекурсивно, если указан флаг -r
      delete dir[target];
      saveState();
      return `Directory ${target} deleted recursively.`;
    }

    return `Unknown error occurred while deleting ${target}.`;
  },

  cp: (args) => {
    const [source, destination] = args;
    if (!source || !destination) return 'Usage: cp <source> <destination>';

    const dir = resolvePath(currentPath);
    if (!dir) return 'Directory not found.';

    if (dir[source] === undefined) {
      return `Source file ${source} not found.`;
    }

    dir[destination] = dir[source];
    saveState();
    return `Copied ${source} to ${destination}.`;
  },

  mv: (args) => {
    const [source, destination] = args;
    if (!source || !destination) return 'Usage: mv <source> <destination>';

    const sourceDir = resolvePath(currentPath);
    if (!sourceDir) return 'Directory not found.';

    // Получаем объект исходного элемента
    const sourceItem = sourceDir[source];
    if (!sourceItem) return `Source ${source} not found.`;

    // Разрешаем целевой путь
    let targetDir;
    let newName;

    // Если destination существует как директория
    const destAsDir = resolvePath(destination);
    if (destAsDir && typeof destAsDir === 'object') {
      targetDir = destAsDir;
      newName = source; // Сохраняем исходное имя каталога
    } else {
      // Пытаемся разобрать путь как комбинацию директории и имени
      const destParts = destination.split('/').filter(Boolean);
      newName = destParts.pop();
      targetDir = resolvePath(destParts.join('/'));

      if (!targetDir) return `Invalid destination path: ${destination}`;
    }

    // Проверяем конфликты
    if (targetDir[newName] !== undefined) {
      return `Destination ${newName} already exists.`;
    }

    // Перемещаем содержимое с сохранением структуры
    targetDir[newName] = sourceItem;
    delete sourceDir[source];

    saveState();
    return `Moved ${source} to ${destination}`;
  },


  touch: (args) => {
    const fileName = args[0];
    if (!fileName) return 'Usage: touch <file>';

    const dir = resolvePath(currentPath);
    if (!dir) return 'Directory not found.';

    if (dir[fileName] !== undefined) {
      return `File ${fileName} already exists.`;
    }

    dir[fileName] = null;
    saveState();
    return `File ${fileName} created.`;
  },

  rmdir: (args) => {
    const dirName = args[0];
    if (!dirName) return 'Usage: rmdir <directory>';

    const dir = resolvePath(currentPath);
    if (!dir) return 'Directory not found.';

    if (dir[dirName] === undefined) {
      return `Directory ${dirName} not found.`;
    }

    // Проверка на директорию
    if (dir[dirName] === null || typeof dir[dirName] !== 'object') {
      return `Error: ${dirName} is not a directory. If you want to delete a file, use the 'rm' command.`;
    }

    // Проверка, что директория пуста
    if (Object.keys(dir[dirName]).length > 0) {
      return `Directory ${dirName} is not empty.`;
    }

    delete dir[dirName];
    saveState();
    return `Directory ${dirName} removed.`;
  },

  cat: (args) => {
    const fileName = args[0];
    if (!fileName) return 'Usage: cat <file>';

    const dir = resolvePath(currentPath);
    if (!dir) return 'Directory not found.';

    if (dir[fileName] === undefined || dir[fileName] === null) {
      return `File ${fileName} not found or is empty.`;
    }

    return dir[fileName];
  },

  echo: (args) => {
    const fileName = args[args.length - 1]; // Последний аргумент - имя файла
    const text = args.slice(0, args.length - 2).join(' '); // Все части до ">>"

    // Разделяем переданный текст на строки по символу \n
    const multiLineText = text.split('\\n').join('\n'); // \n становится настоящим символом новой строки

    const dir = resolvePath(currentPath);
    if (!dir) return 'Directory not found.';

    // Если файл не существует, создаем его
    if (dir[fileName] === undefined) {
      dir[fileName] = multiLineText;
      saveState();
      return `Text written to ${fileName}`;
    }

    // Если файл существует, добавляем текст в конец
    dir[fileName] += '\n' + multiLineText;
    saveState();
    return `Text appended to ${fileName}`;
  },


  basename: (args) => {
    const path = args[0];
    if (!path) return 'Usage: basename <path>';

    const parts = path.split('/');
    return parts[parts.length - 1];  // Возвращает последний элемент пути
  },

  dirname: (args) => {
    const path = args[0];
    if (!path) return 'Usage: dirname <path>';

    const parts = path.split('/');
    parts.pop();  // Убираем последний элемент
    return parts.join('/');  // Собираем путь обратно
  },

  head: (args) => {
    let lines = 10;
    let fileName;

    if (args[0] === '-n') {
      if (args.length < 3) return 'Usage: head -n <number> <file>';
      lines = parseInt(args[1]);
      if (isNaN(lines) || lines <= 0) return 'Invalid number of lines';
      fileName = args[2];
    } else {
      fileName = args[0];
      if (!fileName) return 'Usage: head [-n <number>] <file>';
    }

    const dir = resolvePath(currentPath);
    if (!dir) return 'Directory not found.';
    if (dir[fileName] === undefined) return `File ${fileName} not found.`;

    const content = dir[fileName] === null ? '' : dir[fileName];
    const allLines = content.split('\n');
    return allLines.slice(0, lines).join('\n');
  },

  tail: (args) => {
    let lines = 10;
    let fileName;

    if (args[0] === '-n') {
      if (args.length < 3) return 'Usage: tail -n <number> <file>';
      lines = parseInt(args[1]);
      if (isNaN(lines) || lines <= 0) return 'Invalid number of lines';
      fileName = args[2];
    } else {
      fileName = args[0];
      if (!fileName) return 'Usage: tail [-n <number>] <file>';
    }

    const dir = resolvePath(currentPath);
    if (!dir) return 'Directory not found.';
    if (dir[fileName] === undefined) return `File ${fileName} not found.`;

    const content = dir[fileName] === null ? '' : dir[fileName];
    const allLines = content.split('\n');
    return allLines.slice(-lines).join('\n');
  },

  wc: (args) => {
    const fileName = args[0];
    if (!fileName) return 'Usage: wc <file>';

    const dir = resolvePath(currentPath);
    if (!dir) return 'Directory not found.';
    if (dir[fileName] === undefined) return `File ${fileName} not found.`;

    const content = dir[fileName] === null ? '' : dir[fileName];
    const lines = content === '' ? 0 : content.split('\n').length;
    const words = content.split(/\s+/).filter(word => word !== '').length;
    const chars = content.length;

    return `${lines}\t${words}\t${chars}\t${fileName}`;
  },
  grep: (args) => {
    let invertMatch = false;
    let ignoreCase = false;

    // Обработка флагов
    while (args[0]?.startsWith('-')) {
      if (args[0] === '-v') {
        invertMatch = true;
        args = args.slice(1);
      } else if (args[0] === '-i') {
        ignoreCase = true;
        args = args.slice(1);
      } else {
        return `Invalid option: ${args[0]}`;
      }
    }

    if (args.length < 2) return 'Usage: grep [-v] [-i] "pattern" <file>';

    const pattern = args[0].replace(/^"(.*)"$/, '$1');
    const fileName = args[1];

    const dir = resolvePath(currentPath);
    if (!dir) return 'Directory not found';
    if (!dir[fileName] || dir[fileName] === null) return `File ${fileName} not found`;

    const content = dir[fileName];
    const lines = content.split('\n');

    // Создаем регулярное выражение с учетом регистра
    const regex = new RegExp(
      pattern.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), // Экранируем спецсимволы
      ignoreCase ? 'i' : ''
    );

    const results = lines.filter(line => {
      const match = regex.test(line);
      return invertMatch ? !match : match;
    });

    if (results.length === 0) {
      const flags = [];
      if (invertMatch) flags.push('-v');
      if (ignoreCase) flags.push('-i');
      const flagsStr = flags.length ? ` with ${flags.join(' ')}` : '';
      return `No matches found for "${pattern}"${flagsStr}`;
    }

    return results.map((line, index) => {
      const lineNumber = (lines.indexOf(line) + 1).toString().padStart(4);
      return `${lineNumber}: ${line}`;
    }).join('\n');
  },
  sort: (args) => {
    const fileName = args[0];
    if (!fileName) return 'Usage: sort <file>';

    const dir = resolvePath(currentPath);
    if (!dir) return 'Directory not found.';
    if (dir[fileName] === undefined) return `File ${fileName} not found.`;

    const content = dir[fileName] === null ? '' : dir[fileName];
    const lines = content.split('\n');
    return lines.sort().join('\n');
  },

  uniq: (args) => {
    const fileName = args[0];
    if (!fileName) return 'Usage: uniq <file>';

    const dir = resolvePath(currentPath);
    if (!dir) return 'Directory not found.';
    if (dir[fileName] === undefined) return `File ${fileName} not found.`;

    const content = dir[fileName] === null ? '' : dir[fileName];
    const lines = content.split('\n');
    const result = [];

    let prevLine = null;
    for (const line of lines) {
      if (line !== prevLine) {
        result.push(line);
        prevLine = line;
      }
    }

    return result.join('\n');
  },

  cut : (args) => {
    let delimiter = '\t';
    let fields = [];
    let fileName = '';
    // Разбор аргументов
    for (let i = 0; i < args.length; i++) {
      const arg = args[i];
      if (arg === '-d') {
        delimiter = args[++i]?.replace(/['"]/g, '') || ''; // Удаляем кавычки, если есть
      } else if (arg.startsWith('-d')) {
        delimiter = arg.slice(2).replace(/['"]/g, '');
      } else if (arg === '-f') {
        fields = parseFields(args[++i]);
      } else if (arg.startsWith('-f')) {
        fields = parseFields(arg.slice(2));
      } else {
        fileName = arg;
      }
    }
    if (!fileName || fields.length === 0) {
      return 'Usage: cut -d<delimiter> -f<fields> <file>';
    }

    // Получение содержимого файла
    const dir = resolvePath(currentPath);
    if (!dir) return 'Directory not found.';
    if (dir[fileName] === undefined) return `File ${fileName} not found.`;

    const content = dir[fileName] === null ? '' : dir[fileName];
    const lines = content.split('\n').filter(line => line.trim() !== ''); // Убираем пустые строки

    // Обработка каждой строки
    const result = lines.map(line => {
      const parts = line.split(delimiter);
      return fields
        .map(f => parts[f - 1] || '') // Индексы с 1
        .join(delimiter);
    });

    return result.join('\n');
  },
  ifconfig: () => {
    const mac = randomMAC();
    const ip = randomIP();
    const rx = Math.floor(networkState.rxBytes += Math.random() * 1000);
    const tx = Math.floor(networkState.txBytes += Math.random() * 1000);

    return `
eth0: flags=4163<UP,BROADCAST,RUNNING,MULTICAST>  mtu 1500
        inet ${ip}  netmask 255.255.255.0  broadcast 192.168.1.255
        inet6 fe80::2${mac.replace(/:/g, '')}  prefixlen 64  scopeid 0x20<link>
        ether ${mac}  txqueuelen 1000  (Ethernet)
        RX packets ${rx}  bytes ${rx * 1024} (${(rx/1024).toFixed(1)} KiB)
        RX errors ${networkState.rxErrors}  dropped 0  overruns 0  frame 0
        TX packets ${tx}  bytes ${tx * 1024} (${(tx/1024).toFixed(1)} KiB)
        TX errors ${networkState.txErrors}  dropped 0 overruns 0  carrier 0  collisions 0

lo: flags=73<UP,LOOPBACK,RUNNING>  mtu 65536
        inet 127.0.0.1  netmask 255.0.0.0
        inet6 ::1  prefixlen 128  scopeid 0x10<host>
        loop  txqueuelen 1000  (Local Loopback)`.trim();
  },

  netstat: () => {
    updateNetworkState();
    const connections = networkState.connections.map(conn =>
      `${conn.proto}   ${conn.local.padEnd(21)} ${conn.foreign.padEnd(21)} ${conn.state}`
    ).join('\n');

    return `
Active Internet connections
Proto Local Address          Foreign Address        State
${connections}

Active UNIX domain sockets
Address  Type   Recv-Q Send-Q  Inode     PID/Program name
@/tmp/.X11-unix/X0 stream      0      0  ${Math.floor(100000 + Math.random() * 900000)} @/tmp/.X11-unix/X0
@/tmp/dbus-XXXXXX stream      0      0  ${Math.floor(100000 + Math.random() * 900000)} @/tmp/dbus-XXXXXX`.trim();
  },

  ping: function(args, updateOutput) {
    return new Promise(resolve => {
      const host = args[0] || 'localhost';
      const packetLoss = Math.random() < 0.1 ? 1 : 0; // 10% chance of packet loss
      const times = [];

      updateOutput(`PING ${host} (127.0.0.1) 56(84) bytes of data.`);

      const pingInterval = setInterval(() => {
        if(times.length >= 5) {
          clearInterval(pingInterval);
          const stats = `
--- ${host} ping statistics ---
${5} packets transmitted, ${5 - packetLoss} received, ${packetLoss * 20}% packet loss
rtt min/avg/max/mdev = ${Math.min(...times).toFixed(3)}/${(times.reduce((a,b) => a + b, 0)/times.length).toFixed(3)}/${Math.max(...times).toFixed(3)}/${(Math.random()*5).toFixed(3)} ms`;

          updateOutput(stats, true);
          resolve();
          return;
        }

        const time = (Math.random() * 100).toFixed(3);
        times.push(parseFloat(time));

        if(Math.random() > packetLoss) {
          updateOutput(`64 bytes from ${host} (127.0.0.1): icmp_seq=${times.length} ttl=64 time=${time} ms`);
        }
      }, 1000);
    });
  },
  adduser: (args) => {
    const username = args[0];
    if (!username) return 'Usage: adduser <username>';
    if (virtualUsers[username]) return `User ${username} already exists.`;

    // Создаем домашнюю директорию
    const homePath = `/home/${username}`;
    const pathParts = homePath.split('/').filter(p => p !== '');
    let currentDir = fileSystem;
    for (const part of pathParts) {
      currentDir = currentDir[part] = currentDir[part] || {};
    }

    virtualUsers[username] = { password: '' };
    saveState();
    return `User ${username} created. Home directory: ${homePath}`;
  },

  passwd: (args) => {
    const username = args[0];
    const password = args[1];
    if (!username || !password) return 'Usage: passwd <username> <password>';
    if (!virtualUsers[username]) return `User ${username} not found.`;

    virtualUsers[username].password = password;
    saveState();
    return `Password updated for ${username}.`;
  },
  login: (args) => {
    const username = args[0];
    const password = args[1];
    if (!username || !password) return 'Usage: login <username> <password>';

    if (!virtualUsers[username]) {
      return `User ${username} not found.`;
    }

    if (virtualUsers[username].password !== password) {
      return 'Incorrect password.';
    }

    // Устанавливаем текущего пользователя и переходим в его домашнюю директорию
    currentUser = username;
    currentPath = `/home/${username}`;
    saveState();
    updatePrompts();
    return `Logged in as ${username}.`;
  },
  logout: () => {
    currentUser = null;
    currentPath = '/';
    saveState();
    updatePrompts();
    return 'Virtual session terminated. Returning to root directory.';
  },
  whoami: () => {
    return currentUser ? `Current user: ${currentUser}` : 'No user logged in.';
  },
  help: (args) => {
    if (args.length === 0) {
      return `Available commands:\n${Object.keys(commandHelp).join(", ")}\n\n` +
        "Type 'help <command>' for detailed info about a command";
    }

    const cmd = args[0];
    if (!commandHelp[cmd]) return `No help available for '${cmd}'`;

    const helpInfo = commandHelp[cmd];
    let response = `${cmd}: ${helpInfo.description}\n`;
    response += `Syntax: ${helpInfo.syntax}\n`;

    if (helpInfo.options) {
      response += `Options:\n${helpInfo.options.join("\n")}\n`;
    }

    if (helpInfo.examples) {
      response += `Examples:\n${helpInfo.examples.map(e => `  ${e}`).join("\n")}`;
    }

    return response;
  },

  clear: () => {
    // Полный сброс основной файловой системы
    terminalOutput.innerHTML = 'Welcome to CLI Trainer!\nType "help" for commands.';
    fileSystem = {
      '/': {
        'home': {
          'user': {}
        }
      }
    };
    currentPath = '/';

    // Очищаем только основное хранилище
    localStorage.removeItem('fileSystem');
    localStorage.removeItem('currentPath');

    // Не трогаем данные уроков
    return '';
  }
};
const terminalOutput = document.getElementById('terminal-output');
const terminalInput = document.getElementById('command-input');

async function handleCommand(input) {
  const [command, ...args] = input.trim().split(/\s+/);

  const updateOutput = (text, isFinal = false) => {
    const div = document.createElement('div');
    div.textContent = text;
    if(!isFinal) div.classList.add('ping-intermediate');
    terminalOutput.appendChild(div);
    terminalOutput.scrollTop = terminalOutput.scrollHeight;
  };

  if (!command) return;

  // Отображение введенной команды
  const prompt = document.createElement('div');
  prompt.className = 'terminal-prompt';
  prompt.textContent = `$ ${input}`;
  terminalOutput.appendChild(prompt);

  try {
    if (commands[command]) {
      if (command === 'ping') {
        await commands[command](args, updateOutput);
      } else {
        const result = commands[command](args);
        if (result !== undefined) {
          updateOutput(result.toString(), true);
        }
      }
    } else {
      updateOutput(`Command not found: ${command}`, true);
    }
  } catch (e) {
    updateOutput(`Error: ${e.message}`, true);
  }
}

// Инициализация терминала
terminalInput.addEventListener('keypress', (e) => {
  if (e.key === 'Enter') {
    const input = terminalInput.value;
    terminalInput.value = '';
    handleCommand(input);
  }
});