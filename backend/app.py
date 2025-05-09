from flask import Flask, request, jsonify
from flask_cors import CORS
from flask_sqlalchemy import SQLAlchemy
import os
import datetime
import uuid
from openai import OpenAI
from dotenv import load_dotenv
import pandas as pd  # to convert Excel files to json (product data to dataframe)
import json  # to convert Excel files to json (dataframe to json)

from trello_integration import TrelloIntegration

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
    conversation_id = db.Column(db.String(36), nullable=False)  # Use UUID
    role = db.Column(db.String(20), nullable=False)  # 'user' or 'assistant'
    content = db.Column(db.Text, nullable=False)
    timestamp = db.Column(db.DateTime, default=datetime.datetime.utcnow)
    openai_thread_id = db.Column(db.String(100), nullable=True)

# Initialize database
with app.app_context():
    db.create_all()

# Create a vector store to upload and store all files
vector_store = client.vector_stores.create(        # Create vector store
    name="Support Knowledge Base",
)

# Convert product data XLSX to JSON for Assistant compatibility
xlsx_path = os.path.join(BASE_DIR, "../docs/Kontext/product_data.xlsx")
json_path = os.path.join(BASE_DIR, "../docs/Kontext/product_data.json")

try:
    df = pd.read_excel(xlsx_path)
    df = df.fillna("")  # Replace NaNs with empty strings for JSON compatibility
    json_data = df.to_dict(orient="records")

    with open(json_path, "w", encoding="utf-8") as f:
        json.dump(json_data, f, ensure_ascii=False, indent=2)

    print(f"Converted Excel to JSON: {json_path}")
except Exception as e:
    print(f"Failed to convert Excel to JSON: {e}")

# List of file paths to upload
file_paths = [
    os.path.join(BASE_DIR, "../docs/Kontext/faq.pdf"),
    os.path.join(BASE_DIR, "../docs/Kontext/shipping_and_returns.pdf"),
    json_path,
    os.path.join(BASE_DIR, "../docs/Kontext/ci_and_communication_guidelines.pdf"),
]

# Upload each file to the vector store (could use batch-uploads but for simplicity we upload one by one)
for file_path in file_paths:
    try:
        client.vector_stores.files.upload_and_poll(
            vector_store_id=vector_store.id,
            file=open(file_path, "rb"),
        )
        print(f"Successfully uploaded: {file_path}")
    except Exception as e:
        print(f"Error uploading {file_path}: {e}")

client.vector_stores.update(
    vector_store_id=vector_store.id,
    expires_after={
        "anchor": "last_active_at",
        "days": 7
    }
)

# Create an Assistant with the uploaded file
assistant = client.beta.assistants.create(
    instructions=(
        "Important: Use the CI and communication guidelines document to influence how you communicate with the person you are chatting with."
        "Important: You are only allowed to help the customer with inquiries related to the company and its products and will always refer back to this, if anything else is asked."
        "Important: You can only communicate in either English or German, depending on what language the customer is choosing, but it is always possible for you to switch languages when the customer demands it" 
        "All of the information you provide should be in your own words."
        "You are a helpful customer support assistant for an e-commerce website. Be concise, friendly, and helpful. "
        "Use the uploaded FAQ document to provide accurate information about the company's policies and procedures."
        "Use the product data to answer questions about products. "
        "Use the shipping and returns document to answer questions about shipping and returns. "
    ),
    name="Happy Customer Support Assistant",
    tools=[{"type": "file_search"}],  # Enable retrievals from the uploaded files,
    tool_resources={"file_search": {"vector_store_ids": [vector_store.id]}},
    model="gpt-4.1-nano"
)

# Initialize Trello integration
trello = TrelloIntegration()

# endpoint to finalize a conversation and save it to Trello
@app.route('/api/conversations/<conversation_id>/finalize', methods=['POST'])
def finalize_conversation(conversation_id):
    """Finalize a conversation and save it to Trello"""
    try:
        # Get all messages for this conversation
        messages = Message.query.filter_by(conversation_id=conversation_id)\
                         .order_by(Message.timestamp).all()
        
        # Convert to format expected by Trello integration
        formatted_messages = [
            {
                "role": msg.role,
                "content": msg.content,
                "timestamp": msg.timestamp
            }
            for msg in messages
        ]
        
        # Create a Trello card for this conversation
        card_data = trello.create_card_from_conversation(conversation_id, formatted_messages)
        
        if card_data:
            return jsonify({
                "status": "success",
                "message": "Conversation saved to Trello",
                "card_id": card_data.get("id"),
                "card_url": card_data.get("shortUrl")
            })
        else:
            return jsonify({
                "status": "error",
                "message": "Failed to save conversation to Trello"
            }), 500
            
    except Exception as e:
        return jsonify({"error": str(e)}), 500


@app.route('/api/chat', methods=['POST'])
def chat():
    """Handle incoming chat messages and generate AI responses using Assistants API"""
    try:
        data = request.json
        user_message = data.get('message', '')
        conversation_id = data.get('conversation_id')
        finalize_previous = data.get('finalize_previous', False)
        
        if not user_message:
            return jsonify({"error": "No message provided"}), 400
        
        # Finalize previous conversation if requested and if there's a previous conversation
        if finalize_previous and conversation_id:
            # Get the previous conversation
            previous_messages = Message.query.filter_by(conversation_id=conversation_id)\
                              .order_by(Message.timestamp).all()
            
            if previous_messages:
                # Format messages for Trello
                formatted_messages = [
                    {
                        "role": msg.role,
                        "content": msg.content,
                        "timestamp": msg.timestamp
                    }
                    for msg in previous_messages
                ]
                
                # Create a Trello card in the background
                trello.create_card_from_conversation(conversation_id, formatted_messages)
            
            # Create new conversation ID for the current message
            conversation_id = str(uuid.uuid4())
        
        if not user_message:
            return jsonify({"error": "No message provided"}), 400
        
        # Get or create thread_id associated with this conversation
        thread_id = None
        
        # Create new conversation if none exists
        if not conversation_id:
            conversation_id = str(uuid.uuid4())
            # Create a new thread with OpenAI
            thread = client.beta.threads.create()
            thread_id = thread.id
        else:
            # Find existing thread_id from database
            existing_msg = Message.query.filter_by(conversation_id=conversation_id).first()
            if existing_msg and existing_msg.openai_thread_id:
                thread_id = existing_msg.openai_thread_id
            else:
                # Create a new thread if we can't find one
                thread = client.beta.threads.create()
                thread_id = thread.id
        
        # Store user message in database
        new_user_message = Message(
            conversation_id=conversation_id,
            role="user",
            content=user_message,
            openai_thread_id=thread_id
        )
        db.session.add(new_user_message)
        db.session.commit()

        # Add the user message to the thread
        client.beta.threads.messages.create(
            thread_id=thread_id,
            role="user",
            content=user_message,

        )

        # Run the assistant on the thread
        run = client.beta.threads.runs.create(
            thread_id=thread_id,
            assistant_id=assistant.id,
            additional_instructions=None,             
        )   
  

        # Wait for the run to complete
        while run.status in ["queued", "in_progress"]:
            run = client.beta.threads.runs.retrieve(
                thread_id=thread_id,
                run_id=run.id
            )
        
        # If run completed successfully, get the assistant's response
        if run.status == "completed":
            # Get the messages from the thread
            messages = client.beta.threads.messages.list(thread_id=thread_id)
            
            # Get the last assistant message
            assistant_messages = [msg for msg in messages.data if msg.role == "assistant"]
            if assistant_messages:
                latest_message = assistant_messages[0]
                assistant_message_content = latest_message.content[0].text.value
                
                # Store assistant message in database
                new_assistant_message = Message(
                    conversation_id=conversation_id,
                    role="assistant",
                    content=assistant_message_content,
                    openai_thread_id=thread_id
                )
                db.session.add(new_assistant_message)
                db.session.commit()
                
                return jsonify({
                    "message": assistant_message_content,
                    "conversation_id": conversation_id
                })
            else:
                return jsonify({"error": "No response from assistant"}), 500
        else:
            return jsonify({"error": f"Run failed with status: {run.status}"}), 500
        
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


@app.route('/api/conversations/<conversation_id>', methods=['GET'])
def get_conversation(conversation_id):
    """Fetch all messages in a specific conversation"""
    messages = Message.query.filter_by(conversation_id=conversation_id)\
                          .order_by(Message.timestamp).all()
    return jsonify([
        {
            "id": msg.id, 
            "role": msg.role, 
            "content": msg.content, 
            "timestamp": msg.timestamp.isoformat()
        }
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


