'use babel'

let Promise = null

function initialize () {
  if (!Promise) Promise = require('bluebird')
}

export default class ClangTidyAutocompleteProvider {
  constructor (clangTidy) {
    initialize()

    this.clangTidy = clangTidy
  }
  getSuggestions (request) {
    const {editor, bufferPosition, prefix} = request

    return new Promise((resolve, reject) => {
      const path = editor.getPath()
      if (!path) resolve([])

      // Get fixes
      const messages = this.clangTidy.getMessages(editor, bufferPosition)

      let suggestions = []

      messages.forEach(message => {
        message.fixes.forEach(fix => {
          // Generate suggestion
          const buffer = editor.getBuffer()
          const prefixEnd = buffer.characterIndexForPosition(bufferPosition)

          const prefixBegin = prefixEnd - prefix.length
          const patchBegin = fix.offset
          const patchEnd = fix.offset + fix.length

          const begin = Math.min(patchBegin, prefixBegin)
          const end = Math.max(patchEnd, prefixEnd)

          const replacementPrefix = buffer.getTextInRange([
            buffer.positionForCharacterIndex(begin),
            buffer.positionForCharacterIndex(prefixEnd)
          ])
          const text = buffer.getTextInRange([
            buffer.positionForCharacterIndex(begin),
            buffer.positionForCharacterIndex(end)
          ])

          const endPosition = buffer.positionForCharacterIndex(end)

          const result = fix.apply(text, prefixBegin)

          const suggestion = {
            text: result,
            replacementPrefix: replacementPrefix,
            displayText: result,
            type: 'error',
            leftLabel: 'Fix Error',
            iconHTML: '<i class="clang-tools-extra error-icon"></i>',
            description: message.text
          }

          suggestion.endPosition = endPosition

          suggestions.push(suggestion)
        })
      })

      resolve(suggestions)
    })
  }
  onDidInsertSuggestion (result) {
    const {editor, triggerPosition, suggestion} = result

    if (!suggestion.endPosition) return

    const buffer = editor.getBuffer()
    buffer.characterIndexForPosition()

    editor.setTextInBufferRange([triggerPosition, suggestion.endPosition], '')
  }
}
