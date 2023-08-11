import * as vscode from 'vscode';

export function activate(context: vscode.ExtensionContext) {
  let disposable = vscode.commands.registerCommand('show-translation.translate', async () => {
    const fileUri = await vscode.window.showOpenDialog({
      canSelectFiles: true,
      canSelectFolders: false,
      canSelectMany: false,
      filters: {
        jsonUri: ['json']
      }
    });

    if (!fileUri || fileUri.length === 0) {
      vscode.window.showWarningMessage('No JSON file selected.');
      return;
    }

    // Get the URI of the selected JSON file
    const jsonUri = fileUri[0];

    // Open the active text editor
    const editor = vscode.window.activeTextEditor;
    if (!editor) {
      vscode.window.showErrorMessage('No active editor found.');
      return;
    }

    try {
      // Read the JSON file
      const data = await vscode.workspace.fs.readFile(jsonUri);
      const jsonText = data.toString();
      const jsonData = JSON.parse(jsonText);

      if (typeof jsonData !== 'object' || jsonData === null) {
        throw new Error('JSON data is not an object.');
      }

      // Find matching IDs in the document
      const text = editor.document.getText();
      const idRegex = /t\('([\w\s]+)'\)/g;
      let match;
      const inlayHints: vscode.InlayHint[] = []; // Array to store the inlay hints

      while ((match = idRegex.exec(text))) {
        const id = match[1];
        const value: string = jsonData[id];
        vscode.window.showInformationMessage(value);

        if (value) {
          // Create an inlay hint at the position of the ID
          const position = editor.document.positionAt(match.index + id.length + 3);
          const inlayHintPart = new vscode.InlayHintLabelPart(`:${value}`);
          const inlayHint = new vscode.InlayHint(
            position,
            [inlayHintPart],
            vscode.InlayHintKind.Parameter
          );
          inlayHint.paddingLeft = true;
          inlayHints.push(inlayHint); // Add the inlay hint to the array
        }
      }

      // Register the InlayHintsProvider to provide the inlay hints
      vscode.languages.registerInlayHintsProvider({ pattern: editor.document.uri.fsPath }, {
        provideInlayHints: () => {
          return inlayHints;
        }
      });

      vscode.window.showInformationMessage('Matching values attached to IDs in the file.');
    } catch (error: Error | unknown) {
      vscode.window.showErrorMessage('Error parsing JSON');
    }
  });

  context.subscriptions.push(disposable);
}

// This method is called when your extension is deactivated
export function deactivate() {}
