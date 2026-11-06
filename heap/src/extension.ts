import * as vscode from 'vscode';
function heapify(numbers: bigint[], size: number, root: number, isMax: boolean) {

    let current = root;

    while (true) {
        let best = current;
        let left = 2 * current + 1;
        let right = 2 * current + 2;

        if (left < size) {
            if (isMax === true && numbers[left] > numbers[best]) {
                best = left;
            }

            if (isMax === false && numbers[left] < numbers[best]) {
                best = left;
            }
        }

        if (right < size) {
            if (isMax === true && numbers[right] > numbers[best]) {
                best = right;
            }

            if (isMax === false && numbers[right] < numbers[best]) {
                best = right;
            }
        }

        if (best === current) {
            break;
        }

        let swap = numbers[current];
        numbers[current] = numbers[best];
        numbers[best] = swap;

        current = best;
    }
}

function buildHeap(numbers: bigint[], isMax: boolean) {
    let size = numbers.length;

    for (let i = Math.floor(size / 2) - 1; i >= 0; i--) {
        heapify(numbers, size, i, isMax);
    }
}

export function activate(context: vscode.ExtensionContext){
    console.log('Heap extension activated');
    vscode.window.showInformationMessage('Heap extension loaded!');

    
    const listener = vscode.workspace.onDidChangeTextDocument(event => {
        if (event.document.languageId !== 'cpp') {
            return;
        }
        const text = event.document.getText();
        
        const heapMin = text.match(/(\w+)\.heapmin/);
        const heapMax = text.match(/(\w+)\.heapmax/);


        let arrayName = null;
        
        let marker = '';
        
        if (heapMax) {
            arrayName = heapMax[1];
            marker = '.heapmax';
        }
        else if (heapMin) {
            arrayName = heapMin[1];
            marker = '.heapmin';
        }
        

        if (arrayName) {
            const arrayRegex = new RegExp(
                `(unsigned\\s+int|long\\s+long|int|long|short)\\s+${arrayName}\\s*\\[\\s*(\\d*)\\s*\\]\\s*=\\s*\\{([^}]*)\\}`
            );

            const arrayMatch = text.match(arrayRegex);
           

            if (arrayMatch) {
                const markerIndex = text.indexOf(arrayName + marker);

                const start = arrayMatch.index!;
                const end = start + arrayMatch[0].length;
                
                const values = arrayMatch[3].split(',');
                const arraySize = arrayMatch[2];

                if (arraySize !== '' && Number(arraySize) !== values.length) {
                    vscode.window.showErrorMessage('Размер массива не совпадает с количеством элементов');
                    return;
                }

                if (values.some(value => value.trim() === '')) {
                    vscode.window.showErrorMessage('В массиве есть пустые элементы');
                    return;
                }

                
                if (values.some(value => !/^[+-]?\d+$/.test(value.trim()))) {
                    vscode.window.showErrorMessage('Массив содержит некорректные числа');
                    return;
                }

                const numbers = values.map(value => BigInt(value.trim()));
                if (arrayMatch[1] === 'short') {
                    const min = -32768n;
                    const max = 32767n;
                                
                    if (numbers.some(value => value < min || value > max)) {
                        vscode.window.showErrorMessage('Число выходит за диапазон типа short');
                        return;
                    }
                }    
                if (arrayMatch[1] === 'int') {
                    const min = -2147483648n;
                    const max = 2147483647n;
                                    
                    if (numbers.some(value => value < min || value > max)) {
                        vscode.window.showErrorMessage('Число выходит за диапазон типа int');
                        return;
                    }
                }

                if (arrayMatch[1] === 'long long') {
                    const min = -9223372036854775808n;
                    const max = 9223372036854775807n;

                    if (numbers.some(value => value < min || value > max)) {
                        vscode.window.showErrorMessage('Число выходит за диапазон типа long long');
                        return;
                    }
                }

                if (arrayMatch[1] === 'unsigned int') {
                    const min = 0n;
                    const max = 4294967295n;
                
                    if (numbers.some(value => value < min || value > max)) {
                        vscode.window.showErrorMessage('Число выходит за диапазон типа unsigned int');
                        return;
                    }
                }
                
                if (numbers.length === 0) {
                    vscode.window.showErrorMessage('Массив пуст');
                    return;
                }

                let isMax = false;

                if (heapMax !== null) {
                    isMax = true;
                }

                buildHeap(numbers, isMax);

                const result = numbers.join(', ');
                const arrayType = arrayMatch[1];
                const newText = `${arrayType} ${arrayName}[] = {${result}}`;
                const edit = new vscode.WorkspaceEdit();

                const range = new vscode.Range(
                    event.document.positionAt(start),
                    event.document.positionAt(end)
                );

                edit.replace(event.document.uri, range, newText);

                if (markerIndex !== -1) {
                    const markerRange = new vscode.Range(
                        event.document.positionAt(markerIndex),
                        event.document.positionAt(markerIndex + arrayName.length + marker.length)
                    );
                
                    edit.delete(event.document.uri, markerRange);
                }

                vscode.workspace.applyEdit(edit);
                
            }
        }
        
    });
    
    context.subscriptions.push(listener);
}



export function deactivate() {}