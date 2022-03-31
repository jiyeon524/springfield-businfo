# CDK

장기적으로 인프라를 관리하기 위해서는 IaC(Infrastructure as Code) 툴이 필요합니다. 여기서는 Amazon CDK를 이용해 순쉽게 인프라를 관리하는 방법에 대해 소개 합니다. 

## 서비스 Module 배치 순서 

Console에서 구현시에는 API Gateway - Lambdas - SNS - DynamoDB - S3 등 먼저 연결되는 모듈을 먼저 만들고 독립된 모듈을 넣는것이 순서적으로 편리한데, CDK에서는 SNS - DynamoDB - S3 - Lambdas - API Gateway의 순서로 독립된 모듈을 먼저 놓고 연결되는 모듈을 넣는것이 좋습니다. 

여기서는 CDK V2으로 개발하였고, 개발언어로는 Typescript를 사용하였습니다. CDK이외의 각 Lambda는 독립된 언어로 포팅이 가능합니다. 여기서는 Lamada는 Node.js로 구현합니다. 

#### Import CDK V2

CDK init시에 기본설치되는 코드는 V2기준인데, 아직 대부분의 레퍼런스들은 V1기준입니다. V1으로 작성된 코드를 그대로 가져오면 일부 동작안하는 케이스가 있으므로 주의합니다. 

```java
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
```


### Amazon SNS

Lambda가 SNS topic 호출시 ARN을 사용하는데, 아래와 같이 topicArn을 이용합니다. topic에 대한 subscription은 아래와 같이 "sns-springfield"을 import하여 구현할 수 있습니다. 

```java
    const topic = new sns.Topic(this, 'sns-springfield', {
      topicName: 'sns-springfield'
    });
```

### DynamoDB

아래와 같이 DynamoDB의 partition key와 sort key를 정의하고, 인덱싱을 위해 GSI도 등록합니다. 

```java
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
```


### S3

아래와 S3의 Bucket을 정의하고, 외부 접속을 disable할 수 있습니다. Lambda가 이용하는 bucket이름도 아래처럼 bucketName을 이용하여 인자로 사용합니다. 

```java
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
```

### CloudFront

```java
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
```

### Lambda

CDK에서 Lambda정의시 아래처럼 repositories에 git code를 넣어두면, Lambda 생성시 모든 코드를 자동으로 올려줍니다. 이때 Lambda에서 필요한 SQS URL, SNS ARN(topic), bucket이름을 Environment로 등록할 수 있습니다.

```java
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
```

### API Gateway

API Gateway는 아래와 같이 선언합니다. 

```java
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
```
