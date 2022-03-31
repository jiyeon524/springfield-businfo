## getLocation API를 구현하기 위한 Lambda 코드 

client에서 요청은 event의 형태로 lambda로 들어오며, Lambda for getLocation은 dynomodb를 조회하여 필요한 데이터를 로딩한후, 가장 가까운 버스를 찾고 해당 버스의 정보로 사용자에게 알려줄 notification을 생성합니다. 

입력된 데이터는 아래와 같이 body-json을 base64로 decoding후 bus번호와 station의 ID를 추출합니다.

```java
    const body = Buffer.from(event["body-json"], "base64");
    const userReq = JSON.parse(body);

    const busNumber = userReq['bus_num'];
    const stationId = userReq['station_id']; 
    console.log('request: busNumber='+busNumber+', stationId='+stationId);
```


### DynamoDB의 정보 조회
이때 dynamodb의 Global Secondary Index는 버스 번호와 station ID로 되어 있는데, 아래와 같이 버스 번호를 가지고 관련된 모든 데이터를 읽어 옵니다. 

```java
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
```

가져온 데이터에서 가장 최신의 데이터를 중복된 데이터를 overwrite하는 방법으로 아래와 같이 추출합니다. 

```java
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
```

지나간 버스는 제외하고 앞으로 해당 station에 도착할 BUS에서 가장 빨리 도착할 버스의 정보를 아래와 같이 추출합니다. 

```java
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
```

목적지의 버스의 위치가 같은 경우, 가까운 버스가 없는 경우를 구분하여 아래처럼 메시지를 생성합니다. 그리고 가까운 버스를 찾으면 도착할 시간을 예측하여 빈좌석에 대한 정보를 제공합니다. 

```java
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
```

추출한 메시지를 SNS를 통해 Slack으로 전송합니다. 

```java
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
```


