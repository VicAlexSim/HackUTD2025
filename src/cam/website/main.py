# Import necessary modules
from flask import Flask, render_template, Response, request, jsonify, redirect, url_for
from aiortc import RTCPeerConnection, RTCSessionDescription
import cv2
import json
import uuid
import asyncio
import logging
import time
from cams.stream_capture import start_stream_capture, get_frame, close_stream
from cams.bt2 import initialize_cam, close_cam

# Create a Flask app instance
app = Flask(__name__, static_url_path='/static')

# Set to keep track of RTCPeerConnection instances
pcs = set()
first = True
@app.before_request
def first_req():
    global first
    global ctrl
    if first:
        try:
            ctrl = initialize_cam()
        except:
            close_cam(ctrl[1])
        first = False


# Function to generate video frames from the camera
def generate_frames():
    while True:
        start_time = time.time()
        buffer = get_frame(ctrl[0], con)
        frame = buffer.tobytes()
        # Concatenate frame and yield for streaming
        yield (b'--frame\r\n'
               b'Content-Type: image/jpeg\r\n\r\n' + frame + b'\r\n') 
        elapsed_time = time.time() - start_time
        logging.debug(f"Frame generation time: {elapsed_time} seconds")

# Route to render the HTML template
@app.route('/')
def index():
    return render_template('index.html')
    # return redirect(url_for('video_feed')) #to render live stream directly

# Asynchronous function to handle offer exchange
async def offer_async():
    params = await request.json
    offer = RTCSessionDescription(sdp=params["sdp"], type=params["type"])

    # Create an RTCPeerConnection instance
    pc = RTCPeerConnection()

    # Generate a unique ID for the RTCPeerConnection
    pc_id = "PeerConnection(%s)" % uuid.uuid4()
    pc_id = pc_id[:8]

    # Create a data channel named "chat"
    # pc.createDataChannel("chat")

    # Create and set the local description
    await pc.createOffer(offer)
    await pc.setLocalDescription(offer)

    # Prepare the response data with local SDP and type
    response_data = {"sdp": pc.localDescription.sdp, "type": pc.localDescription.type}

    return jsonify(response_data)

# Wrapper function for running the asynchronous offer function
def offer():
    loop = asyncio.new_event_loop()
    asyncio.set_event_loop(loop)
   
    future = asyncio.run_coroutine_threadsafe(offer_async(), loop)
    return future.result()

# Route to handle the offer request
@app.route('/offer', methods=['POST'])
def offer_route():
    return offer()

# Route to stream video frames
@app.route('/video_feed')
def video_feed():
    global con
    con = start_stream_capture(ctrl[0])
    return Response(generate_frames(), mimetype='multipart/x-mixed-replace; boundary=frame')

# Run the Flask app
if __name__ == "__main__":
    app.run(debug=True, port=8080)
    
