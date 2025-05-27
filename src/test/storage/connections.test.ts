import * as assert from 'assert'
import * as vscode from 'vscode'
import {
  readConnections,
  createConnection,
  updateConnections,
  updateConnectionsCredential,
  deleteConnection,
  clearConnectionsCredential
} from '../../storage'
import { ConnectionModel } from '../../models/connection'
import { createMockContext, clearConnections } from '../utils'

suite('connections storage', () => {
  let context: vscode.ExtensionContext

  suiteSetup(() => {
    context = createMockContext()
  })

  setup(async () => {
    await clearConnections(context)
  })

  test('readConnections returns empty array when no connections stored', () => {
    const result = readConnections(context)
    assert.deepStrictEqual(result, [])
  })

  test('createConnection adds a new connection', async () => {
    await createConnection(context, 'example.com', 'user1', 'Group A')

    const [stored] = readConnections(context)
    assert.ok(stored.id)
    assert.strictEqual(stored.hostname, 'example.com')
    assert.strictEqual(stored.credentialUsername, 'user1')
    assert.strictEqual(stored.group, 'Group A')
  })

  test('updateConnections replaces existing connections', async () => {
    await createConnection(context, 'host1.com', 'user1', 'Group1')
    await createConnection(context, 'host2.com', 'user2', 'Group2')

    const original = readConnections(context)
    const updated = original.map(c => ({
      ...c,
      hostname: `${c.hostname}-updated`,
      group: `${c.group}-updated`
    }))

    await updateConnections(context, updated)

    const stored = readConnections(context)
    assert.strictEqual(stored.length, 2)
    assert.strictEqual(stored[0].hostname, 'host1.com-updated')
    assert.strictEqual(stored[0].group, 'Group1-updated')
    assert.strictEqual(stored[1].hostname, 'host2.com-updated')
    assert.strictEqual(stored[1].group, 'Group2-updated')
  })

  test('updateConnectionsCredential updates credentialUsername on all matching connections', async () => {
    await createConnection(context, 'host1.com', 'oldUser', 'Group1')
    await createConnection(context, 'host2.com', 'oldUser', 'Group2')

    await updateConnectionsCredential(context, 'oldUser', 'newUser')

    const stored = readConnections(context)
    stored.forEach(conn => assert.strictEqual(conn.credentialUsername, 'newUser'))
  })

  test('deleteConnection removes connection by id', async () => {
    await createConnection(context, 'host.com', 'user', 'Group')
    const [created] = readConnections(context)

    await deleteConnection(context, created.id)

    const remaining = readConnections(context)
    assert.strictEqual(remaining.length, 0)
  })

  test('clearConnectionsCredential clears credentialUsername for matching username and returns count', async () => {
    await createConnection(context, 'host1.com', 'user', 'Group1')
    await createConnection(context, 'host2.com', 'user', 'Group2')

    const clearedCount = await clearConnectionsCredential(context, 'user')
    assert.strictEqual(clearedCount, 2)

    const stored = readConnections(context)
    stored.forEach(conn => assert.strictEqual(conn.credentialUsername, undefined))
  })

  test('createConnection throws error for invalid data', async () => {
    await assert.rejects(
      () => createConnection(context, null as any, null as any),
      /Invalid connection data/
    )
  })

  test('updateConnections rejects if given invalid data array', async () => {
    const invalid: unknown = [{
      id: 'bad',
      hostname: undefined,
      credentialUsername: undefined,
      group: undefined
    }]
    await assert.rejects(
      () => updateConnections(context, invalid as ConnectionModel[]),
      /Invalid connection data array/
    )
  })
})