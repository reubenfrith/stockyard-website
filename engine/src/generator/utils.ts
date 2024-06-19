import { parse } from "csv-parse";
import busboy from "busboy";
import { GetObjectCommand, PutObjectCommand, S3Client } from "@aws-sdk/client-s3";
import { REGION_ID } from "./config";
import fs from "fs";
import archiver from "archiver";
import stream from "stream";


export const parseMultipartForm = (buffer, contentType) => {
  return new Promise((resolve, reject) => {
    const busboyObject = busboy({ headers: { "content-type": contentType } });
    const result = {
      fields: {},
      files: {},
    };

    busboyObject.on("field", (fieldname, val) => {
      result.fields[fieldname] = val;
    });

    busboyObject.on("file", (fieldname, file) => {
      let fileContent = "";
      file.setEncoding("utf8");
      file.on("data", (data) => {
        fileContent += data;
      });
      file.on("end", () => {
        result.files[fieldname] = fileContent;
      });
    });

    busboyObject.on("finish", () => {
      resolve(result);
    });

    busboyObject.on("error", (error) => {
      reject(error);
    });

    busboyObject.end(buffer);
  });
};

export const parseCSV = (csvString) => {
  return new Promise((resolve, reject) => {
    parse(
      csvString,
      {
        columns: true,
        skip_empty_lines: true,
      },
      (err, output) => {
        if (err) {
          return reject(err);
        }
        resolve(output);
      }
    );
  });
};

export const getDataFromCSV = async (event) => {
  const base64String = event.body;
  const buffer = Buffer.from(base64String, "base64");

  const result: any = await parseMultipartForm(
    buffer,
    event.headers["content-type"]
  );

  const csvFileContent = result.files["csvFile"];
  const startDate = result.fields["startDate"];
  const endDate = result.fields["endDate"];

  if (!csvFileContent || !startDate || !endDate) {
    throw new Error("CSV file or month information not found in the request.");
  }

  const parsedData = await parseCSV(csvFileContent);

  return { parsedData, startDate, endDate };
};

export const separateByCategory = (data) => {
  const categorizedData = {};

  data.forEach((item) => {
    const category = item.Category;
    if (!categorizedData[category]) {
      categorizedData[category] = [];
    }
    categorizedData[category].push(item);
  });

  return categorizedData;
};

export const getObjectFromS3 = async (fileName) => {
  const client = new S3Client({ region: REGION_ID });
  const params = {
    Bucket: "bucket-name",
    Key: fileName,
  };
  const command = new GetObjectCommand(params);
  const response = await client.send(command);
  return response.Body;
};



export const createZipFile = async (fileNames, zipFileName) => {
    const output = fs.createWriteStream(zipFileName);
    const archive = archiver('zip', {
      zlib: { level: 9 }
    });
  
    output.on('close', async function() {
        console.log(`Zip file ${zipFileName} has been created. Total bytes: ${archive.pointer()}`);
        await uploadZipToS3(zipFileName);
      });
  
    archive.on('error', function(err) {
      throw err;
    });
  
    archive.pipe(output);
  
    for (const fileName of fileNames) {
        const fileData = await getObjectFromS3(fileName);

        if (fileData) {
            const bufferStream = new stream.PassThrough();
            bufferStream.end(fileData);
            archive.append(bufferStream, { name: fileName });
        } else {
          console.error(`No data found for file: ${fileName}`);
        }
    }
  
    await archive.finalize();
  }


  const uploadZipToS3 = async (zipFileName) => {
    const zipFileData = fs.readFileSync(zipFileName);

    const s3Client = new S3Client({ region: REGION_ID });
  
    const params = {
      Bucket: 'bucketName',
      Key: zipFileName,
      Body: zipFileData,
      ContentType: 'application/zip'
    };
  
    try {
        const command = new PutObjectCommand(params);
        await s3Client.send(command);
        console.log(`Successfully uploaded ${zipFileName} to S3 bucket.`);
    } catch (error) {
      console.error(`Error uploading ${zipFileName} to S3 bucket.`, error);
      throw error;
    }
  };