import * as assert from 'assert'
import * as vscode from 'vscode'
import { Prompts } from '../../../prompts'
import { Storage } from '../../../storage'

suite('Commands:Connections:GroupPrompt', () => {
  const context = {} as vscode.ExtensionContext

  let originalReadAll: typeof Storage.connection.readAll
  let originalShowQuickPick: typeof vscode.window.showQuickPick
  let originalShowInputBox: typeof vscode.window.showInputBox

  setup(() => {
    originalReadAll = Storage.connection.readAll
    originalShowQuickPick = vscode.window.showQuickPick
    originalShowInputBox = vscode.window.showInputBox
  })

  teardown(() => {
    Storage.connection.readAll = originalReadAll
    vscode.window.showQuickPick = originalShowQuickPick
    vscode.window.showInputBox = originalShowInputBox
  })

  test('returns empty value when user submits empty group input (no groups)', async () => {
    Storage.connection.readAll = () => []
    vscode.window.showInputBox = async () => ''

    const result = await Prompts.connection.group(context)

    assert.deepStrictEqual(result, { cancelled: false, value: undefined })
  })

  test('returns selected group from quick pick', async () => {
    Storage.connection.readAll = () => [
      { id: crypto.randomUUID(), hostname: 'host-1', group: 'Dev' },
      { id: crypto.randomUUID(), hostname: 'host-2', group: ' QA ' },
      { id: crypto.randomUUID(), hostname: 'host-3' },
      { id: crypto.randomUUID(), hostname: 'host-4', group: undefined },
    ]

    vscode.window.showQuickPick = async () => ({ label: 'QA' }) as any

    const result = await Prompts.connection.group(context)

    assert.deepStrictEqual(result, { cancelled: false, value: 'QA' })
  })

  test('returns undefined when "No group" is selected', async () => {
    Storage.connection.readAll = () => [{ id: crypto.randomUUID(), hostname: 'host1', group: 'Dev' }]
    vscode.window.showQuickPick = async () => ({ label: 'No group' }) as any

    const result = await Prompts.connection.group(context)

    assert.deepStrictEqual(result, { cancelled: false, value: undefined })
  })

  test('prompts for new group name and returns it when "Create new group" is selected', async () => {
    Storage.connection.readAll = () => [{ id: crypto.randomUUID(), hostname: 'host1', group: 'Dev' }]
    vscode.window.showQuickPick = async () => ({ label: 'Create new group' }) as any
    vscode.window.showInputBox = async () => 'NewGroup'

    const result = await Prompts.connection.group(context)

    assert.deepStrictEqual(result, { cancelled: false, value: 'NewGroup' })
  })

  test('returns cancelled=true when user cancels quick pick', async () => {
    Storage.connection.readAll = () => [{ id: crypto.randomUUID(), hostname: 'host1', group: 'Dev' }]
    vscode.window.showQuickPick = async () => undefined

    const result = await Prompts.connection.group(context)

    assert.deepStrictEqual(result, { cancelled: true })
  })

  test('returns cancelled=true when user cancels input (no groups)', async () => {
  Storage.connection.readAll = () => []
  vscode.window.showInputBox = async () => undefined

  const result = await Prompts.connection.group(context)

  assert.deepStrictEqual(result, { cancelled: true, value: undefined })
})

test('returns cancelled=true when user cancels "Create new group"', async () => {
  Storage.connection.readAll = () => [{ id: crypto.randomUUID(), hostname: 'host1', group: 'Dev' }]
  vscode.window.showQuickPick = async () => ({ label: 'Create new group' }) as any
  vscode.window.showInputBox = async () => undefined

  const result = await Prompts.connection.group(context)

  assert.deepStrictEqual(result, { cancelled: true, value: undefined })
})
})
