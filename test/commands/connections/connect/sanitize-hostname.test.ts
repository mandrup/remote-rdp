import { describe, it, expect } from 'vitest'
import { sanitizeHostnameForFilename } from '@/commands/connections/connect'

describe('sanitizeHostnameForFilename', () => {
  it('replaces invalid Windows filename characters', () => {
    const result = sanitizeHostnameForFilename('server<>:"/\\|?*test')
    expect(result).toBe('server_________test')
  })

  it('replaces dots with dashes', () => {
    const result = sanitizeHostnameForFilename('server.example.com')
    expect(result).toBe('server-example-com')
  })

  it('handles IPv6 addresses', () => {
    const result = sanitizeHostnameForFilename('[2001:db8::1]')
    expect(result).toBe('[2001_db8__1]')
  })

  it('handles hostname with port', () => {
    const result = sanitizeHostnameForFilename('server.example.com:3389')
    expect(result).toBe('server-example-com_3389')
  })

  it('limits length to 50 characters', () => {
    const longHostname = 'very-long-hostname-that-exceeds-fifty-characters-limit.example.com'
    const result = sanitizeHostnameForFilename(longHostname)
    expect(result.length).toBe(50)
    expect(result).toBe('very-long-hostname-that-exceeds-fifty-characters-l')
  })

  it('handles normal hostnames without changes', () => {
    const result = sanitizeHostnameForFilename('server001')
    expect(result).toBe('server001')
  })

  it('handles mixed invalid characters', () => {
    const result = sanitizeHostnameForFilename('server\\path/file"name<test>')
    expect(result).toBe('server_path_file_name_test_')
  })
})
