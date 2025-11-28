-- phpMyAdmin SQL Dump
-- version 5.2.1
-- https://www.phpmyadmin.net/
--
-- Host: 127.0.0.1
-- Generation Time: Nov 28, 2025 at 09:49 PM
-- Server version: 10.4.32-MariaDB
-- PHP Version: 8.2.12

SET SQL_MODE = "NO_AUTO_VALUE_ON_ZERO";
START TRANSACTION;
SET time_zone = "+00:00";


/*!40101 SET @OLD_CHARACTER_SET_CLIENT=@@CHARACTER_SET_CLIENT */;
/*!40101 SET @OLD_CHARACTER_SET_RESULTS=@@CHARACTER_SET_RESULTS */;
/*!40101 SET @OLD_COLLATION_CONNECTION=@@COLLATION_CONNECTION */;
/*!40101 SET NAMES utf8mb4 */;

--
-- Database: `contenedor`
--

-- --------------------------------------------------------

--
-- Table structure for table `asignaciones`
--

CREATE TABLE `asignaciones` (
  `id` int(11) NOT NULL,
  `curso_id` int(11) NOT NULL,
  `materia_id` int(11) NOT NULL,
  `turno` enum('mañana','tarde','vespertino') NOT NULL DEFAULT 'mañana',
  `dia` varchar(255) NOT NULL,
  `hora_inicio` time NOT NULL,
  `hora_fin` time NOT NULL,
  `created_at` datetime NOT NULL DEFAULT current_timestamp(),
  `updated_at` datetime DEFAULT NULL,
  `deleted_at` datetime DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Dumping data for table `asignaciones`
--

INSERT INTO `asignaciones` (`id`, `curso_id`, `materia_id`, `turno`, `dia`, `hora_inicio`, `hora_fin`, `created_at`, `updated_at`, `deleted_at`) VALUES
(5, 1, 29, 'mañana', 'lunes', '07:35:00', '08:35:00', '2025-11-28 03:42:13', '2025-11-28 14:26:41', NULL);

-- --------------------------------------------------------

--
-- Table structure for table `asignaciones_profesores`
--

CREATE TABLE `asignaciones_profesores` (
  `asignacion_id` int(11) NOT NULL,
  `profesor_id` int(11) NOT NULL,
  `created_at` datetime NOT NULL DEFAULT current_timestamp(),
  `updated_at` datetime DEFAULT NULL,
  `deleted_at` datetime DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Dumping data for table `asignaciones_profesores`
--

INSERT INTO `asignaciones_profesores` (`asignacion_id`, `profesor_id`, `created_at`, `updated_at`, `deleted_at`) VALUES
(5, 6, '2025-11-28 14:26:41', NULL, NULL);

-- --------------------------------------------------------

--
-- Table structure for table `asistencias`
--

CREATE TABLE `asistencias` (
  `id` int(11) NOT NULL,
  `id_alumno` int(11) NOT NULL,
  `fecha_de_asistencias` date NOT NULL,
  `estado` varchar(30) NOT NULL,
  `turno` varchar(30) NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Dumping data for table `asistencias`
--

INSERT INTO `asistencias` (`id`, `id_alumno`, `fecha_de_asistencias`, `estado`, `turno`) VALUES
(2, 2, '2025-11-24', 'presente', ''),
(3, 1, '2025-11-24', 'presente', ''),
(4, 3, '2025-11-26', 'presente', 'mañana'),
(5, 2, '2025-11-27', 'presente', 'mañana'),
(6, 1, '2025-11-27', 'presente', 'mañana'),
(13, 2, '2025-11-27', 'presente', 'tarde'),
(14, 1, '2025-11-27', 'presente', 'tarde'),
(15, 2, '2025-11-28', 'presente', 'mañana'),
(16, 1, '2025-11-28', 'presente', 'mañana'),
(17, 1, '2025-11-28', 'presente', 'tarde'),
(18, 3, '2025-11-28', 'presente', 'mañana');

-- --------------------------------------------------------

--
-- Table structure for table `cursos`
--

CREATE TABLE `cursos` (
  `id` int(11) NOT NULL,
  `anio` int(11) NOT NULL,
  `division` int(11) NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Dumping data for table `cursos`
--

INSERT INTO `cursos` (`id`, `anio`, `division`) VALUES
(1, 7, 2),
(2, 7, 1);

-- --------------------------------------------------------

--
-- Table structure for table `listas`
--

CREATE TABLE `listas` (
  `id` int(11) NOT NULL,
  `id_curso` int(11) NOT NULL,
  `id_alumno` int(11) NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Dumping data for table `listas`
--

INSERT INTO `listas` (`id`, `id_curso`, `id_alumno`) VALUES
(1, 1, 1),
(2, 1, 2),
(3, 2, 3);

-- --------------------------------------------------------

--
-- Table structure for table `materias`
--

CREATE TABLE `materias` (
  `id` int(11) NOT NULL,
  `nombre` varchar(255) NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Dumping data for table `materias`
--

INSERT INTO `materias` (`id`, `nombre`) VALUES
(23, 'Análisis Matemático'),
(13, 'Arte'),
(26, 'Bases de Datos'),
(8, 'Biología'),
(34, 'Derechos del Trabajo'),
(31, 'Desarrollo de Aplicaciones Web Dinamicas'),
(30, 'Desarrollo de Aplicaciones Web Estaticas'),
(11, 'Educación Física'),
(4, 'Filosofía'),
(6, 'Física'),
(7, 'Fisicoquimica'),
(10, 'Geografía'),
(9, 'Historia'),
(5, 'Inglés'),
(27, 'Laboratorio de Diseño de Bases de Datos'),
(20, 'Laboratorio de Diseño Web'),
(15, 'Laboratorio de Hardware'),
(29, 'Laboratorio de Procesos Industriales'),
(19, 'Laboratorio de Programación'),
(21, 'Laboratorio de Redes'),
(16, 'Laboratorio de Sistemas Operativos'),
(2, 'Lengua'),
(3, 'Literatura'),
(1, 'Matemática'),
(33, 'Matemática Discreta'),
(25, 'Modelos y Sistemas'),
(12, 'Música'),
(24, 'Política y Ciudadanía'),
(14, 'Química'),
(17, 'Salud y Adolescencia'),
(28, 'Seguridad Informática'),
(32, 'Sistemas de Gestion y Autogestion'),
(22, 'Sistemas Digitales'),
(18, 'Tecnologias Electrónicas');

-- --------------------------------------------------------

--
-- Table structure for table `preferencias_modulo`
--

CREATE TABLE `preferencias_modulo` (
  `id` int(11) NOT NULL,
  `usuario_id` bigint(20) NOT NULL,
  `modulo_nombre` varchar(190) NOT NULL,
  `estado` enum('favorito','escondido','neutral') NOT NULL,
  `orden` int(11) DEFAULT NULL,
  `created_at` datetime NOT NULL,
  `updated_at` datetime NOT NULL,
  `deleted_at` datetime DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Dumping data for table `preferencias_modulo`
--

INSERT INTO `preferencias_modulo` (`id`, `usuario_id`, `modulo_nombre`, `estado`, `orden`, `created_at`, `updated_at`, `deleted_at`) VALUES
(98, 7, 'gestor-profesores', 'favorito', NULL, '2025-11-28 20:44:30', '2025-11-28 20:44:30', '2025-11-28 20:45:09'),
(99, 7, 'modulo-alumnos', 'escondido', NULL, '2025-11-28 20:44:40', '2025-11-28 20:44:40', '2025-11-28 20:44:58');

-- --------------------------------------------------------

--
-- Table structure for table `profesores_datos`
--

CREATE TABLE `profesores_datos` (
  `id` int(11) NOT NULL,
  `profesor_id` int(11) NOT NULL,
  `legajo` varchar(50) NOT NULL,
  `telefono` varchar(20) NOT NULL,
  `fecha_nacimiento` date NOT NULL,
  `direccion` varchar(255) NOT NULL,
  `ciudad` varchar(255) NOT NULL,
  `codigo_postal` varchar(255) NOT NULL,
  `fecha_ingreso` datetime NOT NULL,
  `estado` varchar(255) NOT NULL DEFAULT 'activo',
  `tipo_contrato` varchar(255) NOT NULL DEFAULT 'contrato',
  `titulo_principal` varchar(255) NOT NULL,
  `especialidades` varchar(500) NOT NULL,
  `created_at` datetime NOT NULL DEFAULT current_timestamp(),
  `updated_at` datetime DEFAULT NULL,
  `deleted_at` datetime DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Dumping data for table `profesores_datos`
--

INSERT INTO `profesores_datos` (`id`, `profesor_id`, `legajo`, `telefono`, `fecha_nacimiento`, `direccion`, `ciudad`, `codigo_postal`, `fecha_ingreso`, `estado`, `tipo_contrato`, `titulo_principal`, `especialidades`, `created_at`, `updated_at`, `deleted_at`) VALUES
(1, 6, 'DOC-001', '54 11 9345-2453', '1987-11-11', 'Calle Peru 121', 'Buenos Aires', 'B4312', '2025-11-27 00:00:00', 'activo', 'contrato', 'Ingeniero en Electronica', '[\"[\\\"[\\\\\\\"[\\\\\\\\\\\\\\\"[\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\"Electronica\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\"\\\\\\\\\\\\\\\"\\\\\\\"\\\"\",\"\\\"\\\\\\\"\\\\\\\\\\\\\\\"\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\"Programacion\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\"]\\\\\\\\\\\\\\\"]\\\\\\\"]\\\"]\"]', '2025-11-27 17:04:27', '2025-11-28 03:50:28', NULL),
(2, 8, 'DOC-002', '0111569379130', '2018-02-15', 'Pasaje 128 1278', 'Villa Ballester', 'B1653', '2025-11-27 00:00:00', 'activo', 'planta_permanente', 'Tecnico en Programacion', '[]', '2025-11-27 17:05:11', '2025-11-27 17:05:11', '2025-11-27 17:05:20'),
(3, 9, 'DOC-002', '0111569379130', '2025-11-05', 'Pasaje 128 1278', 'Villa Ballester', 'B1653', '2025-11-11 00:00:00', 'activo', 'planta_permanente', 'Tecnico en Programacion', '[]', '2025-11-27 17:05:42', '2025-11-27 17:05:42', NULL);

-- --------------------------------------------------------

--
-- Table structure for table `usuarios`
--

CREATE TABLE `usuarios` (
  `id` int(11) NOT NULL,
  `nombres` varchar(80) NOT NULL,
  `apellidos` varchar(80) NOT NULL,
  `email` varchar(120) NOT NULL,
  `password_hash` varchar(255) NOT NULL,
  `rol` enum('admin','alumno','profesor','preceptor') NOT NULL DEFAULT 'alumno',
  `created_at` datetime NOT NULL,
  `updated_at` datetime NOT NULL,
  `deleted_at` datetime DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Dumping data for table `usuarios`
--

INSERT INTO `usuarios` (`id`, `nombres`, `apellidos`, `email`, `password_hash`, `rol`, `created_at`, `updated_at`, `deleted_at`) VALUES
(1, 'maxi', 'mayorga', 'maxi@gmail.com', '123', 'alumno', '2025-11-24 00:00:00', '0000-00-00 00:00:00', NULL),
(2, 'franco', 'fernandez', 'frank@gmail.com', '123', 'alumno', '2025-11-24 00:00:00', '0000-00-00 00:00:00', NULL),
(3, 'julian', 'grippaldi', 'juli@gmail.com', '123', 'alumno', '2025-11-24 00:00:00', '0000-00-00 00:00:00', NULL),
(6, 'Carlos Alberto', 'Robello', 'robello@gmail.com', '$2a$12$zJ23Rc4O1tn3Ho/KPhC/ROar2ymrH7TXlQBp0cL2MTNfzt/rPj8/u', 'profesor', '0000-00-00 00:00:00', '2025-11-28 00:00:00', NULL),
(7, 'Julian Exequiel', 'Grippaldi', 'juliangrippaldi@gmail.com', '$2a$12$zJ23Rc4O1tn3Ho/KPhC/ROar2ymrH7TXlQBp0cL2MTNfzt/rPj8/u', 'admin', '2025-11-27 00:00:00', '2025-11-27 00:00:00', NULL);

--
-- Indexes for dumped tables
--

--
-- Indexes for table `asignaciones`
--
ALTER TABLE `asignaciones`
  ADD PRIMARY KEY (`id`),
  ADD KEY `curso_id` (`curso_id`),
  ADD KEY `materia_id` (`materia_id`);

--
-- Indexes for table `asignaciones_profesores`
--
ALTER TABLE `asignaciones_profesores`
  ADD PRIMARY KEY (`asignacion_id`,`profesor_id`),
  ADD KEY `profesor_id` (`profesor_id`),
  ADD KEY `asignacion_id` (`asignacion_id`);

--
-- Indexes for table `asistencias`
--
ALTER TABLE `asistencias`
  ADD PRIMARY KEY (`id`),
  ADD KEY `id_alumno` (`id_alumno`);

--
-- Indexes for table `cursos`
--
ALTER TABLE `cursos`
  ADD PRIMARY KEY (`id`);

--
-- Indexes for table `listas`
--
ALTER TABLE `listas`
  ADD PRIMARY KEY (`id`),
  ADD KEY `id_alumno` (`id_alumno`),
  ADD KEY `id_curso` (`id_curso`);

--
-- Indexes for table `materias`
--
ALTER TABLE `materias`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `nombre` (`nombre`);

--
-- Indexes for table `preferencias_modulo`
--
ALTER TABLE `preferencias_modulo`
  ADD PRIMARY KEY (`id`),
  ADD KEY `usuario_id` (`usuario_id`);

--
-- Indexes for table `profesores_datos`
--
ALTER TABLE `profesores_datos`
  ADD PRIMARY KEY (`id`),
  ADD KEY `profesor_id` (`profesor_id`);

--
-- Indexes for table `usuarios`
--
ALTER TABLE `usuarios`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `email` (`email`),
  ADD UNIQUE KEY `email_2` (`email`);

--
-- AUTO_INCREMENT for dumped tables
--

--
-- AUTO_INCREMENT for table `asignaciones`
--
ALTER TABLE `asignaciones`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=6;

--
-- AUTO_INCREMENT for table `asistencias`
--
ALTER TABLE `asistencias`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=19;

--
-- AUTO_INCREMENT for table `cursos`
--
ALTER TABLE `cursos`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=3;

--
-- AUTO_INCREMENT for table `listas`
--
ALTER TABLE `listas`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=6;

--
-- AUTO_INCREMENT for table `materias`
--
ALTER TABLE `materias`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=35;

--
-- AUTO_INCREMENT for table `preferencias_modulo`
--
ALTER TABLE `preferencias_modulo`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=100;

--
-- AUTO_INCREMENT for table `profesores_datos`
--
ALTER TABLE `profesores_datos`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=4;

--
-- AUTO_INCREMENT for table `usuarios`
--
ALTER TABLE `usuarios`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=11;

--
-- Constraints for dumped tables
--

--
-- Constraints for table `asignaciones`
--
ALTER TABLE `asignaciones`
  ADD CONSTRAINT `asignaciones_ibfk_1` FOREIGN KEY (`curso_id`) REFERENCES `cursos` (`id`);

--
-- Constraints for table `asignaciones_profesores`
--
ALTER TABLE `asignaciones_profesores`
  ADD CONSTRAINT `asignaciones_profesores_ibfk_1` FOREIGN KEY (`asignacion_id`) REFERENCES `asignaciones` (`id`),
  ADD CONSTRAINT `asignaciones_profesores_ibfk_2` FOREIGN KEY (`profesor_id`) REFERENCES `usuarios` (`id`);

--
-- Constraints for table `asistencias`
--
ALTER TABLE `asistencias`
  ADD CONSTRAINT `asistencias_ibfk_1` FOREIGN KEY (`id_alumno`) REFERENCES `listas` (`id`);

--
-- Constraints for table `listas`
--
ALTER TABLE `listas`
  ADD CONSTRAINT `listas_ibfk_58` FOREIGN KEY (`id_curso`) REFERENCES `cursos` (`id`) ON DELETE CASCADE ON UPDATE CASCADE,
  ADD CONSTRAINT `listas_ibfk_59` FOREIGN KEY (`id_alumno`) REFERENCES `usuarios` (`id`) ON DELETE CASCADE ON UPDATE CASCADE;

--
-- Constraints for table `profesores_datos`
--
ALTER TABLE `profesores_datos`
  ADD CONSTRAINT `profesores_datos_ibfk_1` FOREIGN KEY (`id`) REFERENCES `usuarios` (`id`);
COMMIT;

/*!40101 SET CHARACTER_SET_CLIENT=@OLD_CHARACTER_SET_CLIENT */;
/*!40101 SET CHARACTER_SET_RESULTS=@OLD_CHARACTER_SET_RESULTS */;
/*!40101 SET COLLATION_CONNECTION=@OLD_COLLATION_CONNECTION */;
