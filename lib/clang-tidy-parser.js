'use babel'

let Point = null

const description = /^.*:(\d+):(\d+): (error|warning|note): (.*)$/

function initialize () {
  if (!Point) Point = require('atom').Point
}

export default function parse (output) {
  initialize()

  const lines = output.split('\n')

  function parse () {
    const result = []

    while (true) {
      const head = lines.shift()

      if (!head || head.length === 0) {
        break
      }

      if (description.exec(head)) {
        // Read two lines
        lines.shift()
        lines.shift()

        switch (RegExp.$3) {
          case 'error':
          case 'warning':
            const issue = {
              begin: new Point(Number(RegExp.$1), Number(RegExp.$2)),
              severity: RegExp.$3,
              excerpt: RegExp.$4,
              trace: []
            }
            result.push(issue)
            break
          case 'note':
            const note = {
              begin: new Point(Number(RegExp.$1), Number(RegExp.$2)),
              severity: RegExp.$3,
              excerpt: RegExp.$4
            }
            result[result.length - 1].trace.push(note)
            break
        }

        if (lines.length !== 0) {
          const next = lines[0]
          if (!description.test(next)) {
            // clang-tidy suggests a fix
            result[result.length - 1].hasFix = true
          }
        }
      }
    }
    return result
  }

  let result = []
  while (lines.length !== 0) {
    result = result.concat(parse())
  }
  return result
}
