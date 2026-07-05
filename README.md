# 🛍️ LumenStore - E-Commerce Platform

A full-stack e-commerce application built with modern web technologies. LumenStore demonstrates a complete implementation of a scalable, secure, and user-friendly online shopping platform.

![Java](https://img.shields.io/badge/Java-17-ED8B00?style=flat-square&logo=java)
![Spring Boot](https://img.shields.io/badge/Spring%20Boot-4.1.0-6DB33F?style=flat-square&logo=spring-boot)
![Angular](https://img.shields.io/badge/Angular-21-DD0031?style=flat-square&logo=angular)
![MySQL](https://img.shields.io/badge/MySQL-8.0-4479A1?style=flat-square&logo=mysql)
![TypeScript](https://img.shields.io/badge/TypeScript-5.9-3178C6?style=flat-square&logo=typescript)
![License](https://img.shields.io/badge/License-MIT-green?style=flat-square)

## 📋 Table of Contents

- [Features](#-features)
- [Architecture](#-architecture)
- [Tech Stack](#-tech-stack)
- [Getting Started](#-getting-started)
- [Project Structure](#-project-structure)
- [API Documentation](#-api-documentation)
- [Key Features](#-key-features-detail)

## ✨ Features

### User Management

- 🔐 Secure user authentication with JWT tokens
- 📝 User registration with email validation
- 👤 User profile management
- 🔑 Password security with Spring Security

### Shopping Features

- 🛒 Shopping cart with add/remove/update functionality
- ❤️ Wishlist management
- 📦 Order management and tracking
- 🏠 Address management for deliveries
- 💳 Checkout process

### Admin Panel

- 📊 Dashboard with key metrics
- 📋 Order management
- 🏷️ Product management
- 👥 User management

### Security & Performance

- JWT-based authentication
- Role-based access control (Admin, User)
- Route guards for protected pages
- Secure API endpoints
- Database migrations with Flyway

## 🏗️ Architecture

```
┌─────────────────────────────────────────────────────┐
│                   Frontend (Angular)                 │
│  ┌─────────────────────────────────────────────┐   │
│  │   Pages: Home, Cart, Checkout, Orders, etc. │   │
│  │   Services: Auth, Product, Cart, Order, etc.│   │
│  │   Guards & Interceptors: JWT, Auth, etc.    │   │
│  └─────────────────────────────────────────────┘   │
└────────────────────┬────────────────────────────────┘
                     │ HTTP/REST
┌────────────────────▼────────────────────────────────┐
│                   Backend (Spring Boot)              │
│  ┌─────────────────────────────────────────────┐   │
│  │   REST API Endpoints                        │   │
│  │   ├── /api/v1/auth (Login, Register)        │   │
│  │   ├── /api/v1/products                      │   │
│  │   ├── /api/v1/orders                        │   │
│  │   ├── /api/v1/cart                          │   │
│  │   ├── /api/v1/users                         │   │
│  │   └── /api/v1/addresses                     │   │
│  │                                              │   │
│  │   Services: Business Logic                  │   │
│  │   Repository: Data Access (JPA)             │   │
│  │   Security: JWT, Role-based access          │   │
│  └─────────────────────────────────────────────┘   │
└────────────────────┬────────────────────────────────┘
                     │ JDBC
┌────────────────────▼────────────────────────────────┐
│                  MySQL Database                     │
│  Tables: users, products, orders, cart,             │
│          addresses, wishlist, order_items, etc.     │
└──────────────────────────────────────────────────────┘
```

## 🛠️ Tech Stack

### Backend

| Technology            | Purpose                        |
| --------------------- | ------------------------------ |
| **Spring Boot 4.1.0** | Web framework & REST API       |
| **Spring Security**   | Authentication & Authorization |
| **Spring Data JPA**   | Database ORM                   |
| **JWT (jjwt)**        | Token-based authentication     |
| **MySQL 8**           | Relational database            |
| **Flyway**            | Database migrations            |
| **Lombok**            | Reduce boilerplate code        |
| **Maven**             | Dependency management          |

### Frontend

| Technology           | Purpose                   |
| -------------------- | ------------------------- |
| **Angular 21**       | Progressive web framework |
| **TypeScript 5.9**   | Type-safe JavaScript      |
| **RxJS 7.8**         | Reactive programming      |
| **SCSS**             | Styling                   |
| **Vitest & Jasmine** | Testing                   |

## 🚀 Getting Started

### Prerequisites

- **Backend**: Java 17+, Maven, MySQL 8
- **Frontend**: Node.js 18+, npm or yarn

### Backend Setup

1. **Navigate to backend directory**

   ```bash
   cd lumenstore-api
   ```

2. **Configure database** - Update `src/main/resources/application.properties` or `application.yml`:

   ```properties
   spring.datasource.url=jdbc:mysql://localhost:3306/lumenstore
   spring.datasource.username=root
   spring.datasource.password=your_password
   spring.jpa.hibernate.ddl-auto=validate
   spring.flyway.enabled=true
   ```

3. **Build and run**

   ```bash
   # Build
   mvn clean install

   # Run
   mvn spring-boot:run
   # or
   java -jar target/lumenstore-api-0.0.1-SNAPSHOT.jar
   ```

   Backend will start at `http://localhost:8080`

### Frontend Setup

1. **Navigate to frontend directory**

   ```bash
   cd lumenstore-web
   ```

2. **Install dependencies**

   ```bash
   npm install
   ```

3. **Configure API endpoint** - Update `src/app/services/api.service.ts`:

   ```typescript
   export const API_URL = "http://localhost:8080/api/v1";
   ```

4. **Start development server**

   ```bash
   npm start
   # or
   ng serve --proxy-config proxy.conf.json
   ```

   Frontend will be available at `http://localhost:4200`

## 📁 Project Structure

### Backend (`lumenstore-api/`)

```
src/main/java/com/lumenstore/
├── controller/          # REST API controllers
├── services/            # Business logic
├── repository/          # Data access layer (JPA)
├── models/              # Entity models
├── dto/                 # Data Transfer Objects
├── config/              # Spring configuration (Security, etc.)
└── LumenstoreApiApplication.java  # Main application class

resources/
├── application.properties  # Configuration
├── application.yml        # Alternative config format
└── db/migration/          # Flyway SQL migrations
```

### Frontend (`lumenstore-web/`)

```
src/app/
├── components/      # Reusable UI components
├── pages/           # Page-level components
│   ├── home/       # Home page
│   ├── product-list/  # Products listing
│   ├── product-detail/  # Product details
│   ├── cart/       # Shopping cart
│   ├── checkout/   # Checkout process
│   ├── orders/     # User orders
│   ├── admin/      # Admin dashboard
│   └── ...
├── services/        # HTTP services (API communication)
│   ├── auth.service.ts      # Authentication
│   ├── product.service.ts   # Products
│   ├── cart.service.ts      # Shopping cart
│   ├── order.service.ts     # Orders
│   └── api.service.ts       # Base API service
├── guards/          # Route guards
│   ├── auth.guard.ts        # Authentication check
│   └── role.guard.ts        # Role-based access
├── interceptors/    # HTTP interceptors
│   └── jwt.interceptor.ts   # JWT token injection
├── models/          # TypeScript interfaces
├── app.routes.ts    # Routing configuration
├── app.config.ts    # Application configuration
└── app.component.ts # Root component
```

## 📚 API Documentation

### Authentication Endpoints

```
POST   /api/v1/auth/login        - User login (returns JWT token)
POST   /api/v1/auth/register     - New user registration
POST   /api/v1/auth/logout       - User logout
GET    /api/v1/auth/validate     - Validate JWT token
```

### Product Endpoints

```
GET    /api/v1/products          - Get all products (with pagination)
GET    /api/v1/products/:id      - Get product by ID
POST   /api/v1/products          - Create product (Admin only)
PUT    /api/v1/products/:id      - Update product (Admin only)
DELETE /api/v1/products/:id      - Delete product (Admin only)
```

### Order Endpoints

```
GET    /api/v1/orders            - Get user's orders
GET    /api/v1/orders/:id        - Get order by ID
POST   /api/v1/orders            - Create new order
PUT    /api/v1/orders/:id        - Update order status (Admin)
```

### Cart Endpoints

```
GET    /api/v1/cart              - Get shopping cart
POST   /api/v1/cart/items        - Add item to cart
PUT    /api/v1/cart/items/:id    - Update cart item
DELETE /api/v1/cart/items/:id    - Remove item from cart
```

### User Endpoints

```
GET    /api/v1/users/me          - Get current user
PUT    /api/v1/users/me          - Update profile
GET    /api/v1/users/:id         - Get user (Admin only)
```

## 🔑 Key Features Detail

### JWT Authentication Flow

1. User submits credentials to `/auth/login`
2. Backend validates credentials and returns JWT token
3. Frontend stores token in localStorage
4. JWT Interceptor automatically attaches token to all API requests
5. Backend validates token on each request
6. Expired tokens trigger automatic logout

### Role-Based Access Control

- **Admin Role**: Full access to management features (products, users, orders)
- **User Role**: Access to shopping and profile features
- Routes are protected with `AuthGuard` and `RoleGuard`

### Database Migrations

- Flyway automatically runs SQL migrations from `db/migration/` folder
- Migrations are versioned (V1_0_0, V1_0_1, etc.)
- Ensures consistent database schema across environments

## 🧪 Testing

### Backend

```bash
cd lumenstore-api
mvn test
```

### Frontend

```bash
cd lumenstore-web
npm test
```

## 📦 Build & Deployment

### Backend

```bash
cd lumenstore-api
mvn clean package
# JAR file will be generated at target/lumenstore-api-0.0.1-SNAPSHOT.jar
```

### Frontend

```bash
cd lumenstore-web
ng build --configuration production
# Build artifacts will be generated in dist/lumenstore-web/
```

## 🔒 Security Considerations

- ✅ Passwords hashed using Spring Security
- ✅ JWT tokens with expiration
- ✅ CORS configured for frontend domain
- ✅ SQL injection protection via JPA parameterized queries
- ✅ CSRF protection enabled
- ✅ Role-based endpoint access control
- ✅ Secure password reset mechanism

## 🎯 Future Enhancements

- [ ] Payment gateway integration (Stripe, PayPal)
- [ ] Email notifications for orders
- [ ] Product reviews and ratings
- [ ] Inventory management
- [ ] Search and filtering optimizations
- [ ] Real-time notifications with WebSockets
- [ ] Docker containerization
- [ ] CI/CD pipeline setup

## 👨‍💻 Development

### Code Style

- **Backend**: Follow Spring conventions, use Lombok for clean code
- **Frontend**: Follow Angular style guide, use TypeScript strict mode

### Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit changes (`git commit -m 'Add amazing feature'`)
4. Push to branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## 📝 License

This project is licensed under the MIT License - see the LICENSE file for details.

## 📞 Contact & Support

For questions or support, please open an issue in the repository.

---

**Built with ❤️ by [Your Name]**

_This project was created to demonstrate full-stack development skills with modern Java and Angular technologies._
