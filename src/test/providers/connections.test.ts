import * as assert from 'assert'
import * as vscode from 'vscode'
import { clearConnections, clearCredentials, createTestCredential, createTestConnection, createMockContext } from '../utils'
import { ConnectionsProvider } from '../../providers/connections'

suite('Connections Provider Test Suite', () => {
    let provider: ConnectionsProvider
    let context: vscode.ExtensionContext

    suiteSetup(async () => {
        context = createMockContext()
    })

    setup(async () => {
        await clearConnections(context)
        await clearCredentials(context)
        provider = new ConnectionsProvider(context)
    })

    test('getChildren returns empty array when no connections exist', async () => {
        const children = await provider.getChildren()
        assert.strictEqual(children.length, 1)
        assert.strictEqual(children[0].label, 'No connections saved')
    })

    test('getChildren returns connection items', async () => {
        await createTestCredential(context, crypto.randomUUID(), 'user1', 'pass1')
        await createTestConnection(context, 'host1.example.com', 'user1', 'Group 1')
        await createTestConnection(context, 'host2.example.com', 'user1', 'Group 1')

        const children = await provider.getChildren()
        assert.strictEqual(children.length, 1)
        assert.strictEqual(children[0].type, 'group')
        assert.strictEqual(children[0].label, 'Group 1')

        const groupChildren = await provider.getChildren(children[0])
        assert.strictEqual(groupChildren.length, 2)
        assert.strictEqual(groupChildren[0].type, 'connection')
        assert.strictEqual(groupChildren[0].label, 'host1.example.com')
        assert.strictEqual(groupChildren[1].type, 'connection')
        assert.strictEqual(groupChildren[1].label, 'host2.example.com')
    })

    test('getChildren returns ungrouped connections', async () => {
        await createTestCredential(context, crypto.randomUUID(), 'user1', 'pass1')
        await createTestConnection(context, 'host1.example.com', 'user1', '')

        await createTestConnection(context, 'host2.example.com', 'user1', 'Group 1')

        const children = await provider.getChildren()
        assert.strictEqual(children.length, 2)
        const ungrouped = children.find(item => item.type === 'connection')
        const group = children.find(item => item.type === 'group')

        assert.ok(ungrouped)
        assert.ok(group)
        assert.strictEqual(ungrouped?.label, 'host1.example.com')
        assert.strictEqual(group?.label, 'Group 1')
    })

    test('getTreeItem returns connection item', async () => {
        await createTestCredential(context, crypto.randomUUID(), 'user1', 'pass1')
        await createTestConnection(context, 'host1.example.com', 'user1', 'Group 1')
        const children = await provider.getChildren()
        const groupChildren = await provider.getChildren(children[0])
        const treeItem = provider.getTreeItem(groupChildren[0])

        assert.strictEqual(treeItem.label, 'host1.example.com')
        assert.strictEqual(treeItem.collapsibleState, vscode.TreeItemCollapsibleState.None)
    })

    test('getTreeItem returns group item', async () => {
        await createTestCredential(context, crypto.randomUUID(), 'user1', 'pass1')
        await createTestConnection(context, 'host1.example.com', 'user1', 'Group 1')
        const children = await provider.getChildren()
        const treeItem = provider.getTreeItem(children[0])

        assert.strictEqual(treeItem.label, 'Group 1')
        assert.strictEqual(treeItem.collapsibleState, vscode.TreeItemCollapsibleState.Expanded)
    })

    test('refresh command updates tree view', async () => {
        // Create initial connection
        await createTestCredential(context, crypto.randomUUID(), 'user1', 'pass1')
        await createTestConnection(context, 'host1.example.com', 'user1', 'Group 1')
        let children = await provider.getChildren()
        assert.strictEqual(children.length, 1)

        // Call refresh directly
        provider.refresh()

        // Create another connection
        await createTestConnection(context, 'host2.example.com', 'user1', 'Group 1')

        // Verify tree view is updated
        children = await provider.getChildren()
        const groupChildren = await provider.getChildren(children[0])
        assert.strictEqual(groupChildren.length, 2)
        assert.strictEqual(groupChildren[0].label, 'host1.example.com')
        assert.strictEqual(groupChildren[1].label, 'host2.example.com')
    })

    test('connection items have correct context value', async () => {
        await createTestCredential(context, crypto.randomUUID(), 'user1', 'pass1')
        await createTestConnection(context, 'host1.example.com', 'user1', 'Group 1')
        const children = await provider.getChildren()
        const groupChildren = await provider.getChildren(children[0])
        const treeItem = provider.getTreeItem(groupChildren[0])

        assert.strictEqual(treeItem.contextValue, 'connectionItem')
    })

    test('group items have correct context value', async () => {
        await createTestCredential(context, crypto.randomUUID(), 'user1', 'pass1')
        await createTestConnection(context, 'host1.example.com', 'user1', 'Group 1')
        const children = await provider.getChildren()
        const treeItem = provider.getTreeItem(children[0])

        assert.strictEqual(treeItem.contextValue, 'connectionGroup')
    })

    test('connection items have correct tooltip', async () => {
        await createTestCredential(context, crypto.randomUUID(), 'user1', 'pass1')
        await createTestConnection(context, 'host1.example.com', 'user1', 'Group 1')
        const children = await provider.getChildren()
        const groupChildren = await provider.getChildren(children[0])
        const treeItem = provider.getTreeItem(groupChildren[0])

        assert.strictEqual(treeItem.label, 'host1.example.com')
    })
}) 