'use babel'

import ClangRenameCommand from '../lib/clang-rename-command'

describe('ClangRenameCommand ', () => {
  it('invokes the command', () => {
    const clangRenameCommand = new ClangRenameCommand('./spec/bin/clang-rename')

    let result = null
    waitsForPromise(() => {
      return clangRenameCommand.rename([], 0, 'bar', 'foo.cpp').then(output => {
        result = output
        return output
      })
    })
    runs(() => {
      expect(result).toBe('-offset 0 -new-name bar foo.cpp\n')
    })
  })
  it('ignores the exit code if some errors exists', () => {
    const clangRenameCommand = new ClangRenameCommand('./spec/bin/clang-rename-with-nonzero-exit-code')

    let result = null
    waitsForPromise(() => {
      return clangRenameCommand.rename([], 0, 'bar', 'foo.cpp').then(output => {
        result = output
        return output
      })
    })
    runs(() => {})
  })
  it('fails when the target symbol is not found.', () => {
    const clangRenameCommand = new ClangRenameCommand('./spec/bin/clang-rename-symbol-notfound')

    let result = null
    waitsForPromise(() => {
      return clangRenameCommand.rename([], 0, 'bar', 'foo.cpp').then(
        output => null,
        error => {
          result = error
          return error
        }
      )
    })
    runs(() => {
      expect(result).toBe('could not find symbol at /tmp/test.cpp:4:7 (offset 30).')
    })
  })
})
