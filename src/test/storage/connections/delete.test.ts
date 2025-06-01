import * as assert from 'assert'
import { Storage } from '../../../storage'

suite('Storage:Connections:Delete', () => {
    let mockContext: any
    let calls: Record<string, any[]>

    setup(() => {
        calls = { updateAll: [] }
        mockContext = {}
        Storage.connection.updateAll = async (context: any, value: any[]) => {
            calls.updateAll.push([context, value])
        }
    })

    test('deletes connection by ID', async () => {
        const existingConnections = [
            { id: 'abc123', hostname: 'one.com', credentialUsername: 'user1' },
            { id: 'def456', hostname: 'two.com', credentialUsername: 'user2' }
        ]
        Storage.connection.readAll = () => existingConnections

        await Storage.connection.delete(mockContext, 'abc123')

        assert.strictEqual(calls.updateAll.length, 1, 'updateAll should be called once')
        const [_, updated] = calls.updateAll[0]
        assert.strictEqual(updated.length, 1, 'One connection should remain')
        assert.strictEqual(updated[0].id, 'def456', 'Remaining connection should not be the deleted one')
    })

    test('does nothing if no matching ID is found', async () => {
        const existingConnections = [
            { id: 'abc123', hostname: 'one.com', credentialUsername: 'user1' }
        ]
        Storage.connection.readAll = () => existingConnections

        await Storage.connection.delete(mockContext, 'nonexistent')

        assert.strictEqual(calls.updateAll.length, 1)
        const [_, updated] = calls.updateAll[0]
        assert.deepStrictEqual(updated, existingConnections, 'No connections should be removed')
    })

    test('handles empty list gracefully', async () => {
        Storage.connection.readAll = () => []

        await Storage.connection.delete(mockContext, 'any-id')

        assert.strictEqual(calls.updateAll.length, 1)
        const [_, updated] = calls.updateAll[0]
        assert.deepStrictEqual(updated, [], 'Should update with empty list')
    })
})
