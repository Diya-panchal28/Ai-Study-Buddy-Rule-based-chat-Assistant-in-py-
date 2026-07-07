# Ai-Study-Buddy-Rule-based-chat-Assistant-in-py-
A Flask-based AI Chatbot and Personal Search Engine that enables intelligent conversations, note management, chat history, and fast local file searching through a modern web interface.
# 🚀 Features

- 🤖 AI Chatbot
- 💬 Chat History
- 📝 Notes Management
- 🔍 Personal File Search Engine
- 📂 Open Files Directly
- 📄 File Content Search
- 📊 JSON-based Search Index
- ⚡ Fast Flask Backend
- 🌐 REST API Endpoints

---

## 🛠️ Technologies Used

- Python
- Flask
- HTML
- CSS
- JavaScript
- JSON

---

## 📂 Project Structure

```
project/
│
├── app.py
├── Chatboat.py
├── chat_history.py
├── chat_history.txt
├── notes.txt
├── index.json
│
├── static/
│
├── templates/
│
└── README.md
```

---

## Installation

### Clone Repository

```bash
git clone https://github.com/yourusername/repository-name.git
```

### Go into project

```bash
cd repository-name
```

### Install Dependencies

```bash
pip install flask
```

### Run Project

```bash
python app.py
```

Open your browser

```
http://127.0.0.1:5000
```

---

## API Endpoints

| Method | Endpoint | Description |
|---------|----------|-------------|
| GET | /api/history | Get chat history |
| POST | /api/chat | Chat with AI |
| GET | /api/notes | Get notes |
| POST | /api/notes | Save notes |
| DELETE | /api/notes/<id> | Delete notes |
| POST | /api/search/scan | Scan files |
| GET | /api/search/load | Load search index |
| GET | /api/search/query | Search files |
| GET | /api/search/raw | Download file |
| POST | /api/search/open | Open file |

---
