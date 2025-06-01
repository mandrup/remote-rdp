import * as assert from 'assert'
import * as vscode from 'vscode'
import { Storage } from '../../../storage'
import { Prompts } from '../../../prompts'
import { COMMAND_IDS } from '../../../constants'
import { getTestContext } from '../../utils'
import type { ConnectionGroupItem } from '../../../providers'
import type { ConnectionModel } from '../../../models/connection'
import assignGroupCredentialsCommand from '../../../commands/connections/assign-group-credentials'

suite('Commands:Connections:AssignGroupCredentials', () => {
    let context: vscode.ExtensionContext
    let originalCredentialPrompt: typeof Prompts.credential.credential
    let originalReadAll: typeof Storage.connection.readAll
    let originalUpdateAll: typeof Storage.connection.updateAll
    let originalExecuteCommand: typeof vscode.commands.executeCommand
    let originalShowErrorMessage: typeof vscode.window.showErrorMessage

    setup(() => {
        context = getTestContext()
        originalCredentialPrompt = Prompts.credential.credential
        originalReadAll = Storage.connection.readAll
        originalUpdateAll = Storage.connection.updateAll
        originalExecuteCommand = vscode.commands.executeCommand
        originalShowErrorMessage = vscode.window.showErrorMessage
    })

    teardown(() => {
        Prompts.credential.credential = originalCredentialPrompt
        Storage.connection.readAll = originalReadAll
        Storage.connection.updateAll = originalUpdateAll
        vscode.commands.executeCommand = originalExecuteCommand
        vscode.window.showErrorMessage = originalShowErrorMessage
    })

    test('updates credentials for group connections', async () => {
        const groupItem: ConnectionGroupItem = {
            type: 'group',
            group: 'my-group',
            label: 'My Group',
            collapsibleState: vscode.TreeItemCollapsibleState.Collapsed,
            contextValue: 'connection-group',
            connections: []
        }

        const connections: ConnectionModel[] = [
            { id: '1', group: 'my-group', hostname: 'host-1' },
            { id: '2', group: 'other-group', hostname: 'host-2' }
        ]

        Prompts.credential.credential = async () => 'new-cred'

        Storage.connection.readAll = () => connections

        let updatedConnections: ConnectionModel[] = []
        Storage.connection.updateAll = async (ctx, updated) => {
            updatedConnections = updated
            assert.strictEqual(ctx, context)
        }

        let refreshCalled = false
        vscode.commands.executeCommand = async <T = unknown>(command: string, ...rest: any[]): Promise<T> => {
            if (command === COMMAND_IDS.connection.refresh) {
                refreshCalled = true
            }
            return undefined as unknown as T
        }

        await assignGroupCredentialsCommand(context, groupItem)

        assert.strictEqual(updatedConnections.length, 2)
        assert.strictEqual(updatedConnections[0].credentialUsername, 'new-cred')
        assert.strictEqual(updatedConnections[1].credentialUsername, undefined)
        assert.ok(refreshCalled, 'Refresh command should be called')
    })

    test('returns early if item is not a group', async () => {
        let errorShown = false
        vscode.window.showErrorMessage = async (message: unknown) => {
            errorShown = true
            assert.strictEqual(message, 'This command can only be used on connection groups.')
            return undefined
        }

        await assignGroupCredentialsCommand(context, {
            type: 'connection',
            label: 'Single connection',
            collapsibleState: vscode.TreeItemCollapsibleState.None,
            contextValue: 'connection'
        } as any)

        assert.ok(errorShown, 'Should show an error message')
    })

    test('returns early if credential prompt is cancelled', async () => {
        Prompts.credential.credential = async () => undefined

        let updateCalled = false
        Storage.connection.updateAll = async () => {
            updateCalled = true
        }

        let refreshCalled = false
        vscode.commands.executeCommand = async <T = unknown>(..._args: any[]): Promise<T> => {
            refreshCalled = true
            return undefined as unknown as T
        }

        const groupItem: ConnectionGroupItem = {
            type: 'group',
            group: 'grp',
            label: 'Group',
            collapsibleState: vscode.TreeItemCollapsibleState.Collapsed,
            contextValue: 'connection-group',
            connections: []
        }

        await assignGroupCredentialsCommand(context, groupItem)

        assert.ok(!updateCalled, 'updateAll should not be called')
        assert.ok(!refreshCalled, 'executeCommand should not be called')
    })

    test('shows error if an exception is thrown', async () => {
        const groupItem: ConnectionGroupItem = {
            type: 'group',
            group: 'grp1',
            label: 'Group',
            collapsibleState: vscode.TreeItemCollapsibleState.Collapsed,
            contextValue: 'connection-group',
            connections: []
        }

        Prompts.credential.credential = async () => {
            throw new Error('Prompt error')
        }

        let errorShown = false
        vscode.window.showErrorMessage = async (message: unknown) => {
            errorShown = true
            assert.strictEqual(message, 'Failed to assign credentials to group.')
            return undefined
        }

        await assignGroupCredentialsCommand(context, groupItem)

        assert.ok(errorShown, 'Error message should be shown on exception')
    })
})
