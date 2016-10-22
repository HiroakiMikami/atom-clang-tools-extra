'use babel'

let Promise = null

import ClangToolsCommand from './clang-tools-command'

const symbolNotFound = /clang-rename: (could not find symbol at .*)/

function initialize () {
  if (!Promise) Promise = require('bluebird')
}

export default class ClangRenameCommand extends ClangToolsCommand {
  constructor (clangRenameCommand, buildPath) {
    initialize()

    super(clangRenameCommand, buildPath)
  }

  rename (clangArgs, offset, newName, file) {
    // Inoke clang-rename
    return this.exec(clangArgs, ['-offset', offset, '-new-name', newName], file, true).then(
      result => {
        return new Promise((resolve, reject) => {
          let renameErrorMessage = null
          if (result.code !== 0) {
            result.stderr.split('\n').forEach(line => {
              if (symbolNotFound.exec(line)) {
                renameErrorMessage = RegExp.$1
              }
            })
          }

          if (renameErrorMessage) {
            reject(renameErrorMessage)
          } else {
            resolve(result.stdout)
          }
        })
      }
    )
  }
}
