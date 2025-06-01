import * as assert from 'assert'
import { PREFIXES } from '../../../constants'
import { Storage } from '../../../storage'

suite('Storage:Credentials:Update', () => {
    let mockContext: any
    let calls: Record<string, any[]>

    setup(() => {
        calls = { update: [], store: [] }

        mockContext = {
            globalState: {
                update: async (key: string, value: any) => { calls.update.push([key, value]) }
            },
            secrets: {
                store: async (key: string, value: string) => { calls.store.push([key, value]) }
            }
        }
    })

    test('updates credential successfully if ID exists and username is unique', async () => {
        const id = 'id-1'
        const existing = [
            { id, username: 'oldUser', password: 'oldPass' },
            { id: 'id-2', username: 'anotherUser', password: 'pass' }
        ]

        Storage.credential.readAll = async () => [...existing]

        const newUsername = 'newUser'
        const newPassword = 'newPass'

        await Storage.credential.update(mockContext, id, newUsername, newPassword)

        assert.strictEqual(calls.update.length, 1)
        assert.strictEqual(calls.store.length, 1)

        const [updateKey, updateValue] = calls.update[0]
        assert.strictEqual(updateKey, PREFIXES.credential)
        assert.ok(updateValue.find((c: any) => c.id === id && c.username === newUsername))

        const [storeKey, storeValue] = calls.store[0]
        assert.ok(storeKey.endsWith(id))
        assert.strictEqual(storeValue, newPassword)
    })

    test('throws error if credential with ID does not exist (updateCredential)', async () => {
        Storage.credential.readAll = async () => []

        await assert.rejects(
            () => Storage.credential.update(mockContext, 'missing-id', 'any', 'any'),
            (err: any) => err instanceof Error && err.message.includes('Credential with ID "missing-id" not found')
        )
    })

    test('throws error if new username already exists on another ID (updateCredential)', async () => {
        const id = 'id-1'
        const existing = [
            { id, username: 'oldUser', password: 'oldPass' },
            { id: 'id-2', username: 'conflictUser', password: 'pass' }
        ]
        Storage.credential.readAll = async () => existing

        await assert.rejects(
            () => Storage.credential.update(mockContext, id, 'conflictUser', 'newPass'),
            (err: any) =>
                err instanceof Error &&
                err.message.includes('Credential for username "conflictUser" already exists')
        )
    })

    test('updates credential username successfully if ID exists and username is unique (updateCredentialUsername)', async () => {
        const id = 'id-1'
        const existing = [
            { id, username: 'oldUser', password: 'oldPass' },
            { id: 'id-2', username: 'anotherUser', password: 'pass' }
        ]

        Storage.credential.readAll = async () => [...existing]

        const newUsername = 'renamedUser'
        const newPassword = 'updatedPass'

        await Storage.credential.updateUsername(mockContext, id, newUsername, newPassword)

        assert.strictEqual(calls.update.length, 1)
        assert.strictEqual(calls.store.length, 1)

        const [updateKey, updateValue] = calls.update[0]
        assert.strictEqual(updateKey, PREFIXES.credential)
        assert.ok(updateValue.find((c: any) => c.id === id && c.username === newUsername))

        const [storeKey, storeValue] = calls.store[0]
        assert.ok(storeKey.endsWith(id))
        assert.strictEqual(storeValue, newPassword)
    })

    test('throws error if credential with ID does not exist (updateCredentialUsername)', async () => {
        Storage.credential.readAll = async () => []

        await assert.rejects(
            () => Storage.credential.updateUsername(mockContext, 'nonexistent', 'whatever', 'whatever'),
            (err: any) => err instanceof Error && err.message.includes('Credential with ID "nonexistent" not found')
        )
    })

    test('throws error if new username already exists on another ID (updateCredentialUsername)', async () => {
        const id = 'id-1'
        const existing = [
            { id, username: 'currentUser', password: 'pw' },
            { id: 'id-2', username: 'duplicateUser', password: 'pw2' }
        ]

        Storage.credential.readAll = async () => existing

        await assert.rejects(
            () => Storage.credential.updateUsername(mockContext, id, 'duplicateUser', 'anything'),
            (err: any) =>
                err instanceof Error &&
                err.message.includes('Credential for username "duplicateUser" already exists')
        )
    })
})