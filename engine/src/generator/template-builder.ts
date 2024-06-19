import { promises as fs } from 'fs';
import path from 'path';
import Handlebars from 'handlebars';

const templateBuilder = async (data): Promise<string> => {
  const filePath = path.join(
    __dirname,
    'static',
    'views',
    `main.hbs`,
  );

  const mainFile = (await fs.readFile(filePath)).toString('utf8');
  const main = Handlebars.compile(mainFile);

  return main(data);
};

export default templateBuilder;
