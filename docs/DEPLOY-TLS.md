# TLS / HTTPS — Opciones de despliegue

La app usa cookies `Secure`, lo que significa que **el login sólo funciona sobre HTTPS**.
El código ya está preparado (`trustProxy: true`, `secure` en producción): lo único que necesitáis
decidir es *dónde* terminar TLS.

A continuación las tres opciones más comunes para un despliegue propio.

---

## Opción A — Caddy (recomendada para autoalojamiento)

**Qué es:** Un servidor web/proxy que se añade como un contenedor más. Obtiene y renueva
automáticamente certificados Let's Encrypt. No necesitáis nada más.

**Pros:**
- Renovación automática de certificados (nunca caduca).
- Configuración mínima (5 líneas).
- Totalmente autoalojado, sin dependencias externas.
- El contenedor de la app sigue funcionando en :3000 internamente, sin cambios.

**Contras:**
- Un contenedor más que mantener.
- Necesita que el puerto 80 y 443 del servidor estén abiertos y el dominio resuelva a la IP del servidor.

**Cómo usarlo:**

1. Crear `Caddyfile` en la carpeta de despliegue con el siguiente contenido:
   ```
   tudominio.com {
     reverse_proxy infragest-app-prod:3000
   }
   ```
2. Crear `docker-compose.caddy.yml`:
   ```yaml
   services:
     caddy:
       image: caddy:2-alpine
       restart: unless-stopped
       ports:
         - "80:80"
         - "443:443"
       volumes:
         - ./Caddyfile:/etc/caddy/Caddyfile
         - caddy_data:/data
         - caddy_config:/config
       networks:
         - infragest_default
   volumes:
     caddy_data:
     caddy_config:
   networks:
     infragest_default:
       external: true
   ```
3. Sustituir `tudominio.com` por vuestro dominio real.
4. Levantar con:
   ```bash
   docker compose -f docker-compose.ghcr.yml -f docker-compose.caddy.yml up -d
   ```
5. Caddy obtiene el certificado en el primer arranque (necesita que el dominio ya apunte al servidor).

---

## Opción B — Cloudflare

**Qué es:** Ponéis el DNS del dominio en Cloudflare, activáis el "proxy" (la nube naranja) y
Cloudflare actúa de intermediario HTTPS gratuito. El servidor recibe tráfico HTTP en :8080.

**Pros:**
- Cero instalación en el servidor.
- Gratuito (plan Free de Cloudflare).
- Incluye protección DDoS básica y caché de estáticos.
- El tráfico entre Cloudflare y el servidor puede ser HTTP (ya va cifrado de usuario a Cloudflare).

**Contras:**
- El tráfico pasa por Cloudflare (datos de la organización pasan por servidores de EE.UU.).
- Dependéis de un tercero para que el servicio funcione.
- Si el servidor no tiene HTTPS propio, en modo "Flexible" el tramo CF→servidor va sin cifrar.
  Para evitarlo usar modo **Full** (no Full Strict, porque nuestro nginx no tiene cert propio).

**Cómo usarlo:**

1. En el panel de Cloudflare, añadir el dominio y apuntar el registro A a la IP del servidor
   con el proxy activado (nube naranja).
2. En SSL/TLS → Overview, seleccionar modo **Full**.
3. No hay nada que cambiar en el código ni en Docker — `trustProxy: true` ya está activo.
4. Asegurarse de que el servidor tiene el puerto 8080 accesible desde internet (o 80/443 si
   redirigís los puertos en el servidor).

---

## Opción C — certbot + nginx dedicado

**Qué es:** Obtener un certificado Let's Encrypt con certbot y añadir un contenedor nginx
nuevo sólo para terminar TLS y hacer proxy al backend en :3000 (la app ya no trae un nginx
propio — fue eliminado al pasar a un único contenedor backend que sirve también el frontend).

**Pros:**
- Totalmente autoalojado.

**Contras:**
- Renovación manual (o cron) cada 90 días — si se olvida, la app deja de funcionar.
- Más configuración inicial: añadir el contenedor nginx, abrir puerto 443, escribir su config,
  montar volumen con certs.
- Más difícil de mover entre servidores.

**Cómo usarlo (resumen):**

```bash
# En el servidor (Ubuntu/Debian):
apt install certbot
certbot certonly --standalone -d tudominio.com --email vuestro@email.com --agree-tos
```

Luego escribir una config de nginx que escuche en :443 con los certs y haga
`proxy_pass http://infragest-app-prod:3000`, y montar `/etc/letsencrypt` en ese contenedor.
Ver guía oficial: https://certbot.eff.org/

---

## Recomendación

| Situación | Opción recomendada |
|---|---|
| Servidor propio, dominio en vuestro control | **A — Caddy** |
| Queréis lo más simple posible y no importa usar Cloudflare | **B — Cloudflare** |
| Ya tenéis nginx gestionando certs en producción | **C — certbot** |

Para la mayoría de municipios que gestionan su propio servidor: **Caddy**. Es la opción más
robusta y de menor mantenimiento a largo plazo.
