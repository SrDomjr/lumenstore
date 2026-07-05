# Lumenstore Web - Setup Guide

## 📋 Project Structure

```
lumenstore-web/
├── src/
│   ├── app/
│   │   ├── models/              # TypeScript interfaces and models
│   │   ├── services/            # HTTP services for API communication
│   │   ├── interceptors/        # HTTP interceptors (JWT auth)
│   │   ├── guards/              # Route guards (auth protection)
│   │   ├── pages/               # Page components
│   │   ├── components/          # Reusable components
│   │   ├── app.routes.ts        # Application routing
│   │   ├── app.config.ts        # Application configuration
│   │   └── app.component.ts     # Root component
│   ├── main.ts                  # Entry point
│   ├── index.html               # HTML template
│   └── styles.scss              # Global styles
├── angular.json                 # Angular CLI config
├── tsconfig.json                # TypeScript config
└── package.json                 # Dependencies
```

## 🚀 Getting Started

### 1. Prerequisites

- Node.js 18+
- Angular CLI 18+
- npm or yarn

### 2. Installation

```bash
cd c:\Users\junio\Desktop\lumenstore\lumenstore-web

# Install dependencies
npm install
```

### 3. Configuration

Update the API base URL in `src/app/services/api.service.ts`:

```typescript
export const API_URL = 'http://localhost:8080/api/v1';
```

Make sure your Spring Boot backend is running on `http://localhost:8080`

### 4. Running the Application

```bash
# Development server
npm start
# or
ng serve

# The app will be available at http://localhost:4200
```

### 5. Build for Production

```bash
ng build --configuration production
```

## 🔐 Authentication

### Login Flow

1. User enters credentials
2. Credentials sent to `/auth/login`
3. JWT token received and stored in localStorage
4. Token automatically included in all API requests via JWT Interceptor
5. Routes protected by `AuthGuard`

### Logout

- Clears token from localStorage
- Redirects to login page
- Clears current user data

## 📚 Services Overview

### AuthService

Handles user authentication, registration, and token management.

```typescript
// Login
authService.login({ email, password }).subscribe((response) => console.log(response));

// Register
authService
  .register({ email, password, firstName, lastName })
  .subscribe((response) => console.log(response));

// Logout
authService.logout();

// Check if authenticated
authService.isAuthenticated();
```

### ProductService

Manages product queries and listings.

```typescript
// Get all products
productService.getProducts(page, size).subscribe((products) => console.log(products));

// Get single product
productService.getProductById(id).subscribe((product) => console.log(product));

// Search products
productService.searchProducts(query).subscribe((products) => console.log(products));
```

### CartService

Manages shopping cart operations.

```typescript
// Add to cart
cartService.addToCart(clientId, item).subscribe();

// Update item quantity
cartService.updateCartItem(clientId, itemId, quantity).subscribe();

// Remove from cart
cartService.removeFromCart(clientId, itemId).subscribe();

// Get current cart
cartService.cart$.subscribe((cart) => console.log(cart));
```

### SaleService

Handles order creation and management.

```typescript
// Create sale
saleService.createSale(saleRequest).subscribe((response) => console.log(response));

// Get customer orders
saleService.getSalesByCustomer(customerId).subscribe((orders) => console.log(orders));

// Update order status
saleService.updateSaleStatus(orderId, status).subscribe();
```

### AddressService

Manages customer addresses.

```typescript
// Create address
addressService.createAddress(customerId, address).subscribe();

// Get customer addresses
addressService.getAddressesByCustomer(customerId).subscribe((addresses) => console.log(addresses));

// Update address
addressService.updateAddress(customerId, addressId, address).subscribe();

// Delete address
addressService.deleteAddress(customerId, addressId).subscribe();
```

### WishlistService

Manages wishlists and favorite products.

```typescript
// Create wishlist
wishlistService.createWishlist(customerId, wishlist).subscribe();

// Add product to wishlist
wishlistService.addProductToWishlist(customerId, wishlistId, productId).subscribe();

// Remove from wishlist
wishlistService.removeProductFromWishlist(customerId, wishlistId, productId).subscribe();
```

## 📄 API Endpoints

### Authentication

- `POST /auth/login` - User login
- `POST /auth/register` - User registration
- `POST /auth/refresh` - Refresh JWT token
- `GET /auth/login-history` - Get login history

### Products

- `GET /products` - List products (paginated)
- `GET /products/:id` - Get product details
- `GET /products/category/:categoryId` - Products by category
- `GET /products/brand/:brandId` - Products by brand
- `GET /products/search?q=query` - Search products
- `GET /products/trending` - Trending products
- `GET /products/new` - New arrivals
- `GET /products/discounted` - Discounted products

### Sales/Orders

- `POST /sales` - Create order
- `GET /sales/:id` - Get order details
- `GET /sales/customer/:customerId` - Customer orders
- `GET /sales/status/:status` - Orders by status
- `PATCH /sales/:id/status` - Update order status

### Cart

- `GET /carrito/cliente/:clienteId` - Get cart
- `POST /carrito/cliente/:clienteId/items` - Add item
- `PATCH /carrito/cliente/:clienteId/items/:itemId` - Update item
- `DELETE /carrito/cliente/:clienteId/items/:itemId` - Remove item

### Wishlists

- `POST /customers/:customerId/wishlists` - Create wishlist
- `GET /customers/:customerId/wishlists` - List wishlists
- `GET /customers/:customerId/wishlists/:wishlistId` - Get wishlist
- `POST /customers/:customerId/wishlists/:wishlistId/products/:productId` - Add product
- `DELETE /customers/:customerId/wishlists/:wishlistId/products/:productId` - Remove product

### Addresses

- `POST /customers/:customerId/addresses` - Create address
- `GET /customers/:customerId/addresses` - List addresses
- `GET /customers/:customerId/addresses/:addressId` - Get address
- `PUT /customers/:customerId/addresses/:addressId` - Update address
- `DELETE /customers/:customerId/addresses/:addressId` - Delete address

## 🎨 Styling

The project uses SCSS for styling. Global styles are in `src/styles.scss`.

Each component can have its own SCSS file: `component.component.scss`

### Color Scheme

- Primary: `#667eea` (Purple)
- Secondary: `#764ba2` (Dark Purple)
- Danger: `#dc3545` (Red)
- Success: `#28a745` (Green)

## 🔒 Security

### JWT Interceptor

Automatically:

- Adds JWT token to request headers
- Handles 401 unauthorized responses
- Clears token on auth failure

### Auth Guard

Protects routes that require authentication:

- Checks if user is logged in
- Redirects to login if not authenticated
- Passes returnUrl for redirect after login

## 📱 Responsive Design

The application uses a mobile-first approach with CSS Grid and Flexbox:

- Mobile screens: 320px+
- Tablet: 768px+
- Desktop: 1024px+

## 🐛 Troubleshooting

### CORS Issues

If you see CORS errors, ensure your Spring Boot backend has CORS enabled:

```java
@CrossOrigin(origins = "http://localhost:4200")
```

### 401 Unauthorized Errors

- Check if token is stored in localStorage
- Verify token hasn't expired
- Try logging in again

### API Not Responding

- Ensure Spring Boot application is running on port 8080
- Check `API_URL` in `api.service.ts`
- Verify network connectivity

## 📦 Build & Deployment

### Development Build

```bash
ng build --configuration development
```

### Production Build

```bash
ng build --configuration production
```

### Deploy to Web Server

1. Build the application: `ng build --configuration production`
2. Copy contents of `dist/lumenstore-web` to web server
3. Configure web server to redirect all routes to `index.html`

### Deploy to Docker

Create a `Dockerfile`:

```dockerfile
# Build stage
FROM node:18-alpine AS builder
WORKDIR /app
COPY package*.json ./
RUN npm ci
COPY . .
RUN npm run build

# Runtime stage
FROM nginx:alpine
COPY --from=builder /app/dist/lumenstore-web /usr/share/nginx/html
EXPOSE 80
CMD ["nginx", "-g", "daemon off;"]
```

Build and run:

```bash
docker build -t lumenstore-web .
docker run -p 80:80 lumenstore-web
```

## 📞 Support & Contributions

For issues or contributions, please refer to the main project documentation.

---

**Last Updated**: 2026-07-02
**Version**: 1.0.0
**Status**: Development
