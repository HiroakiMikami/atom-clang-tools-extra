'use babel'

import ClangTidy from '../lib/clang-tidy'
import ClangTidyLinter from '../lib/clang-tidy-linter'
import ClangArguments from '../lib/clang-arguments'

describe('ClangTidyLinter', () => {
  it('generate linter messages', () => {
    const clangTidy = new ClangTidy('./spec/bin/clang-tidy')
    const linter = new ClangTidyLinter(clangTidy, new ClangArguments({
      getClangCppFlags: () => []
    }))

    let result = null
    waitsForPromise(() => {
      return atom.workspace.open('foo.cpp').then(editor => {
        return linter.lint(editor)
      }).then(output => {
        result = output
        return output
      })
    })
    runs(() => {
      expect(result).not.toBe(null)
      expect(result.length).toBe(1)

      const message = result[0]
      expect(message.range.start.row).toBe(0)
      expect(message.range.start.column).toBe(0)
      expect(message.range.end.row).toBe(2)
      expect(message.range.end.column).toBe(12)
      expect(message.severity).toBe('warning')
      expect(message.text).toBe("unused function 'test' [clang-diagnostic-unused-function]")
      expect(message.trace.length).toBe(0)
    })
  })
  it('get list of fix from point.', () => {
    const clangTidy = new ClangTidy('./spec/bin/clang-tidy-with-fixes')
    const linter = new ClangTidyLinter(clangTidy, new ClangArguments({
      getClangCppFlags: () => []
    }))

    let editor = null
    let result = null
    waitsForPromise(() => {
      return atom.workspace.open('foo.cpp').then(e => {
        editor = e
        editor.setText('int main() {\n    Foo foo(10)\n    int x = 0\n}')
        return linter.lint(editor)
      }).then(output => {
        result = output
        return output
      })
    })
    runs(() => {
      expect(linter.getFixes(editor.getPath(), [1, 4]).fixes.length).toBe(0)
      expect(linter.getFixes(editor.getPath(), [1, 16]).fixes.length).toBe(1)
      expect(linter.getFixes(editor.getPath(), [10, 0])).toBe(undefined)
    })
  })
})
