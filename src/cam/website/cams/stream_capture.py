from abc import ABC, abstractmethod
from typing import List, Dict, Any, Optional
import json
import socket
import struct
import os
from dotenv import load_dotenv

Web_host_ip = os.getenv('Web_host_ip')

try:  # Optional dependencies for visualization
    import cv2
    import numpy as np
except ImportError:  # pragma: no cover - optional dependency
    cv2 = None
    np = None

def start_stream_capture(
    _self,
    port: int = 9000,
    host: str = "",
    remote_host: Optional[str] = Web_host_ip,
    remote_port: int = 9000,
    window_name: str = "Voxel Stream",
    connect_timeout: float = 20.0,
) -> None:
    self=_self[0]
    """Start streaming from the device and visualize frames locally.

    :param port: Local TCP port to listen on for incoming frames.
    :param host: Local interface to bind (default all interfaces).
    :param remote_host: Optional explicit remote address to push to. If
        None, the device is instructed to push to our current LAN IP.
    :param remote_port: Port the device should connect back to (defaults to
        the same as the local listener port).
    :param window_name: OpenCV window title.
    :param connect_timeout: Seconds to wait for the device to connect.
    """

    if not self.is_connected():
        raise ConnectionError("Connect to the device first")

    if cv2 is None or np is None:
        raise RuntimeError("OpenCV (cv2) and numpy are required for stream visualization. Install them with `pip install opencv-python numpy`." )

    listener = socket.socket(socket.AF_INET, socket.SOCK_STREAM)
    listener.setsockopt(socket.SOL_SOCKET, socket.SO_REUSEADDR, 1)
    try:
        listener.bind((host, port))
    except:
        print("bad binding")
    listener.listen(1)

    target_port = remote_port or port
    target_host = self._select_stream_target(remote_host, target_port)

    # Kick off streaming on device
    response = self.start_rdmp_stream(target_host, target_port)
    if "error" in response:
        listener.close()
        raise RuntimeError(f"Device failed to start streaming: {response}")

    listener.settimeout(connect_timeout)
    try:
        conn, addr = listener.accept()
    except socket.timeout:
        #listener.close()
        #self.stop_rdmp_stream()
        print("Timed out waiting for stream connection from device")

    listener.close()
    conn.settimeout(10.0)

    print(f"Streaming from device connected: {addr}")

    return conn

def get_frame(_self, conn):
    self = _self[0]
    header = self._recv_exact(conn, 8)
    if not header:
        print("Stream closed by device")
        return

    if header[:4] != b"VXL0":
        print("Invalid frame header, stopping")
        print(header)
        self._recv_exact(conn, 1024)
        self.stop_rdmp_stream()
        start_stream_capture(_self)                
        return

    frame_len = struct.unpack(">I", header[4:])[0]
    if frame_len <= 0 or frame_len > 5 * 1024 * 1024:
        print(f"Invalid frame length: {frame_len}")
        return

    payload = self._recv_exact(conn, frame_len)
    if not payload:
        print("Failed to read frame payload")
        return

    frame_array = np.frombuffer(payload, dtype=np.uint8)
    
    return frame_array

def close_stream(self):
    self.stop_rdmp_stream()
