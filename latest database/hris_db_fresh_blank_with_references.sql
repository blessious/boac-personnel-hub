-- Fresh blank HRIS database generated from hris_db.sql
--
-- Source: latest database/hris_db.sql; data removed
-- ------------------------------------------------------
-- Server version	8.0.44

/*!40101 SET @OLD_CHARACTER_SET_CLIENT=@@CHARACTER_SET_CLIENT */;
/*!40101 SET @OLD_CHARACTER_SET_RESULTS=@@CHARACTER_SET_RESULTS */;
/*!40101 SET @OLD_COLLATION_CONNECTION=@@COLLATION_CONNECTION */;
/*!50503 SET NAMES utf8 */;
/*!40103 SET @OLD_TIME_ZONE=@@TIME_ZONE */;
/*!40103 SET TIME_ZONE='+00:00' */;
/*!40014 SET @OLD_UNIQUE_CHECKS=@@UNIQUE_CHECKS, UNIQUE_CHECKS=0 */;
/*!40014 SET @OLD_FOREIGN_KEY_CHECKS=@@FOREIGN_KEY_CHECKS, FOREIGN_KEY_CHECKS=0 */;
/*!40101 SET @OLD_SQL_MODE=@@SQL_MODE, SQL_MODE='NO_AUTO_VALUE_ON_ZERO' */;
/*!40111 SET @OLD_SQL_NOTES=@@SQL_NOTES, SQL_NOTES=0 */;

--
-- Table structure for table `agency_settings`
--

DROP TABLE IF EXISTS `agency_settings`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `agency_settings` (
  `id` tinyint unsigned NOT NULL DEFAULT '1',
  `name` varchar(200) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
  `tagline` varchar(255) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
  `logo_url` longtext CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci,
  `icon_url` longtext CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci,
  `banner_url` longtext CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci,
  `updated_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
--


--
-- Table structure for table `attendance_import_logs`
--

DROP TABLE IF EXISTS `attendance_import_logs`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `attendance_import_logs` (
  `id` bigint unsigned NOT NULL AUTO_INCREMENT,
  `import_id` char(36) NOT NULL,
  `level` enum('Info','Success','Warning','Error') NOT NULL DEFAULT 'Info',
  `source_row_number` int unsigned DEFAULT NULL,
  `employee_no` varchar(80) DEFAULT NULL,
  `message` varchar(500) NOT NULL,
  `details` json DEFAULT NULL,
  `created_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `idx_attendance_import_logs_import_id` (`import_id`),
  KEY `idx_attendance_import_logs_level` (`level`),
  CONSTRAINT `fk_attendance_import_logs_import_id` FOREIGN KEY (`import_id`) REFERENCES `attendance_imports` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
--


--
-- Table structure for table `attendance_imports`
--

DROP TABLE IF EXISTS `attendance_imports`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `attendance_imports` (
  `id` char(36) NOT NULL,
  `source` enum('CSV','Manual','Biometric','Legacy') NOT NULL DEFAULT 'CSV',
  `file_name` varchar(255) DEFAULT NULL,
  `period_from` date DEFAULT NULL,
  `period_to` date DEFAULT NULL,
  `row_count` int unsigned NOT NULL DEFAULT '0',
  `status` enum('Processing','Completed','Failed') NOT NULL DEFAULT 'Completed',
  `notes` text,
  `imported_by` int unsigned DEFAULT NULL,
  `imported_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `idx_attendance_imports_period` (`period_from`,`period_to`),
  KEY `fk_attendance_imports_imported_by` (`imported_by`),
  CONSTRAINT `fk_attendance_imports_imported_by` FOREIGN KEY (`imported_by`) REFERENCES `users` (`id`) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
--


--
-- Table structure for table `attendance_logs`
--

DROP TABLE IF EXISTS `attendance_logs`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `attendance_logs` (
  `id` char(36) NOT NULL,
  `employee_id` char(36) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
  `punch_at` datetime NOT NULL,
  `punch_date` date GENERATED ALWAYS AS (cast(`punch_at` as date)) STORED,
  `source` enum('CSV','Manual','Biometric','Legacy') NOT NULL DEFAULT 'CSV',
  `source_device` varchar(120) DEFAULT NULL,
  `import_id` char(36) DEFAULT NULL,
  `raw_payload` json DEFAULT NULL,
  `created_by` int unsigned DEFAULT NULL,
  `created_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE KEY `uniq_attendance_logs_employee_punch` (`employee_id`,`punch_at`),
  KEY `idx_attendance_logs_employee_date` (`employee_id`,`punch_date`),
  KEY `idx_attendance_logs_import_id` (`import_id`),
  KEY `fk_attendance_logs_created_by` (`created_by`),
  CONSTRAINT `fk_attendance_logs_created_by` FOREIGN KEY (`created_by`) REFERENCES `users` (`id`) ON DELETE SET NULL,
  CONSTRAINT `fk_attendance_logs_employee_id` FOREIGN KEY (`employee_id`) REFERENCES `employees` (`id`) ON DELETE CASCADE,
  CONSTRAINT `fk_attendance_logs_import_id` FOREIGN KEY (`import_id`) REFERENCES `attendance_imports` (`id`) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
--


--
-- Table structure for table `audit_logs`
--

DROP TABLE IF EXISTS `audit_logs`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `audit_logs` (
  `id` bigint unsigned NOT NULL AUTO_INCREMENT,
  `user_id` int unsigned DEFAULT NULL,
  `action` varchar(120) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
  `details` json DEFAULT NULL,
  `ip_address` varchar(64) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `created_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `idx_audit_user_id` (`user_id`),
  CONSTRAINT `fk_audit_user_id` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
--


--
-- Table structure for table `biometric_devices`
--

DROP TABLE IF EXISTS `biometric_devices`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `biometric_devices` (
  `id` bigint unsigned NOT NULL AUTO_INCREMENT,
  `name` varchar(120) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
  `ip_address` varchar(80) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
  `port` int unsigned NOT NULL DEFAULT '4370',
  `is_active` tinyint(1) NOT NULL DEFAULT '1',
  `created_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
--


--
-- Table structure for table `departments`
--

DROP TABLE IF EXISTS `departments`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `departments` (
  `id` int unsigned NOT NULL AUTO_INCREMENT,
  `name` varchar(200) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
  `sort_order` int unsigned NOT NULL DEFAULT '0',
  `created_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE KEY `name` (`name`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
--


--
-- Table structure for table `document_export_jobs`
--

DROP TABLE IF EXISTS `document_export_jobs`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `document_export_jobs` (
  `id` char(36) COLLATE utf8mb4_unicode_ci NOT NULL,
  `file_name` varchar(255) COLLATE utf8mb4_unicode_ci NOT NULL,
  `export_type` varchar(40) COLLATE utf8mb4_unicode_ci NOT NULL,
  `employee_id` char(36) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `created_by` int unsigned DEFAULT NULL,
  `expires_at` datetime NOT NULL,
  `downloaded_at` datetime DEFAULT NULL,
  `download_count` tinyint unsigned NOT NULL DEFAULT '0',
  `created_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE KEY `file_name` (`file_name`),
  KEY `idx_document_export_jobs_expiry` (`expires_at`),
  KEY `idx_document_export_jobs_employee` (`employee_id`),
  KEY `fk_document_export_jobs_created_by` (`created_by`),
  CONSTRAINT `fk_document_export_jobs_created_by` FOREIGN KEY (`created_by`) REFERENCES `users` (`id`) ON DELETE SET NULL,
  CONSTRAINT `fk_document_export_jobs_employee` FOREIGN KEY (`employee_id`) REFERENCES `employees` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
--


--
-- Table structure for table `dtr_correction_events`
--

DROP TABLE IF EXISTS `dtr_correction_events`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `dtr_correction_events` (
  `id` char(36) NOT NULL,
  `request_id` char(36) NOT NULL,
  `event_type` enum('Filed','Approved','Disapproved','Cancelled','Reversed') NOT NULL,
  `from_status` varchar(24) DEFAULT NULL,
  `to_status` varchar(24) NOT NULL,
  `actor_id` int unsigned DEFAULT NULL,
  `remarks` text,
  `ip_address` varchar(64) DEFAULT NULL,
  `original_json` json DEFAULT NULL,
  `requested_json` json DEFAULT NULL,
  `applied_json` json DEFAULT NULL,
  `created_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `idx_dtr_correction_events_request_date` (`request_id`,`created_at`),
  KEY `fk_dtr_correction_events_actor_id` (`actor_id`),
  CONSTRAINT `fk_dtr_correction_events_actor_id` FOREIGN KEY (`actor_id`) REFERENCES `users` (`id`) ON DELETE SET NULL,
  CONSTRAINT `fk_dtr_correction_events_request_id` FOREIGN KEY (`request_id`) REFERENCES `dtr_correction_requests` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
--


--
-- Table structure for table `dtr_correction_requests`
--

DROP TABLE IF EXISTS `dtr_correction_requests`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `dtr_correction_requests` (
  `id` char(36) NOT NULL,
  `employee_id` char(36) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
  `dtr_entry_id` char(36) DEFAULT NULL,
  `work_date` date NOT NULL,
  `request_type` enum('Times','Label') NOT NULL,
  `original_am_in` time DEFAULT NULL,
  `original_am_out` time DEFAULT NULL,
  `original_pm_in` time DEFAULT NULL,
  `original_pm_out` time DEFAULT NULL,
  `original_label` varchar(180) DEFAULT NULL,
  `requested_am_in` time DEFAULT NULL,
  `requested_am_out` time DEFAULT NULL,
  `requested_pm_in` time DEFAULT NULL,
  `requested_pm_out` time DEFAULT NULL,
  `requested_label` varchar(180) DEFAULT NULL,
  `reason` text NOT NULL,
  `status` enum('Pending','Approved','Disapproved','Cancelled','Reversed') NOT NULL DEFAULT 'Pending',
  `reviewed_by` int unsigned DEFAULT NULL,
  `review_remarks` text,
  `reviewed_at` datetime DEFAULT NULL,
  `created_by` int unsigned DEFAULT NULL,
  `created_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  `pre_approval_snapshot` json DEFAULT NULL,
  `applied_snapshot` json DEFAULT NULL,
  `request_ip` varchar(64) DEFAULT NULL,
  `review_ip` varchar(64) DEFAULT NULL,
  `reversed_by` int unsigned DEFAULT NULL,
  `reverse_reason` text,
  `reversal_ip` varchar(64) DEFAULT NULL,
  `reversed_at` datetime DEFAULT NULL,
  PRIMARY KEY (`id`),
  KEY `idx_dtr_corrections_employee_date` (`employee_id`,`work_date`),
  KEY `idx_dtr_corrections_status_created` (`status`,`created_at`),
  KEY `fk_dtr_corrections_dtr_entry_id` (`dtr_entry_id`),
  KEY `fk_dtr_corrections_reviewed_by` (`reviewed_by`),
  KEY `fk_dtr_corrections_created_by` (`created_by`),
  KEY `fk_dtr_corrections_reversed_by` (`reversed_by`),
  CONSTRAINT `fk_dtr_corrections_created_by` FOREIGN KEY (`created_by`) REFERENCES `users` (`id`) ON DELETE SET NULL,
  CONSTRAINT `fk_dtr_corrections_dtr_entry_id` FOREIGN KEY (`dtr_entry_id`) REFERENCES `dtr_entries` (`id`) ON DELETE SET NULL,
  CONSTRAINT `fk_dtr_corrections_employee_id` FOREIGN KEY (`employee_id`) REFERENCES `employees` (`id`) ON DELETE CASCADE,
  CONSTRAINT `fk_dtr_corrections_reversed_by` FOREIGN KEY (`reversed_by`) REFERENCES `users` (`id`) ON DELETE SET NULL,
  CONSTRAINT `fk_dtr_corrections_reviewed_by` FOREIGN KEY (`reviewed_by`) REFERENCES `users` (`id`) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
--


--
-- Table structure for table `dtr_entries`
--

DROP TABLE IF EXISTS `dtr_entries`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `dtr_entries` (
  `id` char(36) NOT NULL,
  `employee_id` char(36) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
  `work_date` date NOT NULL,
  `am_in` time DEFAULT NULL,
  `am_out` time DEFAULT NULL,
  `pm_in` time DEFAULT NULL,
  `pm_out` time DEFAULT NULL,
  `status` enum('Present','Late','Absent','Incomplete','Leave','Official Business','Rest Day','Holiday') NOT NULL DEFAULT 'Incomplete',
  `late_minutes` int unsigned NOT NULL DEFAULT '0',
  `undertime_minutes` int unsigned NOT NULL DEFAULT '0',
  `source` enum('Imported','Manual','Adjusted') NOT NULL DEFAULT 'Imported',
  `remarks` text,
  `locked` tinyint(1) NOT NULL DEFAULT '0',
  `import_id` char(36) DEFAULT NULL,
  `edited_by` int unsigned DEFAULT NULL,
  `edited_at` datetime DEFAULT NULL,
  `created_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  `display_label` varchar(180) DEFAULT NULL,
  `display_label_request_id` char(36) DEFAULT NULL,
  `shift_template_id` bigint unsigned DEFAULT NULL,
  `review_flags` json DEFAULT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `uniq_dtr_entries_employee_date` (`employee_id`,`work_date`),
  KEY `idx_dtr_entries_date` (`work_date`),
  KEY `idx_dtr_entries_status` (`status`),
  KEY `fk_dtr_entries_import_id` (`import_id`),
  KEY `fk_dtr_entries_edited_by` (`edited_by`),
  KEY `idx_dtr_entries_shift_template` (`shift_template_id`),
  CONSTRAINT `fk_dtr_entries_edited_by` FOREIGN KEY (`edited_by`) REFERENCES `users` (`id`) ON DELETE SET NULL,
  CONSTRAINT `fk_dtr_entries_employee_id` FOREIGN KEY (`employee_id`) REFERENCES `employees` (`id`) ON DELETE CASCADE,
  CONSTRAINT `fk_dtr_entries_import_id` FOREIGN KEY (`import_id`) REFERENCES `attendance_imports` (`id`) ON DELETE SET NULL,
  CONSTRAINT `fk_dtr_entries_shift_template` FOREIGN KEY (`shift_template_id`) REFERENCES `shift_templates` (`id`) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
--


--
-- Table structure for table `dtr_export_jobs`
--

DROP TABLE IF EXISTS `dtr_export_jobs`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `dtr_export_jobs` (
  `id` char(36) NOT NULL,
  `scope` enum('Single','Mass') NOT NULL,
  `employee_id` char(36) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `period_from` date NOT NULL,
  `period_to` date NOT NULL,
  `file_name` varchar(255) NOT NULL,
  `row_count` int unsigned NOT NULL DEFAULT '0',
  `created_by` int unsigned DEFAULT NULL,
  `created_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `idx_dtr_export_jobs_period` (`period_from`,`period_to`),
  KEY `fk_dtr_export_jobs_employee_id` (`employee_id`),
  KEY `fk_dtr_export_jobs_created_by` (`created_by`),
  KEY `idx_dtr_export_jobs_file_name` (`file_name`),
  CONSTRAINT `fk_dtr_export_jobs_created_by` FOREIGN KEY (`created_by`) REFERENCES `users` (`id`) ON DELETE SET NULL,
  CONSTRAINT `fk_dtr_export_jobs_employee_id` FOREIGN KEY (`employee_id`) REFERENCES `employees` (`id`) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
--


--
-- Table structure for table `dtr_noters`
--

DROP TABLE IF EXISTS `dtr_noters`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `dtr_noters` (
  `id` bigint unsigned NOT NULL AUTO_INCREMENT,
  `name` varchar(200) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
  `position` varchar(200) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
  `office` varchar(200) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `signatory` varchar(200) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
  `is_active` tinyint(1) NOT NULL DEFAULT '1',
  `created_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `idx_dtr_noters_active` (`is_active`),
  KEY `idx_dtr_noters_office` (`office`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
--


--
-- Table structure for table `employee_child_records`
--

DROP TABLE IF EXISTS `employee_child_records`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `employee_child_records` (
  `id` char(36) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
  `employee_id` char(36) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
  `payload` json NOT NULL,
  `created_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `idx_employee_child_records_employee_id` (`employee_id`),
  CONSTRAINT `fk_employee_child_records_employee_id` FOREIGN KEY (`employee_id`) REFERENCES `employees` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
--


--
-- Table structure for table `employee_civil_service_records`
--

DROP TABLE IF EXISTS `employee_civil_service_records`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `employee_civil_service_records` (
  `id` char(36) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
  `employee_id` char(36) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
  `payload` json NOT NULL,
  `created_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `idx_employee_civil_service_records_employee_id` (`employee_id`),
  CONSTRAINT `fk_employee_civil_service_records_employee_id` FOREIGN KEY (`employee_id`) REFERENCES `employees` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
--


--
-- Table structure for table `employee_education_records`
--

DROP TABLE IF EXISTS `employee_education_records`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `employee_education_records` (
  `id` char(36) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
  `employee_id` char(36) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
  `payload` json NOT NULL,
  `created_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `idx_employee_education_records_employee_id` (`employee_id`),
  CONSTRAINT `fk_employee_education_records_employee_id` FOREIGN KEY (`employee_id`) REFERENCES `employees` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
--


--
-- Table structure for table `employee_family_records`
--

DROP TABLE IF EXISTS `employee_family_records`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `employee_family_records` (
  `id` char(36) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
  `employee_id` char(36) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
  `payload` json NOT NULL,
  `created_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE KEY `uniq_employee_family_records_employee_id` (`employee_id`),
  KEY `idx_employee_family_records_employee_id` (`employee_id`),
  CONSTRAINT `fk_employee_family_records_employee_id` FOREIGN KEY (`employee_id`) REFERENCES `employees` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
--


--
-- Table structure for table `employee_ipcr_records`
--

DROP TABLE IF EXISTS `employee_ipcr_records`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `employee_ipcr_records` (
  `id` char(36) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
  `employee_id` char(36) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
  `payload` json NOT NULL,
  `created_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `idx_employee_ipcr_records_employee_id` (`employee_id`),
  CONSTRAINT `fk_employee_ipcr_records_employee_id` FOREIGN KEY (`employee_id`) REFERENCES `employees` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
--


--
-- Table structure for table `employee_organization_records`
--

DROP TABLE IF EXISTS `employee_organization_records`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `employee_organization_records` (
  `id` char(36) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
  `employee_id` char(36) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
  `payload` json NOT NULL,
  `created_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `idx_employee_organization_records_employee_id` (`employee_id`),
  CONSTRAINT `fk_employee_organization_records_employee_id` FOREIGN KEY (`employee_id`) REFERENCES `employees` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
--


--
-- Table structure for table `employee_salary_records`
--

DROP TABLE IF EXISTS `employee_salary_records`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `employee_salary_records` (
  `id` char(36) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
  `employee_id` char(36) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
  `payload` json NOT NULL,
  `created_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `idx_employee_salary_records_employee_id` (`employee_id`),
  CONSTRAINT `fk_employee_salary_records_employee_id` FOREIGN KEY (`employee_id`) REFERENCES `employees` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
--


--
-- Table structure for table `employee_schedule_overrides`
--

DROP TABLE IF EXISTS `employee_schedule_overrides`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `employee_schedule_overrides` (
  `id` bigint unsigned NOT NULL AUTO_INCREMENT,
  `employee_id` char(36) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
  `work_date` date NOT NULL,
  `am_in` time DEFAULT NULL,
  `am_out` time DEFAULT NULL,
  `pm_in` time DEFAULT NULL,
  `pm_out` time DEFAULT NULL,
  `created_by` int unsigned DEFAULT NULL,
  `created_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE KEY `uniq_employee_schedule_date` (`employee_id`,`work_date`),
  KEY `idx_employee_schedule_work_date` (`work_date`),
  KEY `fk_employee_schedule_created_by` (`created_by`),
  CONSTRAINT `fk_employee_schedule_created_by` FOREIGN KEY (`created_by`) REFERENCES `users` (`id`) ON DELETE SET NULL,
  CONSTRAINT `fk_employee_schedule_employee_id` FOREIGN KEY (`employee_id`) REFERENCES `employees` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
--


--
-- Table structure for table `employee_service_records`
--

DROP TABLE IF EXISTS `employee_service_records`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `employee_service_records` (
  `id` char(36) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
  `employee_id` char(36) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
  `payload` json NOT NULL,
  `created_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `idx_employee_service_records_employee_id` (`employee_id`),
  CONSTRAINT `fk_employee_service_records_employee_id` FOREIGN KEY (`employee_id`) REFERENCES `employees` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
--


--
-- Table structure for table `employee_shift_assignments`
--

DROP TABLE IF EXISTS `employee_shift_assignments`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `employee_shift_assignments` (
  `id` bigint unsigned NOT NULL AUTO_INCREMENT,
  `employee_id` char(36) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
  `duty_date` date NOT NULL,
  `shift_template_id` bigint unsigned NOT NULL,
  `created_by` int unsigned DEFAULT NULL,
  `created_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE KEY `uniq_employee_shift_assignment` (`employee_id`,`duty_date`),
  KEY `idx_employee_shift_assignments_date` (`duty_date`),
  KEY `idx_employee_shift_assignments_template` (`shift_template_id`),
  KEY `fk_employee_shift_assignment_created_by` (`created_by`),
  CONSTRAINT `fk_employee_shift_assignment_created_by` FOREIGN KEY (`created_by`) REFERENCES `users` (`id`) ON DELETE SET NULL,
  CONSTRAINT `fk_employee_shift_assignment_employee` FOREIGN KEY (`employee_id`) REFERENCES `employees` (`id`) ON DELETE CASCADE,
  CONSTRAINT `fk_employee_shift_assignment_template` FOREIGN KEY (`shift_template_id`) REFERENCES `shift_templates` (`id`) ON DELETE RESTRICT
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
--


--
-- Table structure for table `employee_training_records`
--

DROP TABLE IF EXISTS `employee_training_records`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `employee_training_records` (
  `id` char(36) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
  `employee_id` char(36) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
  `payload` json NOT NULL,
  `created_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `idx_employee_training_records_employee_id` (`employee_id`),
  CONSTRAINT `fk_employee_training_records_employee_id` FOREIGN KEY (`employee_id`) REFERENCES `employees` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
--


--
-- Table structure for table `employee_work_records`
--

DROP TABLE IF EXISTS `employee_work_records`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `employee_work_records` (
  `id` char(36) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
  `employee_id` char(36) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
  `payload` json NOT NULL,
  `created_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `idx_employee_work_records_employee_id` (`employee_id`),
  CONSTRAINT `fk_employee_work_records_employee_id` FOREIGN KEY (`employee_id`) REFERENCES `employees` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
--


--
-- Table structure for table `employees`
--

DROP TABLE IF EXISTS `employees`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `employees` (
  `id` char(36) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
  `employee_no` varchar(80) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
  `firstname` varchar(120) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
  `middlename` varchar(120) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `lastname` varchar(120) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
  `name_ext` varchar(30) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `department` varchar(200) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
  `position` varchar(200) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
  `status` varchar(40) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT 'Permanent',
  `level` varchar(40) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `status_class` varchar(80) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `date_hired` date DEFAULT NULL,
  `date_employed` date DEFAULT NULL,
  `item_no` varchar(120) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `emp_status` varchar(20) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT 'Active',
  `lifecycle_state` varchar(30) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT 'Active',
  `current_org_unit_ref_id` int unsigned DEFAULT NULL,
  `birthday` date DEFAULT NULL,
  `gender` varchar(20) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `civil_status` varchar(40) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `email` varchar(180) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `cellphone_no` varchar(80) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `photo_url` longtext CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci,
  `profile_json` json DEFAULT NULL,
  `created_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  `schedule_am_in` time DEFAULT '08:00:00',
  `schedule_am_out` time DEFAULT '12:00:00',
  `schedule_pm_in` time DEFAULT '13:00:00',
  `schedule_pm_out` time DEFAULT '17:00:00',
  `dtr_signatory` varchar(200) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `dtr_noter_id` bigint unsigned DEFAULT NULL,
  `regular` tinyint(1) NOT NULL DEFAULT '1',
  `is_dtr_noter` tinyint(1) NOT NULL DEFAULT '0',
  `biometric_id` varchar(80) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `is_hidden` tinyint(1) NOT NULL DEFAULT '0',
  PRIMARY KEY (`id`),
  UNIQUE KEY `employee_no` (`employee_no`),
  KEY `idx_employees_department` (`department`),
  KEY `idx_employees_status` (`status`),
  KEY `idx_employees_emp_status` (`emp_status`),
  KEY `idx_employees_name` (`lastname`,`firstname`),
  KEY `idx_employees_biometric_id` (`biometric_id`),
  KEY `idx_employees_is_hidden` (`is_hidden`),
  KEY `idx_employees_dashboard_position` (`department`,`position`,`emp_status`),
  KEY `idx_employee_assignment_reporting` (`current_org_unit_ref_id`,`lifecycle_state`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
--


--
-- Table structure for table `error_logs`
--

DROP TABLE IF EXISTS `error_logs`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `error_logs` (
  `id` bigint unsigned NOT NULL AUTO_INCREMENT,
  `user_id` int unsigned DEFAULT NULL,
  `method` varchar(12) DEFAULT NULL,
  `path` varchar(500) DEFAULT NULL,
  `message` text NOT NULL,
  `stack` mediumtext,
  `ip_address` varchar(64) DEFAULT NULL,
  `user_agent` varchar(500) DEFAULT NULL,
  `created_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `idx_error_logs_user_id` (`user_id`),
  KEY `idx_error_logs_created_at` (`created_at`),
  CONSTRAINT `fk_error_logs_user_id` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
--


--
-- Table structure for table `hr_reference_values`
--

DROP TABLE IF EXISTS `hr_reference_values`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `hr_reference_values` (
  `id` int unsigned NOT NULL AUTO_INCREMENT,
  `category` varchar(50) NOT NULL,
  `code` varchar(80) NOT NULL,
  `name` varchar(200) NOT NULL,
  `description` text,
  `parent_id` int unsigned DEFAULT NULL,
  `is_active` tinyint(1) NOT NULL DEFAULT '1',
  `effective_from` date DEFAULT NULL,
  `effective_to` date DEFAULT NULL,
  `sort_order` int unsigned NOT NULL DEFAULT '0',
  `created_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE KEY `uniq_hr_reference_category_code` (`category`,`code`),
  UNIQUE KEY `uniq_hr_reference_category_name` (`category`,`name`),
  KEY `idx_hr_reference_category_active` (`category`,`is_active`,`sort_order`),
  KEY `idx_hr_reference_parent_id` (`parent_id`),
  CONSTRAINT `fk_hr_reference_parent_id` FOREIGN KEY (`parent_id`) REFERENCES `hr_reference_values` (`id`) ON DELETE RESTRICT
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
--


--
-- Table structure for table `leave_adjustments`
--

DROP TABLE IF EXISTS `leave_adjustments`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `leave_adjustments` (
  `id` char(36) NOT NULL,
  `employee_id` char(36) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
  `leave_type_id` int unsigned NOT NULL,
  `amount` decimal(8,3) NOT NULL,
  `reason` text,
  `created_by` int unsigned DEFAULT NULL,
  `created_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `idx_leave_adjustments_employee_id` (`employee_id`),
  KEY `fk_leave_adjustments_leave_type_id` (`leave_type_id`),
  KEY `fk_leave_adjustments_created_by` (`created_by`),
  CONSTRAINT `fk_leave_adjustments_created_by` FOREIGN KEY (`created_by`) REFERENCES `users` (`id`) ON DELETE SET NULL,
  CONSTRAINT `fk_leave_adjustments_employee_id` FOREIGN KEY (`employee_id`) REFERENCES `employees` (`id`) ON DELETE CASCADE,
  CONSTRAINT `fk_leave_adjustments_leave_type_id` FOREIGN KEY (`leave_type_id`) REFERENCES `leave_types` (`id`) ON DELETE RESTRICT
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
--


--
-- Table structure for table `leave_applications`
--

DROP TABLE IF EXISTS `leave_applications`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `leave_applications` (
  `id` char(36) NOT NULL,
  `employee_id` char(36) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
  `leave_type_id` int unsigned NOT NULL,
  `date_from` date NOT NULL,
  `date_to` date NOT NULL,
  `days_requested` decimal(8,3) NOT NULL,
  `reason` text,
  `status` enum('Pending','Approved','Disapproved','Cancelled') NOT NULL DEFAULT 'Pending',
  `approver_id` int unsigned DEFAULT NULL,
  `decision_remarks` text,
  `decided_at` datetime DEFAULT NULL,
  `created_by` int unsigned DEFAULT NULL,
  `created_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  `salary_snapshot` decimal(12,2) DEFAULT NULL,
  `detail_location_type` varchar(30) DEFAULT NULL,
  `detail_location_text` varchar(255) DEFAULT NULL,
  `detail_sick_type` varchar(30) DEFAULT NULL,
  `detail_illness` text,
  `detail_study_purpose` varchar(50) DEFAULT NULL,
  `detail_other_purpose` varchar(50) DEFAULT NULL,
  `detail_other_text` text,
  `commutation_requested` tinyint(1) NOT NULL DEFAULT '0',
  `requirements_payload` json DEFAULT NULL,
  `form_payload` json DEFAULT NULL,
  `recommendation_status` varchar(30) DEFAULT NULL,
  `recommendation_reason` text,
  `recommended_by` int unsigned DEFAULT NULL,
  `recommended_at` datetime DEFAULT NULL,
  `approved_days_with_pay` decimal(8,3) DEFAULT NULL,
  `approved_days_without_pay` decimal(8,3) DEFAULT NULL,
  `approved_days_other` decimal(8,3) DEFAULT NULL,
  `approved_days_other_text` text,
  `final_disapproval_reason` text,
  `approved_credit_charge_days` decimal(8,3) DEFAULT NULL,
  `charged_leave_type_id` int unsigned DEFAULT NULL,
  PRIMARY KEY (`id`),
  KEY `idx_leave_applications_employee_id` (`employee_id`),
  KEY `idx_leave_applications_status` (`status`),
  KEY `idx_leave_applications_dates` (`date_from`,`date_to`),
  KEY `fk_leave_applications_leave_type_id` (`leave_type_id`),
  KEY `fk_leave_applications_approver_id` (`approver_id`),
  KEY `fk_leave_applications_created_by` (`created_by`),
  KEY `fk_leave_applications_recommended_by` (`recommended_by`),
  CONSTRAINT `fk_leave_applications_approver_id` FOREIGN KEY (`approver_id`) REFERENCES `users` (`id`) ON DELETE SET NULL,
  CONSTRAINT `fk_leave_applications_created_by` FOREIGN KEY (`created_by`) REFERENCES `users` (`id`) ON DELETE SET NULL,
  CONSTRAINT `fk_leave_applications_employee_id` FOREIGN KEY (`employee_id`) REFERENCES `employees` (`id`) ON DELETE CASCADE,
  CONSTRAINT `fk_leave_applications_leave_type_id` FOREIGN KEY (`leave_type_id`) REFERENCES `leave_types` (`id`) ON DELETE RESTRICT,
  CONSTRAINT `fk_leave_applications_recommended_by` FOREIGN KEY (`recommended_by`) REFERENCES `users` (`id`) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
--


--
-- Table structure for table `leave_balances`
--

DROP TABLE IF EXISTS `leave_balances`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `leave_balances` (
  `id` bigint unsigned NOT NULL AUTO_INCREMENT,
  `employee_id` char(36) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
  `leave_type_id` int unsigned NOT NULL,
  `balance` decimal(8,3) NOT NULL DEFAULT '0.000',
  `earned` decimal(8,3) NOT NULL DEFAULT '0.000',
  `used` decimal(8,3) NOT NULL DEFAULT '0.000',
  `adjusted` decimal(8,3) NOT NULL DEFAULT '0.000',
  `updated_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE KEY `uniq_leave_balance_employee_type` (`employee_id`,`leave_type_id`),
  KEY `idx_leave_balances_employee_id` (`employee_id`),
  KEY `fk_leave_balances_leave_type_id` (`leave_type_id`),
  CONSTRAINT `fk_leave_balances_employee_id` FOREIGN KEY (`employee_id`) REFERENCES `employees` (`id`) ON DELETE CASCADE,
  CONSTRAINT `fk_leave_balances_leave_type_id` FOREIGN KEY (`leave_type_id`) REFERENCES `leave_types` (`id`) ON DELETE RESTRICT
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
--


--
-- Table structure for table `leave_credit_ledger`
--

DROP TABLE IF EXISTS `leave_credit_ledger`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `leave_credit_ledger` (
  `id` char(36) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
  `employee_id` char(36) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
  `leave_type_id` int unsigned NOT NULL,
  `entry_type` varchar(40) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
  `column_changed` varchar(20) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `amount` decimal(8,3) NOT NULL,
  `balance_delta` decimal(8,3) NOT NULL,
  `balance_after` decimal(8,3) NOT NULL,
  `source_type` varchar(60) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `source_id` char(36) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `description` text CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci,
  `created_by` int unsigned DEFAULT NULL,
  `created_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `idx_leave_credit_ledger_employee_id` (`employee_id`),
  KEY `idx_leave_credit_ledger_type_date` (`leave_type_id`,`created_at`),
  KEY `idx_leave_credit_ledger_source` (`source_type`,`source_id`),
  KEY `fk_leave_credit_ledger_created_by` (`created_by`),
  CONSTRAINT `fk_leave_credit_ledger_created_by` FOREIGN KEY (`created_by`) REFERENCES `users` (`id`) ON DELETE SET NULL,
  CONSTRAINT `fk_leave_credit_ledger_employee_id` FOREIGN KEY (`employee_id`) REFERENCES `employees` (`id`) ON DELETE CASCADE,
  CONSTRAINT `fk_leave_credit_ledger_leave_type_id` FOREIGN KEY (`leave_type_id`) REFERENCES `leave_types` (`id`) ON DELETE RESTRICT
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
--


--
-- Table structure for table `leave_types`
--

DROP TABLE IF EXISTS `leave_types`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `leave_types` (
  `id` int unsigned NOT NULL AUTO_INCREMENT,
  `code` varchar(20) NOT NULL,
  `name` varchar(120) NOT NULL,
  `is_paid` tinyint(1) NOT NULL DEFAULT '1',
  `is_active` tinyint(1) NOT NULL DEFAULT '1',
  `sort_order` int unsigned NOT NULL DEFAULT '0',
  `created_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  `is_credit_based` tinyint(1) NOT NULL DEFAULT '1',
  `credit_group` varchar(30) DEFAULT NULL,
  `max_days` decimal(8,3) DEFAULT NULL,
  `advance_notice_days` int DEFAULT NULL,
  `legal_basis` text,
  `filing_rule` text,
  `requirements_json` json DEFAULT NULL,
  `detail_schema_json` json DEFAULT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `code` (`code`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
--


--
-- Table structure for table `non_plantilla_engagements`
--

DROP TABLE IF EXISTS `non_plantilla_engagements`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `non_plantilla_engagements` (
  `id` char(36) NOT NULL,
  `employee_id` char(36) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
  `engagement_type` enum('JO','COS','Casual','Contractual','Other') NOT NULL,
  `org_unit_ref_id` int unsigned NOT NULL,
  `designation` varchar(200) NOT NULL,
  `contract_number` varchar(160) DEFAULT NULL,
  `date_from` date NOT NULL,
  `date_to` date NOT NULL,
  `rate` decimal(12,2) DEFAULT NULL,
  `funding_source` varchar(200) DEFAULT NULL,
  `supervisor` varchar(200) DEFAULT NULL,
  `remarks` text,
  `status` enum('Scheduled','Active','Expired','Terminated','Renewed') NOT NULL,
  `previous_engagement_id` char(36) DEFAULT NULL,
  `created_by` int unsigned DEFAULT NULL,
  `ended_by` int unsigned DEFAULT NULL,
  `created_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  `ended_at` datetime DEFAULT NULL,
  `active_employee_id` char(36) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci GENERATED ALWAYS AS ((case when (`status` = _utf8mb4'Active') then `employee_id` else NULL end)) STORED,
  PRIMARY KEY (`id`),
  UNIQUE KEY `uniq_active_non_plantilla_employee` (`active_employee_id`),
  KEY `idx_engagement_employee_dates` (`employee_id`,`date_from`,`date_to`),
  KEY `idx_engagement_status_end` (`status`,`date_to`),
  KEY `idx_engagement_org_status` (`org_unit_ref_id`,`status`),
  KEY `previous_engagement_id` (`previous_engagement_id`),
  KEY `created_by` (`created_by`),
  KEY `ended_by` (`ended_by`),
  CONSTRAINT `non_plantilla_engagements_ibfk_1` FOREIGN KEY (`employee_id`) REFERENCES `employees` (`id`) ON DELETE RESTRICT,
  CONSTRAINT `non_plantilla_engagements_ibfk_2` FOREIGN KEY (`org_unit_ref_id`) REFERENCES `hr_reference_values` (`id`) ON DELETE RESTRICT,
  CONSTRAINT `non_plantilla_engagements_ibfk_3` FOREIGN KEY (`previous_engagement_id`) REFERENCES `non_plantilla_engagements` (`id`) ON DELETE RESTRICT,
  CONSTRAINT `non_plantilla_engagements_ibfk_4` FOREIGN KEY (`created_by`) REFERENCES `users` (`id`) ON DELETE SET NULL,
  CONSTRAINT `non_plantilla_engagements_ibfk_5` FOREIGN KEY (`ended_by`) REFERENCES `users` (`id`) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
--


--
-- Table structure for table `notifications`
--

DROP TABLE IF EXISTS `notifications`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `notifications` (
  `id` char(36) NOT NULL,
  `user_id` int unsigned NOT NULL,
  `topic` varchar(40) NOT NULL,
  `title` varchar(160) NOT NULL,
  `message` varchar(600) NOT NULL,
  `path` varchar(300) DEFAULT NULL,
  `source_type` varchar(60) DEFAULT NULL,
  `source_id` varchar(80) DEFAULT NULL,
  `read_at` datetime DEFAULT NULL,
  `created_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `idx_notifications_user_created` (`user_id`,`created_at`),
  KEY `idx_notifications_user_unread` (`user_id`,`read_at`),
  KEY `idx_notifications_source` (`source_type`,`source_id`),
  CONSTRAINT `fk_notifications_user_id` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
--


--
-- Table structure for table `password_history`
--

DROP TABLE IF EXISTS `password_history`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `password_history` (
  `id` bigint unsigned NOT NULL AUTO_INCREMENT,
  `user_id` int unsigned NOT NULL,
  `password_hash` varchar(255) NOT NULL,
  `created_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `idx_password_history_user_created` (`user_id`,`created_at`),
  CONSTRAINT `fk_password_history_user_id` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
--


--
-- Table structure for table `personnel_movement_events`
--

DROP TABLE IF EXISTS `personnel_movement_events`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `personnel_movement_events` (
  `id` char(36) NOT NULL,
  `movement_id` char(36) NOT NULL,
  `event_type` varchar(40) NOT NULL,
  `from_status` varchar(20) DEFAULT NULL,
  `to_status` varchar(20) NOT NULL,
  `actor_id` int unsigned DEFAULT NULL,
  `remarks` text,
  `snapshot_json` json DEFAULT NULL,
  `created_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `idx_movement_events` (`movement_id`,`created_at`),
  KEY `actor_id` (`actor_id`),
  CONSTRAINT `personnel_movement_events_ibfk_1` FOREIGN KEY (`movement_id`) REFERENCES `personnel_movements` (`id`) ON DELETE RESTRICT,
  CONSTRAINT `personnel_movement_events_ibfk_2` FOREIGN KEY (`actor_id`) REFERENCES `users` (`id`) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
--


--
-- Table structure for table `personnel_movements`
--

DROP TABLE IF EXISTS `personnel_movements`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `personnel_movements` (
  `id` char(36) NOT NULL,
  `control_number` varchar(80) NOT NULL,
  `employee_id` char(36) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
  `action_type` varchar(60) NOT NULL,
  `status` enum('Draft','Submitted','Reviewed','Approved','Scheduled','Posted','Rejected','Reversed') NOT NULL DEFAULT 'Draft',
  `effective_date` date NOT NULL,
  `end_date` date DEFAULT NULL,
  `authority_number` varchar(160) DEFAULT NULL,
  `authority_date` date DEFAULT NULL,
  `target_plantilla_item_id` char(36) DEFAULT NULL,
  `target_position_id` int unsigned DEFAULT NULL,
  `target_salary_grade_id` int unsigned DEFAULT NULL,
  `target_department` varchar(200) DEFAULT NULL,
  `remarks` text,
  `supporting_documents` json DEFAULT NULL,
  `source_snapshot_json` json NOT NULL,
  `posted_before_snapshot_json` json DEFAULT NULL,
  `posted_after_snapshot_json` json DEFAULT NULL,
  `prepared_by` int unsigned DEFAULT NULL,
  `submitted_by` int unsigned DEFAULT NULL,
  `reviewed_by` int unsigned DEFAULT NULL,
  `approved_by` int unsigned DEFAULT NULL,
  `posted_by` int unsigned DEFAULT NULL,
  `rejected_by` int unsigned DEFAULT NULL,
  `reversed_by` int unsigned DEFAULT NULL,
  `submitted_at` datetime DEFAULT NULL,
  `reviewed_at` datetime DEFAULT NULL,
  `approved_at` datetime DEFAULT NULL,
  `scheduled_at` datetime DEFAULT NULL,
  `posted_at` datetime DEFAULT NULL,
  `rejected_at` datetime DEFAULT NULL,
  `reversed_at` datetime DEFAULT NULL,
  `decision_remarks` text,
  `reversal_reason` text,
  `activation_error` text,
  `version` int unsigned NOT NULL DEFAULT '1',
  `created_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE KEY `uniq_personnel_movement_control` (`control_number`),
  KEY `idx_movement_employee_date` (`employee_id`,`effective_date`),
  KEY `idx_movement_status_date` (`status`,`effective_date`),
  KEY `target_plantilla_item_id` (`target_plantilla_item_id`),
  KEY `target_position_id` (`target_position_id`),
  KEY `target_salary_grade_id` (`target_salary_grade_id`),
  KEY `prepared_by` (`prepared_by`),
  KEY `submitted_by` (`submitted_by`),
  KEY `reviewed_by` (`reviewed_by`),
  KEY `approved_by` (`approved_by`),
  KEY `posted_by` (`posted_by`),
  KEY `rejected_by` (`rejected_by`),
  KEY `reversed_by` (`reversed_by`),
  CONSTRAINT `personnel_movements_ibfk_1` FOREIGN KEY (`employee_id`) REFERENCES `employees` (`id`) ON DELETE RESTRICT,
  CONSTRAINT `personnel_movements_ibfk_10` FOREIGN KEY (`rejected_by`) REFERENCES `users` (`id`) ON DELETE SET NULL,
  CONSTRAINT `personnel_movements_ibfk_11` FOREIGN KEY (`reversed_by`) REFERENCES `users` (`id`) ON DELETE SET NULL,
  CONSTRAINT `personnel_movements_ibfk_2` FOREIGN KEY (`target_plantilla_item_id`) REFERENCES `plantilla_items` (`id`) ON DELETE RESTRICT,
  CONSTRAINT `personnel_movements_ibfk_3` FOREIGN KEY (`target_position_id`) REFERENCES `positions` (`id`) ON DELETE RESTRICT,
  CONSTRAINT `personnel_movements_ibfk_4` FOREIGN KEY (`target_salary_grade_id`) REFERENCES `salary_grades` (`id`) ON DELETE RESTRICT,
  CONSTRAINT `personnel_movements_ibfk_5` FOREIGN KEY (`prepared_by`) REFERENCES `users` (`id`) ON DELETE SET NULL,
  CONSTRAINT `personnel_movements_ibfk_6` FOREIGN KEY (`submitted_by`) REFERENCES `users` (`id`) ON DELETE SET NULL,
  CONSTRAINT `personnel_movements_ibfk_7` FOREIGN KEY (`reviewed_by`) REFERENCES `users` (`id`) ON DELETE SET NULL,
  CONSTRAINT `personnel_movements_ibfk_8` FOREIGN KEY (`approved_by`) REFERENCES `users` (`id`) ON DELETE SET NULL,
  CONSTRAINT `personnel_movements_ibfk_9` FOREIGN KEY (`posted_by`) REFERENCES `users` (`id`) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
--


--
-- Table structure for table `plantilla_item_history`
--

DROP TABLE IF EXISTS `plantilla_item_history`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `plantilla_item_history` (
  `id` bigint unsigned NOT NULL AUTO_INCREMENT,
  `plantilla_item_id` char(36) NOT NULL,
  `action` varchar(40) NOT NULL,
  `snapshot_json` json NOT NULL,
  `changed_by` int unsigned DEFAULT NULL,
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `idx_item_history` (`plantilla_item_id`,`created_at`),
  KEY `changed_by` (`changed_by`),
  CONSTRAINT `plantilla_item_history_ibfk_1` FOREIGN KEY (`plantilla_item_id`) REFERENCES `plantilla_items` (`id`) ON DELETE RESTRICT,
  CONSTRAINT `plantilla_item_history_ibfk_2` FOREIGN KEY (`changed_by`) REFERENCES `users` (`id`) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
--


--
-- Table structure for table `plantilla_items`
--

DROP TABLE IF EXISTS `plantilla_items`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `plantilla_items` (
  `id` char(36) NOT NULL,
  `item_number` varchar(120) NOT NULL,
  `position_id` int unsigned NOT NULL,
  `salary_grade_id` int unsigned DEFAULT NULL,
  `sector_ref_id` int unsigned DEFAULT NULL,
  `office_ref_id` int unsigned DEFAULT NULL,
  `division_ref_id` int unsigned DEFAULT NULL,
  `section_ref_id` int unsigned DEFAULT NULL,
  `plantilla_type_ref_id` int unsigned DEFAULT NULL,
  `budget_code_ref_id` int unsigned DEFAULT NULL,
  `authorized_salary` decimal(12,2) DEFAULT NULL,
  `item_status` enum('Active','Inactive','Abolished') NOT NULL DEFAULT 'Active',
  `effective_from` date DEFAULT NULL,
  `effective_to` date DEFAULT NULL,
  `notes` text,
  `created_by` int unsigned DEFAULT NULL,
  `updated_by` int unsigned DEFAULT NULL,
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE KEY `item_number` (`item_number`),
  KEY `idx_plantilla_status` (`item_status`),
  KEY `position_id` (`position_id`),
  KEY `salary_grade_id` (`salary_grade_id`),
  KEY `sector_ref_id` (`sector_ref_id`),
  KEY `office_ref_id` (`office_ref_id`),
  KEY `division_ref_id` (`division_ref_id`),
  KEY `section_ref_id` (`section_ref_id`),
  KEY `plantilla_type_ref_id` (`plantilla_type_ref_id`),
  KEY `budget_code_ref_id` (`budget_code_ref_id`),
  KEY `created_by` (`created_by`),
  KEY `updated_by` (`updated_by`),
  CONSTRAINT `plantilla_items_ibfk_1` FOREIGN KEY (`position_id`) REFERENCES `positions` (`id`) ON DELETE RESTRICT,
  CONSTRAINT `plantilla_items_ibfk_10` FOREIGN KEY (`updated_by`) REFERENCES `users` (`id`) ON DELETE SET NULL,
  CONSTRAINT `plantilla_items_ibfk_2` FOREIGN KEY (`salary_grade_id`) REFERENCES `salary_grades` (`id`) ON DELETE RESTRICT,
  CONSTRAINT `plantilla_items_ibfk_3` FOREIGN KEY (`sector_ref_id`) REFERENCES `hr_reference_values` (`id`) ON DELETE RESTRICT,
  CONSTRAINT `plantilla_items_ibfk_4` FOREIGN KEY (`office_ref_id`) REFERENCES `hr_reference_values` (`id`) ON DELETE RESTRICT,
  CONSTRAINT `plantilla_items_ibfk_5` FOREIGN KEY (`division_ref_id`) REFERENCES `hr_reference_values` (`id`) ON DELETE RESTRICT,
  CONSTRAINT `plantilla_items_ibfk_6` FOREIGN KEY (`section_ref_id`) REFERENCES `hr_reference_values` (`id`) ON DELETE RESTRICT,
  CONSTRAINT `plantilla_items_ibfk_7` FOREIGN KEY (`plantilla_type_ref_id`) REFERENCES `hr_reference_values` (`id`) ON DELETE RESTRICT,
  CONSTRAINT `plantilla_items_ibfk_8` FOREIGN KEY (`budget_code_ref_id`) REFERENCES `hr_reference_values` (`id`) ON DELETE RESTRICT,
  CONSTRAINT `plantilla_items_ibfk_9` FOREIGN KEY (`created_by`) REFERENCES `users` (`id`) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
--


--
-- Table structure for table `plantilla_occupancies`
--

DROP TABLE IF EXISTS `plantilla_occupancies`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `plantilla_occupancies` (
  `id` char(36) NOT NULL,
  `plantilla_item_id` char(36) NOT NULL,
  `employee_id` char(36) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
  `current_salary_grade_id` int unsigned DEFAULT NULL,
  `date_from` date NOT NULL,
  `date_to` date DEFAULT NULL,
  `status` enum('Active','Ended') NOT NULL DEFAULT 'Active',
  `movement_type` varchar(80) DEFAULT NULL,
  `appointment_number` varchar(120) DEFAULT NULL,
  `remarks` text,
  `created_by` int unsigned DEFAULT NULL,
  `ended_by` int unsigned DEFAULT NULL,
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  `ended_at` datetime DEFAULT NULL,
  `active_item_id` char(36) GENERATED ALWAYS AS ((case when (`status` = _utf8mb4'Active') then `plantilla_item_id` else NULL end)) STORED,
  `active_employee_id` char(36) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci GENERATED ALWAYS AS ((case when (`status` = _utf8mb4'Active') then `employee_id` else NULL end)) STORED,
  PRIMARY KEY (`id`),
  UNIQUE KEY `uniq_active_item` (`active_item_id`),
  UNIQUE KEY `uniq_active_employee` (`active_employee_id`),
  KEY `idx_occupancy_history` (`plantilla_item_id`,`date_from`,`date_to`),
  KEY `employee_id` (`employee_id`),
  KEY `current_salary_grade_id` (`current_salary_grade_id`),
  KEY `created_by` (`created_by`),
  KEY `ended_by` (`ended_by`),
  CONSTRAINT `plantilla_occupancies_ibfk_1` FOREIGN KEY (`plantilla_item_id`) REFERENCES `plantilla_items` (`id`) ON DELETE RESTRICT,
  CONSTRAINT `plantilla_occupancies_ibfk_2` FOREIGN KEY (`employee_id`) REFERENCES `employees` (`id`) ON DELETE RESTRICT,
  CONSTRAINT `plantilla_occupancies_ibfk_5` FOREIGN KEY (`current_salary_grade_id`) REFERENCES `salary_grades` (`id`) ON DELETE RESTRICT,
  CONSTRAINT `plantilla_occupancies_ibfk_3` FOREIGN KEY (`created_by`) REFERENCES `users` (`id`) ON DELETE SET NULL,
  CONSTRAINT `plantilla_occupancies_ibfk_4` FOREIGN KEY (`ended_by`) REFERENCES `users` (`id`) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
--


--
-- Table structure for table `plantilla_reconciliations`
--

DROP TABLE IF EXISTS `plantilla_reconciliations`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `plantilla_reconciliations` (
  `id` char(36) NOT NULL,
  `employee_id` char(36) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
  `plantilla_item_id` char(36) NOT NULL,
  `occupancy_id` char(36) NOT NULL,
  `effective_from` date NOT NULL,
  `remarks` text NOT NULL,
  `classification_before` varchar(50) NOT NULL,
  `before_snapshot_json` json NOT NULL,
  `after_snapshot_json` json NOT NULL,
  `confirmed_by` int unsigned DEFAULT NULL,
  `confirmed_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE KEY `uniq_reconciled_employee` (`employee_id`),
  UNIQUE KEY `uniq_reconciled_occupancy` (`occupancy_id`),
  KEY `idx_reconciliation_item` (`plantilla_item_id`,`confirmed_at`),
  KEY `confirmed_by` (`confirmed_by`),
  CONSTRAINT `plantilla_reconciliations_ibfk_1` FOREIGN KEY (`employee_id`) REFERENCES `employees` (`id`) ON DELETE RESTRICT,
  CONSTRAINT `plantilla_reconciliations_ibfk_2` FOREIGN KEY (`plantilla_item_id`) REFERENCES `plantilla_items` (`id`) ON DELETE RESTRICT,
  CONSTRAINT `plantilla_reconciliations_ibfk_3` FOREIGN KEY (`occupancy_id`) REFERENCES `plantilla_occupancies` (`id`) ON DELETE RESTRICT,
  CONSTRAINT `plantilla_reconciliations_ibfk_4` FOREIGN KEY (`confirmed_by`) REFERENCES `users` (`id`) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
--


--
-- Table structure for table `positions`
--

DROP TABLE IF EXISTS `positions`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `positions` (
  `id` int unsigned NOT NULL AUTO_INCREMENT,
  `title` varchar(200) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
  `sort_order` int unsigned NOT NULL DEFAULT '0',
  `created_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE KEY `title` (`title`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
--


--
-- Table structure for table `role_permissions`
--

DROP TABLE IF EXISTS `role_permissions`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `role_permissions` (
  `role` enum('Super Admin','Admin','HR','Approver','Employee','Viewer') NOT NULL,
  `permission_key` varchar(80) NOT NULL,
  `allowed` tinyint(1) NOT NULL DEFAULT '0',
  `updated_by` int unsigned DEFAULT NULL,
  `updated_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`role`,`permission_key`),
  KEY `idx_role_permissions_updated_by` (`updated_by`),
  CONSTRAINT `fk_role_permissions_updated_by` FOREIGN KEY (`updated_by`) REFERENCES `users` (`id`) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
--


--
-- Table structure for table `salary_adjustment_batches`
--

DROP TABLE IF EXISTS `salary_adjustment_batches`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `salary_adjustment_batches` (
  `id` char(36) NOT NULL,
  `schedule_id` char(36) NOT NULL,
  `effectivity_date` date NOT NULL,
  `status` enum('Applied','Reversed') NOT NULL DEFAULT 'Applied',
  `applied_count` int unsigned NOT NULL DEFAULT '0',
  `skipped_count` int unsigned NOT NULL DEFAULT '0',
  `reversed_count` int unsigned NOT NULL DEFAULT '0',
  `remarks` text,
  `applied_by` int unsigned DEFAULT NULL,
  `reversed_by` int unsigned DEFAULT NULL,
  `applied_at` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `reversed_at` datetime DEFAULT NULL,
  `reversal_reason` text,
  `created_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `idx_salary_adjustment_schedule_effective` (`schedule_id`,`effectivity_date`),
  KEY `idx_salary_adjustment_status_effective` (`status`,`effectivity_date`),
  KEY `applied_by` (`applied_by`),
  KEY `reversed_by` (`reversed_by`),
  CONSTRAINT `salary_adjustment_batches_ibfk_1` FOREIGN KEY (`schedule_id`) REFERENCES `salary_schedules` (`id`) ON DELETE RESTRICT,
  CONSTRAINT `salary_adjustment_batches_ibfk_2` FOREIGN KEY (`applied_by`) REFERENCES `users` (`id`) ON DELETE SET NULL,
  CONSTRAINT `salary_adjustment_batches_ibfk_3` FOREIGN KEY (`reversed_by`) REFERENCES `users` (`id`) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
--


--
-- Table structure for table `salary_adjustment_results`
--

DROP TABLE IF EXISTS `salary_adjustment_results`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `salary_adjustment_results` (
  `id` bigint unsigned NOT NULL AUTO_INCREMENT,
  `batch_id` char(36) NOT NULL,
  `employee_id` char(36) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
  `plantilla_item_id` char(36) DEFAULT NULL,
  `old_salary_grade_id` int unsigned DEFAULT NULL,
  `new_salary_grade_id` int unsigned DEFAULT NULL,
  `grade` int unsigned DEFAULT NULL,
  `step` int unsigned DEFAULT NULL,
  `old_amount` decimal(12,2) DEFAULT NULL,
  `new_amount` decimal(12,2) DEFAULT NULL,
  `result_status` enum('Applied','Skipped','Reversed') NOT NULL,
  `skip_reason` varchar(255) DEFAULT NULL,
  `salary_record_id` char(36) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `created_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE KEY `uniq_salary_adjustment_employee` (`batch_id`,`employee_id`),
  KEY `idx_salary_adjustment_results_employee` (`employee_id`,`created_at`),
  KEY `plantilla_item_id` (`plantilla_item_id`),
  KEY `old_salary_grade_id` (`old_salary_grade_id`),
  KEY `new_salary_grade_id` (`new_salary_grade_id`),
  KEY `salary_record_id` (`salary_record_id`),
  CONSTRAINT `salary_adjustment_results_ibfk_1` FOREIGN KEY (`batch_id`) REFERENCES `salary_adjustment_batches` (`id`) ON DELETE RESTRICT,
  CONSTRAINT `salary_adjustment_results_ibfk_2` FOREIGN KEY (`employee_id`) REFERENCES `employees` (`id`) ON DELETE CASCADE,
  CONSTRAINT `salary_adjustment_results_ibfk_3` FOREIGN KEY (`plantilla_item_id`) REFERENCES `plantilla_items` (`id`) ON DELETE SET NULL,
  CONSTRAINT `salary_adjustment_results_ibfk_4` FOREIGN KEY (`old_salary_grade_id`) REFERENCES `salary_grades` (`id`) ON DELETE RESTRICT,
  CONSTRAINT `salary_adjustment_results_ibfk_5` FOREIGN KEY (`new_salary_grade_id`) REFERENCES `salary_grades` (`id`) ON DELETE RESTRICT,
  CONSTRAINT `salary_adjustment_results_ibfk_6` FOREIGN KEY (`salary_record_id`) REFERENCES `employee_salary_records` (`id`) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
--


--
-- Table structure for table `salary_grades`
--

DROP TABLE IF EXISTS `salary_grades`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `salary_grades` (
  `id` int unsigned NOT NULL AUTO_INCREMENT,
  `ordinance` varchar(120) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
  `grade` int unsigned NOT NULL,
  `step` int unsigned NOT NULL,
  `amount` decimal(12,2) NOT NULL,
  `created_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  `is_active` tinyint(1) NOT NULL DEFAULT '0',
  PRIMARY KEY (`id`),
  UNIQUE KEY `uniq_salary_grade_step` (`ordinance`,`grade`,`step`),
  KEY `idx_salary_grades_active` (`is_active`,`ordinance`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
--


--
-- Table structure for table `salary_schedule_rows`
--

DROP TABLE IF EXISTS `salary_schedule_rows`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `salary_schedule_rows` (
  `id` bigint unsigned NOT NULL AUTO_INCREMENT,
  `schedule_id` char(36) NOT NULL,
  `salary_grade_id` int unsigned DEFAULT NULL,
  `grade` int unsigned NOT NULL,
  `step` int unsigned NOT NULL,
  `amount` decimal(12,2) NOT NULL,
  `created_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE KEY `uniq_salary_schedule_grade_step` (`schedule_id`,`grade`,`step`),
  KEY `idx_salary_schedule_rows_grade_step` (`grade`,`step`),
  KEY `salary_grade_id` (`salary_grade_id`),
  CONSTRAINT `salary_schedule_rows_ibfk_1` FOREIGN KEY (`schedule_id`) REFERENCES `salary_schedules` (`id`) ON DELETE CASCADE,
  CONSTRAINT `salary_schedule_rows_ibfk_2` FOREIGN KEY (`salary_grade_id`) REFERENCES `salary_grades` (`id`) ON DELETE RESTRICT
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
--


--
-- Table structure for table `salary_schedules`
--

DROP TABLE IF EXISTS `salary_schedules`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `salary_schedules` (
  `id` char(36) NOT NULL,
  `ordinance` varchar(120) NOT NULL,
  `description` text,
  `legal_basis` text,
  `effective_from` date NOT NULL,
  `effective_to` date DEFAULT NULL,
  `status` enum('Draft','Active','Superseded','Cancelled') NOT NULL DEFAULT 'Draft',
  `created_by` int unsigned DEFAULT NULL,
  `updated_by` int unsigned DEFAULT NULL,
  `created_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `idx_salary_schedules_status_effective` (`status`,`effective_from`),
  KEY `created_by` (`created_by`),
  KEY `updated_by` (`updated_by`),
  CONSTRAINT `salary_schedules_ibfk_1` FOREIGN KEY (`created_by`) REFERENCES `users` (`id`) ON DELETE SET NULL,
  CONSTRAINT `salary_schedules_ibfk_2` FOREIGN KEY (`updated_by`) REFERENCES `users` (`id`) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
--


--
-- Table structure for table `schema_migrations`
--

DROP TABLE IF EXISTS `schema_migrations`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `schema_migrations` (
  `version` varchar(255) COLLATE utf8mb4_unicode_ci NOT NULL,
  `applied_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`version`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
--


--
-- Table structure for table `service_record_entries`
--

DROP TABLE IF EXISTS `service_record_entries`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `service_record_entries` (
  `id` char(36) NOT NULL,
  `employee_id` char(36) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
  `service_from` date NOT NULL,
  `service_to` date DEFAULT NULL,
  `position_title` varchar(200) NOT NULL,
  `department` varchar(200) DEFAULT NULL,
  `agency` varchar(200) DEFAULT NULL,
  `appointment_status` varchar(80) DEFAULT NULL,
  `annual_salary` decimal(12,2) DEFAULT NULL,
  `salary_grade` int unsigned DEFAULT NULL,
  `salary_step` int unsigned DEFAULT NULL,
  `item_number` varchar(120) DEFAULT NULL,
  `branch` varchar(120) DEFAULT NULL,
  `leave_without_pay` varchar(120) DEFAULT NULL,
  `separation_date` date DEFAULT NULL,
  `separation_cause` varchar(200) DEFAULT NULL,
  `remarks` text,
  `created_by` int unsigned DEFAULT NULL,
  `updated_by` int unsigned DEFAULT NULL,
  `created_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `idx_service_record_employee_period` (`employee_id`,`service_from`,`service_to`),
  KEY `created_by` (`created_by`),
  KEY `updated_by` (`updated_by`),
  CONSTRAINT `service_record_entries_ibfk_1` FOREIGN KEY (`employee_id`) REFERENCES `employees` (`id`) ON DELETE CASCADE,
  CONSTRAINT `service_record_entries_ibfk_2` FOREIGN KEY (`created_by`) REFERENCES `users` (`id`) ON DELETE SET NULL,
  CONSTRAINT `service_record_entries_ibfk_3` FOREIGN KEY (`updated_by`) REFERENCES `users` (`id`) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
--


--
-- Table structure for table `sessions`
--

DROP TABLE IF EXISTS `sessions`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `sessions` (
  `id` char(64) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
  `user_id` int unsigned NOT NULL,
  `expires_at` datetime NOT NULL,
  `created_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `idx_sessions_user_id` (`user_id`),
  KEY `idx_sessions_expires_at` (`expires_at`),
  CONSTRAINT `fk_sessions_user_id` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
--


--
-- Table structure for table `shift_templates`
--

DROP TABLE IF EXISTS `shift_templates`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `shift_templates` (
  `id` bigint unsigned NOT NULL AUTO_INCREMENT,
  `code` varchar(80) NOT NULL,
  `name` varchar(120) NOT NULL,
  `shift_type` enum('split','straight','night') NOT NULL DEFAULT 'split',
  `start_time` time NOT NULL,
  `end_time` time NOT NULL,
  `break_start` time DEFAULT NULL,
  `break_end` time DEFAULT NULL,
  `early_buffer_minutes` int unsigned NOT NULL DEFAULT '240',
  `late_buffer_minutes` int unsigned NOT NULL DEFAULT '240',
  `active` tinyint(1) NOT NULL DEFAULT '1',
  `created_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE KEY `code` (`code`),
  KEY `idx_shift_templates_active` (`active`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
--


--
-- Table structure for table `temporary_assignments`
--

DROP TABLE IF EXISTS `temporary_assignments`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `temporary_assignments` (
  `id` char(36) NOT NULL,
  `employee_id` char(36) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
  `movement_id` char(36) NOT NULL,
  `assignment_type` enum('Detail','Designation','Reassignment','Job Rotation') NOT NULL,
  `org_unit_ref_id` int unsigned DEFAULT NULL,
  `position_id` int unsigned DEFAULT NULL,
  `assignment_label` varchar(200) DEFAULT NULL,
  `date_from` date NOT NULL,
  `date_to` date DEFAULT NULL,
  `status` enum('Scheduled','Active','Ended','Reversed') NOT NULL,
  `created_by` int unsigned DEFAULT NULL,
  `ended_by` int unsigned DEFAULT NULL,
  `created_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `ended_at` datetime DEFAULT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `uniq_temporary_movement` (`movement_id`),
  KEY `idx_temporary_employee_dates` (`employee_id`,`date_from`,`date_to`),
  KEY `idx_temporary_status_dates` (`status`,`date_from`,`date_to`),
  KEY `org_unit_ref_id` (`org_unit_ref_id`),
  KEY `position_id` (`position_id`),
  KEY `created_by` (`created_by`),
  KEY `ended_by` (`ended_by`),
  CONSTRAINT `temporary_assignments_ibfk_1` FOREIGN KEY (`employee_id`) REFERENCES `employees` (`id`) ON DELETE RESTRICT,
  CONSTRAINT `temporary_assignments_ibfk_2` FOREIGN KEY (`movement_id`) REFERENCES `personnel_movements` (`id`) ON DELETE RESTRICT,
  CONSTRAINT `temporary_assignments_ibfk_3` FOREIGN KEY (`org_unit_ref_id`) REFERENCES `hr_reference_values` (`id`) ON DELETE RESTRICT,
  CONSTRAINT `temporary_assignments_ibfk_4` FOREIGN KEY (`position_id`) REFERENCES `positions` (`id`) ON DELETE RESTRICT,
  CONSTRAINT `temporary_assignments_ibfk_5` FOREIGN KEY (`created_by`) REFERENCES `users` (`id`) ON DELETE SET NULL,
  CONSTRAINT `temporary_assignments_ibfk_6` FOREIGN KEY (`ended_by`) REFERENCES `users` (`id`) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
--


--
-- Table structure for table `users`
--

DROP TABLE IF EXISTS `users`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `users` (
  `id` int unsigned NOT NULL AUTO_INCREMENT,
  `username` varchar(50) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
  `password_hash` varchar(255) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
  `name` varchar(150) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
  `role` enum('Super Admin','Admin','HR','Approver','Employee','Viewer') COLLATE utf8mb4_unicode_ci NOT NULL,
  `photo_url` longtext CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci,
  `is_active` tinyint(1) NOT NULL DEFAULT '1',
  `created_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  `must_change_password` tinyint(1) NOT NULL DEFAULT '0',
  `employee_id` char(36) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `failed_login_attempts` tinyint unsigned NOT NULL DEFAULT '0',
  `locked_at` datetime DEFAULT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `username` (`username`),
  UNIQUE KEY `uniq_users_employee_id` (`employee_id`),
  CONSTRAINT `fk_users_employee_id` FOREIGN KEY (`employee_id`) REFERENCES `employees` (`id`) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
--

/*!40103 SET TIME_ZONE=@OLD_TIME_ZONE */;

/*!40101 SET SQL_MODE=@OLD_SQL_MODE */;
/*!40014 SET FOREIGN_KEY_CHECKS=@OLD_FOREIGN_KEY_CHECKS */;
/*!40014 SET UNIQUE_CHECKS=@OLD_UNIQUE_CHECKS */;
/*!40101 SET CHARACTER_SET_CLIENT=@OLD_CHARACTER_SET_CLIENT */;
/*!40101 SET CHARACTER_SET_RESULTS=@OLD_CHARACTER_SET_RESULTS */;
/*!40101 SET COLLATION_CONNECTION=@OLD_COLLATION_CONNECTION */;
/*!40111 SET SQL_NOTES=@OLD_SQL_NOTES */;

-- Dump completed on 2026-07-27 14:48:38

--
-- Fresh reference seed data copied from copy-position-and-office.csv
-- This file intentionally contains no employee, attendance, leave transaction, session, audit, or biometric records.
--
SET FOREIGN_KEY_CHECKS=0;

LOCK TABLES `positions` WRITE;
/*!40000 ALTER TABLE `positions` DISABLE KEYS */;
INSERT INTO `positions` (`id`,`title`,`sort_order`,`created_at`,`updated_at`) VALUES
(1,'Admin Adie II',1,'2026-07-27 00:00:00','2026-07-27 00:00:00'),
(2,'Admin Aide I',2,'2026-07-27 00:00:00','2026-07-27 00:00:00'),
(3,'Admin Aide II',3,'2026-07-27 00:00:00','2026-07-27 00:00:00'),
(4,'Admin Aide III',4,'2026-07-27 00:00:00','2026-07-27 00:00:00'),
(5,'Admin Aide IV',5,'2026-07-27 00:00:00','2026-07-27 00:00:00'),
(6,'Admin Aide VI',6,'2026-07-27 00:00:00','2026-07-27 00:00:00'),
(7,'Administrative Aide I',7,'2026-07-27 00:00:00','2026-07-27 00:00:00'),
(8,'Administrative Aide III',8,'2026-07-27 00:00:00','2026-07-27 00:00:00'),
(9,'Administrative Aide IV',9,'2026-07-27 00:00:00','2026-07-27 00:00:00'),
(10,'Administrative Aide V',10,'2026-07-27 00:00:00','2026-07-27 00:00:00'),
(11,'Administrative Aide VI',11,'2026-07-27 00:00:00','2026-07-27 00:00:00'),
(12,'Administrative Assistant II',12,'2026-07-27 00:00:00','2026-07-27 00:00:00'),
(13,'Administrative Assistant III',13,'2026-07-27 00:00:00','2026-07-27 00:00:00'),
(14,'Administrative Officer I',14,'2026-07-27 00:00:00','2026-07-27 00:00:00'),
(15,'Administrative Officer II',15,'2026-07-27 00:00:00','2026-07-27 00:00:00'),
(16,'Administrative Officer III',16,'2026-07-27 00:00:00','2026-07-27 00:00:00'),
(17,'Administrative Officer IV',17,'2026-07-27 00:00:00','2026-07-27 00:00:00'),
(18,'Agricultural Technician',18,'2026-07-27 00:00:00','2026-07-27 00:00:00'),
(19,'Agricultural Technologist',19,'2026-07-27 00:00:00','2026-07-27 00:00:00'),
(20,'Architect II',20,'2026-07-27 00:00:00','2026-07-27 00:00:00'),
(21,'Assessment Clerk II',21,'2026-07-27 00:00:00','2026-07-27 00:00:00'),
(22,'Assessment Clerk III',22,'2026-07-27 00:00:00','2026-07-27 00:00:00'),
(23,'Community Affairs Officer',23,'2026-07-27 00:00:00','2026-07-27 00:00:00'),
(24,'Community Affairs Officer I',24,'2026-07-27 00:00:00','2026-07-27 00:00:00'),
(25,'Dentist II',25,'2026-07-27 00:00:00','2026-07-27 00:00:00'),
(26,'Draftsman I',26,'2026-07-27 00:00:00','2026-07-27 00:00:00'),
(27,'Election Officer III',27,'2026-07-27 00:00:00','2026-07-27 00:00:00'),
(28,'Engineer I',28,'2026-07-27 00:00:00','2026-07-27 00:00:00'),
(29,'Engineer II',29,'2026-07-27 00:00:00','2026-07-27 00:00:00'),
(30,'Engineering Aide',30,'2026-07-27 00:00:00','2026-07-27 00:00:00'),
(31,'Engineering Aide I',31,'2026-07-27 00:00:00','2026-07-27 00:00:00'),
(32,'Executive Assistant I',32,'2026-07-27 00:00:00','2026-07-27 00:00:00'),
(33,'Information Technology Officer I',33,'2026-07-27 00:00:00','2026-07-27 00:00:00'),
(34,'Laboratory Aide II',34,'2026-07-27 00:00:00','2026-07-27 00:00:00'),
(35,'LDRRMO I',35,'2026-07-27 00:00:00','2026-07-27 00:00:00'),
(36,'LDRRMO III',36,'2026-07-27 00:00:00','2026-07-27 00:00:00'),
(37,'Librarian I',37,'2026-07-27 00:00:00','2026-07-27 00:00:00'),
(38,'License Officer I',38,'2026-07-27 00:00:00','2026-07-27 00:00:00'),
(39,'Local Assessment Operation Officer I',39,'2026-07-27 00:00:00','2026-07-27 00:00:00'),
(40,'Local Assessment Operation Officer II',40,'2026-07-27 00:00:00','2026-07-27 00:00:00'),
(41,'Local Legislative Staff Officer I',41,'2026-07-27 00:00:00','2026-07-27 00:00:00'),
(42,'Local Revenue Collection Officer I',42,'2026-07-27 00:00:00','2026-07-27 00:00:00'),
(43,'Local Treasury Operation Officer I',43,'2026-07-27 00:00:00','2026-07-27 00:00:00'),
(44,'Local Treasury Operation Officer II',44,'2026-07-27 00:00:00','2026-07-27 00:00:00'),
(45,'Market Inspector II',45,'2026-07-27 00:00:00','2026-07-27 00:00:00'),
(46,'Market Specialist I',46,'2026-07-27 00:00:00','2026-07-27 00:00:00'),
(47,'Market Supervisor II',47,'2026-07-27 00:00:00','2026-07-27 00:00:00'),
(48,'MDRRMO I',48,'2026-07-27 00:00:00','2026-07-27 00:00:00'),
(49,'MDRRMO III',49,'2026-07-27 00:00:00','2026-07-27 00:00:00'),
(50,'Meat Inspector III',50,'2026-07-27 00:00:00','2026-07-27 00:00:00'),
(51,'Med Tech I',51,'2026-07-27 00:00:00','2026-07-27 00:00:00'),
(52,'Medical Technologist II',52,'2026-07-27 00:00:00','2026-07-27 00:00:00'),
(53,'Meter Reader I',53,'2026-07-27 00:00:00','2026-07-27 00:00:00'),
(54,'Midwife I',54,'2026-07-27 00:00:00','2026-07-27 00:00:00'),
(55,'Midwife II',55,'2026-07-27 00:00:00','2026-07-27 00:00:00'),
(56,'Midwife III',56,'2026-07-27 00:00:00','2026-07-27 00:00:00'),
(57,'MLGOO',57,'2026-07-27 00:00:00','2026-07-27 00:00:00'),
(58,'Municipal Accountant',58,'2026-07-27 00:00:00','2026-07-27 00:00:00'),
(59,'Municipal Agricultural Officer',59,'2026-07-27 00:00:00','2026-07-27 00:00:00'),
(60,'Municipal Assessor',60,'2026-07-27 00:00:00','2026-07-27 00:00:00'),
(61,'Municipal Budget Officer',61,'2026-07-27 00:00:00','2026-07-27 00:00:00'),
(62,'Municipal Civil Registrar',62,'2026-07-27 00:00:00','2026-07-27 00:00:00'),
(63,'Municipal Engineer',63,'2026-07-27 00:00:00','2026-07-27 00:00:00'),
(64,'Municipal Health Officer',64,'2026-07-27 00:00:00','2026-07-27 00:00:00'),
(65,'Municipal Social Welfare and Development Officer',65,'2026-07-27 00:00:00','2026-07-27 00:00:00'),
(66,'Municipal Treasurer',66,'2026-07-27 00:00:00','2026-07-27 00:00:00'),
(67,'NC TIDA',67,'2026-07-27 00:00:00','2026-07-27 00:00:00'),
(68,'NCBC',68,'2026-07-27 00:00:00','2026-07-27 00:00:00'),
(69,'Nurse I',69,'2026-07-27 00:00:00','2026-07-27 00:00:00'),
(70,'Nurse II',70,'2026-07-27 00:00:00','2026-07-27 00:00:00'),
(71,'Nutrition Officer II',71,'2026-07-27 00:00:00','2026-07-27 00:00:00'),
(72,'Pharmacist II',72,'2026-07-27 00:00:00','2026-07-27 00:00:00'),
(73,'Planning Officer II',73,'2026-07-27 00:00:00','2026-07-27 00:00:00'),
(74,'Population and Development Service',74,'2026-07-27 00:00:00','2026-07-27 00:00:00'),
(75,'Project Development Officer II',75,'2026-07-27 00:00:00','2026-07-27 00:00:00'),
(76,'RCC III',76,'2026-07-27 00:00:00','2026-07-27 00:00:00'),
(77,'Registration Officer II',77,'2026-07-27 00:00:00','2026-07-27 00:00:00'),
(78,'Revenue Collection Clerk',78,'2026-07-27 00:00:00','2026-07-27 00:00:00'),
(79,'Revenue Collection Clerk III',79,'2026-07-27 00:00:00','2026-07-27 00:00:00'),
(80,'Rural Health Physician',80,'2026-07-27 00:00:00','2026-07-27 00:00:00'),
(81,'Sanitation Inspector I',81,'2026-07-27 00:00:00','2026-07-27 00:00:00'),
(82,'SB Legislative Support Staff',82,'2026-07-27 00:00:00','2026-07-27 00:00:00'),
(83,'SB Secretary',83,'2026-07-27 00:00:00','2026-07-27 00:00:00'),
(84,'Security Officer I',84,'2026-07-27 00:00:00','2026-07-27 00:00:00'),
(85,'Senior Admin Asst III',85,'2026-07-27 00:00:00','2026-07-27 00:00:00'),
(86,'Social Welfare Assistant',86,'2026-07-27 00:00:00','2026-07-27 00:00:00'),
(87,'Sports and Game Inspector II',87,'2026-07-27 00:00:00','2026-07-27 00:00:00'),
(88,'Supervisor',88,'2026-07-27 00:00:00','2026-07-27 00:00:00'),
(89,'Taxmapper I',89,'2026-07-27 00:00:00','2026-07-27 00:00:00'),
(90,'Traffic Aide',90,'2026-07-27 00:00:00','2026-07-27 00:00:00'),
(91,'Watchman',91,'2026-07-27 00:00:00','2026-07-27 00:00:00'),
(92,'Watchman I',92,'2026-07-27 00:00:00','2026-07-27 00:00:00'),
(93,'Zoning Officer I',93,'2026-07-27 00:00:00','2026-07-27 00:00:00');
/*!40000 ALTER TABLE `positions` ENABLE KEYS */;
UNLOCK TABLES;

LOCK TABLES `departments` WRITE;
/*!40000 ALTER TABLE `departments` DISABLE KEYS */;
INSERT INTO `departments` (`id`,`name`,`sort_order`,`created_at`,`updated_at`) VALUES
(1,'Budget Office',1,'2026-07-27 00:00:00','2026-07-27 00:00:00'),
(2,'CAO',2,'2026-07-27 00:00:00','2026-07-27 00:00:00'),
(3,'Commission on Elections',3,'2026-07-27 00:00:00','2026-07-27 00:00:00'),
(4,'Department of the Interior and Local Government',4,'2026-07-27 00:00:00','2026-07-27 00:00:00'),
(5,'MEO - Plaza, Parks and Monument Section',5,'2026-07-27 00:00:00','2026-07-27 00:00:00'),
(6,'MEO-Garbage Collection Services',6,'2026-07-27 00:00:00','2026-07-27 00:00:00'),
(7,'MEO-Maint of Roads and Bridges',7,'2026-07-27 00:00:00','2026-07-27 00:00:00'),
(8,'MEO-Street Cleaning Services',8,'2026-07-27 00:00:00','2026-07-27 00:00:00'),
(9,'MEO-Street Lighting Services',9,'2026-07-27 00:00:00','2026-07-27 00:00:00'),
(10,'MO - Business Printing and Licensing Section',10,'2026-07-27 00:00:00','2026-07-27 00:00:00'),
(11,'MO - Human Resource and Management Section',11,'2026-07-27 00:00:00','2026-07-27 00:00:00'),
(12,'MO - Information and Communications Technology Sector',12,'2026-07-27 00:00:00','2026-07-27 00:00:00'),
(13,'MO - Municipal Information and Library Services Section',13,'2026-07-27 00:00:00','2026-07-27 00:00:00'),
(14,'MO - Nutrition Center',14,'2026-07-27 00:00:00','2026-07-27 00:00:00'),
(15,'MO - Sports and Games Section',15,'2026-07-27 00:00:00','2026-07-27 00:00:00'),
(16,'MPOC-Traffic Aide',16,'2026-07-27 00:00:00','2026-07-27 00:00:00'),
(17,'Municipal Accounting Office',17,'2026-07-27 00:00:00','2026-07-27 00:00:00'),
(18,'Municipal Administrator''s Office',18,'2026-07-27 00:00:00','2026-07-27 00:00:00'),
(19,'Municipal Agriculture Office',19,'2026-07-27 00:00:00','2026-07-27 00:00:00'),
(20,'Municipal Assessor Office',20,'2026-07-27 00:00:00','2026-07-27 00:00:00'),
(21,'Municipal Civil Registrar''s Office',21,'2026-07-27 00:00:00','2026-07-27 00:00:00'),
(22,'Municipal Disaster Risk Reduction and Management Office',22,'2026-07-27 00:00:00','2026-07-27 00:00:00'),
(23,'Municipal Engineering Office',23,'2026-07-27 00:00:00','2026-07-27 00:00:00'),
(24,'Municipal Health Office',24,'2026-07-27 00:00:00','2026-07-27 00:00:00'),
(25,'Municipal Health Office (RHU II)',25,'2026-07-27 00:00:00','2026-07-27 00:00:00'),
(26,'Municipal Nutrition Office',26,'2026-07-27 00:00:00','2026-07-27 00:00:00'),
(27,'Municipal Planning and Development Office',27,'2026-07-27 00:00:00','2026-07-27 00:00:00'),
(28,'Municipal Social Welfare and Development Office',28,'2026-07-27 00:00:00','2026-07-27 00:00:00'),
(29,'Municipal Treasurer Office',29,'2026-07-27 00:00:00','2026-07-27 00:00:00'),
(30,'Office Of The Mayor',30,'2026-07-27 00:00:00','2026-07-27 00:00:00'),
(31,'Office Of The Vice Mayor',31,'2026-07-27 00:00:00','2026-07-27 00:00:00'),
(32,'Operation of Waterwork System',32,'2026-07-27 00:00:00','2026-07-27 00:00:00'),
(33,'Operations of Market',33,'2026-07-27 00:00:00','2026-07-27 00:00:00'),
(34,'PNP',34,'2026-07-27 00:00:00','2026-07-27 00:00:00'),
(35,'SB Legislative (Capitol)',35,'2026-07-27 00:00:00','2026-07-27 00:00:00'),
(36,'SB Legislative Office',36,'2026-07-27 00:00:00','2026-07-27 00:00:00'),
(37,'SB Legislative Office (Liga)',37,'2026-07-27 00:00:00','2026-07-27 00:00:00'),
(38,'SB Secretariat Office',38,'2026-07-27 00:00:00','2026-07-27 00:00:00'),
(39,'Slaughterhouse',39,'2026-07-27 00:00:00','2026-07-27 00:00:00');
/*!40000 ALTER TABLE `departments` ENABLE KEYS */;
UNLOCK TABLES;

LOCK TABLES `hr_reference_values` WRITE;
/*!40000 ALTER TABLE `hr_reference_values` DISABLE KEYS */;
INSERT INTO `hr_reference_values` (`id`,`category`,`code`,`name`,`description`,`parent_id`,`is_active`,`effective_from`,`effective_to`,`sort_order`,`created_at`,`updated_at`) VALUES
(1,'sectors','MUNICIPAL','Municipal Government','Top-level parent for offices imported from CSV.',NULL,1,NULL,NULL,1,'2026-07-27 00:00:00','2026-07-27 00:00:00'),
(2,'offices','BUDGET_OFFICE','Budget Office','Office imported from copy-position-and-office.csv.',1,1,NULL,NULL,1,'2026-07-27 00:00:00','2026-07-27 00:00:00'),
(3,'offices','CAO','CAO','Office imported from copy-position-and-office.csv.',1,1,NULL,NULL,2,'2026-07-27 00:00:00','2026-07-27 00:00:00'),
(4,'offices','COMMISSION_ON_ELECTIONS','Commission on Elections','Office imported from copy-position-and-office.csv.',1,1,NULL,NULL,3,'2026-07-27 00:00:00','2026-07-27 00:00:00'),
(5,'offices','DEPARTMENT_OF_THE_INTERIOR_AND_LOCAL_GOVERNMENT','Department of the Interior and Local Government','Office imported from copy-position-and-office.csv.',1,1,NULL,NULL,4,'2026-07-27 00:00:00','2026-07-27 00:00:00'),
(6,'offices','MEO_PLAZA_PARKS_AND_MONUMENT_SECTION','MEO - Plaza, Parks and Monument Section','Office imported from copy-position-and-office.csv.',1,1,NULL,NULL,5,'2026-07-27 00:00:00','2026-07-27 00:00:00'),
(7,'offices','MEO_GARBAGE_COLLECTION_SERVICES','MEO-Garbage Collection Services','Office imported from copy-position-and-office.csv.',1,1,NULL,NULL,6,'2026-07-27 00:00:00','2026-07-27 00:00:00'),
(8,'offices','MEO_MAINT_OF_ROADS_AND_BRIDGES','MEO-Maint of Roads and Bridges','Office imported from copy-position-and-office.csv.',1,1,NULL,NULL,7,'2026-07-27 00:00:00','2026-07-27 00:00:00'),
(9,'offices','MEO_STREET_CLEANING_SERVICES','MEO-Street Cleaning Services','Office imported from copy-position-and-office.csv.',1,1,NULL,NULL,8,'2026-07-27 00:00:00','2026-07-27 00:00:00'),
(10,'offices','MEO_STREET_LIGHTING_SERVICES','MEO-Street Lighting Services','Office imported from copy-position-and-office.csv.',1,1,NULL,NULL,9,'2026-07-27 00:00:00','2026-07-27 00:00:00'),
(11,'offices','MO_BUSINESS_PRINTING_AND_LICENSING_SECTION','MO - Business Printing and Licensing Section','Office imported from copy-position-and-office.csv.',1,1,NULL,NULL,10,'2026-07-27 00:00:00','2026-07-27 00:00:00'),
(12,'offices','MO_HUMAN_RESOURCE_AND_MANAGEMENT_SECTION','MO - Human Resource and Management Section','Office imported from copy-position-and-office.csv.',1,1,NULL,NULL,11,'2026-07-27 00:00:00','2026-07-27 00:00:00'),
(13,'offices','MO_INFORMATION_AND_COMMUNICATIONS_TECHNOLOGY_SECTOR','MO - Information and Communications Technology Sector','Office imported from copy-position-and-office.csv.',1,1,NULL,NULL,12,'2026-07-27 00:00:00','2026-07-27 00:00:00'),
(14,'offices','MO_MUNICIPAL_INFORMATION_AND_LIBRARY_SERVICES_SECTION','MO - Municipal Information and Library Services Section','Office imported from copy-position-and-office.csv.',1,1,NULL,NULL,13,'2026-07-27 00:00:00','2026-07-27 00:00:00'),
(15,'offices','MO_NUTRITION_CENTER','MO - Nutrition Center','Office imported from copy-position-and-office.csv.',1,1,NULL,NULL,14,'2026-07-27 00:00:00','2026-07-27 00:00:00'),
(16,'offices','MO_SPORTS_AND_GAMES_SECTION','MO - Sports and Games Section','Office imported from copy-position-and-office.csv.',1,1,NULL,NULL,15,'2026-07-27 00:00:00','2026-07-27 00:00:00'),
(17,'offices','MPOC_TRAFFIC_AIDE','MPOC-Traffic Aide','Office imported from copy-position-and-office.csv.',1,1,NULL,NULL,16,'2026-07-27 00:00:00','2026-07-27 00:00:00'),
(18,'offices','MUNICIPAL_ACCOUNTING_OFFICE','Municipal Accounting Office','Office imported from copy-position-and-office.csv.',1,1,NULL,NULL,17,'2026-07-27 00:00:00','2026-07-27 00:00:00'),
(19,'offices','MUNICIPAL_ADMINISTRATOR_S_OFFICE','Municipal Administrator''s Office','Office imported from copy-position-and-office.csv.',1,1,NULL,NULL,18,'2026-07-27 00:00:00','2026-07-27 00:00:00'),
(20,'offices','MUNICIPAL_AGRICULTURE_OFFICE','Municipal Agriculture Office','Office imported from copy-position-and-office.csv.',1,1,NULL,NULL,19,'2026-07-27 00:00:00','2026-07-27 00:00:00'),
(21,'offices','MUNICIPAL_ASSESSOR_OFFICE','Municipal Assessor Office','Office imported from copy-position-and-office.csv.',1,1,NULL,NULL,20,'2026-07-27 00:00:00','2026-07-27 00:00:00'),
(22,'offices','MUNICIPAL_CIVIL_REGISTRAR_S_OFFICE','Municipal Civil Registrar''s Office','Office imported from copy-position-and-office.csv.',1,1,NULL,NULL,21,'2026-07-27 00:00:00','2026-07-27 00:00:00'),
(23,'offices','MUNICIPAL_DISASTER_RISK_REDUCTION_AND_MANAGEMENT_OFFICE','Municipal Disaster Risk Reduction and Management Office','Office imported from copy-position-and-office.csv.',1,1,NULL,NULL,22,'2026-07-27 00:00:00','2026-07-27 00:00:00'),
(24,'offices','MUNICIPAL_ENGINEERING_OFFICE','Municipal Engineering Office','Office imported from copy-position-and-office.csv.',1,1,NULL,NULL,23,'2026-07-27 00:00:00','2026-07-27 00:00:00'),
(25,'offices','MUNICIPAL_HEALTH_OFFICE','Municipal Health Office','Office imported from copy-position-and-office.csv.',1,1,NULL,NULL,24,'2026-07-27 00:00:00','2026-07-27 00:00:00'),
(26,'offices','MUNICIPAL_HEALTH_OFFICE_RHU_II','Municipal Health Office (RHU II)','Office imported from copy-position-and-office.csv.',1,1,NULL,NULL,25,'2026-07-27 00:00:00','2026-07-27 00:00:00'),
(27,'offices','MUNICIPAL_NUTRITION_OFFICE','Municipal Nutrition Office','Office imported from copy-position-and-office.csv.',1,1,NULL,NULL,26,'2026-07-27 00:00:00','2026-07-27 00:00:00'),
(28,'offices','MUNICIPAL_PLANNING_AND_DEVELOPMENT_OFFICE','Municipal Planning and Development Office','Office imported from copy-position-and-office.csv.',1,1,NULL,NULL,27,'2026-07-27 00:00:00','2026-07-27 00:00:00'),
(29,'offices','MUNICIPAL_SOCIAL_WELFARE_AND_DEVELOPMENT_OFFICE','Municipal Social Welfare and Development Office','Office imported from copy-position-and-office.csv.',1,1,NULL,NULL,28,'2026-07-27 00:00:00','2026-07-27 00:00:00'),
(30,'offices','MUNICIPAL_TREASURER_OFFICE','Municipal Treasurer Office','Office imported from copy-position-and-office.csv.',1,1,NULL,NULL,29,'2026-07-27 00:00:00','2026-07-27 00:00:00'),
(31,'offices','OFFICE_OF_THE_MAYOR','Office Of The Mayor','Office imported from copy-position-and-office.csv.',1,1,NULL,NULL,30,'2026-07-27 00:00:00','2026-07-27 00:00:00'),
(32,'offices','OFFICE_OF_THE_VICE_MAYOR','Office Of The Vice Mayor','Office imported from copy-position-and-office.csv.',1,1,NULL,NULL,31,'2026-07-27 00:00:00','2026-07-27 00:00:00'),
(33,'offices','OPERATION_OF_WATERWORK_SYSTEM','Operation of Waterwork System','Office imported from copy-position-and-office.csv.',1,1,NULL,NULL,32,'2026-07-27 00:00:00','2026-07-27 00:00:00'),
(34,'offices','OPERATIONS_OF_MARKET','Operations of Market','Office imported from copy-position-and-office.csv.',1,1,NULL,NULL,33,'2026-07-27 00:00:00','2026-07-27 00:00:00'),
(35,'offices','PNP','PNP','Office imported from copy-position-and-office.csv.',1,1,NULL,NULL,34,'2026-07-27 00:00:00','2026-07-27 00:00:00'),
(36,'offices','SB_LEGISLATIVE_CAPITOL','SB Legislative (Capitol)','Office imported from copy-position-and-office.csv.',1,1,NULL,NULL,35,'2026-07-27 00:00:00','2026-07-27 00:00:00'),
(37,'offices','SB_LEGISLATIVE_OFFICE','SB Legislative Office','Office imported from copy-position-and-office.csv.',1,1,NULL,NULL,36,'2026-07-27 00:00:00','2026-07-27 00:00:00'),
(38,'offices','SB_LEGISLATIVE_OFFICE_LIGA','SB Legislative Office (Liga)','Office imported from copy-position-and-office.csv.',1,1,NULL,NULL,37,'2026-07-27 00:00:00','2026-07-27 00:00:00'),
(39,'offices','SB_SECRETARIAT_OFFICE','SB Secretariat Office','Office imported from copy-position-and-office.csv.',1,1,NULL,NULL,38,'2026-07-27 00:00:00','2026-07-27 00:00:00'),
(40,'offices','SLAUGHTERHOUSE','Slaughterhouse','Office imported from copy-position-and-office.csv.',1,1,NULL,NULL,39,'2026-07-27 00:00:00','2026-07-27 00:00:00');
/*!40000 ALTER TABLE `hr_reference_values` ENABLE KEYS */;
UNLOCK TABLES;

SET FOREIGN_KEY_CHECKS=1;

-- Reference summary: 93 positions, 39 offices from copy-position-and-office.csv.
