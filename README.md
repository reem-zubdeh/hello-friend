# HelloFriend: Chat with Friends!

HelloFriend is a colorful web-based chat application. Create an account and add a Friend to chat about anything and everything.
Full stack web app built with Node.js, Express, jQuery, and Bootstrap.

Features:
- Secure account creation and auth process with JWT
- Messaging between registered users 
- Configurable user settings including display name, avatar, and theme
- Fully responsive and mobile-friendly
- Five different fully designed vibrant color themes
- Efficient asynchronous server communication
- Convenient and aesthetically pleasing UI/UX
- Informative and sufficient error handling

# Installation

## 1. Restore MongoDB database locally

Ensure MongoDB is installed. The MongoDB .bson files have been exported with mongodump and placed in /db/HelloFriendDB. 

Using MongoDB Database Tools: in the root directory, restore the "HelloFriendDB" database files locally with the mongorestore tool. 

If in project root directory, and and mongorestore.exe is present or added to PATH, run this command:

    mongorestore -d HelloFriendDB db/HelloFriendDB

See MongoDB Database Tools [download page](https://www.mongodb.com/try/download/database-tools) and [documentation](https://www.mongodb.com/docs/database-tools/) for more help.

## 2. Installing dependencies

Ensure Node.js and npm are installed. Run

    npm install

in project root directory to install dependencies.

# Usage

In project root, run

    node app

to start the server. 

Access the website from any browser at localhost:3000.

Sign up with a new account, or log in with one of the dummy accounts included in accounts.txt.