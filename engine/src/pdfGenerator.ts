import { parse } from "csv-parse";
import busboy from "busboy";

exports.module.pdfGenerator = async (event) => {
    try {
        const base64String = event.body;
        const buffer = Buffer.from(base64String, 'base64');

        const result: any = await parseMultipartForm(buffer, event.headers['content-type']);

        const csvFileContent = result.files['csvFile'];
        const month = result.fields['month'];

        if (!csvFileContent || !month) {
            throw new Error('CSV file or month not found in the request.');
        }

        const parsedData = await parseCSV(csvFileContent);

        console.log('Parsed CSV Data:', parsedData);

        return {
            statusCode: 200,
            body: JSON.stringify({ message: 'File processed successfully', data: parsedData }),
        };
    } catch (error) {
        console.error('Error processing file:', error);
        return {
            statusCode: 500,
            body: JSON.stringify({ message: 'Error processing file', error: error.message }),
        };
    }
};

function parseMultipartForm(buffer, contentType) {
    return new Promise((resolve, reject) => {
        const busboyObject = busboy({ headers: { 'content-type': contentType } });
        const result = {
            fields: {},
            files: {}
        };

        busboyObject.on('field', (fieldname, val) => {
            result.fields[fieldname] = val;
        });

        busboyObject.on('file', (fieldname, file) => {
            let fileContent = '';
            file.setEncoding('utf8');
            file.on('data', (data) => {
                fileContent += data;
            });
            file.on('end', () => {
                result.files[fieldname] = fileContent;
            });
        });

        busboyObject.on('finish', () => {
            resolve(result);
        });

        busboyObject.on('error', (error) => {
            reject(error);
        });

        busboyObject.end(buffer);
    });
}

function parseCSV(csvString) {
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
