# SchoolCheck

App web para registrar ingresos y controlar retardos escolares con códigos QR.

## Estructura

```
schoolcheck/
├── index.html         ← página principal (solo estructura)
├── css/estilos.css    ← colores y estilos (variables en :root)
└── js/
    ├── config.js      ← ★ AQUÍ se cambia nombre, jornadas, tolerancia, seguridad
    ├── iconos.js      ← íconos SVG
    ├── datos.js       ← guardado (localStorage) y datos de demostración
    ├── seguridad.js   ← hash de contraseñas, bloqueo de intentos, códigos QR
    └── app.js         ← pantallas y lógica (login, dashboard, escáner, reportes...)
```

## Cómo abrirla

1. Instala **Visual Studio Code** y la extensión **Live Server**.
2. Abre la carpeta `schoolcheck` en VS Code.
3. Clic derecho en `index.html` → **Open with Live Server**.

(Usar Live Server o un enlace https es lo recomendable: la cámara del
escáner QR solo funciona en `localhost` o `https`.)

## Qué cambiar y dónde

| Quiero cambiar...                          | Archivo             |
|--------------------------------------------|---------------------|
| Nombre de la app, textos del login         | `js/config.js`      |
| Horarios de jornada y minutos de tolerancia| `js/config.js`      |
| Intentos de login, bloqueo, largo de clave | `js/config.js`      |
| Colores                                    | `css/estilos.css` (`:root`) |
| Usuarios y estudiantes de demostración     | `js/datos.js` (`seedDB`) |
| Pantallas, botones, reportes               | `js/app.js`         |

Después de cambiar jornadas o datos de demostración, entra a **Perfil →
reiniciar datos de demostración** (o borra los datos del sitio en el
navegador) para que se apliquen.

## Publicarla gratis

- **GitHub Pages**: sube la carpeta a un repositorio → Settings → Pages.
- **Netlify**: arrastra la carpeta a app.netlify.com/drop.

## Límites de esta versión

- Los datos viven en el navegador de cada dispositivo (`localStorage`); no se
  comparten entre celulares.
- La autenticación es del lado del cliente. Para uso real se necesita un
  backend (Node.js + MySQL, Firebase o Supabase) con hash en el servidor.
