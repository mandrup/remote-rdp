import * as assert from 'assert'
import { PREFIXES } from '../../../constants'
import { Storage } from '../../../storage'

suite('Storage:Credentials:Create', () => {
    let mockContext: any

    setup(() => {
        mockContext = {
            globalState: {
                update: async (_key: string, _value: any) => { /* mocked */ }
            },
            secrets: {
                store: async (_key: string, _value: string) => { /* mocked */ }
            }
        }
    })

    test('creates a new credential if username is unique', async () => {
        // Arrange
        const calls: Record<string, any[]> = { update: [], store: [] }

        mockContext.globalState.update = async (key: string, value: string) => { calls.update.push([key, value]) }

        mockContext.secrets.store = async (key: string, value: string) => {
            calls.store.push([key, value])
        }

        Storage.credential.readAll = async () => []

        const username = 'newUser'
        const password = 'newPass'

        // Act
        await Storage.credential.create(mockContext, username, password)

        // Assert
        assert.strictEqual(calls.update.length, 1, 'globalState.update should be called once')
        assert.strictEqual(calls.store.length, 1, 'secrets.store should be called once')

        const [updateKey, updateValue] = calls.update[0]
        assert.strictEqual(updateKey, PREFIXES.credential)
        assert.deepStrictEqual(updateValue.length, 1)

        const [storeKey, storeValue] = calls.store[0]
        assert.ok(storeKey.startsWith(`${PREFIXES.credential}.secret.`), 'secret key should be prefixed correctly')
        assert.strictEqual(storeValue, password)
    })

    test('throws error if credential with username already exists', async () => {
        // Arrange
        const existing = [{
            id: 'abc123',
            username: 'existingUser',
            password: 'irrelevant'
        }]
        Storage.credential.readAll = async () => existing

        const username = 'existingUser'
        const password = 'somePass'

        // Act + Assert
        await assert.rejects(
            () => Storage.credential.create(mockContext, username, password),
            (err: any) => {
                return err instanceof Error &&
                    err.message.includes(`Credential for username "${username}" already exists`)
            }
        )
    })

})
