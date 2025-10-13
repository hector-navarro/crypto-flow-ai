# Crypto Flow AI

Aplicación full-stack para monitorizar variaciones porcentuales de pares USD-cripto y noticias del ecosistema en tiempo real.

## Backend (Spring Boot)

Ubicado en `backend/`.

### Características
- API REST para listar pares soportados.
- Stream Server-Sent Events (SSE) para actualizaciones de precios simuladas en tiempo real.
- Stream SSE para noticias rotativas.
- Datos sintéticos generados en memoria, listos para integrarse con APIs reales.

### Ejecución
```bash
cd backend
./mvnw spring-boot:run # si el wrapper está disponible
# o bien
mvn spring-boot:run
```
La API queda disponible en `http://localhost:8080`.

## Frontend (Angular)

Ubicado en `frontend/`.

### Características
- Gráfica de líneas que compara la variación porcentual de hasta 6 pares USD-cripto.
- Selector múltiple de pares con persistencia del modo día/noche.
- Panel de noticias con actualizaciones automáticas en vivo.
- Consumo de streams SSE expuestos por el backend para precios y noticias.

### Ejecución
1. Instala las dependencias (requiere acceso a npm):
   ```bash
   cd frontend
   npm install
   ```
2. Inicia el servidor de desarrollo con proxy al backend:
   ```bash
   npm start
   ```
3. Accede a `http://localhost:4200` en el navegador.

> **Nota:** En entornos sin acceso a internet será necesario contar con un mirror de dependencias de npm.

### Despliegue en GitHub Pages
La aplicación puede publicarse automáticamente en GitHub Pages mediante el flujo de trabajo incluido en `.github/workflows/deploy.yml`.

1. Actualiza el script `build:gh-pages` en `frontend/package.json` si tu repositorio no se llama `crypto-flow-ai` (el valor de `--base-href` debe coincidir con `/<nombre-del-repo>/`).
2. En GitHub, ve a **Settings → Pages** y selecciona "GitHub Actions" como fuente.
3. Haz push de la rama `main` o ejecuta manualmente el flujo desde **Actions → Deploy to GitHub Pages**.
4. El sitio quedará disponible en `https://<tu-usuario>.github.io/<nombre-del-repo>/`.

#### Lanzar manualmente el despliegue preparado

Si ya existen cambios listos en la rama `main` y solo necesitas disparar el despliegue:

1. Abre la pestaña **Actions** en GitHub.
2. Selecciona el flujo **Deploy to GitHub Pages**.
3. Pulsa **Run workflow** (es posible elegir la rama, por defecto será `main`).
4. Espera a que termine la ejecución; la URL de la página se mostrará al final del job `deploy`.

> También puedes usar la CLI de GitHub: `gh workflow run deploy.yml`.

## Arquitectura
- **Backend:** Java 17, Spring Boot 3, WebFlux para SSE.
- **Frontend:** Angular 17, ng2-charts + Chart.js para visualizaciones.
- Comunicación en tiempo real mediante Server-Sent Events.
