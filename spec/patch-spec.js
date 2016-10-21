'use babel'

import Patch from '../lib/patch'

describe('Patch', () => {
  it('apply a change into text editor', () => {
    const patch = new Patch(0, 3, 'foo')

    const editor = atom.workspace.buildTextEditor()
    editor.setText('bar\ntest')
    patch.apply(editor)
    expect(editor.getText()).toBe('foo\ntest')
  })
})
