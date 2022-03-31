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



