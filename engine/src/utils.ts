import { parse } from 'csv-parse';

export const parseCSV = (csvString) => {
  return new Promise((resolve, reject) => {
      parse(csvString, {
          columns: true,
          skip_empty_lines: true
      }, (err, output) => {
          if (err) {
              return reject(err);
          }
          resolve(output);
      });
  });
}
