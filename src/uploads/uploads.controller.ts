import {
  Controller,
  Post,
  UploadedFile,
  UseInterceptors,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { FileInterceptor } from '@nestjs/platform-express';
import * as AWS from 'aws-sdk';

const BUCKET_NAME = 'ubereats1860';

@Controller('uploads')
export class UploadsController {
  constructor(private readonly configService: ConfigService) {}
  @Post('')
  @UseInterceptors(FileInterceptor('file'))
  async uploadFile(@UploadedFile() file) {
    if (!file) {
      throw new Error('No file uploaded');
    }

    const awsKey = this.configService.get('AWS_KEY');
    const awsSecret = this.configService.get('AWS_SECRET');

    if (!awsKey || !awsSecret) {
      throw new Error('AWS credentials not configured');
    }

    AWS.config.update({
      credentials: {
        accessKeyId: awsKey,
        secretAccessKey: awsSecret,
      },
      region: 'ap-northeast-2',
    });

    try {
      const objectName = `${Date.now() + file.originalname}`;

      const uploaded = await new AWS.S3()
        .putObject({
          Body: file.buffer,
          Bucket: BUCKET_NAME,
          Key: objectName,
        })
        .promise();

      console.log('S3 upload successful:', uploaded);

      const url = `https://${BUCKET_NAME}.s3.ap-northeast-2.amazonaws.com/${objectName}`;
      console.log(url);
      return { url };
      
    } catch (e) {
      console.error('S3 upload error:', e);
      throw new Error(`Upload failed: ${e.message}`);
    }
  }
}
