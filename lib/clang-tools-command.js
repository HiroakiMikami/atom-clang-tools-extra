'use babel'

let spawn = null
let Promise = null

function initialize () {
  if (!spawn) spawn = require('child_process').spawn
  if (!Promise) Promise = require('bluebird')
}

export default class ClangToolsCommand {
  constructor (command, buildPath) {
    initialize()

    this.command =
      ((typeof command) === 'function') ? command : () => command
    this.buildPath =
      ((typeof buildPath) === 'function') ? buildPath : () => buildPath
  }

  exec (clangArgs, args, file) {
    const allArgs = this.getArguments(clangArgs, args, file)

    return new Promise(resolve => {
      const command = spawn(this.command(), allArgs)

      let stdout = ''
      let stderr = ''

      command.stdout.on('data', data => stdout += data)
      command.stderr.on('data', data => stderr += data)

      command.on('close', code => {
        resolve({
          stdout: stdout,
          stderr: stderr,
          code: code
        })
      })
    })
  }
  getArguments (clangArgs, args, file) {
    const allArgs = args

    clangArgs.forEach(arg => allArgs.push('-extra-arg', arg))
    const buildPath = this.buildPath()
    if (buildPath) {
      allArgs.push('-p', buildPath)
    }
    allArgs.push(file)

    return allArgs
  }
}
