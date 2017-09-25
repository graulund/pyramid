SET SQL_MODE = "NO_AUTO_VALUE_ON_ZERO";
SET time_zone = "+00:00";


/*!40101 SET @OLD_CHARACTER_SET_CLIENT=@@CHARACTER_SET_CLIENT */;
/*!40101 SET @OLD_CHARACTER_SET_RESULTS=@@CHARACTER_SET_RESULTS */;
/*!40101 SET @OLD_COLLATION_CONNECTION=@@COLLATION_CONNECTION */;
/*!40101 SET NAMES utf8mb4 */;

--
-- Database: `pyramid`
--

-- --------------------------------------------------------

--
-- Table structure for table `chatLines`
--

CREATE TABLE `chatLines` (
  `lineId` char(36) COLLATE utf8mb4_unicode_ci NOT NULL,
  `channelId` int(10) UNSIGNED NOT NULL,
  `type` varchar(15) COLLATE utf8mb4_unicode_ci NOT NULL,
  `time` datetime(3) NOT NULL,
  `date` date NOT NULL,
  `username` varchar(60) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `message` text COLLATE utf8mb4_unicode_ci,
  `symbol` varchar(2) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `tags` text COLLATE utf8mb4_unicode_ci,
  `eventData` text COLLATE utf8mb4_unicode_ci,
  `isHighlight` tinyint(1) NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- --------------------------------------------------------

--
-- Table structure for table `config`
--

CREATE TABLE `config` (
  `name` varchar(40) COLLATE utf8mb4_unicode_ci NOT NULL,
  `value` text COLLATE utf8mb4_unicode_ci
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- --------------------------------------------------------

--
-- Table structure for table `friends`
--

CREATE TABLE `friends` (
  `friendId` int(10) UNSIGNED NOT NULL,
  `serverId` int(10) UNSIGNED NOT NULL,
  `username` varchar(60) COLLATE utf8mb4_unicode_ci NOT NULL,
  `lastSeenTime` datetime(3) DEFAULT NULL,
  `lastSeenChannelId` int(10) UNSIGNED DEFAULT NULL,
  `isBestFriend` tinyint(1) NOT NULL DEFAULT '0',
  `isEnabled` tinyint(1) NOT NULL DEFAULT '1',
  `displayName` varchar(255) COLLATE utf8mb4_unicode_ci DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- --------------------------------------------------------

--
-- Table structure for table `ircChannels`
--

CREATE TABLE `ircChannels` (
  `channelId` int(10) UNSIGNED NOT NULL,
  `serverId` int(10) UNSIGNED NOT NULL,
  `channelType` tinyint(4) NOT NULL DEFAULT '0',
  `name` varchar(100) COLLATE utf8mb4_unicode_ci NOT NULL,
  `displayName` varchar(255) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `lastSeenTime` datetime(3) DEFAULT NULL,
  `lastSeenUsername` varchar(60) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `lastSeenDisplayName` varchar(255) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `isEnabled` tinyint(1) NOT NULL DEFAULT '1',
  `channelConfig` text COLLATE utf8mb4_unicode_ci
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- --------------------------------------------------------

--
-- Table structure for table `ircServers`
--

CREATE TABLE `ircServers` (
  `serverId` int(10) UNSIGNED NOT NULL,
  `name` varchar(60) COLLATE utf8mb4_unicode_ci NOT NULL,
  `hostname` varchar(255) COLLATE utf8mb4_unicode_ci NOT NULL,
  `port` smallint(5) UNSIGNED NOT NULL,
  `secure` tinyint(1) DEFAULT NULL,
  `username` varchar(60) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `password` text COLLATE utf8mb4_unicode_ci,
  `nickname` varchar(60) COLLATE utf8mb4_unicode_ci NOT NULL,
  `realname` varchar(60) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `isEnabled` tinyint(1) NOT NULL DEFAULT '1',
  `selfSigned` tinyint(1) DEFAULT NULL,
  `certExpired` tinyint(1) DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- --------------------------------------------------------

--
-- Table structure for table `nicknames`
--

CREATE TABLE `nicknames` (
  `nickname` varchar(100) COLLATE utf8mb4_unicode_ci NOT NULL,
  `channelBlacklist` text COLLATE utf8mb4_unicode_ci,
  `channelWhitelist` text COLLATE utf8mb4_unicode_ci,
  `serverBlacklist` text COLLATE utf8mb4_unicode_ci,
  `serverWhitelist` text COLLATE utf8mb4_unicode_ci
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- Indexes for dumped tables
--

--
-- Indexes for table `chatLines`
--
ALTER TABLE `chatLines`
  ADD PRIMARY KEY (`lineId`),
  ADD KEY `channelDateTime` (`channelId`,`date`,`time`),
  ADD KEY `usernameDateTime` (`date`,`time`,`username`),
  ADD KEY `isHighlight` (`isHighlight`);

--
-- Indexes for table `config`
--
ALTER TABLE `config`
  ADD PRIMARY KEY (`name`);

--
-- Indexes for table `friends`
--
ALTER TABLE `friends`
  ADD PRIMARY KEY (`friendId`),
  ADD UNIQUE KEY `serverUser` (`serverId`,`username`);

--
-- Indexes for table `ircChannels`
--
ALTER TABLE `ircChannels`
  ADD PRIMARY KEY (`channelId`),
  ADD UNIQUE KEY `serverChannel` (`serverId`,`channelType`,`name`);

--
-- Indexes for table `ircServers`
--
ALTER TABLE `ircServers`
  ADD PRIMARY KEY (`serverId`);

--
-- Indexes for table `nicknames`
--
ALTER TABLE `nicknames`
  ADD PRIMARY KEY (`nickname`);

--
-- AUTO_INCREMENT for dumped tables
--

--
-- AUTO_INCREMENT for table `friends`
--
ALTER TABLE `friends`
  MODIFY `friendId` int(10) UNSIGNED NOT NULL AUTO_INCREMENT;
--
-- AUTO_INCREMENT for table `ircChannels`
--
ALTER TABLE `ircChannels`
  MODIFY `channelId` int(10) UNSIGNED NOT NULL AUTO_INCREMENT;
--
-- AUTO_INCREMENT for table `ircServers`
--
ALTER TABLE `ircServers`
  MODIFY `serverId` int(10) UNSIGNED NOT NULL AUTO_INCREMENT;
/*!40101 SET CHARACTER_SET_CLIENT=@OLD_CHARACTER_SET_CLIENT */;
/*!40101 SET CHARACTER_SET_RESULTS=@OLD_CHARACTER_SET_RESULTS */;
/*!40101 SET COLLATION_CONNECTION=@OLD_COLLATION_CONNECTION */;
