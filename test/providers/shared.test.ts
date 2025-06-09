import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { formatRelativeTime, formatCredentialTooltip, formatConnectionTooltip } from '../../src/providers/shared'
import type { CredentialModel } from '../../src/models/credential'
import type { ConnectionModel } from '../../src/models/connection'

describe('formatRelativeTime', () => {
    const mockNow = new Date('2023-12-15T10:00:00Z')
    
    beforeEach(() => {
        vi.useFakeTimers()
        vi.setSystemTime(mockNow)
    })

    afterEach(() => {
        vi.useRealTimers()
    })

    it('returns "today" for dates less than 1 day ago', () => {
        const date = new Date('2023-12-15T08:00:00Z') // 2 hours ago
        expect(formatRelativeTime(date)).toBe('today')
    })

    it('returns "today" for dates created today', () => {
        const date = new Date('2023-12-15T09:30:00Z') // 30 minutes ago
        expect(formatRelativeTime(date)).toBe('today')
    })

    it('returns "yesterday" for dates 1 day ago', () => {
        const date = new Date('2023-12-14T10:00:00Z') // exactly 1 day ago
        expect(formatRelativeTime(date)).toBe('yesterday')
    })

    it('returns "2 days ago" for dates 2 days ago', () => {
        const date = new Date('2023-12-13T10:00:00Z') // 2 days ago
        expect(formatRelativeTime(date)).toBe('2 days ago')
    })

    it('returns "5 days ago" for dates 5 days ago', () => {
        const date = new Date('2023-12-10T10:00:00Z') // 5 days ago
        expect(formatRelativeTime(date)).toBe('5 days ago')
    })

    it('returns "last week" for dates about 1 week ago', () => {
        const date = new Date('2023-12-08T10:00:00Z') // 7 days ago
        expect(formatRelativeTime(date)).toBe('last week')
    })

    it('returns "2 weeks ago" for dates about 2 weeks ago', () => {
        const date = new Date('2023-12-01T10:00:00Z') // 14 days ago
        expect(formatRelativeTime(date)).toBe('2 weeks ago')
    })

    it('returns "last month" for dates about 1 month ago', () => {
        const date = new Date('2023-11-15T10:00:00Z') // 30 days ago
        expect(formatRelativeTime(date)).toBe('last month')
    })

    it('returns "2 months ago" for dates about 2 months ago', () => {
        const date = new Date('2023-10-15T10:00:00Z') // 61 days ago
        expect(formatRelativeTime(date)).toBe('2 months ago')
    })

    it('returns "last year" for dates about 1 year ago', () => {
        const date = new Date('2022-12-15T10:00:00Z') // 365 days ago
        expect(formatRelativeTime(date)).toBe('last year')
    })

    it('returns "2 years ago" for dates about 2 years ago', () => {
        const date = new Date('2021-12-15T10:00:00Z') // 730 days ago
        expect(formatRelativeTime(date)).toBe('2 years ago')
    })

    it('handles string dates correctly', () => {
        const dateString = '2023-12-14T10:00:00Z' // 1 day ago
        expect(formatRelativeTime(dateString)).toBe('yesterday')
    })

    it('handles ISO date strings correctly', () => {
        const dateString = '2023-12-13T10:00:00.000Z' // 2 days ago
        expect(formatRelativeTime(dateString)).toBe('2 days ago')
    })
})

describe('formatCredentialTooltip', () => {
    const mockNow = new Date('2023-12-15T10:00:00Z')
    
    beforeEach(() => {
        vi.useFakeTimers()
        vi.setSystemTime(mockNow)
    })

    afterEach(() => {
        vi.useRealTimers()
    })

    it('formats credential tooltip with relative times', () => {
        const credential: CredentialModel = {
            id: 'test-1',
            username: 'testuser',
            password: 'test-password',
            createdAt: '2023-12-10T10:00:00Z', // 5 days ago
            modifiedAt: '2023-12-14T10:00:00Z'  // 1 day ago (yesterday)
        }

        const result = formatCredentialTooltip(credential)
        
        expect(result).toBe([
            'Username: testuser',
            'Created: 5 days ago',
            'Modified: yesterday'
        ].join('\n'))
    })

    it('handles missing createdAt and modifiedAt', () => {
        const credential: CredentialModel = {
            id: 'test-1',
            username: 'testuser',
            password: 'test-password'
        }

        const result = formatCredentialTooltip(credential)
        
        expect(result).toBe([
            'Username: testuser',
            'Created: N/A',
            'Modified: N/A'
        ].join('\n'))
    })

    it('handles only createdAt present', () => {
        const credential: CredentialModel = {
            id: 'test-1',
            username: 'testuser',
            password: 'test-password',
            createdAt: '2023-12-15T08:00:00Z' // 2 hours ago (today)
        }

        const result = formatCredentialTooltip(credential)
        
        expect(result).toBe([
            'Username: testuser',
            'Created: today',
            'Modified: N/A'
        ].join('\n'))
    })

    it('handles only modifiedAt present', () => {
        const credential: CredentialModel = {
            id: 'test-1',
            username: 'testuser',
            password: 'test-password',
            modifiedAt: '2023-12-13T10:00:00Z' // 2 days ago
        }

        const result = formatCredentialTooltip(credential)
        
        expect(result).toBe([
            'Username: testuser',
            'Created: N/A',
            'Modified: 2 days ago'
        ].join('\n'))
    })

    it('handles username with special characters', () => {
        const credential: CredentialModel = {
            id: 'test-1',
            username: 'user@domain.com',
            password: 'test-password',
            createdAt: '2023-12-15T09:00:00Z' // 1 hour ago (today)
        }

        const result = formatCredentialTooltip(credential)
        
        expect(result).toBe([
            'Username: user@domain.com',
            'Created: today',
            'Modified: N/A'
        ].join('\n'))
    })
})

describe('formatConnectionTooltip', () => {
    it('creates simple tooltip with hostname only', () => {
        const connection: ConnectionModel = {
            id: '1',
            hostname: 'server.example.com',
            createdAt: '2023-12-15T09:00:00Z'
        }
        
        const result = formatConnectionTooltip(connection, 'No credential assigned')
        expect(result).toBe([
            'Group: Ungrouped',
            'Host: server.example.com',
            'Credential: None'
        ].join('\n'))
    })
    
    it('includes group when present', () => {
        const connection: ConnectionModel = {
            id: '1',
            hostname: 'server.example.com',
            group: 'Production',
            createdAt: '2023-12-15T09:00:00Z'
        }
        
        const result = formatConnectionTooltip(connection, 'No credential assigned')
        expect(result).toBe([
            'Group: Production',
            'Host: server.example.com',
            'Credential: None'
        ].join('\n'))
    })
    
    it('includes credential username when assigned', () => {
        const connection: ConnectionModel = {
            id: '1',
            hostname: 'server.example.com',
            createdAt: '2023-12-15T09:00:00Z'
        }
        
        const result = formatConnectionTooltip(connection, 'admin')
        expect(result).toBe([
            'Group: Ungrouped',
            'Host: server.example.com',
            'Credential: admin'
        ].join('\n'))
    })
    
    it('includes both group and credential when present', () => {
        const connection: ConnectionModel = {
            id: '1',
            hostname: 'server.example.com',
            group: 'Production',
            createdAt: '2023-12-15T09:00:00Z'
        }
        
        const result = formatConnectionTooltip(connection, 'admin')
        expect(result).toBe([
            'Group: Production',
            'Host: server.example.com',
            'Credential: admin'
        ].join('\n'))
    })
    
    it('trims whitespace from group', () => {
        const connection: ConnectionModel = {
            id: '1',
            hostname: 'server.example.com',
            group: '  Production  ',
            createdAt: '2023-12-15T09:00:00Z'
        }
        
        const result = formatConnectionTooltip(connection, 'No credential assigned')
        expect(result).toBe([
            'Group: Production',
            'Host: server.example.com',
            'Credential: None'
        ].join('\n'))
    })
    
    it('ignores empty group', () => {
        const connection: ConnectionModel = {
            id: '1',
            hostname: 'server.example.com',
            group: '  ',
            createdAt: '2023-12-15T09:00:00Z'
        }
        
        const result = formatConnectionTooltip(connection, 'No credential assigned')
        expect(result).toBe([
            'Group: Ungrouped',
            'Host: server.example.com',
            'Credential: None'
        ].join('\n'))
    })
})
