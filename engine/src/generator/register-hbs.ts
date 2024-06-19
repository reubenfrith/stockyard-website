import Handlebars from 'handlebars';
import { promises as fs } from 'fs';
import path from 'path';

export const registerPartials = async (): Promise<void> => {
  const filePath = path.join(__dirname, 'static', 'views', 'partials',);

  Handlebars.registerPartial('table', await fs.readFile(path.join(filePath, 'table.hbs'), 'utf8'));

};

export const registerHelpers = async (): Promise<void> => {
  Handlebars.registerHelper('firstItem', (index) => {
    return index === 0;
  });

};
