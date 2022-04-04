# Demo의 데이터 수집 환경 (IoT Core & SDK)

설계된 Architecture 환경 구현 시 실제 버스에 탑재될 SDK를 MVP형태로 최소 구현
데이터 흐름은 버스 내 설치된 센서(위치 및 인원 수 감지) -> IoT SDK -> IoT Core -> DynamoDB 순
센서에서 감지될 데이터를 예상하여 임의의 데이터를 생성하도록 python sample SDK에 추가 구현하여 AWS Cloud9 환경에서 실행 (Linux / 1Core / 1GB)

## Data Format
* bus_num (Number) : 버스 번호. 현 Demo 환경에서는 360만 운행
* bus_id (Number) : 버스 식별 번호. 현 Demo 환경에서는 1 ~ 7 까지 총 7대 운행
* station_id (Number) : 도착한 정류장 번호. 현 Demo 환경에서는 0 ~ 24 까지 총 25개의 정류장을 순환 운행
* time_stamp (Number) : 정류장 도착한 시각. (UTC) 
* remain_seat (Number) : 정류장 도착 시 남은 잔여석. 현 Demo 환경에서는 0 ~ 30까지 랜덤으로 생성

## 사용방법
1. AWS IoT Core Thing 생성 (Thing Name : 360_001, ... , 360_007)
    1. Connect의 Get Started를 이용해 생성하면 디바이스 SDK 인증서와 start.sh를 함께 다운로드받을 수 있어 쉽습니다. (connect_device_package.zip 제공)
![image](https://user-images.githubusercontent.com/26076691/161575075-8ed734a2-cd95-4552-b5f3-90598d21e670.png)
2. Rule Action에 DynamoDBv2를 추가하여 전달하는 데이터를 각 컬럼에 저장하도록 Rule 생성
![image](https://user-images.githubusercontent.com/26076691/161575437-d2a61dca-9ea0-4c24-81a0-11425ab4a642.png)
3. 생성한 각 Thing의 Policy에 생성한 Rule로 전달하도록 topic 정보 수정
![image](https://user-images.githubusercontent.com/26076691/161575597-57cb87f2-bd65-43a6-9e50-d1e5c1b3ab15.png)
4. 생성한 Thing의 SDK 인증서를 Cloud9에 업로드
    1. 각 버스 별 인증서 파일을 모두 업로드 해야 합니다.
    2. run_360_bus.py를 참고하여 파일을 위치합니다.
5. start.sh 를 실행하여 샘플로 제공하는 python sample SDK를 다운로드
6. pubBusInfo.py를 aws-iot-device-sdk-python/samples/basicPubSub/ 폴더로 이동
7. run_360_bus.py 실행
![image](https://user-images.githubusercontent.com/26076691/161575980-5cc97340-05ea-4de0-a378-a3b36a8a3f8c.png)
8. 동작 중지 시, kill_bus.py 실행