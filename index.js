const {dirname, resolve, basename, extname} = require('path');
const DynamicEntryPlugin = require('webpack/lib/DynamicEntryPlugin');
const globby = require('globby');
const _ = require('lodash');

function getPureFileName(filename) {
  return basename(filename, extname(filename))
}

function getMultiEntry(entry) {
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
      entries[getEntryKey(path)] = path;
    });

    return entries;
  });
}

export default class MultiEntryPlugin {
  constructor(option = {}) {
    this.mainEntry = option.mainEntry || 'main';
  }

  apply(compiler) {
    compiler.hooks.entryOption.tap('MultiEntryPlugin', (context, entry) => {
      const createDynamicEntry =
          cb => new DynamicEntryPlugin(context, cb).apply(compiler);

      if (typeof entry === 'string') {
        createDynamicEntry(() => getMultiEntry(entry));
      } else if (Array.isArray(entry)) {
        createDynamicEntry(
            () => getMultiEntry(entry[0]).then(entries => {
              const result = {...entries};

              entry.slice(1).forEach(
                  etr => result[getPureFileName(etr)] = etr
              );

              return result;
            })
        )
      } else if (typeof entry === 'object') {
        createDynamicEntry(
            () => getMultiEntry(entry[this.mainEntry]).then(entries => {
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
}

