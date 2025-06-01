import * as assert from 'assert'
import * as vscode from 'vscode'
import { Storage } from '../../../storage'
import { Prompts } from '../../../prompts'
import { COMMAND_IDS } from '../../../constants'
import updateCredentialCommand from '../../../commands/credentials/update'
import { getTestContext } from '../../utils'

suite('Commands:Credentials:Update', () => {
  let context: vscode.ExtensionContext
  let originalEditPrompt: typeof Prompts.credential.editCredentialDetails
  let originalDetailPrompt: typeof Prompts.credential.credentialDetails
  let originalUpdateUsername: typeof Storage.credential.updateUsername
  let originalUpdateAllCredential: typeof Storage.connection.updateAllCredential
  let originalExecuteCommand: typeof vscode.commands.executeCommand
  let originalShowError: typeof vscode.window.showErrorMessage

  setup(() => {
    context = getTestContext()
    originalEditPrompt = Prompts.credential.editCredentialDetails
    originalDetailPrompt = Prompts.credential.credentialDetails
    originalUpdateUsername = Storage.credential.updateUsername
    originalUpdateAllCredential = Storage.connection.updateAllCredential
    originalExecuteCommand = vscode.commands.executeCommand
    originalShowError = vscode.window.showErrorMessage
  })

  teardown(() => {
    Prompts.credential.editCredentialDetails = originalEditPrompt
    Prompts.credential.credentialDetails = originalDetailPrompt
    Storage.credential.updateUsername = originalUpdateUsername
    Storage.connection.updateAllCredential = originalUpdateAllCredential
    vscode.commands.executeCommand = originalExecuteCommand
    vscode.window.showErrorMessage = originalShowError
  })

  test('updates credential and connection references', async () => {
    const credential = { id: 'abc123', username: 'old-user', password: 'old-pw' }
    const newDetails = { username: 'new-user', password: 'pw' }

    let updateCalled = false
    let updateAllCalled = false
    let refreshCredentialCalled = false
    let refreshConnectionCalled = false

    Prompts.credential.editCredentialDetails = async () => credential
    Prompts.credential.credentialDetails = async (username) => {
      assert.strictEqual(username, credential.username)
      return newDetails
    }
    Storage.credential.updateUsername = async (ctx, id, newUsername, password) => {
      updateCalled = true
      assert.strictEqual(ctx, context)
      assert.strictEqual(id, credential.id)
      assert.strictEqual(newUsername, newDetails.username)
      assert.strictEqual(password, newDetails.password)
    }
    Storage.connection.updateAllCredential = async (ctx, oldUsername, newUsername) => {
      updateAllCalled = true
      assert.strictEqual(ctx, context)
      assert.strictEqual(oldUsername, credential.username)
      assert.strictEqual(newUsername, newDetails.username)
    }
    vscode.commands.executeCommand = <T>(command: string): Thenable<T> => {
      if (command === COMMAND_IDS.credential.refresh) refreshCredentialCalled = true
      if (command === COMMAND_IDS.connection.refresh) refreshConnectionCalled = true
      return Promise.resolve(undefined as unknown as T)
    }

    await updateCredentialCommand(context)

    assert.ok(updateCalled, 'updateUsername should be called')
    assert.ok(updateAllCalled, 'updateAllCredential should be called')
    assert.ok(refreshCredentialCalled, 'credential refresh should be triggered')
    assert.ok(refreshConnectionCalled, 'connection refresh should be triggered')
  })

  test('does nothing if edit prompt is cancelled', async () => {
    let updateCalled = false
    Prompts.credential.editCredentialDetails = async () => undefined
    Storage.credential.updateUsername = async () => { updateCalled = true }

    await updateCredentialCommand(context)

    assert.ok(!updateCalled, 'Should not update if edit prompt was cancelled')
  })

  test('does nothing if credentialDetails prompt is cancelled', async () => {
    const credential = { id: 'abc123', username: 'old-user', password: 'old-pw' }
    let updateCalled = false

    Prompts.credential.editCredentialDetails = async () => credential
    Prompts.credential.credentialDetails = async () => undefined
    Storage.credential.updateUsername = async () => { updateCalled = true }

    await updateCredentialCommand(context)

    assert.ok(!updateCalled, 'Should not update if credentialDetails prompt was cancelled')
  })

  test('shows error message when an exception is thrown', async () => {
    const credential = { id: 'abc123', username: 'old-user', password: 'old-pw' }
    const error = new Error('Update failed')
    let errorShown = false

    Prompts.credential.editCredentialDetails = async () => credential
    Prompts.credential.credentialDetails = async () => { throw error }
    vscode.window.showErrorMessage = async (msg: string) => {
      errorShown = true
      assert.ok(msg.includes('update credential'))
      return undefined
    }

    await updateCredentialCommand(context)

    assert.ok(errorShown, 'Error message should be shown if exception is thrown')
  })
})
