import { Construct } from 'constructs';
import * as cdk from "aws-cdk-lib";
import * as lambda from "aws-cdk-lib/aws-lambda-nodejs";
import { websiteUrl } from "./config";
import path = require("path");
import { AssetCode, LayerVersion, Runtime } from "aws-cdk-lib/aws-lambda";

export class LambdaStack extends cdk.Stack {
  constructor(scope: Construct, id: string, props?: cdk.StackProps) {
    super(scope, id, props);

    const lambdaPath = path.join(__dirname, "../../lambda.ts");
    const wkhtmltopdfPath = path.join(__dirname, "../../wkhtmltopdf");

    const pdfLambda = new lambda.NodejsFunction(this, "pdfLambda", {
      entry: path.join(lambdaPath, `${id}.ts`),
      bundling: {
        commandHooks: {
          beforeBundling(inputDir: string, outputDir: string): string[] {
            return [`cp -r ../static ${outputDir}`]; // adjust here
          },
          afterBundling(inputDir: string, outputDir: string): string[] {
            return [];
          },
          beforeInstall(inputDir: string, outputDir: string): string[] {
            return [];
          },
        },
      },
      runtime: Runtime.NODEJS_18_X,
      handler: `index.pdfLambda`,
      timeout: cdk.Duration.minutes(14),
      memorySize: 512,
      // add url
    });

    const wkhtmltopdfLayer = new LayerVersion(scope, "WkhtmltopdfLayer", {
      code: new AssetCode(wkhtmltopdfPath),
      compatibleRuntimes: [Runtime.NODEJS_18_X],
    });

    pdfLambda.addLayers(wkhtmltopdfLayer);
    pdfLambda.addFunctionUrl({
      cors: {
        // allowedOrigins: [websiteUrl],
      },
    });
  }
}
