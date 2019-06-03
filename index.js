const {dirname, resolve, basename, extname} = require('path');
const DynamicEntryPlugin = require('webpack/lib/DynamicEntryPlugin');
const globby = require('globby');
const minimatch = require('minimatch');
const _ = require('lodash');

function getPureFileName(filename) {
  return basename(filename, extname(filename))
}

class MultiEntryPlugin {
  constructor(option = {}) {
    this.mainEntry = option.mainEntry || 'main';
    this.exclude = option.exclude || [];
  }

  apply(compiler) {
    compiler.hooks.entryOption.tap('MultiEntryPlugin', (context, entry) => {
      const createDynamicEntry =
          cb => new DynamicEntryPlugin(context, cb).apply(compiler);

      if (typeof entry === 'string') {
        createDynamicEntry(() => this.getMultiEntry(entry));
      } else if (Array.isArray(entry)) {
        createDynamicEntry(
            () => this.getMultiEntry(entry[0]).then(entries => {
              const result = {...entries};

              entry.slice(1).forEach(
                  etr => result[getPureFileName(etr)] = etr
              );

              return result;
            })
        )
      } else if (typeof entry === 'object') {
        createDynamicEntry(
            () => this.getMultiEntry(entry[this.mainEntry]).then(entries => {
              return {
                ...entry, ..._.omit(entries, ['/' + getPureFileName(entry[this.mainEntry])])
              }
            })
        )
      } else if (typeof entry === 'function') {
        createDynamicEntry(entry)
      }

      return true;
    })
  }

  getMultiEntry(entry) {
    if (!entry) return {};
    const srcDir = resolve(dirname(entry));
    const ext = extname(entry).slice(1);
    const getEntryKey =
        (dir) => dirname(dir).slice(srcDir.length + 1) + '/' + getPureFileName(dir);

    return globby(srcDir, {
      deep: true,
      expandDirectories: {
        extensions: [ext]
      }
    }).then(paths => {
      const entries = {};

      paths.map(path => {
        if (this.exclude.every(e => !minimatch(path, resolve(srcDir, e)))) {
          entries[getEntryKey(path)] = path;
        }
      });

      return entries;
    });
  }
}

module.exports = MultiEntryPlugin;

