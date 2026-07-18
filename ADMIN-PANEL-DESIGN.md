# Lumenstore — Panel de Administración: Diseño UI/UX y Arquitectura

> **Inspiración visual:** H&M / Minimalismo Escandinavo  
> **Estilo:** Plano, tipográfico, sin sombras densas, contenido protagónico  
> **Paleta base:** Blanco puro (#FFFFFF), Gris humo (#F5F5F5, #E8E8E8, #999999), Negro absoluto (#111111), Acentos sutiles (#C7A97E — dorado, #2E7D32 — verde éxito apagado, #C62828 — rojo alerta sutil).  
> **Tipografía:** Inter / Helvetica Neue — sistema sans-serif limpio, pesos 400 (regular) para cuerpo, 600 (semibold) para títulos, 700 (bold) solo para KPIs y alertas.

---

## Índice

1. [Panel de Control (Dashboard)](#1-panel-de-control-dashboard)
2. [Ventas, Comprobantes y Logística](#2-módulo-de-ventas-comprobantes-y-logística)
3. [Catálogo y Gestión de Variantes](#3-módulo-de-catálogo-y-gestión-de-variantes)
4. [Inventario y Kardex](#4-módulo-de-inventario-y-kardex)
5. [Marketing, Cupones y Banners](#5-módulo-de-marketing-cupones-y-banners)
6. [Clientes y Atención (Reseñas/Preguntas)](#6-módulo-de-clientes-y-atención)
7. [Seguridad, RBAC y Auditoría](#7-módulo-de-seguridad-rbac-y-auditoría)
8. [Configuración del Sistema](#8-módulo-de-configuración-del-sistema-settings)
9. [Layout Global y Navegación](#9-layout-global-y-navegación)

---

## 1. Panel de Control (Dashboard)

### 1.1 Vistas y Componentes UI

| Componente                           | Descripción                                                                                                                                                                                                                                                                            |
| ------------------------------------ | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **KPI Cards**                        | Tarjetas de métrica clave con tipografía grande (48px bold). Cada tarjeta muestra: valor numérico, label descriptivo (16px regular, #666), indicador de tendencia (↑ verde / ↓ rojo / → neutro) en 14px. Sin sombras — solo borde inferior de 2px color gris humo.                     |
| **Gráfico de Ingresos (Line Chart)** | Lienzo con gráfico lineal de 7 días. Línea negra (#111) de 1.5px. Sin relleno (fill: false). Puntos con borde negro y centro blanco. Tooltips minimalistas con fondo negro, texto blanco, sin esquinas redondeadas. Sin leyenda visible. Eje X sin grid, eje Y con grid sutil #F0F0F0. |
| **Tabla de Órdenes Recientes**       | Tabla compacta de 5 columnas: N° Pedido, Cliente, Fecha, Total, Estado. Bordes horizontales finos (1px #E8E8E8). Celdas de estado con badges: pending = borde negro texto negro, completed = texto verde éxito, cancelled = texto rojo sutil.                                          |
| **Widget de Alertas de Stock**       | Lista compacta de variantes con stock por debajo del umbral (`stock_alerts.threshold`). Cada item muestra: nombre producto, talla/color, stock actual (bold rojo si es crítico), botón "Ajustar stock" que abre el modal de ajuste rápido.                                             |
| **Cola de Reseñas Pendientes**       | Pequeña tabla de reseñas no aprobadas (`is_approved = false`). Columnas: Producto, Cliente, Rating (estrellas tipográficas ★), Extracto, Botón "Aprobar" de un clic.                                                                                                                   |

### 1.2 Flujo UX y Buenas Prácticas

- **Jerarquía visual escandinava:** Los KPIs ocupan la fila superior (4 columnas en desktop). Debajo, el gráfico de ingresos ocupa 2/3 del ancho y la tabla de órdenes recientes el 1/3 restante. Tercera fila: alertas de stock + cola de reseñas lado a lado.
- **Accesos rápidos:** En la parte superior derecha del dashboard, botón "Nueva venta" que redirige al módulo de ventas con modal de creación rápida. Botón "Agregar producto" que abre el modal `quick-create-modal.component.ts` existente.
- **Actualización en tiempo real:** Las tarjetas KPI deben tener un indicador visual de "última actualización" (texto 11px #999: "Actualizado hace 2 min"). Botón de recarga manual en la esquina superior derecha.
- **Responsivo:** En tablet, el gráfico y la tabla de órdenes se apilan verticalmente. En mobile, los KPIs pasan a 2×2 en vez de 1×4.

### 1.3 Reglas de Negocio Aplicadas a las Tablas

- **Cálculo de `sales.total` en KPI "Ventas de hoy":** El backend debe ejecutar `SELECT COALESCE(SUM(total), 0) FROM sales WHERE DATE(created_at) = CURDATE() AND status NOT IN ('cancelled', 'refunded')`. Esto asegura que solo ventas válidas contribuyan al indicador.
- **Conteo de alertas activas en `stock_alerts`:** `SELECT COUNT(*) FROM stock_alerts sa JOIN product_variants pv ON sa.variant_id = pv.id WHERE sa.is_active = TRUE AND pv.stock <= sa.threshold`. La UI debe mostrar este número en el KPI o en el widget correspondiente.
- **Cola de aprobación `product_reviews`:** `SELECT pr.*, p.name AS product_name, c.first_name, c.last_name FROM product_reviews pr JOIN products p ON pr.product_id = p.id JOIN customers c ON pr.customer_id = c.id WHERE pr.is_approved = FALSE`. La acción "Aprobar" ejecuta `UPDATE product_reviews SET is_approved = TRUE WHERE id = :id`.

---

## 2. Módulo de Ventas, Comprobantes y Logística

### 2.1 Vistas y Componentes UI

#### Vista: Listado de Ventas (`/admin/sales`)

| Componente              | Descripción                                                                                                                                                                                                                         |
| ----------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **Data Table maestro**  | Tabla con 8 columnas: N° Pedido, Cliente, Fecha, Total (S/.), Método de Pago, Estado Venta, Estado Pago, Acciones. Fila clickeable abre detalle.                                                                                    |
| **Filtros compactos**   | Barra de filtros en línea: búsqueda por order_number (text input 180px), select de estado (6 opciones), select de método de pago, date range picker minimalista (dos inputs de fecha lado a lado). Botón "Limpiar filtros" en gris. |
| **Badges de estado**    | `pending` = borde y texto #111, `paid` = texto #2E7D32, `processing` = texto #C7A97E, `shipped` = texto #1565C0, `delivered` = texto #2E7D32 bold, `cancelled` = texto #C62828 tachado, `refunded` = texto #C62828.                 |
| **Botón "Nueva Venta"** | Botón primario (fondo negro, texto blanco, padding 10px 24px, sin border-radius). Abre modal de creación rápida que permite seleccionar cliente, productos (con buscador), y generar venta.                                         |

#### Vista: Detalle de Venta (`/admin/sales/:id`)

| Componente                 | Descripción                                                                                                                                                                                                                                                                                                                          |
| -------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| **Encabezado de orden**    | Order number como título (24px bold). Estado como badge grande al lado. Fecha de creación (12px #999). Botones de acción (editar, cancelar, reenviar).                                                                                                                                                                               |
| **Timeline de estado**     | Línea de tiempo vertical estilo "Logística de Moda": círculos de 12px conectados por línea vertical delgada (#E8E8E8). Cada estado (pending → paid → processing → shipped → delivered) es un paso. El paso actual se marca con círculo relleno negro. Los pasos futuros están en gris claro (#CCC). Timestamps al lado de cada paso. |
| **Sección de Productos**   | Tabla de `sale_details`: Imagen miniatura del producto (48×48), Nombre + Variante (talla/color), SKU, Cantidad, Precio Unitario, Subtotal.                                                                                                                                                                                           |
| **Sección de Cliente**     | Card de datos del cliente: Nombre completo, Email, Teléfono. Dirección de envío con icono de ubicación.                                                                                                                                                                                                                              |
| **Sección de Pago**        | Card de transacción: Método, Transaction ID, Monto, Estado (badge). Si el pago está pendiente, botón "Registrar pago manual".                                                                                                                                                                                                        |
| **Sección de Envío**       | Card de tracking: Compañía (carrier), N° de tracking (linkeable si existe URL de tracking), Estado del envío (timeline interno compacto con 4 pasos: pending, in_transit, delivered, returned). Botón "Actualizar tracking".                                                                                                         |
| **Sección de Comprobante** | Card de voucher: Tipo (Boleta / Factura), Serie y Número. Botón "Descargar PDF" (link a `vouchers.pdf_url`). Si es Factura, muestra el RUC/DNI del cliente (requerido — ver regla de negocio).                                                                                                                                       |

### 2.2 Flujo UX y Buenas Prácticas

- **Timeline como navegador de estados:** En el detalle de venta, la línea de tiempo no es solo informativa — el administrador puede hacer clic en el siguiente paso disponible para avanzar el estado. Ej: Si está en "paid", puede clickear "processing" y se abre un modal de confirmación: "¿Marcar pedido #1005 como 'En preparación'?". Esto reduce fricción.
- **Prevención de errores en acciones críticas:** Cancelar una venta requiere doble confirmación: modal "¿Estás seguro?" con advertencia "Se revertirá el stock de todos los productos". El botón de confirmación es rojo (#C62828) con texto "Sí, cancelar venta".
- **Flujo de facturación:** Si el tipo de voucher es 'factura', el formulario de venta debe validar que el cliente tenga RUC/DNI registrado ANTES de permitir completar la venta. El campo se marca como obligatorio con un asterisco rojo.
- **Tracking de envío actualizable:** El botón "Actualizar tracking" abre un modal con campos: Compañía (dropdown: Olva, Shalom, Serpost, DHL, etc.), N° de seguimiento, y Estado del envío. Al guardar, se actualiza `shipments.tracking_number`, `shipments.carrier`, `shipments.shipped_at` o `delivered_at` según corresponda.
- **Diseño responsivo:** En mobile, el layout de detalle cambia a una sola columna apilada: Timeline → Productos → Cliente → Pago → Envío → Comprobante.

### 2.3 Reglas de Negocio Aplicadas a las Tablas

- **Regla de validación: Venta → Shipped requiere pago completado**
  - Validación backend: Antes de permitir `UPDATE sales SET status = 'shipped' WHERE id = :id`, se debe ejecutar:
    ```sql
    SELECT COUNT(*) FROM payment_transactions
    WHERE sale_id = :id AND status = 'completed';
    ```
    Si el contador es 0, el backend retorna error 422: "No se puede enviar un pedido sin pago completado."
  - UX: En la timeline, el paso "shipped" aparece deshabilitado (cursor not-allowed, gris) si `payment_transactions.status` no es 'completed'. Tooltip: "Requiere pago completado."

- **Regla de reversión de stock al cancelar venta**
  - Trigger automático al ejecutar `UPDATE sales SET status = 'cancelled'`:
    1. Leer todas las `sale_details` de la venta:
       ```sql
       SELECT variant_id, quantity FROM sale_details WHERE sale_id = :id;
       ```
    2. Para cada registro, insertar movimiento de reversión en `inventory_movements`:
       ```sql
       INSERT INTO inventory_movements (variant_id, quantity, movement_type, reference_id, notes, created_by)
       VALUES (:variant_id, :quantity, 'return', :sale_id, 'Reversión por cancelación de venta', :admin_id);
       ```
    3. Actualizar stock en `product_variants`:
       ```sql
       UPDATE product_variants SET stock = stock + :quantity WHERE id = :variant_id;
       ```
  - UX: Al cancelar venta, el modal de confirmación muestra: "Se revertirán N unidades al inventario." Esto da visibilidad al administrador de lo que sucederá.

- **Validación estricta de tipo de comprobante (`vouchers.voucher_type`)**
  - Si `voucher_type = 'factura'`, el cliente asociado a `sales.customer_id` debe tener al menos una dirección con datos fiscales válidos (RUC). El frontend debe validar esto antes de permitir guardar la venta.
  - Si `voucher_type = 'boleta'`, no se requiere RUC, pero se debe registrar DNI del cliente.
  - Regla SQL de validación: Al intentar insertar un voucher tipo 'factura', el backend verifica:
    ```sql
    SELECT c.id FROM customers c
    JOIN addresses a ON a.customer_id = c.id
    WHERE c.id = :customer_id AND a.address_type IN ('billing', 'both')
    AND (a.street IS NOT NULL AND TRIM(a.street) != '');
    ```
    Si no hay dirección de facturación, rechazar la operación con error: "Cliente no tiene dirección de facturación registrada."

- **Restricción de único comprobante por venta:** Validar que no exista ya un voucher para `sale_id` antes de insertar: `SELECT COUNT(*) FROM vouchers WHERE sale_id = :id`. Si > 0, rechazar inserción (una venta no puede tener dos comprobantes del mismo tipo).

---

## 3. Módulo de Catálogo y Gestión de Variantes

### 3.1 Vistas y Componentes UI

#### Vista: Listado de Productos (`/admin/catalog/products`)

| Componente                      | Descripción                                                                                                                                                                                                                                                                              |
| ------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **Grid de productos**           | Layout de cards en grid (4 columnas desktop, 2 tablet, 1 mobile). Cada card muestra: imagen principal (`product_images.is_main = TRUE`), nombre del producto (16px semibold), SKU (12px #999), precio desde (rango de variantes), botón de acción rápida (editar, duplicar, desactivar). |
| **Search bar**                  | Input de búsqueda con icono de lupa, placeholder "Buscar por nombre, SKU...". Auto-suggest con resultados mientras se escribe (debounce 300ms).                                                                                                                                          |
| **Filtros laterales (sidebar)** | Panel colapsable a la izquierda con: filtro por categoría (checkboxes jerárquicos), marca (checkboxes), estado (Activo/Inactivo), featured (sí/no).                                                                                                                                      |
| **Vista alternativa: Tabla**    | Toggle para cambiar a vista de tabla con columnas: Imagen (mini 40×40), Nombre, SKU, Categoría, Marca, Variantes (cantidad), Stock total, Precios (rango), Estado (badge), Acciones.                                                                                                     |

#### Vista: Editor de Producto (`/admin/catalog/products/:id/edit`)

| Componente                           | Descripción                                                                                                                                                                                                                                                                                                                                                                                                                        |
| ------------------------------------ | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **Formulario de información básica** | Sección con campos: Nombre (input), Slug (autogenerado + editable manualmente), Descripción (rich text editor minimalista — sin botones excesivos), Descripción corta (textarea), Marca (dropdown), Categoría (dropdown jerárquico con indentación para subcategorías).                                                                                                                                                            |
| **Gestor de Variantes (Matriz)**     | **Componente clave del núcleo H&M.** Tabla matriz donde las filas son tallas (`sizes.name`) y las columnas son colores (`colors.name`). Cada celda contiene: input de precio (número), input de stock (número), toggle de activo. Las celdas vacías (talla/color no disponibles) se marcan con una "—" gris. Los encabezados de colores muestran un círculo de 16px con el `colors.hex_code`. Botón "Añadir talla/color" al final. |
| **Gestor de Imágenes**               | Área de upload con drag-and-drop (zona punteada con borde 2px #E8E8E8, hover se vuelve #111). Cada imagen subida se muestra como thumbnail con: orden (número), indicador "Principal" (estrella dorada), botón de eliminar (×), alt text input. Reordenable por drag & drop.                                                                                                                                                       |
| **Precio y Descuento**               | Campos lado a lado: Precio de venta (`price`) y Precio de comparación (`compare_at_price`). Si `compare_at_price > price`, se muestra automáticamente un badge "DESCUENTO" en dorado (#C7A97E) con el porcentaje calculado. Si `compare_at_price <= price`, se muestra advertencia en rojo sutil: "El precio de comparación debe ser mayor al precio de venta".                                                                    |
| **SEO / Metadatos**                  | Panel colapsable con campos: Meta título, Meta descripción, Tags (multi-select con autocomplete que busca en `tags.name`).                                                                                                                                                                                                                                                                                                         |
| **Historial de Precios**             | Tabla pequeña al final que muestra `product_price_history`: Fecha, Precio anterior, Precio nuevo. Solo lectura.                                                                                                                                                                                                                                                                                                                    |

#### Vistas Adicionales: Categorías, Marcas, Atributos

- **Categorías (`/admin/catalog/categories`):** Tree view anidado (usando `parent_id`). Cada categoría muestra: nombre, slug, imagen, toggle activo, orden. Drag & drop para reposicionar (actualiza `sort_order`). Modal de edición simple con nombre, slug autogenerado, descripción, imagen, categoría padre (dropdown tree).
- **Marcas (`/admin/catalog/brands`):** Lista simple con cards que muestran logo (izquierda), nombre, slug, toggle activo. Modal de edición: nombre, slug autogenerado, descripción, logo upload.
- **Atributos (`/admin/catalog/attributes`):** Gestión de tallas y colores. Tallas: lista con nombre y orden de visualización (drag to reorder). Colores: lista con nombre, selector de color (input type=color que muestra el `hex_code` en vivo) y preview del color.

### 3.2 Flujo UX y Buenas Prácticas

- **Autogeneración inteligente de slugs:** Mientras el administrador escribe el nombre del producto, el slug se autogenera en tiempo real (transformando a lowercase, reemplazando espacios con guiones, eliminando caracteres especiales). El usuario puede sobrescribir manualmente el slug, pero al perder el foco del campo nombre, se regenera automáticamente si el slug no fue editado manualmente (flag `slugManuallyEdited`).
- **Matriz de variantes como núcleo visual:** Inspirado en cómo H&M presenta sus productos (misma prenda en múltiples colores y tallas), la matriz de variantes permite al administrador ver de un vistazo qué combinaciones existen. Las celdas vacías indican combinaciones no disponibles. Al hacer clic en una celda vacía, se añade automáticamente la variante con precio sugerido (hereda el precio base del producto).
- **Drag-and-drop de imágenes con feedback visual:** Al arrastrar una imagen, las demás se desplazan para mostrar el hueco donde caerá. Al soltar, se actualiza `sort_order` de todas las imágenes. La imagen con `is_main = TRUE` tiene una estrella dorada y no puede ser movida a una posición no-principal sin primero designar otra como principal.
- **Vista previa del producto:** Botón "Vista previa" en la parte superior derecha del editor que abre un modal con el producto renderizado como se vería en la tienda (usando el componente `product-card.component.ts` existente).
- **Prevención de errores en slug duplicado:** El backend valida unicidad de `slug` en `products`, `categories` y `brands` antes de insertar/actualizar. Si hay conflicto, se añade sufijo numérico (ej: "camisa-blanca-2"). El frontend muestra sugerencia: "El slug 'camisa-blanca' ya existe. ¿Usar 'camisa-blanca-2'?"
- **Auto-save con indicador:** Cada 30 segundos, si hay cambios no guardados, se autoguarda el formulario y aparece un indicador verde "Guardado" por 2 segundos.

### 3.3 Reglas de Negocio Aplicadas a las Tablas

- **Autogeneración de slug (URL-friendly)**
  - Frontend: función JavaScript que aplica:
    ```javascript
    const generateSlug = (text) =>
      text
        .toLowerCase()
        .trim()
        .replace(/[^\w\s-]/g, "") // elimina caracteres especiales
        .replace(/\s+/g, "-") // espacios a guiones
        .replace(/-+/g, "-") // múltiples guiones a uno
        .replace(/^-+|-+$/g, ""); // guiones al inicio/final
    ```
  - Backend: Antes de INSERT/UPDATE en `products`, `categories`, `brands`, verificar unicidad:
    ```sql
    SELECT COUNT(*) FROM products WHERE slug = :slug AND (:id IS NULL OR id != :id);
    ```
    Si count > 0, añadir sufijo numérico incremental.

- **Validación de `compare_at_price` para descuentos válidos**
  - Regla: `compare_at_price` solo se considera un descuento válido si `compare_at_price > price`.
  - Backend (Java/Spring):
    ```java
    if (variant.getCompareAtPrice() != null
        && variant.getCompareAtPrice().compareTo(variant.getPrice()) <= 0) {
      // No es un descuento válido — se almacena pero no se marca como descuento en frontend
      // Opcional: lanzar advertencia si strict mode está activo
    }
    ```
  - Frontend: Si `compare_at_price <= price`, mostrar input de `compare_at_price` con borde rojo sutil y mensaje: "El precio de comparación debe ser mayor al precio de venta para mostrar un descuento. Si se deja así, no se mostrará como oferta."
  - Cálculo de descuento: `discount_percentage = Math.round((1 - price/compare_at_price) * 100)`. Solo se muestra si > 0.

- **Relación producto-categoría obligatoria**
  - `products.category_id` es NOT NULL. El formulario de producto debe requerir selección de categoría antes de guardar.
  - Si se elimina una categoría con productos asociados (`ON DELETE SET NULL` en la FK), el backend debe ejecutar una validación previa: `SELECT COUNT(*) FROM products WHERE category_id = :id;` y mostrar advertencia al administrador: "Hay X productos en esta categoría. Al eliminar la categoría, estos productos quedarán sin categoría asignada." Permitir reasignación masiva antes de eliminar.

- **Unicidad de variante (talla + color por producto)**
  - La BD tiene `UNIQUE KEY unique_variant (product_id, size_id, color_id)`. El gestor de matriz de variantes debe prevenir duplicados en frontend: al intentar crear una variante con combinación existente, mostrar error: "Ya existe una variante para esta combinación de talla y color."
  - Al cargar el editor, la matriz se construye desde la query:
    ```sql
    SELECT pv.id, s.name AS size_name, c.name AS color_name, c.hex_code,
           pv.price, pv.compare_at_price, pv.stock, pv.is_active, pv.sku
    FROM product_variants pv
    LEFT JOIN sizes s ON pv.size_id = s.id
    LEFT JOIN colors c ON pv.color_id = c.id
    WHERE pv.product_id = :productId
    ORDER BY s.sort_order, c.name;
    ```

- **Imagen principal única por producto**
  - Al marcar una imagen como `is_main = TRUE`, el backend debe ejecutar:
    ```sql
    UPDATE product_images SET is_main = FALSE WHERE product_id = :productId;
    UPDATE product_images SET is_main = TRUE WHERE id = :imageId;
    ```
  - Esto asegura que solo una imagen sea la principal. Alternativamente, se puede manejar en una sola transacción.

---

## 4. Módulo de Inventario y Kardex

### 4.1 Vistas y Componentes UI

#### Vista: Panel de Inventario (`/admin/inventory`)

| Componente                            | Descripción                                                                                                                                                                                                      |
| ------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **Data Table de Variantes con Stock** | Tabla con columnas: Imagen miniatura (48×48), Producto, Variante (talla + color), SKU, Stock Actual, Stock Mínimo (threshold de `stock_alerts`), Estado (Normal / Bajo / Crítico / Sin Stock).                   |
| **Indicadores de estado de stock**    | Barra de color a la izquierda de cada fila: verde (#2E7D32) si stock > 2× threshold, amarillo (#C7A97E) si stock entre threshold y 2× threshold, rojo (#C62828) si stock < threshold, negro (#111) si stock = 0. |
| **Columna de alertas**                | Si `stock_alerts.is_active = TRUE` y `stock <= threshold`, mostrar icono de campana (🔔) en rojo. Si no hay alerta configurada, mostrar texto gris "Sin alerta" con botón "+ Configurar".                        |
| **Botón "Ajustar Stock"**             | Botón en cada fila que abre el modal de ajuste rápido.                                                                                                                                                           |
| **Filtros de inventario**             | Filtros: Por estado de stock (Todos / Normal / Bajo / Crítico / Sin Stock), por producto (búsqueda), por categoría.                                                                                              |

#### Modal: Ajuste Rápido de Stock

| Componente                                | Descripción                                                                                                                                                                                                                        |
| ----------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **Cabecera del modal**                    | Producto + Variante seleccionada. Stock actual en grande (24px bold).                                                                                                                                                              |
| **Formulario de ajuste**                  | Campos: Tipo de movimiento (dropdown: `adjustment`, `damage`, `purchase`, `return`), Cantidad (input numérico con signo: positivo para entrada, negativo para salida), Razón (textarea).                                           |
| **Vista previa del resultado**            | Texto: "Stock actual: 12 → Stock después del ajuste: 15" (si cantidad = +3). Si el resultado es negativo, se resalta en rojo con advertencia.                                                                                      |
| **Checkbox de "Permitir stock negativo"** | Solo visible si la configuración del sistema lo permite (`settings.setting_key = 'allow_negative_stock'`). Si no está habilitado y el ajuste resultaría en stock negativo, el botón "Guardar" se deshabilita con mensaje de error. |

#### Vista: Kardex (Historial de Movimientos)

| Componente                    | Descripción                                                                                                                                                                                                                                                                                 |
| ----------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **Data Table de movimientos** | Tabla con: Fecha/Hora, Producto + Variante, Tipo (badge con color según tipo: purchase=verde, sale=azul, return=gris, adjustment=negro, damage=rojo), Cantidad (verde si positivo, rojo si negativo), Stock Resultante (calculado), Realizado por (`created_by` nombre del usuario), Notas. |
| **Filtros de kardex**         | Por rango de fechas, por tipo de movimiento, por producto/variante.                                                                                                                                                                                                                         |
| **Exportable a CSV**          | Botón "Exportar" que descarga el kardex filtrado como CSV.                                                                                                                                                                                                                                  |

### 4.2 Flujo UX y Buenas Prácticas

- **Interfaz de auditoría limpia:** El kardex debe ser visto como un libro contable. Cada movimiento es inmutable (no se puede editar ni eliminar). El diseño es plano, con bordes finos y tipografía monoespaciada para cantidades numéricas.
- **Alertas visibles sin ser agresivas:** El rojo se usa con moderación. Una fila con stock crítico no tiene fondo rojo — solo una pequeña barra izquierda roja de 3px y el texto del stock en bold rojo. Esto mantiene la estética limpia de H&M.
- **Flujo de ajuste con confirmación:** Al hacer un ajuste, el modal muestra claramente el stock antes y después. Si la cantidad es negativa (salida), se pide razón obligatoria en el campo notas. Botón de guardar con texto "Registrar movimiento" (no solo "Guardar").
- **Prevención de stock negativo (por defecto):** Si `allow_negative_stock` es `false` (default), y el administrador intenta un ajuste que lleve el stock a negativo, el frontend muestra inmediatamente el error sin necesidad de llamar al backend: "Stock insuficiente. El resultado sería -3 unidades." Esto es validación UX preventiva.
- **Relación con ventas:** Los movimientos de tipo 'sale' se generan automáticamente al crear una venta (no manualmente). El administrador solo crea movimientos de tipo adjustment, damage, purchase o return.

### 4.3 Reglas de Negocio Aplicadas a las Tablas

- **Registro obligatorio de `created_by` en `inventory_movements`**
  - Backend: El campo `created_by` es NOT NULL a nivel de aplicación (aunque la BD permite NULL). Cada INSERT en `inventory_movements` debe incluir el ID del administrador autenticado (obtenido del JWT/security context).
  - Spring Boot:
    ```java
    @PrePersist
    public void prePersist() {
      if (this.createdBy == null) {
        Authentication auth = SecurityContextHolder.getContext().getAuthentication();
        User currentUser = (User) auth.getPrincipal();
        this.createdBy = currentUser.getId();
      }
    }
    ```
  - Esto garantiza pista de auditoría completa: quién, cuándo, qué movimiento.

- **Validación de stock negativo según configuración del sistema**
  - Backend - antes de procesar un ajuste de inventario:

    ```java
    // 1. Verificar si la configuración permite stock negativo
    Setting negativeStockSetting = settingsRepository
        .findBySettingKey("allow_negative_stock");
    boolean allowNegative = Boolean.parseBoolean(
        negativeStockSetting != null ? negativeStockSetting.getSettingValue() : "false");

    // 2. Si no está permitido y el ajuste resulta en negativo, rechazar
    ProductVariant variant = variantRepository.findById(variantId).orElseThrow();
    int newStock = variant.getStock() + quantity;  // quantity puede ser negativo
    if (!allowNegative && newStock < 0) {
      throw new BusinessRuleException(
        "El ajuste resultaría en stock negativo (" + newStock + ") y la configuración del sistema no lo permite."
      );
    }
    ```

  - El frontend replica esta validación antes de enviar la solicitud para UX inmediata.

- **Registro automático en `product_price_history` ante cambios de precio**
  - Si al editar una variante se modifica `price` o `compare_at_price`, el backend debe automáticamente insertar un registro en `product_price_history`:
    ```java
    if (!oldVariant.getPrice().equals(newVariant.getPrice())) {
      ProductPriceHistory history = new ProductPriceHistory();
      history.setVariantId(variant.getId());
      history.setOldPrice(oldVariant.getPrice());
      history.setNewPrice(newVariant.getPrice());
      history.setChangedAt(Timestamp.valueOf(LocalDateTime.now()));
      priceHistoryRepository.save(history);
    }
    ```

---

## 5. Módulo de Marketing, Cupones y Banners

### 5.1 Vistas y Componentes UI

#### Vista: Descuentos (`/admin/marketing/discounts`)

| Componente                                 | Descripción                                                                                                                                                                      |
| ------------------------------------------ | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **Lista de descuentos**                    | Tabla con columnas: Nombre, Tipo (% / S/.), Valor, Vigencia (rango de fechas), Estado (badge: Activo/Inactivo/Expirado/Programado), Productos asociados (cantidad), Acciones.    |
| **Formulario de descuento (modal/página)** | Campos: Nombre, Descripción, Tipo (radio: porcentaje o monto fijo), Valor, Fecha inicio (`starts_at`), Fecha fin (`ends_at`), Selector de productos (multi-select con búsqueda). |
| **Productos asociados**                    | Tabla dentro del formulario mostrando productos seleccionados con imagen y nombre. Botón "Agregar productos" abre modal de búsqueda.                                             |

#### Vista: Cupones (`/admin/marketing/coupons`)

| Componente                     | Descripción                                                                                                                                                                                             |
| ------------------------------ | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **Lista de cupones**           | Tabla con columnas: Código (monospace, uppercase), Tipo, Valor, Mínimo de compra, Usos (used_count / usage_limit), Vigencia, Estado.                                                                    |
| **Formulario de cupón**        | Campos: Código (input que automáticamente convierte a uppercase — CSS `text-transform: uppercase` + JS toUpperCase), Tipo, Valor, Mínimo de compra, Fecha inicio, Fecha fin, Límite de usos (opcional). |
| **Indicador de cupón agotado** | Si `used_count >= usage_limit`, el cupón se muestra con badge "AGOTADO" en rojo y toggle `is_active` deshabilitado. Tooltip: "Este cupón ha alcanzado su límite de usos."                               |

#### Vista: Banners (`/admin/marketing/banners`)

| Componente                           | Descripción                                                                                                                                                                                                       |
| ------------------------------------ | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **Grid de banners (Lookbook style)** | Layout de tarjetas visuales estilo H&M lookbook. Cada card muestra la imagen del banner en grande (con overlay sutil al hover), título, subtítulo, posición (badge), estado (activo/inactivo), fecha de vigencia. |
| **Formulario de banner**             | Upload de imagen con preview en vivo (drag-and-drop o click). Campos: Título, Subtítulo, URL de destino, Posición (dropdown: home_top, home_middle, category, sidebar), Fecha inicio, Fecha fin, Orden (número).  |
| **Vista previa de programación**     | Línea de tiempo que muestra los banners activos en el tiempo. Eje X = tiempo, tarjetas de banner posicionadas según su `starts_at` y `ends_at`. Ayuda a visualizar overlaps.                                      |

### 5.2 Flujo UX y Buenas Prácticas

- **Mayúsculas automáticas en código de cupón:** El input del código de cupón tiene CSS `text-transform: uppercase` y en el modelo se forza a mayúsculas con `coupon.code = coupon.code.toUpperCase()`. Esto previene confusiones entre "DESCUENTO10" y "descuento10".
- **Validación de fechas en tiempo real:** Al seleccionar `starts_at` y `ends_at`, el frontend valida inmediatamente que `starts_at < ends_at`. Si no es así, el campo `ends_at` se resalta en rojo con mensaje "La fecha de finalización debe ser posterior a la fecha de inicio".
- **Cupón agotado automáticamente:** El backend debe ejecutar un trigger antes de cada validación de cupón en checkout:
  ```sql
  IF (used_count >= usage_limit AND usage_limit IS NOT NULL) THEN
    UPDATE coupons SET is_active = FALSE WHERE id = :id;
  END IF;
  ```
  En el panel admin, si `used_count >= usage_limit`, el toggle de activo se deshabilita automáticamente y se muestra badge "AGOTADO". El admin puede re-activar manualmente si aumenta el `usage_limit`.
- **Vista de programación de campañas:** El grid de banners se organiza en una vista tipo "calendar" que muestra qué campañas están activas en qué fechas. Inspirado en cómo H&M programa sus colecciones por temporada.
- **Prevención de eliminación de descuentos activos:** Si un descuento está actualmente activo (fecha vigente y `is_active = TRUE`), al intentar eliminarlo se muestra advertencia: "Este descuento está actualmente activo. ¿Estás seguro de eliminarlo? Los productos perderán el descuento inmediatamente."

### 5.3 Reglas de Negocio Aplicadas a las Tablas

- **Validación de fechas: `starts_at` debe ser menor que `ends_at`**
  - Backend:
    ```java
    if (discount.getStartsAt() != null && discount.getEndsAt() != null
        && !discount.getStartsAt().before(discount.getEndsAt())) {
      throw new InvalidDateRangeException("starts_at debe ser anterior a ends_at");
    }
    // Misma validación para coupons y banners
    ```
  - BD: Se podría agregar un CHECK CONSTRAINT opcional: `CHECK (starts_at < ends_at)`.

- **Bloqueo automático de cupón por límite de usos**
  - Backend - antes de aplicar un cupón en una venta:
    ```java
    Coupon coupon = couponRepository.findByCode(code).orElseThrow();
    if (coupon.getUsageLimit() != null && coupon.getUsedCount() >= coupon.getUsageLimit()) {
      // Auto-desactivar
      coupon.setIsActive(false);
      couponRepository.save(coupon);
      throw new CouponExhaustedException("El cupón ha alcanzado su límite de usos");
    }
    ```
  - Al usar un cupón exitosamente, incrementar el contador:
    ```sql
    UPDATE coupons SET used_count = used_count + 1 WHERE id = :id;
    ```

- **Regla de descuento y precio: superposición de descuentos**
  - Las reglas de negocio deben definir si un producto puede tener simultáneamente un descuento (vía `product_discounts`) y un cupón aplicado. Recomendación: No permitir acumulación de descuento de producto + cupón porcentual. El backend debe validar: si ya existe un `product_discounts` activo para el producto, el cupón solo puede ser de tipo 'fixed' (monto fijo), o viceversa.

---

## 6. Módulo de Clientes y Atención

### 6.1 Vistas y Componentes UI

#### Vista: Listado de Clientes (`/admin/customers`)

| Componente                 | Descripción                                                                                                                                                          |
| -------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **Data Table de clientes** | Columnas: Nombre completo, Email, Teléfono, Fecha de registro (created_at), Total gastado (calculado de `sales.total`), Órdenes (cantidad), Última compra, Acciones. |
| **Filtros**                | Búsqueda por nombre/email/teléfono. Filtro por rango de fechas de registro.                                                                                          |
| **Acciones rápidas**       | Botones en cada fila: "Ver perfil", "Nueva orden para este cliente" (abre modal de creación de venta con cliente preseleccionado).                                   |

#### Vista: Perfil de Cliente (`/admin/customers/:id`)

| Componente               | Descripción                                                                                                                                                                          |
| ------------------------ | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| **Encabezado de perfil** | Nombre grande (24px), email, teléfono, fecha de registro. Badge de "Cliente frecuente" si tiene más de 5 órdenes.                                                                    |
| **Tabs de secciones**    | Pestañas planas (sin borde inferior grueso, solo texto con peso semibold y subrayado de 2px negro para la activa): Órdenes, Direcciones, Reseñas, Preguntas.                         |
| **Órdenes del cliente**  | Tabla de ventas del cliente con columnas: N° Pedido, Fecha, Total, Estado (badge), Acciones.                                                                                         |
| **Direcciones**          | Lista de tarjetas de dirección: Calle, Ciudad, Estado, Código Postal, País. Badge "Predeterminada" si `is_default = TRUE`. Badge "Facturación"/"Envío"/"Ambos" según `address_type`. |
| **Reseñas del cliente**  | Lista de reseñas con: Producto (link), Rating (estrellas), Título, Comentario (truncado a 100 caracteres), Estado (aprobado/pendiente), Fecha.                                       |

#### Vista: Moderación de Reseñas (`/admin/reviews`)

| Componente                                        | Descripción UX de doble columna                                                                                                                                                                                                                                                                |
| ------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **Panel izquierdo (Lista de reseñas pendientes)** | Lista vertical de tarjetas pequeñas mostrando: Nombre del producto (bold), Nombre del cliente (12px #666), Rating (estrellas), Extracto del comentario (2 líneas), Fecha. La tarjeta activa tiene borde izquierdo negro de 3px.                                                                |
| **Panel derecho (Editor de respuesta / Detalle)** | Parte superior: Reseña completa con rating grande (estrellas tipográficas de 24px), título, comentario completo, fecha. Parte inferior: Botón "Aprobar" (fondo negro, texto blanco) y botón "Rechazar" (borde rojo, texto rojo). Si ya está aprobada, botón "Desaprobar" (borde gris).         |
| **Sección de respuesta del administrador**        | Textarea para escribir respuesta pública a la reseña. Botón "Publicar respuesta" que aparece solo si la reseña está aprobada. La respuesta se almacena en `product_reviews.answer` (aunque el schema actual no tiene ese campo — se requeriría migración para agregar `reply` y `replied_at`). |

#### Vista: Moderación de Preguntas (`/admin/questions`)

| Componente                                             | Descripción UX de doble columna                                                                                                                                                                                                                                                           |
| ------------------------------------------------------ | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **Panel izquierdo (Lista de preguntas sin responder)** | Similar a reseñas: tarjetas con producto, cliente, pregunta (truncada), fecha.                                                                                                                                                                                                            |
| **Panel derecho (Editor de respuesta)**                | Parte superior: Pregunta completa del cliente (en un bloque con fondo gris #F5F5F5, texto en itálica). Parte inferior: Textarea para la respuesta del administrador + Botón "Responder" (fondo negro). Al responder, se actualiza `answered_at` y el estado visual cambia a "Respondido". |

### 6.2 Flujo UX y Buenas Prácticas

- **Vista de doble columna para moderación eficiente:** El layout tipo "bandeja de entrada" (inspirado en Gmail/H&M Customer Service) permite al administrador navegar rápidamente entre reseñas/preguntas sin perder contexto. Al hacer clic en una reseña de la izquierda, la derecha se actualiza al instante (sin recarga de página — SPA).
- **Aprobación de reseñas con un solo clic:** Desde la lista de reseñas pendientes (tanto en el dashboard como en el módulo de moderación), hay un botón "✓ Aprobar" que ejecuta la acción inmediatamente sin abrir el detalle. La tarjeta se desvanece con una animación sutil y aparece un toast verde "Reseña aprobada".
- **Prevención de respuestas duplicadas:** Si `answered_at` no es NULL (pregunta ya respondida), el textarea de respuesta se reemplaza por el texto de la respuesta existente + botón "Editar respuesta". Al editar, se actualiza `answered_at` con el nuevo timestamp.
- **Perfil de cliente 360:** La vista de perfil centraliza toda la información del cliente en un solo lugar, permitiendo al equipo de atención resolver consultas sin cambiar entre pantallas.
- **Búsqueda global de clientes:** En la barra de navegación del admin, hay un search global que permite buscar clientes por nombre, email o teléfono desde cualquier pantalla, con autocomplete.

### 6.3 Reglas de Negocio Aplicadas a las Tablas

- **Restricción CHECK de rating (1 a 5 estrellas)**
  - La BD tiene `rating TINYINT NOT NULL CHECK (rating BETWEEN 1 AND 5)`.
  - Frontend: El selector de rating usa estrellas tipográficas (★) que cambian de color al hacer clic. El valor se valida antes de enviar: si rating < 1 o > 5, mostrar error "El rating debe estar entre 1 y 5 estrellas".
  - Backend: Validación adicional por seguridad:
    ```java
    if (review.getRating() < 1 || review.getRating() > 5) {
      throw new ValidationException("Rating debe estar entre 1 y 5");
    }
    ```

- **Actualización automática de `answered_at` en `product_questions`**
  - Al responder una pregunta, el backend ejecuta:
    ```sql
    UPDATE product_questions
    SET answer = :answer,
        answered_at = CURRENT_TIMESTAMP
    WHERE id = :id;
    ```
  - Frontend: Después de la respuesta exitosa, la pregunta en la lista izquierda cambia instantáneamente a estado "Respondido" (badge verde con check) y `answered_at` se muestra como "Respondido hace X min".
  - Si se edita la respuesta, `answered_at` se actualiza al nuevo timestamp.

- **Restricción: Una reseña por producto por cliente**
  - Aunque el schema actual no tiene UNIQUE KEY en (product_id, customer_id), debe implementarse a nivel de aplicación para evitar reseñas duplicadas:
    ```sql
    SELECT COUNT(*) FROM product_reviews
    WHERE product_id = :productId AND customer_id = :customerId;
    ```
    Si count > 0, rechazar nueva reseña con mensaje: "Ya has dejado una reseña para este producto."

---

## 7. Módulo de Seguridad, RBAC y Auditoría

### 7.1 Vistas y Componentes UI

#### Vista: Gestión de Roles (`/admin/security/roles`)

| Componente                  | Descripción                                                                                                                    |
| --------------------------- | ------------------------------------------------------------------------------------------------------------------------------ |
| **Lista de roles**          | Tabla con columnas: Nombre del rol (bold), Descripción, Usuarios asignados (cantidad), Permisos (cantidad), Fecha de creación. |
| **Modal de edición de rol** | Campos: Nombre (input), Descripción (textarea).                                                                                |

#### Vista: Matriz de Permisos (`/admin/security/roles/:id/permissions`)

| Componente                    | Descripción UI de Matriz                                                                                                                                                                                                                                       |
| ----------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **Encabezado de matriz**      | Nombre del rol como título (20px). Subtítulo: "Asigna permisos a este rol".                                                                                                                                                                                    |
| **Tabla matriz (Checkboxes)** | Filas = Módulos (agrupaciones lógicas de permisos: "Productos", "Ventas", "Usuarios", "Configuración", etc.). Columnas = Acciones (Crear, Leer, Actualizar, Eliminar). Cada celda es un checkbox cuadrado (18×18, borde 2px #CCC, checked = fondo negro #111). |
| **Select All por fila**       | Checkbox en la primera columna de cada fila que selecciona/deselecciona todos los permisos del módulo.                                                                                                                                                         |
| **Select All global**         | Checkbox en la esquina superior izquierda de la matriz que selecciona todos los permisos.                                                                                                                                                                      |
| **Tooltip de permiso**        | Al hacer hover sobre un checkbox, tooltip con la descripción del permiso (de `permissions.description`).                                                                                                                                                       |

#### Vista: Gestión de Usuarios Administradores (`/admin/security/users`)

| Componente                        | Descripción                                                                                                                                 |
| --------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------- |
| **Data Table de usuarios staff**  | Columnas: Usuario, Email, Roles (badge por rol), Último acceso, Activo (toggle), Acciones.                                                  |
| **Formulario de usuario (modal)** | Campos: Username, Email, Contraseña (con requisitos de seguridad: 8+ caracteres, mayúscula, número), Roles (multi-select), Activo (toggle). |
| **Advertencia de protección**     | Los usuarios admin no pueden auto-eliminarse ni despojarse del rol 'admin'. (Ver regla de negocio).                                         |

#### Vista: Historial de Auditoría (`/admin/security/audit-logs`)

| Componente                    | Descripción                                                                                                                                                                                                                                                                                                                                     |
| ----------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **Data Table de auditoría**   | Columnas: Fecha/Hora, Usuario, Acción (badge), Entidad (tipo + ID), IP Address, Acciones (Ver detalle).                                                                                                                                                                                                                                         |
| **Filtros de auditoría**      | Por rango de fechas, por usuario (dropdown), por acción (dropdown), por entidad.                                                                                                                                                                                                                                                                |
| **Modal de detalle con Diff** | Modal de doble panel: Izquierda "Valores Anteriores" (`old_values` JSON), Derecha "Valores Nuevos" (`new_values` JSON). El JSON se renderiza en formato "diff" legible: las líneas eliminadas aparecen en rojo con strikethrough, las líneas añadidas en verde. Usar un componente tipo JSON diff viewer pero minimalista (sin sombras, plano). |

#### Vista: Historial de Inicios de Sesión (`/admin/security/login-history`)

| Componente                            | Descripción                                                                                         |
| ------------------------------------- | --------------------------------------------------------------------------------------------------- |
| **Data Table**                        | Columnas: Fecha/Hora, Usuario, IP Address, User Agent (truncado), Éxito (✓ verde / ✕ rojo).         |
| **Detección de actividad sospechosa** | Si un usuario tiene múltiples intentos fallidos consecutivos, la fila se marca con icono de alerta. |

### 7.2 Flujo UX y Buenas Prácticas

- **Matriz de permisos visual e intuitiva:** En lugar de una lista interminable de checkboxes, la matriz agrupada por módulos permite al administrador comprender rápidamente qué permisos tiene cada rol. El diseño plano con checkboxes negros sigue la estética H&M.
- **Prevención de bloqueo del sistema:** El sistema protege activamente contra la auto-eliminación de permisos críticos. Si un administrador intenta desmarcar su propio permiso de "admin" o "users.manage", el frontend muestra un modal de advertencia antes de permitir la acción. En el backend, la validación es absoluta.
- **Diff human-readable:** El visor de `audit_logs.old_values` y `new_values` no muestra JSON crudo. En su lugar, renderiza un diff visual:
  - `old_values`: `{"price": 100.00, "stock": 10}` → se muestra como "Precio: S/. 100.00 (tachado rojo)", "Stock: 10 (tachado rojo)"
  - `new_values`: `{"price": 120.00, "stock": 8}` → "Precio: S/. 120.00 (verde)", "Stock: 8 (verde)"
  - Esto requiere un parser que mapee las keys de JSON a labels legibles (ej: "price" → "Precio", "stock" → "Stock").
- **Búsqueda y filtrado en auditoría:** Dado que `audit_logs` puede crecer rápidamente, es obligatorio el uso de paginación server-side (cursor o offset) y filtros por fecha y usuario. La tabla nunca carga más de 50 registros a la vez.
- **Roles predefinidos con seed data:** El sistema debe venir con roles por defecto: `admin` (todos los permisos), `manager` (gestión de productos, ventas, inventario, sin permisos de seguridad), `support` (solo clientes, reseñas y preguntas), `viewer` (solo lectura dashboard y reportes).

### 7.3 Reglas de Negocio Aplicadas a las Tablas

- **Protección del usuario admin (id=1 o rol='admin')**
  - Backend - prevención de auto-eliminación:

    ```java
    // Antes de eliminar un usuario
    User targetUser = userRepository.findById(targetId).orElseThrow();
    Authentication auth = SecurityContextHolder.getContext().getAuthentication();
    User currentUser = (User) auth.getPrincipal();

    if (targetUser.getId().equals(currentUser.getId())) {
      throw new SelfModificationException("No puedes eliminarte a ti mismo");
    }

    // Verificar si es el último administrador
    if (hasRole(targetUser, "admin")) {
      long adminCount = userRepository.countByRoleName("admin");
      if (adminCount <= 1) {
        throw new LastAdminException("Debe haber al menos un administrador en el sistema");
      }
    }
    ```

  - Frontend: El botón "Eliminar" no aparece en la fila del usuario actual. Para usuarios con rol admin, el botón de eliminar tiene un icono de candado si es el último admin.
  - Prevención de despojo de permisos:
    ```java
    // Antes de actualizar roles de un usuario
    if (targetUser.getId().equals(currentUser.getId())
        && hasRole(targetUser, "admin")
        && !hasRole(updatedUser, "admin")) {
      throw new SelfModificationException("No puedes quitarte el rol de administrador a ti mismo");
    }
    ```

- **Registro obligatorio en `audit_logs` para acciones críticas**
  - Definir AOP (Aspect-Oriented Programming) o middleware que intercepte métodos de servicio y registre automáticamente en `audit_logs`:

    ```java
    @Auditable(action = "UPDATE_PRODUCT", entityType = "Product")
    public Product updateProduct(Long id, ProductDTO dto) { ... }

    // El aspecto genera:
    // INSERT INTO audit_logs (user_id, action, entity_type, entity_id, old_values, new_values, ip_address)
    // VALUES (:userId, 'UPDATE_PRODUCT', 'Product', :id, :oldJson, :newJson, :ip);
    ```

  - Acciones que deben auditarse obligatoriamente:
    - CRUD en `products`, `categories`, `brands`, `product_variants`
    - Cambios de estado en `sales` (especialmente cancelled, refunded)
    - Creación/eliminación de usuarios y cambios de roles
    - Cambios en `settings`
    - Aprobación/rechazo de reseñas

- **Historial de inicios de sesión (`login_history`)**
  - Cada intento de inicio de sesión (éxito o fallo) debe registrar una fila en `login_history`:

    ```java
    @EventListener
    public void onAuthenticationSuccess(AuthenticationSuccessEvent event) {
      User user = (User) event.getAuthentication().getPrincipal();
      loginHistoryRepository.save(new LoginHistory(user.getId(), getClientIP(), getUserAgent(), true));
    }

    @EventListener
    public void onAuthenticationFailure(AuthenticationFailureBadCredentialsEvent event) {
      String username = (String) event.getAuthentication().getPrincipal();
      User user = userRepository.findByUsername(username).orElse(null);
      if (user != null) {
        loginHistoryRepository.save(new LoginHistory(user.getId(), getClientIP(), getUserAgent(), false));
        // Si hay más de 5 fallos consecutivos, marcar alerta
      }
    }
    ```

---

## 8. Módulo de Configuración del Sistema (Settings)

### 8.1 Vistas y Componentes UI

#### Vista: Configuración General (`/admin/settings`)

| Componente                | Descripción                                                                                                                                                     |
| ------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **Navegación por tabs**   | Pestañas planas (estilo H&M): General, Pagos, Envíos, Inventario, SEO. La pestaña activa tiene subrayado negro de 2px. Sin iconos, solo texto en 14px semibold. |
| **Formularios dinámicos** | Cada pestaña contiene un formulario con campos que se renderizan dinámicamente según el `setting_key` y el tipo de `setting_value`.                             |

#### Pestaña: General

| Campo               | Setting Key      | Tipo        | Descripción                    |
| ------------------- | ---------------- | ----------- | ------------------------------ |
| Nombre de la tienda | `store_name`     | Texto       | Nombre comercial de lumenstore |
| Email de contacto   | `store_email`    | Email       | Correo de contacto principal   |
| Teléfono            | `store_phone`    | Teléfono    | Número de atención al cliente  |
| Dirección           | `store_address`  | Texto largo | Dirección fiscal/principal     |
| Moneda              | `store_currency` | Select      | Soles, Dólares, Euros          |
| Impuesto (%)        | `tax_percentage` | Número      | Porcentaje de impuesto general |

#### Pestaña: Pagos

| Campo                   | Setting Key       | Tipo           | Descripción                              |
| ----------------------- | ----------------- | -------------- | ---------------------------------------- |
| Métodos de pago activos | `payment_methods` | Multi-checkbox | card, transfer, cash, paypal, yape, plin |
| Comisión Yape/PLIN (%)  | `yape_plin_fee`   | Número         | Comisión por pago digital                |
| Modo de pago            | `payment_mode`    | Radio          | "Producción" / "Prueba" (sandbox)        |

#### Pestaña: Envíos

| Campo                   | Setting Key               | Tipo         | Descripción                    |
| ----------------------- | ------------------------- | ------------ | ------------------------------ |
| Costo de envío nacional | `shipping_national_cost`  | Número       | Tarifa plana nacional          |
| Envío gratis desde      | `free_shipping_threshold` | Número       | Monto mínimo para envío gratis |
| Ciudades con envío      | `shipping_cities`         | JSON (array) | Lista de ciudades disponibles  |

#### Pestaña: Inventario

| Campo                        | Setting Key               | Tipo   | Descripción                                     |
| ---------------------------- | ------------------------- | ------ | ----------------------------------------------- |
| Permitir stock negativo      | `allow_negative_stock`    | Toggle | Si se permite stock menor a 0                   |
| Umbral de alerta por defecto | `default_stock_threshold` | Número | Valor por defecto para `stock_alerts.threshold` |

#### Pestaña: SEO

| Campo                        | Setting Key               | Tipo        | Descripción            |
| ---------------------------- | ------------------------- | ----------- | ---------------------- |
| Meta título por defecto      | `seo_default_title`       | Texto       | Título SEO global      |
| Meta descripción por defecto | `seo_default_description` | Texto largo | Descripción SEO global |
| Google Analytics ID          | `ga_tracking_id`          | Texto       | ID de seguimiento      |

### 8.2 Flujo UX y Buenas Prácticas

- **Campos dinámicos según tipo de `setting_value`:** El componente no tiene campos hardcodeados. En lugar de eso, el backend devuelve la configuración con metadata de tipo:
  ```json
  [
    {
      "key": "store_name",
      "value": "Lumenstore",
      "type": "text",
      "label": "Nombre de la tienda"
    },
    {
      "key": "tax_percentage",
      "value": "18",
      "type": "number",
      "label": "Impuesto (%)"
    },
    {
      "key": "allow_negative_stock",
      "value": "false",
      "type": "boolean",
      "label": "Stock negativo"
    },
    {
      "key": "shipping_cities",
      "value": "[\"Lima\",\"Arequipa\"]",
      "type": "json",
      "label": "Ciudades"
    }
  ]
  ```
  El frontend renderiza el input apropiado según `type`: text, number, email, boolean (toggle switch), select, json (textarea con validación JSON).
- **Guardado con confirmación visual:** Al guardar, el botón muestra "Guardando..." con un spinner minimalista (sin animaciones cargadas, solo un punto que late). Al completarse, el botón muestra "✓ Guardado" en verde por 2 segundos.
- **Campos convalidados en tiempo real:** Email se valida con regex, número se valida como rango, JSON se valida con `JSON.parse()` antes de enviar.
- **Confirmación antes de cambios críticos:** Si se cambia `allow_negative_stock` de false a true, aparece modal de confirmación: "¿Estás seguro? Permitir stock negativo puede afectar la integridad de tu inventario. Esta acción quedará registrada en auditoría."
- **Layout responsivo:** En desktop, los campos se muestran en 2 columnas. En mobile, en 1 columna.

### 8.3 Reglas de Negocio Aplicadas a las Tablas

- **Cada cambio en `settings` debe disparar una fila en `audit_logs`**
  - Implementación: Interceptor/Service AOP:
    ```java
    @Transactional
    public Setting updateSetting(String key, String newValue) {
      Setting setting = settingRepository.findBySettingKey(key);
      String oldValue = setting.getSettingValue();

      setting.setSettingValue(newValue);
      Setting saved = settingRepository.save(setting);

      // Registrar en audit_logs
      AuditLog log = new AuditLog();
      log.setUserId(getCurrentUserId());
      log.setAction("UPDATE_SETTING");
      log.setEntityType("Setting");
      log.setOldValues("{\"setting_value\": \"" + escapeJson(oldValue) + "\"}");
      log.setNewValues("{\"setting_value\": \"" + escapeJson(newValue) + "\"}");
      auditLogRepository.save(log);

      return saved;
    }
    ```
  - El frontend no necesita hacer nada especial — el backend se encarga del registro automático.

- **Validación de tipos de `setting_value`**
  - Backend: Antes de guardar, validar que el valor sea del tipo esperado:
    ```java
    SettingMetadata metadata = getSettingMetadata(settingKey);
    switch (metadata.getType()) {
      case "number":
        try { Double.parseDouble(newValue); } catch (NumberFormatException e) {
          throw new ValidationException("El valor debe ser numérico");
        }
        break;
      case "boolean":
        if (!Arrays.asList("true", "false").contains(newValue.toLowerCase())) {
          throw new ValidationException("El valor debe ser true/false");
        }
        break;
      case "json":
        try { new ObjectMapper().readTree(newValue); } catch (JsonProcessingException e) {
          throw new ValidationException("El valor debe ser JSON válido");
        }
        break;
    }
    ```

- **Cache de configuración:** Las settings se leen con frecuencia (en cada request de tienda). Implementar cache en Redis o en memoria con invalidación al actualizar:

  ```java
  @CacheEvict(value = "settings", key = "#settingKey")
  public Setting updateSetting(String settingKey, String newValue) { ... }

  @Cacheable(value = "settings", key = "#settingKey")
  public String getSettingValue(String settingKey) { ... }
  ```

---

## 9. Layout Global y Navegación

### 9.1 Estructura del Layout del Admin

```
┌──────────────────────────────────────────────────┐
│  Barra Superior (Header)                         │
│  Logo Lumenstore | Search Global | Notif | User  │
├──────────┬───────────────────────────────────────┤
│ Sidebar  │  Main Content Area                    │
│ (240px)  │  (flex: 1)                            │
│          │                                       │
│ 📊 Dash  │  [Breadcrumb]                         │
│ 🛒 Ventas │                                       │
│ 📦 Catálogo  │  Content of the active module     │
│   ▸ Prod.│                                       │
│   ▸ Cat. │                                       │
│   ▸ Mar. │                                       │
│ 📋 Inv.  │                                       │
│ 📢 Mkt.  │                                       │
│ 👥 Clientes│                                       │
│ 🔒 Seg. │                                       │
│ ⚙️ Config│                                       │
│          │                                       │
│          │                                       │
├──────────┴───────────────────────────────────────┤
│  Footer (opcional, información de versión)       │
└──────────────────────────────────────────────────┘
```

### 9.2 Componentes Globales

- **Sidebar:** Panel lateral de 240px de ancho, fondo blanco, borde derecho 1px #E8E8E8. Ítems de navegación con icono (SVG inline, 18×18) + texto (14px). Ítem activo: texto bold negro con barra izquierda negra de 3px. Sub-ítems colapsables (ej: Catálogo → Productos, Categorías, Marcas, Atributos). Scroll independiente si hay muchos módulos.
- **Header:** Altura 64px. Logo a la izquierda (texto "LUMENSTORE" en bold 18px, tracking 2px). Barra de búsqueda global en el centro (placeholder "Buscar productos, clientes, órdenes..."). Icono de notificaciones (campana con contador rojo) a la derecha. Avatar del usuario (círculo 32px con iniciales).
- **Breadcrumb:** Debajo del header, sobre el contenido. Estilo: "Admin / Ventas / #1005" con separador "/" en gris. El último ítem es bold negro.
- **Notificaciones:** Dropdown desde el icono de campana que muestra las últimas 10 notificaciones de `notifications` (tipo info, success, warning, error). Cada notificación con icono según tipo, título, mensaje, timestamp relativo ("hace 5 min"). Al hacer clic en una no-leída, se marca como `is_read = TRUE`.

### 9.3 Sistema de Diseño (Design Tokens)

```scss
// Colores
$color-white: #ffffff;
$color-black: #111111;
$color-gray-50: #f5f5f5;
$color-gray-100: #e8e8e8;
$color-gray-200: #cccccc;
$color-gray-300: #999999;
$color-gray-400: #666666;
$color-gold: #c7a97e;
$color-success: #2e7d32;
$color-error: #c62828;
$color-info: #1565c0;

// Tipografía
$font-family: "Inter", "Helvetica Neue", sans-serif;
$font-size-xs: 11px;
$font-size-sm: 12px;
$font-size-base: 14px;
$font-size-md: 16px;
$font-size-lg: 20px;
$font-size-xl: 24px;
$font-size-xxl: 32px;
$font-size-kpi: 48px;

// Espaciado (espacio en blanco escandinavo)
$spacing-xs: 4px;
$spacing-sm: 8px;
$spacing-md: 16px;
$spacing-lg: 24px;
$spacing-xl: 32px;
$spacing-xxl: 48px;

// Bordes
$border-radius: 0px; // Sin bordes redondeados (flat design)
$border-thin: 1px solid $color-gray-100;
$border-medium: 2px solid $color-gray-200;

// Sombras (mínimas)
$shadow-none: none;
$shadow-subtle: 0 1px 3px rgba(0, 0, 0, 0.04);
```

### 9.4 Componentes Reutilizables (Biblioteca UI)

| Componente        | Descripción                                                                                                                                                                                            |
| ----------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| **Button**        | Variantes: Primary (bg #111, text white), Secondary (border #111, text #111), Ghost (text #111, no bg/hover bg #F5F5F5), Danger (border #C62828, text #C62828). Sin border-radius. Padding: 10px 24px. |
| **Input**         | Borde 1px #CCC, altura 40px, padding 12px, placeholder #999. Focus: borde #111. Sin border-radius. Label arriba en 12px #666.                                                                          |
| **Select**        | Mismo estilo que input. Flecha custom SVG (no nativa del browser).                                                                                                                                     |
| **Toggle Switch** | Track 36×20px, thumb 16px círculo. Off: track #CCC, thumb white. On: track #111, thumb white. Transición suave de 200ms.                                                                               |
| **Badge**         | Padding 4px 8px, font-size 11px, font-weight 600. Variantes por estado (ver tabla de estados en cada módulo). Sin border-radius.                                                                       |
| **Table**         | Bordes horizontales 1px #E8E8E8. Header: bg #F5F5F5, text 12px uppercase, tracking 1px, color #666. Rows: hover bg #FAFAFA. Sin border-radius.                                                         |
| **Modal**         | Overlay negro 50% opacidad. Panel blanco centrado (max-width 720px). Sin border-radius. Header con título 18px bold + botón ×. Padding 24px.                                                           |
| **Toast**         | Notificación temporal: bg #111, text white, 14px. Aparece desde arriba con slide down. Duración 3s. Sin border-radius.                                                                                 |
| **Card**          | Borde 1px #E8E8E8. Padding 20px. Sin sombras. Hover: borde #111 (para cards clickeables).                                                                                                              |
| **Tab**           | Pestañas planas: texto 14px semibold, color #999. Activa: color #111 con borde inferior 2px #111. Contenido separado por 1px #E8E8E8.                                                                  |

---

## Apéndice: Mapa de Rutas del Admin Panel

| Ruta                               | Módulo                     | Componente                       |
| ---------------------------------- | -------------------------- | -------------------------------- |
| `/admin/dashboard`                 | Dashboard                  | `AdminDashboardComponent`        |
| `/admin/sales`                     | Ventas - Listado           | `AdminSalesListComponent`        |
| `/admin/sales/:id`                 | Ventas - Detalle           | `AdminSalesDetailComponent`      |
| `/admin/orders`                    | Pedidos - Listado          | `AdminOrdersComponent`           |
| `/admin/orders/:id`                | Pedidos - Detalle          | `AdminOrderDetailComponent`      |
| `/admin/catalog/products`          | Catálogo - Productos       | `AdminProductsComponent`         |
| `/admin/catalog/products/new`      | Catálogo - Nuevo Producto  | `AdminProductEditComponent`      |
| `/admin/catalog/products/:id/edit` | Catálogo - Editar Producto | `AdminProductEditComponent`      |
| `/admin/catalog/categories`        | Catálogo - Categorías      | `AdminCategoriesComponent`       |
| `/admin/catalog/brands`            | Catálogo - Marcas          | `AdminBrandsComponent`           |
| `/admin/catalog/attributes`        | Catálogo - Atributos       | `AdminAttributesComponent`       |
| `/admin/inventory`                 | Inventario                 | Nuevo componente                 |
| `/admin/inventory/kardex`          | Kardex                     | Nuevo componente                 |
| `/admin/marketing/discounts`       | Marketing - Descuentos     | Nuevo componente                 |
| `/admin/marketing/coupons`         | Marketing - Cupones        | Nuevo componente                 |
| `/admin/marketing/banners`         | Marketing - Banners        | Nuevo componente                 |
| `/admin/customers`                 | Clientes                   | Nuevo componente                 |
| `/admin/customers/:id`             | Cliente - Perfil           | Nuevo componente                 |
| `/admin/reviews`                   | Reseñas - Moderación       | Nuevo componente                 |
| `/admin/questions`                 | Preguntas - Moderación     | Nuevo componente                 |
| `/admin/security/roles`            | Seguridad - Roles          | Nuevo componente                 |
| `/admin/security/users`            | Seguridad - Usuarios       | Reutilizar `AdminUsersComponent` |
| `/admin/security/audit-logs`       | Seguridad - Auditoría      | Nuevo componente                 |
| `/admin/security/login-history`    | Seguridad - Accesos        | Nuevo componente                 |
| `/admin/settings`                  | Configuración              | Nuevo componente                 |

---

_Documento de Diseño UI/UX v1.0 — Lumenstore Admin Panel_  
_Inspirado en H&M — Minimalismo Escandinavo para E-commerce de Moda_
