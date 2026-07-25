-- MariaDB initial SQL schema script for Yu-Gi-Oh Manager

CREATE DATABASE IF NOT EXISTS `ygomgr` CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
USE `ygomgr`;

-- 1. Cards Table
CREATE TABLE IF NOT EXISTS `cards` (
  `id` INT NOT NULL,
  `name` VARCHAR(255) NOT NULL,
  `type` VARCHAR(100) DEFAULT NULL,
  `description` TEXT DEFAULT NULL,
  `frame_type` VARCHAR(50) DEFAULT NULL,
  `race` VARCHAR(100) DEFAULT NULL,
  `attribute` VARCHAR(50) DEFAULT NULL,
  `archetype` VARCHAR(100) DEFAULT NULL,
  `atk` INT DEFAULT NULL,
  `def` INT DEFAULT NULL,
  `level` INT DEFAULT NULL,
  `linkval` INT DEFAULT NULL,
  `scale` INT DEFAULT NULL,
  `image_url` TEXT DEFAULT NULL,
  `raw_json` LONGTEXT DEFAULT NULL,
  `updated_at` DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `idx_cards_name` (`name`),
  KEY `idx_cards_type` (`type`),
  KEY `idx_cards_race` (`race`),
  KEY `idx_cards_attribute` (`attribute`),
  KEY `idx_cards_archetype` (`archetype`),
  KEY `idx_cards_atk` (`atk`),
  KEY `idx_cards_def` (`def`),
  KEY `idx_cards_level` (`level`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 2. Collection Cards Table
CREATE TABLE IF NOT EXISTS `collection_cards` (
  `id` INT NOT NULL AUTO_INCREMENT,
  `owner_id` VARCHAR(100) NOT NULL DEFAULT 'local',
  `card_id` INT NOT NULL,
  `quantity_owned` INT NOT NULL DEFAULT '0',
  `updated_at` DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE KEY `uq_owner_card` (`owner_id`, `card_id`),
  KEY `idx_collection_owner` (`owner_id`),
  KEY `idx_collection_card` (`card_id`),
  CONSTRAINT `fk_collection_card` FOREIGN KEY (`card_id`) REFERENCES `cards` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 3. Decks Table
CREATE TABLE IF NOT EXISTS `decks` (
  `id` VARCHAR(36) NOT NULL,
  `owner_id` VARCHAR(100) NOT NULL DEFAULT 'local',
  `name` VARCHAR(255) NOT NULL,
  `created_at` DATETIME DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `idx_decks_owner` (`owner_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 4. Deck Cards Table
CREATE TABLE IF NOT EXISTS `deck_cards` (
  `id` VARCHAR(36) NOT NULL,
  `deck_id` VARCHAR(36) NOT NULL,
  `card_id` INT NOT NULL,
  `quantity` INT NOT NULL DEFAULT '1',
  `section` VARCHAR(20) NOT NULL DEFAULT 'main',
  PRIMARY KEY (`id`),
  UNIQUE KEY `uq_deck_card_section` (`deck_id`, `card_id`, `section`),
  KEY `idx_deck_cards_deck` (`deck_id`),
  KEY `idx_deck_cards_card` (`card_id`),
  CONSTRAINT `fk_deck_cards_deck` FOREIGN KEY (`deck_id`) REFERENCES `decks` (`id`) ON DELETE CASCADE,
  CONSTRAINT `fk_deck_cards_card` FOREIGN KEY (`card_id`) REFERENCES `cards` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
