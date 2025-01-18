const terminalOutput = document.getElementById('terminal-output');
const commandInput = document.getElementById('command-input');

// Sample file system structure
const fileSystem = {
  '/': {
    'home': {
      'user': {
      }
    }
  }
};

let currentPath = '/';

// Command handlers
const commands = {
  ls: () => {
    const pathParts = currentPath.split('/').filter(Boolean);
    let dir = fileSystem;
    for (const part of pathParts) {
      dir = dir[part];
    }
    return Object.keys(dir).join('  ');
  },

  cd: (args) => {
    const target = args[0];
    if (!target) return 'Usage: cd <directory>';
    if (target === '..') {
      const pathParts = currentPath.split('/').filter(Boolean);
      pathParts.pop();
      currentPath = '/' + pathParts.join('/');
    } else {
      const pathParts = currentPath.split('/').filter(Boolean);
      pathParts.push(target);
      currentPath = '/' + pathParts.join('/');
    }
    return `Now in ${currentPath}`;
  },

  mkdir: (args) => {
    const dirName = args[0];
    if (!dirName) return 'Usage: mkdir <directory>';

    const pathParts = currentPath.split('/').filter(Boolean);
    let dir = fileSystem;
    for (const part of pathParts) {
      dir = dir[part];
    }

    if (dir[dirName]) {
      return `Directory ${dirName} already exists.`;
    }

    dir[dirName] = {};
    return `Directory ${dirName} created.`;
  },

  touch: (args) => {
    const fileName = args[0];
    if (!fileName) return 'Usage: touch <file>';

    const pathParts = currentPath.split('/').filter(Boolean);
    let dir = fileSystem;
    for (const part of pathParts) {
      dir = dir[part];
    }

    if (dir[fileName]) {
      return `File ${fileName} already exists.`;
    }

    dir[fileName] = null;
    return `File ${fileName} created.`;
  },

  help: () => {
    return `Available commands:
- ls: List directory contents
- cd <directory>: Change directory
- mkdir <directory>: Create a new directory
- touch <file>: Create a new file
- help: Show this help message`;
  },

  clear: () => {
    terminalOutput.innerHTML = '';
    return '';
  }
};

function runCommand(commandLine) {
  const [command, ...args] = commandLine.split(' ');
  const action = commands[command];

  if (action) {
    const result = action(args);
    if (result) terminalOutput.innerHTML += `\n$ ${commandLine}\n${result}`;
  } else {
    terminalOutput.innerHTML += `\n$ ${commandLine}\nCommand not found.`;
  }
}

document.getElementById('run-btn').addEventListener('click', () => {
  const command = commandInput.value.trim();
  if (command) {
    runCommand(command);
    commandInput.value = '';
  }
});

document.getElementById('clear-btn').addEventListener('click', () => {
  commands.clear();
});

document.getElementById('help-btn').addEventListener('click', () => {
  terminalOutput.innerHTML += `\n${commands.help()}`;
});

commandInput.addEventListener('keydown', (e) => {
  if (e.key === 'Enter') {
    const command = commandInput.value.trim();
    if (command) {
      runCommand(command);
      commandInput.value = '';
    }
  }
});