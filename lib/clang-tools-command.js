'use babel'

let linter = null

function initialize () {
  if (!linter) linter = require('atom-linter')
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
    return linter.exec(this.command(), allArgs, {stream: 'stdout', throwOnStdErr: false})
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
