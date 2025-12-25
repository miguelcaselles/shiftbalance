# Guía de Despliegue - ShiftBalance

## Paso 1: Crear Base de Datos en Neon (2 minutos)

1. Ve a **https://neon.tech** y haz clic en "Sign Up"
2. Regístrate con GitHub o email
3. Crea un nuevo proyecto llamado "shiftbalance"
4. Copia la **Connection string** que aparece (empieza con `postgresql://...`)

## Paso 2: Desplegar en Vercel (3 minutos)

1. Ve a **https://vercel.com** y haz clic en "Sign Up" (usa GitHub)
2. Haz clic en "Add New Project"
3. Importa el repositorio de GitHub donde subiste el código
4. En la sección **Environment Variables**, añade:

   | Variable | Valor |
   |----------|-------|
   | `DATABASE_URL` | (tu connection string de Neon) |
   | `NEXTAUTH_SECRET` | (genera uno con: `openssl rand -base64 32`) |
   | `NEXTAUTH_URL` | https://tu-proyecto.vercel.app |
   | `NEXT_PUBLIC_APP_URL` | https://tu-proyecto.vercel.app |

5. Haz clic en "Deploy"

## Paso 3: Crear las Tablas de la Base de Datos

Después del primer despliegue, ejecuta desde tu terminal local:

```bash
cd shiftbalance
DATABASE_URL="tu-connection-string-de-neon" npx prisma db push
```

## Paso 4: Crear Usuario Admin Inicial

Ejecuta el seed para crear datos de prueba:

```bash
DATABASE_URL="tu-connection-string-de-neon" npm run db:seed
```

## Credenciales de Acceso

- **Admin**: admin@shiftbalance.app / password123
- **Workers**: maria.garcia@shiftbalance.app, carlos.lopez@shiftbalance.app, etc. / password123

## Actualizar la Aplicación

Cada vez que hagas `git push` a la rama main, Vercel desplegará automáticamente.

---

## Comandos Útiles

```bash
# Ver la base de datos en el navegador
DATABASE_URL="..." npx prisma studio

# Regenerar el cliente Prisma
npx prisma generate

# Aplicar cambios al esquema
DATABASE_URL="..." npx prisma db push
```
