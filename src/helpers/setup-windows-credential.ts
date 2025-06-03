import { exec } from 'child_process'

export function setupWindowsCredential(
  hostname: string,
  username: string,
  password: string,
  execFn: typeof exec = exec
): Promise<void> {
  return new Promise((resolve, reject) => {
    const deleteCmd = `cmdkey /delete:"${hostname}"`
    execFn(deleteCmd, () => {
      const addCmd = `cmdkey /generic:"${hostname}" /user:"${username}" /pass:"${password}"`
      execFn(addCmd, (addError) => {
        if (addError) {
          reject(addError)
        } else {
          resolve()
        }
      })
    })
  })
}
