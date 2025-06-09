import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { isConnectionModel, isConnectionModelArray, ConnectionModel } from '@/models/connection'
import { createConsoleWarnSetup } from '../test-utils'

describe('isConnectionModel', () => {
  const consoleSetup = createConsoleWarnSetup()
  
  beforeEach(consoleSetup.beforeEach)
  afterEach(consoleSetup.afterEach)

  it('returns true for a valid ConnectionModel', () => {
    const valid: ConnectionModel = {
      id: '1',
      hostname: 'host',
      createdAt: '2024-01-01',
      credentialId: 'cred-1',
      group: 'group1',
      connectionSettings: undefined
    }
    expect(isConnectionModel(valid)).toBe(true)
    expect(consoleSetup.getWarnSpy()).not.toHaveBeenCalled()
  })

  it('returns true for a valid ConnectionModel with minimal fields', () => {
    const valid: ConnectionModel = {
      id: '1',
      hostname: 'host',
      createdAt: '2024-01-01',
    }
    expect(isConnectionModel(valid)).toBe(true)
    expect(consoleSetup.getWarnSpy()).not.toHaveBeenCalled()
  })

  it('returns false and warns for non-object', () => {
    expect(isConnectionModel(null)).toBe(false)
    expect(isConnectionModel(undefined)).toBe(false)
    expect(isConnectionModel(123)).toBe(false)
    expect(consoleSetup.getWarnSpy()).toHaveBeenCalled()
  })

  it('returns false and warns for missing required fields', () => {
    expect(isConnectionModel({})).toBe(false)
    expect(isConnectionModel({ id: '1' })).toBe(false)
    expect(isConnectionModel({ hostname: 'host', createdAt: '2024-01-01' })).toBe(false)
    expect(consoleSetup.getWarnSpy()).toHaveBeenCalled()
  })

  it('returns false and warns for wrong types', () => {
    expect(isConnectionModel({ id: 1, hostname: 'host', createdAt: '2024-01-01' })).toBe(false)
    expect(isConnectionModel({ id: '1', hostname: 2, createdAt: '2024-01-01' })).toBe(false)
    expect(isConnectionModel({ id: '1', hostname: 'host', createdAt: 123 })).toBe(false)
    expect(consoleSetup.getWarnSpy()).toHaveBeenCalled()
  })
})

describe('isConnectionModelArray', () => {
  const consoleSetup = createConsoleWarnSetup()
  
  beforeEach(consoleSetup.beforeEach)
  afterEach(consoleSetup.afterEach)

  it('returns true for an array of valid ConnectionModels', () => {
    const arr: ConnectionModel[] = [
      { id: '1', hostname: 'h', createdAt: '2024-01-01', credentialId: 'c1' },
      { id: '2', hostname: 'h2', createdAt: '2024-01-02', credentialId: 'c2' }
    ]
    expect(isConnectionModelArray(arr)).toBe(true)
    expect(consoleSetup.getWarnSpy()).not.toHaveBeenCalled()
  })

  it('returns false and warns for non-array', () => {
    expect(isConnectionModelArray(null)).toBe(false)
    expect(isConnectionModelArray({})).toBe(false)
    expect(isConnectionModelArray('str')).toBe(false)
    expect(consoleSetup.getWarnSpy()).toHaveBeenCalled()
  })

  it('returns false if any element is not a valid ConnectionModel', () => {
    const arr = [
      { id: '1', hostname: 'h', createdAt: '2024-01-01', credentialId: 'c1' },
      { id: -1, hostname: 'h2', createdAt: '2024-01-02', credentialId: 'c2' }
    ]
    expect(isConnectionModelArray(arr)).toBe(false)
    expect(consoleSetup.getWarnSpy()).toHaveBeenCalled()
  })
})
