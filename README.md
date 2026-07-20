# LumenStore — Sistema de Gestión Comercial para Tienda en Línea

Plataforma e-commerce full-stack diseñada para la gestión integral de una tienda en línea, desde el catálogo de productos hasta el seguimiento de pedidos, con panel de administración en tiempo real.

---

## Descripción General

LumenStore es un sistema comercial completo que permite a los usuarios explorar productos, gestionar carritos de compras, procesar pedidos y administrar el catálogo desde un panel de control. El sistema está orientado a pequeñas y medianas empresas que necesitan presencia digital con gestión centralizada de inventario, ventas y clientes.

**Problema que resuelve:** Gestión descentralizada de ventas en línea, control manual de inventario y ausencia de métricas de negocio en tiempo real.

**Solución:** Plataforma centralizada con arquitectura REST, autenticación segura por roles y dashboard analítico.

---

## Stack Tecnológico

| Capa         | Tecnología                              | Justificación                                             |
| ------------ | --------------------------------------- | --------------------------------------------------------- |
| Backend      | Java 21, Spring Boot 4.1.0              | Alto rendimiento, ecosistema maduro para APIs REST        |
| Seguridad    | Spring Security + JWT                   | Autenticación stateless, control de acceso por roles      |
| Persistencia | Spring Data JPA + MySQL 8               | ORM robusto, relaciones complejas, integridad referencial |
| Migraciones  | Flyway                                  | Versionado controlado del esquema de base de datos        |
| Frontend     | Angular 21, TypeScript 5.9              | Arquitectura modular, tipado fuerte, reactividad con RxJS |
| Imágenes     | Cloudinary                              | Almacenamiento y optimización de imágenes en la nube      |
| Build        | Maven (backend), Angular CLI (frontend) | Gestión de dependencias y construcción automatizada       |

---

## Arquitectura del Sistema

```
┌─────────────────────────────────────────────────────┐
│              Frontend — Angular 21                   │
│  ┌───────────────────────────────────────────────┐  │
│  │  Vistas: Tienda, Carrito, Checkout, Cuenta    │  │
│  │  Admin: Dashboard, Productos, Ventas, Stock   │  │
│  │  Seguridad: AuthGuard, RoleGuard, JWT         │  │
│  └───────────────────────────────────────────────┘  │
└──────────────────────┬──────────────────────────────┘
                       │ HTTP/REST (JSON)
┌──────────────────────▼──────────────────────────────┐
│              Backend — Spring Boot                   │
│  ┌───────────────────────────────────────────────┐  │
│  │  Controladores REST → Servicios → Repositorios│  │
│  │  Autenticación JWT + Roles (Admin/Usuario)    │  │
│  │  Manejo de excepciones + Validaciones          │  │
│  └───────────────────────────────────────────────┘  │
└──────────────────────┬──────────────────────────────┘
                       │ JDBC
┌──────────────────────▼──────────────────────────────┐
│              MySQL 8 — Base de datos                │
│  usuarios, productos, variantes, categorías,       │
│  pedidos, carrito, direcciones, reseñas, etc.      │
└─────────────────────────────────────────────────────┘
```

---

## Funcionalidades por Módulo

### Módulo Tienda (Cliente)

| Funcionalidad         | Descripción                                                                     |
| --------------------- | ------------------------------------------------------------------------------- |
| Catálogo de productos | Listado con filtros por categoría, precio, marca y búsqueda por texto           |
| Detalle de producto   | Galería de imágenes, variantes (color/talla), precio dinámico, stock disponible |
| Carrito de compras    | Agregar, modificar cantidades, eliminar ítems, cálculo de totales               |
| Checkout              | Selección de dirección, método de pago, confirmación de pedido                  |
| Cuenta de usuario     | Registro, inicio de sesión, perfil, direcciones guardadas                       |
| Lista de deseos       | Guardar y gestionar productos favoritos                                         |
| Reseñas y preguntas   | Opiniones de usuarios y sección de preguntas por producto                       |

### Módulo Administración (Admin)

| Funcionalidad          | Descripción                                                                                               |
| ---------------------- | --------------------------------------------------------------------------------------------------------- |
| Dashboard              | KPIs de ventas del día, pedidos pendientes, nuevos clientes, tasa de conversión, gráfico de ventas 7 días |
| Gestión de productos   | CRUD completo con variantes, imágenes, precios, costos, estados activo/inactivo                           |
| Gestión de ventas      | Listado de pedidos con filtros, cambio de estados (pendiente → pagado → enviado → entregado)              |
| Alertas de stock       | Monitoreo de productos con stock bajo o agotado                                                           |
| Reseñas pendientes     | Moderación de reseñas de clientes                                                                         |
| Categorías y atributos | Organización del catálogo                                                                                 |

### Seguridad y Autenticación

| Componente          | Implementación                                                 |
| ------------------- | -------------------------------------------------------------- |
| Autenticación       | JWT con expiración configurable, refresh token                 |
| Autorización        | Roles `ROLE_admin` y `ROLE_user` con permisos granulares       |
| Protección de rutas | `AuthGuard` (autenticación) y `RoleGuard` (por rol) en Angular |
| Interceptor HTTP    | Inyección automática del token Bearer en cada petición         |
| Contraseñas         | Hash con Spring Security (BCrypt)                              |
| CORS                | Configuración por dominio permitido                            |

---

## Estructura del Código

```
lumenstore/
├── lumenstore-api/                        # Backend
│   └── src/main/java/com/lumenstore/
│       ├── controller/                    # Endpoints REST (ProductoController, SaleController, etc.)
│       ├── services/                      # Lógica de negocio (CloudinaryProductImageService, etc.)
│       ├── repository/                    # Capa de acceso a datos (JPA Repositories)
│       ├── models/                        # Entidades JPA (Producto, Sale, ProductVariant, etc.)
│       ├── dto/                           # DTOs de request/response
│       ├── config/                        # SecurityConfig, CloudinaryConfig, CorsConfig
│       ├── interceptors/                  # JwtInterceptor
│       ├── exception/                     # Excepciones de negocio personalizadas
│       └── resources/
│           ├── application.yml            # Configuración principal
│           ├── application-dev.yml        # Perfil de desarrollo
│           └── db/migration/              # Migraciones Flyway (V1_0_0, V1_0_1, ...)
│
├── lumenstore-web/                        # Frontend
│   └── src/app/
│       ├── pages/                         # Vistas por módulo
│       │   ├── admin/                     # Panel administrativo
│       │   ├── product-detail/            # Detalle de producto
│       │   ├── checkout/                  # Proceso de compra
│       │   └── orders/                    # Pedidos del usuario
│       ├── components/                    # Componentes reutilizables (admin, shared)
│       ├── services/                      # Servicios HTTP (ProductService, SaleService, etc.)
│       ├── guards/                        # AuthGuard, RoleGuard
│       ├── interceptors/                  # JwtInterceptor
│       ├── models/                        # Interfaces TypeScript
│       └── pipes/                         # Pipes (cloudinaryUrl)
│
└── .env.development                       # Variables de entorno (no versionado)
```

---

## Endpoints de la API

### Autenticación

| Método | Endpoint                | Descripción         | Acceso  |
| ------ | ----------------------- | ------------------- | ------- |
| POST   | `/api/v1/auth/login`    | Inicio de sesión    | Público |
| POST   | `/api/v1/auth/register` | Registro de usuario | Público |

### Productos

| Método | Endpoint                       | Descripción         | Acceso  |
| ------ | ------------------------------ | ------------------- | ------- |
| GET    | `/api/v1/products`             | Listado paginado    | Público |
| GET    | `/api/v1/products/{id}`        | Detalle de producto | Público |
| POST   | `/api/v1/products`             | Crear producto      | Admin   |
| PUT    | `/api/v1/products/{id}`        | Actualizar producto | Admin   |
| DELETE | `/api/v1/products/{id}`        | Eliminar producto   | Admin   |
| POST   | `/api/v1/products/{id}/images` | Subir imágenes      | Admin   |

### Ventas y Pedidos

| Método | Endpoint                    | Descripción       | Acceso  |
| ------ | --------------------------- | ----------------- | ------- |
| GET    | `/api/v1/sales`             | Listado de ventas | Admin   |
| GET    | `/api/v1/sales/{id}`        | Detalle de venta  | Admin   |
| POST   | `/api/v1/sales`             | Crear pedido      | Usuario |
| PUT    | `/api/v1/sales/{id}/status` | Cambiar estado    | Admin   |

### Carrito y Compra

| Método | Endpoint                  | Descripción         | Acceso  |
| ------ | ------------------------- | ------------------- | ------- |
| GET    | `/api/v1/cart`            | Obtener carrito     | Usuario |
| POST   | `/api/v1/cart/items`      | Agregar ítem        | Usuario |
| PUT    | `/api/v1/cart/items/{id}` | Actualizar cantidad | Usuario |
| DELETE | `/api/v1/cart/items/{id}` | Eliminar ítem       | Usuario |

---

## Instalación y Ejecución

**Requisitos:** Java 21+, Node.js 18+, MySQL 8+

```bash
# 1. Clonar el repositorio
git clone https://github.com/usuario/lumenstore.git
cd lumenstore

# 2. Backend
cd lumenstore-api
mvn clean install
mvn spring-boot:run

# 3. Frontend (en otra terminal)
cd lumenstore-web
npm install
ng serve
```

**Endpoints locales:**

- Backend API: `http://localhost:8080`
- Frontend: `http://localhost:4200`

Las variables de entorno (base de datos, JWT, Cloudinary) se cargan automáticamente desde `.env.development` al iniciar el backend.

---

## Decisiones Técnicas

| Decisión                      | Alternativa descartada | Razón                                                                      |
| ----------------------------- | ---------------------- | -------------------------------------------------------------------------- |
| Spring Boot + JPA             | Node.js + Express      | Mejor soporte para transacciones, tipado fuerte, ecosistema enterprise     |
| JWT stateless                 | Sesiones HTTP          | Escalabilidad horizontal, desacoplamiento frontend/backend                 |
| Flyway                        | Liquibase              | Sintaxis SQL directa, más ligero, integración nativa con Spring Boot       |
| Cloudinary                    | Almacenamiento local   | CDN global, optimización automática, escalabilidad sin gestión de servidor |
| Angular standalone components | NgModules              | Modularidad moderna, tree-shaking eficiente, menor bundle size             |
| Lazy loading de rutas         | Carga eagerly          | Reducción del bundle inicial, mejor performance percibida                  |

---

## Licencia

MIT
