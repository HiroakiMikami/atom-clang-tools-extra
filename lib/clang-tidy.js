'use babel'

let linter = null
let Promise = null
let parse = null

function initialize () {
  if (!Promise) Promise = require('bluebird')
  if (!linter) linter = require('atom-linter')
  if (!parse) parse = require('./clang-tidy-parser')
}

export default class ClangTidy {
  constructor (clangTidyCommand, buildPath) {
    initialize()

    this.clangTidyCommand =
      ((typeof clangTidyCommand) === 'function') ? clangTidyCommand : () => clangTidyCommand
    this.buildPath =
      ((typeof buildPath) === 'function') ? buildPath : () => buildPath
  }

  check (args, file) {
    // Invoke clang-tidy
    const allArgs = []

    args.forEach(arg => allArgs.push('-extra-arg', arg))
    const buildPath = this.buildPath()
    if (buildPath) {
      allArgs.push('-p', buildPath)
    }
    allArgs.push(file)

    return linter.exec(
      this.clangTidyCommand(), allArgs, {stream: 'stdout', throwOnStdErr: false}
    ).then(
      output => new Promise(resolve => resolve(parse(output)))
    )
  }
}
