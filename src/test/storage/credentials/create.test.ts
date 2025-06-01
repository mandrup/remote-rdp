import * as assert from 'assert'
import { PREFIXES } from '../../../constants'
import { Storage } from '../../../storage'
import { createMockContext } from '../../utils'

suite('Storage:Credentials:Create', () => {
    let mockContext: any

    setup(() => {
        mockContext = createMockContext()
    })

    test('creates a new credential if username is unique', async () => {
        const calls: Record<string, any[]> = { update: [], store: [] }

        mockContext.globalState.update = async (key: string, value: string) => { calls.update.push([key, value]) }
        mockContext.secrets.store = async (key: string, value: string) => { calls.store.push([key, value]) }
        Storage.credential.readAll = async () => []

        await Storage.credential.create(mockContext, 'newUser', 'newPass')

        assert.strictEqual(calls.update.length, 1, 'globalState.update should be called once')
        assert.strictEqual(calls.store.length, 1, 'secrets.store should be called once')

        const [updateKey, updateValue] = calls.update[0]
        assert.strictEqual(updateKey, PREFIXES.credential)
        assert.deepStrictEqual(updateValue.length, 1)

        const [storeKey, storeValue] = calls.store[0]
        assert.ok(storeKey.startsWith(`${PREFIXES.credential}.secret.`), 'secret key should be prefixed correctly')
        assert.strictEqual(storeValue, 'newPass')
    })

    test('throws error if credential with username already exists', async () => {
        const existing = [{
            id: 'abc123',
            username: 'existingUser',
            password: 'irrelevant'
        }]
        Storage.credential.readAll = async () => existing

        await assert.rejects(
            () => Storage.credential.create(mockContext, 'existingUser', 'somePass'),
            (err: any) => err instanceof Error && err.message.includes('Credential for username "existingUser" already exists')
        )
    })
})
