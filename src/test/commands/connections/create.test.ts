import * as assert from 'assert'
import * as vscode from 'vscode'
import { Storage } from '../../../storage'
import { Prompts } from '../../../prompts'
import { COMMAND_IDS } from '../../../constants'
import createConnectionCommand from '../../../commands/connections/create'
import { getTestContext } from '../../utils'

suite('Commands:Connections:Create', () => {
    let context: vscode.ExtensionContext
    let originalHostnamePrompt: typeof Prompts.connection.hostname
    let originalGroupPrompt: typeof Prompts.connection.group
    let originalCredentialPrompt: typeof Prompts.credential.credential
    let originalCreate: typeof Storage.connection.create
    let originalExecuteCommand: typeof vscode.commands.executeCommand
    let originalShowError: typeof vscode.window.showErrorMessage

    setup(() => {
        context = getTestContext()
        originalHostnamePrompt = Prompts.connection.hostname
        originalGroupPrompt = Prompts.connection.group
        originalCredentialPrompt = Prompts.credential.credential
        originalCreate = Storage.connection.create
        originalExecuteCommand = vscode.commands.executeCommand
        originalShowError = vscode.window.showErrorMessage
    })

    teardown(() => {
        Prompts.connection.hostname = originalHostnamePrompt
        Prompts.connection.group = originalGroupPrompt
        Prompts.credential.credential = originalCredentialPrompt
        Storage.connection.create = originalCreate
        vscode.commands.executeCommand = originalExecuteCommand
        vscode.window.showErrorMessage = originalShowError
    })

    test('creates connection', async () => {
        let createCalled = false
        let commandsExecuted: string[] = []

        Prompts.connection.hostname = async () => 'test-host'
        Prompts.connection.group = async () => ({ value: 'test-group', cancelled: false })
        Prompts.credential.credential = async () => 'test-user'
        Storage.connection.create = async (ctx, hostname, credential, group) => {
            createCalled = true
            assert.strictEqual(ctx, context)
            assert.strictEqual(hostname, 'test-host')
            assert.strictEqual(credential, 'test-user')
            assert.strictEqual(group, 'test-group')
        }
        vscode.commands.executeCommand = <T>(command: string, ...rest: any[]): Thenable<T> => {
            commandsExecuted.push(command)
            return Promise.resolve(undefined as unknown as T)
        }

        await createConnectionCommand(context)

        assert.ok(createCalled, 'Create should be called')
        assert.deepStrictEqual(commandsExecuted, [
            COMMAND_IDS.connection.refresh,
            COMMAND_IDS.credential.refresh
        ])
    })

    test('handles cancellation at hostname prompt', async () => {
        Prompts.connection.hostname = async () => undefined
        let createCalled = false
        let refreshCalled = false

        Storage.connection.create = async () => { createCalled = true }
        vscode.commands.executeCommand = <T>(command: string, ...rest: any[]): Thenable<T> => {
            refreshCalled = true
            return Promise.resolve(undefined as unknown as T)
        }

        await createConnectionCommand(context)

        assert.ok(!createCalled, 'Create should not be called')
        assert.ok(!refreshCalled, 'Refresh should not be called')
    })

    test('handles cancellation at group prompt', async () => {
        Prompts.connection.hostname = async () => 'test-host'
        Prompts.connection.group = async () => ({ value: '', cancelled: true })
        let createCalled = false
        let refreshCalled = false

        Storage.connection.create = async () => { createCalled = true }
        vscode.commands.executeCommand = <T>(command: string, ...rest: any[]): Thenable<T> => {
            refreshCalled = true
            return Promise.resolve(undefined as unknown as T)
        }

        await createConnectionCommand(context)

        assert.ok(!createCalled, 'Create should not be called')
        assert.ok(!refreshCalled, 'Refresh should not be called')
    })

    test('handles cancellation at credential prompt', async () => {
        Prompts.connection.hostname = async () => 'test-host'
        Prompts.connection.group = async () => ({ value: 'test-group', cancelled: false })
        Prompts.credential.credential = async () => undefined
        let createCalled = false
        let refreshCalled = false

        Storage.connection.create = async () => { createCalled = true }
        vscode.commands.executeCommand = <T>(command: string, ...rest: any[]): Thenable<T> => {
            refreshCalled = true
            return Promise.resolve(undefined as unknown as T)
        }

        await createConnectionCommand(context)

        assert.ok(!createCalled, 'Create should not be called')
        assert.ok(!refreshCalled, 'Refresh should not be called')
    })

    test('handles errors', async () => {
        const error = new Error('Test error')
        let errorShown = false

        Prompts.connection.hostname = async () => 'test-host'
        Prompts.connection.group = async () => ({ value: 'test-group', cancelled: false })
        Prompts.credential.credential = async () => 'test-user'
        Storage.connection.create = async () => { throw error }
        vscode.window.showErrorMessage = async (msg: string) => {
            errorShown = true
            assert.ok(msg.includes('create connection'))
            assert.ok(msg.includes(error.message))
            return undefined
        }

        await createConnectionCommand(context)

        assert.ok(errorShown, 'Error message should be shown')
    })
}) 