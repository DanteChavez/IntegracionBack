-- MySQL dump 10.13  Distrib 8.4.5, for Win64 (x86_64)
--
-- Host: localhost    Database: titec
-- ------------------------------------------------------
-- Server version	8.4.5

CREATE DATABASE IF NOT EXISTS `titec` CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci;
USE `titec`;

/*!40101 SET @OLD_CHARACTER_SET_CLIENT=@@CHARACTER_SET_CLIENT */;
/*!40101 SET @OLD_CHARACTER_SET_RESULTS=@@CHARACTER_SET_RESULTS */;
/*!40101 SET @OLD_COLLATION_CONNECTION=@@COLLATION_CONNECTION */;
/*!50503 SET NAMES utf8mb4 */;
/*!40103 SET @OLD_TIME_ZONE=@@TIME_ZONE */;
/*!40103 SET TIME_ZONE='+00:00' */;
/*!40014 SET @OLD_UNIQUE_CHECKS=@@UNIQUE_CHECKS, UNIQUE_CHECKS=0 */;
/*!40014 SET @OLD_FOREIGN_KEY_CHECKS=@@FOREIGN_KEY_CHECKS, FOREIGN_KEY_CHECKS=0 */;
/*!40101 SET @OLD_SQL_MODE=@@SQL_MODE, SQL_MODE='NO_AUTO_VALUE_ON_ZERO' */;
/*!40111 SET @OLD_SQL_NOTES=@@SQL_NOTES, SQL_NOTES=0 */;

--
-- Table structure for table `pagos`
--

DROP TABLE IF EXISTS `pagos`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `pagos` (
  `id_pagos` int NOT NULL AUTO_INCREMENT,
  `id_usuario` varchar(45) NOT NULL,
  `id_carrito` varchar(45) NOT NULL,
  `monto` decimal(10,2) NOT NULL COMMENT '8 enteros, 2 decimales',
  `tipo_moneda` varchar(3) NOT NULL DEFAULT 'CLP' COMMENT 'ej: CLP, USD',
  `estado` enum('PENDING','PROCESSING','COMPLETED','FAILED','CANCELLED','REFUNDED','PARTIALLY_REFUNDED') NOT NULL,
  `fecha_creacion` datetime NOT NULL,
  `proveedor` enum('stripe','paypal','webpay') DEFAULT NULL,
  `id_transaccion_proveedor` varchar(255) DEFAULT NULL,
  `ultimos_cuatro_digitos` varchar(4) DEFAULT NULL,
  `nombre_titular` varchar(255) DEFAULT NULL,
  `descripcion` text,
  `id_pago_stripe` varchar(255) DEFAULT NULL COMMENT 'Para hacer reembolsos',
  `id_pago_contabilidad_stripe` varchar(255) DEFAULT NULL,
  `id_pago_paypal` varchar(255) DEFAULT NULL COMMENT 'Para hacer reembolsos',
  `fecha_reembolso` datetime DEFAULT NULL,
  `razon_reembolso` varchar(500) DEFAULT NULL,
  `monto_reembolsado` decimal(10,2) DEFAULT NULL,
  `fecha_actualizacion` datetime DEFAULT NULL,
  PRIMARY KEY (`id_pagos`),
  UNIQUE KEY `uk_pedido_usuario_carrito` (`id_usuario`,`id_carrito`),
  KEY `idx_id_usuario` (`id_usuario`),
  KEY `idx_estado` (`estado`),
  KEY `idx_fecha_creacion` (`fecha_creacion`)
) ENGINE=InnoDB AUTO_INCREMENT=41 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `pagos`
--

LOCK TABLES `pagos` WRITE;
/*!40000 ALTER TABLE `pagos` DISABLE KEYS */;
INSERT INTO `pagos` VALUES (1,'user_123','cart_001',291502.00,'CLP','COMPLETED','2025-11-03 16:43:40','paypal','mock_pay_1762188219929_czdwv9z',NULL,NULL,'Pago pay_1762188219929_czdwv9z',NULL,NULL,NULL,NULL,NULL,NULL,'2025-11-03 13:43:40'),(3,'user_123','cart_002',291502.00,'CLP','COMPLETED','2025-11-03 16:47:00','webpay','mock_pay_1762188420047_rwtrusy',NULL,NULL,'Pago pay_1762188420047_rwtrusy',NULL,NULL,NULL,NULL,NULL,NULL,'2025-11-03 13:47:00'),(5,'user_123','cart_003',291502.00,'CLP','COMPLETED','2025-11-03 16:58:34','webpay','mock_pay_1762189114430_qzaodk2',NULL,NULL,'Pago pay_1762189114430_qzaodk2',NULL,NULL,NULL,NULL,NULL,NULL,'2025-11-03 13:58:34'),(6,'user_123','cart_004',291502.00,'CLP','COMPLETED','2025-11-03 17:06:20','webpay','mock_pay_1762189579622_78hf5hi',NULL,NULL,'Pago pay_1762189579622_78hf5hi',NULL,NULL,NULL,NULL,NULL,NULL,'2025-11-03 14:06:19'),(8,'user_123','cart_005',291502.00,'CLP','COMPLETED','2025-11-03 17:11:07','stripe','mock_pay_1762189867207_omngddp',NULL,NULL,'Pago pay_1762189867207_omngddp',NULL,NULL,NULL,NULL,NULL,NULL,'2025-11-03 14:11:07'),(9,'user_123','cart_006',291502.00,'CLP','COMPLETED','2025-11-03 17:18:08','stripe','mock_pay_1762190287719_3tffvoi',NULL,NULL,'Pago pay_1762190287719_3tffvoi',NULL,NULL,NULL,NULL,NULL,NULL,'2025-11-03 14:18:07'),(10,'user_123','cart_007',291502.00,'CLP','COMPLETED','2025-11-03 17:22:57','stripe','mock_pay_1762190576916_kycziyu',NULL,NULL,'Pago pay_1762190576916_kycziyu',NULL,NULL,NULL,NULL,NULL,NULL,'2025-11-03 14:22:57'),(11,'user_123','cart_008',291502.00,'CLP','COMPLETED','2025-11-03 17:28:34','stripe','mock_pay_1762190913648_l321gb1',NULL,NULL,'Pago pay_1762190913648_l321gb1',NULL,NULL,NULL,NULL,NULL,NULL,'2025-11-03 14:28:33'),(12,'user_123','cart_009',291502.00,'CLP','COMPLETED','2025-11-03 17:31:47','stripe','mock_pay_1762191107060_7foedwk',NULL,NULL,'Pago pay_1762191107060_7foedwk',NULL,NULL,NULL,NULL,NULL,NULL,'2025-11-03 14:31:47'),(13,'user_123','cart_010',291502.00,'CLP','COMPLETED','2025-11-03 17:34:04','stripe','mock_pay_1762191244018_lgs168e',NULL,NULL,'Pago pay_1762191244018_lgs168e',NULL,NULL,NULL,NULL,NULL,NULL,'2025-11-03 14:34:04');
/*!40000 ALTER TABLE `pagos` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `historial_de_errores`
--

DROP TABLE IF EXISTS `historial_de_errores`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `historial_de_errores` (
  `id_historial_de_errores` int NOT NULL AUTO_INCREMENT,
  `id_pagos` int NOT NULL,
  `fecha` datetime NOT NULL,
  `codigo` varchar(50) NOT NULL,
  `mensaje` text NOT NULL,
  `proveedor` enum('stripe','paypal','webpay') NOT NULL,
  `otro` json DEFAULT NULL,
  PRIMARY KEY (`id_historial_de_errores`),
  KEY `idx_id_pagos` (`id_pagos`),
  KEY `idx_fecha` (`fecha`),
  KEY `idx_proveedor` (`proveedor`),
  CONSTRAINT `fk_historial_pagos` FOREIGN KEY (`id_pagos`) REFERENCES `pagos` (`id_pagos`) ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE=InnoDB AUTO_INCREMENT=5 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `historial_de_errores`
--

LOCK TABLES `historial_de_errores` WRITE;
/*!40000 ALTER TABLE `historial_de_errores` DISABLE KEYS */;
INSERT INTO `historial_de_errores` VALUES (1,21,'2025-11-03 17:56:38','PAYMENT_FAILED','Tarjeta rechazada por el banco - Fondos insuficientes','paypal','{"stack": "Error: Tarjeta rechazada por el banco - Fondos insuficientes\n    at PaymentApplicationService.processPayment (C:\\vscode\\TITEC\\Backend\\src\\payments\\application\\services\\payment-application.service.ts:104:15)\n    at process.processTicksAndRejections (node:internal/process/task_queues:105:5)\n    at async PaymentController.createPayment (C:\\vscode\\TITEC\\Backend\\src\\payments\\presentation\\controllers\\payment.controller.ts:361:22)\n    at async C:\\vscode\\TITEC\\Backend\\node_modules\\@nestjs\\core\\router\\router-execution-context.js:46:28\n    at async C:\\vscode\\TITEC\\Backend\\node_modules\\@nestjs\\core\\router\\router-proxy.js:9:17", "paymentId": "pay_1762192597879_53w0wax", "timestamp": "2025-11-03T17:56:38.060Z"}'),(2,36,'2025-11-05 00:37:00','PAYMENT_FAILED','Tarjeta rechazada por el banco - Fondos insuficientes','stripe','{"stack": "Error: Tarjeta rechazada por el banco - Fondos insuficientes\n    at PaymentApplicationService.processPayment (C:\\vscode\\TITEC\\Backend\\src\\payments\\application\\services\\payment-application.service.ts:102:15)\n    at process.processTicksAndRejections (node:internal/process/task_queues:105:5)\n    at async PaymentController.createPayment (C:\\vscode\\TITEC\\Backend\\src\\payments\\presentation\\controllers\\payment.controller.ts:361:22)\n    at async C:\\vscode\\TITEC\\Backend\\node_modules\\@nestjs\\core\\router\\router-execution-context.js:46:28\n    at async C:\\vscode\\TITEC\\Backend\\node_modules\\@nestjs\\core\\router\\router-proxy.js:9:17", "paymentId": "pay_1762303019649_6s5cxzd", "timestamp": "2025-11-05T00:37:00.098Z"}'),(3,37,'2025-11-05 01:02:45','PAYMENT_FAILED','Tarjeta rechazada por el banco - Fondos insuficientes','paypal','{"stack": "Error: Tarjeta rechazada por el banco - Fondos insuficientes\n    at PaymentApplicationService.processPayment (C:\\vscode\\TITEC\\Backend\\src\\payments\\application\\services\\payment-application.service.ts:102:15)\n    at process.processTicksAndRejections (node:internal/process/task_queues:105:5)\n    at async PaymentController.createPayment (C:\\vscode\\TITEC\\Backend\\src\\payments\\presentation\\controllers\\payment.controller.ts:361:22)\n    at async C:\\vscode\\TITEC\\Backend\\node_modules\\@nestjs\\core\\router\\router-execution-context.js:46:28\n    at async C:\\vscode\\TITEC\\Backend\\node_modules\\@nestjs\\core\\router\\router-proxy.js:9:17", "paymentId": "pay_1762304565431_oqv6k6i", "timestamp": "2025-11-05T01:02:45.541Z"}'),(4,39,'2025-11-05 20:53:14','PAYMENT_FAILED','Tarjeta rechazada por el banco - Fondos insuficientes','paypal','{"stack": "Error: Tarjeta rechazada por el banco - Fondos insuficientes\n    at PaymentApplicationService.processPayment (C:\\vscode\\TITEC\\Backend\\src\\payments\\application\\services\\payment-application.service.ts:102:15)\n    at process.processTicksAndRejections (node:internal/process/task_queues:105:5)\n    at async PaymentController.createPayment (C:\\vscode\\TITEC\\Backend\\src\\payments\\presentation\\controllers\\payment.controller.ts:361:22)\n    at async C:\\vscode\\TITEC\\Backend\\node_modules\\@nestjs\\core\\router\\router-execution-context.js:46:28\n    at async C:\\vscode\\TITEC\\Backend\\node_modules\\@nestjs\\core\\router\\router-proxy.js:9:17", "paymentId": "pay_1762371193910_y9yzwk", "timestamp": "2025-11-05T20:53:14.072Z"}');
/*!40000 ALTER TABLE `historial_de_errores` ENABLE KEYS */;
UNLOCK TABLES;

/*!40103 SET TIME_ZONE=@OLD_TIME_ZONE */;

/*!40101 SET SQL_MODE=@OLD_SQL_MODE */;
/*!40014 SET FOREIGN_KEY_CHECKS=@OLD_FOREIGN_KEY_CHECKS */;
/*!40014 SET UNIQUE_CHECKS=@OLD_UNIQUE_CHECKS */;
/*!40101 SET CHARACTER_SET_CLIENT=@OLD_CHARACTER_SET_CLIENT */;
/*!40101 SET CHARACTER_SET_RESULTS=@OLD_CHARACTER_SET_RESULTS */;
/*!40101 SET COLLATION_CONNECTION=@OLD_COLLATION_CONNECTION */;
/*!40111 SET SQL_NOTES=@OLD_SQL_NOTES */;

-- Dump completed on 2025-11-12 22:50:44