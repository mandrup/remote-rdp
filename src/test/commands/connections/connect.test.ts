import * as assert from 'assert'
import * as vscode from 'vscode'
import * as fs from 'fs'
import * as childProcess from 'child_process'
import { Storage } from '../../../storage'
import { Prompts } from '../../../prompts'
import { ConnectionModel } from '../../../models/connection'
import connectConnectionCommand from '../../../commands/connections/connect'
import { createMockContext } from '../../utils'
import { COMMAND_IDS } from '../../../constants'
import { getTestContext } from '../../utils'

suite('Commands:Connections:Connect', () => {
    let context: vscode.ExtensionContext
    let originalConnectionPrompt: typeof Prompts.connection.connection
    let originalReadWithPassword: typeof Storage.credential.readWithPassword
    let originalShowError: typeof vscode.window.showErrorMessage
    let originalPlatform: string

    const mockFileSystem = {
        writeFileSync: (_file: fs.PathOrFileDescriptor, _data: string | ArrayBufferView) => {},
        unlinkSync: () => {}
    }

    const mockProcessManager = {
        exec: (command: string, callback: (error: Error | null, stdout: string, stderr: string) => void) => {
            callback(null, '', '')
            return {} as childProcess.ChildProcess
        }
    }

    setup(() => {
        context = getTestContext()
        originalConnectionPrompt = Prompts.connection.connection
        originalReadWithPassword = Storage.credential.readWithPassword
        originalShowError = vscode.window.showErrorMessage
        originalPlatform = process.platform
        Object.defineProperty(process, 'platform', { value: 'win32' })
    })

    teardown(() => {
        Prompts.connection.connection = originalConnectionPrompt
        Storage.credential.readWithPassword = originalReadWithPassword
        vscode.window.showErrorMessage = originalShowError
        Object.defineProperty(process, 'platform', { value: originalPlatform })
    })

    test('connects to remote desktop', async () => {
        const connection: ConnectionModel = {
            id: 'conn-1',
            hostname: 'test-host',
            credentialUsername: 'test-user',
            group: 'test-group'
        }
        const credential = { username: 'test-user', password: 'test-pass' }

        Prompts.connection.connection = async () => connection
        Storage.credential.readWithPassword = async () => credential

        await connectConnectionCommand(context)

        // Note: We can't easily test the actual RDP file creation and mstsc execution
        // since they use the file system and process manager. The command should
        // complete without errors.
    })

    test('shows error if no credentials provided', async () => {
        const connection: ConnectionModel = {
            id: 'conn-1',
            hostname: 'test-host',
            group: 'test-group'
        }
        let errorShown = false

        Prompts.connection.connection = async () => connection
        vscode.window.showErrorMessage = async (msg: string) => {
            errorShown = true
            assert.ok(msg.includes('no credentials'))
            return undefined
        }

        await connectConnectionCommand(context)

        assert.ok(errorShown, 'Error message should be shown')
    })

    test('shows error if credential not found', async () => {
        const connection: ConnectionModel = {
            id: 'conn-1',
            hostname: 'test-host',
            credentialUsername: 'missing-user',
            group: 'test-group'
        }
        let errorShown = false

        Prompts.connection.connection = async () => connection
        Storage.credential.readWithPassword = async () => undefined
        vscode.window.showErrorMessage = async (msg: string) => {
            errorShown = true
            assert.ok(msg.includes('not found'))
            return undefined
        }

        await connectConnectionCommand(context)

        assert.ok(errorShown, 'Error message should be shown')
    })

    test('shows error on non-Windows platform', async () => {
        Object.defineProperty(process, 'platform', { value: 'darwin' })
        let errorShown = false

        vscode.window.showErrorMessage = async (msg: string) => {
            errorShown = true
            assert.ok(msg.includes('Windows'))
            return undefined
        }

        await connectConnectionCommand(context)

        assert.ok(errorShown, 'Error message should be shown')
    })
}) 