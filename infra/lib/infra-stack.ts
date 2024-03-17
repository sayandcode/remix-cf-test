import path = require('node:path');
import {CfnOutput, RemovalPolicy, Stack, StackProps} from 'aws-cdk-lib';
import * as IAM from 'aws-cdk-lib/aws-iam';
import * as Lambda from 'aws-cdk-lib/aws-lambda';
import * as S3 from 'aws-cdk-lib/aws-s3';
import * as S3Deployment from 'aws-cdk-lib/aws-s3-deployment';
import { Construct } from 'constructs';

type AppServerEnv = {
  NODE_ENV: 'production',
  ASSET_STORE_BASE_URL: string,
}

const PATH_TO_WEB_APP_DIR = path.join(__dirname, '../../web-app/');

/** The folder in s3 inside which you want to put your static build assets  */
const APP_BUILD_ASSETS_S3_DIR = 'static';

export class InfraStack extends Stack {
  constructor(scope: Construct, id: string, props?: StackProps) {
    super(scope, id, props);

    const pathToLambdaCode = path.join(PATH_TO_WEB_APP_DIR, './dist/')
    const appServerLambda = new Lambda.Function(this, 'app-server', {
      code: Lambda.Code.fromAsset(pathToLambdaCode),
      runtime: Lambda.Runtime.NODEJS_20_X,
      handler: 'lambda.handler',
      environment: {
        NODE_ENV: 'production',
        ASSET_STORE_BASE_URL: '',
      } satisfies AppServerEnv,
    })

    const appServerLambdaUrl = appServerLambda.addFunctionUrl({
      authType: Lambda.FunctionUrlAuthType.NONE,
    })

    const appBucket = new S3.Bucket(this, 'app-bucket', {
      bucketName: `${id.toLowerCase()}-app-bucket`,
      encryption: S3.BucketEncryption.S3_MANAGED,
      autoDeleteObjects: true,
      enforceSSL: true,
      minimumTLSVersion: 1.2,
      accessControl: S3.BucketAccessControl.PRIVATE, 
      blockPublicAccess: new S3.BlockPublicAccess({
        blockPublicAcls: false,
        blockPublicPolicy: false,
        ignorePublicAcls: false,
        restrictPublicBuckets: false,
      }),
      removalPolicy: RemovalPolicy.DESTROY,
      objectOwnership: S3.ObjectOwnership.BUCKET_OWNER_ENFORCED,     
    });

    const pathToAppBuildAssets = path.join(PATH_TO_WEB_APP_DIR, './public/');
    new S3Deployment.BucketDeployment(this, 'app-build-assets', {
      destinationBucket: appBucket,
      sources: [S3Deployment.Source.asset(pathToAppBuildAssets)],
      destinationKeyPrefix: APP_BUILD_ASSETS_S3_DIR,
      prune: true,
      retainOnDelete: false,
    })

    const policyToAllowPublicAccessToAppBuildAssets = new IAM.PolicyStatement({
      effect: IAM.Effect.ALLOW,
      principals: [new IAM.StarPrincipal()],
      actions: ["s3:GetObject"],
      resources: [ appBucket.arnForObjects(`${APP_BUILD_ASSETS_S3_DIR}/*`)],
    })
    appBucket.addToResourcePolicy(policyToAllowPublicAccessToAppBuildAssets)

    appBucket.addCorsRule({
      allowedMethods: [S3.HttpMethods.GET],
      allowedOrigins: ["*"],
      maxAge: 3000,
    });

    appServerLambda.addEnvironment(
      'ASSET_STORE_BASE_URL' satisfies keyof AppServerEnv,
      `https://${appBucket.bucketRegionalDomainName}/${APP_BUILD_ASSETS_S3_DIR}`
    );

    new CfnOutput(this, 'finalStuff', {
      value: JSON.stringify({
        lambdaUrl: appServerLambdaUrl.url,
        assetStoreBaseUrl: `https://${appBucket.bucketDomainName}/${APP_BUILD_ASSETS_S3_DIR}`,
      })
    })
  }
}
