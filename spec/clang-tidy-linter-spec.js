'use babel'

import ClangTidy from '../lib/clang-tidy'
import ClangTidyLinter from '../lib/clang-tidy-linter'

describe('ClangTidyLinter', () => {
  it('generate linter messages', () => {
    const clangTidy = new ClangTidy('./spec/bin/clang-tidy')
    const linter = new ClangTidyLinter(clangTidy, {
      getClangCppFlags: () => []
    })

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
})
