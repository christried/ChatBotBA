from flask import Flask, request, jsonify
from flask_cors import CORS
import os
from openai import OpenAI
from dotenv import load_dotenv

# Load environment variables from .env file
load_dotenv()

# Initialize Flask app
app = Flask(__name__)
CORS(app)  # Enable CORS for all routes

# Get the OpenAI API key from environment variables
api_key = os.getenv('OPENAI_API_KEY')

client = OpenAI(
  api_key=api_key,
)

@app.route('/api/chat', methods=['POST'])
def chat():
    """Handle incoming chat messages and generate AI responses"""
    try:
        data = request.json
        user_message = data.get('message', '')
        
        if not user_message:
            return jsonify({"error": "No message provided"}), 400
        
        # Prepare messages for OpenAI API
        messages = [
            {"role": "system", "content": "You are a helpful customer support assistant for an e-commerce website. "
            "Be concise, friendly, and helpful."},
            {"role": "user", "content": user_message}
        ]
        
        # Call OpenAI API
        response = client.chat.completions.create(
            model="gpt-4o-mini",  # may be the best one right now, at least it's the cheapest and most popular 
            # store=True, # Used for distillation, may be useful for the future to work with a smaller model :)
            messages=messages,
        )
        
        # Extract the chatbot's reply
        chatbot_message = response.choices[0].message.content
        
        return jsonify({
            "message": chatbot_message
        })
        
    except Exception as e:
        return jsonify({"error": str(e)}), 500

# run local server
if __name__ == '__main__':
    port = int(os.environ.get('PORT', 5000))
    app.run(host='0.0.0.0', port=port, debug=True)


