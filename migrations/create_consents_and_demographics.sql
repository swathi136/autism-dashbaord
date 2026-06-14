-- Migration to create consents and patient_demographics tables

CREATE TABLE IF NOT EXISTS `consents` (
  `id` INT AUTO_INCREMENT PRIMARY KEY,
  `patient_id` INT NOT NULL,
  `data` JSON,
  `created_at` DATETIME DEFAULT CURRENT_TIMESTAMP,
  INDEX (`patient_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE IF NOT EXISTS `patient_demographics` (
  `id` INT AUTO_INCREMENT PRIMARY KEY,
  `patient_id` INT NOT NULL,
  `data` JSON,
  `created_at` DATETIME DEFAULT CURRENT_TIMESTAMP,
  INDEX (`patient_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- Optional: keep existing patient_sections table format (should already exist)
-- CREATE TABLE IF NOT EXISTS `patient_sections` (
--   `id` INT AUTO_INCREMENT PRIMARY KEY,
--   `patient_id` INT NOT NULL,
--   `section_name` VARCHAR(255),
--   `data` JSON,
--   `created_at` DATETIME DEFAULT CURRENT_TIMESTAMP,
--   INDEX (`patient_id`)
-- ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
