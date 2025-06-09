import { createCredential } from '@/storage/credentials/create'
import { updateCredential } from '@/storage/credentials/update'
import { deleteCredential } from '@/storage/credentials/delete'
import { getAllCredentials, getCredentialById, getCredentialWithPasswordById, getAllCredentialUsernames } from '@/storage/credentials/get'
import { describe, it, expect, beforeEach, vi } from 'vitest'
import { standardBeforeEach, __mockStorage, createStorageContextMock } from '../../test-utils'

describe('Credential Storage Input Validation', () => {
  const context = createStorageContextMock()
  
  beforeEach(() => {
    standardBeforeEach()
  })

  describe('createCredential validation', () => {
    it('throws when context is null/undefined', async () => {
      await expect(createCredential(null as any, 'user', 'pass')).rejects.toThrow('Extension context is required')
      await expect(createCredential(undefined as any, 'user', 'pass')).rejects.toThrow('Extension context is required')
    })

    it('throws when username is empty or invalid', async () => {
      __mockStorage.credential.getAll.mockResolvedValue([])
      await expect(createCredential(context, '', 'pass')).rejects.toThrow('Username must be a non-empty string')
      await expect(createCredential(context, '   ', 'pass')).rejects.toThrow('Username must be a non-empty string')
      await expect(createCredential(context, null as any, 'pass')).rejects.toThrow('Username must be a non-empty string')
      await expect(createCredential(context, undefined as any, 'pass')).rejects.toThrow('Username must be a non-empty string')
      await expect(createCredential(context, 123 as any, 'pass')).rejects.toThrow('Username must be a non-empty string')
    })

    it('throws when password is empty or invalid', async () => {
      __mockStorage.credential.getAll.mockResolvedValue([])
      await expect(createCredential(context, 'user', '')).rejects.toThrow('Password must be a non-empty string')
      await expect(createCredential(context, 'user', '   ')).rejects.toThrow('Password must be a non-empty string')
      await expect(createCredential(context, 'user', null as any)).rejects.toThrow('Password must be a non-empty string')
      await expect(createCredential(context, 'user', undefined as any)).rejects.toThrow('Password must be a non-empty string')
      await expect(createCredential(context, 'user', 123 as any)).rejects.toThrow('Password must be a non-empty string')
    })

    it('throws when username is too long', async () => {
      __mockStorage.credential.getAll.mockResolvedValue([])
      const longUsername = 'a'.repeat(256)
      await expect(createCredential(context, longUsername, 'pass')).rejects.toThrow('Username must be 255 characters or less')
    })

    it('throws when password is too long', async () => {
      __mockStorage.credential.getAll.mockResolvedValue([])
      const longPassword = 'a'.repeat(1001)
      await expect(createCredential(context, 'user', longPassword)).rejects.toThrow('Password must be 1000 characters or less')
    })
  })

  describe('updateCredential validation', () => {
    it('throws when context is null/undefined', async () => {
      await expect(updateCredential(null as any, 'id', 'user', 'pass')).rejects.toThrow('Extension context is required')
      await expect(updateCredential(undefined as any, 'id', 'user', 'pass')).rejects.toThrow('Extension context is required')
    })

    it('throws when id is empty or invalid', async () => {
      __mockStorage.credential.getAll.mockResolvedValue([])
      await expect(updateCredential(context, '', 'user', 'pass')).rejects.toThrow('Credential ID must be a non-empty string')
      await expect(updateCredential(context, '   ', 'user', 'pass')).rejects.toThrow('Credential ID must be a non-empty string')
      await expect(updateCredential(context, null as any, 'user', 'pass')).rejects.toThrow('Credential ID must be a non-empty string')
      await expect(updateCredential(context, undefined as any, 'user', 'pass')).rejects.toThrow('Credential ID must be a non-empty string')
    })

    it('throws when username is empty or invalid', async () => {
      __mockStorage.credential.getAll.mockResolvedValue([{ id: 'test-id', username: 'user', password: 'pass', createdAt: 'date' }])
      await expect(updateCredential(context, 'test-id', '', 'pass')).rejects.toThrow('Username must be a non-empty string')
      await expect(updateCredential(context, 'test-id', '   ', 'pass')).rejects.toThrow('Username must be a non-empty string')
    })

    it('throws when password is empty or invalid', async () => {
      __mockStorage.credential.getAll.mockResolvedValue([{ id: 'test-id', username: 'user', password: 'pass', createdAt: 'date' }])
      await expect(updateCredential(context, 'test-id', 'user', '')).rejects.toThrow('Password must be a non-empty string')
      await expect(updateCredential(context, 'test-id', 'user', '   ')).rejects.toThrow('Password must be a non-empty string')
    })
  })

  describe('deleteCredential validation', () => {
    it('throws when context is null/undefined', async () => {
      await expect(deleteCredential(null as any, 'id')).rejects.toThrow('Extension context is required')
      await expect(deleteCredential(undefined as any, 'id')).rejects.toThrow('Extension context is required')
    })

    it('throws when id is empty or invalid', async () => {
      await expect(deleteCredential(context, '')).rejects.toThrow('Credential ID must be a non-empty string')
      await expect(deleteCredential(context, '   ')).rejects.toThrow('Credential ID must be a non-empty string')
      await expect(deleteCredential(context, null as any)).rejects.toThrow('Credential ID must be a non-empty string')
      await expect(deleteCredential(context, undefined as any)).rejects.toThrow('Credential ID must be a non-empty string')
    })
  })

  describe('getAllCredentials validation', () => {
    it('throws when context is null/undefined', async () => {
      await expect(getAllCredentials(null as any)).rejects.toThrow('Extension context is required')
      await expect(getAllCredentials(undefined as any)).rejects.toThrow('Extension context is required')
    })
  })

  describe('getCredentialById validation', () => {
    it('throws when context is null/undefined', async () => {
      await expect(getCredentialById(null as any, 'id')).rejects.toThrow('Extension context is required')
      await expect(getCredentialById(undefined as any, 'id')).rejects.toThrow('Extension context is required')
    })

    it('throws when id is empty or invalid', async () => {
      await expect(getCredentialById(context, '')).rejects.toThrow('Credential ID must be a non-empty string')
      await expect(getCredentialById(context, '   ')).rejects.toThrow('Credential ID must be a non-empty string')
      await expect(getCredentialById(context, null as any)).rejects.toThrow('Credential ID must be a non-empty string')
      await expect(getCredentialById(context, undefined as any)).rejects.toThrow('Credential ID must be a non-empty string')
    })
  })

  describe('getCredentialWithPasswordById validation', () => {
    it('throws when context is null/undefined', async () => {
      await expect(getCredentialWithPasswordById(null as any, 'id')).rejects.toThrow('Extension context is required')
      await expect(getCredentialWithPasswordById(undefined as any, 'id')).rejects.toThrow('Extension context is required')
    })

    it('throws when id is empty or invalid', async () => {
      await expect(getCredentialWithPasswordById(context, '')).rejects.toThrow('Credential ID must be a non-empty string')
      await expect(getCredentialWithPasswordById(context, '   ')).rejects.toThrow('Credential ID must be a non-empty string')
      await expect(getCredentialWithPasswordById(context, null as any)).rejects.toThrow('Credential ID must be a non-empty string')
      await expect(getCredentialWithPasswordById(context, undefined as any)).rejects.toThrow('Credential ID must be a non-empty string')
    })
  })

  describe('getAllCredentialUsernames validation', () => {
    it('throws when context is null/undefined', async () => {
      await expect(getAllCredentialUsernames(null as any)).rejects.toThrow('Extension context is required')
      await expect(getAllCredentialUsernames(undefined as any)).rejects.toThrow('Extension context is required')
    })
  })
})
