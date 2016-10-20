'use babel'

let CompositeDisposable = null
let ClangTidyLinter = null
let ClangTidy = null

function initialize () {
  if (!CompositeDisposable) CompositeDisposable = require('atom').CompositeDisposable
  if (!ClangTidy) ClangTidy = require('./clang-tidy')
  if (!ClangTidyLinter) ClangTidyLinter = require('./clang-tidy-linter')
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

    const clangTidy = new ClangTidy(
      atom.config.get('clang-tools-extra.clangTidyCommand'),
      atom.config.get('clang-tools-extra.buildPath')
    )
    const configs = {
      getClangCFlags: () => atom.config.get('clang-tools-extra.clangCFlags').split(/\s+/),
      getClangCppFlags: () => atom.config.get('clang-tools-extra.clangCppFlags').split(/\s+/),
      getClangObjectiveCFlags: () => atom.config.get('clang-tools-extra.clangObjectiveCFlags').split(/\s+/),
      getClangObjectiveCppFlags: () => atom.config.get('clang-tools-extra.clangObjectiveCppFlags').split(/\s+/)
    }

    this.clangTidyLinter = new ClangTidyLinter(clangTidy, configs)

    this.subscriptions = new CompositeDisposable()
  },

  deactivate () {
    this.subscriptions.dispose()
  },

  serialize () {
    return {}
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
