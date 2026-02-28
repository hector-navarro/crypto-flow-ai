# Tema 3 — Evita el “prompt spaghetti” con documentos de control

> Documento relacionado: [good-practices.md](./good-practices.md)

## ¿Qué es el “prompt spaghetti”?

El **prompt spaghetti** aparece cuando las instrucciones de un sistema se reparten en muchos mensajes, notas sueltas y parches improvisados. El resultado es una “mezcla” difícil de mantener:

- Reglas repetidas en varios sitios.
- Instrucciones que se contradicen.
- Cambios rápidos que rompen comportamientos que antes funcionaban.
- Dependencia de “recordar” contexto histórico en vez de tener una fuente clara.

En equipos, este problema crece rápido: una persona añade un requisito en un sitio, otra lo corrige en otro y el asistente termina recibiendo órdenes ambiguas.

---

## ¿Qué son los documentos de control?

Un **documento de control** es una pieza estable y versionable que centraliza reglas de operación para una tarea o dominio concreto.

Piensa en él como una “constitución” para el prompt:

- Define objetivos y límites.
- Establece formato de salida.
- Incluye criterios de calidad.
- Describe excepciones y prioridades.
- Ofrece ejemplos de entradas/salidas esperadas.

### Beneficios clave

1. **Consistencia:** el modelo responde con menos variabilidad no deseada.
2. **Mantenibilidad:** cambias una regla en un sitio, no en diez.
3. **Escalabilidad:** nuevos miembros del equipo entienden rápido cómo operar.
4. **Auditabilidad:** puedes revisar historial de cambios (Git) y justificar decisiones.

---

## Estructura recomendada de un documento de control

Una estructura práctica (mínima) puede ser:

1. **Propósito**
   - Qué problema resuelve el flujo.
2. **Alcance**
   - Qué sí hace y qué no hace.
3. **Prioridades de instrucciones**
   - Qué reglas ganan cuando hay conflicto.
4. **Formato de salida**
   - Plantilla exacta, estilo, idioma, longitud esperada.
5. **Reglas de calidad**
   - Claridad, precisión, citas, validaciones, tono.
6. **Ejemplos canónicos**
   - Buenos y malos ejemplos.
7. **Checklist de verificación**
   - Pasos antes de entregar la respuesta.

---

## Patrón práctico: separar “política” de “tarea”

Una forma útil de evitar el spaghetti:

- **Documento de política (estable):** reglas permanentes.
- **Prompt de tarea (variable):** pedido puntual del usuario.

Así, la tarea cambia en cada petición, pero la política permanece limpia y reutilizable.

---

## Ejemplo 1 — Mal enfoque (spaghetti)

```text
Haz un resumen de esto.
No muy largo.
Pero con detalle técnico.
Usa bullets, aunque quizá mejor en párrafos.
Ah, y cita fuentes, pero si no hay no pasa nada.
No olvides ser breve.
Incluye riesgos y métricas.
```

### Problemas del ejemplo

- Reglas contradictorias (breve vs detalle técnico profundo).
- Formato incierto (bullets o párrafos).
- Criterio de calidad ambiguo (citas opcionales sin contexto).

---

## Ejemplo 2 — Buen enfoque con documento de control

### Documento de control (extracto)

```markdown
# Política de resúmenes técnicos
- Objetivo: resumir documentos para revisión ejecutiva.
- Formato de salida obligatorio:
  1) Resumen ejecutivo (3 bullets)
  2) Riesgos (máx. 5 bullets)
  3) Métricas recomendadas (tabla de 2 columnas)
- Longitud total: 180-250 palabras.
- Si faltan datos, indicar "Dato no disponible" (no inventar).
- Citas: obligatorias cuando se afirma un hecho específico.
```

### Prompt de tarea

```text
Aplica la política de resúmenes técnicos al documento adjunto sobre volatilidad de BTC.
```

### Resultado

- Menos ambigüedad.
- Mayor consistencia entre ejecuciones.
- Menos retrabajo por cambios de formato.

---

## Ejemplo 3 — Flujo de actualización controlado

Cuando haya un cambio de criterio, evita “parchear prompts antiguos”.

### En lugar de esto

- Añadir una línea en cada prompt histórico.

### Haz esto

1. Actualiza el documento de control (v1.3 → v1.4).
2. Registra qué cambió y por qué.
3. Ajusta los ejemplos canónicos si aplica.
4. Comunica al equipo que desde ahora rige la nueva versión.

Esto reduce errores silenciosos y hace visible el impacto de cada cambio.

---

## Buenas prácticas operativas

- Usa nombres claros: `control-resumen-tecnico.md`, `control-soporte.md`.
- Mantén documentos pequeños y específicos por dominio.
- Versiona en Git con mensajes de commit explícitos.
- Incluye ejemplos reales y contraejemplos.
- Añade una checklist de “antes de enviar”.

---

## Checklist rápida anti-spaghetti

Antes de cerrar una tarea, verifica:

- [ ] ¿Existe una única fuente de verdad para las reglas?
- [ ] ¿El formato de salida está definido sin ambigüedad?
- [ ] ¿Hay ejemplos canónicos actualizados?
- [ ] ¿Se sabe qué hacer cuando faltan datos?
- [ ] ¿Los cambios quedaron versionados y documentados?

Si respondes “no” en dos o más puntos, probablemente estás entrando en prompt spaghetti.

---

## Conclusión

Evitar el prompt spaghetti no es “escribir prompts más largos”, sino **diseñar un sistema de instrucciones mantenible**. Los documentos de control convierten reglas dispersas en una base coherente, reducen inconsistencias y permiten escalar trabajo con IA de forma profesional.
