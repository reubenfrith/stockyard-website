import * as cdk from 'aws-cdk-lib';
import { Construct } from 'constructs';
import * as lambda from 'aws-cdk-lib/aws-lambda-nodejs';
import { AssetCode, LayerVersion, Runtime } from 'aws-cdk-lib/aws-lambda';
import path = require('path');
// import * as sqs from 'aws-cdk-lib/aws-sqs';

export class CdkStack extends cdk.Stack {
  constructor(scope: Construct, id: string, props?: cdk.StackProps) {
    super(scope, id, props);

    const lambdaPath = path.join(__dirname, '../../engine/src');
    const wkhtmltopdfPath = path.join(__dirname, '../../engine/static/wkhtmltopdf');


    const lambdaFunction = new lambda.NodejsFunction(this, 'StockyardLambda', {
      runtime: Runtime.NODEJS_18_X,
      bundling: {
        commandHooks: {
          beforeBundling(inputDir: string, outputDir: string): string[] {
            const staticSource = path.resolve(__dirname, '../../engine/static');
            return [`cp -r ${staticSource} ${outputDir}`];
          },
          afterBundling(inputDir: string, outputDir: string): string[] {
            return [];
          },
          beforeInstall(inputDir: string, outputDir: string): string[] {
            return [];
          },
        },
      },
      entry: path.join(lambdaPath, `pdfGenerator.ts`),
      handler: 'index.pdfGenerator',
    })
    const wkhtmltopdfLayer = new LayerVersion(this, 'WkhtmltopdfLayer', {
      code: new AssetCode(wkhtmltopdfPath),
      compatibleRuntimes: [Runtime.NODEJS_18_X],
    });
    lambdaFunction.addLayers(wkhtmltopdfLayer);
  }
}
