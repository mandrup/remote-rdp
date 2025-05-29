import * as assert from 'assert'
import { PREFIXES } from '../../../constants'
import { Storage } from '../../../storage'

suite('Storage:Credentials:Read', () => {
    let mockContext: any

    setup(() => {
        mockContext = {
            globalState: {
                get: (_key: string, _default: any) => []
            },
            secrets: {
                get: async (_key: string) => null
            }
        }
    })

    test('readCredentials returns array with passwords', async () => {
        // Arrange
        const stored = [
            { id: 'id1', username: 'user1' },
            { id: 'id2', username: 'user2' }
        ]

        const secrets: Record<string, string> = {
            [`${PREFIXES.credential}.secret.id1`]: 'pw1',
            [`${PREFIXES.credential}.secret.id2`]: 'pw2'
        }

        mockContext.globalState.get = (_key: string, _default: any) => stored
        mockContext.secrets.get = async (key: string) => secrets[key]

        // Act
        const result = await Storage.credential.readAll(mockContext)

        // Assert
        assert.strictEqual(result.length, 2)
        assert.deepStrictEqual(result[0], { id: 'id1', username: 'user1', password: 'pw1' })
        assert.deepStrictEqual(result[1], { id: 'id2', username: 'user2', password: 'pw2' })
    })

    test('readCredentials throws if stored data is not valid model array', async () => {
        // Arrange
        mockContext.globalState.get = () => [{ id: 'x' }]

        // Act + Assert
        await assert.rejects(() => Storage.credential.readAll(mockContext), /Invalid credential data in storage/)
    })

    test('getCredentialWithPassword returns credential with password if found', async () => {
        // Arrange
        const stored = [{ id: 'id1', username: 'user1' }]
        mockContext.globalState.get = () => stored
        mockContext.secrets.get = async (key: string) =>
            key === `${PREFIXES.credential}.secret.id1` ? 'secret123' : null

        // Act
        const result = await Storage.credential.readWithPassword(mockContext, 'user1')

        // Assert
        assert.deepStrictEqual(result, { username: 'user1', password: 'secret123' })
    })

    test('getCredentialWithPassword returns undefined if username is not found', async () => {
        // Arrange
        const stored = [{ id: 'id1', username: 'user1' }]
        mockContext.globalState.get = () => stored
        mockContext.secrets.get = async () => 'irrelevant'

        // Act
        const result = await Storage.credential.readWithPassword(mockContext, 'nonexistent')

        // Assert
        assert.strictEqual(result, undefined)
    })

    test('getCredentialWithPassword returns undefined if secret is missing', async () => {
        // Arrange
        const stored = [{ id: 'id1', username: 'user1' }]
        mockContext.globalState.get = () => stored
        mockContext.secrets.get = async () => null

        // Act
        const result = await Storage.credential.readWithPassword(mockContext, 'user1')

        // Assert
        assert.strictEqual(result, undefined)
    })

    test('readCredentialUsernames returns list of usernames', async () => {
        // Arrange
        const stored = [
            { id: 'id1', username: 'a' },
            { id: 'id2', username: 'b' }
        ]

        mockContext.globalState.get = () => stored
        mockContext.secrets.get = async () => 'pw'

        // Act
        const usernames = await Storage.credential.readAllUsernames(mockContext)

        // Assert
        assert.deepStrictEqual(usernames, ['a', 'b'])
    })
})
