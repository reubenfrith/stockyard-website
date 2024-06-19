import { pdfBuilder } from "./pdf-builder";

import { registerPartials, registerHelpers } from "./register-hbs";
import templateBuilder from "./template-builder";
import ReadWriteStream from "stream";
import uploadToPDFBucket from "./upload-to-bucket";

const registerHbs = async () => {
  await registerPartials();
  await registerHelpers();
};

const createPDFRequestHandler = async (data, fileName): Promise<void> => {
  await registerHbs();

  if (data) {
    await generatePdf(data, fileName);
  } else {
    throw new Error("No data found");
  }
};

const generatePdf = async (data, fileName) => {
  try {
    const htmlTemplate: string = await templateBuilder(data);
    const pdfStream: ReadWriteStream = (await pdfBuilder(
      htmlTemplate
    )) as ReadWriteStream;
    await uploadToPDFBucket(pdfStream, fileName);
    return;
  } catch (error) {
    throw error;
  }
};

export { createPDFRequestHandler };
