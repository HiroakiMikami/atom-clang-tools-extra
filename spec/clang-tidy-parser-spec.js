'use babel'

import parse from '../lib/clang-tidy-parser'
import fs from 'fs'

describe('clang-tidy parser', () => {
  it('parses a warning of from the clang-tidy output', () => {
    const result = parse(fs.readFileSync('./spec/output/output1.txt', 'utf8'))
    expect(result.length).toBe(1)
    expect(result[0].begin.row).toBe(3)
    expect(result[0].begin.column).toBe(13)
    expect(result[0].severity).toBe('warning')
    expect(result[0].excerpt).toBe("unused function 'test' [clang-diagnostic-unused-function]")
    expect(result[0].trace.length).toBe(0)
  })
  it('parses errors of from the clang-tidy output', () => {
    const result = parse(fs.readFileSync('./spec/output/output2.txt', 'utf8'))
    expect(result.length).toBe(2)

    const [error1, error2] = result

    expect(error1.begin.row).toBe(6)
    expect(error1.begin.column).toBe(5)
    expect(error1.severity).toBe('error')
    expect(error1.excerpt).toBe("unknown type name 'Foo' [clang-diagnostic-error]")
    expect(error1.trace.length).toBe(0)

    expect(error2.begin.row).toBe(8)
    expect(error2.begin.column).toBe(12)
    expect(error2.severity).toBe('error')
    expect(error2.excerpt).toBe("cannot initialize return object of type 'int' with an lvalue of type 'const char [1]' [clang-diagnostic-error]")
    expect(error2.trace.length).toBe(0)
  })
  it('parses warnings from the clang-tidy output', () => {
    const result = parse(fs.readFileSync('./spec/output/output3.txt', 'utf8'))
    expect(result.length).toBe(2)

    const [warning1, warning2] = result

    expect(warning1.begin.row).toBe(3)
    expect(warning1.begin.column).toBe(13)
    expect(warning1.severity).toBe('warning')
    expect(warning1.excerpt).toBe("unused function 'test' [clang-diagnostic-unused-function]")
    expect(warning1.trace.length).toBe(0)

    expect(warning2.begin.row).toBe(4)
    expect(warning2.begin.column).toBe(13)
    expect(warning2.severity).toBe('warning')
    expect(warning2.excerpt).toBe("unused function 'test2' [clang-diagnostic-unused-function]")
    expect(warning2.trace.length).toBe(0)
  })
  it('parses traces of the error from the clang-tidy output', () => {
    const result = parse(fs.readFileSync('./spec/output/output4.txt', 'utf8'))
    expect(result.length).toBe(2)

    const [error1, error2] = result

    expect(error1.begin.row).toBe(7)
    expect(error1.begin.column).toBe(9)
    expect(error1.severity).toBe('error')
    expect(error1.excerpt).toBe("no matching constructor for initialization of 'Foo' [clang-diagnostic-error]")
    expect(error1.trace.length).toBe(2)

    const [trace1, trace2] = error1.trace

    expect(trace1.begin.row).toBe(1)
    expect(trace1.begin.column).toBe(8)
    expect(trace1.excerpt).toBe("candidate constructor (the implicit copy constructor) not viable: no known conversion from 'const char [1]' to 'const Foo' for 1st argument")

    expect(trace2.begin.row).toBe(2)
    expect(trace2.begin.column).toBe(5)
    expect(trace2.excerpt).toBe("candidate constructor not viable: no known conversion from 'const char [1]' to 'const int' for 1st argument")

    expect(error2.begin.row).toBe(9)
    expect(error2.begin.column).toBe(12)
    expect(error2.severity).toBe('error')
    expect(error2.excerpt).toBe("cannot initialize return object of type 'int' with an lvalue of type 'const char [1]' [clang-diagnostic-error]")
    expect(error2.trace.length).toBe(0)
  })
})
