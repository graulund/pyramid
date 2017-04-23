Pyramid
=======

**Pyramid 1.0 beta 1 is out! Yay!**

![pyramid-screenshot-resized](https://cloud.githubusercontent.com/assets/80858/24841349/cd66d46e-1d82-11e7-9108-b7e4295413e0.png)

## About

Get real time status of your friends on any IRC network, and talk to them too! Stay online even when you're not viewing chat, and see what happened when you were gone. Browse logs. 

* Supports Twitch features, so it's almost exactly like Twitch Chat.
* Has responsive layout, so it also works great on your phone.

It works in real time by directly connecting a Node IRC connection to a Socket.io connection. If you click on one of the usernames, you can see what they've said in all the rooms you monitor in.

## Installation instructions

1. Install [Node.js](http://nodejs.org/) (version 7+ required)
2. Run `npm install --production` from a terminal in the project directory to set up the prerequisites
3. Run `node pyramid.js` from the project directory to start the server. (You could use a service like [Forever](https://github.com/foreverjs/forever) to help keep it running)
4. Open your browser and navigate to the hostname and port you defined in step 3 (usually `localhost:8887`)

First time you open the page, there's gonna be a guide helping you. Have fun!

### Edge build installation with easy update

If you want an installation that's always up to date with the newest development build, it's easiest to do a read-only Git repository clone that you can pull from. It goes like this:

1. Make sure [Git](https://git-scm.com/) is installed on your system
2. Run `git clone git://github.com/graulund/pyramid.git` from a terminal and navigate to the directory it creates
3. Run `git checkout development` to move to the development branch
4. Follow above installation instructions

Then, when you want to update your version, simply run `git pull` in a terminal from the Pyramid folder. If it tells you that there are changes in the `package.json` file, simply run `npm install --production` again, to make sure the prerequisites are up to date.

Warning: Development builds can obviously fail more often than the master build.

## License
The whole thing is licensed under the MIT License. In short, use it however you like, as long as you credit me.
