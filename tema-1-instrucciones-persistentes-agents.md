# Tema 1: Instrucciones persistentes con `AGENTS.md` (para no repetirlo todo)

Las instrucciones persistentes permiten definir reglas estables para que un asistente técnico trabaje siempre bajo los mismos criterios, sin tener que repetir esas reglas en cada prompt.

## ¿Qué es `AGENTS.md`?

`AGENTS.md` es un fichero de instrucciones pensado para guiar a agentes automáticos (por ejemplo, asistentes de programación) dentro de un repositorio o árbol de carpetas.

Su objetivo principal es **externalizar contexto operativo**:

- Convenciones de código.
- Reglas de arquitectura.
- Comandos de validación y test.
- Estilo de commits, PRs y documentación.
- Restricciones de seguridad o de ejecución.

De esta forma, en lugar de escribir siempre _"usa este estilo"_, _"ejecuta estos tests"_ o _"no toques esta carpeta"_, todo queda definido en un punto de referencia persistente.

## Beneficios clave

1. **Consistencia**: todos los cambios siguen las mismas reglas.
2. **Menos fricción**: no hace falta repetir instrucciones en cada tarea.
3. **Onboarding más rápido**: cualquier persona/agente entiende el flujo leyendo un solo archivo.
4. **Escalabilidad**: puedes tener múltiples `AGENTS.md` por áreas del proyecto.
5. **Reducción de errores**: se minimizan interpretaciones ambiguas del prompt.

## Regla de alcance (scope)

Una idea fundamental: el `AGENTS.md` aplica a la carpeta donde vive y a todo su subárbol.

Ejemplo:

```text
/
├── AGENTS.md                # reglas globales
├── frontend/
│   ├── AGENTS.md            # reglas específicas de frontend
│   └── src/
└── backend/
    └── src/
```

- Un archivo en `frontend/src/` debe cumplir tanto las reglas globales como las de `frontend/AGENTS.md`.
- Si hay conflicto, suele prevalecer el `AGENTS.md` más específico (más cercano al archivo editado).

## Qué incluir en un buen `AGENTS.md`

Una estructura recomendada:

1. **Objetivo y alcance**
   - Qué parte del repo cubre.
2. **Stack y convenciones**
   - Lenguaje, estilos, patrones permitidos/prohibidos.
3. **Flujo de trabajo**
   - Comandos para lint, test y build.
4. **Política de cambios**
   - Qué se puede modificar y qué no.
5. **Política de commits/PR**
   - Formato de mensajes, checklist mínima.
6. **Validaciones obligatorias**
   - Qué comandos deben pasar antes de cerrar la tarea.

## Ejemplo práctico de `AGENTS.md` (global)

```md
# AGENTS.md (raíz)

## Alcance
Aplica a todo el repositorio.

## Reglas generales
- No introducir nuevas dependencias sin justificarlo.
- Mantener funciones pequeñas y con nombres descriptivos.
- Añadir tests cuando se modifica lógica de negocio.

## Validación obligatoria
- Backend: `./gradlew test`
- Frontend: `npm run lint && npm test`

## Commits
- Formato: `tipo(scope): descripción breve`
```

## Ejemplo práctico de `AGENTS.md` específico (frontend)

```md
# frontend/AGENTS.md

## Alcance
Aplica a `frontend/` y subcarpetas.

## Convenciones
- Usar componentes standalone cuando aplique.
- Evitar lógica de negocio en plantillas HTML.
- Estilos SCSS con nomenclatura BEM.

## Validación obligatoria
- `npm run lint`
- `npm run test -- --watch=false`
```

Con esta separación, el agente mantiene una guía común global y, además, reglas especializadas por dominio.

## Buenas prácticas de mantenimiento

- **Versionar el archivo**: cualquier cambio de proceso debe reflejarse en Git.
- **Evitar ambigüedad**: instrucciones concretas y medibles (comandos exactos).
- **Mantenerlo corto y accionable**: mejor checklists que párrafos largos.
- **Revisarlo periódicamente**: especialmente cuando cambian herramientas o arquitectura.
- **Alinearlo con CI/CD**: lo que exige `AGENTS.md` debería coincidir con pipelines.

## Errores comunes

1. Instrucciones contradictorias entre distintos `AGENTS.md`.
2. Reglas desactualizadas respecto al código actual.
3. Pedir validaciones imposibles en el entorno real.
4. Convertir el archivo en una guía demasiado extensa y poco práctica.

## Plantilla base rápida

```md
# AGENTS.md

## Alcance
(Indica ruta cubierta)

## Estilo y arquitectura
- ...

## Restricciones
- ...

## Validación obligatoria
- ...

## Entrega
- ...
```

## Relación con el documento original

Este tema forma parte de la guía principal de buenas prácticas:

- Volver al índice: [good-practices.md](./good-practices.md)
