'use babel'

import ClangToolsCommand from './clang-tools-command'

export default class ClangRenameCommand extends ClangToolsCommand {
  constructor (clangRenameCommand, buildPath) {
    super(clangRenameCommand, buildPath)
  }

  rename (clangArgs, offset, newName, file) {
    // Inoke clang-rename
    return this.exec(clangArgs, ['-offset', offset, '-new-name', newName], file, true)
  }
}
