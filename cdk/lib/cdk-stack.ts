import * as cdk from "aws-cdk-lib";
import { Construct } from "constructs";
import * as lambda from "aws-cdk-lib/aws-lambda-nodejs";
import {
  AssetCode,
  FunctionUrlAuthType,
  LayerVersion,
  Runtime,
} from "aws-cdk-lib/aws-lambda";
import path = require("path");
import { Bucket, BucketAccessControl } from "aws-cdk-lib/aws-s3";
import { BucketDeployment, Source } from "aws-cdk-lib/aws-s3-deployment";
import { Distribution, OriginAccessIdentity } from "aws-cdk-lib/aws-cloudfront";
import { S3Origin } from "aws-cdk-lib/aws-cloudfront-origins";

export class CdkStack extends cdk.Stack {
  constructor(scope: Construct, id: string, props?: cdk.StackProps) {
    super(scope, id, props);

    // Lambda

    const lambdaPath = path.join(__dirname, "../../engine/src");
    const wkhtmltopdfPath = path.join(
      __dirname,
      "../../engine/static/wkhtmltopdf"
    );

    const lambdaFunction = new lambda.NodejsFunction(this, "StockyardLambda", {
      runtime: Runtime.NODEJS_18_X,
      functionName: "StockyardPDFLambda",
      bundling: {
        commandHooks: {
          beforeBundling(inputDir: string, outputDir: string): string[] {
            const staticSource = path.resolve(__dirname, "../../engine/static");
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
      handler: "index.pdfGenerator",
    });
    const wkhtmltopdfLayer = new LayerVersion(this, "WkhtmltopdfLayer", {
      code: new AssetCode(wkhtmltopdfPath),
      compatibleRuntimes: [Runtime.NODEJS_18_X],
    });
    lambdaFunction.addLayers(wkhtmltopdfLayer);
    lambdaFunction.addFunctionUrl({
      authType: FunctionUrlAuthType.NONE,
      cors: {
        allowedOrigins: [ "*"],
      },
    });

    // Website
    const bucket = new Bucket(this, "StockyardBucket", {
      accessControl: BucketAccessControl.PRIVATE,
    });

    new BucketDeployment(this, "BucketDeployment", {
      destinationBucket: bucket,
      sources: [Source.asset(path.resolve(__dirname, "../../dist"))],
    });

    const originAccessIdentity = new OriginAccessIdentity(
      this,
      "OriginAccessIdentity"
    );
    bucket.grantRead(originAccessIdentity);

    new Distribution(this, "Distribution", {
      defaultRootObject: "index.html",
      defaultBehavior: {
        origin: new S3Origin(bucket, { originAccessIdentity }),
      },
    });


    // s3 Buckets pdfs and zips
    const pdfBucket = new Bucket(this, "StockyardPDFBucket", {
      bucketName: "stockyard-pdf-bucket",
      accessControl: BucketAccessControl.PRIVATE,
    });

    const zipBucket = new Bucket(this, "StockyardZipBucket", {
      bucketName: "stockyard-zip-bucket",
      accessControl: BucketAccessControl.PRIVATE,
    });

    // Lambda permissions
    pdfBucket.grantReadWrite(lambdaFunction);
    zipBucket.grantReadWrite(lambdaFunction);

    // only store pdfs and zips in the respective buckets for 1 day
    pdfBucket.addLifecycleRule({
      expiration: cdk.Duration.days(1),
    });
    zipBucket.addLifecycleRule({
      expiration: cdk.Duration.days(1),
    });

  }
}
