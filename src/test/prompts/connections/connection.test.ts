import * as assert from 'assert'
import * as vscode from 'vscode'
import { Storage } from '../../../storage'
import { Prompts } from '../../../prompts'

suite('Commands:Connections:Prompt', () => {
  const context = {} as vscode.ExtensionContext

  const connections = [
    { id: '1', hostname: 'host1', group: 'groupA', credentialUsername: 'user1' },
    { id: '2', hostname: 'host2', group: 'groupB', credentialUsername: undefined },
  ]

  let originalReadAll: typeof Storage.connection.readAll
  let originalQuickPick: typeof vscode.window.showQuickPick
  let originalShowWarning: typeof vscode.window.showWarningMessage

  setup(() => {
    originalReadAll = Storage.connection.readAll
    originalQuickPick = vscode.window.showQuickPick
    originalShowWarning = vscode.window.showWarningMessage
  })

  teardown(() => {
    Storage.connection.readAll = originalReadAll
    vscode.window.showQuickPick = originalQuickPick
    vscode.window.showWarningMessage = originalShowWarning
  })

  test('returns connection by matching TreeItem.id', async () => {
    Storage.connection.readAll = () => connections

    const result = await Prompts.connection.connection(context, { id: '2' } as vscode.TreeItem)

    assert.deepStrictEqual(result, connections[1])
  })

  test('shows warning and returns undefined if no connections exist', async () => {
    let called = false
    Storage.connection.readAll = () => []
    vscode.window.showWarningMessage = (message: string) => {
      called = true
      assert.strictEqual(message, 'No connections available.')
      return Promise.resolve(undefined)
    }

    const result = await Prompts.connection.connection(context)

    assert.ok(called, 'Expected showWarningMessage to be called')
    assert.strictEqual(result, undefined)
  })

  test('returns connection selected from quick pick', async () => {
    Storage.connection.readAll = () => connections
    vscode.window.showQuickPick = async () =>
      ({
        label: 'host1',
        description: 'Group: groupA',
        detail: 'Username: user1',
        id: '1',
      } as any)

    const result = await Prompts.connection.connection(context)

    assert.deepStrictEqual(result, connections[0])
  })

  test('returns undefined if user cancels quick pick', async () => {
    Storage.connection.readAll = () => connections
    vscode.window.showQuickPick = async () => undefined

    const result = await Prompts.connection.connection(context)

    assert.strictEqual(result, undefined)
  })
})
