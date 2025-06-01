import * as assert from 'assert'
import { PREFIXES } from '../../../constants'
import { Storage } from '../../../storage'

suite('Storage:Connections:Create', () => {
    let mockContext: any
    let calls: Record<string, any[]>

    setup(() => {
        calls = { update: [] }

        mockContext = {
            globalState: {
                update: async (key: string, value: any) => {
                    calls.update.push([key, value])
                }
            }
        }
    })

    test('creates a new connection with hostname and credentialUsername', async () => {
        const existingConnections: any[] = []
        Storage.connection.readAll = () => existingConnections

        const hostname = 'example.com'
        const credentialUsername = 'testuser'

        await Storage.connection.create(mockContext, hostname, credentialUsername)

        assert.strictEqual(calls.update.length, 1, 'globalState.update should be called once')

        const [updateKey, updateValue] = calls.update[0]
        assert.strictEqual(updateKey, PREFIXES.connection, 'Should update with correct prefix')
        assert.strictEqual(updateValue.length, 1, 'One connection should be added')
        const created = updateValue[0]
        assert.ok(created.id, 'Should have an ID')
        assert.strictEqual(created.hostname, hostname)
        assert.strictEqual(created.credentialUsername, credentialUsername)
        assert.strictEqual(created.group, undefined)
    })

    test('creates a new connection with optional group', async () => {
        const existingConnections: any[] = []
        Storage.connection.readAll = () => existingConnections

        const hostname = 'example.com'
        const credentialUsername = 'testuser'
        const group = 'dev'

        await Storage.connection.create(mockContext, hostname, credentialUsername, group)

        assert.strictEqual(calls.update.length, 1)

        const [_, updatedConnections] = calls.update[0]
        assert.strictEqual(updatedConnections.length, 1)
        const connection = updatedConnections[0]
        assert.strictEqual(connection.group, group)
    })

    test('throws error if the connection is not valid', async () => {
        Storage.connection.readAll = () => []

        const originalValidate = Object.getOwnPropertyDescriptor(
            require('../../../models/connection'),
            'isConnectionModel'
        )

        const fakeValidate = () => false
        require('../../../models/connection').isConnectionModel = fakeValidate

        await assert.rejects(
            () => Storage.connection.create(mockContext, 'badhost', 'baduser'),
            (err: any) => err instanceof Error && err.message === 'Invalid connection data'
        )

        if (originalValidate) {
            Object.defineProperty(require('../../../models/connection'), 'isConnectionModel', originalValidate)
        }
    })
})
