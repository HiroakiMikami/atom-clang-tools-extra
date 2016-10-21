'use babel'

export default class Patch {
  constructor (offset, length, text) {
    this.offset = offset
    this.length = length
    this.text = text
  }

  apply (editor) {
    const begin = editor.getBuffer().positionForCharacterIndex(this.offset)
    const end = editor.getBuffer().positionForCharacterIndex(this.offset + this.length)
    editor.setTextInBufferRange([begin, end], this.text)
  }
}
