import * as assert from 'assert'
import * as vscode from 'vscode'
import { Storage } from '../../../storage'
import { ConnectionModel } from '../../../models/connection'
import { ConnectionsProvider } from '../../../providers'

suite('ConnectionsProvider:getChildren', () => {
    let mockContext: vscode.ExtensionContext
    let provider: ConnectionsProvider

    setup(() => {
        mockContext = {
            subscriptions: []
        } as any

        provider = new ConnectionsProvider(mockContext)
    })

    test('returns empty item if no connections exist', async () => {
        Storage.connection.readAll = () => []
        const children = await provider.getChildren()
        assert.strictEqual(children.length, 1)
        assert.strictEqual(children[0].label, 'No connections saved')
        assert.strictEqual(children[0].contextValue, 'emptyConnections')
    })

    test('returns ungrouped connections if they have no group', async () => {
        const connections: ConnectionModel[] = [
            { id: '1', hostname: 'host1', credentialUsername: 'user1' },
            { id: '2', hostname: 'host2', credentialUsername: 'user2', group: '' }
        ]
        Storage.connection.readAll = () => connections
        const children = await provider.getChildren()
        assert.strictEqual(children.length, 2)
        assert.ok(children.every(c => c.contextValue === 'connectionItem'))
    })

    test('groups connections by group name', async () => {
        const connections: ConnectionModel[] = [
            { id: '1', hostname: 'host1', credentialUsername: 'user1', group: 'Alpha' },
            { id: '2', hostname: 'host2', credentialUsername: 'user2', group: 'Alpha' },
            { id: '3', hostname: 'host3', credentialUsername: 'user3', group: 'Beta' }
        ]

        Storage.connection.readAll = () => connections

        const children = await provider.getChildren()

        assert.strictEqual(children.length, 2)
        assert.ok(children.every(c => c.contextValue === 'connectionGroup'))
        assert.deepStrictEqual(
            children.map(c => c.label),
            ['Alpha', 'Beta']
        )
    })

    test('returns connections within a group when group item is expanded', async () => {
        const connections: ConnectionModel[] = [
            { id: '1', hostname: 'host1', credentialUsername: 'user1', group: 'GroupA' },
            { id: '2', hostname: 'host2', credentialUsername: 'user2', group: 'GroupA' }
        ]

        Storage.connection.readAll = () => connections

        await provider.getChildren()

        const groupItem = {
            type: 'group',
            group: 'GroupA',
            connections
        } as any

        const children = await provider.getChildren(groupItem)

        assert.strictEqual(children.length, 2)
        assert.strictEqual(children[0].contextValue, 'connectionItem')
    })

    test('returns empty array for unknown element types', async () => {
        const result = await provider.getChildren({ type: 'connection' } as any)

        assert.deepStrictEqual(result, [])
    })

    test('handles storage read errors gracefully', async () => {
        Storage.connection.readAll = () => {
            throw new Error('Fail')
        }

        const result = await provider.getChildren()

        assert.deepStrictEqual(result, [])
    })
})