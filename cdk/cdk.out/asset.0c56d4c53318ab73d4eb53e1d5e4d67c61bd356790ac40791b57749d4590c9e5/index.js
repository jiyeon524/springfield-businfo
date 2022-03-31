const aws = require('aws-sdk');
const sns = new aws.SNS();

const tableName = "BusNumStationIdIndex";
//const indexName = "ContentID-index"; // GSI
const dynamo = new aws.DynamoDB.DocumentClient();

const topicArn = process.env.topicArn;

exports.handler = async (event, context) => {
    // console.log('## ENVIRONMENT VARIABLES: ' + JSON.stringify(process.env))
    // console.log('## EVENT: ' + JSON.stringify(event))
    
    //const body = Buffer.from(event["body-json"], "base64");
    // console.log('## EVENT: ' + JSON.stringify(event.params))
    // console.log('## EVENT: ' + JSON.stringify(event.context))

    //var id, timestamp; 
    const busNumber = 360;
    const stationId = 3; 
    // retrieve 
    var getParams = {
        TableName: tableName,
        Key: {
            bus_num: busNumber,
            station_id: stationId
        }
    };

    var dynamoGet; 
    try {
        dynamoGet = await dynamo.get(getParams).promise();

        console.log('get: '+JSON.stringify(dynamoGet));
    } catch (error) {
        console.log(error);
        return;
    }  

    if(dynamoGet.Count == 0) {  // the given Id is not exist
        const response = {
            statusCode: 404,
        };
        return response;
    }
    else {
        console.log('cnt = '+dynamoGet.Count);

        // publish to SNS
        //console.log('start sns: ' + id);
        var message = "test message";
        var snsParams = {
            Subject: 'Bus Location',
            Message: message,        
            TopicArn: topicArn
        }; 
        console.log('snsParams: '+JSON.stringify(snsParams));
        
        let snsResult;
        try {
        snsResult = await sns.publish(snsParams).promise();
        // console.log('snsResult:', snsResult);

    //      console.log('finish sns: ' + id);
        } catch (err) {
        console.log(err);
        }
    }

    // for return info
    const fileInfo = {
    }; 
    // console.log('file info: ' + JSON.stringify(fileInfo)) 

    const response = {
        statusCode: 200,
        headers: {
//          'ETag': id,
//          'Timestamp': timestamp
        },
        body: JSON.stringify(fileInfo)
    };
    return response;
};