import { createConnection } from '@/storage/connections/create'
import { deleteConnection } from '@/storage/connections/delete'
import { getAllConnections } from '@/storage/connections/get'
import { updateConnections, updateConnectionsCredential, clearConnectionsCredential } from '@/storage/connections/update'
import { describe, it, expect, beforeEach, vi } from 'vitest'
import { standardBeforeEach, __mockStorage, createStorageContextMock } from '../../test-utils'

describe('Connection Storage Input Validation', () => {
  const context = createStorageContextMock()
  
  beforeEach(() => {
    standardBeforeEach()
  })

  describe('createConnection validation', () => {
    it('throws when context is null/undefined', async () => {
      await expect(createConnection(null as any, 'host', 'cred')).rejects.toThrow('Extension context is required')
      await expect(createConnection(undefined as any, 'host', 'cred')).rejects.toThrow('Extension context is required')
    })

    it('throws when hostname is empty or invalid', async () => {
      __mockStorage.connection.getAll.mockReturnValue([])
      await expect(createConnection(context, '', 'cred')).rejects.toThrow('Hostname must be a non-empty string')
      await expect(createConnection(context, '   ', 'cred')).rejects.toThrow('Hostname must be a non-empty string')
      await expect(createConnection(context, null as any, 'cred')).rejects.toThrow('Hostname must be a non-empty string')
      await expect(createConnection(context, undefined as any, 'cred')).rejects.toThrow('Hostname must be a non-empty string')
      await expect(createConnection(context, 123 as any, 'cred')).rejects.toThrow('Hostname must be a non-empty string')
    })

    it('throws when credentialId is empty or invalid', async () => {
      __mockStorage.connection.getAll.mockReturnValue([])
      await expect(createConnection(context, 'host', '')).rejects.toThrow('Credential ID must be a non-empty string')
      await expect(createConnection(context, 'host', '   ')).rejects.toThrow('Credential ID must be a non-empty string')
      await expect(createConnection(context, 'host', null as any)).rejects.toThrow('Credential ID must be a non-empty string')
      await expect(createConnection(context, 'host', undefined as any)).rejects.toThrow('Credential ID must be a non-empty string')
    })

    it('throws when hostname is too long', async () => {
      __mockStorage.connection.getAll.mockReturnValue([])
      const longHostname = 'a'.repeat(256)
      await expect(createConnection(context, longHostname, 'cred')).rejects.toThrow('Hostname must be 255 characters or less')
    })

    it('throws when group is invalid', async () => {
      __mockStorage.connection.getAll.mockReturnValue([])
      const longGroup = 'a'.repeat(256)
      await expect(createConnection(context, 'host', 'cred', longGroup)).rejects.toThrow('Group must be a string of 255 characters or less')
      await expect(createConnection(context, 'host', 'cred', 123 as any)).rejects.toThrow('Group must be a string of 255 characters or less')
    })
  })

  describe('deleteConnection validation', () => {
    it('throws when context is null/undefined', async () => {
      await expect(deleteConnection(null as any, 'id')).rejects.toThrow('Extension context is required')
      await expect(deleteConnection(undefined as any, 'id')).rejects.toThrow('Extension context is required')
    })

    it('throws when id is empty or invalid', async () => {
      await expect(deleteConnection(context, '')).rejects.toThrow('Connection ID must be a non-empty string')
      await expect(deleteConnection(context, '   ')).rejects.toThrow('Connection ID must be a non-empty string')
      await expect(deleteConnection(context, null as any)).rejects.toThrow('Connection ID must be a non-empty string')
      await expect(deleteConnection(context, undefined as any)).rejects.toThrow('Connection ID must be a non-empty string')
    })
  })

  describe('getAllConnections validation', () => {
    it('throws when context is null/undefined', () => {
      expect(() => getAllConnections(null as any)).toThrow('Extension context is required')
      expect(() => getAllConnections(undefined as any)).toThrow('Extension context is required')
    })
  })

  describe('updateConnections validation', () => {
    it('throws when context is null/undefined', async () => {
      await expect(updateConnections(null as any, [])).rejects.toThrow('Extension context is required')
      await expect(updateConnections(undefined as any, [])).rejects.toThrow('Extension context is required')
    })

    it('throws when connections is not an array', async () => {
      await expect(updateConnections(context, 'not-array' as any)).rejects.toThrow('Connections must be an array')
      await expect(updateConnections(context, 123 as any)).rejects.toThrow('Connections must be an array')
      await expect(updateConnections(context, null as any)).rejects.toThrow('Connections must be an array')
      await expect(updateConnections(context, undefined as any)).rejects.toThrow('Connections must be an array')
    })
  })

  describe('updateConnectionsCredential validation', () => {
    it('throws when context is null/undefined', async () => {
      await expect(updateConnectionsCredential(null as any, 'old', 'new')).rejects.toThrow('Extension context is required')
      await expect(updateConnectionsCredential(undefined as any, 'old', 'new')).rejects.toThrow('Extension context is required')
    })

    it('throws when oldCredentialId is empty or invalid', async () => {
      __mockStorage.connection.getAll.mockReturnValue([])
      await expect(updateConnectionsCredential(context, '', 'new')).rejects.toThrow('Old credential ID must be a non-empty string')
      await expect(updateConnectionsCredential(context, '   ', 'new')).rejects.toThrow('Old credential ID must be a non-empty string')
      await expect(updateConnectionsCredential(context, null as any, 'new')).rejects.toThrow('Old credential ID must be a non-empty string')
      await expect(updateConnectionsCredential(context, undefined as any, 'new')).rejects.toThrow('Old credential ID must be a non-empty string')
    })

    it('throws when newCredentialId is empty or invalid', async () => {
      __mockStorage.connection.getAll.mockReturnValue([])
      await expect(updateConnectionsCredential(context, 'old', '')).rejects.toThrow('New credential ID must be a non-empty string')
      await expect(updateConnectionsCredential(context, 'old', '   ')).rejects.toThrow('New credential ID must be a non-empty string')
      await expect(updateConnectionsCredential(context, 'old', null as any)).rejects.toThrow('New credential ID must be a non-empty string')
      await expect(updateConnectionsCredential(context, 'old', undefined as any)).rejects.toThrow('New credential ID must be a non-empty string')
    })
  })

  describe('clearConnectionsCredential validation', () => {
    it('throws when context is null/undefined', async () => {
      await expect(clearConnectionsCredential(null as any, 'cred')).rejects.toThrow('Extension context is required')
      await expect(clearConnectionsCredential(undefined as any, 'cred')).rejects.toThrow('Extension context is required')
    })

    it('throws when credentialId is empty or invalid', async () => {
      __mockStorage.connection.getAll.mockReturnValue([])
      await expect(clearConnectionsCredential(context, '')).rejects.toThrow('Credential ID must be a non-empty string')
      await expect(clearConnectionsCredential(context, '   ')).rejects.toThrow('Credential ID must be a non-empty string')
      await expect(clearConnectionsCredential(context, null as any)).rejects.toThrow('Credential ID must be a non-empty string')
      await expect(clearConnectionsCredential(context, undefined as any)).rejects.toThrow('Credential ID must be a non-empty string')
    })
  })
})
