import { Stack, StackProps } from 'aws-cdk-lib';
import { Construct } from 'constructs';
import * as cdk from 'aws-cdk-lib';

const sqs = require('aws-cdk-lib/aws-sqs');
const {SqsEventSource} = require('aws-cdk-lib/aws-lambda-event-sources');
const {SnsEventSource} = require('aws-cdk-lib/aws-lambda-event-sources');
const sns = require('aws-cdk-lib/aws-sns');
const subscriptions = require('aws-cdk-lib/aws-sns-subscriptions');
const lambda = require('aws-cdk-lib/aws-lambda');
const apiGateway = require('aws-cdk-lib/aws-apigateway');
const dynamodb = require('aws-cdk-lib/aws-dynamodb');
const s3 = require('aws-cdk-lib/aws-s3');
const iam = require('aws-cdk-lib/aws-iam');
const cloudFront = require('aws-cdk-lib/aws-cloudfront');
const origins = require('aws-cdk-lib/aws-cloudfront-origins');
const logs = require('aws-cdk-lib/aws-logs');

const stage = "dev";

export class CdkStack extends Stack {
  constructor(scope: Construct, id: string, props?: StackProps) {
    super(scope, id, props);

    // SNS
    const topic = new sns.Topic(this, 'sns-springfield', {
      topicName: 'sns-springfield'
    });
 //   topic.addSubscription(new subscriptions.EmailSubscription('storytimebot21@gmail.com'));

    // DynamoDB
    const dataTable = new dynamodb.Table(this, 'BusLocationInfo', {
      tableName: 'BusLocationInfo',
        partitionKey: { name: 'bus_num', type: dynamodb.AttributeType.STRING },
        sortKey: { name: 'station_id', type: dynamodb.AttributeType.STRING },
        billingMode: dynamodb.BillingMode.PAY_PER_REQUEST,
        // readCapacity: 1,
        // writeCapacity: 1,
      //  removalPolicy: cdk.RemovalPolicy.DESTROY,
    });
    dataTable.addGlobalSecondaryIndex({ // GSI
      indexName: 'BusNumStationIdIndex',
      partitionKey: { name: 'bus_num', type: dynamodb.AttributeType.NUMBER },
      sortKey: { name: 'station_id', type: dynamodb.AttributeType.NUMBER },      
    });  

    // S3
    const s3Bucket = new s3.Bucket(this, "s3-springfield",{
      removalPolicy: cdk.RemovalPolicy.DESTROY,
      autoDeleteObjects: true,
      publicReadAccess: false,
      versioned: false,
    });

    new cdk.CfnOutput(this, 'bucketName', {
      value: s3Bucket.bucketName,
      description: 'The nmae of bucket',
    });

    const distribution = new cloudFront.Distribution(this, 'springfield', {
      defaultBehavior: {
        origin: new origins.S3Origin(s3Bucket),
        allowedMethods: cloudFront.AllowedMethods.ALLOW_ALL,
        priceClass: cloudFront.PriceClass.PriceClass200,  
        viewerProtocolPolicy: cloudFront.ViewerProtocolPolicy.REDIRECT_TO_HTTPS,
        discription: 'cdk cloudFront - bus-info'
      },
    });

    new cdk.CfnOutput(this, 'distributionDomainName', {
      value: distribution.domainName,
      description: 'The domain name of the Distribution',
    }); 

    // Lambda - getLocation
    const lambdaGetLocation = new lambda.Function(this, "lambdaGetLocation", {
      runtime: lambda.Runtime.NODEJS_14_X, 
      code: lambda.Code.fromAsset("repositories/lambda-for-getLocation"), 
      handler: "index.handler", 
      timeout: cdk.Duration.seconds(10),
      environment: {
        topicArn: topic.topicArn,
        bucket: s3Bucket.bucketName
      }
    });  
    dataTable.grantReadWriteData(lambdaGetLocation);
    topic.grantPublish(lambdaGetLocation);

    // Lambda - Slack
    const lambdaSlack = new lambda.Function(this, "LambdaSlack", {
      runtime: lambda.Runtime.NODEJS_14_X, 
      code: lambda.Code.fromAsset("repositories/lambda-for-slack"), 
      handler: "index.handler", 
      timeout: cdk.Duration.seconds(10),
      environment: {
      //  token: "xoxb-manually-updated"
      }
    });    
    lambdaSlack.addEventSource(new SnsEventSource(topic)); 

    // api Gateway
    const logGroup = new logs.LogGroup(this, 'AccessLogs', {
      retention: 90, // Keep logs for 90 days
    });
    logGroup.grantWrite(new iam.ServicePrincipal('apigateway.amazonaws.com')); 

    const api = new apiGateway.RestApi(this, 'api-springfield', {
      description: 'API Gateway',
      endpointTypes: [apiGateway.EndpointType.REGIONAL],
      deployOptions: {
        stageName: stage,
        accessLogDestination: new apiGateway.LogGroupLogDestination(logGroup),
        accessLogFormat: apiGateway.AccessLogFormat.jsonWithStandardFields({
          caller: false,
          httpMethod: true,
          ip: true,
          protocol: true,
          requestTime: true,
          resourcePath: true,
          responseLength: true,
          status: true,
          user: true
        }),
      },
      proxy: false
    });   

    lambdaGetLocation.grantInvoke(new iam.ServicePrincipal('apigateway.amazonaws.com'));

    const getLocation = api.root.addResource('getLocation');
    getLocation.addMethod('GET', new apiGateway.LambdaIntegration(lambdaGetLocation, {
      PassthroughBehavior: apiGateway.PassthroughBehavior.WHEN_NO_TEMPLATES,
      integrationResponses: [{
        statusCode: '200',
      }], 
      proxy:false, 
    }), {
      methodResponses: [   // API Gateway sends to the client that called a method.
        {
          statusCode: '200',
          responseModels: {
            'application/json': apiGateway.Model.EMPTY_MODEL,
          }, 
        }
      ]
    }); 
    
    new cdk.CfnOutput(this, 'apiUrl', {
      value: api.url,
      description: 'The url of API Gateway',
    });    
  }
}
