import * as assert from 'assert'
import { PREFIXES, COMMAND_IDS } from '../constants'

suite('Constants', () => {
    test('connection command IDs are correct', () => {
        assert.equal(COMMAND_IDS.connection.create, `${PREFIXES.connection}:create`)
        assert.equal(COMMAND_IDS.connection.delete, `${PREFIXES.connection}:delete`)
        assert.equal(COMMAND_IDS.connection.update, `${PREFIXES.connection}:update`)
        assert.equal(COMMAND_IDS.connection.connect, `${PREFIXES.connection}:connect`)
        assert.equal(COMMAND_IDS.connection.refresh, `${PREFIXES.connection}:refresh`)
        assert.equal(COMMAND_IDS.connection.import, `${PREFIXES.connection}:import`)
        assert.equal(COMMAND_IDS.connection.export, `${PREFIXES.connection}:export`)
    })

    test('credential command IDs are correct', () => {
        assert.equal(COMMAND_IDS.credential.create, `${PREFIXES.credential}:create`)
        assert.equal(COMMAND_IDS.credential.delete, `${PREFIXES.credential}:delete`)
        assert.equal(COMMAND_IDS.credential.update, `${PREFIXES.credential}:update`)
        assert.equal(COMMAND_IDS.credential.refresh, `${PREFIXES.credential}:refresh`)
    })

    test('all command values are strings', () => {
        const allValues = [
            ...Object.values(COMMAND_IDS.connection) as string[],
            ...Object.values(COMMAND_IDS.credential) as string[],
        ]

        for (const value of allValues) {
            assert.equal(typeof value, 'string')
        }
    })
})
