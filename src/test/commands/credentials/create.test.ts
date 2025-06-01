import * as assert from 'assert'
import * as vscode from 'vscode'
import { Storage } from '../../../storage'
import { Prompts } from '../../../prompts'
import { COMMAND_IDS } from '../../../constants'
import { getTestContext } from '../../utils'
import createCredentialCommand from '../../../commands/credentials/create'

suite('Commands:Credentials:Create', () => {
  let context: vscode.ExtensionContext
  let originalCredentialPrompt: typeof Prompts.credential.credentialDetails
  let originalCreate: typeof Storage.credential.create
  let originalExecuteCommand: typeof vscode.commands.executeCommand
  let originalShowErrorMessage: typeof vscode.window.showErrorMessage

  setup(() => {
    context = getTestContext()
    originalCredentialPrompt = Prompts.credential.credentialDetails
    originalCreate = Storage.credential.create
    originalExecuteCommand = vscode.commands.executeCommand
    originalShowErrorMessage = vscode.window.showErrorMessage
  })

  teardown(() => {
    Prompts.credential.credentialDetails = originalCredentialPrompt
    Storage.credential.create = originalCreate
    vscode.commands.executeCommand = originalExecuteCommand
    vscode.window.showErrorMessage = originalShowErrorMessage
  })

  test('creates credential and triggers refresh', async () => {
    let createCalled = false
    let refreshCalled = false

    Prompts.credential.credentialDetails = async () => ({
      username: 'test-user',
      password: 'test-pass'
    })

    Storage.credential.create = async (ctx, username, password) => {
      createCalled = true
      assert.strictEqual(ctx, context)
      assert.strictEqual(username, 'test-user')
      assert.strictEqual(password, 'test-pass')
    }

    vscode.commands.executeCommand = <T>(command: string): Thenable<T> => {
      if (command === COMMAND_IDS.credential.refresh) refreshCalled = true
      return Promise.resolve(undefined as unknown as T)
    }

    await createCredentialCommand(context)

    assert.ok(createCalled, 'Storage.credential.create should be called')
    assert.ok(refreshCalled, 'Refresh command should be called')
  })

  test('does nothing if prompt is cancelled', async () => {
    let createCalled = false

    Prompts.credential.credentialDetails = async () => undefined
    Storage.credential.create = async () => { createCalled = true }

    await createCredentialCommand(context)

    assert.ok(!createCalled, 'Storage.credential.create should not be called')
  })

  test('shows error message on failure', async () => {
    let errorShown = false
    const error = new Error('test error')

    Prompts.credential.credentialDetails = async () => { throw error }
    vscode.window.showErrorMessage = async (message: string) => {
      errorShown = true
      assert.ok(message.includes('create credential'))
      assert.ok(message.includes(error.message))
      return undefined
    }

    await createCredentialCommand(context)

    assert.ok(errorShown, 'Error message should be shown')
  })
})
