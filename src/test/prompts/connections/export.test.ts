import * as assert from 'assert'
import * as vscode from 'vscode'
import { Prompts } from '../../../prompts'

suite('Prompts:Connections:Export', () => {
    let originalShowSaveDialog: typeof vscode.window.showSaveDialog

    setup(() => {
        originalShowSaveDialog = vscode.window.showSaveDialog
    })

    teardown(() => {
        vscode.window.showSaveDialog = originalShowSaveDialog
    })

    test('returns the selected Uri from showSaveDialog', async () => {
        const mockUri = vscode.Uri.file('/path/to/file.json')
        vscode.window.showSaveDialog = async () => mockUri

        const result = await Prompts.connection.export()
        assert.strictEqual(result?.fsPath, '/path/to/file.json')
    })

    test('returns undefined when user cancels the dialog', async () => {
        vscode.window.showSaveDialog = async () => undefined

        const result = await Prompts.connection.export()
        assert.strictEqual(result, undefined)
    })

    test('passes filters and defaultUri to showSaveDialog', async () => {
        let receivedOptions: vscode.SaveDialogOptions | undefined
        const mockUri = vscode.Uri.file('/some/path/file.txt')
        const filters = { 'Text Files': ['txt'] }

        vscode.window.showSaveDialog = async (options) => {
            receivedOptions = options
            return mockUri
        }

        const defaultUri = vscode.Uri.file('/some/path')
        const result = await Prompts.connection.export(defaultUri, filters)

        assert.strictEqual(result?.fsPath, '/some/path/file.txt')
        assert.deepStrictEqual(receivedOptions?.filters, filters)
        assert.strictEqual(receivedOptions?.defaultUri?.fsPath, '/some/path')
    })
})
