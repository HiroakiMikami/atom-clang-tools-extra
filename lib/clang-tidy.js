'use babel'

let linter = null
let Promise = null
let parse = null
let os = null
let fs = null
let path = null

function initialize () {
  if (!Promise) Promise = require('bluebird')
  if (!linter) linter = require('atom-linter')
  if (!parse) parse = require('./clang-tidy-parser')
  if (!os) os = require('os')
  if (!fs) fs = require('fs')
  if (!path) path = require('path')
}

function generateTemporaryFile () {
  const dir = os.tmpdir()
  const name = Math.random() + ''

  const tmpFile = path.join(dir, name)

  return new Promise((resolve, reject) => {
    fs.open(tmpFile, 'wx', (err) => {
      if (err) {
        generateTemporaryFile().then(file => resolve(file))
      } else {
        resolve(tmpFile)
      }
    })
  })
}

export default class ClangTidy {
  constructor (clangTidyCommand, buildPath) {
    initialize()

    this.clangTidyCommand =
      ((typeof clangTidyCommand) === 'function') ? clangTidyCommand : () => clangTidyCommand
    this.buildPath =
      ((typeof buildPath) === 'function') ? buildPath : () => buildPath
  }

  getArgs (args, file) {
    const allArgs = []

    args.forEach(arg => allArgs.push('-extra-arg', arg))
    const buildPath = this.buildPath()
    if (buildPath) {
      allArgs.push('-p', buildPath)
    }
    allArgs.push(file)

    return allArgs
  }

  applyAllFixes (args, file) {
    // Invoke clang-tidy
    const allArgs = this.getArgs(args, file)

    return generateTemporaryFile().then(tmpFile => {
      allArgs.push('-fix-errors')

      return linter.exec(this.clangTidyCommand(), allArgs, {stream: 'stdout', throwOnStdErr: false})
    })
  }

  check (args, file) {
    // Invoke clang-tidy
    const allArgs = this.getArgs(args, file)

    return generateTemporaryFile().then(tmpFile => {
      allArgs.unshift('-export-fixes', tmpFile)

      return linter.exec(
        this.clangTidyCommand(), allArgs, {stream: 'stdout', throwOnStdErr: false}
      ).then(output => {
        return new Promise((resolve, reject) => {
          fs.readFile(tmpFile, 'utf8', (err, data) => {
            if (err) reject(err)

            resolve(parse(output))
          })
        })
      })
    })
  }
}
