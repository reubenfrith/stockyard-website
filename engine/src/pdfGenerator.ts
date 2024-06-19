import { GetObjectCommand, S3Client } from "@aws-sdk/client-s3";
import { createPDFRequestHandler } from "./generator/request-handler";
import {
  createZipFile,
  getDataFromCSV,
  separateByCategory,
} from "./generator/utils";
import { REGION_ID } from "./generator/config";
import fs from "fs";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";

module.exports.pdfGenerator = async (event) => {
  try {
    const { parsedData, startDate, endDate } = await getDataFromCSV(event);
    // seperate data based on category
    // generate pdf for each category
    // place all pdfs in a zip file
    // upload zip file to s3
    // return presigned url for the zip file

    // generate unique file suffix
    const fileSuffix = `${new Date().getTime()}`;

    //  separate data based on category
    const categorizedData = separateByCategory(parsedData);

    for (const category in categorizedData) {
      const fileName = `${category
        .replace(/\s+/g, "_")
        .replace(/[()]/g, "")}-${fileSuffix}.pdf`;
      // generate pdf for each category

      await createPDFRequestHandler(categorizedData[category], fileName);
    }

    const allCategories = Object.keys(categorizedData);
    const fileNames = allCategories.map(
      (category) =>
        `${category
          .replace(/\s+/g, "_")
          .replace(/[()]/g, "")}-${fileSuffix}.pdf`
    );
    const zipFileName = `stockyard-${fileSuffix}.zip`;
    // place all pdfs in a zip file

    const zipFile = createZipFile(fileNames, zipFileName);
    // upload zip file to s3
    // return presigned url for the zip file

    const client = new S3Client({ region: REGION_ID });
    const command = new GetObjectCommand({
      Bucket: "bucket",
      Key: zipFileName,
    });
    const fileUrl = await getSignedUrl(client, command, { expiresIn: 3600 });

    return {
      statusCode: 200,
      body: JSON.stringify({
        message: "File processed successfully",
        fileUrl: fileUrl,
      }),
    };
  } catch (error) {
    console.error("Error processing file:", error);
    return {
      statusCode: 500,
      body: JSON.stringify({
        message: "Error processing file",
        error: error.message,
      }),
    };
  }
};

