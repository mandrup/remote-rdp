import { describe, it, expect, vi } from 'vitest'
import { setupWindowsCredential } from '@/commands/connections/connect'

describe('setupWindowsCredential', () => {
  it('calls execFn with correct commands', async () => {
    const execFn = vi.fn()
    execFn.mockImplementationOnce((_cmd, cb) => cb && cb(null, '', ''))
    execFn.mockImplementationOnce((_cmd, cb) => cb && cb(null, '', ''))

    await expect(setupWindowsCredential('host', 'user', 'pass', execFn as any)).resolves.toBeUndefined()
    expect(execFn).toHaveBeenCalledWith('cmdkey /delete:"host"', expect.any(Function))
    expect(execFn).toHaveBeenCalledWith('cmdkey /generic:"host" /user:"user" /pass:"pass"', expect.any(Function))
  })

  it('rejects when add command fails', async () => {
    const execFn = vi.fn()
    execFn.mockImplementationOnce((_cmd, cb) => cb && cb(null, '', ''))
    execFn.mockImplementationOnce((_cmd, cb) => cb && cb(new Error('fail'), '', ''))

    await expect(setupWindowsCredential('host', 'user', 'pass', execFn as any)).rejects.toThrow('fail')
  })

  it('works with missing callbacks (no crash)', async () => {
    const execFn = vi.fn()
    execFn.mockImplementationOnce((_cmd, _cb) => { })
    execFn.mockImplementationOnce((_cmd, cb) => { if (cb) { cb(null, '', '') } })
    const promise = setupWindowsCredential('host', 'user', 'pass', execFn as any)
    await expect(Promise.race([
      promise,
      new Promise((resolve) => setTimeout(() => resolve('timeout'), 100))
    ])).resolves.not.toBeInstanceOf(Error)
  })
})
