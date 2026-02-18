# Usuario Admin - JSON para MongoDB

## Opción 1: Usar el Script (Recomendado)

Ejecuta el script que crea el usuario automáticamente:

```bash
node scripts/create-admin-user.js
```

Asegúrate de tener la variable `MONGODB_URI` configurada en tu `.env.local` o pásala como variable de entorno:

```bash
MONGODB_URI=mongodb+srv://admin:admin@cluster0.5deof2h.mongodb.net/remitero?retryWrites=true&w=majority node scripts/create-admin-user.js
```

---

## Opción 2: Insertar Manualmente en MongoDB

Si prefieres insertar el usuario manualmente, aquí está el JSON con la contraseña hasheada:

### Contraseña Hasheada

La contraseña `admin123QWE!` hasheada con bcrypt (10 rounds) es:

```
$2b$10$TBDfQVSwyT1NznCfk6CojOYbzP92OndoOKDmmJYGxFdITfLh4wwwa
```

### JSON para MongoDB

```json
{
  "username": "admin",
  "password": "$2b$10$TBDfQVSwyT1NznCfk6CojOYbzP92OndoOKDmmJYGxFdITfLh4wwwa",
  "role": "admin"
}
```

### Comando MongoDB Shell

```javascript
use remitero

db.usuarios.insertOne({
  "username": "admin",
  "password": "$2b$10$TBDfQVSwyT1NznCfk6CojOYbzP92OndoOKDmmJYGxFdITfLh4wwwa",
  "role": "admin"
})
```

### Comando MongoDB Compass o Atlas

1. Conecta a tu cluster de MongoDB
2. Selecciona la base de datos `remitero`
3. Selecciona la colección `usuarios` (se creará automáticamente si no existe)
4. Haz click en "Insert Document"
5. Pega el JSON de arriba
6. Haz click en "Insert"

---

## Credenciales

- **Usuario:** `admin`
- **Contraseña:** `admin123QWE!`
- **Role:** `admin`

---

## Nota Importante

⚠️ **La contraseña hasheada de arriba es válida y funcional.** Puedes usarla directamente para insertar el usuario en MongoDB.

Si prefieres generar un nuevo hash único, usa el script `create-admin-user.js` que genera un hash único cada vez.
