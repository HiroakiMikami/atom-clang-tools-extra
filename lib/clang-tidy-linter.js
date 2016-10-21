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
    return this.clangTidy.update(editor)
  }
}
