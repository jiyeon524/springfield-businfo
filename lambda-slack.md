## Slack과 연동을 위한 Lambda Code 

여기서는 Slack Bot을 이용한 메시저 전송 방식에 대해 설명합니다. 


Slack과 연동을 위해서는 아래와 같이 slack에 대한 token을 가져와야 합니다. 그리고 slack과 연동을 위하여 @slack/web-api 라이브러리를 호출합니다. 해당 라이브러니는 "npm install" 명령어를 통해 repository에 저장되어 있어야 합니다. 
해당 코드는 CDK를 통해 자동으로 배포되지만, 별도로 배포를 원할 경우에는 zip으로 압축하여 lambda console에서 배포 할 수 있습니다. 

```java
const token = process.env.token;
const { WebClient } = require('@slack/web-api');
```


Slack으로 메시지 전송을 위해, 아래와 같이 "postMessage" api를 호출합니다. 이때 채널 이름은 아래와 같이 특정하여야 합니다. 여기서는 시연을 위해 "SpringField"라는 workspace를 만들고 "springbotenv"라는 채널로 메시지를 전송하게 됩니다. 

```java
  var isCompleted = false, statusCode = 200;
  (async () => {
    try {
      // Use the `chat.postMessage` method to send a message from this app
      let result = await web.chat.postMessage({
        channel: 'springbotenv',
        text: message,
      });
      
      console.log('response: '+ JSON.stringify(result));
      console.log('### ok: '+result.ok);

      isCompleted = true, statusCode = 200;

    } catch (error) {
      console.log(error);

      isCompleted = true, statusCode = 500;      
    }  
  })(); 
```

Lambda의 처리해야 할 event가 완성되면, 바로 종료됩니다. 
그런데 slack bot에 메시지 전송후 응답을 받지 못하면 메시지 전송이 실패될 수 있습니다. 따라서 아래와 같이 1초 단위로 timer를 두어서 메시지를 전송할 수 있습니다. 

```java
function wait(){
    return new Promise((resolve, reject) => {
      if(!isCompleted) {
        setTimeout(() => resolve("wait..."), 1000)
      }
      else {
        setTimeout(() => resolve("closing..."), 0)
      }
    });
  }
  console.log(await wait());
  console.log(await wait());
  console.log(await wait());
  console.log(await wait());
```
