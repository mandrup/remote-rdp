import * as assert from 'assert'
import * as vscode from 'vscode'
import { Storage } from '../../../storage'
import { Prompts } from '../../../prompts'
import { COMMAND_IDS } from '../../../constants'
import deleteConnectionCommand from '../../../commands/connections/delete'
import { getTestContext } from '../../utils'
import type { ConnectionModel } from '../../../models/connection'

suite('Commands:Connections:Delete', () => {
    let context: vscode.ExtensionContext
    let originalConnectionPrompt: typeof Prompts.connection.connection
    let originalReadAll: typeof Storage.connection.readAll
    let originalUpdateAll: typeof Storage.connection.updateAll
    let originalExecuteCommand: typeof vscode.commands.executeCommand
    let originalShowError: typeof vscode.window.showErrorMessage

    setup(() => {
        context = getTestContext()
        originalConnectionPrompt = Prompts.connection.connection
        originalReadAll = Storage.connection.readAll
        originalUpdateAll = Storage.connection.updateAll
        originalExecuteCommand = vscode.commands.executeCommand
        originalShowError = vscode.window.showErrorMessage
    })

    teardown(() => {
        Prompts.connection.connection = originalConnectionPrompt
        Storage.connection.readAll = originalReadAll
        Storage.connection.updateAll = originalUpdateAll
        vscode.commands.executeCommand = originalExecuteCommand
        vscode.window.showErrorMessage = originalShowError
    })

    test('deletes connection', async () => {
        const connection: ConnectionModel = {
            id: 'conn-1',
            hostname: 'test-host',
            group: 'test-group'
        }
        const connections = [
            connection,
            { id: 'conn-2', hostname: 'test-host-2', group: 'test-group' }
        ]
        let updatedConnections: ConnectionModel[] = []
        let commandExecuted = false

        Prompts.connection.connection = async () => connection
        Storage.connection.readAll = () => connections
        Storage.connection.updateAll = async (ctx, conns) => {
            updatedConnections = conns
            assert.strictEqual(ctx, context)
        }
        vscode.commands.executeCommand = <T>(command: string, ...rest: any[]): Thenable<T> => {
            if (command === COMMAND_IDS.connection.refresh) commandExecuted = true
            return Promise.resolve(undefined as unknown as T)
        }

        await deleteConnectionCommand(context)

        assert.strictEqual(updatedConnections.length, 1)
        assert.strictEqual(updatedConnections[0].id, 'conn-2')
        assert.ok(commandExecuted, 'Refresh command should be executed')
    })

    test('handles cancellation', async () => {
        Prompts.connection.connection = async () => undefined
        let updateCalled = false
        let refreshCalled = false

        Storage.connection.updateAll = async () => { updateCalled = true }
        vscode.commands.executeCommand = <T>(command: string, ...rest: any[]): Thenable<T> => {
            refreshCalled = true
            return Promise.resolve(undefined as unknown as T)
        }

        await deleteConnectionCommand(context)

        assert.ok(!updateCalled, 'Update should not be called')
        assert.ok(!refreshCalled, 'Refresh should not be called')
    })

    test('handles errors', async () => {
        const connection: ConnectionModel = {
            id: 'conn-1',
            hostname: 'test-host',
            group: 'test-group'
        }
        const error = new Error('Test error')
        let errorShown = false

        Prompts.connection.connection = async () => connection
        Storage.connection.readAll = () => { throw error }
        vscode.window.showErrorMessage = async (msg: string) => {
            errorShown = true
            assert.ok(msg.includes('remove connection'))
            assert.ok(msg.includes(error.message))
            return undefined
        }

        await deleteConnectionCommand(context)

        assert.ok(errorShown, 'Error message should be shown')
    })
}) 