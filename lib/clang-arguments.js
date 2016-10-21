'use babel'

export default class ClangArguments {
  constructor (flags) {
    this.flags = flags
  }

  get (editor) {
    const grammar = editor.getGrammar().name

    const args = []
    switch (grammar) {
      case 'Objective-C':
        args.push('-xobjective-c')
        args.push(...(this.flags.getClangObjectiveCFlags() || []))
        break
      case 'Objective-C++':
        args.push('-xobjective-c++')
        args.push(...(this.flags.getClangObjectiveCppFlags() || []))
        break
      case 'C':
        args.push('-xc')
        args.push(...(this.flags.getClangCFlags() || []))
        break
      default:
        args.push('-xc++')
        args.push(...(this.flags.getClangCppFlags() || []))
    }
    return args
  }
}
