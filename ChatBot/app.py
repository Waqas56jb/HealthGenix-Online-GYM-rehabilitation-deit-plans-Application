from flask import Flask, request, jsonify, send_file
from flask_cors import CORS
import google.generativeai as genai
import os
import re
from dotenv import load_dotenv
import uuid
import pyttsx3

# Load environment variables
load_dotenv()

# Initialize Flask app
app = Flask(__name__)
CORS(app, resources={r"/*": {"origins": "*"}})

# Configure Google Gemini AI
api_key = os.getenv("GOOGLE_API_KEY")
if not api_key:
    raise ValueError("GOOGLE_API_KEY not found in .env file")

genai.configure(api_key=api_key)

# Directory for temporary files
TEMP_DIR = os.path.join(os.getcwd(), "temp_files")
if not os.path.exists(TEMP_DIR):
    os.makedirs(TEMP_DIR)

# System Instructions for all chatbots
healthgenix_instruction = (
    "You are a friendly assistant for HealthGenix, a health and fitness app. "
    "Your role is to assist users with sign-in/signup, explain the app’s features, and guide them to its three modules: "
    "1. Gym Workout (offers exercise selection, body pose estimation, and sample videos), "
    "2. Rehabilitation Process (suggests exercises for injuries with pose estimation), "
    "3. Diet Recommendation (answers diet-related queries). "
    "Provide clear, concise answers. "
    "HealthGenix offers a free 3-day subscription. After that, a paid subscription is required."
)

dietbot_instruction = (
    "You are a diet recommendation assistant named DietBot. "
    "Provide professional advice on diet, nutrition, and meal plans only. "
    "If a user asks for a diet plan, give a structured meal plan for breakfast, lunch, dinner, and snacks."
)

rehabbot_instruction = (
    "You are RehabBot, a rehabilitation assistant for injury recovery exercises only. "
    "Provide detailed exercise suggestions for specific injuries (e.g., knee, shoulder, back). "
    "Include step-by-step instructions and precautions. "
    "Responses should be clear, concise, and focused on rehabilitation."
)

# Configure generative models with optimized settings for speed
healthgenix_model = genai.GenerativeModel(
    model_name="gemini-1.5-flash",
    system_instruction=healthgenix_instruction,
    generation_config={
        "temperature": 0.5,
        "top_p": 0.8,
        "top_k": 40,
        "max_output_tokens": 300,
        "response_mime_type": "text/plain",
    },
)

dietbot_model = genai.GenerativeModel(
    model_name="gemini-1.5-flash",
    system_instruction=dietbot_instruction,
    generation_config={
        "temperature": 0.5,
        "top_p": 0.8,
        "top_k": 40,
        "max_output_tokens": 300,
        "response_mime_type": "text/plain",
    },
)

rehabbot_model = genai.GenerativeModel(
    model_name="gemini-1.5-flash",
    system_instruction=rehabbot_instruction,
    generation_config={
        "temperature": 0.5,
        "top_p": 0.8,
        "top_k": 40,
        "max_output_tokens": 300,
        "response_mime_type": "text/plain",
    },
)

def format_response(text):
    """Formats AI response with structured bullet points and bold headings."""
    lines = text.split("\n")
    formatted_lines = []

    for line in lines:
        line = line.strip()
        line = re.sub(r"^\*+\s*\*\*(.+?)\*\*", r"**\1**", line)
        line = re.sub(r"^\*+\s*(.+?)\s*\*", r"**\1**", line)
        if re.match(r"^[-•*]\s+", line):
            formatted_lines.append(f"- {line.lstrip('-•* ')}")
        else:
            formatted_lines.append(line)
    return "\n".join(formatted_lines)

def generate_audio(text):
    """Generate audio file from text using pyttsx3 with a female voice."""
    unique_id = str(uuid.uuid4())
    audio_file = os.path.join(TEMP_DIR, f"audio_{unique_id}.mp3")
    engine = pyttsx3.init()
    
    # Set voice to female (if available)
    voices = engine.getProperty('voices')
    for voice in voices:
        if "female" in voice.name.lower() or "zira" in voice.name.lower():  # Zira is a common female voice on Windows
            engine.setProperty('voice', voice.id)
            break
    
    engine.setProperty('rate', 180)  # Faster speech rate for liveliness
    engine.setProperty('volume', 1.0)  # Max volume
    engine.save_to_file(text, audio_file)
    engine.runAndWait()
    return audio_file

@app.route("/chat", methods=["POST"])
def chat():
    return handle_chat_request(healthgenix_model)

@app.route("/ask", methods=["POST"])
def ask_dietbot():
    return handle_chat_request(dietbot_model)

@app.route("/rehab", methods=["POST"])
def ask_rehabbot():
    return handle_rehab_request(rehabbot_model)

def handle_chat_request(model):
    try:
        data = request.get_json()
        user_message = data.get("message", "").strip()
        history = data.get("history", [])

        if not user_message:
            return jsonify({"error": "Message cannot be empty."}), 400

        formatted_history = [
            {"role": "user" if msg["sender"] == "user" else "model", "parts": [{"text": msg["text"]}]}
            for msg in history if "sender" in msg and "text" in msg
        ]

        chat_session = model.start_chat(history=formatted_history)
        response = chat_session.send_message(user_message)
        formatted_response = format_response(response.text)

        return jsonify({"response": formatted_response})

    except Exception as e:
        return jsonify({"error": str(e)}), 500

def handle_rehab_request(model):
    try:
        data = request.get_json()
        user_message = data.get("message", "").strip()
        history = data.get("history", [])

        if not user_message:
            return jsonify({"error": "Message cannot be empty."}), 400

        formatted_history = [
            {"role": "user" if msg["sender"] == "user" else "model", "parts": [{"text": msg["text"]}]}
            for msg in history if "sender" in msg and "text" in msg
        ]

        chat_session = model.start_chat(history=formatted_history)
        response = chat_session.send_message(user_message)
        formatted_response = format_response(response.text)

        # Generate audio file
        audio_file_path = generate_audio(formatted_response)

        return jsonify({
            "response": formatted_response,
            "audio_url": f"/download_audio?file={os.path.basename(audio_file_path)}",
            "download_url": f"/download_text?text={formatted_response}"
        })

    except Exception as e:
        return jsonify({"error": str(e)}), 500

@app.route("/download_text", methods=["GET"])
def download_text():
    text = request.args.get("text", "")
    if not text:
        return jsonify({"error": "No text provided."}), 400
    
    unique_id = str(uuid.uuid4())
    text_file = os.path.join(TEMP_DIR, f"text_{unique_id}.txt")
    with open(text_file, "w") as f:
        f.write(text)
    
    return send_file(text_file, as_attachment=True, download_name="rehab_response.txt")

@app.route("/download_audio", methods=["GET"])
def download_audio():
    file_name = request.args.get("file", "")
    file_path = os.path.join(TEMP_DIR, file_name)
    if not file_name or not os.path.exists(file_path):
        return jsonify({"error": "Audio file not found."}), 400
    
    return send_file(file_path, mimetype="audio/mpeg")

if __name__ == "__main__":
    app.run(debug=True, host="0.0.0.0", port=5000)