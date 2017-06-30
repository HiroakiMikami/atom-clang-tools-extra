'use babel'

let Disposable
let CompositeDisposable

function initialize () {
  if (!CompositeDisposable || !Disposable) {
    const atom = require('atom')
    CompositeDisposable = atom.CompositeDisposable
    Disposable = atom.Disposable
  }
}

export default class ClangRenameView {
  constructor (clangRenameCommand, clangArguments) {
    initialize()

    this.clangRenameCommand = clangRenameCommand
    this.clangArguments = clangArguments

    this.subscriptions = new CompositeDisposable()

    this.views = new Map()
  }

  invoke (editor) {
    if (this.views.has(editor)) {
      views.get(editor).disposable.dispose()
      views.delete(editor)
    }

    const cursor = editor.getLastCursor()
    cursor.moveToBeginningOfWord()
    const wordBegin = cursor.getBufferPosition()
    cursor.moveToEndOfWord()
    const wordEnd = cursor.getBufferPosition()

    const marker = editor.markBufferRange([wordBegin, wordEnd])
    const decoration = editor.decorateMarker(marker, {
      type: 'highlight',
      class: 'clang-tools-extra'
    })

    const previousWord = editor.getTextInBufferRange(marker.getBufferRange())

    const disposable = new Disposable(() => {
      marker.destroy()
      decoration.destroy()
      this.subscriptions.remove(disposable)
    })

    decoration.onDidDestroy(() => disposable.dispose())
    editor.onDidDestroy(() => disposable.dispose())

    this.views.set(editor, {
      disposable: disposable,
      marker: marker,
      previousWord: previousWord,
      decoration: decoration
    })

    return disposable
  }

  destroy () {
    this.subscriptions.dispose()
  }

  isCursorIn (editor) {
    if (!this.views.has(editor)) return

    const marker = this.views.get(editor).marker
    return marker.getBufferRange().containsPoint(editor.getCursorBufferPosition())
  }

  apply (editor) {
    const file = editor.getPath()
    if (!file) return

    if (!this.views.has(editor)) return

    const {marker, previousWord, disposable} = this.views.get(editor)

    // Get current word (new-name)
    const newName = editor.getTextInBufferRange(marker.getBufferRange())

    // Restore the previous word
    editor.setTextInBufferRange(marker.getBufferRange(), previousWord)
    Promise.resolve(editor.save()).then(
      () => {
        // Invoke clang-rename
        const offset = editor.getBuffer().characterIndexForPosition(marker.getBufferRange().start)
        const clangArgs = this.clangArguments.get(editor)
        return this.clangRenameCommand.rename(clangArgs, offset, newName, file)
          .then(output => {
            editor.setText(output)

            return Promise.resolve(editor.save()).then(() => {
              return output;
            })
          }).then(output => {
            // Delete the rename UI
            disposable.dispose()
            this.views.delete(editor)

            return output
          }).then(output => {
            return atom.commands.dispatch(editor.element, 'linter:lint')
          })
    })
  }

  cancel (editor) {
    const file = editor.getPath()
    if (!file) return

    if (!this.views.has(editor)) return

    this.views.get(editor).disposable.dispose()
    this.views.delete(editor)
  }
}
