// src/csv/goodreads.js
//
// Goodreads CSV parsing and book normalization helpers. Extracted verbatim from
// server.js (Tier-S modularization) so the parsing logic is independently
// testable and the route modules stay thin. Behaviour is unchanged: only rows
// whose "Exclusive Shelf" is "read" are kept, and each book is normalized to
// { title, author, myRating, pages, dateRead }.
//
// author: 0xWulf
// description: Goodreads export CSV -> normalized book array
// date modified: 2026-11-22

const dayjs = require('dayjs');
const customParse = require('dayjs/plugin/customParseFormat');
dayjs.extend(customParse);
const csvParser = require('csv-parser');
const { Readable } = require('stream');

// Parse a single Goodreads "Date Read" cell into a Date, or null when blank or
// unrecognised. Strict parsing against the formats Goodreads is known to emit.
const parseDate = (s) => {
  if (!s || !s.trim()) return null;
  const d = dayjs(s.trim(), ['YYYY/MM/DD', 'MM/DD/YYYY', 'DD/MM/YYYY', 'YYYY-MM-DD'], true);
  return d.isValid() ? d.toDate() : null;
};

// Parse a readable stream of Goodreads CSV into a normalized book array.
const parseGoodreadsStream = (stream) =>
  new Promise((res, rej) => {
    const books = [];
    stream
      .on('error', (e) => rej(new Error('File read failed: ' + e.message)))
      .pipe(csvParser())
      .on('data', (row) => {
        if ((row['Exclusive Shelf'] || '').trim().toLowerCase() !== 'read') return;
        books.push({
          title: row['Title']?.trim() || '(Untitled)',
          author: row['Author']?.trim() || 'Unknown',
          myRating: parseInt(row['My Rating'] || '0', 10) || 0,
          pages: parseInt(row['Number of Pages'] || '0', 10) || 0,
          dateRead: parseDate(row['Date Read'])
        });
      })
      .on('error', (e) => rej(new Error('CSV parse failed: ' + e.message)))
      .on('end', () => res(books));
  });

// Parse an uploaded CSV held in memory (no file is ever written to disk).
const parseGoodreadsBuffer = (buffer) => parseGoodreadsStream(Readable.from(buffer));

module.exports = { parseDate, parseGoodreadsStream, parseGoodreadsBuffer };
