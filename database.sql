-- --------------------------------------------------------
-- Host:                         178.238.235.49
-- Server version:               10.3.22-MariaDB-0+deb10u1 - Debian 10
-- Server OS:                    debian-linux-gnu
-- HeidiSQL Version:             10.2.0.5599
-- --------------------------------------------------------

/*!40101 SET @OLD_CHARACTER_SET_CLIENT=@@CHARACTER_SET_CLIENT */;
/*!40101 SET NAMES utf8 */;
/*!50503 SET NAMES utf8mb4 */;
/*!40014 SET @OLD_FOREIGN_KEY_CHECKS=@@FOREIGN_KEY_CHECKS, FOREIGN_KEY_CHECKS=0 */;
/*!40101 SET @OLD_SQL_MODE=@@SQL_MODE, SQL_MODE='NO_AUTO_VALUE_ON_ZERO' */;


-- Dumping database structure for tsbot
CREATE DATABASE IF NOT EXISTS `tsbot` /*!40100 DEFAULT CHARACTER SET utf8mb4 */;
USE `tsbot`;

-- Dumping structure for table tsbot.automove
CREATE TABLE IF NOT EXISTS `automove` (
  `uniqueid` varchar(255) NOT NULL,
  `room_id` int(11) NOT NULL DEFAULT 0,
  PRIMARY KEY (`uniqueid`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- Data exporting was unselected.

-- Dumping structure for table tsbot.ts_rooms
CREATE TABLE IF NOT EXISTS `ts_rooms` (
  `id` int(32) NOT NULL AUTO_INCREMENT,
  `room_name` text COLLATE utf8mb4_unicode_ci NOT NULL,
  `owner` text COLLATE utf8mb4_unicode_ci NOT NULL,
  `creation_date` int(128) NOT NULL,
  `expiration_time` int(128) NOT NULL,
  `room_id` int(32) NOT NULL,
  `user_ip` varchar(128) CHARACTER SET utf8 NOT NULL,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB AUTO_INCREMENT=2135 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Data exporting was unselected.

-- Dumping structure for table tsbot.ts_rooms_backup
CREATE TABLE IF NOT EXISTS `ts_rooms_backup` (
  `id` int(32) NOT NULL AUTO_INCREMENT,
  `room_name` text CHARACTER SET utf8 NOT NULL,
  `owner` text CHARACTER SET utf8 NOT NULL,
  `creation_date` int(128) NOT NULL,
  `expiration_time` int(128) NOT NULL,
  `room_id` int(32) NOT NULL,
  `user_ip` varchar(128) NOT NULL,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB AUTO_INCREMENT=2126 DEFAULT CHARSET=latin1;

-- Data exporting was unselected.

-- Dumping structure for table tsbot.ts_users
CREATE TABLE IF NOT EXISTS `ts_users` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `uniqueid` varchar(255) CHARACTER SET latin1 NOT NULL,
  `points` int(64) NOT NULL,
  `nick` varchar(255) COLLATE utf8mb4_unicode_ci NOT NULL,
  `lastupdate` int(32) DEFAULT 0,
  `user_ip` varchar(24) CHARACTER SET latin1 NOT NULL DEFAULT '0.0.0.0',
  PRIMARY KEY (`id`),
  UNIQUE KEY `uniqueid` (`uniqueid`)
) ENGINE=MyISAM AUTO_INCREMENT=29187 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Data exporting was unselected.

/*!40101 SET SQL_MODE=IFNULL(@OLD_SQL_MODE, '') */;
/*!40014 SET FOREIGN_KEY_CHECKS=IF(@OLD_FOREIGN_KEY_CHECKS IS NULL, 1, @OLD_FOREIGN_KEY_CHECKS) */;
/*!40101 SET CHARACTER_SET_CLIENT=@OLD_CHARACTER_SET_CLIENT */;
