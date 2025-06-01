import * as assert from 'assert'
import * as vscode from 'vscode'
import { Storage } from '../../../storage'
import { CredentialModel } from '../../../models/credential'
import { CredentialsProvider } from '../../../providers'

suite('Providers:CredentialsProvider', () => {
    let mockContext: vscode.ExtensionContext
    let provider: CredentialsProvider

    setup(() => {
        mockContext = {
            subscriptions: []
        } as any

        provider = new CredentialsProvider(mockContext)
    })

    let originalReadAll: typeof Storage.credential.readAll
    let originalShowErrorMessage: typeof vscode.window.showErrorMessage

    setup(() => {
        originalReadAll = Storage.credential.readAll
        originalShowErrorMessage = vscode.window.showErrorMessage
    })

    teardown(() => {
        Storage.credential.readAll = originalReadAll
        vscode.window.showErrorMessage = originalShowErrorMessage
    })

    test('getChildren returns empty array for child elements', async () => {
        const children = await provider.getChildren({ type: 'dummy' } as any)
        assert.deepStrictEqual(children, [])
    })

    test('getChildren returns CredentialItems when credentials exist', async () => {
        const creds: CredentialModel[] = [
            { id: '1', username: 'user1', password: 'pass1' },
            { id: '2', username: 'user2', password: 'pass2' },
        ]
        Storage.credential.readAll = async () => creds

        const children = await provider.getChildren()

        assert.strictEqual(children.length, 2)
        assert.strictEqual(children[0].label, 'user1')
        assert.strictEqual(children[0].contextValue, 'credentialItem')
        assert.strictEqual(children[1].label, 'user2')
    })

    test('getChildren returns EmptyItem when no credentials exist', async () => {
        Storage.credential.readAll = async () => []

        const children = await provider.getChildren()

        assert.strictEqual(children.length, 1)
        assert.strictEqual(children[0].label, 'No credentials saved')
        assert.strictEqual(children[0].contextValue, 'emptyCredentials')
    })

    test('getChildren shows error message and returns empty array on error', async () => {
        Storage.credential.readAll = async () => { throw new Error('fail') }
        let errorShown = false
        vscode.window.showErrorMessage = async (msg: string) => {
            errorShown = msg.includes('Failed to load credentials.')
            return undefined
        }

        const children = await provider.getChildren()

        assert.strictEqual(children.length, 0)
        assert.strictEqual(errorShown, true)
    })
})
