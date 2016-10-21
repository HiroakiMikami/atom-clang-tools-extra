'use babel'

export default class Patch {
  constructor (offset, length, text) {
    this.offset = offset
    this.length = length
    this.text = text
  }

  apply (text, offset) {
    const t1 = text.substr(0, this.offset - offset)
    const t2 = text.substr(this.offset - offset + this.length)
    return t1 + this.text + t2
  }
}
