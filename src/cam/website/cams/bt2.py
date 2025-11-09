from voxel_sdk.device_controller import DeviceController
from voxel_sdk.ble import BleVoxelTransport  # or VoxelTransport
import time
import os
from dotenv import load_dotenv

Wifi_ssid = os.getenv('Wifi_ssid')
Wifi_password = os.getenv('Wifi_password')
Web_host_ip = os.getenv('Web_host_ip')
def initialize_cam():
    transport = BleVoxelTransport(device_name="voxel")
    try:
        transport.connect("")
    except:
        print("bt error")
    controller = DeviceController(transport)
    try:
        print(controller.filesystem.connect_wifi(ssid=Wifi_ssid, password=Wifi_password))
    except:
        print("connection error")
    #controller.stream_with_visualization(port=9000, remote_host=Web_host_ip)
    return [controller.filesystem,transport]
def close_cam(transport):
    transport.disconnect()
