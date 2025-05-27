export const lesson2InitialState = {
    fileSystem: {
        type: 'directory',
        contents: {
            Documents: {
                type: 'directory',
                contents: {}
            },
            Backup: {
                type: 'directory',
                contents: {}
            },
            home: { type: 'directory', contents: {} },
            etc: { type: 'directory', contents: {} }
        }
    },
    currentPath: ['/'],
    history: []
};
export const checkLesson2Completion = (state) => {
    // Проверяем наличие файла в Backup
    const backupFileExists = state.fileSystem.contents?.Backup?.contents?.['example.txt']?.type === 'file';
    // Проверяем отсутствие файла в Documents
    const documentsFileExists = state.fileSystem.contents?.Documents?.contents?.['example.txt'] !== undefined;
    return backupFileExists && !documentsFileExists;
};
