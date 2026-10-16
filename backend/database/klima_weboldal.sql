-- =====================================================
-- Klíma weboldal - adatbázis (struktúra + példaadatok)
-- Újrafuttatható: a táblákat eldobja és újra létrehozza.
-- Import: lásd README (phpMyAdmin vagy mysql source)
-- =====================================================

CREATE DATABASE IF NOT EXISTS `klima_weboldal`
  DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_hungarian_ci;
USE `klima_weboldal`;

SET NAMES utf8mb4;
SET FOREIGN_KEY_CHECKS = 0;

DROP TABLE IF EXISTS `invoices`;
DROP TABLE IF EXISTS `order_items`;
DROP TABLE IF EXISTS `orders`;
DROP TABLE IF EXISTS `appointments`;
DROP TABLE IF EXISTS `calculator_results`;
DROP TABLE IF EXISTS `products`;
DROP TABLE IF EXISTS `users`;

-- ---------- users ----------
CREATE TABLE `users` (
  `id` INT NOT NULL AUTO_INCREMENT,
  `name` VARCHAR(255) NOT NULL,
  `email` VARCHAR(255) NOT NULL,
  `password` VARCHAR(255) NOT NULL,
  `role` ENUM('user','admin','szerelo') NOT NULL DEFAULT 'user',
  `created_at` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE KEY `uq_users_email` (`email`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_hungarian_ci;

-- ---------- products ----------
CREATE TABLE `products` (
  `id` INT NOT NULL AUTO_INCREMENT,
  `name` VARCHAR(255) NOT NULL,
  `price` INT NOT NULL,
  `description` TEXT NOT NULL,
  `stock` INT NOT NULL DEFAULT 0,
  `category` VARCHAR(255) NOT NULL,
  `brand` VARCHAR(255) NOT NULL,
  `btu` INT NOT NULL,
  `wifi` TINYINT(1) NOT NULL DEFAULT 0,
  `inverter` TINYINT(1) NOT NULL DEFAULT 0,
  `image_url` VARCHAR(255) NOT NULL,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_hungarian_ci;

-- ---------- appointments ----------
-- (a régi `mesage` elírt oszlop itt `message`, a kód is ezt használja;
--  az `assigned_szerelo` a szerelőhöz rendelést szolgálja)
CREATE TABLE `appointments` (
  `id` INT NOT NULL AUTO_INCREMENT,
  `user_id` INT NOT NULL,
  `date` DATE NOT NULL,
  `time` TIME NOT NULL,
  `status` ENUM('pending','approved','rejected') NOT NULL DEFAULT 'pending',
  `message` TEXT NOT NULL,
  `assigned_szerelo` INT NULL DEFAULT NULL,
  `created_at` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `idx_appointments_user` (`user_id`),
  KEY `idx_appointments_szerelo` (`assigned_szerelo`),
  CONSTRAINT `fk_appointments_user` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`) ON DELETE CASCADE,
  CONSTRAINT `fk_appointments_szerelo` FOREIGN KEY (`assigned_szerelo`) REFERENCES `users` (`id`) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_hungarian_ci;

-- ---------- calculator_results ----------
CREATE TABLE `calculator_results` (
  `id` INT NOT NULL AUTO_INCREMENT,
  `user_id` INT NOT NULL,
  `room_size` INT NOT NULL,
  `insulation` VARCHAR(255) NOT NULL,
  `sunlight` VARCHAR(255) NOT NULL,
  `recommended_model` VARCHAR(255) NOT NULL,
  `created_at` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `idx_calc_user` (`user_id`),
  CONSTRAINT `fk_calc_user` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_hungarian_ci;

-- ---------- orders ----------
CREATE TABLE `orders` (
  `id` INT NOT NULL AUTO_INCREMENT,
  `user_id` INT NOT NULL,
  `total_price` INT NOT NULL,
  `status` ENUM('pending','paid','shipped','cancelled') NOT NULL DEFAULT 'pending',
  `created_at` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `idx_orders_user` (`user_id`),
  CONSTRAINT `fk_orders_user` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_hungarian_ci;

-- ---------- order_items ----------
CREATE TABLE `order_items` (
  `id` INT NOT NULL AUTO_INCREMENT,
  `order_id` INT NOT NULL,
  `product_id` INT NOT NULL,
  `quantity` INT NOT NULL,
  `price` INT NOT NULL,
  PRIMARY KEY (`id`),
  KEY `idx_items_order` (`order_id`),
  KEY `idx_items_product` (`product_id`),
  CONSTRAINT `fk_items_order` FOREIGN KEY (`order_id`) REFERENCES `orders` (`id`) ON DELETE CASCADE,
  CONSTRAINT `fk_items_product` FOREIGN KEY (`product_id`) REFERENCES `products` (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_hungarian_ci;

-- ---------- invoices ----------
CREATE TABLE `invoices` (
  `id` INT NOT NULL AUTO_INCREMENT,
  `order_id` INT NOT NULL,
  `user_id` INT NOT NULL,
  `amount` INT NOT NULL,
  `date` DATE NOT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `uq_invoices_order` (`order_id`),
  KEY `idx_invoices_user` (`user_id`),
  CONSTRAINT `fk_invoices_order` FOREIGN KEY (`order_id`) REFERENCES `orders` (`id`),
  CONSTRAINT `fk_invoices_user` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_hungarian_ci;

SET FOREIGN_KEY_CHECKS = 1;

-- =====================================================
-- PÉLDAADATOK
-- Teszt belépések (jelszavak bcrypt hash-ként tárolva):
--   admin@klima.hu    / Admin123!
--   szerelo@klima.hu  / Szerelo123!
--   user@klima.hu     / User123!
-- =====================================================
INSERT INTO `users` (`id`, `name`, `email`, `password`, `role`) VALUES
(1, 'Admin',          'admin@klima.hu',   '$2b$10$LLR/MKqoFiJTrs3sQJayYuZJQskLb7J.yYRMO522vQXweDGtKsWLW',   'admin'),
(2, 'Kovács Szerelő', 'szerelo@klima.hu', '$2b$10$YKo/ItbxaaqlpaOtAZx8kOmA6nZeN.aQRwjI4DjjYMgt3vdiOotzO', 'szerelo'),
(3, 'Teszt Felhasználó', 'user@klima.hu', '$2b$10$u.iBU6QShr0Y6zVzZ0Eu9uVS4ZxVNE914dNCuPG0wOvEyhATVCedO',    'user');

INSERT INTO `products` (`id`, `name`, `price`, `description`, `stock`, `category`, `brand`, `btu`, `wifi`, `inverter`, `image_url`) VALUES
(1, 'Gree Amber 2.5 kW', 229000, 'Inverteres oldalfali split klíma kis helyiségekhez, Wi-Fi vezérléssel.', 10, 'Oldalfali', 'Gree',    9000,  1, 1, '/images/gree-amber-25.jpg'),
(2, 'Gree Amber 3.5 kW', 259000, 'Inverteres oldalfali split klíma közepes méretű szobákhoz, Wi-Fi vezérléssel.', 8, 'Oldalfali', 'Gree',  12000, 1, 1, '/images/gree-amber-35.jpg'),
(3, 'Gree Amber 5 kW',   329000, 'Nagy teljesítményű inverteres oldalfali split klíma nagyobb terekhez.', 5, 'Oldalfali', 'Gree',        18000, 1, 1, '/images/gree-amber-5.jpg'),
(4, 'Midea Xtreme Save 2.6 kW', 199000, 'Energiatakarékos inverteres klíma, csendes működéssel.', 12, 'Oldalfali', 'Midea',             9000,  0, 1, '/images/midea-xtreme-26.jpg'),
(5, 'Daikin Perfera 3.5 kW',    389000, 'Prémium inverteres klíma kiváló hatásfokkal és Wi-Fi vezérléssel.', 4, 'Oldalfali', 'Daikin', 12000, 1, 1, '/images/daikin-perfera-35.jpg');

-- Példa időpontfoglalás (a teszt felhasználótól)
INSERT INTO `appointments` (`user_id`, `date`, `time`, `status`, `message`, `assigned_szerelo`) VALUES
(3, '2026-11-05', '10:00:00', 'pending', 'Klíma telepítést kérnék a nappaliba.', NULL);