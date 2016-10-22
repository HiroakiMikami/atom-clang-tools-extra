'use babel'

let Promise = null
let Parser = null
let os = null
let fs = null
let path = null

import ClangToolsCommand from './clang-tools-command'

function initialize () {
  if (!Promise) Promise = require('bluebird')
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

export default class ClangTidyCommand extends ClangToolsCommand {
  constructor (clangTidyCommand, buildPath) {
    super(clangTidyCommand, buildPath)
    initialize()
  }

  applyAllFixes (clangArgs, file) {
    // Invoke clang-tidy
    return this.exec(clangArgs, ['-fix-errors'], file).then(output => {
      return new Promise((resolve, reject) => {
        if (output.code !== 0) reject(output.stderr)
        resolve(output.stdout)
      })
    })
  }

  check (clangArgs, file) {
    const tmpFile = generateTemporaryFile()

    // Invoke clang-tidy
    return this.exec(clangArgs, ['-export-fixes', tmpFile], file).then(output => {
      return new Promise((resolve, reject) => {
        if (output.code !== 0) reject(output.stderr)

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
          const result = Parser.parseOutput(output.stdout)
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
