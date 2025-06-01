import * as assert from 'assert'
import * as vscode from 'vscode'
import { Storage } from '../../../storage'
import { Prompts } from '../../../prompts'
import { COMMAND_IDS } from '../../../constants'
import updateConnectionCommand from '../../../commands/connections/update'
import { getTestContext } from '../../utils'
import type { ConnectionModel } from '../../../models/connection'

suite('Commands:Connections:Update', () => {
    let context: vscode.ExtensionContext
    let originalConnectionPrompt: typeof Prompts.connection.connection
    let originalHostnamePrompt: typeof Prompts.connection.hostname
    let originalGroupPrompt: typeof Prompts.connection.group
    let originalCredentialPrompt: typeof Prompts.credential.credential
    let originalReadAll: typeof Storage.connection.readAll
    let originalUpdateAll: typeof Storage.connection.updateAll
    let originalExecuteCommand: typeof vscode.commands.executeCommand
    let originalShowError: typeof vscode.window.showErrorMessage

    setup(() => {
        context = getTestContext()
        originalConnectionPrompt = Prompts.connection.connection
        originalHostnamePrompt = Prompts.connection.hostname
        originalGroupPrompt = Prompts.connection.group
        originalCredentialPrompt = Prompts.credential.credential
        originalReadAll = Storage.connection.readAll
        originalUpdateAll = Storage.connection.updateAll
        originalExecuteCommand = vscode.commands.executeCommand
        originalShowError = vscode.window.showErrorMessage
    })

    teardown(() => {
        Prompts.connection.connection = originalConnectionPrompt
        Prompts.connection.hostname = originalHostnamePrompt
        Prompts.connection.group = originalGroupPrompt
        Prompts.credential.credential = originalCredentialPrompt
        Storage.connection.readAll = originalReadAll
        Storage.connection.updateAll = originalUpdateAll
        vscode.commands.executeCommand = originalExecuteCommand
        vscode.window.showErrorMessage = originalShowError
    })

    test('updates connection', async () => {
        const connection: ConnectionModel = {
            id: 'conn-1',
            hostname: 'old-host',
            group: 'old-group'
        }
        const connections = [
            connection,
            { id: 'conn-2', hostname: 'test-host-2', group: 'test-group' }
        ]
        let updatedConnections: ConnectionModel[] = []
        let commandsExecuted: string[] = []

        Prompts.connection.connection = async () => connection
        Prompts.connection.hostname = async () => 'new-host'
        Prompts.connection.group = async () => ({ value: 'new-group', cancelled: false })
        Prompts.credential.credential = async () => 'new-user'
        Storage.connection.readAll = () => connections
        Storage.connection.updateAll = async (ctx, conns) => {
            updatedConnections = conns
            assert.strictEqual(ctx, context)
        }
        vscode.commands.executeCommand = <T>(command: string, ...rest: any[]): Thenable<T> => {
            commandsExecuted.push(command)
            return Promise.resolve(undefined as unknown as T)
        }

        await updateConnectionCommand(context)

        assert.strictEqual(updatedConnections.length, 2)
        const updated = updatedConnections.find(c => c.id === 'conn-1')
        assert.ok(updated)
        assert.strictEqual(updated?.hostname, 'new-host')
        assert.strictEqual(updated?.group, 'new-group')
        assert.strictEqual(updated?.credentialUsername, 'new-user')
        assert.deepStrictEqual(commandsExecuted, [
            COMMAND_IDS.connection.refresh,
            COMMAND_IDS.credential.refresh
        ])
    })

    test('handles cancellation at connection prompt', async () => {
        Prompts.connection.connection = async () => undefined
        let updateCalled = false
        let refreshCalled = false

        Storage.connection.updateAll = async () => { updateCalled = true }
        vscode.commands.executeCommand = <T>(command: string, ...rest: any[]): Thenable<T> => {
            refreshCalled = true
            return Promise.resolve(undefined as unknown as T)
        }

        await updateConnectionCommand(context)

        assert.ok(!updateCalled, 'Update should not be called')
        assert.ok(!refreshCalled, 'Refresh should not be called')
    })

    test('handles cancellation at hostname prompt', async () => {
        const connection: ConnectionModel = {
            id: 'conn-1',
            hostname: 'old-host',
            group: 'old-group'
        }
        let updateCalled = false
        let refreshCalled = false

        Prompts.connection.connection = async () => connection
        Prompts.connection.hostname = async () => undefined
        Storage.connection.updateAll = async () => { updateCalled = true }
        vscode.commands.executeCommand = <T>(command: string, ...rest: any[]): Thenable<T> => {
            refreshCalled = true
            return Promise.resolve(undefined as unknown as T)
        }

        await updateConnectionCommand(context)

        assert.ok(!updateCalled, 'Update should not be called')
        assert.ok(!refreshCalled, 'Refresh should not be called')
    })

    test('handles cancellation at group prompt', async () => {
        const connection: ConnectionModel = {
            id: 'conn-1',
            hostname: 'old-host',
            group: 'old-group'
        }
        let updateCalled = false
        let refreshCalled = false

        Prompts.connection.connection = async () => connection
        Prompts.connection.hostname = async () => 'new-host'
        Prompts.connection.group = async () => ({ value: '', cancelled: true })
        Storage.connection.updateAll = async () => { updateCalled = true }
        vscode.commands.executeCommand = <T>(command: string, ...rest: any[]): Thenable<T> => {
            refreshCalled = true
            return Promise.resolve(undefined as unknown as T)
        }

        await updateConnectionCommand(context)

        assert.ok(!updateCalled, 'Update should not be called')
        assert.ok(!refreshCalled, 'Refresh should not be called')
    })

    test('handles errors', async () => {
        const connection: ConnectionModel = {
            id: 'conn-1',
            hostname: 'old-host',
            group: 'old-group'
        }
        const error = new Error('Test error')
        let errorShown = false

        Prompts.connection.connection = async () => connection
        Prompts.connection.hostname = async () => 'new-host'
        Prompts.connection.group = async () => ({ value: 'new-group', cancelled: false })
        Prompts.credential.credential = async () => 'new-user'
        Storage.connection.readAll = () => { throw error }
        vscode.window.showErrorMessage = async (msg: string) => {
            errorShown = true
            assert.ok(msg.includes('update connection'))
            assert.ok(msg.includes(error.message))
            return undefined
        }

        await updateConnectionCommand(context)

        assert.ok(errorShown, 'Error message should be shown')
    })
}) 