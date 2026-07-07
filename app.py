import os
import json
import re
import datetime
import platform
import subprocess
from flask import Flask, jsonify, request, render_template, send_file, abort

# Import original module functions
from Chatboat import getResponseOfBot
from chat_history import save_chat

app = Flask(__name__, template_folder="templates", static_folder="static")

INDEX_FILE = "index.json"
NOTES_FILE = "notes.txt"
CHAT_HISTORY_FILE = "chat_history.txt"

# Memory store for search engine data
search_data = []

def load_search_index():
    global search_data
    if os.path.exists(INDEX_FILE):
        try:
            with open(INDEX_FILE, "r", encoding="utf-8") as f:
                loaded = json.load(f)
                # Filter to only keep existing files
                search_data = [item for item in loaded if os.path.exists(item["path"])]
        except Exception as e:
            print(f"Error loading index: {e}")
            search_data = []
    else:
        search_data = []

# Load search index initially
load_search_index()

# Utility to parse chat history
def parse_chat_history():
    messages = []
    if not os.path.exists(CHAT_HISTORY_FILE):
        return messages
    
    try:
        with open(CHAT_HISTORY_FILE, "r", encoding="utf-8", errors="ignore") as f:
            lines = f.readlines()
        
        current_time = ""
        for line in lines:
            line = line.strip()
            if not line:
                continue
            # Match timestamps like [2026-06-02 15:34:57.871688]
            if line.startswith("[") and line.endswith("]"):
                current_time = line[1:-1]
            elif line.startswith("You: "):
                msg = line[len("You: "):]
                messages.append({"sender": "user", "text": msg, "timestamp": current_time})
            elif line.startswith("Bot: "):
                msg = line[len("Bot: "):]
                messages.append({"sender": "bot", "text": msg, "timestamp": current_time})
    except Exception as e:
        print(f"Error reading chat history: {e}")
    
    return messages

# Main Dashboard Route
@app.route("/")
def index():
    return render_template("index.html")

# Chat API endpoints
@app.route("/api/history", methods=["GET"])
def get_history():
    return jsonify(parse_chat_history())

@app.route("/api/chat", methods=["POST"])
def post_chat():
    req = request.get_json() or {}
    user_msg = req.get("message", "").strip()
    if not user_msg:
        return jsonify({"error": "Empty message"}), 400
    
    # Generate bot response using Chatboat.py logic
    bot_msg = getResponseOfBot(user_msg)
    
    # Save using chat_history.py logic
    save_chat(user_msg, bot_msg)
    
    # Get current timestamp
    timestamp = datetime.datetime.now().strftime("%Y-%m-%d %H:%M:%S")
    
    return jsonify({
        "reply": bot_msg,
        "timestamp": timestamp
    })

# Notes API endpoints
@app.route("/api/notes", methods=["GET"])
def get_notes():
    notes = []
    if os.path.exists(NOTES_FILE):
        try:
            with open(NOTES_FILE, "r", encoding="utf-8", errors="ignore") as f:
                notes = [line.strip() for line in f.readlines() if line.strip()]
        except Exception as e:
            print(f"Error reading notes: {e}")
    return jsonify(notes)

@app.route("/api/notes", methods=["POST"])
def post_note():
    req = request.get_json() or {}
    note_text = req.get("note", "").strip()
    if not note_text:
        return jsonify({"error": "Empty note"}), 400
    
    try:
        with open(NOTES_FILE, "a", encoding="utf-8") as f:
            f.write(note_text + "\n")
        return jsonify({"status": "success", "note": note_text})
    except Exception as e:
        return jsonify({"error": str(e)}), 500

@app.route("/api/notes/<int:index>", methods=["DELETE"])
def delete_note(index):
    if not os.path.exists(NOTES_FILE):
        return jsonify({"error": "No notes found"}), 404
    
    try:
        with open(NOTES_FILE, "r", encoding="utf-8", errors="ignore") as f:
            notes = [line.strip() for line in f.readlines() if line.strip()]
        
        if index < 0 or index >= len(notes):
            return jsonify({"error": "Note index out of range"}), 400
        
        # Remove note
        notes.pop(index)
        
        # Write back to file
        with open(NOTES_FILE, "w", encoding="utf-8") as f:
            for note in notes:
                f.write(note + "\n")
                
        return jsonify({"status": "success", "remaining_count": len(notes)})
    except Exception as e:
        return jsonify({"error": str(e)}), 500

# Search Engine API endpoints
@app.route("/api/search/scan", methods=["POST"])
def search_scan():
    global search_data
    req = request.get_json() or {}
    scan_path = req.get("path", "").strip()
    
    # Default to current directory if not specified
    if not scan_path:
        scan_path = os.getcwd()
        
    if not os.path.exists(scan_path) or not os.path.isdir(scan_path):
        return jsonify({"error": f"Path '{scan_path}' is not a valid directory."}), 400

    try:
        new_data = []
        # Walk and scan files
        # Exclude massive folders or VCS for speed
        exclude_dirs = {".git", "node_modules", "__pycache__", ".venv", "venv", ".gemini", "Library"}
        
        for root, dirs, files in os.walk(scan_path):
            # Prune directory search tree
            dirs[:] = [d for d in dirs if d not in exclude_dirs]
            
            for file_name in files:
                file_path = os.path.join(root, file_name)
                # Ignore directory files that might be symlinks or broken
                if not os.path.isfile(file_path):
                    continue
                
                # Try to get extension
                ext = ""
                if "." in file_name:
                    ext = file_name.split(".")[-1].lower()
                
                # Check contents (only read if it's a typical text file or size is small)
                content = ""
                # Max size 1MB to prevent memory issues
                file_size = 0
                try:
                    file_size = os.path.getsize(file_path)
                    if file_size < 1024 * 1024: # < 1MB
                        # Read as text
                        with open(file_path, "r", encoding="utf-8", errors="ignore") as f:
                            content = f.read().lower()
                except Exception:
                    content = ""
                
                new_data.append({
                    "name": file_name.lower(),
                    "path": file_path,
                    "type": ext,
                    "content": content,
                    "size": file_size
                })
        
        # Save to index
        search_data = new_data
        with open(INDEX_FILE, "w", encoding="utf-8") as f:
            json.dump(search_data, f, indent=2)
            
        return jsonify({
            "status": "success", 
            "count": len(search_data),
            "scanned_path": scan_path
        })
    except Exception as e:
        return jsonify({"error": str(e)}), 500

@app.route("/api/search/load", methods=["GET"])
def search_load():
    load_search_index()
    return jsonify({
        "status": "success",
        "count": len(search_data)
    })

@app.route("/api/search/query", methods=["GET"])
def search_query():
    query = request.args.get("q", "").strip().lower()
    file_type = request.args.get("t", "All").strip()
    
    results = []
    for item in search_data:
        # Check file exists
        if not os.path.exists(item["path"]):
            continue
            
        # Match query text in name or contents
        match_query = not query or (query in item["name"] or query in item.get("content", ""))
        
        # Match filter type
        match_type = (file_type == "All" or item["type"] == file_type.lower())
        
        if match_query and match_type:
            results.append({
                "name": os.path.basename(item["path"]),
                "path": item["path"],
                "type": item["type"],
                "size": item.get("size", 0)
            })
            
    return jsonify(results)

@app.route("/api/search/raw", methods=["GET"])
def search_raw():
    file_path = request.args.get("path", "").strip()
    if not file_path or not os.path.exists(file_path):
        abort(404, description="File not found")
        
    try:
        return send_file(file_path)
    except Exception as e:
        return jsonify({"error": str(e)}), 500

@app.route("/api/search/open", methods=["POST"])
def search_open():
    req = request.get_json() or {}
    file_path = req.get("path", "").strip()
    if not file_path or not os.path.exists(file_path):
        return jsonify({"error": "File path does not exist"}), 404
        
    try:
        sys_type = platform.system()
        if sys_type == "Darwin":
            subprocess.run(["open", file_path])
        elif sys_type == "Windows":
            os.startfile(file_path)
        else:
            subprocess.run(["xdg-open", file_path])
            
        return jsonify({"status": "success", "message": f"Opened {file_path}"})
    except Exception as e:
        return jsonify({"error": str(e)}), 500

if __name__ == "__main__":
    # Ensure default data files exist
    if not os.path.exists(NOTES_FILE):
        open(NOTES_FILE, "w").close()
    if not os.path.exists(CHAT_HISTORY_FILE):
        open(CHAT_HISTORY_FILE, "w").close()
        
    print("Starting local Flask backend at http://127.0.0.1:5000")
    app.run(host="127.0.0.1", port=5000, debug=True)
