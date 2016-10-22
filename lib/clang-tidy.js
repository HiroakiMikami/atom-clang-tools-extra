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

    const clangArgs = this.clangArguments.get(editor)
    return this.clangTidyCommand.applyAllFixes(clangArgs, path).then(() => {
      return atom.commands.dispatch(editor.element, 'linter:lint')
    })
  }

  update (editor) {
    const file = editor.getPath()
    if (!file) return []

    if (!this.messages.has(editor)) {
      editor.onDidDestroy(() => {
        this.messages.delete(editor)
      })
      this.messages.delete(editor)
    }
    const clangArgs = this.clangArguments.get(editor)

    return this.clangTidyCommand.check(clangArgs, file).then(result => {
      return new Promise((resolve, reject) => {
        function convertToLinterMessage (tidyMessage) {
          // Get word under the begin point
          const begin = [tidyMessage.begin.row - 1, tidyMessage.begin.column - 1]
          const selection = editor.addSelectionForBufferRange([begin, begin])
          selection.selectToNextWordBoundary()
          const end = selection.getBufferRange().end
          selection.destroy()
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

        if (messages.length !== 0) this.messages.set(editor, messages)

        resolve(messages)
      })
    })
  }

  getMessages (editor, point) {
    if (this.messages.has(editor)) {
      const messages = this.messages.get(editor) || []
      return messages.filter(elem => elem.range.containsPoint(point))
    } else {
      return []
    }
  }
}
