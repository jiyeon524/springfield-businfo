#!/usr/bin/env bash


SET=$(seq 1 7)

for i in $SET

do
    echo "Running loop seq "$i

    NUM=00$i
    BUS_NAME=360_$NUM
    echo $BUS_NAME
    echo "pid check start"$BUS_NAME
    process_chk=`ps -ef |  grep "$BUS_NAME" | awk '{print $2}'`
    echo $process_chk
    if [ "$process_chk" != "" ] 
    then
        echo "프로세스 PID : $process_chk"
        kill $process_chk
        echo "pid check end"
    fi
done
