// PYRAMID
// Configuration

module.exports = {
	webPort: 8887, // The port the web interface will be visible from
	debug: false, // Whether to enter the very verbose debug mode

	// IRC connection configuration
	irc: [
		// Multiple IRC connections may be listed here
		// This is one: (Repeat this format if needed, comma separated)
		{
			name: "networkname", // Your own identifier for a network. Used in URLs; no spaces
			me: "username", // Your username on chat (used if login username != your username)
			server: "irc.somewhere.org", // IRC server address
			username: "username", // IRC username
			channels: ["#example1", "#example2"] // Channels to join
			
			// Other optional parameters:
			//password: "",
			//port: 6667
		}
		//...
	],

	nicknames: [], // A list of nicknames for you that will be stored as mention log. E.g. ["andy", "electric"]
	timeZone: "Europe/Copenhagen", // Your time zone (find on http://www.php.net/timezones )
	encoding: "utf8", // Log file encoding (you probably want utf8)

	// Here is the section where you put the usernames of the people you want to monitor
	// These should be ALL LOWERCASE.
	
	// "Best friends" are put at the top with a larger name
	bestFriends: [
		//"username1", "username2", "username3"
	],

	// "Friends" are listed below "best friends"
	friends: [
		//"username4", "username5", "username6"
	],

	// Usernames listed here will be ignored in stats (good for bots, etc.)
	nonPeople: [
		//"username7", "username8", "username9"
	]
}
