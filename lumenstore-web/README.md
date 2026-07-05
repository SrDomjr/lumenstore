# 🛍️ Lumenstore Web - Angular E-Commerce Frontend

A modern, responsive Angular 18 web application for the Lumenstore e-commerce platform. Fully integrated with the Spring Boot REST API backend.

## ✨ Features

- **User Authentication** - Secure JWT-based login and registration
- **Product Catalog** - Browse, search, and filter products
- **Shopping Cart** - Add, update, and remove items
- **Order Management** - Place orders, track shipments, view order history
- **Wishlist** - Save favorite products for later
- **User Profile** - Manage profile and saved addresses
- **Responsive Design** - Optimized for desktop, tablet, and mobile
- **Real-time Cart Updates** - Instant cart state synchronization

## 🚀 Quick Start

### Prerequisites

- Node.js 18 or higher
- npm or yarn
- Angular CLI 18+

### Installation

```bash
# Navigate to project directory
cd lumenstore-web

# Install dependencies
npm install
```

### Running the Application

```bash
# Development server
npm start
# or
ng serve

# Open http://localhost:4200 in your browser
```

### Building for Production

```bash
npm run build
# or
ng build --configuration production
```

## 📁 Project Structure

```
src/app/
├── models/              # TypeScript interfaces
├── services/            # API services
├── interceptors/        # HTTP interceptors (JWT)
├── guards/              # Route guards (Auth)
├── pages/               # Page components
├── components/          # Reusable components
├── app.routes.ts        # Routing configuration
└── app.config.ts        # App configuration
```

## 🔐 Authentication

- JWT token-based authentication
- Automatic token injection in HTTP requests
- Protected routes with AuthGuard
- Auto-logout on 401 responses

## 📚 API Services

### AuthService

Authentication and user management

### ProductService

Product listing, search, and filtering

### CartService

Shopping cart management with real-time updates

### SaleService

Order creation and management

### AddressService

Customer address CRUD operations

### WishlistService

Wishlist and favorite items management

## 🎨 Styling

- SCSS with CSS variables
- Responsive design (mobile-first)
- Material-inspired color scheme
- Utility classes for common patterns

## 📄 Documentation

See **SETUP.md** for detailed configuration and API documentation.

## 🚀 Development

```bash
# Start dev server
npm start

# Run tests
npm test

# Build for production
npm run build

# Lint code
ng lint
```

## 🔗 API Configuration

Update API URL in `src/app/services/api.service.ts`:

```typescript
export const API_URL = 'http://localhost:8080/api/v1';
```

## 🐛 Troubleshooting

### CORS Errors

Enable CORS on backend:

```java
@CrossOrigin(origins = "http://localhost:4200")
```

### 401 Unauthorized

- Clear localStorage
- Log in again
- Check token expiration

### API Not Responding

- Verify backend is running on port 8080
- Check network connectivity
- Review browser console for errors

## 📦 Dependencies

- Angular 18+
- TypeScript 5+
- SCSS

See package.json for complete dependency list.

## 📞 Support

For detailed setup instructions, see **SETUP.md**

---

**Version**: 1.0.0  
**Status**: Production Ready

To build the project run:

```bash
ng build
```

This will compile your project and store the build artifacts in the `dist/` directory. By default, the production build optimizes your application for performance and speed.

## Running unit tests

To execute unit tests with the [Vitest](https://vitest.dev/) test runner, use the following command:

```bash
ng test
```

## Running end-to-end tests

For end-to-end (e2e) testing, run:

```bash
ng e2e
```

Angular CLI does not come with an end-to-end testing framework by default. You can choose one that suits your needs.

## Additional Resources

For more information on using the Angular CLI, including detailed command references, visit the [Angular CLI Overview and Command Reference](https://angular.dev/tools/cli) page.
