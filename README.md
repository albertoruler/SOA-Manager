# SOA Manager

**Plataforma web para la gestión del Statement of Applicability (SOA) y la consulta de documentación de seguridad.**

SOA Manager es un proyecto académico desarrollado en el marco de la asignatura **Evaluación de Capacidades en la Empresa I (ECE I)** del Grado en Ingeniería Informática de la Universidad Nebrija.

El proyecto tiene como objetivo diseñar, desarrollar y evaluar un prototipo funcional que facilite la gestión de la Declaración de Aplicabilidad (Statement of Applicability, SOA) de un Sistema de Gestión de Seguridad de la Información (SGSI), tomando como referencia la norma **ISO/IEC 27001:2022**.

La plataforma contempla también un repositorio documental y un asistente de consulta basado en recuperación de información (RAG), orientado a proporcionar respuestas fundamentadas en la documentación autorizada.

> **Estado del proyecto:** en desarrollo. Las funcionalidades descritas como objetivos futuros no deben considerarse implementadas hasta que estén desarrolladas y verificadas.

## Tecnologías

| Tecnología | Utilización |
|---|---|
| React | Desarrollo de la interfaz de usuario |
| TypeScript | Tipado estático |
| Vite | Entorno de desarrollo y construcción |
| Supabase | Backend como servicio (BaaS), PostgreSQL y autenticación prevista |
| Git y GitHub | Control de versiones y alojamiento del código |

## Estado actual

El desarrollo se encuentra en una fase inicial de construcción del prototipo y validación de la arquitectura.

Actualmente se dispone de:

- Proyecto frontend basado en React, TypeScript y Vite.
- Interfaz inicial del dashboard y estructura visual de navegación.
- Cliente de Supabase integrado en el frontend.
- Proyecto Supabase configurado con PostgreSQL.
- Primer modelo de datos para usuarios, organizaciones y membresías.
- Políticas iniciales de seguridad a nivel de fila (Row Level Security, RLS).
- Pruebas preliminares de aislamiento de datos entre organizaciones mediante simulación de sesiones autenticadas en PostgreSQL.

Las siguientes funcionalidades forman parte del desarrollo previsto, pero todavía no están implementadas:

- Autenticación y gestión de sesiones desde la aplicación.
- Gestión completa de organizaciones y usuarios.
- Catálogo de controles y gestión del SOA.
- Registro y seguimiento de acciones de mejora.
- Repositorio documental.
- Procesamiento e indexación de documentos.
- Asistente documental basado en RAG.
- Dashboard con métricas calculadas a partir de datos reales.

## Arquitectura prevista

La arquitectura parte de una aplicación web desarrollada con React y TypeScript, conectada a Supabase como plataforma backend.

Los principales componentes previstos son:

- **Frontend:** interfaz web para la gestión y consulta de la información.
- **Base de datos:** PostgreSQL para almacenar usuarios, organizaciones, controles, entradas del SOA, acciones y metadatos documentales.
- **Autenticación y autorización:** Supabase Auth y políticas RLS para controlar el acceso a los datos.
- **Almacenamiento documental:** gestión de los documentos autorizados para su consulta.
- **Asistente documental:** sistema RAG para recuperar fragmentos relevantes y generar respuestas fundamentadas en las fuentes disponibles.

La arquitectura y las tecnologías concretas podrán ajustarse durante las pruebas de concepto y el desarrollo.

## Requisitos previos

Para ejecutar el proyecto en un entorno local se necesita:

- Node.js.
- npm.
- Acceso al proyecto de Supabase y sus credenciales públicas de conexión.

## Instalación y ejecución

1. Clonar el repositorio:

   ```bash
   git clone https://github.com/albertoruler/SOA-Manager.git
   cd SOA-Manager
   ```

2. Instalar las dependencias:

   ```bash
   npm install
   ```

3. Crear un archivo `.env.local` en la raíz del proyecto con las variables de entorno necesarias:

   ```env
   VITE_SUPABASE_URL=https://YOUR_PROJECT_REF.supabase.co
   VITE_SUPABASE_ANON_KEY=YOUR_SUPABASE_PUBLISHABLE_KEY
   ```

   Sustituir los valores de ejemplo por la URL del proyecto y su clave publicable de Supabase.

   También se proporciona un archivo `.env.example` como referencia.

4. Iniciar el servidor de desarrollo:

   ```bash
   npm run dev
   ```

   Vite mostrará en la terminal la dirección local desde la que se puede acceder a la aplicación.

## Comandos disponibles

| Comando | Descripción |
|---|---|
| `npm run dev` | Inicia el servidor de desarrollo |
| `npm run build` | Comprueba los tipos de TypeScript y genera la compilación de producción |
| `npm run lint` | Ejecuta ESLint |
| `npm run preview` | Previsualiza localmente la compilación generada |

## Estructura del proyecto

La estructura principal del código fuente es:

```text
SOA-Manager/
├── public/
├── src/
│   ├── lib/
│   │   └── supabase.ts
│   ├── App.tsx
│   ├── App.css
│   ├── index.css
│   └── main.tsx
├── .env.example
├── .gitignore
├── index.html
├── package.json
├── package-lock.json
└── README.md
```

La estructura podrá ampliarse conforme se incorporen nuevos módulos y funcionalidades.

## Hoja de ruta

El desarrollo contempla las siguientes líneas de trabajo:

1. Completar la integración de autenticación y gestión de sesiones.
2. Implementar la gestión de usuarios, organizaciones y permisos.
3. Desarrollar el catálogo de controles y la gestión del SOA.
4. Incorporar el seguimiento de acciones de mejora.
5. Implementar el repositorio documental.
6. Desarrollar el asistente documental basado en RAG.
7. Incorporar métricas y visualizaciones basadas en datos reales.
8. Realizar pruebas funcionales y de seguridad.
9. Evaluar el prototipo y documentar los resultados.

## Consideraciones de seguridad

- Las credenciales y variables de entorno locales no deben incorporarse al repositorio.
- El archivo `.env.local` está excluido del control de versiones.
- La clave publicable de Supabase puede utilizarse en el frontend, pero no sustituye a las políticas de autorización.
- Las operaciones y el acceso a los datos deben estar protegidos mediante mecanismos de seguridad en el backend y políticas RLS.
- No deben incorporarse al repositorio documentos confidenciales ni información sensible de terceros.

## Contexto académico

Este proyecto se desarrolla como parte de la asignatura **Evaluación de Capacidades en la Empresa I**, dentro del Grado en Ingeniería Informática de la Universidad Nebrija, curso académico 2026-2027.

La aplicación constituye un prototipo académico y no pretende certificar automáticamente el cumplimiento de ISO/IEC 27001:2022 ni sustituir las actividades de auditoría, evaluación o gestión de un SGSI.