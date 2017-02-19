'use babel'

let Disposable = null
let CompositeDisposable = null
let ClangTidyCommand = null
let ClangTidy = null
let ClangArguments = null
let ClangTidyLinter = null
let ClangTidyAutocompleteProvider = null
let ClangRenameCommand
let ClangRenameView = null

function initialize () {
  if (!Disposable || !CompositeDisposable) {
    const atom = require('atom')
    Disposable = atom.Disposable
    CompositeDisposable = atom.CompositeDisposable
  }
  if (!ClangTidyCommand) ClangTidyCommand = require('./clang-tidy-command')
  if (!ClangTidy) ClangTidy = require('./clang-tidy')
  if (!ClangArguments) ClangArguments = require('./clang-arguments')
  if (!ClangTidyLinter) ClangTidyLinter = require('./clang-tidy-linter')
  if (!ClangTidyAutocompleteProvider) {
    ClangTidyAutocompleteProvider = require('./clang-tidy-autocomplete-provider')
  }
  if (!ClangRenameCommand) ClangRenameCommand = require('./clang-rename-command')
  if (!ClangRenameView) ClangRenameView = require('./clang-rename-view')
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
    clangRenameCommand: {
      title: 'clang-rename command',
      type: 'string',
      default: 'clang-rename'
    },
    clangCppFlags: {
      title: 'clang flags for C++',
      type: 'array',
      default: [],
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
      () => atom.config.get('clang-tools-extra.clangTidyCommand'),
      () => atom.config.get('clang-tools-extra.buildPath')
    )
    this.clangRenameCommand = new ClangRenameCommand(
      () => atom.config.get('clang-tools-extra.clangRenameCommand'),
      () => atom.config.get('clang-tools-extra.buildPath')
    )

    this.clangArguments = new ClangArguments({
      getClangCFlags: () => atom.config.get('clang-tools-extra.clangCFlags'),
      getClangCppFlags: () => atom.config.get('clang-tools-extra.clangCppFlags'),
      getClangObjectiveCFlags: () => atom.config.get('clang-tools-extra.clangObjectiveCFlags'),
      getClangObjectiveCppFlags: () => atom.config.get('clang-tools-extra.clangObjectiveCppFlags'),
    })

    this.clangTidy = new ClangTidy(this.clangTidyCommand, this.clangArguments)

    this.clangTidyLinter = new ClangTidyLinter(this.clangTidy)

    this.autocompleteProvider = new ClangTidyAutocompleteProvider(this.clangTidy)
    this.autocompleteProvider.selector = this.grammars.map(elem => `.${elem}`).join(','),
    this.autocompleteProvider.inclusionPriority = 1

    this.subscriptions = new CompositeDisposable()

    this.clangRenameView = new ClangRenameView(this.clangRenameCommand, this.clangArguments)
    this.subscriptions.add(new Disposable(() => this.clangRenameView.destroy()))

    // Register the commands
    this.subscriptions.add(
      atom.commands.add('atom-text-editor', {
        'clang-tools-extra:apply-all-fixes': () => this.applyAllFixes()
      })
    )
    this.subscriptions.add(
      atom.commands.add('atom-text-editor', {
        'clang-tools-extra:rename': () => this.showRenameView()
      })
    )
    this.subscriptions.add(
      atom.commands.add('atom-text-editor', {
        'clang-tools-extra:confirm-rename': () => this.invokeRenameCommand()
      })
    )
    this.subscriptions.add(
      atom.commands.add('atom-text-editor', {
        'core:cancel': event => {
          const editor = atom.workspace.getActiveTextEditor()
          if (!editor) return

          if (this.clangRenameView.isCursorIn(editor)) {
            this.clangRenameView.cancel(editor)
            event.stopImmediatePropagation()
          }
        }
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

    this.clangTidy.applyAllFixes(editor).catch(
      reason => atom.notifications.addError('Error in apply-all-fixes', {
        detail: reason
      })
    )
  },

  showRenameView () {
    const editor = atom.workspace.getActiveTextEditor()
    if (!editor) return

    this.clangRenameView.invoke(editor)
  },

  invokeRenameCommand () {
    const editor = atom.workspace.getActiveTextEditor()
    if (!editor) return

    if (this.clangRenameView.isCursorIn(editor)) {
      this.clangRenameView.apply(editor).catch(
        reason => atom.notifications.addError('Error in confirm-rename', {
          detail: reason
        })
      )
    }
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
