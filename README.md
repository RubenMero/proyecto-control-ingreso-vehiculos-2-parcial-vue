#  Sistema de Control de Acceso Vehicular ULEAM

Sistema web desarrollado en **Vue.js 3** para la gestión de entrada y salida de vehículos en el campus de la Universidad Laica Eloy Alfaro de Manabí.

##  Características Principales

-  Sistema de autenticación con 3 roles (Admin, Supervisor, Guardia)
-  Registro de ingresos con autocompletado
-  Registro de salidas con cálculo de permanencia en tiempo real
-  Dashboard interactivo con gráficos estadísticos
-  Consulta de historial con filtros avanzados
-  Gestión de vehículos autorizados (CRUD completo)
-  Gestión de usuarios con RBAC
-  Reportes con visualización de datos
-  Responsive design
-  Almacenamiento en LocalStorage

##  Tecnologías Utilizadas

- **Framework:** Vue.js 3 (Composition API)
- **Build Tool:** Vite
- **Router:** Vue Router 4
- **Estado Global:** Pinia
- **Estilos:** CSS3 personalizado
- **Almacenamiento:** LocalStorage (JSON)
- **Validaciones:** JavaScript nativo

##  Instalación

```bash

## Entrar al directorio
cd uleam-parking-system

# Instalar dependencias
npm install

# Ejecutar en modo desarrollo
npm run dev

# Build para producción
npm run build
```

##  Usuarios de Prueba

| Email | Contraseña | Rol |
|-------|-----------|-----|
| admin@uleam.edu.ec | admin12345 | ADMINISTRADOR |
| supervisor@uleam.edu.ec | supervisor12345 | SUPERVISOR |
| guardia@uleam.edu.ec | guardia12345 | GUARDIA |
