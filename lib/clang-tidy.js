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
    this.messages = new Map()
  }

  applyAllFixes (editor) {
    const path = editor.getPath()
    if (!path) return

    const extraArgs = this.clangArguments.get(editor)
    return this.clangTidyCommand.applyAllFixes(extraArgs, path).then(() => {
      return atom.commands.dispatch(editor.element, 'linter:lint')
    })
  }

  update (editor) {
    const file = editor.getPath()
    if (!file) return []

    this.messages.delete(file)
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

        const messages = result.map(tidyMessage => {
          const message = convertToLinterMessage(tidyMessage)
          message.fixes = tidyMessage.fixes

          return message
        })

        if (messages.length !== 0) this.messages.set(file, messages)

        resolve(messages)
      })
    })
  }

  getMessages (file, point) {
    if (this.messages.has(file)) {
      const messages = this.messages.get(file) || []
      return messages.filter(elem => elem.range.containsPoint(point))
    } else {
      return []
    }
  }
}
