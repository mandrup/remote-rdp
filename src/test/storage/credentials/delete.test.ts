import * as assert from 'assert'
import { PREFIXES } from '../../../constants'
import { Storage } from '../../../storage'

suite('Storage:Credentials:Delete', () => {
    let mockContext: any

    setup(() => {
        mockContext = {
            globalState: {
                update: async (_key: string, _value: any) => { /* mocked */ }
            },
            secrets: {
                delete: async (_key: string) => { /* mocked */ }
            }
        }
    })

    test('deletes an existing credential by username', async () => {
        const existing = [
            { id: 'id1', username: 'user1', password: 'secret1' },
            { id: 'id2', username: 'user2', password: 'secret2' }
        ]
        const calls: Record<string, any[]> = { update: [], delete: [] }

        mockContext.globalState.update = async (key: string, value: string) => { calls.update.push([key, value]) }
        mockContext.secrets.delete = async (key: string) => { calls.delete.push([key]) }
        Storage.credential.readAll = async () => existing

        await Storage.credential.delete(mockContext, 'user1')

        assert.strictEqual(calls.update.length, 1, 'globalState.update should be called once')
        assert.strictEqual(calls.delete.length, 1, 'secrets.delete should be called once')

        const [updateKey, updateValue] = calls.update[0]
        assert.strictEqual(updateKey, PREFIXES.credential)
        assert.deepStrictEqual(updateValue, [{ id: 'id2', username: 'user2' }])

        const [deleteKey] = calls.delete[0]
        assert.strictEqual(deleteKey, `${PREFIXES.credential}.secret.id1`)
    })

    test('does nothing if username does not exist', async () => {
        const existing = [{ id: 'id1', username: 'user1', password: 'secret1' }]
        let updateCalled = false
        let deleteCalled = false

        mockContext.globalState.update = async () => { updateCalled = true }
        mockContext.secrets.delete = async () => { deleteCalled = true }
        Storage.credential.readAll = async () => existing

        await Storage.credential.delete(mockContext, 'nonExistingUser')

        assert.strictEqual(updateCalled, false, 'globalState.update should not be called')
        assert.strictEqual(deleteCalled, false, 'secrets.delete should not be called')
    })
})
