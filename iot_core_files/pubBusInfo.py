'''
/*
 * Copyright 2010-2017 Amazon.com, Inc. or its affiliates. All Rights Reserved.
 *
 * Licensed under the Apache License, Version 2.0 (the "License").
 * You may not use this file except in compliance with the License.
 * A copy of the License is located at
 *
 *  http://aws.amazon.com/apache2.0
 *
 * or in the "license" file accompanying this file. This file is distributed
 * on an "AS IS" BASIS, WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either
 * express or implied. See the License for the specific language governing
 * permissions and limitations under the License.
 */
 '''
global get_delta, delta_value
get_delta = False
delta_value = None
# Custom Shadow callback
def customShadowCallback_Update(payload, responseStatus, token):
    # payload is a JSON string ready to be parsed using json.loads(...)
    # in both Py2.x and Py3.x
    if responseStatus == "timeout":
        print("Update request " + token + " time out!")
    if responseStatus == "accepted":
        payloadDict = json.loads(payload)
        print("~~~~~~~~~~~~~~~~~~~~~~~")
        print("Update request with token: " + token + " accepted!")
        print("property: " + str(payloadDict["state"]["reported"]["property"]))
        print("~~~~~~~~~~~~~~~~~~~~~~~\n\n")
    if responseStatus == "rejected":
        print("Update request " + token + " rejected!")

def customShadowCallback_Delete(payload, responseStatus, token):
    if responseStatus == "timeout":
        print("Delete request " + token + " time out!")
    if responseStatus == "accepted":
        print("~~~~~~~~~~~~~~~~~~~~~~~")
        print("Delete request with token: " + token + " accepted!")
        print("~~~~~~~~~~~~~~~~~~~~~~~\n\n")
    if responseStatus == "rejected":
        print("Delete request " + token + " rejected!")

# Custom Shadow callback
def customShadowCallback_Delta(payload, responseStatus, token):
    # payload is a JSON string ready to be parsed using json.loads(...)
    # in both Py2.x and Py3.x
    print(responseStatus)
    payloadDict = json.loads(payload)
    delta_value = str(payloadDict["state"]["property"])
    print("++++++++DELTA++++++++++")
    print("property: " + delta_value)
    print("version: " + str(payloadDict["version"]))
    print("+++++++++++++++++++++++\n\n")
    get_delta = True

from AWSIoTPythonSDK.MQTTLib import AWSIoTMQTTClient
import logging
import time
import argparse
import json
import random
from datetime import datetime
from AWSIoTPythonSDK.core.protocol.mqtt_core import MqttCore
import AWSIoTPythonSDK.core.shadow.shadowManager as shadowManager
import AWSIoTPythonSDK.core.shadow.deviceShadow as deviceShadow

AllowedActions = ['both', 'publish', 'subscribe']

# Custom MQTT message callback
def customCallback(client, userdata, message):
    print("Received a new message: ")
    print(message.payload)
    print("from topic: ")
    print(message.topic)
    print("--------------\n\n")
    payloadDict = json.loads(message.payload)
    global delta_value, get_delta
    delta_value = str(payloadDict["state"]["aircon"])
    print("++++++++DELTA++++++++++")
    print("property: " + delta_value)
    print("version: " + str(payloadDict["version"]))
    print("+++++++++++++++++++++++\n\n")
    get_delta = True


# Read in command-line parameters
parser = argparse.ArgumentParser()
parser.add_argument("-e", "--endpoint", action="store", required=True, dest="host", help="Your AWS IoT custom endpoint")
parser.add_argument("-r", "--rootCA", action="store", required=True, dest="rootCAPath", help="Root CA file path")
parser.add_argument("-c", "--cert", action="store", dest="certificatePath", help="Certificate file path")
parser.add_argument("-k", "--key", action="store", dest="privateKeyPath", help="Private key file path")
parser.add_argument("-p", "--port", action="store", dest="port", type=int, help="Port number override")
parser.add_argument("-w", "--websocket", action="store_true", dest="useWebsocket", default=False,
                    help="Use MQTT over WebSocket")
parser.add_argument("-n", "--thingName", action="store", dest="thingName", default="Bot", help="Targeted thing name")
parser.add_argument("-id", "--clientId", action="store", dest="clientId", default="360_001",
                    help="Targeted client id")
parser.add_argument("-t", "--topic", action="store", dest="topic", default="$aws/rules/buslocation/iot/bus", help="Targeted topic")
parser.add_argument("-m", "--mode", action="store", dest="mode", default="both",
                    help="Operation modes: %s"%str(AllowedActions))
parser.add_argument("-M", "--message", action="store", dest="message", default="Hello World!",
                    help="Message to publish")

args = parser.parse_args()
host = args.host
rootCAPath = args.rootCAPath
certificatePath = args.certificatePath
privateKeyPath = args.privateKeyPath
port = args.port
useWebsocket = args.useWebsocket
clientId = args.clientId
thingName = clientId
MQTTv3_1_1 = 4

topic = args.topic

if args.mode not in AllowedActions:
    parser.error("Unknown --mode option %s. Must be one of %s" % (args.mode, str(AllowedActions)))
    exit(2)

if args.useWebsocket and args.certificatePath and args.privateKeyPath:
    parser.error("X.509 cert authentication and WebSocket are mutual exclusive. Please pick one.")
    exit(2)

if not args.useWebsocket and (not args.certificatePath or not args.privateKeyPath):
    parser.error("Missing credentials for authentication.")
    exit(2)

# Port defaults
if args.useWebsocket and not args.port:  # When no port override for WebSocket, default to 443
    port = 443
if not args.useWebsocket and not args.port:  # When no port override for non-WebSocket, default to 8883
    port = 8883

# Configure logging
logger = logging.getLogger("AWSIoTPythonSDK.core")
logger.setLevel(logging.DEBUG)
streamHandler = logging.StreamHandler()
formatter = logging.Formatter('%(asctime)s - %(name)s - %(levelname)s - %(message)s')
streamHandler.setFormatter(formatter)
logger.addHandler(streamHandler)

# Init AWSIoTMQTTClient
myAWSIoTMQTTClient = None
if useWebsocket:
    myAWSIoTMQTTClient = AWSIoTMQTTClient(clientId, useWebsocket=True)
    myAWSIoTMQTTClient.configureEndpoint(host, port)
    myAWSIoTMQTTClient.configureCredentials(rootCAPath)
else:
    myAWSIoTMQTTClient = AWSIoTMQTTClient(clientId)
    myAWSIoTMQTTClient.configureEndpoint(host, port)
    myAWSIoTMQTTClient.configureCredentials(rootCAPath, privateKeyPath, certificatePath)

# AWSIoTMQTTClient connection configuration
myAWSIoTMQTTClient.configureAutoReconnectBackoffTime(1, 32, 20)
myAWSIoTMQTTClient.configureOfflinePublishQueueing(-1)  # Infinite offline Publish queueing
myAWSIoTMQTTClient.configureDrainingFrequency(2)  # Draining: 2 Hz
myAWSIoTMQTTClient.configureConnectDisconnectTimeout(10)  # 10 sec
myAWSIoTMQTTClient.configureMQTTOperationTimeout(5)  # 5 sec

# Connect and subscribe to AWS IoT
myAWSIoTMQTTClient.connect()

#shadowManager = shadowManager.shadowManager(MqttCore(clientId, True, MQTTv3_1_1, useWebsocket))
#deviceShadowHandler = deviceShadow.deviceShadow(thingName, True, shadowManager)

# Create a deviceShadow with persistent subscription
#deviceShadowHandler = myAWSIoTMQTTClient.createShadowHandlerWithName(thingName, True)

# Listen on deltas
#deviceShadowHandler.shadowRegisterDeltaCallback(customShadowCallback_Delta)
if args.mode == 'both' or args.mode == 'subscribe':
        sub_topic = '$aws/things/'+clientId+'/shadow/update/delta'
        myAWSIoTMQTTClient.subscribe(sub_topic, 0, customCallback)
time.sleep(2)

# Publish to the same topic in a loop forever
loopCount = 0
bus_num, bus_id = clientId.split('_')
loopCount += int(bus_id)*3

while True:
    if args.mode == 'both' or args.mode == 'publish':

        t = datetime.utcnow() 
        timeInSeconds = int((t-datetime(1970,1,1)).total_seconds())
        message = {}
        message['bus_num'] = int(bus_num)
        message['bus_id'] = int(bus_id)
        message['station_id'] = loopCount % 25
        message['time_stamp'] = timeInSeconds
        message['remain_seat'] = int(round(random.uniform(0, 30), 0))
        message['sequence'] = loopCount
        messageJson = json.dumps(message)
        myAWSIoTMQTTClient.publish(topic, messageJson, 1)
        if args.mode == 'publish':
            print('Published topic %s: %s\n' % (topic, messageJson))
        loopCount += 1
        #movingTime = 90 + int(round(random.uniform(0, 90), 0))
        # 120sec
        for i in range(1, 24):
            if get_delta:
                print("~~~~~~~~~~~~~~~~~~~~~~~")
                JSONPayload = '{"state":{"reported":{"aircon":"' + delta_value + '"}}}'
                print(JSONPayload)
                global get_delta 
                get_delta = False
                pub_topic = '$aws/things/'+clientId+'/shadow/update'
                myAWSIoTMQTTClient.publish(pub_topic, JSONPayload, 0)
            time.sleep(5) 
