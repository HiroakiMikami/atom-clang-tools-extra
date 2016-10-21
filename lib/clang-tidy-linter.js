'use babel'

let Promise = null
let Range = null

function initialize () {
  if (!Promise) Promise = require('bluebird')
  if (!Range) Range = require('atom').Range
}

export default class ClangTidyLinter {
  constructor (clangTidy, clangArguments) {
    initialize()

    this.clangTidy = clangTidy
    this.clangArguments = clangArguments
  }
  lint (editor) {
    const file = editor.getPath()
    if (!file) return []

    const extraArgs = this.clangArguments.get(editor)

    return this.clangTidy.check(extraArgs, file).then(result => {
      return new Promise((resolve, reject) => {
        function convertToLinterMessage (tidyMessage) {
          // Get word under the begin point
          const begin = [tidyMessage.begin.row - 1, tidyMessage.begin.column - 1]
          const cursor = editor.addCursorAtBufferPosition(begin)
          const end = cursor.getNextWordBoundaryBufferPosition()
          cursor.destroy()
          const linterMessage = {
            type: tidyMessage.severity,
            text: tidyMessage.excerpt,
            filePath: file,
            range: new Range(begin, end),
            severity: tidyMessage.severity
          }
          if (tidyMessage.trace) {
            linterMessage.trace = tidyMessage.trace.map(t => convertToLinterMessage(t))
          }
          return linterMessage
        }

        resolve(result.map(message => convertToLinterMessage(message)))
      })
    })
  }
}
