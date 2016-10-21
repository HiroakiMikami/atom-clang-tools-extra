'use babel'

let linter = null
let Promise = null
let Parser = null
let os = null
let fs = null
let path = null

function initialize () {
  if (!Promise) Promise = require('bluebird')
  if (!linter) linter = require('atom-linter')
  if (!Parser) Parser = require('./clang-tidy-parser')
  if (!os) os = require('os')
  if (!fs) fs = require('fs')
  if (!path) path = require('path')
}

function generateTemporaryFile () {
  const dir = os.tmpdir()
  const name = `atom-clang-tools-extra-${new Date()}`

  return path.join(dir, name)
}

export default class ClangTidy {
  constructor (clangTidyCommand, buildPath) {
    initialize()

    this.clangTidyCommand =
      ((typeof clangTidyCommand) === 'function') ? clangTidyCommand : () => clangTidyCommand
    this.buildPath =
      ((typeof buildPath) === 'function') ? buildPath : () => buildPath
  }

  getArguments (extraArgs, file) {
    const allArgs = []

    extraArgs.forEach(arg => allArgs.push('-extra-arg', arg))
    const buildPath = this.buildPath()
    if (buildPath) {
      allArgs.push('-p', buildPath)
    }
    allArgs.push(file)

    return allArgs
  }

  applyAllFixes (extraArgs, file) {
    // Invoke clang-tidy
    const allArgs = this.getArguments(extraArgs, file)

    allArgs.unshift('-fix-errors')

    return linter.exec(this.clangTidyCommand(), allArgs, {stream: 'stdout', throwOnStdErr: false})
  }

  check (extraArgs, file) {
    // Invoke clang-tidy
    const allArgs = this.getArguments(extraArgs, file)
    const tmpFile = generateTemporaryFile()

    allArgs.unshift('-export-fixes', tmpFile)

    return linter.exec(
      this.clangTidyCommand(), allArgs, {stream: 'stdout', throwOnStdErr: false}
    ).then(output => {
      return new Promise((resolve, reject) => {
        fs.readFile(tmpFile, 'utf8', (err, data) => {
          let fixes = []
          if (err) {
            if (err.code !== 'ENOENT') {
              reject(err)
            }
          }
          if (data) {
            fixes = Parser.parseFixes(data)
          }
          const result = Parser.parseOutput(output)
          result.forEach(elem => {
            if (elem.hasFix && fixes.length !== 0) {
              const fix = fixes.shift()
              elem.fixes = [fix]
            } else {
              elem.fixes = []
            }
          })
          resolve(result)
        })
      })
    }).then(
      output => new Promise((resolve, reject) => {
        fs.unlink(tmpFile, () => resolve(output))
      }),
      reason => new Promise((resolve, reject) => {
        fs.unlink(tmpFile, () => resolve(reason))
      })
    )
  }
}
