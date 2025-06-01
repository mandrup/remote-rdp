import * as assert from 'assert'
import * as vscode from 'vscode'
import { Storage } from '../../../storage'
import { Prompts } from '../../../prompts'
import { COMMAND_IDS } from '../../../constants'
import deleteCredentialCommand from '../../../commands/credentials/delete'
import { getTestContext } from '../../utils'
import type { ConnectionModel } from '../../../models/connection'

suite('Commands:Credentials:Delete', () => {
  let context: vscode.ExtensionContext
  let originalEditPrompt: typeof Prompts.credential.editCredentialDetails
  let originalReadConnections: typeof Storage.connection.readAll
  let originalDeleteCredential: typeof Storage.credential.delete
  let originalClearAllCredential: typeof Storage.connection.clearAllCredential
  let originalExecuteCommand: typeof vscode.commands.executeCommand
  let originalShowError: typeof vscode.window.showErrorMessage

  setup(() => {
    context = getTestContext()
    originalEditPrompt = Prompts.credential.editCredentialDetails
    originalReadConnections = Storage.connection.readAll
    originalDeleteCredential = Storage.credential.delete
    originalClearAllCredential = Storage.connection.clearAllCredential
    originalExecuteCommand = vscode.commands.executeCommand
    originalShowError = vscode.window.showErrorMessage
  })

  teardown(() => {
    Prompts.credential.editCredentialDetails = originalEditPrompt
    Storage.connection.readAll = originalReadConnections
    Storage.credential.delete = originalDeleteCredential
    Storage.connection.clearAllCredential = originalClearAllCredential
    vscode.commands.executeCommand = originalExecuteCommand
    vscode.window.showErrorMessage = originalShowError
  })

  test('deletes credential and clears affected connections', async () => {
    const credential = { id: 'cred-1', username: 'test-user', password: 'secret' }
    const connection: ConnectionModel = {
      id: 'id-1',
      hostname: 'host',
      credentialUsername: 'test-user',
      group: 'group'
    }

    let deleteCalled = false
    let clearCalled = false
    let credentialRefreshCalled = false
    let connectionRefreshCalled = false

    Prompts.credential.editCredentialDetails = async () => credential
    Storage.connection.readAll = () => [connection]
    Storage.credential.delete = async (ctx, username) => {
      deleteCalled = true
      assert.strictEqual(ctx, context)
      assert.strictEqual(username, credential.username)
    }
    Storage.connection.clearAllCredential = async (ctx, username) => {
      clearCalled = true
      assert.strictEqual(ctx, context)
      assert.strictEqual(username, credential.username)
      return 1
    }
    vscode.commands.executeCommand = <T>(command: string): Thenable<T> => {
      if (command === COMMAND_IDS.credential.refresh) credentialRefreshCalled = true
      if (command === COMMAND_IDS.connection.refresh) connectionRefreshCalled = true
      return Promise.resolve(undefined as unknown as T)
    }

    await deleteCredentialCommand(context)

    assert.ok(deleteCalled, 'Credential should be deleted')
    assert.ok(clearCalled, 'Connections should be cleared')
    assert.ok(credentialRefreshCalled, 'Credential refresh should be called')
    assert.ok(connectionRefreshCalled, 'Connection refresh should be called')
  })

  test('does not delete if credential prompt is cancelled', async () => {
    let deleteCalled = false

    Prompts.credential.editCredentialDetails = async () => undefined
    Storage.credential.delete = async () => { deleteCalled = true }

    await deleteCredentialCommand(context)

    assert.ok(!deleteCalled, 'Credential should not be deleted when prompt is cancelled')
  })

  test('deletes credential but skips clearAllCredential if no connections match', async () => {
    const credential = { id: 'cred-1', username: 'test-user', password: 'secret' }

    let deleteCalled = false
    let clearCalled = false

    Prompts.credential.editCredentialDetails = async () => credential
    Storage.credential.delete = async () => { deleteCalled = true }
    Storage.connection.readAll = () => []
    Storage.connection.clearAllCredential = async () => { clearCalled = true; return 1 }
    vscode.commands.executeCommand = <T>() => Promise.resolve(undefined as unknown as T)

    await deleteCredentialCommand(context)

    assert.ok(deleteCalled, 'Credential should be deleted')
    assert.ok(!clearCalled, 'clearAllCredential should not be called when no matches')
  })

  test('handles errors during deletion', async () => {
    const credential = { id: 'cred-1', username: 'test-user', password: 'secret' }
    const error = new Error('Test error')
    let errorShown = false

    Prompts.credential.editCredentialDetails = async () => credential
    Storage.connection.readAll = () => []
    Storage.credential.delete = async () => { throw error }
    vscode.window.showErrorMessage = async (msg: string) => {
      errorShown = true
      assert.ok(msg.includes('remove credential'), 'Error message should mention operation')
      return undefined
    }

    await deleteCredentialCommand(context)

    assert.ok(errorShown, 'Error message should be shown')
  })
})
