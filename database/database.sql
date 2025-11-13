-- MySQL dump 10.13  Distrib 8.4.5, for Win64 (x86_64)
--
-- Host: localhost    Database: tite
-- ------------------------------------------------------
-- Server version	8.4.5

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
INSERT INTO `historial_de_errores` VALUES (1,21,'2025-11-03 17:56:38','PAYMENT_FAILED','Tarjeta rechazada por el banco - Fondos insuficientes','paypal','{\"stack\": \"Error: Tarjeta rechazada por el banco - Fondos insuficientes\\n    at PaymentApplicationService.processPayment (C:\\\\vscode\\\\TITEC\\\\Backend\\\\src\\\\payments\\\\application\\\\services\\\\payment-application.service.ts:104:15)\\n    at process.processTicksAndRejections (node:internal/process/task_queues:105:5)\\n    at async PaymentController.createPayment (C:\\\\vscode\\\\TITEC\\\\Backend\\\\src\\\\payments\\\\presentation\\\\controllers\\\\payment.controller.ts:361:22)\\n    at async C:\\\\vscode\\\\TITEC\\\\Backend\\\\node_modules\\\\@nestjs\\\\core\\\\router\\\\router-execution-context.js:46:28\\n    at async C:\\\\vscode\\\\TITEC\\\\Backend\\\\node_modules\\\\@nestjs\\\\core\\\\router\\\\router-proxy.js:9:17\", \"paymentId\": \"pay_1762192597879_53w0wax\", \"timestamp\": \"2025-11-03T17:56:38.060Z\"}'),(2,36,'2025-11-05 00:37:00','PAYMENT_FAILED','Tarjeta rechazada por el banco - Fondos insuficientes','stripe','{\"stack\": \"Error: Tarjeta rechazada por el banco - Fondos insuficientes\\n    at PaymentApplicationService.processPayment (C:\\\\vscode\\\\TITEC\\\\Backend\\\\src\\\\payments\\\\application\\\\services\\\\payment-application.service.ts:102:15)\\n    at process.processTicksAndRejections (node:internal/process/task_queues:105:5)\\n    at async PaymentController.createPayment (C:\\\\vscode\\\\TITEC\\\\Backend\\\\src\\\\payments\\\\presentation\\\\controllers\\\\payment.controller.ts:361:22)\\n    at async C:\\\\vscode\\\\TITEC\\\\Backend\\\\node_modules\\\\@nestjs\\\\core\\\\router\\\\router-execution-context.js:46:28\\n    at async C:\\\\vscode\\\\TITEC\\\\Backend\\\\node_modules\\\\@nestjs\\\\core\\\\router\\\\router-proxy.js:9:17\", \"paymentId\": \"pay_1762303019649_6s5cxzd\", \"timestamp\": \"2025-11-05T00:37:00.098Z\"}'),(3,37,'2025-11-05 01:02:45','PAYMENT_FAILED','Tarjeta rechazada por el banco - Fondos insuficientes','stripe','{\"stack\": \"Error: Tarjeta rechazada por el banco - Fondos insuficientes\\n    at PaymentApplicationService.processPayment (C:\\\\vscode\\\\TITEC\\\\Backend\\\\src\\\\payments\\\\application\\\\services\\\\payment-application.service.ts:105:15)\\n    at process.processTicksAndRejections (node:internal/process/task_queues:105:5)\\n    at async PaymentController.createPayment (C:\\\\vscode\\\\TITEC\\\\Backend\\\\src\\\\payments\\\\presentation\\\\controllers\\\\payment.controller.ts:361:22)\\n    at async C:\\\\vscode\\\\TITEC\\\\Backend\\\\node_modules\\\\@nestjs\\\\core\\\\router\\\\router-execution-context.js:46:28\\n    at async C:\\\\vscode\\\\TITEC\\\\Backend\\\\node_modules\\\\@nestjs\\\\core\\\\router\\\\router-proxy.js:9:17\", \"paymentId\": \"pay_1762304565096_xrqb72y\", \"timestamp\": \"2025-11-05T01:02:45.429Z\"}'),(4,38,'2025-11-05 02:49:35','PAYMENT_FAILED','Tarjeta rechazada por el banco - Fondos insuficientes','stripe','{\"stack\": \"Error: Tarjeta rechazada por el banco - Fondos insuficientes\\n    at PaymentApplicationService.processPayment (C:\\\\vscode\\\\TITEC\\\\Backend\\\\src\\\\payments\\\\application\\\\services\\\\payment-application.service.ts:105:15)\\n    at process.processTicksAndRejections (node:internal/process/task_queues:105:5)\\n    at async PaymentController.createPayment (C:\\\\vscode\\\\TITEC\\\\Backend\\\\src\\\\payments\\\\presentation\\\\controllers\\\\payment.controller.ts:361:22)\\n    at async C:\\\\vscode\\\\TITEC\\\\Backend\\\\node_modules\\\\@nestjs\\\\core\\\\router\\\\router-execution-context.js:46:28\\n    at async C:\\\\vscode\\\\TITEC\\\\Backend\\\\node_modules\\\\@nestjs\\\\core\\\\router\\\\router-proxy.js:9:17\", \"paymentId\": \"pay_1762310974550_751paiy\", \"timestamp\": \"2025-11-05T02:49:35.287Z\"}');
/*!40000 ALTER TABLE `historial_de_errores` ENABLE KEYS */;
UNLOCK TABLES;

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
INSERT INTO `pagos` VALUES (1,'user_123','cart_001',291502.00,'CLP','COMPLETED','2025-11-03 16:43:40','paypal','mock_pay_1762188219929_czdwv9z',NULL,NULL,'Pago pay_1762188219929_czdwv9z',NULL,NULL,NULL,NULL,NULL,NULL,'2025-11-03 13:43:40'),(3,'user_123','cart_002',291502.00,'CLP','COMPLETED','2025-11-03 16:47:00','webpay','mock_pay_1762188420047_rwtrusy',NULL,NULL,'Pago pay_1762188420047_rwtrusy',NULL,NULL,NULL,NULL,NULL,NULL,'2025-11-03 13:47:00'),(5,'user_123','cart_003',291502.00,'CLP','COMPLETED','2025-11-03 16:58:34','webpay','mock_pay_1762189114430_qzaodk2',NULL,NULL,'Pago pay_1762189114430_qzaodk2',NULL,NULL,NULL,NULL,NULL,NULL,'2025-11-03 13:58:34'),(6,'user_123','cart_004',291502.00,'CLP','COMPLETED','2025-11-03 17:06:20','webpay','mock_pay_1762189579622_78hf5hi',NULL,NULL,'Pago pay_1762189579622_78hf5hi',NULL,NULL,NULL,NULL,NULL,NULL,'2025-11-03 14:06:19'),(8,'user_123','cart_005',291502.00,'CLP','COMPLETED','2025-11-03 17:11:07','stripe','mock_pay_1762189867207_omngddp',NULL,NULL,'Pago pay_1762189867207_omngddp',NULL,NULL,NULL,NULL,NULL,NULL,'2025-11-03 14:11:07'),(9,'user_123','cart_006',291502.00,'CLP','COMPLETED','2025-11-03 17:18:08','stripe','mock_pay_1762190287719_3tffvoi',NULL,NULL,'Pago pay_1762190287719_3tffvoi',NULL,NULL,NULL,NULL,NULL,NULL,'2025-11-03 14:18:07'),(10,'user_123','cart_007',291502.00,'CLP','COMPLETED','2025-11-03 17:22:57','stripe','mock_pay_1762190576916_kycziyu',NULL,NULL,'Pago pay_1762190576916_kycziyu',NULL,NULL,NULL,NULL,NULL,NULL,'2025-11-03 14:22:57'),(11,'user_123','cart_008',291502.00,'CLP','COMPLETED','2025-11-03 17:28:34','stripe','mock_pay_1762190913648_l321gb1',NULL,NULL,'Pago pay_1762190913648_l321gb1',NULL,NULL,NULL,NULL,NULL,NULL,'2025-11-03 14:28:33'),(12,'user_123','cart_009',291502.00,'CLP','COMPLETED','2025-11-03 17:31:47','stripe','mock_pay_1762191107060_7foedwk',NULL,NULL,'Pago pay_1762191107060_7foedwk',NULL,NULL,NULL,NULL,NULL,NULL,'2025-11-03 14:31:47'),(13,'user_123','cart_010',291502.00,'CLP','COMPLETED','2025-11-03 17:34:14','stripe','mock_pay_1762191253677_ybg7b74','7453','PEPE','Pago pay_1762191253677_ybg7b74',NULL,NULL,NULL,NULL,NULL,NULL,'2025-11-03 14:34:13'),(14,'user_123','cart_011',291502.00,'CLP','COMPLETED','2025-11-03 17:37:48','webpay','mock_pay_1762191467756_w0d5e8d',NULL,NULL,'Pago pay_1762191467756_w0d5e8d',NULL,NULL,NULL,NULL,NULL,NULL,'2025-11-03 14:37:47'),(16,'user_123','cart_012',793.00,'CLP','COMPLETED','2025-11-03 17:45:08','paypal','mock_pay_1762191908093_lqmo3ky',NULL,NULL,'Pago pay_1762191908093_lqmo3ky',NULL,NULL,NULL,NULL,NULL,NULL,'2025-11-03 14:45:08'),(19,'user_123','cart_013',666.00,'CLP','PENDING','2025-11-03 17:49:38','webpay',NULL,NULL,NULL,'Pago pay_1762192178439_pfqp5e9',NULL,NULL,NULL,NULL,NULL,NULL,'2025-11-03 17:49:38'),(20,'user_123','cart_014',666.00,'CLP','FAILED','2025-11-03 17:53:13','webpay',NULL,NULL,NULL,'PAYMENT_FAILED: Tarjeta rechazada por el banco - Fondos insuficientes',NULL,NULL,NULL,NULL,NULL,NULL,'2025-11-03 14:53:12'),(21,'user_123','cart_015',666.00,'CLP','FAILED','2025-11-03 17:56:38','paypal',NULL,NULL,NULL,'PAYMENT_FAILED: Tarjeta rechazada por el banco - Fondos insuficientes',NULL,NULL,NULL,NULL,NULL,NULL,'2025-11-03 14:56:38'),(22,'user_123','cart_016',244960.00,'CLP','COMPLETED','2025-11-03 18:03:33','paypal','mock_pay_1762193013109_ijf20rs',NULL,'MARIO BRITO','Pago pay_1762193013109_ijf20rs',NULL,NULL,NULL,NULL,NULL,NULL,'2025-11-03 15:03:33'),(24,'user_123','cart_017',29990.00,'CLP','COMPLETED','2025-11-03 18:09:21','stripe','mock_pay_1762193360637_2rj23ov','5435','SOY CABRON','Pago pay_1762193360637_2rj23ov',NULL,NULL,NULL,NULL,NULL,NULL,'2025-11-03 15:09:20'),(26,'user_123','cart_018',291502.00,'CLP','COMPLETED','2025-11-03 18:28:00','paypal','mock_pay_1762194480317_uvelzlu',NULL,NULL,'Pago pay_1762194480317_uvelzlu',NULL,NULL,NULL,NULL,NULL,NULL,'2025-11-03 15:28:00'),(27,'user_123','cart_019',291502.00,'CLP','COMPLETED','2025-11-03 18:29:09','paypal','mock_pay_1762194548784_afethqd',NULL,NULL,'Pago pay_1762194548784_afethqd',NULL,NULL,NULL,NULL,NULL,NULL,'2025-11-03 15:29:08'),(29,'user_123','cart_020',291502.00,'CLP','COMPLETED','2025-11-03 18:34:54','paypal','mock_pay_1762194894295_gfl96xw',NULL,NULL,'Pago pay_1762194894295_gfl96xw',NULL,NULL,NULL,NULL,NULL,NULL,'2025-11-03 15:34:54'),(31,'user_123','cart_021',394950.00,'CLP','COMPLETED','2025-11-03 23:53:27','paypal','mock_pay_1762214006850_jtptnz6',NULL,NULL,'Pago pay_1762214006850_jtptnz6',NULL,NULL,NULL,NULL,NULL,NULL,'2025-11-03 20:53:27'),(32,'user_123','cart_022',394950.00,'CLP','COMPLETED','2025-11-04 00:18:24','webpay','mock_pay_1762215503946_ucbxajn',NULL,NULL,'Pago pay_1762215503946_ucbxajn',NULL,NULL,NULL,NULL,NULL,NULL,'2025-11-03 21:18:24'),(33,'user_123','cart_023',394950.00,'CLP','COMPLETED','2025-11-04 00:37:14','stripe','mock_pay_1762216633754_snqs49t','6234','ME GUSTA DORMIR POR LAS TARDES EN LA VENTANA POR QUE NO TENGO NADA MAS QUE HACER','Pago pay_1762216633754_snqs49t',NULL,NULL,NULL,NULL,NULL,NULL,'2025-11-03 21:37:14'),(36,'user_123','cart_024',666.00,'CLP','FAILED','2025-11-05 00:37:00','stripe',NULL,'7423','PEPE','PAYMENT_FAILED: Tarjeta rechazada por el banco - Fondos insuficientes',NULL,NULL,NULL,NULL,NULL,NULL,'2025-11-04 21:37:00'),(37,'user_123','cart_02',666.00,'CLP','FAILED','2025-11-05 01:02:45','stripe','failed_stripe_pay_1762304565096_xrqb72y','6546','SOY CABRON','PAYMENT_FAILED: Tarjeta rechazada por el banco - Fondos insuficientes',NULL,NULL,NULL,NULL,NULL,NULL,'2025-11-04 22:02:45'),(38,'user_test','cart_test',666.00,'CLP','FAILED','2025-11-05 02:49:35','stripe','failed_stripe_pay_1762310974550_751paiy','4242','JUAN PEREZ','PAYMENT_FAILED: Tarjeta rechazada por el banco - Fondos insuficientes',NULL,NULL,NULL,NULL,NULL,NULL,'2025-11-04 23:49:35');
/*!40000 ALTER TABLE `pagos` ENABLE KEYS */;
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
