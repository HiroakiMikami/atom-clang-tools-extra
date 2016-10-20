'use babel'

import ClangTidy from '../lib/clang-tidy'

describe('ClangTidy', () => {
  it('invoke the command', () => {
    const clangTidy = new ClangTidy('./spec/bin/clang-tidy')

    let result = null
    waitsForPromise(() => {
      return clangTidy.check([], 'foo.cpp').then(output => {
        result = output
        return output
      })
    })
    runs(() => {
      expect(result).not.toBe(null)
      expect(result.length).toBe(1)
      expect(result[0].begin.row).toBe(3)
      expect(result[0].begin.column).toBe(13)
      expect(result[0].severity).toBe('warning')
      expect(result[0].excerpt).toBe("unused function 'test' [clang-diagnostic-unused-function]")
      expect(result[0].trace.length).toBe(0)
    })
  })
})
