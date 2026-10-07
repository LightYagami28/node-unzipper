import { test } from 'tap';
import fs from 'fs';
import { Parse } from '../index.js';
import { normalizeText } from './helpers/normalizeText.js';

test("get content of a single file entry out of a zip", function (t) {
  const archive = './testData/compressed-standard/archive.zip';

  fs.createReadStream(archive)
    .pipe(Parse())
    .on('entry', function(entry) {
      if (entry.path !== 'file.txt')
        return entry.autodrain();

      entry.buffer()
        .then(function(str) {
          const fileStr = fs.readFileSync('./testData/compressed-standard/inflated/file.txt', 'utf8');
          t.equal(normalizeText(str.toString()), normalizeText(fileStr));
          t.end();
        });
    });
});
