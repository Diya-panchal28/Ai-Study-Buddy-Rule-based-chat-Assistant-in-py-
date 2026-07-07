from chat_history import save_chat
from notes import add_note, show_notes

import datetime
import random

responses = {
    "hello": "Hi! Welcome.",
    "how are you": "I am fine. Thank you!",
    "who are you": "I am a Smart AI ChatBot.",
    "python": "Python is a powerful programming language."
}

jokes = [
    "Why do programmers prefer dark mode? Because light attracts bugs!",
    "Why did Python go to school? To improve its class."
]

def getResponseOfBot(userQuestion):

    userQuestion = userQuestion.lower()

    if "time" in userQuestion:
        return "Current Time: " + datetime.datetime.now().strftime("%I:%M:%S %p")

    if "date" in userQuestion:
        return "Today's Date: " + datetime.datetime.now().strftime("%d-%m-%Y")

    if "joke" in userQuestion:
        return random.choice(jokes)

    for key in responses:
        if key in userQuestion:
            return responses[key]

    return "I am still learning."

if __name__ == "__main__":
    print("🤖 Smart ChatBot Started")
    print("Type 'add note' to save a note")
    print("Type 'show notes' to view notes")
    print("Type 'bye' to exit")

    while True:

        userInput = input("You: ")

        # Exit chatbot
        if userInput.lower() == "bye":
            print("Bot: Goodbye!")
            break

        # Add note feature
        if userInput.lower() == "add note":
            add_note()
            continue

        # Show notes feature
        if userInput.lower() == "show notes":
            show_notes()
            continue

        # Generate bot response
        reply = getResponseOfBot(userInput)

        print("Bot:", reply)

        # Save chat history
        save_chat(userInput, reply)