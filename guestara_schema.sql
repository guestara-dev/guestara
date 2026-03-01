-- ============================================================
--  GUESTARA — Schema MySQL completo
--  Ejecutar en orden. Base de datos nueva o limpia.
-- ============================================================

-- Si quieres limpiar la DB existente (saas_reservas u otra):
-- DROP DATABASE IF EXISTS guestara;
-- CREATE DATABASE guestara CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
-- USE guestara;

SET FOREIGN_KEY_CHECKS = 0;
DROP TABLE IF EXISTS reservation_extras, payments, reservations, guests, extras_catalog, rooms, users, hotels;
SET FOREIGN_KEY_CHECKS = 1;

-- ── 1. Hotels (multi-tenant) ─────────────────────────────────
CREATE TABLE hotels (
  id            BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  name          VARCHAR(255) NOT NULL,
  address       TEXT,
  phone         VARCHAR(50),
  email         VARCHAR(255),
  check_in_time TIME    DEFAULT '15:00:00',
  check_out_time TIME   DEFAULT '12:00:00',
  currency      CHAR(3) DEFAULT 'USD',
  timezone      VARCHAR(50) DEFAULT 'America/Santiago',
  created_at    TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at    TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);

-- ── 2. Users (staff) ────────────────────────────────────────
CREATE TABLE users (
  id         BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  hotel_id   BIGINT UNSIGNED NOT NULL,
  name       VARCHAR(255) NOT NULL,
  email      VARCHAR(255) UNIQUE NOT NULL,
  password   VARCHAR(255) NOT NULL,
  role       ENUM('admin','receptionist','housekeeping') DEFAULT 'receptionist',
  active     BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (hotel_id) REFERENCES hotels(id) ON DELETE CASCADE
);

-- ── 3. Rooms ────────────────────────────────────────────────
CREATE TABLE rooms (
  id          BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  hotel_id    BIGINT UNSIGNED NOT NULL,
  number      VARCHAR(10) NOT NULL,
  floor       TINYINT UNSIGNED NOT NULL,
  type        ENUM('single','double','suite') NOT NULL,
  status      ENUM('available','occupied','cleaning','maintenance') DEFAULT 'available',
  price       DECIMAL(10,2) NOT NULL,
  capacity    TINYINT UNSIGNED DEFAULT 2,
  description TEXT,
  created_at  TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at  TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  UNIQUE KEY uk_room (hotel_id, number),
  FOREIGN KEY (hotel_id) REFERENCES hotels(id) ON DELETE CASCADE
);

-- ── 4. Guests ───────────────────────────────────────────────
CREATE TABLE guests (
  id              BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  hotel_id        BIGINT UNSIGNED NOT NULL,
  name            VARCHAR(255) NOT NULL,
  email           VARCHAR(255),
  phone           VARCHAR(50),
  document_type   ENUM('rut','passport','dni','other') DEFAULT 'rut',
  document_number VARCHAR(50),
  nationality     VARCHAR(50) DEFAULT 'CL',
  notes           TEXT,
  created_at      TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at      TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (hotel_id) REFERENCES hotels(id) ON DELETE CASCADE
);

-- ── 5. Reservations ─────────────────────────────────────────
CREATE TABLE reservations (
  id           BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  hotel_id     BIGINT UNSIGNED NOT NULL,
  room_id      BIGINT UNSIGNED NOT NULL,
  guest_id     BIGINT UNSIGNED NOT NULL,
  check_in     DATE NOT NULL,
  check_out    DATE NOT NULL,
  nights       TINYINT UNSIGNED NOT NULL,
  status       ENUM('pending','confirmed','checked_in','completed','cancelled') DEFAULT 'pending',
  amount       DECIMAL(10,2) NOT NULL,
  notes        TEXT,
  created_by   BIGINT UNSIGNED,
  cancelled_at TIMESTAMP NULL,
  created_at   TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at   TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (hotel_id)   REFERENCES hotels(id),
  FOREIGN KEY (room_id)    REFERENCES rooms(id),
  FOREIGN KEY (guest_id)   REFERENCES guests(id),
  FOREIGN KEY (created_by) REFERENCES users(id)
);

-- ── 6. Extras Catalog ───────────────────────────────────────
CREATE TABLE extras_catalog (
  id          BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  hotel_id    BIGINT UNSIGNED NOT NULL,
  name        VARCHAR(255) NOT NULL,
  category    ENUM('food','drink','service','transport','other') NOT NULL,
  price       DECIMAL(10,2) NOT NULL,
  icon        VARCHAR(10) DEFAULT '✨',
  description TEXT,
  active      BOOLEAN DEFAULT TRUE,
  created_at  TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (hotel_id) REFERENCES hotels(id) ON DELETE CASCADE
);

-- ── 7. Reservation Extras ───────────────────────────────────
CREATE TABLE reservation_extras (
  id             BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  reservation_id BIGINT UNSIGNED NOT NULL,
  extra_id       BIGINT UNSIGNED NOT NULL,
  quantity       TINYINT UNSIGNED DEFAULT 1,
  unit_price     DECIMAL(10,2) NOT NULL,
  total_price    DECIMAL(10,2) NOT NULL,
  note           VARCHAR(255),
  added_by       BIGINT UNSIGNED,
  added_at       TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (reservation_id) REFERENCES reservations(id) ON DELETE CASCADE,
  FOREIGN KEY (extra_id)       REFERENCES extras_catalog(id),
  FOREIGN KEY (added_by)       REFERENCES users(id)
);

-- ── 8. Payments ─────────────────────────────────────────────
CREATE TABLE payments (
  id             BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  reservation_id BIGINT UNSIGNED NOT NULL,
  amount         DECIMAL(10,2) NOT NULL,
  method         ENUM('cash','card','transfer','other') DEFAULT 'cash',
  status         ENUM('pending','completed','refunded') DEFAULT 'pending',
  notes          VARCHAR(255),
  paid_at        TIMESTAMP NULL,
  created_at     TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (reservation_id) REFERENCES reservations(id) ON DELETE CASCADE
);

-- ============================================================
--  SEED DATA — Hotel de prueba
-- ============================================================

INSERT INTO hotels (name, address, phone, email, currency, timezone) VALUES
('Hotel Boutique Del Mar', 'Av. del Mar 123, Viña del Mar, Chile', '+56 9 1234 5678', 'contacto@hoteldelmar.cl', 'USD', 'America/Santiago');

INSERT INTO users (hotel_id, name, email, password, role) VALUES
(1, 'Admin Guestara', 'admin@hoteldelmar.cl', '$2b$12$HASH_PLACEHOLDER', 'admin'),
(1, 'Recepcionista',   'recep@hoteldelmar.cl', '$2b$12$HASH_PLACEHOLDER', 'receptionist');

-- 30 habitaciones: 15 singles + 15 doubles, 3 pisos
INSERT INTO rooms (hotel_id, number, floor, type, price, capacity) VALUES
(1,'101',1,'single', 89,1),(1,'102',1,'single', 89,1),(1,'103',1,'single', 89,1),(1,'104',1,'single', 89,1),(1,'105',1,'single', 89,1),
(1,'106',1,'double',129,2),(1,'107',1,'double',129,2),(1,'108',1,'double',129,2),(1,'109',1,'double',129,2),(1,'110',1,'double',129,2),
(1,'201',2,'single', 89,1),(1,'202',2,'single', 89,1),(1,'203',2,'single', 89,1),(1,'204',2,'single', 89,1),(1,'205',2,'single', 89,1),
(1,'206',2,'double',129,2),(1,'207',2,'double',129,2),(1,'208',2,'double',129,2),(1,'209',2,'double',129,2),(1,'210',2,'double',129,2),
(1,'301',3,'single', 89,1),(1,'302',3,'single', 89,1),(1,'303',3,'single', 89,1),(1,'304',3,'single', 89,1),(1,'305',3,'single', 89,1),
(1,'306',3,'double',129,2),(1,'307',3,'double',129,2),(1,'308',3,'double',129,2),(1,'309',3,'double',129,2),(1,'310',3,'double',129,2);

-- Extras catalog
INSERT INTO extras_catalog (hotel_id, name, category, price, icon) VALUES
(1,'Desayuno continental','food',   15,'🥐'),
(1,'Cena romántica',      'food',   65,'🍽️'),
(1,'Torta de cumpleaños', 'food',   35,'🎂'),
(1,'Botella de vino',     'drink',  35,'🍷'),
(1,'Champagne',           'drink',  55,'🥂'),
(1,'Mini bar premium',    'drink',  40,'🥃'),
(1,'Servicio de spa',     'service',80,'💆'),
(1,'Late check-out',      'service',30,'⏰'),
(1,'Servicio de cama',    'service',20,'🛏️'),
(1,'Transfer aeropuerto', 'transport',45,'🚗'),
(1,'Flores en habitación','other',  25,'💐'),
(1,'Decoración romántica','other',  45,'❤️');

-- ============================================================
-- Para limpiar la base de datos saas_reservas existente:
-- 
-- USE saas_reservas;
-- SET FOREIGN_KEY_CHECKS = 0;
-- DROP TABLE IF EXISTS availability_slots, bookings, cache, cache_locks,
--   failed_jobs, job_batches, jobs, migrations, password_reset_tokens,
--   resources, service_types, sessions, tenant_user, tenants, users;
-- SET FOREIGN_KEY_CHECKS = 1;
-- 
-- Luego ejecutar este script desde el inicio.
-- ============================================================
