// === SmartSuite Frontend Logic ===

document.addEventListener("DOMContentLoaded", () => {
    // Current Active States
    let currentActiveTab = "chat";
    let activeFilePath = null;
    let clockInterval = null;

    // DOM Elements - Shell
    const menuButtons = document.querySelectorAll(".menu-item");
    const tabPanels = document.querySelectorAll(".tab-panel");
    const pageTitle = document.getElementById("page-title");
    const pageSubtitle = document.getElementById("page-subtitle");
    const currentTimeText = document.getElementById("current-time");
    const currentDateText = document.getElementById("current-date");

    // DOM Elements - Chat
    const chatBox = document.getElementById("chat-box");
    const chatInput = document.getElementById("chat-input");
    const btnSendChat = document.getElementById("btn-send-chat");
    const suggestionChips = document.querySelectorAll(".suggestion-chip");

    // DOM Elements - Notes
    const noteInput = document.getElementById("note-input");
    const btnSaveNote = document.getElementById("btn-save-note");
    const notesGrid = document.getElementById("notes-grid");
    const notesCounter = document.getElementById("notes-counter");

    // DOM Elements - Search
    const scanPathInput = document.getElementById("scan-path-input");
    const btnScan = document.getElementById("btn-scan");
    const btnLoad = document.getElementById("btn-load");
    const searchInput = document.getElementById("search-input");
    const filterType = document.getElementById("filter-type");
    const searchStatusBar = document.getElementById("search-status-bar");
    const resultsList = document.getElementById("results-list");
    const resultsCounter = document.getElementById("results-counter");
    const previewBox = document.getElementById("preview-box");
    const previewHeader = document.getElementById("preview-header");
    const previewActions = document.getElementById("preview-actions");
    const btnOpenFile = document.getElementById("btn-open-file");

    // ==========================================
    // 1. SHELL & CLOCK MODULE
    // ==========================================
    
    function startClock() {
        const updateClock = () => {
            const now = new Date();
            
            // Format Time: 12:00:00 PM
            let hours = now.getHours();
            const minutes = String(now.getMinutes()).padStart(2, "0");
            const seconds = String(now.getSeconds()).padStart(2, "0");
            const ampm = hours >= 12 ? "PM" : "AM";
            hours = hours % 12;
            hours = hours ? hours : 12; // hour '0' is '12'
            const formattedTime = `${String(hours).padStart(2, "0")}:${minutes}:${seconds} ${ampm}`;
            
            // Format Date: DD-MM-YYYY
            const day = String(now.getDate()).padStart(2, "0");
            const month = String(now.getMonth() + 1).padStart(2, "0");
            const year = now.getFullYear();
            const formattedDate = `${day}-${month}-${year}`;

            currentTimeText.textContent = formattedTime;
            currentDateText.textContent = formattedDate;
        };
        
        updateClock();
        clockInterval = setInterval(updateClock, 1000);
    }

    // Tab Switching
    menuButtons.forEach(button => {
        button.addEventListener("click", () => {
            const targetTab = button.getAttribute("data-tab");
            if (targetTab === currentActiveTab) return;

            // Remove active states
            menuButtons.forEach(btn => btn.classList.remove("active"));
            tabPanels.forEach(panel => panel.classList.remove("active"));

            // Set active states
            button.classList.add("active");
            const targetPanel = document.getElementById(`panel-${targetTab}`);
            if (targetPanel) targetPanel.classList.add("active");

            currentActiveTab = targetTab;
            
            // Update Headers & Refresh panels if needed
            if (targetTab === "chat") {
                pageTitle.textContent = "AI ChatBot";
                pageSubtitle.textContent = "Interact with your smart assistant";
                scrollToBottom(chatBox);
            } else if (targetTab === "notes") {
                pageTitle.textContent = "Smart Notes";
                pageSubtitle.textContent = "Save, display and manage interactive notes";
                loadNotes();
            } else if (targetTab === "search") {
                pageTitle.textContent = "Search Engine";
                pageSubtitle.textContent = "Scan directories, search files, and preview code";
            }
        });
    });

    // Initialize clock
    startClock();

    // ==========================================
    // 2. CHATBOT MODULE
    // ==========================================
    
    function scrollToBottom(element) {
        element.scrollTop = element.scrollHeight;
    }

    function createChatBubble(sender, text, timestamp = "") {
        const bubble = document.createElement("div");
        bubble.classList.add("message-bubble", sender);
        
        const messageSpan = document.createElement("span");
        messageSpan.textContent = text;
        bubble.appendChild(messageSpan);
        
        if (timestamp) {
            const timeSpan = document.createElement("span");
            timeSpan.classList.add("time");
            // Slice/parse timestamp if standard datetime string
            timeSpan.textContent = timestamp.split(".")[0];
            bubble.appendChild(timeSpan);
        }
        
        return bubble;
    }

    // Load Chat History
    async function loadChatHistory() {
        try {
            const res = await fetch("/api/history");
            if (!res.ok) throw new Error("History fetch error");
            const history = await res.json();
            
            if (history && history.length > 0) {
                // Clear initial placeholder if history exists
                chatBox.innerHTML = "";
                history.forEach(msg => {
                    const bubble = createChatBubble(msg.sender, msg.text, msg.timestamp);
                    chatBox.appendChild(bubble);
                });
                scrollToBottom(chatBox);
            }
        } catch (err) {
            console.error("Failed to load chat history", err);
        }
    }

    // Send Message handler
    async function sendMessage(messageText) {
        if (!messageText) return;
        
        // Add user bubble
        const userTimestamp = new Date().toLocaleTimeString();
        chatBox.appendChild(createChatBubble("user", messageText, userTimestamp));
        scrollToBottom(chatBox);
        
        // Add typing indicator
        const typingBubble = document.createElement("div");
        typingBubble.classList.add("message-bubble", "bot", "typing-indicator-bubble");
        typingBubble.innerHTML = `<i class="fa-solid fa-circle-notch fa-spin"></i> <span>Thinking...</span>`;
        chatBox.appendChild(typingBubble);
        scrollToBottom(chatBox);

        try {
            const res = await fetch("/api/chat", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ message: messageText })
            });
            
            // Remove typing indicator
            typingBubble.remove();

            if (!res.ok) throw new Error("Failed to send chat");
            const data = await res.json();
            
            // Add bot bubble
            chatBox.appendChild(createChatBubble("bot", data.reply, data.timestamp));
            scrollToBottom(chatBox);
        } catch (err) {
            typingBubble.remove();
            const errorBubble = createChatBubble("bot", "Oops! There was a connection issue with the server.");
            chatBox.appendChild(errorBubble);
            scrollToBottom(chatBox);
        }
    }

    // Hook events for chat
    btnSendChat.addEventListener("click", () => {
        const text = chatInput.value.trim();
        sendMessage(text);
        chatInput.value = "";
    });

    chatInput.addEventListener("keydown", (e) => {
        if (e.key === "Enter") {
            const text = chatInput.value.trim();
            sendMessage(text);
            chatInput.value = "";
        }
    });

    suggestionChips.forEach(chip => {
        chip.addEventListener("click", () => {
            sendMessage(chip.textContent.trim());
        });
    });

    // ==========================================
    // 3. NOTES MODULE
    // ==========================================
    
    async function loadNotes() {
        try {
            const res = await fetch("/api/notes");
            if (!res.ok) throw new Error("Failed to load notes");
            const notes = await res.json();
            
            // Update counter
            notesCounter.textContent = `${notes.length} note${notes.length === 1 ? "" : "s"}`;
            
            // Reset grid
            notesGrid.innerHTML = "";
            
            if (notes.length === 0) {
                notesGrid.innerHTML = `
                    <div class="no-notes-message">
                        <i class="fa-regular fa-clipboard"></i>
                        <p>No notes saved yet. Type a note on the left and hit Save.</p>
                    </div>`;
                return;
            }
            
            notes.forEach((noteText, idx) => {
                const noteCard = document.createElement("div");
                noteCard.classList.add("note-card", `color-${idx % 5}`);
                
                const textDiv = document.createElement("div");
                textDiv.classList.add("note-card-text");
                textDiv.textContent = noteText;
                noteCard.appendChild(textDiv);
                
                const footerDiv = document.createElement("div");
                footerDiv.classList.add("note-card-footer");
                
                const deleteBtn = document.createElement("button");
                deleteBtn.classList.add("btn-delete-note");
                deleteBtn.innerHTML = `<i class="fa-regular fa-trash-can"></i>`;
                deleteBtn.title = "Delete Note";
                deleteBtn.addEventListener("click", (e) => {
                    e.stopPropagation();
                    deleteNote(idx);
                });
                
                footerDiv.appendChild(deleteBtn);
                noteCard.appendChild(footerDiv);
                notesGrid.appendChild(noteCard);
            });
        } catch (err) {
            console.error("Failed loading notes grid", err);
        }
    }

    async function saveNote() {
        const text = noteInput.value.trim();
        if (!text) return;
        
        try {
            const res = await fetch("/api/notes", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ note: text })
            });
            if (!res.ok) throw new Error("Failed saving note");
            
            noteInput.value = "";
            loadNotes();
        } catch (err) {
            alert("Error saving note: " + err.message);
        }
    }

    async function deleteNote(index) {
        try {
            const res = await fetch(`/api/notes/${index}`, { method: "DELETE" });
            if (!res.ok) throw new Error("Delete failed");
            loadNotes();
        } catch (err) {
            alert("Error deleting note: " + err.message);
        }
    }

    btnSaveNote.addEventListener("click", saveNote);

    // ==========================================
    // 4. SEARCH ENGINE MODULE
    // ==========================================
    
    // Scan directory
    async function scanDirectory() {
        const path = scanPathInput.value.trim();
        
        btnScan.disabled = true;
        btnScan.innerHTML = `<i class="fa-solid fa-spinner fa-spin"></i> Scanning...`;
        searchStatusBar.textContent = "Scanning directories. This might take a few seconds...";
        
        try {
            const res = await fetch("/api/search/scan", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ path: path })
            });
            
            const data = await res.json();
            btnScan.disabled = false;
            btnScan.innerHTML = `<i class="fa-solid fa-arrows-rotate"></i> Scan`;
            
            if (!res.ok) {
                searchStatusBar.textContent = `Error: ${data.error}`;
                searchStatusBar.style.color = "var(--color-danger)";
                return;
            }
            
            searchStatusBar.textContent = `Scanned successfully! Indexed ${data.count} files in "${data.scanned_path}".`;
            searchStatusBar.style.color = "var(--color-success)";
            
            // Trigger automatic query reload
            performSearch();
        } catch (err) {
            btnScan.disabled = false;
            btnScan.innerHTML = `<i class="fa-solid fa-arrows-rotate"></i> Scan`;
            searchStatusBar.textContent = `Connection error: ${err.message}`;
            searchStatusBar.style.color = "var(--color-danger)";
        }
    }

    // Load indexed file
    async function loadIndex() {
        btnLoad.disabled = true;
        btnLoad.innerHTML = `<i class="fa-solid fa-spinner fa-spin"></i> Loading...`;
        searchStatusBar.textContent = "Loading index.json...";
        
        try {
            const res = await fetch("/api/search/load");
            const data = await res.json();
            btnLoad.disabled = false;
            btnLoad.innerHTML = `<i class="fa-solid fa-cloud-arrow-down"></i> Load Index`;
            
            if (!res.ok) throw new Error(data.error || "Loading failed");
            
            searchStatusBar.textContent = `Loaded existing index from local database. Total files: ${data.count}.`;
            searchStatusBar.style.color = "var(--text-primary)";
            
            performSearch();
        } catch (err) {
            btnLoad.disabled = false;
            btnLoad.innerHTML = `<i class="fa-solid fa-cloud-arrow-down"></i> Load Index`;
            searchStatusBar.textContent = `No index file found. Scan a directory first.`;
            searchStatusBar.style.color = "var(--color-warning)";
        }
    }

    // Render file lists
    function formatBytes(bytes) {
        if (bytes === 0) return '0 Bytes';
        const k = 1024;
        const sizes = ['Bytes', 'KB', 'MB'];
        const i = Math.floor(Math.log(bytes) / Math.log(k));
        return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + ' ' + sizes[i];
    }

    function getFileIcon(ext) {
        switch (ext) {
            case "txt": return "fa-file-lines";
            case "py": return "fa-file-code tag-py";
            case "json": return "fa-file-code tag-json";
            case "html": return "fa-file-code tag-html";
            case "css": return "fa-file-code tag-css";
            case "js": return "fa-file-code tag-js";
            case "png":
            case "jpg":
            case "jpeg": return "fa-file-image tag-png";
            case "md": return "fa-file-alt tag-md";
            default: return "fa-file";
        }
    }

    async function performSearch() {
        const query = searchInput.value.trim();
        const type = filterType.value;
        
        try {
            const res = await fetch(`/api/search/query?q=${encodeURIComponent(query)}&t=${type}`);
            if (!res.ok) throw new Error("Search query error");
            const files = await res.json();
            
            resultsCounter.textContent = `${files.length} file${files.length === 1 ? "" : "s"}`;
            resultsList.innerHTML = "";
            
            if (files.length === 0) {
                resultsList.innerHTML = `
                    <li class="empty-list-placeholder">
                        <i class="fa-solid fa-magnifying-glass"></i>
                        <p>No matching files found.</p>
                    </li>`;
                return;
            }
            
            files.forEach(file => {
                const li = document.createElement("li");
                li.classList.add("result-item");
                if (activeFilePath === file.path) {
                    li.classList.add("active");
                }
                
                const iconClass = getFileIcon(file.type);
                
                li.innerHTML = `
                    <div class="result-item-icon">
                        <i class="fa-solid ${iconClass}"></i>
                    </div>
                    <div class="result-item-details">
                        <span class="result-item-name" title="${file.name}">${file.name}</span>
                        <span class="result-item-path" title="${file.path}">${file.path}</span>
                    </div>
                    <div class="result-item-meta">
                        <span>${formatBytes(file.size)}</span>
                    </div>`;
                
                // Clicking selects file and loads preview
                li.addEventListener("click", () => {
                    document.querySelectorAll(".result-item").forEach(item => item.classList.remove("active"));
                    li.classList.add("active");
                    previewFile(file.path, file.type, file.name);
                });
                
                // Double click opens file locally
                li.addEventListener("dblclick", () => {
                    openLocalFile(file.path);
                });

                resultsList.appendChild(li);
            });
        } catch (err) {
            console.error("Search failed", err);
        }
    }

    // File Preview
    async function previewFile(filePath, type, filename) {
        activeFilePath = filePath;
        
        // Show actions
        previewActions.classList.remove("hidden");
        
        previewBox.innerHTML = `
            <div class="empty-preview-placeholder">
                <i class="fa-solid fa-spinner fa-spin"></i>
                <p>Loading preview...</p>
            </div>`;
            
        try {
            // Encode the path query param safely
            const rawUrl = `/api/search/raw?path=${encodeURIComponent(filePath)}`;
            
            // Check if it is an image
            const isImage = ["png", "jpg", "jpeg", "webp", "gif"].includes(type);
            
            if (isImage) {
                previewBox.innerHTML = `
                    <div class="preview-image-block">
                        <img src="${rawUrl}" alt="${filename}">
                    </div>`;
            } else {
                const res = await fetch(rawUrl);
                if (!res.ok) throw new Error("Could not fetch file preview content");
                const text = await res.text();
                
                // Render text/code preview inside pre
                const pre = document.createElement("pre");
                pre.classList.add("preview-text-block");
                pre.textContent = text;
                
                previewBox.innerHTML = "";
                previewBox.appendChild(pre);
            }
        } catch (err) {
            previewBox.innerHTML = `
                <div class="empty-preview-placeholder">
                    <i class="fa-solid fa-triangle-exclamation" style="color: var(--color-danger)"></i>
                    <p>Preview failed: ${err.message}</p>
                </div>`;
        }
    }

    // Open file locally via OS command
    async function openLocalFile(filePath) {
        if (!filePath) return;
        try {
            const res = await fetch("/api/search/open", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ path: filePath })
            });
            const data = await res.json();
            if (!res.ok) throw new Error(data.error || "Failed to open");
            
            // Update search status briefly
            const prevText = searchStatusBar.textContent;
            searchStatusBar.textContent = `Successfully opened "${filePath}" on your system.`;
            searchStatusBar.style.color = "var(--color-success)";
            setTimeout(() => {
                searchStatusBar.textContent = prevText;
                searchStatusBar.style.color = "var(--text-primary)";
            }, 3000);
        } catch (err) {
            alert("Could not open file locally: " + err.message);
        }
    }

    // Hook events for search page
    btnScan.addEventListener("click", scanDirectory);
    btnLoad.addEventListener("click", loadIndex);
    
    // Live Search (KeyUp dynamic update)
    searchInput.addEventListener("keyup", performSearch);
    filterType.addEventListener("change", performSearch);
    
    btnOpenFile.addEventListener("click", () => {
        if (activeFilePath) openLocalFile(activeFilePath);
    });

    // ==========================================
    // 5. BOOTSTRAP INITIAL LOAD
    // ==========================================
    
    // Fetch chat history first on boot
    loadChatHistory();
    // Load local search index database if exists
    loadIndex();
});
