#!/usr/bin/env bash


SET=$(seq 1 7)

for i in $SET

do
    echo "Running loop seq "$i

    NUM=00$i
    BUS_NAME=360_$NUM
    echo $BUS_NAME
    python aws-iot-device-sdk-python/samples/basicPubSub/pubBusInfo.py -id $BUS_NAME -e a1hfizwpbl51nd-ats.iot.ap-northeast-2.amazonaws.com -r root-CA.crt -c $BUS_NAME/$BUS_NAME.cert.pem -k $BUS_NAME/$BUS_NAME.private.key >> $BUS_NAME.log &
    sleep 5
done



