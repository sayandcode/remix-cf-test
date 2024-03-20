import path = require('node:path');
import {CfnElement, CfnOutput, Duration, Fn, RemovalPolicy, Stack, StackProps} from 'aws-cdk-lib';
import * as Lambda from 'aws-cdk-lib/aws-lambda';
import * as S3 from 'aws-cdk-lib/aws-s3';
import * as ACM from 'aws-cdk-lib/aws-certificatemanager'
import * as S3Deployment from 'aws-cdk-lib/aws-s3-deployment';
import * as Cloudfront from 'aws-cdk-lib/aws-cloudfront';
import * as CloudfrontOrigins from 'aws-cdk-lib/aws-cloudfront-origins';
import { Construct } from 'constructs';
import getEnvVars from './env';

type AppServerEnv = {
  NODE_ENV: 'production',
}

const ENV_VARS = getEnvVars();

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

    if (!ENV_VARS.APP_CUSTOM_DOMAIN) throw new Error('Please set the custom domain in env variables');

    const appCustomDomainCert = ACM.Certificate.fromCertificateArn(
      this,
      'app-custom-domain-cert',
      ENV_VARS.APP_CUSTOM_DOMAIN_CERT_ARN);

    const appCdn = new Cloudfront.Distribution(this, 'app-cdn', {
      domainNames: [ENV_VARS.APP_CUSTOM_DOMAIN],
      certificate: appCustomDomainCert,
      defaultBehavior: {
        origin: new CloudfrontOrigins.FunctionUrlOrigin(appServerLambdaUrl),
        allowedMethods: Cloudfront.AllowedMethods.ALLOW_ALL,
        cachePolicy: new Cloudfront.CachePolicy(this, 'cache-policy-for-app-server', {
          comment: "Allows the origin server to set the cache behaviour",
          defaultTtl: Duration.seconds(0),
          minTtl: Duration.seconds(0),
          enableAcceptEncodingGzip: true,
          enableAcceptEncodingBrotli: true,
          queryStringBehavior: Cloudfront.CacheQueryStringBehavior.all(),
        }),
        originRequestPolicy: Cloudfront.OriginRequestPolicy.ALL_VIEWER_EXCEPT_HOST_HEADER,
        viewerProtocolPolicy: Cloudfront.ViewerProtocolPolicy.REDIRECT_TO_HTTPS,
      },
      additionalBehaviors: {
        [`/${APP_BUILD_ASSETS_S3_DIR}/*`]: {
          origin: new CloudfrontOrigins.S3Origin(appBucket),
          cachePolicy: Cloudfront.CachePolicy.CACHING_OPTIMIZED,
          viewerProtocolPolicy: Cloudfront.ViewerProtocolPolicy.REDIRECT_TO_HTTPS,
        }
      }
    })

    const pathToAppBuildAssets = path.join(PATH_TO_WEB_APP_DIR, './public/');
    new S3Deployment.BucketDeployment(this, 'app-build-assets', {
      destinationBucket: appBucket,
      sources: [S3Deployment.Source.asset(pathToAppBuildAssets)],
      destinationKeyPrefix: APP_BUILD_ASSETS_S3_DIR,
      prune: true,
      retainOnDelete: false,
      distribution: appCdn,
    })

    appBucket.addCorsRule({
      allowedMethods: [S3.HttpMethods.GET],
      allowedOrigins: ["*"],
      maxAge: 3000,
    });

    new CfnOutput(this, 'cdn-final-url', {
      value: `https://${appCdn.domainName}`,
      description: "The Cloudfront URL where you can access the app."
    })
    new CfnOutput(this, 'app-final-url', {
      value: `https://${ENV_VARS.APP_CUSTOM_DOMAIN}`,
      description: "The App URL where you can access the app."
    })
    new CfnOutput(this, 'lambda-url', {
      value: appServerLambdaUrl.url,
      description: "The URL where the lambda function is hosted"
    })
    new CfnOutput(this, 'app-s3-url', {
      value: appBucket.bucketDomainName,
      description: "The URL of the S3 bucket where the app assets are hosted"
    })
  }
}
