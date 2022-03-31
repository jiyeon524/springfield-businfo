const aws = require('aws-sdk');
const sns = new aws.SNS();

const tableName = "BusLocationInfo";
const indexName = "BusNumStationIdIndex"; // GSI
const dynamo = new aws.DynamoDB.DocumentClient();

const topicArn = process.env.topicArn;

exports.handler = async (event, context) => {
    // console.log('## ENVIRONMENT VARIABLES: ' + JSON.stringify(process.env))
    // console.log('## EVENT: ' + JSON.stringify(event))    
    
    const body = Buffer.from(event["body-json"], "base64");
    const userReq = JSON.parse(body);

    //var id, timestamp; 
    const busNumber = userReq['bus_num'];
    const stationId = userReq['station_id']; 
    console.log('request: busNumber='+busNumber+', stationId='+stationId);
    
    var count = 0;

    var queryParams = {
        TableName: tableName,
        IndexName: indexName,    
        KeyConditionExpression: "bus_num = :bus_num",
        ExpressionAttributeValues: {
            ":bus_num": busNumber
        }
    };

    var dynamoQuery; 
    try {
        dynamoQuery = await dynamo.query(queryParams).promise();

        console.log('queryDynamo: '+JSON.stringify(dynamoQuery));
        console.log('queryDynamo: '+dynamoQuery.Count);   
        count = dynamoQuery.Count;
    } catch (error) {
      console.log(error);
      return;
    } 

    console.log('cnt: '+count);

    var nearest; // the nearest bus information
    var diff;  // the difference between the destination and the nearest bus
    var message; // notification messation
        
    if(dynamoQuery.Count == 0) {  // the given Id is not exist
        const response = {
            statusCode: 404,
        };
        
        message = '현재 가능한 버스노선이 확인되지 않고 있습니다. 잠시후에 다시 시도해주시기 바랍니다.';
    }
    else { 
        // remove duplications
        var location = [];
        for(i=0;i<count;i++) {
            const info = {
                timeStamp: dynamoQuery['Items'][i]['time_stamp'],
                stationId: dynamoQuery['Items'][i]['station_id'],
                busNum: dynamoQuery['Items'][i].bus_num,
                remainSeat: dynamoQuery['Items'][i].remain_seat,
                busId: dynamoQuery['Items'][i].bus_id         
            };

            var isExist = false;
            for(var j=0;j<location.length;j++) {
                if(location[j].busId == info.busId) {
                    isExist = true;
                    if(location[j].timeStamp < info.timeStamp) {
                        location[j] = info;
                    }
                    else {
                        break;
                    }
                }
            }

            if(!isExist) location.push(info);
        }

        console.log('length: '+location.length);
        console.log('data: '+JSON.stringify(location));

        var nearest = location[0];
        var diff = 100;
        for(var i=1;i<location.length;i++) {
            if(location[i].stationId > stationId) continue;
            else if(location[i].stationId > stationId) {
                nearest = location[i];
                break;
            }
            else {
                var dist = stationId - location[i].stationId;
                if(dist < diff) {
                    nearest = location[i];
                    diff = dist;
                }
            }
        }

        console.log('dist: '+diff+', nearest: '+JSON.stringify(nearest));

        // publish to SNS
        if(dist==0) {
            message = '현재 버스가 도착하였습니다. '+nearest.remainSeat+'개의 빈좌석이 남아 있습니다.'; 
        }
        else if(dist==0) {
            message = '현재 가능한 버스노선이 확인되지 않고 있습니다. 잠시후에 다시 시도해주시기 바랍니다.';
        }
        else {
            message = dist+'분후에 버스가 도착할 예정입니다. 현재 버스는 '+dist+'정거장 전에 있으며, '+' 현재 '+nearest.remainSeat+'개의 빈좌석이 남아 있습니다.'; 
        }
    }

    // publish
    var snsParams = {
        Subject: 'Bus 도착정보',
        Message: message,        
        TopicArn: topicArn
    }; 
    console.log('snsParams: '+JSON.stringify(snsParams));
    let snsResult;
    try {
        snsResult = await sns.publish(snsParams).promise();
        // console.log('snsResult:', snsResult);

    } catch (err) {
        console.log(err);
    }

    // for return info
    const fileInfo = {
        exptectedTime: diff*1, 
        busInfo: nearest
    }; 
    console.log('file info: ' + JSON.stringify(fileInfo)) 

    const response = {
        statusCode: 200,
        body: JSON.stringify(fileInfo)
    };
    return response;
};