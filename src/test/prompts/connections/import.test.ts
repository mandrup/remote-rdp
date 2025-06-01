import * as assert from 'assert'
import * as vscode from 'vscode'
import { Prompts } from '../../../prompts'

suite('Prompts:Connections:Import', () => {
  let originalShowOpenDialog: typeof vscode.window.showOpenDialog

  setup(() => {
    originalShowOpenDialog = vscode.window.showOpenDialog
  })

  teardown(() => {
    vscode.window.showOpenDialog = originalShowOpenDialog
  })

  test('returns the selected file Uri', async () => {
    const mockUri = vscode.Uri.file('/path/to/import.json')
    vscode.window.showOpenDialog = async () => [mockUri]

    const result = await Prompts.connection.import()
    assert.strictEqual(result?.fsPath, '/path/to/import.json')
  })

  test('returns undefined when user cancels dialog', async () => {
    vscode.window.showOpenDialog = async () => undefined

    const result = await Prompts.connection.import()
    assert.strictEqual(result, undefined)
  })

  test('passes filters correctly to showOpenDialog', async () => {
    let receivedOptions: vscode.OpenDialogOptions | undefined
    const mockUri = vscode.Uri.file('/path/to/import.yaml')
    const filters = { 'YAML Files': ['yaml', 'yml'] }

    vscode.window.showOpenDialog = async (options) => {
      receivedOptions = options
      return [mockUri]
    }

    const result = await Prompts.connection.import(filters)

    assert.strictEqual(result?.fsPath, '/path/to/import.yaml')
    assert.deepStrictEqual(receivedOptions?.filters, filters)
    assert.strictEqual(receivedOptions?.canSelectFiles, true)
    assert.strictEqual(receivedOptions?.canSelectFolders, false)
    assert.strictEqual(receivedOptions?.canSelectMany, false)
  })
})
