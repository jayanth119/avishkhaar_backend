from flask import Flask, request, jsonify
import os
from  utils.setupagent import setup_agent, run_agent_chain 

# Initialize Flask application
app = Flask(__name__)

# Load the agent
agent_chain = setup_agent('kb.txt')  # Path to your knowledge base
chat_history = ''

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
    app.run(host='0.0.0.0', port=8000, debug=True)
