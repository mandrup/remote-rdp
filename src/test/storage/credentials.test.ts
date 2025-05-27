import * as assert from 'assert'
import * as vscode from 'vscode'
import {
    createCredential,
    deleteCredential,
    readCredentialUsernames,
    readCredentials,
    updateCredential,
    updateCredentialUsername
} from '../../storage'
import { clearCredentials, createMockContext } from '../utils'
import { PREFIXES } from '../../constants'
import { CredentialModel } from '../../models/credential'

suite('credentials storage', () => {
    let context: vscode.ExtensionContext

    suiteSetup(() => {
        const stored: CredentialModel[] = [{ id: '1', username: 'user', password: 'pass' }]
        context = createMockContext({ [PREFIXES.credential]: stored })
    })

    setup(async () => {
        await clearCredentials(context)
    })

    test('readCredentials returns empty array when no credentials stored', async () => {
        const result = await readCredentials(context)
        assert.deepStrictEqual(result, [])
    })

    test('readCredentialUsernames returns all usernames', async () => {
        await createCredential(context, 'alice', 'pass1')
        await createCredential(context, 'bob', 'pass2')

        const usernames = await readCredentialUsernames(context)
        assert.deepStrictEqual(usernames, ['alice', 'bob'])
    })

    test('createCredential adds a new credential', async () => {
        await createCredential(context, 'newUser', 'secret')

        const stored = await readCredentials(context)
        assert.strictEqual(stored.length, 1)
        assert.ok(stored[0].id)
        assert.strictEqual(stored[0].username, 'newUser')
        assert.strictEqual(stored[0].password, 'secret')
    })

    test('updateCredential modifies existing credential', async () => {
        await createCredential(context, 'user', 'oldpass')
        const created = await readCredentials(context)

        await updateCredential(context, created[0].id, 'user', 'newpass')

        const updated = await readCredentials(context)
        assert.strictEqual(updated[0].username, 'user')
        assert.strictEqual(updated[0].password, 'newpass')
    })

    test('deleteCredential removes credential by username', async () => {
        await createCredential(context, 'user1', 'pass1')
        await createCredential(context, 'user2', 'pass2')

        await deleteCredential(context, 'user1')

        const remaining = await readCredentials(context)
        assert.strictEqual(remaining.length, 1)
        assert.strictEqual(remaining[0].username, 'user2')
    })

    test('updateCredentialUsername updates username and password', async () => {
        await createCredential(context, 'olduser', 'oldpass')
        const created = await readCredentials(context)

        await updateCredentialUsername(context, created[0].id, 'newuser', 'newpass')

        const updated = await readCredentials(context)
        assert.strictEqual(updated[0].username, 'newuser')
        assert.strictEqual(updated[0].password, 'newpass')
    })

    // Error handling tests
    test('readCredentials throws if stored data is invalid', () => {
        const context = createMockContext({ [PREFIXES.credential]: { invalid: 'data' } })
        assert.rejects(() => readCredentials(context), /Invalid credential data in storage/)
    })

    test('createCredential rejects if username already exists', async () => {
        await createCredential(context, 'user', 'pass1')
        await assert.rejects(
            () => createCredential(context, 'user', 'pass2'),
            /Credential for username "user" already exists/
        )
    })

    test('updateCredential rejects if credential not found', async () => {
        await assert.rejects(
            () => updateCredential(context, 'nonexistent', 'user', 'pass'),
            /Credential with ID "nonexistent" not found/
        )
    })

    test('updateCredentialUsername rejects if credential not found', async () => {
        await assert.rejects(
            () => updateCredentialUsername(context, 'nonexistent', 'new', 'newpass'),
            /Credential with ID "nonexistent" not found/
        )
    })

    test('updateCredentialUsername rejects if new username already exists', async () => {
        await createCredential(context, 'user1', 'pass1')
        await createCredential(context, 'user2', 'pass2')
        const creds = await readCredentials(context)

        await assert.rejects(
            () => updateCredentialUsername(context, creds[0].id, 'user2', 'newpass'),
            /Credential for username "user2" already exists/
        )
    })
})
