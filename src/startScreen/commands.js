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
      return `Directory ${dirName} already exists.`;
    }

    dir[dirName] = {};
    saveState();
    return `Directory ${dirName} created.`;
  },

  rm: (args) => {
    const target = args[0];
    if (!target) return 'Usage: rm <file or directory>';

    const dir = resolvePath(currentPath);
    if (!dir) return 'Directory not found.';

    if (dir[target] === undefined) {
      return `File or directory ${target} not found.`;
    }

    if (typeof dir[target] === 'object' && Object.keys(dir[target]).length > 0) {
      return `Directory ${target} is not empty.`;
    }

    delete dir[target];
    saveState();
    return `Deleted ${target}.`;
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

    const dir = resolvePath(currentPath);
    if (!dir) return 'Directory not found.';

    if (dir[source] === undefined) {
      return `Source file ${source} not found.`;
    }

    dir[destination] = dir[source];
    delete dir[source];
    saveState();
    return `Moved ${source} to ${destination}.`;
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

    if (typeof dir[dirName] !== 'object' || Object.keys(dir[dirName]).length > 0) {
      return `Directory ${dirName} is not empty or is not a directory.`;
    }

    delete dir[dirName];
    saveState();
    return `Directory ${dirName} removed.`;
  },

  help: () => {
    return `Available commands:
- ls: List directory contents
- cd <directory>: Change directory
- mkdir <directory>: Create a new directory
- touch <file>: Create a new file
- rm <file>: Remove a file
- cp <source> <destination>: Copy a file
- mv <source> <destination>: Move or rename a file
- rmdir <directory>: Remove a directory
- help: Show this help message`;
  },

  clear: () => {
    terminalOutput.innerHTML = 'Welcome to CLI Trainer!\nType "help" for commands.';
    fileSystem = { '/': { 'home': { 'user': {} } } }; // Сброс FS
    currentPath = '/';
    saveState();
    return '';
  }
};