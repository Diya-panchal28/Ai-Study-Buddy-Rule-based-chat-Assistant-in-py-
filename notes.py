def add_note():

    note = input("Enter Note: ")

    with open("notes.txt", "a") as file:
        file.write(note + "\n")

    print("✅ Note Saved")


def show_notes():

    try:

        with open("notes.txt", "r") as file:

            notes = file.read()

            if notes.strip():
                print("\n📝 Your Notes:")
                print(notes)
            else:
                print("No notes available.")

    except FileNotFoundError:
        print("No notes file found.")