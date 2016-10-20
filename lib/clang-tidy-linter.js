'use babel'

let Promise = null
let Range = null

function initialize () {
  if (!Promise) Promise = require('bluebird')
  if (!Range) Range = require('atom').Range
}

export default class ClangTidyLinter {
  constructor (clangTidy, configs) {
    initialize()

    this.clangTidy = clangTidy
    this.configs = configs
  }
  lint (editor) {
    const file = editor.getPath()
    const grammar = editor.getGrammar().name

    const extraArgs = []
    switch (grammar) {
      case 'Objective-C':
        extraArgs.push('-xobjective-c')
        extraArgs.push(...(this.configs.getClangObjectiveCFlags() || []))
        break
      case 'Objective-C++':
        extraArgs.push('-xobjective-c++')
        extraArgs.push(...(this.configs.getClangObjectiveCppFlags() || []))
        break
      case 'C':
        extraArgs.push('-xc')
        extraArgs.push(...(this.configs.getClangCFlags() || []))
        break
      default:
        extraArgs.push('-xc++')
        extraArgs.push(...(this.configs.getClangCppFlags() || []))
    }

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
