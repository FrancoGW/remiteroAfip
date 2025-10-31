# Guía de Contribución

¡Gracias por tu interés en contribuir al proyecto Remitero AFIP! 🎉

## Cómo Contribuir

### 1. Fork y Clone

```bash
# Fork el repositorio en GitHub
# Luego clona tu fork
git clone https://github.com/TU_USUARIO/remiteroAfip.git
cd remiteroAfip
```

### 2. Configurar el Proyecto

```bash
npm install
npm run setup  # Solo en macOS/Linux
```

Crea tu archivo `.env.local` con la configuración necesaria.

### 3. Crear una Rama

```bash
git checkout -b feature/mi-nueva-caracteristica
# o
git checkout -b fix/correccion-de-bug
```

Nomenclatura de ramas:
- `feature/` - Para nuevas características
- `fix/` - Para correcciones de bugs
- `docs/` - Para documentación
- `refactor/` - Para refactorización de código
- `test/` - Para tests

### 4. Desarrollar

Haz tus cambios siguiendo nuestras guías de estilo:

#### Código TypeScript

```typescript
// ✅ Usar tipos explícitos
function calcularTotal(items: RemitoItem[]): number {
  return items.reduce((sum, item) => sum + item.cantidad, 0);
}

// ❌ Evitar any
function procesarDatos(data: any) { }

// ✅ Usar interfaces
interface Usuario {
  nombre: string;
  cuit: string;
}
```

#### Componentes React

```typescript
// ✅ Usar componentes funcionales con TypeScript
export default function MiComponente({ prop }: { prop: string }) {
  return <div>{prop}</div>;
}

// ✅ Separar lógica de presentación
const useRemitos = () => {
  // Lógica
};

// ✅ Nombrar componentes descriptivamente
export default function FormularioRemito() { }
```

#### Estilos

```tsx
// ✅ Usar Tailwind CSS
<div className="flex items-center gap-4 p-4 bg-white rounded-lg shadow">

// ✅ Usar clases condicionales
<button className={`px-4 py-2 ${loading ? 'bg-gray-400' : 'bg-blue-600'}`}>

// ✅ Responsive
<div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3">
```

### 5. Commit

Sigue el formato de commits convencionales:

```bash
# Features
git commit -m "feat: agregar validación de CUIT"

# Fixes
git commit -m "fix: corregir cálculo de CAE"

# Docs
git commit -m "docs: actualizar guía de certificados"

# Style
git commit -m "style: mejorar espaciado en formulario"

# Refactor
git commit -m "refactor: simplificar lógica de validación"

# Tests
git commit -m "test: agregar tests para afipService"
```

Tipos de commits:
- `feat:` - Nueva característica
- `fix:` - Corrección de bug
- `docs:` - Cambios en documentación
- `style:` - Cambios de formato/estilo (no afectan funcionalidad)
- `refactor:` - Refactorización de código
- `test:` - Agregar o modificar tests
- `chore:` - Tareas de mantenimiento

### 6. Push y Pull Request

```bash
git push origin feature/mi-nueva-caracteristica
```

Luego crea un Pull Request en GitHub con:

- **Título descriptivo**: "feat: Agregar validación de CUIT en tiempo real"
- **Descripción completa**: Explica qué cambios hiciste y por qué
- **Screenshots**: Si hay cambios visuales
- **Testing**: Describe cómo probaste los cambios

Plantilla de PR:

```markdown
## Descripción
[Describe brevemente los cambios]

## Tipo de cambio
- [ ] Bug fix
- [ ] Nueva característica
- [ ] Breaking change
- [ ] Documentación

## Cómo probar
1. [Paso 1]
2. [Paso 2]
3. [Verificar que...]

## Checklist
- [ ] Mi código sigue el estilo del proyecto
- [ ] He revisado mi propio código
- [ ] He comentado partes complejas
- [ ] He actualizado la documentación
- [ ] Mis cambios no generan nuevos warnings
- [ ] He probado en desarrollo
```

## Áreas de Contribución

### 🐛 Reportar Bugs

Abre un Issue con:
- Descripción del bug
- Pasos para reproducir
- Comportamiento esperado vs actual
- Screenshots si aplica
- Versión de Node.js, navegador, etc.

### 💡 Sugerir Características

Abre un Issue con:
- Descripción de la característica
- Casos de uso
- Mockups o ejemplos si tienes

### 📝 Mejorar Documentación

- Corregir errores de escritura
- Agregar ejemplos
- Mejorar claridad
- Traducir a otros idiomas

### 🎨 Mejorar UI/UX

- Hacer la interfaz más intuitiva
- Mejorar accesibilidad
- Optimizar responsive design
- Agregar animaciones/transiciones

### ⚡ Optimizar Performance

- Reducir tamaño de bundle
- Optimizar renders
- Mejorar tiempos de carga
- Implementar caching

## Guías de Código

### TypeScript

- Usar tipos explícitos en funciones públicas
- Evitar `any`, usar `unknown` si es necesario
- Usar interfaces para objetos complejos
- Exportar tipos para reuso

### React

- Componentes funcionales sobre clases
- Custom hooks para lógica reutilizable
- Memoización cuando sea necesario
- Manejo de errores con error boundaries

### Next.js

- Usar App Router (no Pages Router)
- Server Components por defecto
- Client Components solo cuando sea necesario
- Optimizar imágenes con next/image

### Estilos

- Tailwind CSS para estilos
- Clases utilitarias sobre CSS personalizado
- Responsive-first
- Modo oscuro cuando aplique

### Testing

- Tests para funciones críticas
- Tests de integración para flujos importantes
- Mocking de servicios externos (AFIP)

## Setup de Desarrollo

### VSCode (Recomendado)

Extensiones recomendadas:
```json
{
  "recommendations": [
    "dbaeumer.vscode-eslint",
    "esbenp.prettier-vscode",
    "bradlc.vscode-tailwindcss",
    "ms-vscode.vscode-typescript-next"
  ]
}
```

### Configuración

`.vscode/settings.json`:
```json
{
  "editor.formatOnSave": true,
  "editor.codeActionsOnSave": {
    "source.fixAll.eslint": true
  },
  "typescript.tsdk": "node_modules/typescript/lib"
}
```

## Testing

```bash
# Ejecutar tests
npm test

# Ejecutar tests con coverage
npm test -- --coverage

# Ejecutar tests en modo watch
npm test -- --watch
```

## Proceso de Review

Los Pull Requests serán revisados por los maintainers:

1. **Automated checks**: Linting, tests, build
2. **Code review**: Revisión del código
3. **Testing**: Probar los cambios
4. **Feedback**: Comentarios y sugerencias
5. **Merge**: Una vez aprobado

## Código de Conducta

- Sé respetuoso y constructivo
- Acepta críticas constructivas
- Enfócate en lo mejor para el proyecto
- Ayuda a otros contributors

## Preguntas

¿Tienes preguntas? Abre un Issue con la etiqueta `question`.

## Agradecimientos

¡Gracias por contribuir! Todos los contributors serán reconocidos.

---

¡Feliz coding! 🚀

