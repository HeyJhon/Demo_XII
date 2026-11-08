/* =========================================================================
   XII Congreso ISC · TecNM Campus Ajalpan — Base de datos de la demo
   -------------------------------------------------------------------------
   Crea la base CongresoISDB (si no existe), sus tablas, llaves y datos de prueba.

   ⚠ Si las tablas ya existen, se ELIMINAN y se vuelven a crear (reinicia la demo).

   Cómo correrlo:
     - SSMS / Azure Data Studio: abre este archivo y ejecútalo (F5).
     - sqlcmd:  sqlcmd -S localhost -E -C -i database/CongresoISDB.sql
   ========================================================================= */

SET NOCOUNT ON;
GO

-- 1) Base de datos -----------------------------------------------------------
-- Intercalación Latin1 explícita: los textos son varchar y llevan acentos (á, é, ñ…).
IF DB_ID(N'CongresoISDB') IS NULL
    CREATE DATABASE [CongresoISDB] COLLATE SQL_Latin1_General_CP1_CI_AS;
GO

USE [CongresoISDB];
GO

SET ANSI_NULLS ON;
SET QUOTED_IDENTIFIER ON;
GO

-- 2) Limpieza (en orden por las llaves foráneas) ------------------------------
DROP TABLE IF EXISTS [dbo].[Inscripcion];
DROP TABLE IF EXISTS [dbo].[Taller];
DROP TABLE IF EXISTS [dbo].[User];
GO

-- 3) Tablas -----------------------------------------------------------------
-- UserRol: 1 = Profesor, 2 = Alumno (sin tabla catálogo, a propósito)
CREATE TABLE [dbo].[User](
    [Id]       [int] IDENTITY(1,1) NOT NULL,
    [Username] [varchar](50) NOT NULL,
    [Password] [varchar](20) NOT NULL,
    [UserRol]  [int] NOT NULL,
    CONSTRAINT [PK_User] PRIMARY KEY CLUSTERED ([Id] ASC)
);
GO

-- Horario: 1 = Mañana, 2 = Tarde (sin tabla catálogo, a propósito)
CREATE TABLE [dbo].[Taller](
    [Id]          [int] IDENTITY(1,1) NOT NULL,
    [Name]        [varchar](50) NOT NULL,
    [Description] [varchar](200) NULL,
    [Instructor]  [varchar](100) NOT NULL,
    [Horario]     [int] NOT NULL,
    [Horas]       [int] NOT NULL,
    CONSTRAINT [PK_Taller] PRIMARY KEY CLUSTERED ([Id] ASC)
);
GO

CREATE TABLE [dbo].[Inscripcion](
    [Id]       [int] IDENTITY(1,1) NOT NULL,
    [UserId]   [int] NOT NULL,
    [TallerId] [int] NOT NULL,
    CONSTRAINT [PK_Inscripcion] PRIMARY KEY CLUSTERED ([Id] ASC),
    CONSTRAINT [FK_Inscripcion_User]   FOREIGN KEY ([UserId])   REFERENCES [dbo].[User]([Id]),
    CONSTRAINT [FK_Inscripcion_Taller] FOREIGN KEY ([TallerId]) REFERENCES [dbo].[Taller]([Id])
);
GO

-- 4) Datos de prueba ----------------------------------------------------------
SET IDENTITY_INSERT [dbo].[User] ON;
INSERT [dbo].[User] ([Id], [Username], [Password], [UserRol]) VALUES
    (1, N'cesar.zarate',     N'12345',     1),
    (2, N'prof.hernandez',   N'Prof2026!', 1),
    (3, N'prof.morales',     N'Prof2026!', 1),
    (4, N'ana.lopez',        N'Alumno123', 2),
    (5, N'carlos.garcia',    N'Alumno123', 2),
    (6, N'maria.perez',      N'Alumno123', 2),
    (7, N'jose.martinez',    N'Alumno123', 2),
    (8, N'lucia.sanchez',    N'Alumno123', 2),
    (9, N'jhonnatan.flores', N'12345',     2);
SET IDENTITY_INSERT [dbo].[User] OFF;
GO

-- El Id de cada taller corresponde a su flyer: CongresoApi/wwwroot/img/talleres/{Id}.jpg
SET IDENTITY_INSERT [dbo].[Taller] ON;
INSERT [dbo].[Taller] ([Id], [Name], [Description], [Instructor], [Horario], [Horas]) VALUES
    (1, N'Impresión 3D',
        N'Del diseño al objeto físico: modelado en Tinkercad/Fusion 360, laminado con Cura, calibración de la impresora e impresión de una pieza propia.',
        N'Ing. Roberto Ramírez', 1, 4),
    (2, N'Programación de ESP32 con MicroPython',
        N'Introducción al IoT: configura el ESP32 con MicroPython, controla LEDs y sensores, conéctalo a WiFi y envía datos a un servidor web.',
        N'M.C. Laura Hernández', 2, 6),
    (3, N'DevSecOps',
        N'Integra la seguridad en el ciclo de desarrollo: pipelines CI/CD con GitHub Actions, análisis de código (SAST), escaneo de dependencias y contenedores.',
        N'Ing. Fernando Morales', 1, 5),
    (4, N'Herramientas de IA para el Rediseño de Interfaces',
        N'Usa IA generativa para rediseñar interfaces: prototipado con Figma AI, generación de UI con v0 y Galileo AI, y evaluación de usabilidad y accesibilidad.',
        N'Ing. Roberto Ramírez', 2, 4),
    (5, N'Microsoft Power BI',
        N'Convierte datos en decisiones: conexión a Excel y SQL Server, limpieza con Power Query, medidas DAX básicas y dashboards interactivos publicados en la nube.',
        N'M.C. Laura Hernández', 1, 5);
SET IDENTITY_INSERT [dbo].[Taller] OFF;
GO

SET IDENTITY_INSERT [dbo].[Inscripcion] ON;
INSERT [dbo].[Inscripcion] ([Id], [UserId], [TallerId]) VALUES
    (1, 4, 1),   -- ana.lopez        -> Impresión 3D
    (2, 7, 1),   -- jose.martinez    -> Impresión 3D
    (3, 4, 2),   -- ana.lopez        -> ESP32
    (4, 6, 2),   -- maria.perez      -> ESP32
    (5, 5, 3),   -- carlos.garcia    -> DevSecOps
    (6, 8, 3),   -- lucia.sanchez    -> DevSecOps
    (7, 9, 1),   -- jhonnatan.flores -> Impresión 3D
    (8, 9, 5);   -- jhonnatan.flores -> Power BI
SET IDENTITY_INSERT [dbo].[Inscripcion] OFF;
GO

-- 5) Verificación ----------------------------------------------------------------
SELECT 'User' AS Tabla, COUNT(*) AS Filas FROM [dbo].[User]
UNION ALL SELECT 'Taller', COUNT(*) FROM [dbo].[Taller]
UNION ALL SELECT 'Inscripcion', COUNT(*) FROM [dbo].[Inscripcion];
GO
