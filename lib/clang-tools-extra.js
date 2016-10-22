'use babel'

let CompositeDisposable = null
let ClangTidyCommand = null
let ClangTidy = null
let ClangArguments = null
let ClangTidyLinter = null
let ClangTidyAutocompleteProvider = null

function initialize () {
  if (!CompositeDisposable) CompositeDisposable = require('atom').CompositeDisposable
  if (!ClangTidyCommand) ClangTidyCommand = require('./clang-tidy-command')
  if (!ClangTidy) ClangTidy = require('./clang-tidy')
  if (!ClangArguments) ClangArguments = require('./clang-arguments')
  if (!ClangTidyLinter) ClangTidyLinter = require('./clang-tidy-linter')
  if (!ClangTidyAutocompleteProvider) {
    ClangTidyAutocompleteProvider = require('./clang-tidy-autocomplete-provider')
  }
}

export default {
  subscriptions: null,

  grammars: [
    'source.c',
    'source.cpp',
    'source.objc',
    'source.objcpp'
  ],

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

    this.clangTidyCommand = new ClangTidyCommand(
      atom.config.get('clang-tools-extra.clangTidyCommand'),
      atom.config.get('clang-tools-extra.buildPath')
    )
    this.clangArguments = new ClangArguments({
      getClangCFlags: () => atom.config.get('clang-tools-extra.clangCFlags').split(/\s+/),
      getClangCppFlags: () => atom.config.get('clang-tools-extra.clangCppFlags').split(/\s+/),
      getClangObjectiveCFlags: () => atom.config.get('clang-tools-extra.clangObjectiveCFlags').split(/\s+/),
      getClangObjectiveCppFlags: () => atom.config.get('clang-tools-extra.clangObjectiveCppFlags').split(/\s+/)
    })

    this.clangTidy = new ClangTidy(this.clangTidyCommand, this.clangArguments)

    this.clangTidyLinter = new ClangTidyLinter(this.clangTidy)

    this.autocompleteProvider = new ClangTidyAutocompleteProvider(this.clangTidy)
    this.autocompleteProvider.selector = this.grammars.map(elem => `.${elem}`).join(','),
    this.autocompleteProvider.inclusionPriority = 1

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

    this.clangTidy.applyAllFixes(editor)
  },

  provide () {
    return this.autocompleteProvider
  },

  provideLinter () {
    const provider = {
      name: 'clang-tools-extra',
      grammarScopes: this.grammars,
      scope: 'file',
      lintOnFly: false,
      lint: (textEditor) => this.clangTidyLinter.lint(textEditor)
    }
    return provider
  }
}
