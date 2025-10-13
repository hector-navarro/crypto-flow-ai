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

## Arquitectura
- **Backend:** Java 17, Spring Boot 3, WebFlux para SSE.
- **Frontend:** Angular 17, ng2-charts + Chart.js para visualizaciones.
- Comunicación en tiempo real mediante Server-Sent Events.
