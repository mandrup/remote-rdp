import * as assert from 'assert'
import { Storage } from '../../storage'

suite('Storage', () => {
    test('Storage.connection contains expected functions', () => {
        const keys = [
            'readAll',
            'create',
            'updateAll',
            'updateAllCredential',
            'clearAllCredential',
            'delete'
        ]

        for (const key of keys) {
            assert.ok(typeof Storage.connection[key as keyof typeof Storage.connection] === 'function', `Expected Storage.connection.${key} to be a function`)
        }
    })

    test('Storage.credential contains expected functions', () => {
        const keys = [
            'readAll',
            'readAllUsernames',
            'readWithPassword',
            'create',
            'update',
            'updateUsername',
            'delete'
        ]

        for (const key of keys) {
            assert.ok(typeof Storage.credential[key as keyof typeof Storage.credential] === 'function', `Expected Storage.credential.${key} to be a function`)
        }
    })
})
