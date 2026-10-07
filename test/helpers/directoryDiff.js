import fs from 'fs';
import path from 'path';

// ZIP fixtures contain LF bytes, while a Windows checkout can contain CRLF.
// Compare text after normalizing line endings, but keep binary files byte-exact.
export default function directoryDiff (dir1, dir2, _opts, callback) {
  Promise.all([files(dir1), files(dir2)]).then(async ([left, right]) => {
    const all = [...new Set([...left, ...right])].sort()
    const diffs = []
    for (const relative of all) {
      const leftPath = path.join(dir1, relative)
      const rightPath = path.join(dir2, relative)
      if (!left.includes(relative)) diffs.push({ type: 'fileMissing', file1: null, file2: relative })
      else if (!right.includes(relative)) diffs.push({ type: 'fileMissing', file1: relative, file2: null })
      else {
        const [a, b] = await Promise.all([fs.promises.readFile(leftPath), fs.promises.readFile(rightPath)])
        if (!a.equals(b) && a.toString('utf8').replaceAll('\r\n', '\n') !== b.toString('utf8').replaceAll('\r\n', '\n')) {
          diffs.push({ type: 'fileContentMismatch', file1: relative, file2: relative })
        }
      }
    }
    callback(null, diffs)
  }, callback)
}

async function files (root, current = '') {
  const entries = await fs.promises.readdir(path.join(root, current), { withFileTypes: true })
  const result = []
  for (const entry of entries) {
    const relative = path.join(current, entry.name)
    if (entry.isDirectory()) result.push(...await files(root, relative))
    else result.push(relative)
  }
  return result
}
