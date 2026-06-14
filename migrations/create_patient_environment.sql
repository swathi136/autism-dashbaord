-- Migration: create_patient_environment.sql
CREATE TABLE IF NOT EXISTS patient_environment (
  id INT AUTO_INCREMENT PRIMARY KEY,
  patient_id INT NOT NULL,
  country VARCHAR(100),
  state VARCHAR(100),
  district VARCHAR(100),
  city VARCHAR(150),
  pin_code VARCHAR(20),
  urbanity ENUM('Urban','Semi-urban','Rural') DEFAULT NULL,
  current_residence VARCHAR(255),
  duration_of_stay VARCHAR(100),
  exposure_industrial VARCHAR(100),
  exposure_pesticides VARCHAR(100),
  drinking_water_source VARCHAR(150),
  house_type ENUM('Apartment','Independent House','Rural House') DEFAULT NULL,
  exposure_pets VARCHAR(100),
  screen_time VARCHAR(50),
  raw_data JSON,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  INDEX (patient_id),
  CONSTRAINT fk_patient_environment_patient FOREIGN KEY (patient_id) REFERENCES patients(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
