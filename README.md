# Next-Gen Public Transportation Information system (PTiS)

본 repository에서는 IoT 디바이스에서 수집된 데이터를 AWS의 서버리스 Architecture를 데이터를 효과적으로 처리하고 사용자에게 편리한 메신저를 통해 전달하는 방법에 대해 설명하고자 합니다.

전체적인 Architecture 구조는 아래와 같습니다. 


![image](https://user-images.githubusercontent.com/52392004/161161317-b0c71c33-6e07-4dcd-85e3-b0fc815689e9.png)



사용 시나리오는 아래와 같습니다. 

1) 버스 또는 지하철에 있는 IoT 디바이스를 통해 만들어진 각종 이벤트는 AWS의 IoT core를 통해 수집됩니다.

2) IoT Core는 디바이스가 보내준 데이터를 활용 할 수 있도록 DynamoDB에 저장합니다. 

3) 저장된 데이터는 사용자가 API Gateway와 Lambda를 통해 조회 할수 있습니다.

4) 데이터중 도착 예상정보 및 빈좌석과 같은 유용한 정보는 슬랙을 이용하여 사용자가 편리하게 사용 할 수 있습니다. 



## Customer AS-IS

고객 시나리오의 AS-IS Architecture 는 다음과 같습니다.

![image](https://user-images.githubusercontent.com/102651767/161021380-5b8f6e4a-b3f8-4cc7-927a-067e00b2516e.png)

1) On-Premise 3-tier architecture 어플리케이션 구조 사용

2) 베어 메탈 및 가상화 혼재 구성

3) Real-time 이 지원되지 않는 Bus Info Gateway 사용

4) 상용 및 오픈소스 소프트웨어의 혼재된 사용으로 인한 운영 비효율



## Customer Pain Point 및 클라우드 구성 Requirement

고객의 Pain Point 및 클라우드 환경으로의 전환에 있어 필요한 Requirement 는 다음과 같습니다.

Picture1.png![image](https://user-images.githubusercontent.com/102651767/161022249-c1243e02-8f6b-4e9c-9a60-616bc4eb7850.png)


IOT Core는 아래와 같이 IoT 디바이스, 무선 게이트웨이, 서비스 및 앱과의 연결을 지원하는 서비스입니다. DB로 실시간 데이터를 수집하고 디바이스 관리시스템을 제공합니다. 또한 Serverless로 확장성 및 성능을 확보할 수 있으며, 디바이스 인증기능까지 제공하여 Data의 보안성을 확보할 수 있습니다. AWS IOT Core는 다양한 언의의 SDK 및 연결 샘풀을 제공합니다. 

<img width="359" alt="image" src="https://user-images.githubusercontent.com/52392004/161160656-2a936131-5259-4d2e-b456-c724167fd90c.png">

AWS DynamoDB는 확정성과 예측가능한 성능을 제공하는 완전관리형 NoSQL 데이터베이스입니다. 고성능으로 대량의 실시간 센터 데이터에 대한 쓰기 성능을 제공하여 10ms 미만의 지연시간을 제공할 수 있습니다. 역시 Serverless이므로 하드웨어 구축 및 관리 Cost를 최소화합니다. Key-Value형태로 데이터를 저장하여 서비스 추가 및 변경에 대한 유연성을 확보합니다. 무제한 스토리지와 처리량 확장이 가능하며 On-Demend와 Provisioned Mode를 제공하여 비용도 절감 할 수 있습니다. 

<img width="377" alt="image" src="https://user-images.githubusercontent.com/52392004/161160840-106cbd2c-2667-4425-894a-62086e25829f.png">



## Web Client 개발 

본 과제에서는 amplify를 이용하여 API 테스트를 위한 Web client를 제공합니다.

생성된 web client의 형상은 아래와 같습니다. 

![image](https://user-images.githubusercontent.com/52392004/161053081-011e925a-6473-45c8-8ccd-8113faf5cd12.png)


## Postman을 이용한 API 테스트 환경

Postman으로 RESTful api를 테스트시 아래를 참조합니다. 조회시 station_id와 bus_num를 사용하므로 아래와 같이 json형태로 입력을 받으며, 이때 얻어진 결과는 아래와 같이 기대되는 버스 대기 시간 및 예상 버스의 빈좌석 정보를 제공하게 됩니다. 이 API는 Android나 IOS에서 즉각적인 결과를 표시하기 위해 용이하며, 본 데모에서 제공하는 slack을 통해 좀더 편리하게 사용할 수도 있습니다. 

<img width="820" alt="image" src="https://user-images.githubusercontent.com/52392004/161053216-a3cc73e4-42ee-49d0-9e7c-3b661ceb4417.png">


## Slack을 이용한 Notification 전달

Slack으로 전달되는 버스에 대한 정보는 아래와 같습니다. 아래 케이스는 약간의 시간을 두고 Web client를 통해 getLocation API 호출하였을때의 결과입니다. 버스의 이동에 따라서 몇변후에 도착할지에 대한 정보를 제공하고 있으며, 몇 정거장전에 있는지와 몇개의 빈좌석이 있는지에 대한 정보를 상세하게 제공하고 있습니다. 

![image](https://user-images.githubusercontent.com/52392004/161054433-1a4e7ac2-3f12-40df-8d8d-6ecfad91825f.png)


