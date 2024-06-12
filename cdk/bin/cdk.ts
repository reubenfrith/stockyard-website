#!/usr/bin/env node
import 'source-map-support/register';
import * as cdk from 'aws-cdk-lib';
import { LambdaStack } from '../lib/lambda-stack';
import { accountId, regionId } from '../lib/config';
import { s3Stack } from '../lib/s3-stack';

export const resourceEnvironment: cdk.ResourceEnvironment = {
  account: accountId,
  region: regionId,
};

const app = new cdk.App();
new LambdaStack(app, 'CdkStack', {
  stackName: `stockyard-lambda-stack`,
  env: resourceEnvironment,
});
new s3Stack(app, 's3Stack', {
  stackName: `stockyard-s3-stack`,
  env: resourceEnvironment,
});