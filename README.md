Pyramid
=======

## About

Get real time status of your friends on any IRC network. It looks like this:

![Screenshot of product in operation](https://i.imgur.com/5AmIXjb.png)

It works in real time by directly connecting a Node IRC connection to a Socket.io connection. If you click on one of the usernames, you can see what they've said in all the rooms you monitor in.

## Installation instructions

1. Install [Node.js](http://nodejs.org/)
2. Run `npm install` from the project directory to set up the prerequisites
3. Rename the `config-dummy.js` to `config.js` and edit it
4. Run `node pyramid.js` from the project directory to start the server
5. Open your browser and navigate to the hostname and port you defined in step 3 (usually `localhost:8887`)

## License
The whole thing is licensed under the MIT License. In short, use it however you like, as long as you credit me.
