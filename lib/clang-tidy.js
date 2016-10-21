'use babel'

let Promise = null
let Range = null

function initialize () {
  if (!Promise) Promise = require('bluebird')
  if (!Range) Range = require('atom').Range
}

export default class ClangTidy {
  constructor (clangTidyCommand, clangArguments) {
    initialize()

    this.clangTidyCommand = clangTidyCommand
    this.clangArguments = clangArguments
    this.fixes = new Map()
    this.linterMessages = new Map()
  }
  update (editor) {
    const file = editor.getPath()
    if (!file) return []

    this.fixes.delete(file)
    this.linterMessages.delete(file)
    const extraArgs = this.clangArguments.get(editor)

    return this.clangTidyCommand.check(extraArgs, file).then(result => {
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

        let linterMessages = []
        let fixes = []
        result.forEach(tidyMessage => {
          const linterMessage = convertToLinterMessage(tidyMessage)
          linterMessages.push(linterMessage)
          if (tidyMessage.fixes.length !== 0) {
            fixes.push({
              range: linterMessage.range,
              fixes: tidyMessage.fixes
            })
          }
        })

        if (linterMessages.length !== 0) this.linterMessages.set(file, linterMessages)
        if (fixes.length !== 0) this.fixes.set(file, fixes)

        resolve({
          linterMessages: linterMessages,
          fixes: fixes
        })
      })
    })
  }

  getLinterMessages (file, point) {
    if (this.linterMessages.has(file)) {
      const messages = this.linterMessages.get(file) || []
      return messages.filter(elem => elem.range.containsPoint(point))
    } else {
      return []
    }
  }

  getFixes (file, point) {
    if (this.fixes.has(file)) {
      const allFixes = this.fixes.get(file) || []
      return allFixes.filter(elem => elem.range.containsPoint(point))
    } else {
      return []
    }
  }
}
