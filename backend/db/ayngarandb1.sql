CREATE DATABASE  IF NOT EXISTS `ayngaran_ecommerce` /*!40100 DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci */ /*!80016 DEFAULT ENCRYPTION='N' */;
USE `ayngaran_ecommerce`;
-- MySQL dump 10.13  Distrib 8.0.46, for Win64 (x86_64)
--
-- Host: localhost    Database: ayngaran_ecommerce
-- ------------------------------------------------------
-- Server version	8.0.46

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
-- Table structure for table `_prisma_migrations`
--

DROP TABLE IF EXISTS `_prisma_migrations`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `_prisma_migrations` (
  `id` varchar(36) COLLATE utf8mb4_unicode_ci NOT NULL,
  `checksum` varchar(64) COLLATE utf8mb4_unicode_ci NOT NULL,
  `finished_at` datetime(3) DEFAULT NULL,
  `migration_name` varchar(255) COLLATE utf8mb4_unicode_ci NOT NULL,
  `logs` text COLLATE utf8mb4_unicode_ci,
  `rolled_back_at` datetime(3) DEFAULT NULL,
  `started_at` datetime(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  `applied_steps_count` int unsigned NOT NULL DEFAULT '0',
  PRIMARY KEY (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `_prisma_migrations`
--

LOCK TABLES `_prisma_migrations` WRITE;
/*!40000 ALTER TABLE `_prisma_migrations` DISABLE KEYS */;
INSERT INTO `_prisma_migrations` VALUES ('2bef9129-a493-491b-8f51-51dd19d72df0','28b6860bb07f7946a96bbfec151ef3aacb854a167376a3b392f2905bdba1b0e3','2026-09-09 08:54:07.114','20260909085403_init',NULL,NULL,'2026-09-09 08:54:03.748',1);
/*!40000 ALTER TABLE `_prisma_migrations` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `attribute_values`
--

DROP TABLE IF EXISTS `attribute_values`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `attribute_values` (
  `id` int NOT NULL AUTO_INCREMENT,
  `attribute_id` int NOT NULL,
  `value` varchar(191) COLLATE utf8mb4_unicode_ci NOT NULL,
  `display_name` varchar(191) COLLATE utf8mb4_unicode_ci NOT NULL,
  `sort_order` int NOT NULL DEFAULT '0',
  `is_active` tinyint(1) NOT NULL DEFAULT '1',
  `deleted_at` datetime(3) DEFAULT NULL,
  `deleted_by` int DEFAULT NULL,
  `created_at` datetime(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  `updated_at` datetime(3) NOT NULL,
  PRIMARY KEY (`id`),
  KEY `attribute_values_attribute_id_idx` (`attribute_id`),
  CONSTRAINT `attribute_values_attribute_id_fkey` FOREIGN KEY (`attribute_id`) REFERENCES `attributes` (`id`) ON DELETE RESTRICT ON UPDATE CASCADE
) ENGINE=InnoDB AUTO_INCREMENT=32 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `attribute_values`
--

LOCK TABLES `attribute_values` WRITE;
/*!40000 ALTER TABLE `attribute_values` DISABLE KEYS */;
INSERT INTO `attribute_values` VALUES (24,10,'20G','20g',1,1,NULL,NULL,'2026-09-09 11:03:23.495','2026-09-09 11:03:23.495'),(25,10,'50G','50g',2,1,NULL,NULL,'2026-09-09 11:03:23.501','2026-09-09 11:03:23.501'),(26,10,'100G','100g',3,1,NULL,NULL,'2026-09-09 11:03:23.505','2026-09-09 11:03:23.505'),(27,10,'200G','200g',4,1,NULL,NULL,'2026-09-09 11:03:23.509','2026-09-09 11:03:23.509'),(28,10,'250G','250g',5,1,NULL,NULL,'2026-09-09 11:03:23.513','2026-09-09 11:03:23.513'),(29,10,'500G','500g',6,1,NULL,NULL,'2026-09-09 11:03:23.517','2026-09-09 11:03:23.517'),(30,10,'1KG','1kg',7,1,NULL,NULL,'2026-09-09 11:03:23.521','2026-09-09 11:03:23.521'),(31,10,'PACKET','Packet',8,1,NULL,NULL,'2026-09-09 11:03:23.524','2026-09-09 11:03:23.524');
/*!40000 ALTER TABLE `attribute_values` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `attributes`
--

DROP TABLE IF EXISTS `attributes`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `attributes` (
  `id` int NOT NULL AUTO_INCREMENT,
  `name` varchar(191) COLLATE utf8mb4_unicode_ci NOT NULL,
  `slug` varchar(191) COLLATE utf8mb4_unicode_ci NOT NULL,
  `data_type` varchar(191) COLLATE utf8mb4_unicode_ci NOT NULL,
  `unit` varchar(191) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `is_active` tinyint(1) NOT NULL DEFAULT '1',
  `deleted_at` datetime(3) DEFAULT NULL,
  `deleted_by` int DEFAULT NULL,
  `created_at` datetime(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  `updated_at` datetime(3) NOT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `attributes_slug_key` (`slug`)
) ENGINE=InnoDB AUTO_INCREMENT=11 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `attributes`
--

LOCK TABLES `attributes` WRITE;
/*!40000 ALTER TABLE `attributes` DISABLE KEYS */;
INSERT INTO `attributes` VALUES (10,'Package Size','package-size','single_select',NULL,1,NULL,NULL,'2026-09-09 11:03:23.488','2026-09-09 11:03:23.488');
/*!40000 ALTER TABLE `attributes` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `audit_logs`
--

DROP TABLE IF EXISTS `audit_logs`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `audit_logs` (
  `id` int NOT NULL AUTO_INCREMENT,
  `staff_id` int DEFAULT NULL,
  `action` varchar(191) COLLATE utf8mb4_unicode_ci NOT NULL,
  `entity_type` varchar(191) COLLATE utf8mb4_unicode_ci NOT NULL,
  `entity_id` varchar(191) COLLATE utf8mb4_unicode_ci NOT NULL,
  `old_value_json` text COLLATE utf8mb4_unicode_ci,
  `new_value_json` text COLLATE utf8mb4_unicode_ci,
  `ip_address` varchar(191) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `created_at` datetime(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  PRIMARY KEY (`id`),
  KEY `audit_logs_staff_id_idx` (`staff_id`),
  KEY `audit_logs_entity_type_entity_id_idx` (`entity_type`,`entity_id`),
  KEY `audit_logs_created_at_idx` (`created_at`),
  CONSTRAINT `audit_logs_staff_id_fkey` FOREIGN KEY (`staff_id`) REFERENCES `staff` (`id`) ON DELETE SET NULL ON UPDATE CASCADE
) ENGINE=InnoDB AUTO_INCREMENT=64 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `audit_logs`
--

LOCK TABLES `audit_logs` WRITE;
/*!40000 ALTER TABLE `audit_logs` DISABLE KEYS */;
INSERT INTO `audit_logs` VALUES (1,1,'SYSTEM_INITIALIZATION','System','ROOT',NULL,'{\"seededCategories\":5,\"seededAttributes\":8,\"seededBrands\":3,\"seededProducts\":2,\"seededGateways\":3}','127.0.0.1','2026-09-09 08:55:34.307'),(2,1,'SOFT_DELETE_ENTITY','Brand','4','{\"id\":4,\"brandCode\":\"BRD-TEST-999\",\"name\":\"Test Temp Brand\",\"slug\":\"test-temp-brand\",\"description\":\"Brand for testing soft delete\",\"logo\":null,\"isActive\":true,\"deletedAt\":null,\"deletedBy\":null,\"createdAt\":\"2026-09-09T08:56:07.946Z\",\"updatedAt\":\"2026-09-09T08:56:07.946Z\"}','{\"id\":4,\"brandCode\":\"BRD-TEST-999\",\"name\":\"Test Temp Brand\",\"slug\":\"test-temp-brand\",\"description\":\"Brand for testing soft delete\",\"logo\":null,\"isActive\":true,\"deletedAt\":\"2026-09-09T08:56:07.959Z\",\"deletedBy\":1,\"createdAt\":\"2026-09-09T08:56:07.946Z\",\"updatedAt\":\"2026-09-09T08:56:07.976Z\"}',NULL,'2026-09-09 08:56:07.986'),(3,1,'RESTORE_ENTITY','Brand','4','{\"deletedAt\":\"2026-09-09T08:56:07.959Z\",\"deletedBy\":1}','{\"deletedAt\":null,\"deletedBy\":null}',NULL,'2026-09-09 08:56:08.005'),(4,1,'STAFF_LOGIN','Staff','1',NULL,'{\"email\":\"admin@ayngaran.com\",\"role\":\"SUPER_ADMIN\"}','127.0.0.1','2026-09-09 08:59:11.626'),(5,NULL,'UPDATE_STOCK','Inventory','4','{\"sku\":\"SKU-APP-16P-SLV-1TB\",\"stockQuantity\":3}','{\"sku\":\"SKU-APP-16P-SLV-1TB\",\"stockQuantity\":13,\"change\":10}',NULL,'2026-09-09 09:03:41.652'),(6,NULL,'UPDATE_STOCK','Inventory','4','{\"sku\":\"SKU-APP-16P-SLV-1TB\",\"stockQuantity\":13}','{\"sku\":\"SKU-APP-16P-SLV-1TB\",\"stockQuantity\":3,\"change\":-10}',NULL,'2026-09-09 09:03:41.733'),(7,1,'STAFF_LOGIN','Staff','1',NULL,'{\"email\":\"admin@ayngaran.com\",\"role\":\"SUPER_ADMIN\"}','::1','2026-09-09 09:29:34.760'),(8,1,'UPDATE_CATEGORY','Category','1','{\"id\":1,\"categoryCode\":\"CAT-ELEC-001\",\"name\":\"Electronics\",\"slug\":\"electronics\",\"description\":\"Consumer electronics, personal computing, and smartphones\",\"image\":\"https://images.unsplash.com/photo-1498049794561-7780e7231661?w=800&auto=format&fit=crop&q=80\",\"parentId\":null,\"isActive\":true,\"sortOrder\":1,\"deletedAt\":null,\"deletedBy\":null,\"createdAt\":\"2026-09-09T08:55:33.981Z\",\"updatedAt\":\"2026-09-09T08:55:33.981Z\"}','{\"id\":1,\"categoryCode\":\"CAT-ELEC-001\",\"name\":\"Electronics\",\"slug\":\"electronics\",\"description\":\"Consumer electronics, personal computing, and smartphones\",\"image\":\"http://localhost:4000/uploads/electronics-1788947777719-543802.jpg\",\"parentId\":null,\"isActive\":true,\"sortOrder\":1,\"deletedAt\":null,\"deletedBy\":null,\"createdAt\":\"2026-09-09T08:55:33.981Z\",\"updatedAt\":\"2026-09-09T09:56:21.175Z\"}',NULL,'2026-09-09 09:56:21.198'),(9,NULL,'UPDATE_STOCK','Inventory','4','{\"sku\":\"SKU-APP-16P-SLV-1TB\",\"stockQuantity\":3}','{\"sku\":\"SKU-APP-16P-SLV-1TB\",\"stockQuantity\":13,\"change\":10}',NULL,'2026-09-09 09:56:33.615'),(10,NULL,'UPDATE_STOCK','Inventory','4','{\"sku\":\"SKU-APP-16P-SLV-1TB\",\"stockQuantity\":13}','{\"sku\":\"SKU-APP-16P-SLV-1TB\",\"stockQuantity\":3,\"change\":-10}',NULL,'2026-09-09 09:56:33.841'),(11,1,'STAFF_LOGIN','Staff','1',NULL,'{\"email\":\"admin@ayngaran.com\",\"role\":\"SUPER_ADMIN\"}','::1','2026-09-09 09:56:52.435'),(12,1,'STAFF_LOGIN','Staff','1',NULL,'{\"email\":\"admin@ayngaran.com\",\"role\":\"SUPER_ADMIN\"}','::1','2026-09-09 09:57:02.660'),(13,1,'STAFF_LOGIN','Staff','1',NULL,'{\"email\":\"admin@ayngaran.com\",\"role\":\"SUPER_ADMIN\"}','::1','2026-09-09 09:57:11.605'),(14,1,'STAFF_LOGIN','Staff','1',NULL,'{\"email\":\"admin@ayngaran.com\",\"role\":\"SUPER_ADMIN\"}','::1','2026-09-09 09:57:26.502'),(15,1,'CREATE_CATEGORY','Category','6',NULL,'{\"id\":6,\"categoryCode\":\"CAT-SMAR-3725\",\"name\":\"Smart Audio 6532\",\"slug\":\"smart-audio-6532\",\"description\":\"Audio devices and headphones\",\"image\":\"http://localhost:4000/uploads/electronics-1788947777719-543802.jpg\",\"parentId\":null,\"isActive\":true,\"sortOrder\":0,\"deletedAt\":null,\"deletedBy\":null,\"createdAt\":\"2026-09-09T09:57:26.556Z\",\"updatedAt\":\"2026-09-09T09:57:26.556Z\"}',NULL,'2026-09-09 09:57:26.647'),(16,1,'CREATE_BRAND','Brand','5',NULL,'{\"id\":5,\"brandCode\":\"BRD-SONY-1584\",\"name\":\"Sony Audio 6532\",\"slug\":\"sony-audio-6532\",\"description\":\"Sony Corporation Audio Division\",\"logo\":\"http://localhost:4000/uploads/electronics-1788947777719-543802.jpg\",\"isActive\":true,\"deletedAt\":null,\"deletedBy\":null,\"createdAt\":\"2026-09-09T09:57:26.885Z\",\"updatedAt\":\"2026-09-09T09:57:26.885Z\"}',NULL,'2026-09-09 09:57:26.968'),(17,1,'CREATE_PRODUCT','Product','3',NULL,'{\"productCode\":\"PRD-SONY-7849\",\"name\":\"Sony WH-1000XM5 6532\",\"categoryId\":6,\"variantsCount\":2}',NULL,'2026-09-09 09:57:27.235'),(18,1,'STAFF_LOGIN','Staff','1',NULL,'{\"email\":\"admin@ayngaran.com\",\"role\":\"SUPER_ADMIN\"}','::1','2026-09-09 10:01:52.058'),(19,1,'STAFF_LOGIN','Staff','1',NULL,'{\"email\":\"admin@ayngaran.com\",\"role\":\"SUPER_ADMIN\"}','::1','2026-09-09 10:26:23.057'),(20,1,'UPDATE_PRODUCT','Product','4','{\"name\":\"Moringa Podi\",\"basePrice\":\"70\",\"status\":\"ACTIVE\"}','{\"name\":\"Moringa Podi\",\"slug\":\"moringa-podi\",\"description\":\"Nutrient-rich Moringa leaf podi blended with traditional spices for daily vitality and immunity.\",\"categoryId\":7,\"brandId\":6,\"basePrice\":70,\"status\":\"ACTIVE\",\"minStockAlert\":5,\"attributesUpdated\":false,\"variantsUpdated\":false}',NULL,'2026-09-09 11:15:20.731'),(21,1,'UPDATE_PRODUCT','Product','27','{\"name\":\"Herbal Hair Dye\",\"basePrice\":\"150\",\"status\":\"ACTIVE\"}','{\"name\":\"Herbal Hair Dye\",\"slug\":\"herbal-hair-dye\",\"description\":\"100% natural, ammonia-free herbal hair dye formulation crafted from indigo, henna, and botanical herbs.\",\"categoryId\":13,\"brandId\":6,\"basePrice\":150,\"status\":\"ACTIVE\",\"minStockAlert\":5,\"attributesUpdated\":true,\"variantsUpdated\":true}',NULL,'2026-09-09 11:50:42.977'),(22,1,'UPDATE_PRODUCT','Product','26','{\"name\":\"Choco Blast\",\"basePrice\":\"200\",\"status\":\"ACTIVE\"}','{\"name\":\"Choco Blast\",\"slug\":\"choco-blast\",\"description\":\"Delicious chocolate energy crunch bites crafted with wholesome natural ingredients.\",\"categoryId\":12,\"brandId\":6,\"basePrice\":200,\"status\":\"ACTIVE\",\"minStockAlert\":5,\"attributesUpdated\":true,\"variantsUpdated\":true}',NULL,'2026-09-09 11:50:52.577'),(23,1,'UPDATE_PRODUCT','Product','25','{\"name\":\"Snacks\",\"basePrice\":\"150\",\"status\":\"ACTIVE\"}','{\"name\":\"Snacks\",\"slug\":\"snacks\",\"description\":\"Traditional and nutritious crunchy snacks prepared using natural cold-pressed oil and wholesome grains.\",\"categoryId\":12,\"brandId\":6,\"basePrice\":150,\"status\":\"ACTIVE\",\"minStockAlert\":5,\"attributesUpdated\":true,\"variantsUpdated\":true}',NULL,'2026-09-09 11:51:01.264'),(24,1,'UPDATE_PRODUCT','Product','24','{\"name\":\"Museli\",\"basePrice\":\"280\",\"status\":\"ACTIVE\"}','{\"name\":\"Museli\",\"slug\":\"museli\",\"description\":\"Healthy breakfast muesli loaded with rolled grains, nuts, and natural dried fruits.\",\"categoryId\":12,\"brandId\":6,\"basePrice\":280,\"status\":\"ACTIVE\",\"minStockAlert\":5,\"attributesUpdated\":true,\"variantsUpdated\":true}',NULL,'2026-09-09 11:51:17.081'),(25,1,'UPDATE_PRODUCT','Product','23','{\"name\":\"Noodle & Pasta\",\"basePrice\":\"150\",\"status\":\"ACTIVE\"}','{\"name\":\"Noodle & Pasta\",\"slug\":\"noodle-and-pasta\",\"description\":\"Wholesome millet and grain noodles and pasta made without refined flour or artificial preservatives.\",\"categoryId\":12,\"brandId\":6,\"basePrice\":150,\"status\":\"ACTIVE\",\"minStockAlert\":5,\"attributesUpdated\":true,\"variantsUpdated\":true}',NULL,'2026-09-09 11:51:29.477'),(26,1,'UPDATE_PRODUCT','Product','22','{\"name\":\"Moringa Soup Mix\",\"basePrice\":\"80\",\"status\":\"ACTIVE\"}','{\"name\":\"Moringa Soup Mix\",\"slug\":\"moringa-soup-mix\",\"description\":\"Instant nutrient-dense moringa herbal soup mix, soothing, energizing, and rich in vitamins.\",\"categoryId\":11,\"brandId\":6,\"basePrice\":80,\"status\":\"ACTIVE\",\"minStockAlert\":5,\"attributesUpdated\":true,\"variantsUpdated\":true}',NULL,'2026-09-09 11:51:40.551'),(27,1,'UPDATE_PRODUCT','Product','21','{\"name\":\"Mudavatukal Soup Mix\",\"basePrice\":\"120\",\"status\":\"ACTIVE\"}','{\"name\":\"Mudavatukal Soup Mix\",\"slug\":\"mudavatukal-soup-mix\",\"description\":\"Traditional Mudavatukal kizhangu botanical soup mix renowned for bone strength and joint comfort.\",\"categoryId\":11,\"brandId\":6,\"basePrice\":120,\"status\":\"ACTIVE\",\"minStockAlert\":5,\"attributesUpdated\":true,\"variantsUpdated\":true}',NULL,'2026-09-09 11:51:56.539'),(28,1,'UPDATE_PRODUCT','Product','20','{\"name\":\"Kulambu Milagu Powder\",\"basePrice\":\"90\",\"status\":\"ACTIVE\"}','{\"name\":\"Kulambu Milagu Powder\",\"slug\":\"kulambu-milagu-powder\",\"description\":\"Spicy pepper-infused kulambu powder ideal for restorative milagu kuzhambu and medicinal gravies.\",\"categoryId\":10,\"brandId\":6,\"basePrice\":90,\"status\":\"ACTIVE\",\"minStockAlert\":5,\"attributesUpdated\":true,\"variantsUpdated\":true}',NULL,'2026-09-09 11:52:08.818'),(29,1,'UPDATE_PRODUCT','Product','19','{\"name\":\"Curry Masalas\",\"basePrice\":\"90\",\"status\":\"ACTIVE\"}','{\"name\":\"Curry Masalas\",\"slug\":\"curry-masalas\",\"description\":\"Multi-purpose traditional curry masala blend for deep, flavorful South Indian gravies and curries.\",\"categoryId\":10,\"brandId\":6,\"basePrice\":90,\"status\":\"ACTIVE\",\"minStockAlert\":5,\"attributesUpdated\":true,\"variantsUpdated\":true}',NULL,'2026-09-09 11:52:30.655'),(30,1,'UPDATE_PRODUCT','Product','18','{\"name\":\"All Fry Masala (Veg & Non-Veg)\",\"basePrice\":\"120\",\"status\":\"ACTIVE\"}','{\"name\":\"All Fry Masala (Veg & Non-Veg)\",\"slug\":\"all-fry-masala-veg-non-veg\",\"description\":\"Versatile crispy fry seasoning blend formulated for vegetables, paneer, and non-veg specialties.\",\"categoryId\":10,\"brandId\":6,\"basePrice\":120,\"status\":\"ACTIVE\",\"minStockAlert\":5,\"attributesUpdated\":true,\"variantsUpdated\":true}',NULL,'2026-09-09 11:53:11.310'),(31,1,'UPDATE_PRODUCT','Product','17','{\"name\":\"Rasam Powder\",\"basePrice\":\"90\",\"status\":\"ACTIVE\"}','{\"name\":\"Rasam Powder\",\"slug\":\"rasam-powder\",\"description\":\"Classic zesty rasam powder infused with black pepper, cumin, and fragrant herbs.\",\"categoryId\":10,\"brandId\":6,\"basePrice\":90,\"status\":\"ACTIVE\",\"minStockAlert\":5,\"attributesUpdated\":true,\"variantsUpdated\":true}',NULL,'2026-09-09 11:53:21.194'),(32,1,'UPDATE_PRODUCT','Product','5','{\"name\":\"Karuveppillai Podi\",\"basePrice\":\"70\",\"status\":\"ACTIVE\"}','{\"name\":\"Karuveppillai Podi\",\"slug\":\"karuveppillai-podi\",\"description\":\"Fragrant and iron-rich Curry Leaf (Karuveppillai) podi, excellent for hair health and digestion.\",\"categoryId\":7,\"brandId\":6,\"basePrice\":70,\"status\":\"ACTIVE\",\"minStockAlert\":5,\"attributesUpdated\":true,\"variantsUpdated\":true}',NULL,'2026-09-09 11:53:37.417'),(33,1,'UPDATE_PRODUCT','Product','6','{\"name\":\"Paruppu Podi\",\"basePrice\":\"100\",\"status\":\"ACTIVE\"}','{\"name\":\"Paruppu Podi\",\"slug\":\"paruppu-podi\",\"description\":\"Classic roasted lentil podi with aromatic spices, best served hot with rice and ghee.\",\"categoryId\":7,\"brandId\":6,\"basePrice\":100,\"status\":\"ACTIVE\",\"minStockAlert\":5,\"attributesUpdated\":true,\"variantsUpdated\":true}',NULL,'2026-09-09 11:53:46.176'),(34,1,'UPDATE_PRODUCT','Product','16','{\"name\":\"Sambar Powder\",\"basePrice\":\"80\",\"status\":\"ACTIVE\"}','{\"name\":\"Sambar Powder\",\"slug\":\"sambar-powder\",\"description\":\"Aromatic traditional South Indian sambar masala ground from hand-picked lentils, coriander, and spices.\",\"categoryId\":10,\"brandId\":6,\"basePrice\":80,\"status\":\"ACTIVE\",\"minStockAlert\":5,\"attributesUpdated\":true,\"variantsUpdated\":true}',NULL,'2026-09-09 11:53:57.259'),(35,1,'UPDATE_PRODUCT','Product','15','{\"name\":\"Weight Loss Powder\",\"basePrice\":\"300\",\"status\":\"ACTIVE\"}','{\"name\":\"Weight Loss Powder\",\"slug\":\"weight-loss-powder\",\"description\":\"Natural herbal wellness formulation crafted to support active metabolism and healthy weight management.\",\"categoryId\":9,\"brandId\":6,\"basePrice\":300,\"status\":\"ACTIVE\",\"minStockAlert\":5,\"attributesUpdated\":true,\"variantsUpdated\":true}',NULL,'2026-09-09 11:54:05.403'),(36,1,'UPDATE_PRODUCT','Product','14','{\"name\":\"Gut Free Powder\",\"basePrice\":\"140\",\"status\":\"ACTIVE\"}','{\"name\":\"Gut Free Powder\",\"slug\":\"gut-free-powder\",\"description\":\"Specialized herbal blend formulated to soothe the stomach lining, relieve bloating, and aid digestion.\",\"categoryId\":9,\"brandId\":6,\"basePrice\":140,\"status\":\"ACTIVE\",\"minStockAlert\":5,\"attributesUpdated\":true,\"variantsUpdated\":true}',NULL,'2026-09-09 11:54:14.203'),(37,1,'UPDATE_PRODUCT','Product','13','{\"name\":\"Raw Karuveppillai Powder\",\"basePrice\":\"100\",\"status\":\"ACTIVE\"}','{\"name\":\"Raw Karuveppillai Powder\",\"slug\":\"raw-karuveppillai-powder\",\"description\":\"Pure raw dried curry leaf powder, ideal for hair root nourishment and internal detox.\",\"categoryId\":9,\"brandId\":6,\"basePrice\":100,\"status\":\"ACTIVE\",\"minStockAlert\":5,\"attributesUpdated\":true,\"variantsUpdated\":true}',NULL,'2026-09-09 11:54:28.895'),(38,1,'UPDATE_PRODUCT','Product','12','{\"name\":\"Raw Moringa Powder\",\"basePrice\":\"100\",\"status\":\"ACTIVE\"}','{\"name\":\"Raw Moringa Powder\",\"slug\":\"raw-moringa-powder\",\"description\":\"100% pure shade-dried raw moringa leaves ground into a green superfood botanical powder.\",\"categoryId\":9,\"brandId\":6,\"basePrice\":100,\"status\":\"ACTIVE\",\"minStockAlert\":5,\"attributesUpdated\":true,\"variantsUpdated\":true}',NULL,'2026-09-09 11:54:50.209'),(39,1,'UPDATE_PRODUCT','Product','9','{\"name\":\"ABC Malt\",\"basePrice\":\"150\",\"status\":\"ACTIVE\"}','{\"name\":\"ABC Malt\",\"slug\":\"abc-malt\",\"description\":\"Apple, Beetroot & Carrot natural malt formula for skin glow and antioxidant wellness.\",\"categoryId\":8,\"brandId\":6,\"basePrice\":150,\"status\":\"ACTIVE\",\"minStockAlert\":5,\"attributesUpdated\":true,\"variantsUpdated\":true}',NULL,'2026-09-09 11:55:01.993'),(40,1,'UPDATE_PRODUCT','Product','7','{\"name\":\"U-Malt\",\"basePrice\":\"80\",\"status\":\"ACTIVE\"}','{\"name\":\"U-Malt\",\"slug\":\"u-malt\",\"description\":\"Wholesome multigrain malt drink mix packed with vitamins and natural stamina boosters.\",\"categoryId\":8,\"brandId\":6,\"basePrice\":80,\"status\":\"ACTIVE\",\"minStockAlert\":5,\"attributesUpdated\":true,\"variantsUpdated\":true}',NULL,'2026-09-09 11:55:17.414'),(41,1,'UPDATE_PRODUCT','Product','8','{\"name\":\"R-Malt\",\"basePrice\":\"80\",\"status\":\"ACTIVE\"}','{\"name\":\"R-Malt\",\"slug\":\"r-malt\",\"description\":\"Traditional roasted ragi malt formulation rich in dietary calcium and sustained energy.\",\"categoryId\":8,\"brandId\":6,\"basePrice\":80,\"status\":\"ACTIVE\",\"minStockAlert\":5,\"attributesUpdated\":true,\"variantsUpdated\":true}',NULL,'2026-09-09 11:55:26.447'),(42,1,'UPDATE_PRODUCT','Product','10','{\"name\":\"Dates Powder\",\"basePrice\":\"140\",\"status\":\"ACTIVE\"}','{\"name\":\"Dates Powder\",\"slug\":\"dates-powder\",\"description\":\"Natural dried date sweetener powder, a wholesome and nutritious alternative to refined sugar.\",\"categoryId\":9,\"brandId\":6,\"basePrice\":140,\"status\":\"ACTIVE\",\"minStockAlert\":5,\"attributesUpdated\":true,\"variantsUpdated\":true}',NULL,'2026-09-09 11:55:34.563'),(43,1,'UPDATE_PRODUCT','Product','11','{\"name\":\"Raw Banana Powder\",\"basePrice\":\"80\",\"status\":\"ACTIVE\"}','{\"name\":\"Raw Banana Powder\",\"slug\":\"raw-banana-powder\",\"description\":\"Potent prebiotic green banana flour rich in resistant starch for exceptional gut digestion.\",\"categoryId\":9,\"brandId\":6,\"basePrice\":80,\"status\":\"ACTIVE\",\"minStockAlert\":5,\"attributesUpdated\":true,\"variantsUpdated\":true}',NULL,'2026-09-09 11:55:46.199'),(44,1,'CHANGE_ORDER_STATUS','Order','2','{\"status\":\"CONFIRMED\"}','{\"status\":\"PROCESSING\"}',NULL,'2026-09-09 12:17:37.425'),(45,1,'CHANGE_ORDER_STATUS','Order','2','{\"status\":\"PROCESSING\"}','{\"status\":\"PACKED\"}',NULL,'2026-09-09 12:46:02.722'),(46,1,'ASSIGN_DELIVERY','Order','2',NULL,'{\"partner\":\"Blue Dart Express\",\"trackingNumber\":\"TRK-BLUEDART-18931180\"}',NULL,'2026-09-09 12:46:31.326'),(47,1,'STAFF_LOGIN','Staff','1',NULL,'{\"email\":\"admin@ayngaran.com\",\"role\":\"SUPER_ADMIN\"}','::1','2026-09-10 05:43:52.391'),(48,1,'CHANGE_ORDER_STATUS','Order','3','{\"status\":\"CONFIRMED\"}','{\"status\":\"PROCESSING\"}',NULL,'2026-09-10 07:09:36.214'),(49,1,'CHANGE_ORDER_STATUS','Order','3','{\"status\":\"PROCESSING\"}','{\"status\":\"PROCESSING\"}',NULL,'2026-09-10 07:09:38.825'),(50,1,'CHANGE_ORDER_STATUS','Order','4','{\"status\":\"CONFIRMED\"}','{\"status\":\"PROCESSING\"}',NULL,'2026-09-10 07:18:57.018'),(51,1,'CHANGE_ORDER_STATUS','Order','4','{\"status\":\"PROCESSING\"}','{\"status\":\"PACKED\"}',NULL,'2026-09-10 07:19:10.565'),(52,1,'ASSIGN_DELIVERY','Order','2',NULL,'{\"partner\":\"Blue Dart Express\",\"trackingNumber\":\"TRK-BLUEDART-18931180\"}',NULL,'2026-09-10 08:57:37.370'),(53,1,'CHANGE_ORDER_STATUS','Order','2','{\"status\":\"PACKED\"}','{\"status\":\"SHIPPED\"}',NULL,'2026-09-10 08:57:49.513'),(54,1,'STAFF_LOGIN','Staff','1',NULL,'{\"email\":\"admin@ayngaran.com\",\"role\":\"SUPER_ADMIN\"}','::1','2026-09-11 06:45:34.532'),(55,1,'CHANGE_ORDER_STATUS','Order','4','{\"status\":\"PACKED\"}','{\"status\":\"DELIVERED\"}',NULL,'2026-09-11 07:06:37.986'),(56,1,'CHANGE_ORDER_STATUS','Order','3','{\"status\":\"PROCESSING\"}','{\"status\":\"DELIVERED\"}',NULL,'2026-09-11 07:07:07.543'),(57,1,'CHANGE_ORDER_STATUS','Order','2','{\"status\":\"SHIPPED\"}','{\"status\":\"DELIVERED\"}',NULL,'2026-09-11 07:07:18.433'),(58,1,'STAFF_LOGIN','Staff','1',NULL,'{\"email\":\"admin@ayngaran.com\",\"role\":\"SUPER_ADMIN\"}','::1','2026-09-11 08:41:45.577'),(59,1,'STAFF_LOGIN','Staff','1',NULL,'{\"email\":\"admin@ayngaran.com\",\"role\":\"SUPER_ADMIN\"}','::1','2026-09-11 08:41:51.071'),(60,1,'CREATE_CATEGORY','Category','14',NULL,'{\"id\":14,\"categoryCode\":\"CAT-PICK-3726\",\"name\":\"Pickle\",\"slug\":\"pickle\",\"description\":null,\"image\":\"http://localhost:4000/uploads/chocoblast-1789190986991-548872.jpg\",\"parentId\":null,\"isActive\":true,\"sortOrder\":0,\"gstRate\":\"0\",\"deletedAt\":null,\"deletedBy\":null,\"createdAt\":\"2026-09-12T05:29:48.949Z\",\"updatedAt\":\"2026-09-12T05:29:48.949Z\"}',NULL,'2026-09-12 05:29:48.958'),(61,1,'CREATE_PRODUCT','Product','28',NULL,'{\"productCode\":\"PRD-MANG-1497\",\"name\":\"Mango\",\"categoryId\":14,\"variantsCount\":1}',NULL,'2026-09-12 05:31:18.618'),(62,1,'CHANGE_ORDER_STATUS','Order','5','{\"status\":\"CONFIRMED\"}','{\"status\":\"SHIPPED\"}',NULL,'2026-09-12 05:31:50.040'),(63,1,'STAFF_LOGIN','Staff','1',NULL,'{\"email\":\"admin@ayngaran.com\",\"role\":\"SUPER_ADMIN\"}','::1','2026-09-12 09:19:31.576');
/*!40000 ALTER TABLE `audit_logs` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `brands`
--

DROP TABLE IF EXISTS `brands`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `brands` (
  `id` int NOT NULL AUTO_INCREMENT,
  `brand_code` varchar(191) COLLATE utf8mb4_unicode_ci NOT NULL,
  `name` varchar(191) COLLATE utf8mb4_unicode_ci NOT NULL,
  `slug` varchar(191) COLLATE utf8mb4_unicode_ci NOT NULL,
  `description` text COLLATE utf8mb4_unicode_ci,
  `logo` varchar(191) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `is_active` tinyint(1) NOT NULL DEFAULT '1',
  `deleted_at` datetime(3) DEFAULT NULL,
  `deleted_by` int DEFAULT NULL,
  `created_at` datetime(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  `updated_at` datetime(3) NOT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `brands_brand_code_key` (`brand_code`),
  UNIQUE KEY `brands_slug_key` (`slug`)
) ENGINE=InnoDB AUTO_INCREMENT=7 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `brands`
--

LOCK TABLES `brands` WRITE;
/*!40000 ALTER TABLE `brands` DISABLE KEYS */;
INSERT INTO `brands` VALUES (6,'BRD-AYN-001','Ayngaran Foods','ayngaran-foods','Authentic traditional foods, healthy podi, natural malts, aromatic masalas, and pure herbal wellness products.',NULL,1,NULL,NULL,'2026-09-09 11:03:23.438','2026-09-09 11:03:23.438');
/*!40000 ALTER TABLE `brands` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `cart_items`
--

DROP TABLE IF EXISTS `cart_items`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `cart_items` (
  `id` int NOT NULL AUTO_INCREMENT,
  `cart_id` int NOT NULL,
  `product_id` int NOT NULL,
  `variant_id` int DEFAULT NULL,
  `quantity` int NOT NULL DEFAULT '1',
  `created_at` datetime(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  `updated_at` datetime(3) NOT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `cart_items_cart_id_product_id_variant_id_key` (`cart_id`,`product_id`,`variant_id`),
  KEY `cart_items_product_id_fkey` (`product_id`),
  KEY `cart_items_variant_id_fkey` (`variant_id`),
  CONSTRAINT `cart_items_cart_id_fkey` FOREIGN KEY (`cart_id`) REFERENCES `carts` (`id`) ON DELETE RESTRICT ON UPDATE CASCADE,
  CONSTRAINT `cart_items_product_id_fkey` FOREIGN KEY (`product_id`) REFERENCES `products` (`id`) ON DELETE RESTRICT ON UPDATE CASCADE,
  CONSTRAINT `cart_items_variant_id_fkey` FOREIGN KEY (`variant_id`) REFERENCES `product_variants` (`id`) ON DELETE SET NULL ON UPDATE CASCADE
) ENGINE=InnoDB AUTO_INCREMENT=14 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `cart_items`
--

LOCK TABLES `cart_items` WRITE;
/*!40000 ALTER TABLE `cart_items` DISABLE KEYS */;
INSERT INTO `cart_items` VALUES (11,8,5,12,1,'2026-09-11 05:51:25.081','2026-09-12 06:42:19.664');
/*!40000 ALTER TABLE `cart_items` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `carts`
--

DROP TABLE IF EXISTS `carts`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `carts` (
  `id` int NOT NULL AUTO_INCREMENT,
  `user_id` int NOT NULL,
  `created_at` datetime(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  `updated_at` datetime(3) NOT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `carts_user_id_key` (`user_id`),
  CONSTRAINT `carts_user_id_fkey` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`) ON DELETE RESTRICT ON UPDATE CASCADE
) ENGINE=InnoDB AUTO_INCREMENT=10 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `carts`
--

LOCK TABLES `carts` WRITE;
/*!40000 ALTER TABLE `carts` DISABLE KEYS */;
INSERT INTO `carts` VALUES (4,3,'2026-09-09 11:04:28.593','2026-09-09 11:04:28.593'),(5,4,'2026-09-09 11:57:31.922','2026-09-09 11:57:31.922'),(6,5,'2026-09-10 07:14:01.036','2026-09-10 07:14:01.036'),(7,6,'2026-09-10 07:16:19.414','2026-09-10 07:16:19.414'),(8,7,'2026-09-10 09:07:34.337','2026-09-10 09:07:34.337'),(9,8,'2026-09-12 05:27:07.380','2026-09-12 05:27:07.380');
/*!40000 ALTER TABLE `carts` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `categories`
--

DROP TABLE IF EXISTS `categories`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `categories` (
  `id` int NOT NULL AUTO_INCREMENT,
  `category_code` varchar(191) COLLATE utf8mb4_unicode_ci NOT NULL,
  `name` varchar(191) COLLATE utf8mb4_unicode_ci NOT NULL,
  `slug` varchar(191) COLLATE utf8mb4_unicode_ci NOT NULL,
  `description` text COLLATE utf8mb4_unicode_ci,
  `image` varchar(191) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `parent_id` int DEFAULT NULL,
  `is_active` tinyint(1) NOT NULL DEFAULT '1',
  `sort_order` int NOT NULL DEFAULT '0',
  `deleted_at` datetime(3) DEFAULT NULL,
  `deleted_by` int DEFAULT NULL,
  `created_at` datetime(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  `updated_at` datetime(3) NOT NULL,
  `gst_rate` decimal(5,2) NOT NULL DEFAULT '5.00',
  PRIMARY KEY (`id`),
  UNIQUE KEY `categories_category_code_key` (`category_code`),
  UNIQUE KEY `categories_slug_key` (`slug`),
  KEY `categories_parent_id_idx` (`parent_id`),
  CONSTRAINT `categories_parent_id_fkey` FOREIGN KEY (`parent_id`) REFERENCES `categories` (`id`) ON DELETE SET NULL ON UPDATE CASCADE
) ENGINE=InnoDB AUTO_INCREMENT=15 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `categories`
--

LOCK TABLES `categories` WRITE;
/*!40000 ALTER TABLE `categories` DISABLE KEYS */;
INSERT INTO `categories` VALUES (7,'CAT-PODI-001','Podi Varieties','podi-varieties','Traditional and nutritious South Indian podi varieties prepared with pure authentic ingredients.',NULL,NULL,1,1,NULL,NULL,'2026-09-09 11:03:23.448','2026-09-09 11:03:23.448',5.00),(8,'CAT-MALT-001','Malt Varieties','malt-varieties','Health-boosting natural malts, vitality drinks, and nutrient-dense wellness powders.',NULL,NULL,1,2,NULL,NULL,'2026-09-09 11:03:23.455','2026-09-09 11:03:23.455',5.00),(9,'CAT-POWDER-001','Powder Varieties','powder-varieties','Pure, organic, unadulterated herbal and botanical wellness powders.',NULL,NULL,1,3,NULL,NULL,'2026-09-09 11:03:23.462','2026-09-09 11:03:23.462',5.00),(10,'CAT-MASALA-001','Masala Varieties','masala-varieties','Authentic stone-ground masala blends crafted for traditional South Indian home cooking.',NULL,NULL,1,4,NULL,NULL,'2026-09-09 11:03:23.468','2026-09-09 11:03:23.468',5.00),(11,'CAT-SOUP-001','Soup Varieties','soup-varieties','Restorative herbal and botanical soup mixes for everyday health and natural immunity.',NULL,NULL,1,5,NULL,NULL,'2026-09-09 11:03:23.473','2026-09-09 11:03:23.473',5.00),(12,'CAT-OTHERS-001','Others','others','Wholesome snacks, healthy noodles, pasta, nutrient-rich muesli, and delicious chocolate treats.',NULL,NULL,1,6,NULL,NULL,'2026-09-09 11:03:23.478','2026-09-09 11:03:23.478',5.00),(13,'CAT-SKINCARE-001','Skin Care','skin-care','100% natural, chemical-free herbal personal and hair wellness care products.',NULL,NULL,1,7,NULL,NULL,'2026-09-09 11:03:23.483','2026-09-09 11:03:23.483',5.00),(14,'CAT-PICK-3726','Pickle','pickle',NULL,'http://localhost:4000/uploads/chocoblast-1789190986991-548872.jpg',NULL,1,0,NULL,NULL,'2026-09-12 05:29:48.949','2026-09-12 05:29:48.949',0.00);
/*!40000 ALTER TABLE `categories` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `category_attributes`
--

DROP TABLE IF EXISTS `category_attributes`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `category_attributes` (
  `id` int NOT NULL AUTO_INCREMENT,
  `category_id` int NOT NULL,
  `attribute_id` int NOT NULL,
  `is_required` tinyint(1) NOT NULL DEFAULT '0',
  `is_filterable` tinyint(1) NOT NULL DEFAULT '1',
  `is_variant` tinyint(1) NOT NULL DEFAULT '0',
  `sort_order` int NOT NULL DEFAULT '0',
  `deleted_at` datetime(3) DEFAULT NULL,
  `deleted_by` int DEFAULT NULL,
  `created_at` datetime(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  `updated_at` datetime(3) NOT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `category_attributes_category_id_attribute_id_key` (`category_id`,`attribute_id`),
  KEY `category_attributes_attribute_id_fkey` (`attribute_id`),
  CONSTRAINT `category_attributes_attribute_id_fkey` FOREIGN KEY (`attribute_id`) REFERENCES `attributes` (`id`) ON DELETE RESTRICT ON UPDATE CASCADE,
  CONSTRAINT `category_attributes_category_id_fkey` FOREIGN KEY (`category_id`) REFERENCES `categories` (`id`) ON DELETE RESTRICT ON UPDATE CASCADE
) ENGINE=InnoDB AUTO_INCREMENT=19 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `category_attributes`
--

LOCK TABLES `category_attributes` WRITE;
/*!40000 ALTER TABLE `category_attributes` DISABLE KEYS */;
INSERT INTO `category_attributes` VALUES (12,7,10,1,1,1,1,NULL,NULL,'2026-09-09 11:03:23.529','2026-09-09 11:03:23.529'),(13,8,10,1,1,1,1,NULL,NULL,'2026-09-09 11:03:23.535','2026-09-09 11:03:23.535'),(14,9,10,1,1,1,1,NULL,NULL,'2026-09-09 11:03:23.539','2026-09-09 11:03:23.539'),(15,10,10,1,1,1,1,NULL,NULL,'2026-09-09 11:03:23.545','2026-09-09 11:03:23.545'),(16,11,10,1,1,1,1,NULL,NULL,'2026-09-09 11:03:23.548','2026-09-09 11:03:23.548'),(17,12,10,1,1,1,1,NULL,NULL,'2026-09-09 11:03:23.552','2026-09-09 11:03:23.552'),(18,13,10,1,1,1,1,NULL,NULL,'2026-09-09 11:03:23.555','2026-09-09 11:03:23.555');
/*!40000 ALTER TABLE `category_attributes` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `contact_inquiries`
--

DROP TABLE IF EXISTS `contact_inquiries`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `contact_inquiries` (
  `id` int NOT NULL AUTO_INCREMENT,
  `name` varchar(191) COLLATE utf8mb4_unicode_ci NOT NULL,
  `email` varchar(191) COLLATE utf8mb4_unicode_ci NOT NULL,
  `phone` varchar(191) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `subject` varchar(191) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `message` text COLLATE utf8mb4_unicode_ci NOT NULL,
  `status` varchar(191) COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT 'PENDING',
  `notes` text COLLATE utf8mb4_unicode_ci,
  `created_at` datetime(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  `updated_at` datetime(3) NOT NULL,
  PRIMARY KEY (`id`),
  KEY `contact_inquiries_email_idx` (`email`),
  KEY `contact_inquiries_status_idx` (`status`),
  KEY `contact_inquiries_created_at_idx` (`created_at`)
) ENGINE=InnoDB AUTO_INCREMENT=3 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `contact_inquiries`
--

LOCK TABLES `contact_inquiries` WRITE;
/*!40000 ALTER TABLE `contact_inquiries` DISABLE KEYS */;
INSERT INTO `contact_inquiries` VALUES (1,'Sundar Raman','sundar.raman@example.com','9876543210','Bulk Order for Wedding','We are looking for 250 boxes of traditional sweets for our wedding in November. Please share customized packaging options.','PENDING',NULL,'2026-09-11 06:53:18.668','2026-09-11 06:53:18.668'),(2,'SRI HARI','srihari8489@gmail.com','9025084185','Bulk Orders & Wholesale','please arrage a meeting','PENDING',NULL,'2026-09-11 06:56:48.822','2026-09-11 07:03:43.330');
/*!40000 ALTER TABLE `contact_inquiries` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `customer_feedbacks`
--

DROP TABLE IF EXISTS `customer_feedbacks`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `customer_feedbacks` (
  `id` int NOT NULL AUTO_INCREMENT,
  `name` varchar(191) COLLATE utf8mb4_unicode_ci NOT NULL,
  `email` varchar(191) COLLATE utf8mb4_unicode_ci NOT NULL,
  `rating` int NOT NULL DEFAULT '5',
  `feedback` text COLLATE utf8mb4_unicode_ci NOT NULL,
  `status` varchar(191) COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT 'APPROVED',
  `created_at` datetime(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  `updated_at` datetime(3) NOT NULL,
  PRIMARY KEY (`id`),
  KEY `customer_feedbacks_email_idx` (`email`),
  KEY `customer_feedbacks_status_idx` (`status`),
  KEY `customer_feedbacks_created_at_idx` (`created_at`)
) ENGINE=InnoDB AUTO_INCREMENT=7 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `customer_feedbacks`
--

LOCK TABLES `customer_feedbacks` WRITE;
/*!40000 ALTER TABLE `customer_feedbacks` DISABLE KEYS */;
INSERT INTO `customer_feedbacks` VALUES (1,'Senthil Kumar','senthil.k@gmail.com',5,'Excellent service and prompt delivery. The packaging was eco-friendly and clean. Will order again.','APPROVED','2026-09-11 09:10:52.380','2026-09-11 09:10:52.380'),(2,'Meera Raghavan','meera.raghavan@yahoo.com',5,'Great initiative bringing back traditional healthy grains! U-Malt has become a part of our morning routine.','APPROVED','2026-09-11 09:10:52.400','2026-09-11 09:10:52.400'),(3,'Ananya Sundaram','ananya.s@outlook.com',5,'Pure homemade taste without any chemical preservatives. The cold-pressed oils and herbal health mixes remind me of my grandmother recipes.','APPROVED','2026-09-11 09:10:52.407','2026-09-11 09:10:52.407'),(4,'Karthik Raja','karthik.raja@gmail.com',5,'Fast shipping and authentic quality. Customer support was also very helpful when I asked about usage instructions.','APPROVED','2026-09-11 09:10:52.413','2026-09-11 09:10:52.413'),(5,'Priya Suresh','abc@gmail.com',5,'Delicious and authentic traditional products!','APPROVED','2026-09-11 09:11:27.299','2026-09-11 09:11:27.299'),(6,'SRI HARI','srihari8489@gmail.com',4,'test','REJECTED','2026-09-11 09:17:13.661','2026-09-11 09:38:35.803');
/*!40000 ALTER TABLE `customer_feedbacks` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `delivery_partners`
--

DROP TABLE IF EXISTS `delivery_partners`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `delivery_partners` (
  `id` int NOT NULL AUTO_INCREMENT,
  `partner_code` varchar(191) COLLATE utf8mb4_unicode_ci NOT NULL,
  `name` varchar(191) COLLATE utf8mb4_unicode_ci NOT NULL,
  `contact_phone` varchar(191) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `contact_email` varchar(191) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `tracking_url_template` varchar(191) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `is_active` tinyint(1) NOT NULL DEFAULT '1',
  `deleted_at` datetime(3) DEFAULT NULL,
  `deleted_by` int DEFAULT NULL,
  `created_at` datetime(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  `updated_at` datetime(3) NOT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `delivery_partners_partner_code_key` (`partner_code`)
) ENGINE=InnoDB AUTO_INCREMENT=3 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `delivery_partners`
--

LOCK TABLES `delivery_partners` WRITE;
/*!40000 ALTER TABLE `delivery_partners` DISABLE KEYS */;
INSERT INTO `delivery_partners` VALUES (1,'DEL-BLUEDART','Blue Dart Express','+91 1860 233 1234','track@bluedart.com','https://www.bluedart.com/tracking?track={tracking}',1,NULL,NULL,'2026-09-09 08:55:34.296','2026-09-09 08:55:34.296'),(2,'DEL-DELHIVERY','Delhivery Surface & Air','+91 124 6719500','support@delhivery.com','https://www.delhivery.com/track/package/{tracking}',1,NULL,NULL,'2026-09-09 08:55:34.303','2026-09-09 08:55:34.303');
/*!40000 ALTER TABLE `delivery_partners` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `inventory_transactions`
--

DROP TABLE IF EXISTS `inventory_transactions`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `inventory_transactions` (
  `id` int NOT NULL AUTO_INCREMENT,
  `product_id` int NOT NULL,
  `variant_id` int DEFAULT NULL,
  `staff_id` int DEFAULT NULL,
  `type` varchar(191) COLLATE utf8mb4_unicode_ci NOT NULL,
  `quantity_change` int NOT NULL,
  `previous_quantity` int NOT NULL,
  `new_quantity` int NOT NULL,
  `reason` varchar(191) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `created_at` datetime(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  PRIMARY KEY (`id`),
  KEY `inventory_transactions_product_id_idx` (`product_id`),
  KEY `inventory_transactions_variant_id_idx` (`variant_id`),
  KEY `inventory_transactions_created_at_idx` (`created_at`),
  KEY `inventory_transactions_staff_id_fkey` (`staff_id`),
  CONSTRAINT `inventory_transactions_product_id_fkey` FOREIGN KEY (`product_id`) REFERENCES `products` (`id`) ON DELETE RESTRICT ON UPDATE CASCADE,
  CONSTRAINT `inventory_transactions_staff_id_fkey` FOREIGN KEY (`staff_id`) REFERENCES `staff` (`id`) ON DELETE SET NULL ON UPDATE CASCADE,
  CONSTRAINT `inventory_transactions_variant_id_fkey` FOREIGN KEY (`variant_id`) REFERENCES `product_variants` (`id`) ON DELETE SET NULL ON UPDATE CASCADE
) ENGINE=InnoDB AUTO_INCREMENT=81 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `inventory_transactions`
--

LOCK TABLES `inventory_transactions` WRITE;
/*!40000 ALTER TABLE `inventory_transactions` DISABLE KEYS */;
INSERT INTO `inventory_transactions` VALUES (12,4,7,NULL,'INITIAL',50,0,50,'Initial stock intake from Ayngaran Foods Official Price List import','2026-09-09 11:03:23.581'),(13,4,8,NULL,'INITIAL',50,0,50,'Initial stock intake from Ayngaran Foods Official Price List import','2026-09-09 11:03:23.594'),(14,4,9,NULL,'INITIAL',50,0,50,'Initial stock intake from Ayngaran Foods Official Price List import','2026-09-09 11:03:23.607'),(15,4,10,NULL,'INITIAL',50,0,50,'Initial stock intake from Ayngaran Foods Official Price List import','2026-09-09 11:03:23.621'),(16,4,11,NULL,'INITIAL',50,0,50,'Initial stock intake from Ayngaran Foods Official Price List import','2026-09-09 11:03:23.634'),(17,5,12,NULL,'INITIAL',50,0,50,'Initial stock intake from Ayngaran Foods Official Price List import','2026-09-09 11:03:23.652'),(18,5,13,NULL,'INITIAL',50,0,50,'Initial stock intake from Ayngaran Foods Official Price List import','2026-09-09 11:03:23.664'),(19,5,14,NULL,'INITIAL',50,0,50,'Initial stock intake from Ayngaran Foods Official Price List import','2026-09-09 11:03:23.674'),(20,5,15,NULL,'INITIAL',50,0,50,'Initial stock intake from Ayngaran Foods Official Price List import','2026-09-09 11:03:23.685'),(21,5,16,NULL,'INITIAL',50,0,50,'Initial stock intake from Ayngaran Foods Official Price List import','2026-09-09 11:03:23.697'),(22,6,17,NULL,'INITIAL',50,0,50,'Initial stock intake from Ayngaran Foods Official Price List import','2026-09-09 11:03:23.713'),(23,6,18,NULL,'INITIAL',50,0,50,'Initial stock intake from Ayngaran Foods Official Price List import','2026-09-09 11:03:23.723'),(24,6,19,NULL,'INITIAL',50,0,50,'Initial stock intake from Ayngaran Foods Official Price List import','2026-09-09 11:03:23.735'),(25,7,20,NULL,'INITIAL',50,0,50,'Initial stock intake from Ayngaran Foods Official Price List import','2026-09-09 11:03:23.752'),(26,7,21,NULL,'INITIAL',50,0,50,'Initial stock intake from Ayngaran Foods Official Price List import','2026-09-09 11:03:23.767'),(27,7,22,NULL,'INITIAL',50,0,50,'Initial stock intake from Ayngaran Foods Official Price List import','2026-09-09 11:03:23.781'),(28,7,23,NULL,'INITIAL',50,0,50,'Initial stock intake from Ayngaran Foods Official Price List import','2026-09-09 11:03:23.793'),(29,7,24,NULL,'INITIAL',50,0,50,'Initial stock intake from Ayngaran Foods Official Price List import','2026-09-09 11:03:23.804'),(30,8,25,NULL,'INITIAL',50,0,50,'Initial stock intake from Ayngaran Foods Official Price List import','2026-09-09 11:03:23.823'),(31,8,26,NULL,'INITIAL',50,0,50,'Initial stock intake from Ayngaran Foods Official Price List import','2026-09-09 11:03:23.835'),(32,8,27,NULL,'INITIAL',50,0,50,'Initial stock intake from Ayngaran Foods Official Price List import','2026-09-09 11:03:23.846'),(33,8,28,NULL,'INITIAL',50,0,50,'Initial stock intake from Ayngaran Foods Official Price List import','2026-09-09 11:03:23.856'),(34,8,29,NULL,'INITIAL',50,0,50,'Initial stock intake from Ayngaran Foods Official Price List import','2026-09-09 11:03:23.866'),(35,9,30,NULL,'INITIAL',50,0,50,'Initial stock intake from Ayngaran Foods Official Price List import','2026-09-09 11:03:23.881'),(36,9,31,NULL,'INITIAL',50,0,50,'Initial stock intake from Ayngaran Foods Official Price List import','2026-09-09 11:03:23.891'),(37,10,32,NULL,'INITIAL',50,0,50,'Initial stock intake from Ayngaran Foods Official Price List import','2026-09-09 11:03:23.915'),(38,10,33,NULL,'INITIAL',50,0,50,'Initial stock intake from Ayngaran Foods Official Price List import','2026-09-09 11:03:23.925'),(39,10,34,NULL,'INITIAL',50,0,50,'Initial stock intake from Ayngaran Foods Official Price List import','2026-09-09 11:03:23.935'),(40,10,35,NULL,'INITIAL',50,0,50,'Initial stock intake from Ayngaran Foods Official Price List import','2026-09-09 11:03:23.947'),(41,11,36,NULL,'INITIAL',50,0,50,'Initial stock intake from Ayngaran Foods Official Price List import','2026-09-09 11:03:23.965'),(42,11,37,NULL,'INITIAL',50,0,50,'Initial stock intake from Ayngaran Foods Official Price List import','2026-09-09 11:03:23.979'),(43,11,38,NULL,'INITIAL',50,0,50,'Initial stock intake from Ayngaran Foods Official Price List import','2026-09-09 11:03:23.991'),(44,11,39,NULL,'INITIAL',50,0,50,'Initial stock intake from Ayngaran Foods Official Price List import','2026-09-09 11:03:24.005'),(45,11,40,NULL,'INITIAL',50,0,50,'Initial stock intake from Ayngaran Foods Official Price List import','2026-09-09 11:03:24.020'),(46,12,41,NULL,'INITIAL',50,0,50,'Initial stock intake from Ayngaran Foods Official Price List import','2026-09-09 11:03:24.040'),(47,13,42,NULL,'INITIAL',50,0,50,'Initial stock intake from Ayngaran Foods Official Price List import','2026-09-09 11:03:24.059'),(48,14,43,NULL,'INITIAL',50,0,50,'Initial stock intake from Ayngaran Foods Official Price List import','2026-09-09 11:03:24.079'),(49,14,44,NULL,'INITIAL',50,0,50,'Initial stock intake from Ayngaran Foods Official Price List import','2026-09-09 11:03:24.118'),(50,14,45,NULL,'INITIAL',50,0,50,'Initial stock intake from Ayngaran Foods Official Price List import','2026-09-09 11:03:24.134'),(51,14,46,NULL,'INITIAL',50,0,50,'Initial stock intake from Ayngaran Foods Official Price List import','2026-09-09 11:03:24.147'),(52,15,47,NULL,'INITIAL',50,0,50,'Initial stock intake from Ayngaran Foods Official Price List import','2026-09-09 11:03:24.165'),(53,15,48,NULL,'INITIAL',50,0,50,'Initial stock intake from Ayngaran Foods Official Price List import','2026-09-09 11:03:24.177'),(54,15,49,NULL,'INITIAL',50,0,50,'Initial stock intake from Ayngaran Foods Official Price List import','2026-09-09 11:03:24.191'),(55,16,50,NULL,'INITIAL',50,0,50,'Initial stock intake from Ayngaran Foods Official Price List import','2026-09-09 11:03:24.210'),(56,17,51,NULL,'INITIAL',50,0,50,'Initial stock intake from Ayngaran Foods Official Price List import','2026-09-09 11:03:24.232'),(57,18,52,NULL,'INITIAL',50,0,50,'Initial stock intake from Ayngaran Foods Official Price List import','2026-09-09 11:03:24.249'),(58,19,53,NULL,'INITIAL',50,0,50,'Initial stock intake from Ayngaran Foods Official Price List import','2026-09-09 11:03:24.267'),(59,20,54,NULL,'INITIAL',50,0,50,'Initial stock intake from Ayngaran Foods Official Price List import','2026-09-09 11:03:24.286'),(60,21,55,NULL,'INITIAL',50,0,50,'Initial stock intake from Ayngaran Foods Official Price List import','2026-09-09 11:03:24.306'),(61,21,56,NULL,'INITIAL',50,0,50,'Initial stock intake from Ayngaran Foods Official Price List import','2026-09-09 11:03:24.319'),(62,21,57,NULL,'INITIAL',50,0,50,'Initial stock intake from Ayngaran Foods Official Price List import','2026-09-09 11:03:24.332'),(63,22,58,NULL,'INITIAL',50,0,50,'Initial stock intake from Ayngaran Foods Official Price List import','2026-09-09 11:03:24.351'),(64,22,59,NULL,'INITIAL',50,0,50,'Initial stock intake from Ayngaran Foods Official Price List import','2026-09-09 11:03:24.365'),(65,23,60,NULL,'INITIAL',50,0,50,'Initial stock intake from Ayngaran Foods Official Price List import','2026-09-09 11:03:24.385'),(66,24,61,NULL,'INITIAL',50,0,50,'Initial stock intake from Ayngaran Foods Official Price List import','2026-09-09 11:03:24.405'),(67,25,62,NULL,'INITIAL',50,0,50,'Initial stock intake from Ayngaran Foods Official Price List import','2026-09-09 11:03:24.424'),(68,26,63,NULL,'INITIAL',50,0,50,'Initial stock intake from Ayngaran Foods Official Price List import','2026-09-09 11:03:24.445'),(69,27,64,NULL,'INITIAL',50,0,50,'Initial stock intake from Ayngaran Foods Official Price List import','2026-09-09 11:03:24.467'),(70,27,65,NULL,'INITIAL',50,0,50,'Initial stock intake from Ayngaran Foods Official Price List import','2026-09-09 11:03:24.481'),(71,8,25,NULL,'ORDER_DEDUCTION',-4,50,46,'COD Order placed #ORD-2026-685770','2026-09-09 11:59:10.213'),(72,13,42,NULL,'ORDER_DEDUCTION',-1,50,49,'COD Order placed #ORD-2026-685770','2026-09-09 11:59:10.220'),(73,15,48,NULL,'ORDER_DEDUCTION',-1,50,49,'COD Order placed #ORD-2026-685770','2026-09-09 11:59:10.225'),(74,4,7,NULL,'ORDER_DEDUCTION',-1,50,49,'Order ORD-2026-701999 confirmed','2026-09-10 06:57:20.892'),(75,8,26,NULL,'ORDER_DEDUCTION',-1,50,49,'Order ORD-2026-701999 confirmed','2026-09-10 06:57:20.919'),(76,5,14,NULL,'ORDER_DEDUCTION',-1,50,49,'Order ORD-2026-238958 confirmed','2026-09-10 07:17:48.958'),(77,8,25,NULL,'ORDER_DEDUCTION',-2,46,44,'Order ORD-2026-238958 confirmed','2026-09-10 07:17:48.966'),(78,9,30,NULL,'ORDER_DEDUCTION',-1,50,49,'COD Order placed #ORD-2026-680411','2026-09-12 05:28:28.508'),(79,13,42,NULL,'ORDER_DEDUCTION',-2,49,47,'COD Order placed #ORD-2026-680411','2026-09-12 05:28:28.532'),(80,28,66,1,'INITIAL',25,0,25,'Initial stock intake on product creation','2026-09-12 05:31:18.614');
/*!40000 ALTER TABLE `inventory_transactions` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `newsletter_subscribers`
--

DROP TABLE IF EXISTS `newsletter_subscribers`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `newsletter_subscribers` (
  `id` int NOT NULL AUTO_INCREMENT,
  `email` varchar(191) COLLATE utf8mb4_unicode_ci NOT NULL,
  `is_active` tinyint(1) NOT NULL DEFAULT '1',
  `subscribed_at` datetime(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  `created_at` datetime(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  `updated_at` datetime(3) NOT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `newsletter_subscribers_email_key` (`email`),
  KEY `newsletter_subscribers_email_idx` (`email`)
) ENGINE=InnoDB AUTO_INCREMENT=4 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `newsletter_subscribers`
--

LOCK TABLES `newsletter_subscribers` WRITE;
/*!40000 ALTER TABLE `newsletter_subscribers` DISABLE KEYS */;
INSERT INTO `newsletter_subscribers` VALUES (1,'sundar.raman@example.com',1,'2026-09-11 06:53:22.385','2026-09-11 06:53:22.385','2026-09-11 06:53:22.385'),(2,'srihari8489@gmail.com',1,'2026-09-11 06:55:36.176','2026-09-11 06:55:36.176','2026-09-11 06:55:36.176'),(3,'slash@gmaill.com',1,'2026-09-11 07:02:17.868','2026-09-11 07:02:17.868','2026-09-11 07:02:17.868');
/*!40000 ALTER TABLE `newsletter_subscribers` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `notification_logs`
--

DROP TABLE IF EXISTS `notification_logs`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `notification_logs` (
  `id` int NOT NULL AUTO_INCREMENT,
  `recipient` varchar(191) COLLATE utf8mb4_unicode_ci NOT NULL,
  `channel` varchar(191) COLLATE utf8mb4_unicode_ci NOT NULL,
  `subject` varchar(191) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `content` text COLLATE utf8mb4_unicode_ci NOT NULL,
  `status` varchar(191) COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT 'SENT',
  `created_at` datetime(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  PRIMARY KEY (`id`),
  KEY `notification_logs_recipient_idx` (`recipient`),
  KEY `notification_logs_created_at_idx` (`created_at`)
) ENGINE=InnoDB AUTO_INCREMENT=37 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `notification_logs`
--

LOCK TABLES `notification_logs` WRITE;
/*!40000 ALTER TABLE `notification_logs` DISABLE KEYS */;
INSERT INTO `notification_logs` VALUES (1,'test_buyer@ayngaran.com','EMAIL','Ayngaran Store Login Verification Code','Your Ayngaran Store verification code is: 303686. Valid for 5 minutes.','SENT','2026-09-09 08:59:11.472'),(2,'customer@ayngaran.com','EMAIL','Ayngaran Store: Order Confirmed #ORD-2026-664256','Your payment of ₹147498.82 was verified and order #ORD-2026-664256 is confirmed!','SENT','2026-09-09 09:08:58.281'),(3,'srihari8489@gmail.com','EMAIL','Ayngaran Store Login Verification Code','Your Ayngaran Store verification code is: 553012. Valid for 5 minutes.','SENT','2026-09-09 10:41:07.440'),(4,'9025084185','SMS','Ayngaran Store Login Verification Code','Your Ayngaran Store verification code is: 920343. Valid for 5 minutes.','SENT','2026-09-09 11:57:21.604'),(5,'9025084185','SMS','Ayngaran Store: COD Order Confirmed #ORD-2026-685770','Your Cash on Delivery order #ORD-2026-685770 for ₹1184.6 has been confirmed and is being packed!','SENT','2026-09-09 11:59:10.241'),(6,'9025084185','SMS','Ayngaran Store: Order Status Updated #ORD-2026-685770','Your order #ORD-2026-685770 status has been updated to: PROCESSING.','SENT','2026-09-09 12:17:37.462'),(7,'9025084185','SMS','Ayngaran Store: Order Status Updated #ORD-2026-685770','Your order #ORD-2026-685770 status has been updated to: PACKED.','SENT','2026-09-09 12:46:02.746'),(8,'9025084185','SMS','Ayngaran Store Login Verification Code','Your Ayngaran Store verification code is: 305829. Valid for 5 minutes.','SENT','2026-09-10 05:47:35.762'),(9,'srihari8484@gmail.com','EMAIL','Ayngaran Store: Order Confirmed #ORD-2026-701999','Your payment of ₹370.4 was verified and order #ORD-2026-701999 is confirmed!','SENT','2026-09-10 06:57:20.956'),(10,'srihari8484@gmail.com','EMAIL','Ayngaran Store: Order Status Updated #ORD-2026-701999','Your order #ORD-2026-701999 status has been updated to: PROCESSING.','SENT','2026-09-10 07:09:36.233'),(11,'srihari8484@gmail.com','EMAIL','Ayngaran Store: Order Status Updated #ORD-2026-701999','Your order #ORD-2026-701999 status has been updated to: PROCESSING.','SENT','2026-09-10 07:09:38.830'),(12,'+919025084185','WHATSAPP','Ayngaran Foods OTP Verification','Your Ayngaran Foods OTP is 983144. Valid for 5 minutes.','SENT','2026-09-10 07:11:04.611'),(13,'+919025048185','WHATSAPP','Ayngaran Foods OTP Verification','Your Ayngaran Foods OTP is 706438. Valid for 5 minutes.','SENT','2026-09-10 07:13:20.913'),(14,'+919789188524','WHATSAPP','Ayngaran Foods OTP Verification','Your Ayngaran Foods OTP is 525297. Valid for 5 minutes.','SENT','2026-09-10 07:15:36.398'),(15,'+919789188524','SMS','Ayngaran Store: Order Confirmed #ORD-2026-238958','Your payment of ₹618.2 was verified and order #ORD-2026-238958 is confirmed!','SENT','2026-09-10 07:17:48.984'),(16,'+919789188524','SMS','Ayngaran Store: Order Status Updated #ORD-2026-238958','Your order #ORD-2026-238958 status has been updated to: PROCESSING.','SENT','2026-09-10 07:18:57.031'),(17,'+919789188524','SMS','Ayngaran Store: Order Status Updated #ORD-2026-238958','Your order #ORD-2026-238958 status has been updated to: PACKED.','SENT','2026-09-10 07:19:10.571'),(18,'srihari8484@gmail.com','EMAIL','Ayngaran Store: Order Status Updated #ORD-2026-685770','Your order #ORD-2026-685770 status has been updated to: SHIPPED.','SENT','2026-09-10 08:57:49.521'),(19,'+918754635520','WHATSAPP','Ayngaran Foods OTP Verification','Your Ayngaran Foods OTP is 140725. Valid for 5 minutes.','SENT','2026-09-10 09:00:48.524'),(20,'+919025084185','WHATSAPP','Ayngaran Foods OTP Verification','Your Ayngaran Foods OTP is 530164. Valid for 5 minutes.','SENT','2026-09-10 09:07:15.805'),(21,'+919025084185','WHATSAPP','Ayngaran Foods OTP Verification','Your Ayngaran Foods OTP is 187775. Valid for 5 minutes.','SENT','2026-09-10 09:14:16.847'),(22,'+919025084185','WHATSAPP','Ayngaran Foods OTP Verification','Your Ayngaran Foods OTP is 429896. Valid for 5 minutes.','SENT','2026-09-10 09:42:27.848'),(23,'+919025084185','WHATSAPP','Ayngaran Foods OTP Verification','Your Ayngaran Foods OTP is 942823. Valid for 5 minutes.','SENT','2026-09-10 09:43:32.123'),(24,'+919025084185','WHATSAPP','Ayngaran Foods OTP Verification','Your Ayngaran Foods OTP is 962678. Valid for 5 minutes.','SENT','2026-09-10 10:07:35.170'),(25,'+919025084185','WHATSAPP','Ayngaran Foods OTP Verification','Your Ayngaran Foods OTP is 698859. Valid for 5 minutes.','SENT','2026-09-11 05:25:18.522'),(26,'+919789188524','SMS','Ayngaran Store: Order Status Updated #ORD-2026-238958','Your order #ORD-2026-238958 status has been updated to: DELIVERED.','SENT','2026-09-11 07:06:37.999'),(27,'srihari8484@gmail.com','EMAIL','Ayngaran Store: Order Status Updated #ORD-2026-701999','Your order #ORD-2026-701999 status has been updated to: DELIVERED.','SENT','2026-09-11 07:07:07.552'),(28,'srihari8484@gmail.com','EMAIL','Ayngaran Store: Order Status Updated #ORD-2026-685770','Your order #ORD-2026-685770 status has been updated to: DELIVERED.','SENT','2026-09-11 07:07:18.439'),(29,'+919025084185','WHATSAPP','Ayngaran Foods OTP Verification','Your Ayngaran Foods OTP is 744046. Valid for 5 minutes.','SENT','2026-09-11 10:32:13.079'),(30,'+919025084185','WHATSAPP','Ayngaran Foods OTP Verification','Your Ayngaran Foods OTP is 835371. Valid for 5 minutes.','SENT','2026-09-11 10:33:20.248'),(31,'+919025084185','WHATSAPP','Ayngaran Foods OTP Verification','Your Ayngaran Foods OTP is 976497. Valid for 5 minutes.','SENT','2026-09-11 10:36:51.038'),(32,'+919025084185','WHATSAPP','Ayngaran Foods OTP Verification','Your Ayngaran Foods OTP is 577371. Valid for 5 minutes.','SENT','2026-09-11 10:45:24.148'),(33,'+919443843615','WHATSAPP','Ayngaran Foods OTP Verification','Your Ayngaran Foods OTP is 543777. Valid for 5 minutes.','SENT','2026-09-12 05:26:42.029'),(34,'+919443843615','SMS','Ayngaran Store: COD Order Confirmed #ORD-2026-680411','Your Cash on Delivery order #ORD-2026-680411 for ₹466.5 has been confirmed and is being packed!','SENT','2026-09-12 05:28:28.556'),(35,'+919443843615','SMS','Ayngaran Store: Order Status Updated #ORD-2026-680411','Your order #ORD-2026-680411 status has been updated to: SHIPPED.','SENT','2026-09-12 05:31:50.050'),(36,'+919025084185','WHATSAPP','Ayngaran Foods OTP Verification','Your Ayngaran Foods OTP is 184474. Valid for 5 minutes.','SENT','2026-09-12 06:41:25.921');
/*!40000 ALTER TABLE `notification_logs` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `order_delivery_assignments`
--

DROP TABLE IF EXISTS `order_delivery_assignments`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `order_delivery_assignments` (
  `id` int NOT NULL AUTO_INCREMENT,
  `order_id` int NOT NULL,
  `delivery_partner_id` int NOT NULL,
  `tracking_number` varchar(191) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `assigned_at` datetime(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  `status` varchar(191) COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT 'ASSIGNED',
  `notes` text COLLATE utf8mb4_unicode_ci,
  `deleted_at` datetime(3) DEFAULT NULL,
  `deleted_by` int DEFAULT NULL,
  `created_at` datetime(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  `updated_at` datetime(3) NOT NULL,
  PRIMARY KEY (`id`),
  KEY `order_delivery_assignments_order_id_idx` (`order_id`),
  KEY `order_delivery_assignments_delivery_partner_id_idx` (`delivery_partner_id`),
  CONSTRAINT `order_delivery_assignments_delivery_partner_id_fkey` FOREIGN KEY (`delivery_partner_id`) REFERENCES `delivery_partners` (`id`) ON DELETE RESTRICT ON UPDATE CASCADE,
  CONSTRAINT `order_delivery_assignments_order_id_fkey` FOREIGN KEY (`order_id`) REFERENCES `orders` (`id`) ON DELETE RESTRICT ON UPDATE CASCADE
) ENGINE=InnoDB AUTO_INCREMENT=3 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `order_delivery_assignments`
--

LOCK TABLES `order_delivery_assignments` WRITE;
/*!40000 ALTER TABLE `order_delivery_assignments` DISABLE KEYS */;
INSERT INTO `order_delivery_assignments` VALUES (1,2,1,'TRK-BLUEDART-18931180','2026-09-09 12:46:31.305','ASSIGNED',NULL,NULL,NULL,'2026-09-09 12:46:31.305','2026-09-09 12:46:31.305'),(2,2,1,'TRK-BLUEDART-18931180','2026-09-10 08:57:37.330','ASSIGNED',NULL,NULL,NULL,'2026-09-10 08:57:37.330','2026-09-10 08:57:37.330');
/*!40000 ALTER TABLE `order_delivery_assignments` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `order_items`
--

DROP TABLE IF EXISTS `order_items`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `order_items` (
  `id` int NOT NULL AUTO_INCREMENT,
  `order_id` int NOT NULL,
  `product_id` int NOT NULL,
  `variant_id` int DEFAULT NULL,
  `quantity` int NOT NULL,
  `unit_price` decimal(10,2) NOT NULL,
  `total_price` decimal(10,2) NOT NULL,
  `product_snapshot_json` text COLLATE utf8mb4_unicode_ci NOT NULL,
  `deleted_at` datetime(3) DEFAULT NULL,
  `deleted_by` int DEFAULT NULL,
  `created_at` datetime(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  `updated_at` datetime(3) NOT NULL,
  `gst_amount` decimal(10,2) NOT NULL DEFAULT '0.00',
  `gst_rate` decimal(5,2) NOT NULL DEFAULT '0.00',
  PRIMARY KEY (`id`),
  KEY `order_items_order_id_idx` (`order_id`),
  KEY `order_items_product_id_idx` (`product_id`),
  KEY `order_items_variant_id_fkey` (`variant_id`),
  CONSTRAINT `order_items_order_id_fkey` FOREIGN KEY (`order_id`) REFERENCES `orders` (`id`) ON DELETE RESTRICT ON UPDATE CASCADE,
  CONSTRAINT `order_items_product_id_fkey` FOREIGN KEY (`product_id`) REFERENCES `products` (`id`) ON DELETE RESTRICT ON UPDATE CASCADE,
  CONSTRAINT `order_items_variant_id_fkey` FOREIGN KEY (`variant_id`) REFERENCES `product_variants` (`id`) ON DELETE SET NULL ON UPDATE CASCADE
) ENGINE=InnoDB AUTO_INCREMENT=11 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `order_items`
--

LOCK TABLES `order_items` WRITE;
/*!40000 ALTER TABLE `order_items` DISABLE KEYS */;
INSERT INTO `order_items` VALUES (2,2,8,25,4,80.00,320.00,'{\"name\":\"R-Malt\",\"productCode\":\"AYG-PRD-R-MALT\",\"brand\":\"Ayngaran Foods\",\"sku\":\"AYG-R-MALT-50G\",\"image\":\"http://localhost:4000/uploads/R-Malt-1788954925725-490507.jpg\"}',NULL,NULL,'2026-09-09 11:59:10.228','2026-09-09 11:59:10.228',0.00,0.00),(3,2,13,42,1,100.00,100.00,'{\"name\":\"Raw Karuveppillai Powder\",\"productCode\":\"AYG-PRD-RAW-KARUVEPPILLAI-POWDER\",\"brand\":\"Ayngaran Foods\",\"sku\":\"AYG-RAW-KARUVEPPILLAI-POWDER-50G\",\"image\":\"http://localhost:4000/uploads/KaruveppillaiPodi-1788954867841-15161.jpg\"}',NULL,NULL,'2026-09-09 11:59:10.228','2026-09-09 11:59:10.228',0.00,0.00),(4,2,15,48,1,500.00,500.00,'{\"name\":\"Weight Loss Powder\",\"productCode\":\"AYG-PRD-WEIGHT-LOSS-POWDER\",\"brand\":\"Ayngaran Foods\",\"sku\":\"AYG-WEIGHT-LOSS-POWDER-500G\",\"image\":\"http://localhost:4000/uploads/WeightLossPowder-1788954844610-630533.jpg\"}',NULL,NULL,'2026-09-09 11:59:10.228','2026-09-09 11:59:10.228',0.00,0.00),(5,3,4,7,1,70.00,70.00,'{\"name\":\"Moringa Podi\",\"productCode\":\"AYG-PRD-MORINGA-PODI\",\"brand\":\"Ayngaran Foods\",\"sku\":\"AYG-MORINGA-PODI-50G\",\"image\":\"http://localhost:4000/uploads/moringa_podi-1788952515958-861463.jpg\"}',NULL,NULL,'2026-09-10 06:57:09.071','2026-09-10 06:57:09.071',0.00,0.00),(6,3,8,26,1,160.00,160.00,'{\"name\":\"R-Malt\",\"productCode\":\"AYG-PRD-R-MALT\",\"brand\":\"Ayngaran Foods\",\"sku\":\"AYG-R-MALT-100G\",\"image\":\"http://localhost:4000/uploads/R-Malt-1788954925725-490507.jpg\"}',NULL,NULL,'2026-09-10 06:57:09.071','2026-09-10 06:57:09.071',0.00,0.00),(7,4,5,14,1,280.00,280.00,'{\"name\":\"Karuveppillai Podi\",\"productCode\":\"AYG-PRD-KARUVEPPILLAI-PODI\",\"brand\":\"Ayngaran Foods\",\"sku\":\"AYG-KARUVEPPILLAI-PODI-200G\",\"image\":\"http://localhost:4000/uploads/KaruveppillaiPodi-1788954816496-607838.jpg\"}',NULL,NULL,'2026-09-10 07:17:41.225','2026-09-10 07:17:41.225',0.00,0.00),(8,4,8,25,2,80.00,160.00,'{\"name\":\"R-Malt\",\"productCode\":\"AYG-PRD-R-MALT\",\"brand\":\"Ayngaran Foods\",\"sku\":\"AYG-R-MALT-50G\",\"image\":\"http://localhost:4000/uploads/R-Malt-1788954925725-490507.jpg\"}',NULL,NULL,'2026-09-10 07:17:41.225','2026-09-10 07:17:41.225',0.00,0.00),(9,5,9,30,1,150.00,150.00,'{\"name\":\"ABC Malt\",\"productCode\":\"AYG-PRD-ABC-MALT\",\"brand\":\"Ayngaran Foods\",\"sku\":\"AYG-ABC-MALT-100G\",\"variantLabel\":\"100g\",\"image\":\"http://localhost:4000/uploads/ABCMalt-1788954901259-640048.jpg\",\"gstRate\":5,\"gstAmount\":7.5,\"categoryName\":\"Malt Varieties\"}',NULL,NULL,'2026-09-12 05:28:28.538','2026-09-12 05:28:28.538',7.50,5.00),(10,5,13,42,2,100.00,200.00,'{\"name\":\"Raw Karuveppillai Powder\",\"productCode\":\"AYG-PRD-RAW-KARUVEPPILLAI-POWDER\",\"brand\":\"Ayngaran Foods\",\"sku\":\"AYG-RAW-KARUVEPPILLAI-POWDER-50G\",\"variantLabel\":\"50g\",\"image\":\"http://localhost:4000/uploads/KaruveppillaiPodi-1788954867841-15161.jpg\",\"gstRate\":5,\"gstAmount\":10,\"categoryName\":\"Powder Varieties\"}',NULL,NULL,'2026-09-12 05:28:28.538','2026-09-12 05:28:28.538',10.00,5.00);
/*!40000 ALTER TABLE `order_items` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `orders`
--

DROP TABLE IF EXISTS `orders`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `orders` (
  `id` int NOT NULL AUTO_INCREMENT,
  `order_number` varchar(191) COLLATE utf8mb4_unicode_ci NOT NULL,
  `user_id` int NOT NULL,
  `subtotal` decimal(10,2) NOT NULL,
  `discount_amount` decimal(10,2) NOT NULL DEFAULT '0.00',
  `shipping_fee` decimal(10,2) NOT NULL DEFAULT '0.00',
  `tax_amount` decimal(10,2) NOT NULL DEFAULT '0.00',
  `total_amount` decimal(10,2) NOT NULL,
  `order_status` varchar(191) COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT 'PENDING',
  `payment_status` varchar(191) COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT 'UNPAID',
  `shipping_address_json` text COLLATE utf8mb4_unicode_ci NOT NULL,
  `billing_address_json` text COLLATE utf8mb4_unicode_ci,
  `notes` text COLLATE utf8mb4_unicode_ci,
  `deleted_at` datetime(3) DEFAULT NULL,
  `deleted_by` int DEFAULT NULL,
  `created_at` datetime(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  `updated_at` datetime(3) NOT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `orders_order_number_key` (`order_number`),
  KEY `orders_user_id_idx` (`user_id`),
  KEY `orders_order_status_idx` (`order_status`),
  KEY `orders_payment_status_idx` (`payment_status`),
  KEY `orders_created_at_idx` (`created_at`),
  CONSTRAINT `orders_user_id_fkey` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`) ON DELETE RESTRICT ON UPDATE CASCADE
) ENGINE=InnoDB AUTO_INCREMENT=6 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `orders`
--

LOCK TABLES `orders` WRITE;
/*!40000 ALTER TABLE `orders` DISABLE KEYS */;
INSERT INTO `orders` VALUES (2,'ORD-2026-685770',4,920.00,0.00,99.00,165.60,1184.60,'DELIVERED','PENDING_COD','{\"id\":3,\"userId\":4,\"recipientName\":\"SRI HARI\",\"phone\":\"9025084185\",\"addressLine1\":\"test\",\"addressLine2\":null,\"city\":\"Coimbatore\",\"state\":\"Tamil Nadu\",\"pincode\":\"641004\",\"country\":\"India\",\"isDefault\":false,\"deletedAt\":null,\"deletedBy\":null,\"createdAt\":\"2026-09-09T11:59:10.179Z\",\"updatedAt\":\"2026-09-09T11:59:10.179Z\"}',NULL,NULL,NULL,NULL,'2026-09-09 11:59:10.228','2026-09-11 07:07:18.421'),(3,'ORD-2026-701999',4,230.00,0.00,99.00,41.40,370.40,'DELIVERED','PAID','{\"id\":3,\"userId\":4,\"recipientName\":\"SRI HARI\",\"phone\":\"9025084185\",\"addressLine1\":\"test\",\"addressLine2\":\"mtp\",\"city\":\"Coimbatore\",\"state\":\"Tamil Nadu\",\"pincode\":\"641004\",\"country\":\"India\",\"isDefault\":true,\"deletedAt\":null,\"deletedBy\":null,\"createdAt\":\"2026-09-09T11:59:10.179Z\",\"updatedAt\":\"2026-09-10T06:51:06.775Z\"}',NULL,NULL,NULL,NULL,'2026-09-10 06:57:09.071','2026-09-11 07:07:07.509'),(4,'ORD-2026-238958',6,440.00,0.00,99.00,79.20,618.20,'DELIVERED','PAID','{\"id\":4,\"userId\":6,\"recipientName\":\"Jeevitha\",\"phone\":\"+919789188524\",\"addressLine1\":\"test\",\"addressLine2\":\"peelamadu\",\"city\":\"Coimbatore\",\"state\":\"Tamil Nadu\",\"pincode\":\"641004\",\"country\":\"India\",\"isDefault\":true,\"deletedAt\":null,\"deletedBy\":null,\"createdAt\":\"2026-09-10T07:17:30.087Z\",\"updatedAt\":\"2026-09-10T07:17:30.087Z\"}',NULL,NULL,NULL,NULL,'2026-09-10 07:17:41.225','2026-09-11 07:06:37.972'),(5,'ORD-2026-680411',8,350.00,0.00,99.00,17.50,466.50,'SHIPPED','PENDING_COD','{\"id\":6,\"userId\":8,\"recipientName\":\"Slash\",\"phone\":\"+919443843615\",\"addressLine1\":\"CBE\",\"addressLine2\":null,\"city\":\"Coimbatore\",\"state\":\"Tamil Nadu\",\"pincode\":\"641004\",\"country\":\"India\",\"isDefault\":true,\"deletedAt\":null,\"deletedBy\":null,\"createdAt\":\"2026-09-12T05:28:00.443Z\",\"updatedAt\":\"2026-09-12T05:28:00.443Z\"}',NULL,NULL,NULL,NULL,'2026-09-12 05:28:28.538','2026-09-12 05:31:50.032');
/*!40000 ALTER TABLE `orders` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `otp_requests`
--

DROP TABLE IF EXISTS `otp_requests`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `otp_requests` (
  `id` int NOT NULL AUTO_INCREMENT,
  `identifier` varchar(191) COLLATE utf8mb4_unicode_ci NOT NULL,
  `otp_hash` varchar(191) COLLATE utf8mb4_unicode_ci NOT NULL,
  `expires_at` datetime(3) NOT NULL,
  `attempts` int NOT NULL DEFAULT '0',
  `is_verified` tinyint(1) NOT NULL DEFAULT '0',
  `created_at` datetime(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  PRIMARY KEY (`id`),
  KEY `otp_requests_identifier_expires_at_idx` (`identifier`,`expires_at`)
) ENGINE=InnoDB AUTO_INCREMENT=21 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `otp_requests`
--

LOCK TABLES `otp_requests` WRITE;
/*!40000 ALTER TABLE `otp_requests` DISABLE KEYS */;
INSERT INTO `otp_requests` VALUES (2,'srihari8489@gmail.com','84efcacef727e0b5be10372103231d05f1b4ddf9770a37fa3047746a9d8e9e01','2026-09-09 10:46:07.430',0,1,'2026-09-09 10:41:07.432'),(3,'9025084185','aae9c5436dcd4b6de585022af828ccfa4b45ab48f79ba346ed65a7087a7b108e','2026-09-09 12:02:21.589',0,1,'2026-09-09 11:57:21.596'),(4,'9025084185','dbc0192a9be515b91bd0b4eae98d61dd6f682a1318e5a576b1b7132e8f9149d3','2026-09-10 05:52:35.752',0,1,'2026-09-10 05:47:35.754'),(5,'+919025084185','983144','2026-09-10 07:16:04.599',0,0,'2026-09-10 07:11:04.601'),(6,'+919025048185','706438','2026-09-10 07:18:20.902',0,1,'2026-09-10 07:13:20.904'),(7,'+919789188524','525297','2026-09-10 07:20:36.368',0,1,'2026-09-10 07:15:36.378'),(8,'+918754635520','140725','2026-09-10 09:05:48.466',0,0,'2026-09-10 09:00:48.471'),(9,'+919025084185','530164','2026-09-10 09:12:15.782',0,1,'2026-09-10 09:07:15.796'),(10,'+919025084185','187775','2026-09-10 09:19:16.830',0,1,'2026-09-10 09:14:16.832'),(11,'+919025084185','429896','2026-09-10 09:47:27.831',0,1,'2026-09-10 09:42:27.833'),(12,'+919025084185','942823','2026-09-10 09:48:32.100',0,1,'2026-09-10 09:43:32.102'),(13,'+919025084185','962678','2026-09-10 10:12:35.154',0,0,'2026-09-10 10:07:35.163'),(14,'+919025084185','698859','2026-09-11 05:30:18.442',0,1,'2026-09-11 05:25:18.452'),(15,'+919025084185','744046','2026-09-11 10:37:13.059',0,1,'2026-09-11 10:32:13.063'),(16,'+919025084185','835371','2026-09-11 10:38:20.221',0,1,'2026-09-11 10:33:20.229'),(17,'+919025084185','976497','2026-09-11 10:41:51.025',0,1,'2026-09-11 10:36:51.027'),(18,'+919025084185','577371','2026-09-11 10:50:24.103',0,1,'2026-09-11 10:45:24.105'),(19,'+919443843615','543777','2026-09-12 05:31:41.968',0,1,'2026-09-12 05:26:41.969'),(20,'+919025084185','184474','2026-09-12 06:46:25.895',0,1,'2026-09-12 06:41:25.908');
/*!40000 ALTER TABLE `otp_requests` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `payment_gateways`
--

DROP TABLE IF EXISTS `payment_gateways`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `payment_gateways` (
  `id` int NOT NULL AUTO_INCREMENT,
  `code` varchar(191) COLLATE utf8mb4_unicode_ci NOT NULL,
  `name` varchar(191) COLLATE utf8mb4_unicode_ci NOT NULL,
  `is_enabled` tinyint(1) NOT NULL DEFAULT '0',
  `mode` varchar(191) COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT 'TEST',
  `key_id` varchar(191) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `encrypted_secret_key` text COLLATE utf8mb4_unicode_ci,
  `encrypted_webhook_secret` text COLLATE utf8mb4_unicode_ci,
  `supported_methods_json` text COLLATE utf8mb4_unicode_ci,
  `deleted_at` datetime(3) DEFAULT NULL,
  `deleted_by` int DEFAULT NULL,
  `created_at` datetime(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  `updated_at` datetime(3) NOT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `payment_gateways_code_key` (`code`)
) ENGINE=InnoDB AUTO_INCREMENT=4 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `payment_gateways`
--

LOCK TABLES `payment_gateways` WRITE;
/*!40000 ALTER TABLE `payment_gateways` DISABLE KEYS */;
INSERT INTO `payment_gateways` VALUES (1,'COD','Cash on Delivery',1,'LIVE',NULL,NULL,NULL,'[\"CASH\"]',NULL,NULL,'2026-09-09 08:55:34.276','2026-09-09 08:55:34.276'),(2,'MOCK','Instant Sandbox Gateway',1,'TEST',NULL,NULL,NULL,'[\"UPI\",\"CARD\",\"NETBANKING\"]',NULL,NULL,'2026-09-09 08:55:34.282','2026-09-09 08:55:34.282'),(3,'RAZORPAY','Razorpay Secure Checkout',1,'TEST','rzp_test_sampleKeyId123','89d84d8d5637a1e8b3d06cc7f18b513c:da57c20f3ce15162b3ccb1209961a8a3:19a296858b12a6e84a95a95950b8c27d9e329eacabd84eb2ccdd64fa9d591b','b880759cf48b586612579037a4812444:26fe7c4471dea4315dd4e4f98a12906f:fdb65b9bb2dedf397c2dc69757f542915220894c2e084cee14a740','[\"UPI\",\"CARD\",\"NETBANKING\",\"WALLET\"]',NULL,NULL,'2026-09-09 08:55:34.290','2026-09-09 08:55:34.290');
/*!40000 ALTER TABLE `payment_gateways` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `payments`
--

DROP TABLE IF EXISTS `payments`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `payments` (
  `id` int NOT NULL AUTO_INCREMENT,
  `order_id` int NOT NULL,
  `gateway_code` varchar(191) COLLATE utf8mb4_unicode_ci NOT NULL,
  `transaction_id` varchar(191) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `amount` decimal(10,2) NOT NULL,
  `currency` varchar(191) COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT 'INR',
  `status` varchar(191) COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT 'PENDING',
  `gateway_response_json` text COLLATE utf8mb4_unicode_ci,
  `verified_at` datetime(3) DEFAULT NULL,
  `created_at` datetime(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  `updated_at` datetime(3) NOT NULL,
  PRIMARY KEY (`id`),
  KEY `payments_order_id_idx` (`order_id`),
  KEY `payments_transaction_id_idx` (`transaction_id`),
  KEY `payments_status_idx` (`status`),
  CONSTRAINT `payments_order_id_fkey` FOREIGN KEY (`order_id`) REFERENCES `orders` (`id`) ON DELETE RESTRICT ON UPDATE CASCADE
) ENGINE=InnoDB AUTO_INCREMENT=4 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `payments`
--

LOCK TABLES `payments` WRITE;
/*!40000 ALTER TABLE `payments` DISABLE KEYS */;
INSERT INTO `payments` VALUES (2,3,'MOCK','pay_mock_1789023440825_3955',370.40,'INR','COMPLETED',NULL,'2026-09-10 06:57:20.908','2026-09-10 06:57:20.926','2026-09-10 06:57:20.926'),(3,4,'MOCK','pay_mock_1789024668905_5954',618.20,'INR','COMPLETED',NULL,'2026-09-10 07:17:48.967','2026-09-10 07:17:48.969','2026-09-10 07:17:48.969');
/*!40000 ALTER TABLE `payments` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `permissions`
--

DROP TABLE IF EXISTS `permissions`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `permissions` (
  `id` int NOT NULL AUTO_INCREMENT,
  `code` varchar(191) COLLATE utf8mb4_unicode_ci NOT NULL,
  `name` varchar(191) COLLATE utf8mb4_unicode_ci NOT NULL,
  `module` varchar(191) COLLATE utf8mb4_unicode_ci NOT NULL,
  `deleted_at` datetime(3) DEFAULT NULL,
  `deleted_by` int DEFAULT NULL,
  `created_at` datetime(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  `updated_at` datetime(3) NOT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `permissions_code_key` (`code`)
) ENGINE=InnoDB AUTO_INCREMENT=13 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `permissions`
--

LOCK TABLES `permissions` WRITE;
/*!40000 ALTER TABLE `permissions` DISABLE KEYS */;
INSERT INTO `permissions` VALUES (1,'PRODUCTS_MANAGE','Manage Products','Products',NULL,NULL,'2026-09-09 08:55:33.712','2026-09-09 08:55:33.712'),(2,'CATEGORIES_MANAGE','Manage Categories','Catalog',NULL,NULL,'2026-09-09 08:55:33.757','2026-09-09 08:55:33.757'),(3,'BRANDS_MANAGE','Manage Brands','Catalog',NULL,NULL,'2026-09-09 08:55:33.762','2026-09-09 08:55:33.762'),(4,'ATTRIBUTES_MANAGE','Manage Attributes','Catalog',NULL,NULL,'2026-09-09 08:55:33.766','2026-09-09 08:55:33.766'),(5,'ORDERS_MANAGE','Manage Orders','Orders',NULL,NULL,'2026-09-09 08:55:33.771','2026-09-09 08:55:33.771'),(6,'INVENTORY_MANAGE','Manage Inventory','Inventory',NULL,NULL,'2026-09-09 08:55:33.774','2026-09-09 08:55:33.774'),(7,'PAYMENTS_MANAGE','Manage Payments','Payments',NULL,NULL,'2026-09-09 08:55:33.778','2026-09-09 08:55:33.778'),(8,'DELIVERY_MANAGE','Manage Delivery','Delivery',NULL,NULL,'2026-09-09 08:55:33.782','2026-09-09 08:55:33.782'),(9,'STAFF_MANAGE','Manage Staff','Staff',NULL,NULL,'2026-09-09 08:55:33.786','2026-09-09 08:55:33.786'),(10,'REPORTS_VIEW','View Reports','Reports',NULL,NULL,'2026-09-09 08:55:33.790','2026-09-09 08:55:33.790'),(11,'REVIEWS_MODERATE','Moderate Reviews','Reviews',NULL,NULL,'2026-09-09 08:55:33.794','2026-09-09 08:55:33.794'),(12,'AUDIT_VIEW','View Audit Logs','Audit',NULL,NULL,'2026-09-09 08:55:33.797','2026-09-09 08:55:33.797');
/*!40000 ALTER TABLE `permissions` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `product_attribute_values`
--

DROP TABLE IF EXISTS `product_attribute_values`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `product_attribute_values` (
  `id` int NOT NULL AUTO_INCREMENT,
  `product_id` int NOT NULL,
  `attribute_id` int NOT NULL,
  `attribute_value_id` int DEFAULT NULL,
  `value_text` text COLLATE utf8mb4_unicode_ci,
  `value_number` decimal(10,2) DEFAULT NULL,
  `value_boolean` tinyint(1) DEFAULT NULL,
  `deleted_at` datetime(3) DEFAULT NULL,
  `deleted_by` int DEFAULT NULL,
  `created_at` datetime(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  `updated_at` datetime(3) NOT NULL,
  PRIMARY KEY (`id`),
  KEY `product_attribute_values_product_id_idx` (`product_id`),
  KEY `product_attribute_values_attribute_id_idx` (`attribute_id`),
  KEY `product_attribute_values_attribute_value_id_idx` (`attribute_value_id`),
  CONSTRAINT `product_attribute_values_attribute_id_fkey` FOREIGN KEY (`attribute_id`) REFERENCES `attributes` (`id`) ON DELETE RESTRICT ON UPDATE CASCADE,
  CONSTRAINT `product_attribute_values_attribute_value_id_fkey` FOREIGN KEY (`attribute_value_id`) REFERENCES `attribute_values` (`id`) ON DELETE SET NULL ON UPDATE CASCADE,
  CONSTRAINT `product_attribute_values_product_id_fkey` FOREIGN KEY (`product_id`) REFERENCES `products` (`id`) ON DELETE RESTRICT ON UPDATE CASCADE
) ENGINE=InnoDB AUTO_INCREMENT=34 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `product_attribute_values`
--

LOCK TABLES `product_attribute_values` WRITE;
/*!40000 ALTER TABLE `product_attribute_values` DISABLE KEYS */;
INSERT INTO `product_attribute_values` VALUES (12,26,10,24,NULL,NULL,0,NULL,NULL,'2026-09-09 11:50:52.566','2026-09-09 11:50:52.566'),(13,25,10,24,NULL,NULL,0,NULL,NULL,'2026-09-09 11:51:01.243','2026-09-09 11:51:01.243'),(14,24,10,24,NULL,NULL,0,NULL,NULL,'2026-09-09 11:51:17.069','2026-09-09 11:51:17.069'),(15,23,10,24,NULL,NULL,0,NULL,NULL,'2026-09-09 11:51:29.467','2026-09-09 11:51:29.467'),(16,22,10,24,NULL,NULL,0,NULL,NULL,'2026-09-09 11:51:40.534','2026-09-09 11:51:40.534'),(17,21,10,24,NULL,NULL,0,NULL,NULL,'2026-09-09 11:51:56.513','2026-09-09 11:51:56.513'),(18,20,10,24,NULL,NULL,0,NULL,NULL,'2026-09-09 11:52:08.806','2026-09-09 11:52:08.806'),(19,19,10,24,NULL,NULL,0,NULL,NULL,'2026-09-09 11:52:30.645','2026-09-09 11:52:30.645'),(20,18,10,24,NULL,NULL,0,NULL,NULL,'2026-09-09 11:53:11.295','2026-09-09 11:53:11.295'),(21,17,10,24,NULL,NULL,0,NULL,NULL,'2026-09-09 11:53:21.170','2026-09-09 11:53:21.170'),(22,5,10,24,NULL,NULL,0,NULL,NULL,'2026-09-09 11:53:37.368','2026-09-09 11:53:37.368'),(23,6,10,24,NULL,NULL,0,NULL,NULL,'2026-09-09 11:53:46.149','2026-09-09 11:53:46.149'),(24,16,10,24,NULL,NULL,0,NULL,NULL,'2026-09-09 11:53:57.245','2026-09-09 11:53:57.245'),(25,15,10,24,NULL,NULL,0,NULL,NULL,'2026-09-09 11:54:05.365','2026-09-09 11:54:05.365'),(26,14,10,24,NULL,NULL,0,NULL,NULL,'2026-09-09 11:54:14.173','2026-09-09 11:54:14.173'),(27,13,10,24,NULL,NULL,0,NULL,NULL,'2026-09-09 11:54:28.883','2026-09-09 11:54:28.883'),(28,12,10,24,NULL,NULL,0,NULL,NULL,'2026-09-09 11:54:50.200','2026-09-09 11:54:50.200'),(29,9,10,24,NULL,NULL,0,NULL,NULL,'2026-09-09 11:55:01.967','2026-09-09 11:55:01.967'),(30,7,10,24,NULL,NULL,0,NULL,NULL,'2026-09-09 11:55:17.379','2026-09-09 11:55:17.379'),(31,8,10,24,NULL,NULL,0,NULL,NULL,'2026-09-09 11:55:26.389','2026-09-09 11:55:26.389'),(32,10,10,24,NULL,NULL,0,NULL,NULL,'2026-09-09 11:55:34.524','2026-09-09 11:55:34.524'),(33,11,10,24,NULL,NULL,0,NULL,NULL,'2026-09-09 11:55:46.161','2026-09-09 11:55:46.161');
/*!40000 ALTER TABLE `product_attribute_values` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `product_images`
--

DROP TABLE IF EXISTS `product_images`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `product_images` (
  `id` int NOT NULL AUTO_INCREMENT,
  `product_id` int NOT NULL,
  `url` varchar(191) COLLATE utf8mb4_unicode_ci NOT NULL,
  `alt_text` varchar(191) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `is_primary` tinyint(1) NOT NULL DEFAULT '0',
  `sort_order` int NOT NULL DEFAULT '0',
  `deleted_at` datetime(3) DEFAULT NULL,
  `deleted_by` int DEFAULT NULL,
  `created_at` datetime(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  `updated_at` datetime(3) NOT NULL,
  PRIMARY KEY (`id`),
  KEY `product_images_product_id_idx` (`product_id`),
  CONSTRAINT `product_images_product_id_fkey` FOREIGN KEY (`product_id`) REFERENCES `products` (`id`) ON DELETE RESTRICT ON UPDATE CASCADE
) ENGINE=InnoDB AUTO_INCREMENT=31 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `product_images`
--

LOCK TABLES `product_images` WRITE;
/*!40000 ALTER TABLE `product_images` DISABLE KEYS */;
INSERT INTO `product_images` VALUES (6,4,'http://localhost:4000/uploads/moringa_podi-1788952515958-861463.jpg',NULL,1,0,NULL,NULL,'2026-09-09 11:15:20.723','2026-09-09 11:15:20.723'),(7,27,'http://localhost:4000/uploads/herbalhairdye-1788954413068-853061.jpg',NULL,1,0,NULL,NULL,'2026-09-09 11:50:42.935','2026-09-09 11:50:42.935'),(8,26,'http://localhost:4000/uploads/chocoblast-1788954651632-176435.jpg',NULL,1,0,NULL,NULL,'2026-09-09 11:50:52.561','2026-09-09 11:50:52.561'),(9,25,'http://localhost:4000/uploads/snacks-1788954660047-80834.jpg',NULL,1,0,NULL,NULL,'2026-09-09 11:51:01.237','2026-09-09 11:51:01.237'),(10,24,'http://localhost:4000/uploads/Museli-1788954675929-567573.jpg',NULL,1,0,NULL,NULL,'2026-09-09 11:51:17.062','2026-09-09 11:51:17.062'),(11,23,'http://localhost:4000/uploads/noodlepasta-1788954688014-373141.jpg',NULL,1,0,NULL,NULL,'2026-09-09 11:51:29.462','2026-09-09 11:51:29.462'),(12,22,'http://localhost:4000/uploads/MoringaSoupMix-1788954698668-980411.jpg',NULL,1,0,NULL,NULL,'2026-09-09 11:51:40.527','2026-09-09 11:51:40.527'),(13,21,'http://localhost:4000/uploads/MudavatukalSoupMix-1788954713717-997372.jpg',NULL,1,0,NULL,NULL,'2026-09-09 11:51:56.511','2026-09-09 11:51:56.511'),(14,20,'http://localhost:4000/uploads/KulambuMilaguPowder-1788954727248-861130.jpg',NULL,1,0,NULL,NULL,'2026-09-09 11:52:08.791','2026-09-09 11:52:08.791'),(15,19,'http://localhost:4000/uploads/CurryMasalas-1788954741633-178782.jpg',NULL,1,0,NULL,NULL,'2026-09-09 11:52:30.631','2026-09-09 11:52:30.631'),(16,18,'http://localhost:4000/uploads/AllFryMasala-1788954790203-684351.jpg',NULL,1,0,NULL,NULL,'2026-09-09 11:53:11.292','2026-09-09 11:53:11.292'),(17,17,'http://localhost:4000/uploads/RasamPowder-1788954800611-346604.jpg',NULL,1,0,NULL,NULL,'2026-09-09 11:53:21.163','2026-09-09 11:53:21.163'),(18,5,'http://localhost:4000/uploads/KaruveppillaiPodi-1788954816496-607838.jpg',NULL,1,0,NULL,NULL,'2026-09-09 11:53:37.366','2026-09-09 11:53:37.366'),(19,6,'http://localhost:4000/uploads/ParuppuPodi-1788954825270-286219.jpg',NULL,1,0,NULL,NULL,'2026-09-09 11:53:46.145','2026-09-09 11:53:46.145'),(20,16,'http://localhost:4000/uploads/SambarPowder-1788954836063-133136.jpg',NULL,1,0,NULL,NULL,'2026-09-09 11:53:57.241','2026-09-09 11:53:57.241'),(21,15,'http://localhost:4000/uploads/WeightLossPowder-1788954844610-630533.jpg',NULL,1,0,NULL,NULL,'2026-09-09 11:54:05.364','2026-09-09 11:54:05.364'),(22,14,'http://localhost:4000/uploads/GutFreePowder-1788954853104-912087.jpg',NULL,1,0,NULL,NULL,'2026-09-09 11:54:14.169','2026-09-09 11:54:14.169'),(23,13,'http://localhost:4000/uploads/KaruveppillaiPodi-1788954867841-15161.jpg',NULL,1,0,NULL,NULL,'2026-09-09 11:54:28.881','2026-09-09 11:54:28.881'),(24,12,'http://localhost:4000/uploads/moringa_podi-1788954889215-225416.jpg',NULL,1,0,NULL,NULL,'2026-09-09 11:54:50.194','2026-09-09 11:54:50.194'),(25,9,'http://localhost:4000/uploads/ABCMalt-1788954901259-640048.jpg',NULL,1,0,NULL,NULL,'2026-09-09 11:55:01.960','2026-09-09 11:55:01.960'),(26,7,'http://localhost:4000/uploads/umalt-1788954916417-337385.jpg',NULL,1,0,NULL,NULL,'2026-09-09 11:55:17.374','2026-09-09 11:55:17.374'),(27,8,'http://localhost:4000/uploads/R-Malt-1788954925725-490507.jpg',NULL,1,0,NULL,NULL,'2026-09-09 11:55:26.386','2026-09-09 11:55:26.386'),(28,10,'http://localhost:4000/uploads/DatesPowder-1788954933689-911747.jpg',NULL,1,0,NULL,NULL,'2026-09-09 11:55:34.517','2026-09-09 11:55:34.517'),(29,11,'http://localhost:4000/uploads/RawBananaPowder-1788954945191-200171.jpg',NULL,1,0,NULL,NULL,'2026-09-09 11:55:46.157','2026-09-09 11:55:46.157'),(30,28,'http://localhost:4000/uploads/chocoblast-1789191077294-16733.jpg','Mango',1,0,NULL,NULL,'2026-09-12 05:31:18.607','2026-09-12 05:31:18.607');
/*!40000 ALTER TABLE `product_images` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `product_variants`
--

DROP TABLE IF EXISTS `product_variants`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `product_variants` (
  `id` int NOT NULL AUTO_INCREMENT,
  `product_id` int NOT NULL,
  `sku` varchar(191) COLLATE utf8mb4_unicode_ci NOT NULL,
  `price` decimal(10,2) NOT NULL,
  `stock_quantity` int NOT NULL DEFAULT '0',
  `barcode` varchar(191) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `weight` decimal(8,2) DEFAULT NULL,
  `status` varchar(191) COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT 'ACTIVE',
  `deleted_at` datetime(3) DEFAULT NULL,
  `deleted_by` int DEFAULT NULL,
  `created_at` datetime(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  `updated_at` datetime(3) NOT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `product_variants_sku_key` (`sku`),
  KEY `product_variants_product_id_idx` (`product_id`),
  CONSTRAINT `product_variants_product_id_fkey` FOREIGN KEY (`product_id`) REFERENCES `products` (`id`) ON DELETE RESTRICT ON UPDATE CASCADE
) ENGINE=InnoDB AUTO_INCREMENT=67 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `product_variants`
--

LOCK TABLES `product_variants` WRITE;
/*!40000 ALTER TABLE `product_variants` DISABLE KEYS */;
INSERT INTO `product_variants` VALUES (7,4,'AYG-MORINGA-PODI-50G',70.00,49,NULL,0.05,'ACTIVE',NULL,NULL,'2026-09-09 11:03:23.569','2026-09-10 06:57:20.877'),(8,4,'AYG-MORINGA-PODI-100G',140.00,50,NULL,0.10,'ACTIVE',NULL,NULL,'2026-09-09 11:03:23.585','2026-09-09 11:03:23.585'),(9,4,'AYG-MORINGA-PODI-200G',280.00,50,NULL,0.20,'ACTIVE',NULL,NULL,'2026-09-09 11:03:23.599','2026-09-09 11:03:23.599'),(10,4,'AYG-MORINGA-PODI-500G',700.00,50,NULL,0.50,'ACTIVE',NULL,NULL,'2026-09-09 11:03:23.612','2026-09-09 11:03:23.612'),(11,4,'AYG-MORINGA-PODI-1KG',1400.00,50,NULL,1.00,'ACTIVE',NULL,NULL,'2026-09-09 11:03:23.625','2026-09-09 11:03:23.625'),(12,5,'AYG-KARUVEPPILLAI-PODI-50G',70.00,50,NULL,0.05,'ACTIVE',NULL,NULL,'2026-09-09 11:03:23.644','2026-09-09 11:53:37.371'),(13,5,'AYG-KARUVEPPILLAI-PODI-100G',140.00,50,NULL,0.10,'ACTIVE',NULL,NULL,'2026-09-09 11:03:23.656','2026-09-09 11:53:37.381'),(14,5,'AYG-KARUVEPPILLAI-PODI-200G',280.00,49,NULL,0.20,'ACTIVE',NULL,NULL,'2026-09-09 11:03:23.667','2026-09-10 07:17:48.953'),(15,5,'AYG-KARUVEPPILLAI-PODI-500G',700.00,50,NULL,0.50,'ACTIVE',NULL,NULL,'2026-09-09 11:03:23.678','2026-09-09 11:53:37.401'),(16,5,'AYG-KARUVEPPILLAI-PODI-1KG',1400.00,50,NULL,1.00,'ACTIVE',NULL,NULL,'2026-09-09 11:03:23.688','2026-09-09 11:53:37.411'),(17,6,'AYG-PARUPPU-PODI-100G',100.00,50,NULL,0.10,'ACTIVE',NULL,NULL,'2026-09-09 11:03:23.705','2026-09-09 11:53:46.152'),(18,6,'AYG-PARUPPU-PODI-200G',200.00,50,NULL,0.20,'ACTIVE',NULL,NULL,'2026-09-09 11:03:23.716','2026-09-09 11:53:46.162'),(19,6,'AYG-PARUPPU-PODI-500G',500.00,50,NULL,0.50,'ACTIVE',NULL,NULL,'2026-09-09 11:03:23.728','2026-09-09 11:53:46.167'),(20,7,'AYG-U-MALT-50G',80.00,50,NULL,0.05,'ACTIVE',NULL,NULL,'2026-09-09 11:03:23.745','2026-09-09 11:55:17.383'),(21,7,'AYG-U-MALT-100G',160.00,50,NULL,0.10,'ACTIVE',NULL,NULL,'2026-09-09 11:03:23.757','2026-09-09 11:55:17.389'),(22,7,'AYG-U-MALT-200G',320.00,50,NULL,0.20,'ACTIVE',NULL,NULL,'2026-09-09 11:03:23.771','2026-09-09 11:55:17.396'),(23,7,'AYG-U-MALT-500G',800.00,50,NULL,0.50,'ACTIVE',NULL,NULL,'2026-09-09 11:03:23.785','2026-09-09 11:55:17.401'),(24,7,'AYG-U-MALT-1KG',1600.00,50,NULL,1.00,'ACTIVE',NULL,NULL,'2026-09-09 11:03:23.797','2026-09-09 11:55:17.406'),(25,8,'AYG-R-MALT-50G',80.00,44,NULL,0.05,'ACTIVE',NULL,NULL,'2026-09-09 11:03:23.815','2026-09-10 07:17:48.964'),(26,8,'AYG-R-MALT-100G',160.00,49,NULL,0.10,'ACTIVE',NULL,NULL,'2026-09-09 11:03:23.828','2026-09-10 06:57:20.915'),(27,8,'AYG-R-MALT-200G',320.00,50,NULL,0.20,'ACTIVE',NULL,NULL,'2026-09-09 11:03:23.838','2026-09-09 11:55:26.421'),(28,8,'AYG-R-MALT-500G',800.00,50,NULL,0.50,'ACTIVE',NULL,NULL,'2026-09-09 11:03:23.849','2026-09-09 11:55:26.432'),(29,8,'AYG-R-MALT-1KG',1600.00,50,NULL,1.00,'ACTIVE',NULL,NULL,'2026-09-09 11:03:23.859','2026-09-09 11:55:26.438'),(30,9,'AYG-ABC-MALT-100G',150.00,49,NULL,0.10,'ACTIVE',NULL,NULL,'2026-09-09 11:03:23.874','2026-09-12 05:28:28.500'),(31,9,'AYG-ABC-MALT-200G',300.00,50,NULL,0.20,'ACTIVE',NULL,NULL,'2026-09-09 11:03:23.885','2026-09-09 11:55:01.982'),(32,10,'AYG-DATES-POWDER-100G',140.00,50,NULL,0.10,'ACTIVE',NULL,NULL,'2026-09-09 11:03:23.900','2026-09-09 11:55:34.531'),(33,10,'AYG-DATES-POWDER-200G',280.00,50,NULL,0.20,'ACTIVE',NULL,NULL,'2026-09-09 11:03:23.918','2026-09-09 11:55:34.544'),(34,10,'AYG-DATES-POWDER-500G',700.00,50,NULL,0.50,'ACTIVE',NULL,NULL,'2026-09-09 11:03:23.929','2026-09-09 11:55:34.549'),(35,10,'AYG-DATES-POWDER-1KG',1400.00,50,NULL,1.00,'ACTIVE',NULL,NULL,'2026-09-09 11:03:23.938','2026-09-09 11:55:34.557'),(36,11,'AYG-RAW-BANANA-POWDER-50G',80.00,50,NULL,0.05,'ACTIVE',NULL,NULL,'2026-09-09 11:03:23.956','2026-09-09 11:55:46.166'),(37,11,'AYG-RAW-BANANA-POWDER-100G',160.00,50,NULL,0.10,'ACTIVE',NULL,NULL,'2026-09-09 11:03:23.969','2026-09-09 11:55:46.171'),(38,11,'AYG-RAW-BANANA-POWDER-200G',320.00,50,NULL,0.20,'ACTIVE',NULL,NULL,'2026-09-09 11:03:23.983','2026-09-09 11:55:46.178'),(39,11,'AYG-RAW-BANANA-POWDER-500G',800.00,50,NULL,0.50,'ACTIVE',NULL,NULL,'2026-09-09 11:03:23.997','2026-09-09 11:55:46.185'),(40,11,'AYG-RAW-BANANA-POWDER-1KG',1600.00,50,NULL,1.00,'ACTIVE',NULL,NULL,'2026-09-09 11:03:24.012','2026-09-09 11:55:46.191'),(41,12,'AYG-RAW-MORINGA-POWDER-50G',100.00,50,NULL,0.05,'ACTIVE',NULL,NULL,'2026-09-09 11:03:24.031','2026-09-09 11:54:50.205'),(42,13,'AYG-RAW-KARUVEPPILLAI-POWDER-50G',100.00,47,NULL,0.05,'ACTIVE',NULL,NULL,'2026-09-09 11:03:24.051','2026-09-12 05:28:28.530'),(43,14,'AYG-GUT-FREE-POWDER-100G',140.00,50,NULL,0.10,'ACTIVE',NULL,NULL,'2026-09-09 11:03:24.069','2026-09-09 11:54:14.177'),(44,14,'AYG-GUT-FREE-POWDER-200G',280.00,50,NULL,0.20,'ACTIVE',NULL,NULL,'2026-09-09 11:03:24.084','2026-09-09 11:54:14.182'),(45,14,'AYG-GUT-FREE-POWDER-500G',700.00,50,NULL,0.50,'ACTIVE',NULL,NULL,'2026-09-09 11:03:24.123','2026-09-09 11:54:14.189'),(46,14,'AYG-GUT-FREE-POWDER-1KG',1400.00,50,NULL,1.00,'ACTIVE',NULL,NULL,'2026-09-09 11:03:24.137','2026-09-09 11:54:14.197'),(47,15,'AYG-WEIGHT-LOSS-POWDER-250G',300.00,50,NULL,0.25,'ACTIVE',NULL,NULL,'2026-09-09 11:03:24.155','2026-09-09 11:54:05.379'),(48,15,'AYG-WEIGHT-LOSS-POWDER-500G',500.00,49,NULL,0.50,'ACTIVE',NULL,NULL,'2026-09-09 11:03:24.170','2026-09-09 11:59:10.223'),(49,15,'AYG-WEIGHT-LOSS-POWDER-1KG',1000.00,50,NULL,1.00,'ACTIVE',NULL,NULL,'2026-09-09 11:03:24.182','2026-09-09 11:54:05.396'),(50,16,'AYG-SAMBAR-POWDER-100G',80.00,50,NULL,0.10,'ACTIVE',NULL,NULL,'2026-09-09 11:03:24.201','2026-09-09 11:53:57.254'),(51,17,'AYG-RASAM-POWDER-100G',90.00,50,NULL,0.10,'ACTIVE',NULL,NULL,'2026-09-09 11:03:24.221','2026-09-09 11:53:21.176'),(52,18,'AYG-ALL-FRY-MASALA-VEG-NON-VEG-100G',120.00,50,NULL,0.10,'ACTIVE',NULL,NULL,'2026-09-09 11:03:24.240','2026-09-09 11:53:11.298'),(53,19,'AYG-CURRY-MASALAS-100G',90.00,50,NULL,0.10,'ACTIVE',NULL,NULL,'2026-09-09 11:03:24.258','2026-09-09 11:52:30.649'),(54,20,'AYG-KULAMBU-MILAGU-POWDER-100G',90.00,50,NULL,0.10,'ACTIVE',NULL,NULL,'2026-09-09 11:03:24.276','2026-09-09 11:52:08.810'),(55,21,'AYG-MUDAVATUKAL-SOUP-MIX-50G',120.00,50,NULL,0.05,'ACTIVE',NULL,NULL,'2026-09-09 11:03:24.297','2026-09-09 11:51:56.517'),(56,21,'AYG-MUDAVATUKAL-SOUP-MIX-100G',220.00,50,NULL,0.10,'ACTIVE',NULL,NULL,'2026-09-09 11:03:24.310','2026-09-09 11:51:56.527'),(57,21,'AYG-MUDAVATUKAL-SOUP-MIX-200G',380.00,50,NULL,0.20,'ACTIVE',NULL,NULL,'2026-09-09 11:03:24.323','2026-09-09 11:51:56.532'),(58,22,'AYG-MORINGA-SOUP-MIX-50G',80.00,50,NULL,0.05,'ACTIVE',NULL,NULL,'2026-09-09 11:03:24.342','2026-09-09 11:51:40.538'),(59,22,'AYG-MORINGA-SOUP-MIX-100G',160.00,50,NULL,0.10,'ACTIVE',NULL,NULL,'2026-09-09 11:03:24.354','2026-09-09 11:51:40.544'),(60,23,'AYG-NOODLE-AND-PASTA-PACKET',150.00,50,NULL,0.20,'ACTIVE',NULL,NULL,'2026-09-09 11:03:24.375','2026-09-09 11:51:29.470'),(61,24,'AYG-MUSELI-PACKET',280.00,50,NULL,0.35,'ACTIVE',NULL,NULL,'2026-09-09 11:03:24.395','2026-09-09 11:51:17.074'),(62,25,'AYG-SNACKS-PACKET',150.00,50,NULL,0.20,'ACTIVE',NULL,NULL,'2026-09-09 11:03:24.416','2026-09-09 11:51:01.252'),(63,26,'AYG-CHOCO-BLAST-PACKET',200.00,50,NULL,0.20,'ACTIVE',NULL,NULL,'2026-09-09 11:03:24.436','2026-09-09 11:50:52.571'),(64,27,'AYG-HERBAL-HAIR-DYE-20G',150.00,50,NULL,0.02,'ACTIVE',NULL,NULL,'2026-09-09 11:03:24.456','2026-09-09 11:50:42.951'),(65,27,'AYG-HERBAL-HAIR-DYE-50G',320.00,50,NULL,0.05,'ACTIVE',NULL,NULL,'2026-09-09 11:03:24.471','2026-09-09 11:50:42.969'),(66,28,'PRD-MANG-1497-VAR-1',999.00,25,NULL,0.40,'ACTIVE',NULL,NULL,'2026-09-12 05:31:18.611','2026-09-12 05:31:18.611');
/*!40000 ALTER TABLE `product_variants` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `products`
--

DROP TABLE IF EXISTS `products`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `products` (
  `id` int NOT NULL AUTO_INCREMENT,
  `product_code` varchar(191) COLLATE utf8mb4_unicode_ci NOT NULL,
  `name` varchar(191) COLLATE utf8mb4_unicode_ci NOT NULL,
  `slug` varchar(191) COLLATE utf8mb4_unicode_ci NOT NULL,
  `description` text COLLATE utf8mb4_unicode_ci,
  `category_id` int NOT NULL,
  `brand_id` int NOT NULL,
  `base_price` decimal(10,2) NOT NULL,
  `status` varchar(191) COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT 'ACTIVE',
  `min_stock_alert` int NOT NULL DEFAULT '5',
  `deleted_at` datetime(3) DEFAULT NULL,
  `deleted_by` int DEFAULT NULL,
  `created_at` datetime(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  `updated_at` datetime(3) NOT NULL,
  `gst_rate` decimal(5,2) DEFAULT NULL,
  `use_category_gst` tinyint(1) NOT NULL DEFAULT '1',
  PRIMARY KEY (`id`),
  UNIQUE KEY `products_product_code_key` (`product_code`),
  UNIQUE KEY `products_slug_key` (`slug`),
  KEY `products_category_id_idx` (`category_id`),
  KEY `products_brand_id_idx` (`brand_id`),
  KEY `products_status_idx` (`status`),
  CONSTRAINT `products_brand_id_fkey` FOREIGN KEY (`brand_id`) REFERENCES `brands` (`id`) ON DELETE RESTRICT ON UPDATE CASCADE,
  CONSTRAINT `products_category_id_fkey` FOREIGN KEY (`category_id`) REFERENCES `categories` (`id`) ON DELETE RESTRICT ON UPDATE CASCADE
) ENGINE=InnoDB AUTO_INCREMENT=29 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `products`
--

LOCK TABLES `products` WRITE;
/*!40000 ALTER TABLE `products` DISABLE KEYS */;
INSERT INTO `products` VALUES (4,'AYG-PRD-MORINGA-PODI','Moringa Podi','moringa-podi','Nutrient-rich Moringa leaf podi blended with traditional spices for daily vitality and immunity.',7,6,70.00,'ACTIVE',5,NULL,NULL,'2026-09-09 11:03:23.561','2026-09-09 11:15:20.699',NULL,1),(5,'AYG-PRD-KARUVEPPILLAI-PODI','Karuveppillai Podi','karuveppillai-podi','Fragrant and iron-rich Curry Leaf (Karuveppillai) podi, excellent for hair health and digestion.',7,6,70.00,'ACTIVE',5,NULL,NULL,'2026-09-09 11:03:23.638','2026-09-09 11:53:37.356',NULL,1),(6,'AYG-PRD-PARUPPU-PODI','Paruppu Podi','paruppu-podi','Classic roasted lentil podi with aromatic spices, best served hot with rice and ghee.',7,6,100.00,'ACTIVE',5,NULL,NULL,'2026-09-09 11:03:23.701','2026-09-09 11:53:46.139',NULL,1),(7,'AYG-PRD-U-MALT','U-Malt','u-malt','Wholesome multigrain malt drink mix packed with vitamins and natural stamina boosters.',8,6,80.00,'ACTIVE',5,NULL,NULL,'2026-09-09 11:03:23.739','2026-09-09 11:55:17.370',NULL,1),(8,'AYG-PRD-R-MALT','R-Malt','r-malt','Traditional roasted ragi malt formulation rich in dietary calcium and sustained energy.',8,6,80.00,'ACTIVE',5,NULL,NULL,'2026-09-09 11:03:23.809','2026-09-09 11:55:26.380',NULL,1),(9,'AYG-PRD-ABC-MALT','ABC Malt','abc-malt','Apple, Beetroot & Carrot natural malt formula for skin glow and antioxidant wellness.',8,6,150.00,'ACTIVE',5,NULL,NULL,'2026-09-09 11:03:23.870','2026-09-09 11:55:01.939',NULL,1),(10,'AYG-PRD-DATES-POWDER','Dates Powder','dates-powder','Natural dried date sweetener powder, a wholesome and nutritious alternative to refined sugar.',9,6,140.00,'ACTIVE',5,NULL,NULL,'2026-09-09 11:03:23.896','2026-09-09 11:55:34.510',NULL,1),(11,'AYG-PRD-RAW-BANANA-POWDER','Raw Banana Powder','raw-banana-powder','Potent prebiotic green banana flour rich in resistant starch for exceptional gut digestion.',9,6,80.00,'ACTIVE',5,NULL,NULL,'2026-09-09 11:03:23.952','2026-09-09 11:55:46.153',NULL,1),(12,'AYG-PRD-RAW-MORINGA-POWDER','Raw Moringa Powder','raw-moringa-powder','100% pure shade-dried raw moringa leaves ground into a green superfood botanical powder.',9,6,100.00,'ACTIVE',5,NULL,NULL,'2026-09-09 11:03:24.025','2026-09-09 11:54:50.188',NULL,1),(13,'AYG-PRD-RAW-KARUVEPPILLAI-POWDER','Raw Karuveppillai Powder','raw-karuveppillai-powder','Pure raw dried curry leaf powder, ideal for hair root nourishment and internal detox.',9,6,100.00,'ACTIVE',5,NULL,NULL,'2026-09-09 11:03:24.047','2026-09-09 11:54:28.874',NULL,1),(14,'AYG-PRD-GUT-FREE-POWDER','Gut Free Powder','gut-free-powder','Specialized herbal blend formulated to soothe the stomach lining, relieve bloating, and aid digestion.',9,6,140.00,'ACTIVE',5,NULL,NULL,'2026-09-09 11:03:24.065','2026-09-09 11:54:14.163',NULL,1),(15,'AYG-PRD-WEIGHT-LOSS-POWDER','Weight Loss Powder','weight-loss-powder','Natural herbal wellness formulation crafted to support active metabolism and healthy weight management.',9,6,300.00,'ACTIVE',5,NULL,NULL,'2026-09-09 11:03:24.151','2026-09-09 11:54:05.351',NULL,1),(16,'AYG-PRD-SAMBAR-POWDER','Sambar Powder','sambar-powder','Aromatic traditional South Indian sambar masala ground from hand-picked lentils, coriander, and spices.',10,6,80.00,'ACTIVE',5,NULL,NULL,'2026-09-09 11:03:24.196','2026-09-09 11:53:57.236',NULL,1),(17,'AYG-PRD-RASAM-POWDER','Rasam Powder','rasam-powder','Classic zesty rasam powder infused with black pepper, cumin, and fragrant herbs.',10,6,90.00,'ACTIVE',5,NULL,NULL,'2026-09-09 11:03:24.217','2026-09-09 11:53:21.142',NULL,1),(18,'AYG-PRD-ALL-FRY-MASALA','All Fry Masala (Veg & Non-Veg)','all-fry-masala-veg-non-veg','Versatile crispy fry seasoning blend formulated for vegetables, paneer, and non-veg specialties.',10,6,120.00,'ACTIVE',5,NULL,NULL,'2026-09-09 11:03:24.236','2026-09-09 11:53:11.285',NULL,1),(19,'AYG-PRD-CURRY-MASALAS','Curry Masalas','curry-masalas','Multi-purpose traditional curry masala blend for deep, flavorful South Indian gravies and curries.',10,6,90.00,'ACTIVE',5,NULL,NULL,'2026-09-09 11:03:24.254','2026-09-09 11:52:30.622',NULL,1),(20,'AYG-PRD-KULAMBU-MILAGU-POWDER','Kulambu Milagu Powder','kulambu-milagu-powder','Spicy pepper-infused kulambu powder ideal for restorative milagu kuzhambu and medicinal gravies.',10,6,90.00,'ACTIVE',5,NULL,NULL,'2026-09-09 11:03:24.271','2026-09-09 11:52:08.787',NULL,1),(21,'AYG-PRD-MUDAVATUKAL-SOUP-MIX','Mudavatukal Soup Mix','mudavatukal-soup-mix','Traditional Mudavatukal kizhangu botanical soup mix renowned for bone strength and joint comfort.',11,6,120.00,'ACTIVE',5,NULL,NULL,'2026-09-09 11:03:24.291','2026-09-09 11:51:56.501',NULL,1),(22,'AYG-PRD-MORINGA-SOUP-MIX','Moringa Soup Mix','moringa-soup-mix','Instant nutrient-dense moringa herbal soup mix, soothing, energizing, and rich in vitamins.',11,6,80.00,'ACTIVE',5,NULL,NULL,'2026-09-09 11:03:24.337','2026-09-09 11:51:40.521',NULL,1),(23,'AYG-PRD-NOODLE-PASTA','Noodle & Pasta','noodle-and-pasta','Wholesome millet and grain noodles and pasta made without refined flour or artificial preservatives.',12,6,150.00,'ACTIVE',5,NULL,NULL,'2026-09-09 11:03:24.370','2026-09-09 11:51:29.442',NULL,1),(24,'AYG-PRD-MUSELI','Museli','museli','Healthy breakfast muesli loaded with rolled grains, nuts, and natural dried fruits.',12,6,280.00,'ACTIVE',5,NULL,NULL,'2026-09-09 11:03:24.389','2026-09-09 11:51:17.040',NULL,1),(25,'AYG-PRD-SNACKS','Snacks','snacks','Traditional and nutritious crunchy snacks prepared using natural cold-pressed oil and wholesome grains.',12,6,150.00,'ACTIVE',5,NULL,NULL,'2026-09-09 11:03:24.410','2026-09-09 11:51:01.223',NULL,1),(26,'AYG-PRD-CHOCO-BLAST','Choco Blast','choco-blast','Delicious chocolate energy crunch bites crafted with wholesome natural ingredients.',12,6,200.00,'ACTIVE',5,NULL,NULL,'2026-09-09 11:03:24.431','2026-09-09 11:50:52.554',NULL,1),(27,'AYG-PRD-HERBAL-HAIR-DYE','Herbal Hair Dye','herbal-hair-dye','100% natural, ammonia-free herbal hair dye formulation crafted from indigo, henna, and botanical herbs.',13,6,150.00,'ACTIVE',5,NULL,NULL,'2026-09-09 11:03:24.451','2026-09-09 11:50:42.905',NULL,1),(28,'PRD-MANG-1497','Mango','mango',NULL,14,6,500.00,'ACTIVE',5,NULL,NULL,'2026-09-12 05:31:18.601','2026-09-12 05:31:18.601',NULL,1);
/*!40000 ALTER TABLE `products` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `reviews`
--

DROP TABLE IF EXISTS `reviews`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `reviews` (
  `id` int NOT NULL AUTO_INCREMENT,
  `user_id` int NOT NULL,
  `product_id` int NOT NULL,
  `order_id` int NOT NULL,
  `rating` int NOT NULL,
  `title` varchar(191) COLLATE utf8mb4_unicode_ci NOT NULL,
  `comment` text COLLATE utf8mb4_unicode_ci NOT NULL,
  `status` varchar(191) COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT 'PENDING',
  `deleted_at` datetime(3) DEFAULT NULL,
  `deleted_by` int DEFAULT NULL,
  `created_at` datetime(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  `updated_at` datetime(3) NOT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `reviews_user_id_order_id_product_id_key` (`user_id`,`order_id`,`product_id`),
  KEY `reviews_product_id_status_idx` (`product_id`,`status`),
  KEY `reviews_order_id_fkey` (`order_id`),
  CONSTRAINT `reviews_order_id_fkey` FOREIGN KEY (`order_id`) REFERENCES `orders` (`id`) ON DELETE RESTRICT ON UPDATE CASCADE,
  CONSTRAINT `reviews_product_id_fkey` FOREIGN KEY (`product_id`) REFERENCES `products` (`id`) ON DELETE RESTRICT ON UPDATE CASCADE,
  CONSTRAINT `reviews_user_id_fkey` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`) ON DELETE RESTRICT ON UPDATE CASCADE
) ENGINE=InnoDB AUTO_INCREMENT=4 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `reviews`
--

LOCK TABLES `reviews` WRITE;
/*!40000 ALTER TABLE `reviews` DISABLE KEYS */;
INSERT INTO `reviews` VALUES (2,7,6,4,4,'test','test','APPROVED',NULL,NULL,'2026-09-10 09:44:03.041','2026-09-10 09:44:03.041'),(3,7,5,4,3,'test','test hari','APPROVED',NULL,NULL,'2026-09-11 05:26:37.969','2026-09-11 05:26:37.969');
/*!40000 ALTER TABLE `reviews` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `role_permissions`
--

DROP TABLE IF EXISTS `role_permissions`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `role_permissions` (
  `id` int NOT NULL AUTO_INCREMENT,
  `role_id` int NOT NULL,
  `permission_id` int NOT NULL,
  `deleted_at` datetime(3) DEFAULT NULL,
  `deleted_by` int DEFAULT NULL,
  `created_at` datetime(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  `updated_at` datetime(3) NOT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `role_permissions_role_id_permission_id_key` (`role_id`,`permission_id`),
  KEY `role_permissions_permission_id_fkey` (`permission_id`),
  CONSTRAINT `role_permissions_permission_id_fkey` FOREIGN KEY (`permission_id`) REFERENCES `permissions` (`id`) ON DELETE RESTRICT ON UPDATE CASCADE,
  CONSTRAINT `role_permissions_role_id_fkey` FOREIGN KEY (`role_id`) REFERENCES `roles` (`id`) ON DELETE RESTRICT ON UPDATE CASCADE
) ENGINE=InnoDB AUTO_INCREMENT=13 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `role_permissions`
--

LOCK TABLES `role_permissions` WRITE;
/*!40000 ALTER TABLE `role_permissions` DISABLE KEYS */;
INSERT INTO `role_permissions` VALUES (1,1,1,NULL,NULL,'2026-09-09 08:55:33.821','2026-09-09 08:55:33.821'),(2,1,2,NULL,NULL,'2026-09-09 08:55:33.828','2026-09-09 08:55:33.828'),(3,1,3,NULL,NULL,'2026-09-09 08:55:33.832','2026-09-09 08:55:33.832'),(4,1,4,NULL,NULL,'2026-09-09 08:55:33.836','2026-09-09 08:55:33.836'),(5,1,5,NULL,NULL,'2026-09-09 08:55:33.840','2026-09-09 08:55:33.840'),(6,1,6,NULL,NULL,'2026-09-09 08:55:33.844','2026-09-09 08:55:33.844'),(7,1,7,NULL,NULL,'2026-09-09 08:55:33.847','2026-09-09 08:55:33.847'),(8,1,8,NULL,NULL,'2026-09-09 08:55:33.851','2026-09-09 08:55:33.851'),(9,1,9,NULL,NULL,'2026-09-09 08:55:33.855','2026-09-09 08:55:33.855'),(10,1,10,NULL,NULL,'2026-09-09 08:55:33.858','2026-09-09 08:55:33.858'),(11,1,11,NULL,NULL,'2026-09-09 08:55:33.862','2026-09-09 08:55:33.862'),(12,1,12,NULL,NULL,'2026-09-09 08:55:33.866','2026-09-09 08:55:33.866');
/*!40000 ALTER TABLE `role_permissions` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `roles`
--

DROP TABLE IF EXISTS `roles`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `roles` (
  `id` int NOT NULL AUTO_INCREMENT,
  `name` varchar(191) COLLATE utf8mb4_unicode_ci NOT NULL,
  `description` varchar(191) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `deleted_at` datetime(3) DEFAULT NULL,
  `deleted_by` int DEFAULT NULL,
  `created_at` datetime(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  `updated_at` datetime(3) NOT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `roles_name_key` (`name`)
) ENGINE=InnoDB AUTO_INCREMENT=5 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `roles`
--

LOCK TABLES `roles` WRITE;
/*!40000 ALTER TABLE `roles` DISABLE KEYS */;
INSERT INTO `roles` VALUES (1,'SUPER_ADMIN','Full unrestricted system access across all modules',NULL,NULL,'2026-09-09 08:55:33.802','2026-09-09 08:55:33.802'),(2,'ADMIN','Operations administrator with catalog, orders, and inventory access',NULL,NULL,'2026-09-09 08:55:33.807','2026-09-09 08:55:33.807'),(3,'PRODUCT_MANAGER','Manages catalog, categories, attributes, and products',NULL,NULL,'2026-09-09 08:55:33.812','2026-09-09 08:55:33.812'),(4,'ORDER_MANAGER','Manages order processing, status, and delivery assignments',NULL,NULL,'2026-09-09 08:55:33.817','2026-09-09 08:55:33.817');
/*!40000 ALTER TABLE `roles` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `staff`
--

DROP TABLE IF EXISTS `staff`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `staff` (
  `id` int NOT NULL AUTO_INCREMENT,
  `staff_code` varchar(191) COLLATE utf8mb4_unicode_ci NOT NULL,
  `name` varchar(191) COLLATE utf8mb4_unicode_ci NOT NULL,
  `email` varchar(191) COLLATE utf8mb4_unicode_ci NOT NULL,
  `phone` varchar(191) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `password_hash` varchar(191) COLLATE utf8mb4_unicode_ci NOT NULL,
  `role_id` int NOT NULL,
  `is_active` tinyint(1) NOT NULL DEFAULT '1',
  `deleted_at` datetime(3) DEFAULT NULL,
  `deleted_by` int DEFAULT NULL,
  `created_at` datetime(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  `updated_at` datetime(3) NOT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `staff_staff_code_key` (`staff_code`),
  UNIQUE KEY `staff_email_key` (`email`),
  KEY `staff_role_id_fkey` (`role_id`),
  CONSTRAINT `staff_role_id_fkey` FOREIGN KEY (`role_id`) REFERENCES `roles` (`id`) ON DELETE RESTRICT ON UPDATE CASCADE
) ENGINE=InnoDB AUTO_INCREMENT=2 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `staff`
--

LOCK TABLES `staff` WRITE;
/*!40000 ALTER TABLE `staff` DISABLE KEYS */;
INSERT INTO `staff` VALUES (1,'STF-001','Srihari (Super Admin)','admin@ayngaran.com','+91 9876543210','$2a$10$cveT61npLl7CalU9RKjtxOZpWJcwbPWs.GI569sLpSivW8ZBT1oQ6',1,1,NULL,NULL,'2026-09-09 08:55:33.960','2026-09-09 08:55:33.960');
/*!40000 ALTER TABLE `staff` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `user_addresses`
--

DROP TABLE IF EXISTS `user_addresses`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `user_addresses` (
  `id` int NOT NULL AUTO_INCREMENT,
  `user_id` int NOT NULL,
  `recipient_name` varchar(191) COLLATE utf8mb4_unicode_ci NOT NULL,
  `phone` varchar(191) COLLATE utf8mb4_unicode_ci NOT NULL,
  `address_line1` varchar(191) COLLATE utf8mb4_unicode_ci NOT NULL,
  `address_line2` varchar(191) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `city` varchar(191) COLLATE utf8mb4_unicode_ci NOT NULL,
  `state` varchar(191) COLLATE utf8mb4_unicode_ci NOT NULL,
  `pincode` varchar(191) COLLATE utf8mb4_unicode_ci NOT NULL,
  `country` varchar(191) COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT 'India',
  `is_default` tinyint(1) NOT NULL DEFAULT '0',
  `deleted_at` datetime(3) DEFAULT NULL,
  `deleted_by` int DEFAULT NULL,
  `created_at` datetime(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  `updated_at` datetime(3) NOT NULL,
  PRIMARY KEY (`id`),
  KEY `user_addresses_user_id_idx` (`user_id`),
  KEY `user_addresses_state_city_idx` (`state`,`city`),
  CONSTRAINT `user_addresses_user_id_fkey` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`) ON DELETE RESTRICT ON UPDATE CASCADE
) ENGINE=InnoDB AUTO_INCREMENT=7 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `user_addresses`
--

LOCK TABLES `user_addresses` WRITE;
/*!40000 ALTER TABLE `user_addresses` DISABLE KEYS */;
INSERT INTO `user_addresses` VALUES (1,1,'Karthik Raja','9876543210','42, Avinashi Road, Peelamedu',NULL,'Coimbatore','Tamil Nadu','641004','India',1,NULL,NULL,'2026-09-09 08:55:33.975','2026-09-09 08:55:33.975'),(2,1,'Karthik Raja (Office)','9876543210','Tower B, TIDEL Park',NULL,'Coimbatore','Tamil Nadu','641014','India',0,NULL,NULL,'2026-09-09 08:55:33.975','2026-09-09 08:55:33.975'),(3,4,'SRI HARI','9025084185','test','mtp','Coimbatore','Tamil Nadu','641004','India',1,NULL,NULL,'2026-09-09 11:59:10.179','2026-09-10 06:51:06.775'),(4,6,'Jeevitha','+919789188524','test','peelamadu','Coimbatore','Tamil Nadu','641004','India',1,NULL,NULL,'2026-09-10 07:17:30.087','2026-09-10 07:17:30.087'),(5,7,'Hari','9025084185','test 1 address line 1','test 2 address line 2','MTP','TN','641301','India',1,NULL,NULL,'2026-09-11 05:56:02.418','2026-09-11 05:56:02.418'),(6,8,'Slash','+919443843615','CBE',NULL,'Coimbatore','Tamil Nadu','641004','India',1,NULL,NULL,'2026-09-12 05:28:00.443','2026-09-12 05:28:00.443');
/*!40000 ALTER TABLE `user_addresses` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `users`
--

DROP TABLE IF EXISTS `users`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `users` (
  `id` int NOT NULL AUTO_INCREMENT,
  `user_code` varchar(191) COLLATE utf8mb4_unicode_ci NOT NULL,
  `name` varchar(191) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `email` varchar(191) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `phone` varchar(191) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `is_active` tinyint(1) NOT NULL DEFAULT '1',
  `deleted_at` datetime(3) DEFAULT NULL,
  `deleted_by` int DEFAULT NULL,
  `created_at` datetime(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  `updated_at` datetime(3) NOT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `users_user_code_key` (`user_code`),
  UNIQUE KEY `users_email_key` (`email`),
  UNIQUE KEY `users_phone_key` (`phone`)
) ENGINE=InnoDB AUTO_INCREMENT=9 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `users`
--

LOCK TABLES `users` WRITE;
/*!40000 ALTER TABLE `users` DISABLE KEYS */;
INSERT INTO `users` VALUES (1,'USR-001','Karthik Raja','customer@ayngaran.com','9876543210',1,NULL,NULL,'2026-09-09 08:55:33.968','2026-09-09 08:55:33.968'),(3,'USR-MTTZ1LHL','srihari8489','srihari8489@gmail.com',NULL,1,NULL,NULL,'2026-09-09 10:44:38.028','2026-09-09 10:44:38.028'),(4,'USR-MTU1NCEJ','Hari','srihari8484@gmail.com','9025084185',1,NULL,NULL,'2026-09-09 11:57:31.922','2026-09-10 06:50:20.335'),(5,'USR-MTV6YLE2','Customer 8185',NULL,'+919025048185',1,NULL,NULL,'2026-09-10 07:14:01.036','2026-09-10 07:14:01.036'),(6,'USR-MTV71K5N','Jeevitha',NULL,'+919789188524',1,NULL,NULL,'2026-09-10 07:16:19.414','2026-09-10 07:16:38.033'),(7,'USR-MTVB0MK3','hari',NULL,'+919025084185',1,NULL,NULL,'2026-09-10 09:07:34.337','2026-09-12 06:41:58.688'),(8,'USR-MTXY0TX1','Customer 3615',NULL,'+919443843615',1,NULL,NULL,'2026-09-12 05:27:07.380','2026-09-12 05:27:07.380');
/*!40000 ALTER TABLE `users` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `variant_attribute_values`
--

DROP TABLE IF EXISTS `variant_attribute_values`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `variant_attribute_values` (
  `id` int NOT NULL AUTO_INCREMENT,
  `variant_id` int NOT NULL,
  `attribute_id` int NOT NULL,
  `attribute_value_id` int NOT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `variant_attribute_values_variant_id_attribute_id_key` (`variant_id`,`attribute_id`),
  KEY `variant_attribute_values_attribute_id_fkey` (`attribute_id`),
  KEY `variant_attribute_values_attribute_value_id_fkey` (`attribute_value_id`),
  CONSTRAINT `variant_attribute_values_attribute_id_fkey` FOREIGN KEY (`attribute_id`) REFERENCES `attributes` (`id`) ON DELETE RESTRICT ON UPDATE CASCADE,
  CONSTRAINT `variant_attribute_values_attribute_value_id_fkey` FOREIGN KEY (`attribute_value_id`) REFERENCES `attribute_values` (`id`) ON DELETE RESTRICT ON UPDATE CASCADE,
  CONSTRAINT `variant_attribute_values_variant_id_fkey` FOREIGN KEY (`variant_id`) REFERENCES `product_variants` (`id`) ON DELETE RESTRICT ON UPDATE CASCADE
) ENGINE=InnoDB AUTO_INCREMENT=124 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `variant_attribute_values`
--

LOCK TABLES `variant_attribute_values` WRITE;
/*!40000 ALTER TABLE `variant_attribute_values` DISABLE KEYS */;
INSERT INTO `variant_attribute_values` VALUES (11,7,10,25),(12,8,10,26),(13,9,10,27),(14,10,10,29),(15,11,10,30),(70,64,10,24),(71,65,10,25),(72,63,10,31),(73,62,10,31),(74,61,10,31),(75,60,10,31),(76,58,10,25),(77,59,10,26),(78,55,10,25),(79,56,10,26),(80,57,10,27),(81,54,10,26),(82,53,10,26),(83,52,10,26),(84,51,10,26),(85,12,10,25),(86,13,10,26),(87,14,10,27),(88,15,10,29),(89,16,10,30),(90,17,10,26),(91,18,10,27),(92,19,10,29),(93,50,10,26),(94,47,10,28),(95,48,10,29),(96,49,10,30),(97,43,10,26),(98,44,10,27),(99,45,10,29),(100,46,10,30),(101,42,10,25),(102,41,10,25),(103,30,10,26),(104,31,10,27),(105,20,10,25),(106,21,10,26),(107,22,10,27),(108,23,10,29),(109,24,10,30),(110,25,10,25),(111,26,10,26),(112,27,10,27),(113,28,10,29),(114,29,10,30),(115,32,10,26),(116,33,10,27),(117,34,10,29),(118,35,10,30),(119,36,10,25),(120,37,10,26),(121,38,10,27),(122,39,10,29),(123,40,10,30);
/*!40000 ALTER TABLE `variant_attribute_values` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `wishlist_items`
--

DROP TABLE IF EXISTS `wishlist_items`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `wishlist_items` (
  `id` int NOT NULL AUTO_INCREMENT,
  `user_id` int NOT NULL,
  `product_id` int NOT NULL,
  `created_at` datetime(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  PRIMARY KEY (`id`),
  UNIQUE KEY `wishlist_items_user_id_product_id_key` (`user_id`,`product_id`),
  KEY `wishlist_items_user_id_idx` (`user_id`),
  KEY `wishlist_items_product_id_idx` (`product_id`),
  CONSTRAINT `wishlist_items_product_id_fkey` FOREIGN KEY (`product_id`) REFERENCES `products` (`id`) ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT `wishlist_items_user_id_fkey` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`) ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE=InnoDB AUTO_INCREMENT=4 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `wishlist_items`
--

LOCK TABLES `wishlist_items` WRITE;
/*!40000 ALTER TABLE `wishlist_items` DISABLE KEYS */;
INSERT INTO `wishlist_items` VALUES (3,7,22,'2026-09-11 10:31:52.272');
/*!40000 ALTER TABLE `wishlist_items` ENABLE KEYS */;
UNLOCK TABLES;
/*!40103 SET TIME_ZONE=@OLD_TIME_ZONE */;

/*!40101 SET SQL_MODE=@OLD_SQL_MODE */;
/*!40014 SET FOREIGN_KEY_CHECKS=@OLD_FOREIGN_KEY_CHECKS */;
/*!40014 SET UNIQUE_CHECKS=@OLD_UNIQUE_CHECKS */;
/*!40101 SET CHARACTER_SET_CLIENT=@OLD_CHARACTER_SET_CLIENT */;
/*!40101 SET CHARACTER_SET_RESULTS=@OLD_CHARACTER_SET_RESULTS */;
/*!40101 SET COLLATION_CONNECTION=@OLD_COLLATION_CONNECTION */;
/*!40111 SET SQL_NOTES=@OLD_SQL_NOTES */;

-- Dump completed on 2026-09-24 17:45:19
