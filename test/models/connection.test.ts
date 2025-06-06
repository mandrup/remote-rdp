import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { isConnectionModel, isConnectionModelArray, ConnectionModel } from '@/models/connection'

describe('isConnectionModel', () => {
  let warnSpy: ReturnType<typeof vi.spyOn>
  beforeEach(() => {
    warnSpy = vi.spyOn(console, 'warn').mockImplementation(() => {})
  })
  afterEach(() => {
    warnSpy.mockRestore()
  })

  it('returns true for a valid ConnectionModel', () => {
    const valid: ConnectionModel = {
      id: '1',
      hostname: 'host',
      group: 'g',
      credentialUsername: 'user',
      created_at: '2024-01-01',
      modified_at: '2024-01-02',
      connectionSettings: { screenModeId: 2 }
    }
    expect(isConnectionModel(valid)).toBe(true)
    expect(warnSpy).not.toHaveBeenCalled()
  })

  it('returns true for a valid ConnectionModel with minimal fields', () => {
    const valid: ConnectionModel = {
      id: '1',
      hostname: 'host',
      created_at: '2024-01-01',
    }
    expect(isConnectionModel(valid)).toBe(true)
    expect(warnSpy).not.toHaveBeenCalled()
  })

  it('returns false and warns for non-object', () => {
    expect(isConnectionModel(null)).toBe(false)
    expect(isConnectionModel(undefined)).toBe(false)
    expect(isConnectionModel(123)).toBe(false)
    expect(warnSpy).toHaveBeenCalled()
  })

  it('returns false and warns for missing required fields', () => {
    expect(isConnectionModel({})).toBe(false)
    expect(isConnectionModel({ id: '1' })).toBe(false)
    expect(isConnectionModel({ hostname: 'host', created_at: '2024-01-01' })).toBe(false)
    expect(warnSpy).toHaveBeenCalled()
  })

  it('returns false and warns for wrong types', () => {
    expect(isConnectionModel({ id: 1, hostname: 'host', created_at: '2024-01-01' })).toBe(false)
    expect(isConnectionModel({ id: '1', hostname: 2, created_at: '2024-01-01' })).toBe(false)
    expect(isConnectionModel({ id: '1', hostname: 'host', created_at: 123 })).toBe(false)
    expect(warnSpy).toHaveBeenCalled()
  })
})

describe('isConnectionModelArray', () => {
  let warnSpy: ReturnType<typeof vi.spyOn>
  beforeEach(() => {
    warnSpy = vi.spyOn(console, 'warn').mockImplementation(() => {})
  })
  afterEach(() => {
    warnSpy.mockRestore()
  })

  it('returns true for an array of valid ConnectionModels', () => {
    const arr: ConnectionModel[] = [
      { id: '1', hostname: 'h', created_at: '2024-01-01' },
      { id: '2', hostname: 'h2', created_at: '2024-01-02' }
    ]
    expect(isConnectionModelArray(arr)).toBe(true)
    expect(warnSpy).not.toHaveBeenCalled()
  })

  it('returns false and warns for non-array', () => {
    expect(isConnectionModelArray(null)).toBe(false)
    expect(isConnectionModelArray({})).toBe(false)
    expect(isConnectionModelArray('str')).toBe(false)
    expect(warnSpy).toHaveBeenCalled()
  })

  it('returns false if any element is not a valid ConnectionModel', () => {
    const arr = [
      { id: '1', hostname: 'h', created_at: '2024-01-01' },
      { id: 2, hostname: 'h2', created_at: '2024-01-02' }
    ]
    expect(isConnectionModelArray(arr)).toBe(false)
    expect(warnSpy).toHaveBeenCalled()
  })
})
