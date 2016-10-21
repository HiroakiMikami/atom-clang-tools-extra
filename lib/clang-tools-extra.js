'use babel'

let CompositeDisposable = null
let ClangTidyLinter = null
let ClangTidy = null
let ClangArguments = null

function initialize () {
  if (!CompositeDisposable) CompositeDisposable = require('atom').CompositeDisposable
  if (!ClangTidy) ClangTidy = require('./clang-tidy')
  if (!ClangTidyLinter) ClangTidyLinter = require('./clang-tidy-linter')
  if (!ClangArguments) ClangArguments = require('./clang-arguments')
}

export default {
  subscriptions: null,

  config: {
    clangTidyCommand: {
      title: 'clang-tidy command',
      type: 'string',
      default: 'clang-tidy'
    },
    clangCppFlags: {
      title: 'clang flags for C++',
      type: [],
      items: { type: 'string' }
    },
    clangCFlags: {
      title: 'clang flags for C',
      type: 'array',
      default: [],
      items: { type: 'string' }
    },
    clangObjectiveCppFlags: {
      title: 'clang flags for Objective C++',
      type: 'array',
      default: [],
      items: { type: 'string' }
    },
    clangObjectiveCFlags: {
      title: 'clang flags for Objective C',
      type: 'array',
      default: [],
      items: { type: 'string' }
    },
    buildPath: {
      title: 'the build pass used in clang-tools',
      type: 'string',
      default: 'compile_commands.json'
    }
  },

  activate (state) {
    initialize()

    this.clangTidy = new ClangTidy(
      atom.config.get('clang-tools-extra.clangTidyCommand'),
      atom.config.get('clang-tools-extra.buildPath')
    )
    this.clangArguments = new ClangArguments({
      getClangCFlags: () => atom.config.get('clang-tools-extra.clangCFlags').split(/\s+/),
      getClangCppFlags: () => atom.config.get('clang-tools-extra.clangCppFlags').split(/\s+/),
      getClangObjectiveCFlags: () => atom.config.get('clang-tools-extra.clangObjectiveCFlags').split(/\s+/),
      getClangObjectiveCppFlags: () => atom.config.get('clang-tools-extra.clangObjectiveCppFlags').split(/\s+/)
    })

    this.clangTidyLinter = new ClangTidyLinter(this.clangTidy, this.clangArguments)

    this.subscriptions = new CompositeDisposable()

    // Register the commands
    this.subscriptions.add(
      atom.commands.add('atom-text-editor', {
        'clang-tools-extra:apply-all-fixes': () => this.applyAllFixes()
      })
    )
  },

  deactivate () {
    this.subscriptions.dispose()
  },

  serialize () {
    return {}
  },

  applyAllFixes () {
    const editor = atom.workspace.getActiveTextEditor()
    if (!editor) return

    const path = editor.getPath()
    if (!path) return

    const extraArgs = this.clangArguments.get(editor)
    this.clangTidy.applyAllFixes(extraArgs, path).then(() => {
      atom.commands.dispatch(editor.element, 'linter:lint')
    })
  },

  provideLinter () {
    const provider = {
      name: 'clang-tools-extra',
      grammarScopes: ['source.cpp', 'source.c', 'source.objc', 'source.objcpp'],
      scope: 'file',
      lintOnFly: false,
      lint: (textEditor) => this.clangTidyLinter.lint(textEditor)
    }
    return provider
  }
}
