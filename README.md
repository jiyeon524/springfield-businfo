# Next-Gen Public TransportationInformation system (PTiS)

본 repository에서는 IoT 디바이스에서 수집된 데이터를 AWS의 서버리스 Architecture를 데이터를 효과적으로 처리하고 사용자에게 편리한 메신저를 통해 전달하는 방법에 대해 설명하고자 합니다.

전체적인 Architecture 구조는 아래와 같습니다. 

![image](https://user-images.githubusercontent.com/52392004/160986136-1bc4eaf2-8bed-4d17-9017-fae54596706a.png)

사용 시나리오는 아래와 같습니다. 

1) 버스 또는 지하철에 있는 IoT 디바이스를 통해 만들어진 각종 이벤트는 AWS의 IoT core를 통해 수집됩니다.

2) IoT Core는 디바이스가 보내준 데이터를 활용할수 있도록 DynamoDB에 저장합니다. 

3) 저장된 데이터는 사용자가 API Gateway와 Lambda를 통해 조회 할수 있습니다.

4) 데이터중 도착 예상정보 및 빈좌석과 같은 유용한 정보는 슬랙을 이용하여 사용자가 편리하게 사용 할 수 있습니다. 


## Customer AS-IS

![image](https://user-images.githubusercontent.com/52392004/160986701-32068d9f-0435-4b9b-94e6-62c12398f26d.png)


