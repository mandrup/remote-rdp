import * as path from 'path'
import Mocha from 'mocha'
import { glob } from 'glob'
//import { registerCommands } from '../../commands'
//import { createMockContext } from '../utils'

export function run(): Promise<void> {
  // Create a shared context for all tests
  //const context = createMockContext()
  
  // Register commands once for all tests
 //registerCommands(context)

  // Create the mocha test
  const mocha = new Mocha({
    ui: 'tdd',
    color: true
  })

  const testsRoot = path.resolve(__dirname, '..')

  return new Promise((resolve, reject) => {
    glob('**/**.test.js', { cwd: testsRoot })
      .then((files: string[]) => {
        // Add files to the test suite
        files.forEach((f: string) => mocha.addFile(path.resolve(testsRoot, f)))

        try {
          // Run the mocha test
          mocha.run((failures: number) => {
            if (failures > 0) {
              reject(new Error(`${failures} tests failed.`))
            } else {
              resolve()
            }
          })
        } catch (err) {
          reject(err)
        }
      })
      .catch((err: Error) => {
        reject(err)
      })
  })
} 