import * as assert from 'assert'
import { PREFIXES } from '../../../constants'
import { ConnectionModel } from '../../../models/connection'

import * as connectionModel from '../../../models/connection'
import readConnections from '../../../storage/connections/read'

suite('Storage:Connections:Read', () => {
  let mockContext: any

  setup(() => {
    mockContext = {
      globalState: {
        get: (_key: string, _default: any) => []
      }
    }
  })

  test('returns stored connections when valid', () => {
    const validConnections: ConnectionModel[] = [
      { id: '1', hostname: 'example.com', credentialUsername: 'user1', group: 'dev' }
    ]

    mockContext.globalState.get = (key: string, def: any) => {
      assert.strictEqual(key, PREFIXES.connection)
      return validConnections
    }

    const original = connectionModel.isConnectionModelArray

    const result = readConnections(mockContext)
    assert.deepStrictEqual(result, validConnections)
  })

  test('throws error if stored data is invalid', () => {
    mockContext.globalState.get = () => [{ invalid: true }]
    assert.throws(() => readConnections(mockContext), /Invalid connection data in storage/)
  })

  test('returns empty array if nothing is stored', () => {
    mockContext.globalState.get = () => []

    const original = connectionModel.isConnectionModelArray

    const result = readConnections(mockContext)
    assert.deepStrictEqual(result, [])
  })
})