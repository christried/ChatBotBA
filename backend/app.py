from flask import Flask, request, jsonify
from flask_cors import CORS
from flask_sqlalchemy import SQLAlchemy
import os
import datetime
from openai import OpenAI
from dotenv import load_dotenv

# Load environment variables from .env file
load_dotenv()
# Initialize Flask app
app = Flask(__name__)
CORS(app)  # Enable CORS for all routes

# Get the OpenAI API key from environment variables and set up OpenAI client
api_key = os.getenv('OPENAI_API_KEY')
client = OpenAI(
  api_key=api_key,
)

# Get the absolute path of the current directory (where app.py is located) to create the database file in the same directory
BASE_DIR = os.path.abspath(os.path.dirname(__file__))
# Configure SQLite database
app.config["SQLALCHEMY_DATABASE_URI"] = f"sqlite:///{os.path.join(BASE_DIR, 'messages.db')}"
app.config["SQLALCHEMY_TRACK_MODIFICATIONS"] = False
db = SQLAlchemy(app)

# Define Message model
class Message(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    user_message = db.Column(db.Text, nullable=False)
    assistant_message = db.Column(db.Text, nullable=False)
    timestamp = db.Column(db.DateTime, default=datetime.datetime.utcnow)

# Initialize database
with app.app_context():
    db.create_all()

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
        
        # Extract the chatbot's reply. openai docs refer to the model as "assistant" so we'll use that here
        assistant_message = response.choices[0].message.content

        # Store in database
        new_message = Message(user_message=user_message, assistant_message=assistant_message)
        db.session.add(new_message)
        db.session.commit()
        
        return jsonify({
            "message": assistant_message
        })
        
    except Exception as e:
        return jsonify({"error": str(e)}), 500
    
@app.route('/api/messages', methods=['GET'])
def get_messages():
    """Fetch all stored messages"""
    messages = Message.query.order_by(Message.timestamp.desc()).all()
    return jsonify([
        {"id": msg.id, "user_message": msg.user_message, "assistant_message": msg.assistant_message, "timestamp": msg.timestamp}
        for msg in messages
    ])


@app.route('/api/health', methods=['GET'])
def health_check():
    """Simple endpoint to verify the API is running"""
    return jsonify({
        "status": "ok",
        "version": "0.0.1",
        "timestamp": datetime.datetime.now().isoformat()
    })

# run local server
if __name__ == '__main__':
    port = int(os.environ.get('PORT', 5000))
    app.run(host='0.0.0.0', port=port, debug=True)


