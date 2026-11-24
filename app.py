import os
from flask import Flask, request, jsonify, send_from_directory
import requests
from dotenv import load_dotenv

# Get the absolute path of the folder containing app.py
BASE = os.path.dirname(os.path.abspath(__file__))

# Load the .env file from that exact folder
load_dotenv(os.path.join(BASE, ".env"))

OPENROUTER_KEY = os.getenv("OPENROUTER_KEY")
OPENROUTER_URL = "https://openrouter.ai/api/v1/chat/completions"

app = Flask(__name__, static_folder=BASE, static_url_path="")

@app.route("/")
def home():
    return send_from_directory(BASE, "index.html")

@app.route("/<path:filename>")
def files(filename):
    return send_from_directory(BASE, filename)

@app.route("/api/summarize", methods=["POST"])
def summarize():
    if not OPENROUTER_KEY:
        return jsonify({"error": "API key is missing. Check your .env file."}), 500

    data = request.get_json(silent=True) or {}
    text = data.get("text", "").strip()
    
    if not text:
        return jsonify({"error": "No text provided."}), 400

    try:
        # The openrouter/free router automatically finds an available free model
        r = requests.post(
            OPENROUTER_URL,
            headers={
                "Authorization": f"Bearer {OPENROUTER_KEY}",
                "Content-Type": "application/json",
            },
            json={
                "model": "openrouter/free",
                "messages": [
                    {"role": "system", "content": "Summarize the following text concisely."},
                    {"role": "user", "content": text},
                ],
            },
            timeout=60,
        )
        
        # If OpenRouter returns a bad status, show the exact error
        if r.status_code != 200:
            return jsonify({"error": f"OpenRouter Error ({r.status_code}): {r.text}"}), 500
            
        result = r.json()
        
        if "error" in result:
            return jsonify({"error": result["error"].get("message", "OpenRouter error")}), 500
            
        return jsonify({"summary": result["choices"][0]["message"]["content"]})
        
    except Exception as e:
        return jsonify({"error": str(e)}), 500

if __name__ == "__main__":
    app.run(port=5000, debug=True)