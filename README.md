atom-clang-tools-extra [![APM Version](https://img.shields.io/apm/v/clang-tools-extra.svg)](https://atom.io/packages/clang-tools-extra) [![APM Downloads](https://img.shields.io/apm/dm/clang-tools-extra.svg)](https://atom.io/packages/cclang-tools-extra)
===

Atom.io integration with [clang-tools-extra](http://clang.llvm.org/extra/).

## Description

![](https://hiroakimikami.github.io/atom-clang-tools-extra/screenshot.png)

This package provides the ability to use `clang-tools-extra` via Atom.io.

## Features
### 1. Integration with `clang-tidy`
This package provides the plugin for [Linter](https://github.com/steelbrain/linter) using `clang-tidy`.

Some kinds of errors (such as forgetting to add `;`) can be fixed by `autocomplete-plus:activate`.

![](https://hiroakimikami.github.io/atom-clang-tools-extra/fix-error.gif)

### 2. Integration with `clang-rename`
It also provides the user interface for [`clang-rename`](http://clang.llvm.org/extra/clang-rename.html).

Because of the limitation of `clang-rename` command, it cannot rename variables used in multiple files.

![](https://hiroakimikami.github.io/atom-clang-tools-extra/rename.gif)

# Requrements
* [clang-tools-extra](http://clang.llvm.org/extra/)

# Usage
## clang-tidy
1. Invoke `linter:lint` to show errors and warnings.
2. Invoke `autocomplete-plus:activate` to fix error.

## clang-rename
1. Move to the variable that is to be renamed.
2. Invoke `clang-tools-extra:rename` (`Ctrl-2`).
3. Change the variable name
4. Invoke `clang-tools-extra:confirm-rename` (`Ctrl-3`).

# Install
```bash
$ apm install clang-tools-extra
```


# Todo
* [ ] Integate with [clang-include-fixer](http://clang.llvm.org/extra/include-fixer.html)

# License
This software is released under the MIT License, see [LICESE.md](LICENSE.md)
