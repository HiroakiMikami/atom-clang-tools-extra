'use babel'

import Patch from '../lib/patch'

describe('Patch', () => {
  it('apply a change into text editor', () => {
    const patch = new Patch(5, 3, 'foo')

    expect(patch.apply('bar\n', 5)).toBe('foo\n')
  })
})
