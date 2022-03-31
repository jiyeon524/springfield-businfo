# Next-Gen Public Transportation Information system (PTiS)

본 repository에서는 IoT 디바이스에서 수집된 데이터를 AWS의 서버리스 Architecture를 데이터를 효과적으로 처리하고 사용자에게 편리한 메신저를 통해 전달하는 방법에 대해 설명하고자 합니다.

전체적인 Architecture 구조는 아래와 같습니다. 

![image](https://user-images.githubusercontent.com/102651767/161021259-08f5de4c-42ce-4e82-9d6f-d401dcd0af4e.png)

사용 시나리오는 아래와 같습니다. 

1) 버스 또는 지하철에 있는 IoT 디바이스를 통해 만들어진 각종 이벤트는 AWS의 IoT core를 통해 수집됩니다.

2) IoT Core는 디바이스가 보내준 데이터를 활용할수 있도록 DynamoDB에 저장합니다. 

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


## Web Clinet

본 과제에서는 amplify를 이용하여 API 테스트를 위한 Web client를 제공합니다.

생성된 web client의 형상은 아래와 같습니다. 

![image](https://user-images.githubusercontent.com/52392004/161053081-011e925a-6473-45c8-8ccd-8113faf5cd12.png)


## Postman을 위한 테스트 환경 

Postman으로 RESTful api를 테스트시 아래를 참조합니다. 조회시 station_id와 bus_num를 사용하므로 아래와 같이 json형태로 입력을 받으며, 이때 얻어진 결과는 아래와 같이 기대되는 버스 대기 시간 및 예상 버스의 빈좌석 정보를 제공하게 됩니다. 이 API는 Android나 IOS에서 즉각적인 결과를 표시하기 위해 용이하며, 본 데모에서 제공하는 slack을 통해 좀더 편리하게 사용할 수도 있습니다. 

<img width="820" alt="image" src="https://user-images.githubusercontent.com/52392004/161053216-a3cc73e4-42ee-49d0-9e7c-3b661ceb4417.png">


## Slack의 전달된 Notification 

Slack으로 전달되는 버스에 대한 정보는 아래와 같습니다. 아래 케이스는 약간의 시간을 두고 Web client를 통해 getLocation API 호출하였을때의 결과입니다. 버스의 이동에 따라서 몇변후에 도착할지에 대한 정보를 제공하고 있으며, 몇 정거장전에 있는지와 몇개의 빈좌석이 있는지에 대한 정보를 상세하게 제공하고 있습니다. 

![image](https://user-images.githubusercontent.com/52392004/161053838-7132440b-c2f9-4cfc-9fcb-1cf9d1ce500d.png)



