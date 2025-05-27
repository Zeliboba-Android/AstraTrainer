export const lesson5InitialState = {
    fileSystem: {
        type: 'directory',
        contents: {
            home: { type: 'directory', contents: {} },
            Documents: { type: 'directory', contents: {} }
        }
    },
    currentPath: ['/'],
    history: []
};

export const checkLesson5Completion = (state) => {
    try {
        // 1. Проверка наличия logs.txt с 10 строками
        const logsFile = state.fileSystem.contents?.['logs.txt']?.type === 'file';
        if (!logsFile) return false;

        const logsContent = state.fileSystem.contents['logs.txt'].contents || '';
        const logsLines = logsContent.split('\n').filter(l => l.trim() !== '');

        // Проверка общего количества строк
        if (logsLines.length < 7 || logsLines.length > 15) return false;

        // 2. Проверка что примерно 5 строк содержат ERROR
        const errorLines = logsLines.filter(l => l.includes('ERROR'));
        if (errorLines.length < 3 || errorLines.length > 7) return false;

        // 3. Проверка errors.txt
        const errorsFile = state.fileSystem.contents?.['errors.txt']?.type === 'file';
        if (!errorsFile) return false;

        const errorsContent = state.fileSystem.contents['errors.txt'].contents || '';
        const errorsLines = errorsContent.split('\n').filter(l => l.trim() !== '');

        // Все ERROR строки из logs.txt должны быть в errors.txt
        if (errorLines.length !== errorsLines.length) return false;
        if (!errorLines.every(l => errorsLines.includes(l))) return false;

        // 4. Проверка выполнения команд
        const hasWc = state.history.some(entry =>
            entry.command.includes('wc errors.txt') // Требуется флаг -l
        );
        const hasIfconfig = state.history.some(entry =>
            entry.command.trim() === 'ifconfig'
        );

        return hasWc && hasIfconfig;
    } catch(e) {
        return false;
    }
};