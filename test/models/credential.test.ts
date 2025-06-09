import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { isCredentialModel, isCredentialModelArray, CredentialModel } from '@/models/credential'
import { createConsoleWarnSetup } from '../test-utils'

describe('isCredentialModel', () => {
  const consoleSetup = createConsoleWarnSetup()
  
  beforeEach(consoleSetup.beforeEach)
  afterEach(consoleSetup.afterEach)

  it('returns true for a valid CredentialModel', () => {
    const valid: CredentialModel = {
      id: crypto.randomUUID(),
      username: 'user',
      password: 'pass',
      createdAt: '2024-01-01',
      modifiedAt: '2024-01-02',
    }
    expect(isCredentialModel(valid)).toBe(true)
    expect(consoleSetup.getWarnSpy()).not.toHaveBeenCalled()
  })

  it('returns true for a valid CredentialModel with minimal fields', () => {
    const valid: CredentialModel = {
      id: crypto.randomUUID(),
      username: 'user',
      password: 'pass',
      createdAt: '2024-01-01',
    }
    expect(isCredentialModel(valid)).toBe(true)
    expect(consoleSetup.getWarnSpy()).not.toHaveBeenCalled()
  })

  it('returns false and warns for non-object', () => {
    expect(isCredentialModel(null)).toBe(false)
    expect(isCredentialModel(undefined)).toBe(false)
    expect(isCredentialModel(123)).toBe(false)
    expect(consoleSetup.getWarnSpy()).toHaveBeenCalled()
  })

  it('returns false and warns for missing required fields', () => {
    expect(isCredentialModel({})).toBe(false)
    expect(isCredentialModel({ id: '1' })).toBe(false)
    expect(isCredentialModel({ username: 'user', createdAt: '2024-01-01' })).toBe(false)
    expect(consoleSetup.getWarnSpy()).toHaveBeenCalled()
  })

  it('returns false and warns for wrong types', () => {
    expect(isCredentialModel({ id: 1, username: 'user', password: 'pass', createdAt: '2024-01-01' })).toBe(false)
    expect(isCredentialModel({ id: '1', username: 2, password: 'pass', createdAt: '2024-01-01' })).toBe(false)
    expect(isCredentialModel({ id: '1', username: 'user', password: 'pass', createdAt: 123 })).toBe(false)
    expect(consoleSetup.getWarnSpy()).toHaveBeenCalled()
  })
})

describe('isCredentialModelArray', () => {
  const consoleSetup = createConsoleWarnSetup()
  
  beforeEach(consoleSetup.beforeEach)
  afterEach(consoleSetup.afterEach)

  it('returns true for an array of valid CredentialModels', () => {
    const arr: CredentialModel[] = [
      { id: crypto.randomUUID(), username: 'u', password: 'p', createdAt: '2024-01-01' },
      { id: crypto.randomUUID(), username: 'u2', password: 'p2', createdAt: '2024-01-02' }
    ]
    expect(isCredentialModelArray(arr)).toBe(true)
    expect(consoleSetup.getWarnSpy()).not.toHaveBeenCalled()
  })

  it('returns false and warns for non-array', () => {
    expect(isCredentialModelArray(null)).toBe(false)
    expect(isCredentialModelArray({})).toBe(false)
    expect(isCredentialModelArray('str')).toBe(false)
    expect(consoleSetup.getWarnSpy()).toHaveBeenCalled()
  })

  it('returns false when any element is not a valid CredentialModel', () => {
    const arr = [
      { id: crypto.randomUUID(), username: 'u', password: 'p', createdAt: '2024-01-01' },
      { id: -1, username: 'u2', password: 'p2', createdAt: '2024-01-02' }
    ]
    expect(isCredentialModelArray(arr)).toBe(false)
    expect(consoleSetup.getWarnSpy()).toHaveBeenCalled()
  })
})
