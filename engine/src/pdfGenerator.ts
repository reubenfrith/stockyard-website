import { parseCSV } from "./utils";

module.exports.pdfGenerator = async (event) => {
  try {
    const { csvFile, month } = JSON.parse(event.body);
    const buffer = Buffer.from(csvFile, 'base64');
    const csvString = buffer.toString('utf-8');

    const parsedData = await parseCSV(csvString);

    // Process the parsed data as needed
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
