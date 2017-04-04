Pyramid
=======

## About

Get real time status of your friends on any IRC network, and talk to them too! Stay online even when you're not viewing chat, and see what happened when you were gone. Browse logs. 

* Supports Twitch features, so it's almost exactly like Twitch Chat.
* Has responsive layout, so it also works great on your phone.

It works in real time by directly connecting a Node IRC connection to a Socket.io connection. If you click on one of the usernames, you can see what they've said in all the rooms you monitor in.

## Installation instructions

1. Install [Node.js](http://nodejs.org/)
2. Run `npm install` from the project directory to set up the prerequisites
3. Run `npm run webpack:prod` from the project directory to build frontend resources
4. Copy the dummy database file from `pyramid-dummy.db` to `data/pyramid.db` (create folder as needed)
5. Run `node pyramid.js` from the project directory to start the server
6. Open your browser and navigate to the hostname and port you defined in step 3 (usually `localhost:54335`)

## License
The whole thing is licensed under the MIT License. In short, use it however you like, as long as you credit me.
