import { describe, it, expect } from 'vitest'
import { PREFIXES, COMMAND_IDS, MESSAGES, MIME_TYPES } from '@/constants'

describe('constants', () => {
  it('PREFIXES are correct', () => {
    expect(PREFIXES.connection).toBe('remote-rdp:connection')
    expect(PREFIXES.credential).toBe('remote-rdp:credential')
  })

  it('COMMAND_IDS are correct', () => {
    expect(COMMAND_IDS.connection.create).toBe('remote-rdp:connection:create')
    expect(COMMAND_IDS.connection.delete).toBe('remote-rdp:connection:delete')
    expect(COMMAND_IDS.connection.update).toBe('remote-rdp:connection:update')
    expect(COMMAND_IDS.connection.updateGroup).toBe('remote-rdp:connection:update-group')
    expect(COMMAND_IDS.connection.connect).toBe('remote-rdp:connection:connect')
    expect(COMMAND_IDS.connection.refresh).toBe('remote-rdp:connection:refresh')
    expect(COMMAND_IDS.connection.import).toBe('remote-rdp:connection:import')
    expect(COMMAND_IDS.connection.export).toBe('remote-rdp:connection:export')
    expect(COMMAND_IDS.credential.create).toBe('remote-rdp:credential:create')
    expect(COMMAND_IDS.credential.delete).toBe('remote-rdp:credential:delete')
    expect(COMMAND_IDS.credential.update).toBe('remote-rdp:credential:update')
    expect(COMMAND_IDS.credential.refresh).toBe('remote-rdp:credential:refresh')
  })

  it('MESSAGES.connection.created returns correct string', () => {
    expect(MESSAGES.connection.created('host')).toBe('Connection "host" created successfully.')
    expect(MESSAGES.connection.created('host', 'group')).toBe('Connection "host" created successfully. Group: group')
  })

  it('MESSAGES.connection.updated returns correct string', () => {
    expect(MESSAGES.connection.updated('host')).toBe('Connection "host" updated successfully.')
    expect(MESSAGES.connection.updated('host', 'group')).toBe('Connection "host" updated successfully. Group: group')
  })

  it('MESSAGES.connection.deleted returns correct string', () => {
    expect(MESSAGES.connection.deleted('host')).toBe('Connection "host" deleted successfully.')
  })

  it('MESSAGES.credential.created/updated/deleted return correct strings', () => {
    expect(MESSAGES.credential.created('user')).toBe('Credential "user" created successfully.')
    expect(MESSAGES.credential.updated('user')).toBe('Credential "user" updated successfully.')
    expect(MESSAGES.credential.deleted('user')).toBe('Credential "user" deleted successfully.')
  })

  it('MESSAGES.operationFailed returns correct string', () => {
    expect(MESSAGES.operationFailed('foo', new Error('fail'))).toBe('Failed to foo: fail')
    expect(MESSAGES.operationFailed('foo', 'bar')).toBe('Failed to foo: bar')
  })

  it('MIME_TYPES.connection is correct', () => {
    expect(MIME_TYPES.connection).toBe('application/vnd.code.tree.remoteRdpConnections')
  })
})
