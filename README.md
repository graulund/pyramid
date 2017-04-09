Pyramid
=======

**Pyramid 1.0 beta 1 is out! Yay!**

## About

Get real time status of your friends on any IRC network, and talk to them too! Stay online even when you're not viewing chat, and see what happened when you were gone. Browse logs. 

* Supports Twitch features, so it's almost exactly like Twitch Chat.
* Has responsive layout, so it also works great on your phone.

It works in real time by directly connecting a Node IRC connection to a Socket.io connection. If you click on one of the usernames, you can see what they've said in all the rooms you monitor in.

## Installation instructions

1. Install [Node.js](http://nodejs.org/) (version 7+ required)
2. Run `npm install` from the project directory to set up the prerequisites
3. Run `node pyramid.js` from the project directory to start the server. (You could use a service like [Forever](https://github.com/foreverjs/forever) to help keep it running)
4. Open your browser and navigate to the hostname and port you defined in step 3 (usually `localhost:8887`)

First time you open the page, there's gonna be a guide helping you. Have fun!

## License
The whole thing is licensed under the MIT License. In short, use it however you like, as long as you credit me.
