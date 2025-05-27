import * as assert from 'assert'
import * as vscode from 'vscode'
import { createMockContext, clearCredentials, createTestCredential } from '../utils'
import { CredentialsProvider } from '../../providers/credentials'

suite('Credentials Provider Test Suite', () => {
    let provider: CredentialsProvider
    let context: vscode.ExtensionContext

    suiteSetup(() => {
        context = createMockContext()
    })
    
    setup(async () => {
        await clearCredentials(context)
        provider = new CredentialsProvider(context)
    })

    test('getChildren returns empty array when no credentials exist', async () => {
        const children = await provider.getChildren()
        assert.strictEqual(children.length, 1)
        assert.strictEqual(children[0].label, 'No credentials saved')
    })

    test('getChildren returns credential items', async () => {
        await createTestCredential(context, crypto.randomUUID(), 'user1', 'pass1')
        await createTestCredential(context, crypto.randomUUID(), 'user2', 'pass2')

        const children = await provider.getChildren()
        assert.strictEqual(children.length, 2)
        assert.strictEqual(children[0].label, 'user1')
        assert.strictEqual(children[1].label, 'user2')
        assert.strictEqual(children[0].contextValue, 'credentialItem')
        assert.strictEqual(children[1].contextValue, 'credentialItem')
    })

    test('getTreeItem returns credential item', async () => {
        await createTestCredential(context, crypto.randomUUID(), 'testuser', 'testpass')
        const children = await provider.getChildren()
        const treeItem = provider.getTreeItem(children[0])

        assert.strictEqual(treeItem.label, 'testuser')
        assert.strictEqual(treeItem.collapsibleState, vscode.TreeItemCollapsibleState.None)
    })

    test('credential items have correct context value', async () => {
        await createTestCredential(context, crypto.randomUUID(), 'testuser', 'password123')
        const children = await provider.getChildren()
        const treeItem = provider.getTreeItem(children[0])

        assert.strictEqual(treeItem.contextValue, 'credentialItem')
        assert.strictEqual(treeItem.tooltip, 'testuser')
    })

    test('credential items have correct tooltip', async () => {
        await createTestCredential(context, crypto.randomUUID(), 'testuser', 'testpass')
        const children = await provider.getChildren()
        const treeItem = provider.getTreeItem(children[0])

        assert.strictEqual(treeItem.tooltip, 'testuser')
    })
})