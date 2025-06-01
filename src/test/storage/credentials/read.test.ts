import * as assert from 'assert'
import { PREFIXES } from '../../../constants'
import { Storage } from '../../../storage'
import { createMockContext } from '../../utils'

suite('Storage:Credentials:Read', () => {
    test('getCredentialWithPassword returns credential with password if found', async () => {
        const mockContext = createMockContext()
        mockContext.globalState.get = () => [{ id: 'id1', username: 'user1' }]
        mockContext.secrets.get = async (key: string) =>
            key === `${PREFIXES.credential}.secret.id1` ? 'secret123' : undefined

        const result = await Storage.credential.readWithPassword(mockContext, 'user1')
        assert.deepStrictEqual(result, { username: 'user1', password: 'secret123' })
    })

    test('getCredentialWithPassword returns undefined if username is not found', async () => {
        const mockContext = createMockContext()
        mockContext.globalState.get = () => [{ id: 'id1', username: 'user1' }]
        mockContext.secrets.get = async () => 'irrelevant'

        const result = await Storage.credential.readWithPassword(mockContext, 'nonexistent')
        assert.strictEqual(result, undefined)
    })

    test('getCredentialWithPassword returns undefined if secret is missing', async () => {
        const mockContext = createMockContext()
        mockContext.globalState.get = () => [{ id: 'id1', username: 'user1' }]
        mockContext.secrets.get = async () => undefined

        const result = await Storage.credential.readWithPassword(mockContext, 'user1')
        assert.strictEqual(result, undefined)
    })

    test('readCredentialUsernames returns list of usernames', async () => {
        const mockContext = createMockContext()
        mockContext.globalState.get = () => [
            { id: 'id1', username: 'a' },
            { id: 'id2', username: 'b' }
        ]
        mockContext.secrets.get = async () => 'pw'

        const usernames = await Storage.credential.readAllUsernames(mockContext)
        assert.deepStrictEqual(usernames, ['a', 'b'])
    })
})