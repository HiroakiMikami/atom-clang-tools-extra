'use babel'

import ClangTidy from '../lib/clang-tidy'

describe('ClangTidy', () => {
  it('invokes the command', () => {
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
  it('append corresponding patches into errors.', () => {
    const clangTidy = new ClangTidy('./spec/bin/clang-tidy-with-fixes')
    let result = null
    waitsForPromise(() => {
      return clangTidy.check([], 'foo.cpp').then(output => {
        result = output
        return output
      })
    })
    runs(() => {
      expect(result).not.toBe(null)
      expect(result.length).toBe(3)

      const [error1, error2, error3] = result

      expect(error1.fixes.length).toBe(0)

      expect(error2.fixes.length).toBe(1)
      expect(error2.fixes[0].offset).toBe(29)
      expect(error2.fixes[0].length).toBe(0)
      expect(error2.fixes[0].text).toBe(';')

      expect(error3.fixes.length).toBe(1)
      expect(error3.fixes[0].offset).toBe(43)
      expect(error3.fixes[0].length).toBe(0)
      expect(error3.fixes[0].text).toBe(';')
    })
  })
  it('fixes errors in the source code', () => {
    const clangTidy = new ClangTidy('./spec/bin/clang-tidy-apply-all-fixes')

    let result = null
    waitsForPromise(() => {
      return clangTidy.applyAllFixes(['-xcpp'], 'foo.cpp').then(output => {
        result = output
        return output
      })
    })
    runs(() => {
      expect(result).toBe(`-fix-errors -extra-arg -xcpp foo.cpp`)
    })
  })
})
