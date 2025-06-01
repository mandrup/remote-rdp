import * as assert from 'assert'
import * as vscode from 'vscode'
import { Storage } from '../../../storage'
import { Prompts } from '../../../prompts'
import { createMockContext } from '../../utils'

interface CredentialQuickPickItem extends vscode.QuickPickItem {
  isCreateNew?: boolean
}

suite('Prompts:Credentials', () => {
  let context: vscode.ExtensionContext
  let originalReadAll: typeof Storage.credential.readAll
  let originalShowQuickPick: typeof vscode.window.showQuickPick
  let originalShowInputBox: typeof vscode.window.showInputBox
  let originalShowWarning: typeof vscode.window.showWarningMessage

  setup(() => {
    context = createMockContext()
    originalReadAll = Storage.credential.readAll
    originalShowQuickPick = vscode.window.showQuickPick
    originalShowInputBox = vscode.window.showInputBox
    originalShowWarning = vscode.window.showWarningMessage
  })

  teardown(() => {
    Storage.credential.readAll = originalReadAll
    vscode.window.showQuickPick = originalShowQuickPick
    vscode.window.showInputBox = originalShowInputBox
    vscode.window.showWarningMessage = originalShowWarning
  })

  test('selects existing credential', async () => {
    Storage.credential.readAll = async () => [{ id: '1', username: 'test-user', password: 'test-pass' }]
    vscode.window.showQuickPick = (async () => Promise.resolve({
      label: 'test-user',
      description: 'Existing credential',
      isCreateNew: false
    } as CredentialQuickPickItem)) as any

    const result = await Prompts.credential.credential(context)
    assert.strictEqual(result, 'test-user')
  })

  test('creates new credential', async () => {
    Storage.credential.readAll = async () => []
    vscode.window.showQuickPick = (async () => ({
      label: '$(add) Create new credential',
      description: 'Create a new credential',
      isCreateNew: true
    } as CredentialQuickPickItem)) as any
    vscode.window.showInputBox = async () => 'test-user'
    
    let createCalled = false
    Storage.credential.create = async (ctx, username) => {
      createCalled = true
      assert.strictEqual(ctx, context)
      assert.strictEqual(username, 'test-user')
    }

    const result = await Prompts.credential.credential(context)
    assert.strictEqual(result, 'test-user')
    assert.ok(createCalled, 'Create should be called')
  })

  test('handles cancellation at quick pick', async () => {
    Storage.credential.readAll = async () => []
    vscode.window.showQuickPick = async () => undefined

    const result = await Prompts.credential.credential(context)
    assert.strictEqual(result, undefined)
  })

  test('handles cancellation at credential details', async () => {
    Storage.credential.readAll = async () => []
    vscode.window.showQuickPick = async () => ({
      label: '$(add) Create new credential',
      description: 'Create a new credential',
      isCreateNew: true
    } as any)
    vscode.window.showInputBox = async () => undefined

    const result = await Prompts.credential.credential(context)
    assert.strictEqual(result, undefined)
  })

  test('edits existing credential', async () => {
    const credentials = [
      { id: '1', username: 'user1', password: 'pass1' },
      { id: '2', username: 'user2', password: 'pass2' }
    ]
    Storage.credential.readAll = async () => credentials
    vscode.window.showQuickPick = async () => ({
      label: 'user2',
      description: 'Click to edit'
    } as any)

    const result = await Prompts.credential.editCredentialDetails(context)
    assert.deepStrictEqual(result, credentials[1])
  })

  test('handles no credentials for edit', async () => {
    Storage.credential.readAll = async () => []
    let warningShown = false
    vscode.window.showWarningMessage = async (msg: string) => {
      warningShown = true
      assert.ok(msg.includes('No credentials'))
      return undefined
    }

    const result = await Prompts.credential.editCredentialDetails(context)
    assert.strictEqual(result, undefined)
    assert.ok(warningShown, 'Warning should be shown')
  })

  test('handles cancellation at edit quick pick', async () => {
    Storage.credential.readAll = async () => [{ id: '1', username: 'user1', password: 'pass1' }]
    vscode.window.showQuickPick = async () => undefined

    const result = await Prompts.credential.editCredentialDetails(context)
    assert.strictEqual(result, undefined)
  })
})