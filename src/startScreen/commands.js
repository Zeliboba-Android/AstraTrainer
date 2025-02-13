let fileSystem;
let currentPath;

// Sample file system structure
(function loadState() {
  const savedFileSystem = localStorage.getItem('fileSystem');
  const savedCurrentPath = localStorage.getItem('currentPath');

  fileSystem = savedFileSystem ? JSON.parse(savedFileSystem) : {
    '/': {
      'home': {
        'user': {}
      }
    }
  };

  currentPath = savedCurrentPath || '/';
})();

function saveState() {
  localStorage.setItem('fileSystem', JSON.stringify(fileSystem));
  localStorage.setItem('currentPath', currentPath);
}

function resolvePath(path) {
  const pathParts = path.split('/').filter(Boolean);
  let dir = fileSystem;
  for (const part of pathParts) {
    if (dir[part] === undefined) {
      return null;
    }
    dir = dir[part];
  }
  return dir;
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
      // Если значение равно null (т.е. это файл), сообщаем, что не можем создать директорию с таким именем
      if (dir[dirName] === null) {
        return `Error: A file named ${dirName} already exists. Cannot create a directory with the same name.`;
      }

      return `Directory ${dirName} already exists.`;
    }

    // Создаем директорию, если имя свободно
    dir[dirName] = {};
    saveState();
    return `Directory ${dirName} created.`;
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
    terminalOutput.innerHTML = 'Welcome to CLI Trainer!\nType "help" for commands.';
    fileSystem = { '/': { 'home': { 'user': {} } } }; // Сброс FS
    currentPath = '/';
    saveState();
    return '';
  }
};