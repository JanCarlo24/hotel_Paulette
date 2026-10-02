# Hotel Paulette

Sitio web estático de reservaciones hoteleras. El proyecto comparte sus datos, funciones de reserva y tema visual mediante la librería JavaScript **`tap-booking-ui-lib`**.

## Librería principal

El paquete se llama `tap-booking-ui-lib`, está escrito como módulo ES y no tiene dependencias de ejecución. Su manifiesto npm es [`package.json`](./package.json); el punto de entrada es [`src/index.js`](./src/index.js) y la hoja de estilos reutilizable está en [`src/style.css`](./src/style.css).

La aplicación del hotel importa desde esa librería el catálogo de habitaciones y servicios, la galería, los cupones, el formato de moneda, el cálculo de noches y totales, la comprobación de disponibilidad y el almacenamiento de reservaciones. También exporta `BookingTools`, un widget opcional de reservación que se puede montar en otras páginas.

### Funciones y datos exportados

| Exportación | Para qué sirve |
| --- | --- |
| `BookingTools` | Monta y desmonta un formulario de reservación; calcula el precio, valida capacidad y disponibilidad, y guarda en `localStorage`. |
| `HOTEL_ROOMS`, `HOTEL_SERVICES`, `HOTEL_GALLERY` | Catálogos del hotel compartidos entre la aplicación y sus consumidores. |
| `HOTEL_COUPONS` | Cupones y sus porcentajes de descuento. |
| `HOTEL_THEME` | Fuente Inter y colores de marca para usarlos en la aplicación o el widget. |
| `formatMoney(amount, currency?, locale?)` | Da formato monetario según moneda e idioma. |
| `calculateNights(checkIn, checkOut)` | Calcula noches entre fechas ISO `AAAA-MM-DD`; rechaza fechas inválidas o invertidas. |
| `isDateOverlap(...)`, `isRoomAvailable(...)` | Detectan cruces de fechas y disponibilidad de una habitación. |
| `calculateBookingTotal(options)` | Suma noches y servicios y aplica un descuento validado. |
| `getStoredBookings(storage, key?)`, `saveStoredBookings(storage, bookings, key?)` | Lee y guarda reservaciones; los errores de datos o almacenamiento se reportan explícitamente. |

### Instalar con npm

La librería aún no está publicada en el registro público de npm. Mientras tanto se puede instalar directamente desde GitHub:

```bash
npm install github:JanCarlo24/hotel_Paulette
```

Cuando el paquete se publique, se podrá instalar con:

```bash
npm install tap-booking-ui-lib
```

Ejemplo de integración en otra aplicación con módulos ES:

```js
import {
  BookingTools,
  HOTEL_ROOMS,
  HOTEL_SERVICES
} from 'tap-booking-ui-lib';

const bookingTools = new BookingTools({
  rooms: HOTEL_ROOMS,
  services: HOTEL_SERVICES,
  storagePrefix: 'reservas-mi-sitio',
  currency: 'MXN'
});

bookingTools.mountBookingWidget('#contenedor-reservas');
```

Incluye la hoja de estilos de la librería en el HTML:

```html
<link
  rel="stylesheet"
  href="./node_modules/tap-booking-ui-lib/src/style.css"
>
```

El widget usa `localStorage` del navegador y es un ejemplo de interfaz cliente; **no** procesa pagos, no envía correos ni sustituye una API o una base de datos de producción. `storagePrefix` aísla las reservas de cada aplicación.

## Tipografía y paleta

La familia principal es **Inter**, con pesos 300, 400, 500, 600 y 700, cargada desde Google Fonts. La paleta vive en las variables CSS de `src/style.css` y está disponible también como `HOTEL_THEME.colors`:

| Token | Color | Uso |
| --- | --- | --- |
| `--hotel-color-primary` | `#2563EB` | Acciones y enlaces principales. |
| `--hotel-color-primary-dark` | `#1D4ED8` | Estados hover y énfasis. |
| `--hotel-color-secondary` | `#4338CA` | Degradados y acentos índigo. |
| `--hotel-color-text` | `#111827` | Texto principal. |
| `--hotel-color-muted` | `#4B5563` | Texto secundario. |
| `--hotel-color-surface` | `rgba(255, 255, 255, 0.4)` | Tarjetas translúcidas estilo vidrio. |
| `--hotel-color-success` | `#16A34A` | Confirmaciones y estados correctos. |
| `--hotel-color-error` | `#DC2626` | Errores y cancelaciones. |

La interfaz actual también usa Tailwind CSS y Font Awesome desde CDN; Firebase Authentication se carga desde el CDN de Firebase.

## Flujo de trabajo del sitio

1. **Buscar:** elegir llegada, salida y cantidad de huéspedes.
2. **Ver disponibilidad:** validar fechas, capacidad y reservas existentes.
3. **Seleccionar:** consultar habitaciones, amenidades y estimado de precio.
4. **Personalizar:** añadir servicios y aplicar `OVERLOOK10` o `BIENVENIDO`.
5. **Confirmar:** iniciar sesión y aceptar las políticas antes de crear la reservación.
6. **Administrar:** consultar, cancelar o repetir reservas desde “Mis reservaciones”.
7. **Contactar:** enviar el formulario; esta demo guarda sus datos localmente y no transmite el mensaje a un servidor.

Las habitaciones, sesiones, reservas y el último mensaje de contacto de la demo se conservan en el almacenamiento local del navegador. Las reservas de `BookingTools` usan una clave separada, con prefijo configurable.

## Estructura del proyecto

```text
.
├── assets/
│   ├── css/styles.css       # Estilos específicos del sitio
│   └── js/app.js            # Vistas, eventos y flujo actual de la web
├── src/
│   ├── index.js             # API de tap-booking-ui-lib
│   └── style.css            # Tema y estilos del widget reutilizable
├── tests/
│   └── booking-tools.test.js
├── index.html
├── package.json
└── README.md
```

## Desarrollo y verificación con npm

Se requiere Node.js 18 o posterior. El sitio se puede abrir con un servidor estático como **Live Server** en Visual Studio Code; se recomienda un servidor local porque la aplicación usa módulos ES y Firebase.

```bash
npm install
npm test
npm run pack:check
```

- `npm test`: ejecuta pruebas integradas con `node:test`, sin añadir dependencias.
- `npm run pack:check`: comprueba qué archivos se incluirían en el paquete npm.
- `npm run dev`: no está configurado; para previsualizar el sitio usa Live Server.

Para preparar una publicación después de verificar el nombre disponible en npm y autenticarte:

```bash
npm login
npm run pack:check
npm publish
```

La publicación es un paso manual; este repositorio todavía no está publicado en npm.

## Publicación del sitio

El frontend se puede publicar en **GitHub Pages** como sitio estático. Se necesita conexión a Internet para cargar Tailwind, Inter, Font Awesome, las imágenes y Firebase desde sus CDN.
