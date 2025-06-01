import * as assert from 'assert'
import * as vscode from 'vscode'
import { Prompts } from '../../../prompts'

suite('Prompts:Connections:Hostname', () => {
  let originalShowInputBox: typeof vscode.window.showInputBox

  setup(() => {
    originalShowInputBox = vscode.window.showInputBox
  })

  teardown(() => {
    vscode.window.showInputBox = originalShowInputBox
  })

  test('returns entered hostname when input is provided', async () => {
    vscode.window.showInputBox = async () => 'example.com'

    const result = await Prompts.connection.hostname()
    assert.strictEqual(result, 'example.com')
  })

  test('returns undefined when input is cancelled', async () => {
    vscode.window.showInputBox = async () => undefined

    const result = await Prompts.connection.hostname()
    assert.strictEqual(result, undefined)
  })

  test('shows correct prompt when editing hostname', async () => {
    let receivedOptions: vscode.InputBoxOptions | undefined
    vscode.window.showInputBox = async (options) => {
      receivedOptions = options
      return 'edited.com'
    }

    const result = await Prompts.connection.hostname('original.com')

    assert.strictEqual(result, 'edited.com')
    assert.deepStrictEqual(receivedOptions?.prompt, 'Edit hostname')
    assert.deepStrictEqual(receivedOptions?.value, 'original.com')
    assert.deepStrictEqual(receivedOptions?.placeHolder, 'Enter hostname')
  })

  test('shows correct prompt when creating new hostname', async () => {
    let receivedOptions: vscode.InputBoxOptions | undefined
    vscode.window.showInputBox = async (options) => {
      receivedOptions = options
      return 'newhost.local'
    }

    const result = await Prompts.connection.hostname()

    assert.strictEqual(result, 'newhost.local')
    assert.deepStrictEqual(receivedOptions?.prompt, 'Enter hostname')
    assert.deepStrictEqual(receivedOptions?.value, undefined)
    assert.deepStrictEqual(receivedOptions?.placeHolder, 'Enter hostname')
  })
})
