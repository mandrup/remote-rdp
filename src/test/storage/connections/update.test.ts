import * as assert from 'assert'
import { ConnectionModel } from '../../../models/connection'
import { Storage } from '../../../storage'

suite('Storage:Connections:update', () => {
    const validConnections: ConnectionModel[] = [
        { id: '1', hostname: 'host1', credentialUsername: 'user1', group: 'group1' },
        { id: '2', hostname: 'host2', credentialUsername: 'user2', group: undefined }
    ]

    let mockContext: any

    setup(() => {
        mockContext = {
            globalState: {
                update: async (_key: string, _value: any) => { },
                get: (_key: string) => validConnections
            }
        }
    })

    suite('updateConnections', () => {
        /*
        test('updates valid connection list successfully', async () => {
            let updatedValue: any

            mockContext.globalState.update = async (_key: string, value: any) => {
                updatedValue = value
            }

            const result = await Storage.connection.updateAll(mockContext, validConnections)
            assert.deepStrictEqual(updatedValue, validConnections)
            assert.strictEqual(result, undefined)
        })*/

        /*
        test('throws error if input is not valid connection array', async () => {
            const invalid = [{}] as any
            await assert.rejects(() => Storage.connection.updateAll(mockContext, invalid), /Invalid connection data array/)
        })*/

        /*
        test('throws error if stored value after update is invalid', async () => {
            mockContext.globalState.get = () => [{ not: 'valid' }]
            await assert.rejects(() => Storage.connection.updateAll(mockContext, validConnections), /Stored connection data is invalid after update/)
        })*/
    })

    suite('updateConnectionsCredential', () => {
        test('updates matching credential usernames', async () => {
            const original = [
                { id: '1', hostname: 'host', credentialUsername: 'old', group: undefined },
                { id: '2', hostname: 'host2', credentialUsername: 'other', group: undefined }
            ]

            Storage.connection.readAll = () => original

            let updatedConnections: any
            mockContext.globalState.update = async (_key: string, value: any) => {
                updatedConnections = value
            }

            mockContext.globalState.get = () => updatedConnections

            await Storage.connection.updateAllCredential(mockContext, 'old', 'new')

            assert.strictEqual(updatedConnections[0].credentialUsername, 'new')
            assert.strictEqual(updatedConnections[1].credentialUsername, 'other')
        })
    })

    suite('clearConnectionsCredential', () => {
        test('clears credentialUsername from matching connections', async () => {
            const original = [
                { id: '1', hostname: 'host', credentialUsername: 'target', group: undefined },
                { id: '2', hostname: 'host2', credentialUsername: 'target', group: undefined },
                { id: '3', hostname: 'host3', credentialUsername: 'other', group: undefined }
            ]

            Storage.connection.readAll = () => original

            let updatedConnections: any
            mockContext.globalState.update = async (_key: string, value: any) => {
                updatedConnections = value
            }

            mockContext.globalState.get = () => updatedConnections

            const affected = await Storage.connection.clearAllCredential(mockContext, 'target')

            assert.strictEqual(affected, 2)
            assert.strictEqual(updatedConnections[0].credentialUsername, undefined)
            assert.strictEqual(updatedConnections[1].credentialUsername, undefined)
            assert.strictEqual(updatedConnections[2].credentialUsername, 'other')
        })

        test('returns 0 when no matching usernames', async () => {
            const original = [
                { id: '1', hostname: 'host', credentialUsername: 'other', group: undefined }
            ]

            Storage.connection.readAll = () => original

            let updatedConnections: any
            mockContext.globalState.update = async (_key: string, value: any) => {
                updatedConnections = value
            }

            mockContext.globalState.get = () => updatedConnections

            const affected = await Storage.connection.clearAllCredential(mockContext, 'target')

            assert.strictEqual(affected, 0)
            assert.strictEqual(updatedConnections[0].credentialUsername, 'other')
        })
    })
})
