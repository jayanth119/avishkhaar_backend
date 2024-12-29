from flask import Flask, request, jsonify
import os
from  utils.setupagent import setup_agent, run_agent_chain 
from kafka import KafkaConsumer
from pymongo import MongoClient
import json
from threading import Thread
from flask import Flask, request, jsonify
from kafka import KafkaConsumer, KafkaProducer
import json
import six  # Ensure 'six' is installed
from six.moves import range  
# Initialize Flask application
app = Flask(__name__)
client = MongoClient("mongodb+srv://yasvanthhanumantu1:rqvXFqSHGdRRbUnH@cluster0.i8nvq.mongodb.net/?retryWrites=true&w=majority&appName=Cluster0")
db = client['cctv_db']
captions_collection = db['captions']
# Load the agent
agent_chain = setup_agent('kb.txt')  # Path to your knowledge base
chat_history = ''
# Kafka configuration
KAFKA_BROKER_URL = 'localhost:9092'  # Replace with your broker URL
TOPIC_PREFIX = 'cctv-frames'

# Initialize Kafka producer
producer = KafkaProducer(
    bootstrap_servers=KAFKA_BROKER_URL,
    value_serializer=lambda v: json.dumps(v).encode('utf-8'),
)

# Initialize Kafka consumer
consumer = KafkaConsumer(
    bootstrap_servers=KAFKA_BROKER_URL,
    group_id='cctv-consumers',
    value_deserializer=lambda m: json.loads(m.decode('utf-8')),
)

# Subscribe to relevant topics
topics = [f"{TOPIC_PREFIX}-*"]
try:
    consumer.subscribe(pattern=TOPIC_PREFIX + '-*')
except Exception as e:
    print(f"Error subscribing to topics: {e}")


@app.route('/produce', methods=['POST'])
def produce_frame():
    """
    API endpoint to produce mock frame data.
    """
    try:
        data = request.json
        cctv_id = data.get('cctvId')
        max_frames = data.get('maxFrames', 10)
        frame_interval = data.get('frameInterval', 1)

        if not cctv_id:
            return jsonify({'error': 'Missing cctvId'}), 400

        # Produce frames
        for frame_number in range(max_frames):
            frame_data = {
                'cctvId': cctv_id,
                'frameNumber': frame_number,
                'timestamp': frame_number * frame_interval,
                'data': f"Mock frame content for CCTV ID {cctv_id} frame {frame_number}",
            }
            producer.send(f"{TOPIC_PREFIX}-{cctv_id}", value=frame_data)
            print(f"Produced frame {frame_number} for CCTV ID: {cctv_id}")

        return jsonify({'message': f'Produced {max_frames} frames for CCTV ID {cctv_id}'}), 200

    except Exception as e:
        print(f"Error producing frame: {e}")
        return jsonify({'error': str(e)}), 500


@app.route('/consume', methods=['GET'])
def consume_frames():
    """
    API endpoint to consume frame data from Kafka.
    """
    try:
        messages = []

        for message in consumer:
            topic = message.topic
            value = message.value
            print(f"Consumed message from {topic}: {value}")
            messages.append(value)

            # Optionally break after fetching some messages to avoid blocking
            if len(messages) >= 10:
                break

        return jsonify({'messages': messages}), 200

    except Exception as e:
        print(f"Error consuming messages: {e}")
        return jsonify({'error': str(e)}), 500

@app.route('/')
def home():
    return jsonify({"message": "Welcome to the STAWS chatbot API!"})

@app.route('/chat', methods=['POST'])
def chat():
    global chat_history  # Access the global chat history
    user_input = request.json.get('input', '')  # Get input from the request
    
    if not user_input:
        return jsonify({"error": "No input provided"}), 400
    
    try:
        chat_history, response = run_agent_chain(user_input, chat_history)
        return jsonify({"response": response})
    except Exception as e:
        return jsonify({"error": str(e)}), 500

if __name__ == '__main__':
    # Set host and port for Flask app
    consumer_thread = Thread(target=process_frames, daemon=True)
    consumer_thread.start()

    app.run(host='0.0.0.0', port=8000, debug=True)
