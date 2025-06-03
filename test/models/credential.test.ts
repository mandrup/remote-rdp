import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { isCredentialModel, isCredentialModelArray, CredentialModel } from '../../src/models/credential'

describe('isCredentialModel', () => {
  let warnSpy: ReturnType<typeof vi.spyOn>
  beforeEach(() => {
    warnSpy = vi.spyOn(console, 'warn').mockImplementation(() => {})
  })
  afterEach(() => {
    warnSpy.mockRestore()
  })

  it('returns true for a valid CredentialModel', () => {
    const valid: CredentialModel = {
      id: '1',
      username: 'user',
      password: 'pass',
      created_at: '2024-01-01',
      modified_at: '2024-01-02',
    }
    expect(isCredentialModel(valid)).toBe(true)
    expect(warnSpy).not.toHaveBeenCalled()
  })

  it('returns true for a valid CredentialModel with minimal fields', () => {
    const valid: CredentialModel = {
      id: '1',
      username: 'user',
      password: 'pass',
      created_at: '2024-01-01',
    }
    expect(isCredentialModel(valid)).toBe(true)
    expect(warnSpy).not.toHaveBeenCalled()
  })

  it('returns false and warns for non-object', () => {
    expect(isCredentialModel(null)).toBe(false)
    expect(isCredentialModel(undefined)).toBe(false)
    expect(isCredentialModel(123)).toBe(false)
    expect(warnSpy).toHaveBeenCalled()
  })

  it('returns false and warns for missing required fields', () => {
    expect(isCredentialModel({})).toBe(false)
    expect(isCredentialModel({ id: '1' })).toBe(false)
    expect(isCredentialModel({ username: 'user', created_at: '2024-01-01' })).toBe(false)
    expect(warnSpy).toHaveBeenCalled()
  })

  it('returns false and warns for wrong types', () => {
    expect(isCredentialModel({ id: 1, username: 'user', password: 'pass', created_at: '2024-01-01' })).toBe(false)
    expect(isCredentialModel({ id: '1', username: 2, password: 'pass', created_at: '2024-01-01' })).toBe(false)
    expect(isCredentialModel({ id: '1', username: 'user', password: 'pass', created_at: 123 })).toBe(false)
    expect(warnSpy).toHaveBeenCalled()
  })
})

describe('isCredentialModelArray', () => {
  let warnSpy: ReturnType<typeof vi.spyOn>
  beforeEach(() => {
    warnSpy = vi.spyOn(console, 'warn').mockImplementation(() => {})
  })
  afterEach(() => {
    warnSpy.mockRestore()
  })

  it('returns true for an array of valid CredentialModels', () => {
    const arr: CredentialModel[] = [
      { id: '1', username: 'u', password: 'p', created_at: '2024-01-01' },
      { id: '2', username: 'u2', password: 'p2', created_at: '2024-01-02' }
    ]
    expect(isCredentialModelArray(arr)).toBe(true)
    expect(warnSpy).not.toHaveBeenCalled()
  })

  it('returns false and warns for non-array', () => {
    expect(isCredentialModelArray(null)).toBe(false)
    expect(isCredentialModelArray({})).toBe(false)
    expect(isCredentialModelArray('str')).toBe(false)
    expect(warnSpy).toHaveBeenCalled()
  })

  it('returns false if any element is not a valid CredentialModel', () => {
    const arr = [
      { id: '1', username: 'u', password: 'p', created_at: '2024-01-01' },
      { id: 2, username: 'u2', password: 'p2', created_at: '2024-01-02' }
    ]
    expect(isCredentialModelArray(arr)).toBe(false)
    expect(warnSpy).toHaveBeenCalled()
  })
})
