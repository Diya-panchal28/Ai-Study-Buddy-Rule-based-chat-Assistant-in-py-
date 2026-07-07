import datetime

def save_chat(user_msg, bot_msg):

    with open("chat_history.txt", "a") as file:

        file.write(
            f"\n[{datetime.datetime.now()}]\n"
        )

        file.write(f"You: {user_msg}\n")
        file.write(f"Bot: {bot_msg}\n")