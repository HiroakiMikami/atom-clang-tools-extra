'use babel'

import ClangTidyCommand from '../lib/clang-tidy-command'
import ClangTidy from '../lib/clang-tidy'
import ClangArguments from '../lib/clang-arguments'

describe('ClangTidy', () => {
  it('generate linter messages and fixes', () => {
    const clangTidyCommand = new ClangTidyCommand('./spec/bin/clang-tidy')
    const clangTidy = new ClangTidy(clangTidyCommand, new ClangArguments({
      getClangCppFlags: () => []
    }))

    let result = null
    waitsForPromise(() => {
      return atom.workspace.open('foo.cpp').then(editor => {
        return clangTidy.update(editor)
      }).then(output => {
        result = output
        return output
      })
    })
    runs(() => {
      const {linterMessages, fixes} = result
      expect(linterMessages).not.toBe(null)
      expect(linterMessages.length).toBe(1)

      const message = linterMessages[0]
      expect(message.range.start.row).toBe(0)
      expect(message.range.start.column).toBe(0)
      expect(message.range.end.row).toBe(2)
      expect(message.range.end.column).toBe(12)
      expect(message.severity).toBe('warning')
      expect(message.text).toBe("unused function 'test' [clang-diagnostic-unused-function]")
      expect(message.trace.length).toBe(0)

      expect(fixes.length).toBe(0)
    })
  })
  it('get list of fix from buffer-point.', () => {
    const clangTidyCommand = new ClangTidyCommand('./spec/bin/clang-tidy-with-fixes')
    const clangTidy = new ClangTidy(clangTidyCommand, new ClangArguments({
      getClangCppFlags: () => []
    }))

    let editor = null
    waitsForPromise(() => {
      return atom.workspace.open('foo.cpp').then(e => {
        editor = e
        editor.setText('int main() {\n    Foo foo(10)\n    int x = 0\n}')
        return clangTidy.update(editor)
      }).then(output => output)
    })
    runs(() => {
      expect(clangTidy.getFixes(editor.getPath(), [1, 4]).length).toBe(0)
      expect(clangTidy.getFixes(editor.getPath(), [1, 16]).length).toBe(1)
      expect(clangTidy.getFixes(editor.getPath(), [10, 0]).length).toBe(0)
    })
  })
})
