import * as vscode from 'vscode';
import { globalDiffTabSelectors, CompareTempFileProvider, globalCompareTempFileProvider } from './compare-view';
import { FileStateMonitor, initFileState } from './file';
import { LocationTreeProvider } from './activity-bar';
import { queryState, CommitMessageInput } from './query';
import { predictLocation, predictLocationIfHasEditAtSelectedLine } from './task';
import { GenerateEditCommand, InlineFixProvider, LocationDecoration, PredictLocationCommand } from './inline';


function activate(context) {

	function registerDisposable(...disposables) {
		context.subscriptions.push(...disposables);
	}

	function registerCommand(command, callback) {
		context.subscriptions.push(
			vscode.commands.registerCommand(command, callback)
		);
	}

	/*----------------------- Monitor edit behavior --------------------------------*/

	initFileState(vscode.window.activeTextEditor);

	registerDisposable(new FileStateMonitor());
	registerDisposable(new PredictLocationCommand());
	// registerDisposable(vscode.window.onDidChangeTextEditorSelection(predictLocationIfHasEditAtSelectedLine));

	/*----------------------- Provide QuickFix feature -----------------------------*/

	registerDisposable(new LocationDecoration());
	registerDisposable(new InlineFixProvider());

	registerCommand('editPilot.predictEditLocations', predictLocation);

	registerCommand('editPilot.applyFix', async () => {
		console.log('==> applyFix');
		const editor = vscode.window.activeTextEditor;
		if (editor) {
			queryState.clearLocations();
			await predictLocation();
		}
	});

	/*----------------------- Edit description input box --------------------------------*/
	
	registerDisposable(new CommitMessageInput());

	registerCommand('editPilot.openFileAtLine', async (filePath, lineNum) => {
		const uri = vscode.Uri.file(filePath); // Replace with dynamic file path

		const document = await vscode.workspace.openTextDocument(uri);
		const editor = await vscode.window.showTextDocument(document);
		const range = editor.document.lineAt(lineNum).range;
		editor.selection = new vscode.Selection(range.start, range.end);
		editor.revealRange(range, vscode.TextEditorRevealType.InCenter);
	});

	/*----------------------- Activity Bar Container for Edit Points --------------------------------*/
	
	registerDisposable(new LocationTreeProvider());

	/*------------------- Command to show suggested edits --------------*/

	registerDisposable(new GenerateEditCommand());

	/*----------------------- Compare View ------------------------------*/

	registerDisposable(globalCompareTempFileProvider);

	registerCommand("editPilot.last-suggestion", () => {
		const currTab = vscode.window.tabGroups.activeTabGroup.activeTab;
		const selector = globalDiffTabSelectors[currTab];
		selector && selector.switchEdit(-1);
	});
	registerCommand("editPilot.next-suggestion", () => {
		const currTab = vscode.window.tabGroups.activeTabGroup.activeTab;
		const selector = globalDiffTabSelectors[currTab];
		selector && selector.switchEdit(1);
	});
	registerCommand("editPilot.accept-edit", () => { });
	registerCommand("editPilot.dismiss-edit", () => { });

	console.log('==> Congratulations, your extension is now active!');
}

function deactivate() {
}

export {
	activate,
	deactivate
};
