import stream from 'stream';
import { S3Client } from '@aws-sdk/client-s3';
import { Upload } from '@aws-sdk/lib-storage';
import { REGION_ID, S3_BUCKET_NAME } from './config';
import ReadWriteStream from 'stream';

const uploadToTempBucket = async (pdf: ReadWriteStream, fileName: string): Promise<void> => {
  const s3 = new S3Client({ region: REGION_ID });
  const passThrough = new stream.PassThrough();

  const params = {
    Bucket: S3_BUCKET_NAME,
    Key: fileName,
    Body: passThrough,
    ContentType: 'application/pdf',
  };

  try {
    const result = new Upload({ params: params, client: s3 });
    pdf.pipe(passThrough);
    await result.done();

  } catch (error) {
    console.error(error);
    throw error;
  }
};

export default uploadToTempBucket;
