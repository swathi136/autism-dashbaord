-- Create parents table and migrate existing consent info into parents
CREATE TABLE IF NOT EXISTS `parents` (
  `id` INT AUTO_INCREMENT PRIMARY KEY,
  `patient_id` INT NOT NULL,
  `parent_name` VARCHAR(255),
  `relationship` VARCHAR(100),
  `contact_number` VARCHAR(50),
  `parent_email` VARCHAR(255),
  `created_at` DATETIME DEFAULT CURRENT_TIMESTAMP,
  INDEX (`patient_id`),
  CONSTRAINT fk_parents_patient FOREIGN KEY (patient_id) REFERENCES patients(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- Optional migration from consents JSON into parents (run after creating table)
-- INSERT INTO parents (patient_id, parent_name, relationship, contact_number, parent_email, created_at)
-- SELECT patient_id,
--        JSON_UNQUOTE(JSON_EXTRACT(data,'$.parent_name')) AS parent_name,
--        JSON_UNQUOTE(JSON_EXTRACT(data,'$.relationship')) AS relationship,
--        JSON_UNQUOTE(JSON_EXTRACT(data,'$.contact_number')) AS contact_number,
--        JSON_UNQUOTE(JSON_EXTRACT(data,'$.parent_email')) AS parent_email,
--        created_at
-- FROM consents
-- WHERE JSON_EXTRACT(data,'$.parent_email') IS NOT NULL OR JSON_EXTRACT(data,'$.parent_name') IS NOT NULL;
