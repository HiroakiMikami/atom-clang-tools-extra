'use babel'

let Promise = null
let Range = null

function initialize () {
  if (!Promise) Promise = require('bluebird')
  if (!Range) Range = require('atom').Range
}

export default class ClangTidyLinter {
  constructor (clangTidy) {
    initialize()

    this.clangTidy = clangTidy
  }
  lint (editor) {
    return Promise.resolve(editor.save())
      .then(() => {
        return this.clangTidy.update(editor)
      })
  }
}
