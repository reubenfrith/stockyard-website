import { pdfBuilder } from "./pdf-builder";

import { registerPartials, registerHelpers } from "./register-hbs";
import templateBuilder from "./template-builder";
import ReadWriteStream from "stream";
import uploadToTempBucket from "./upload-to-bucket";

const registerHbs = async () => {
  await registerPartials();
  await registerHelpers();
};

const createPDFRequestHandler = async (data, fileName): Promise<void> => {
  await registerHbs();

  if (data) {
    await generatePdf(data, fileName);
  }
  const s3Uri = `s3://`;
};

const generatePdf = async (data, fileName) => {
  try {
    const htmlTemplate: string = await templateBuilder(data);
    const pdfStream: ReadWriteStream = (await pdfBuilder(
      htmlTemplate
    )) as ReadWriteStream;
    await uploadToTempBucket(pdfStream, fileName);
    return;
  } catch (error) {
    throw error;
  }
};

export { createPDFRequestHandler };
