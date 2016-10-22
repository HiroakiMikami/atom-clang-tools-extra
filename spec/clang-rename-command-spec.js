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
      expect(result).toBe('-offset 0 -new-name bar foo.cpp')
    })
  })
  it('ignores the exit code', () => {
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
})
