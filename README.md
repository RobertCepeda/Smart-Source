# Smart Source

Smart Source es una aplicación web modular para gestionar suplidores, catálogo, órdenes de compra, historial, reportes, soporte y consultas sobre documentos.

## Stack

- Frontend: React, Vite, TypeScript, Tailwind CSS
- Backend: Express, TypeScript, Prisma
- Base de datos: PostgreSQL
- Documentos: lectura inicial de CSV, Excel, PDF, JSON, TXT y DOCX

## Requisitos

- Node.js 24+
- PostgreSQL local o remoto
- npm

## Configuración local

1. Instala dependencias:

```bash
npm install
npm install --prefix backend
npm install --prefix frontend
```

2. Crea las variables de entorno:

```bash
cp backend/.env.example backend/.env
cp frontend/.env.example frontend/.env
```

3. Edita `backend/.env` con tu conexión de PostgreSQL:

```env
DATABASE_URL="postgresql://usuario:password@localhost:5432/smart_source?schema=public"
PORT=4000
CORS_ORIGIN="http://localhost:5173"
JWT_SECRET="pon-aqui-una-clave-larga-y-segura"
OPENAI_API_KEY=""
OPENAI_MODEL="gpt-5.6-sol"
```

Para activar Consultas IA con OpenAI, pega tu API key en `OPENAI_API_KEY`. Si la dejas vacía, Smart Source mantiene el analizador local de documentos.

4. Crea la base de datos `smart_source` en PostgreSQL si todavía no existe.

5. Aplica migraciones y prepara datos demo:

```bash
npm run prisma:migrate
npm run prisma:seed
```

6. Levanta la aplicación:

```bash
npm run dev
```

Frontend: `http://localhost:5173`  
Backend: `http://localhost:4000/api`

## Cuentas demo

- Cliente: `prueba01@gmail.com` / `12345678`
- Admin interno: `admin@smartsource.local` / `12345678`

## Scripts útiles

```bash
npm run dev              # frontend y backend
npm run build            # compila backend y frontend
npm run prisma:generate  # genera Prisma Client
npm run prisma:migrate   # aplica migraciones en desarrollo
npm run prisma:deploy    # aplica migraciones en producción
npm run prisma:seed      # datos demo
npm run lint --prefix frontend
```

## Notas para GitHub

No subas `.env`, `node_modules`, `dist`, logs ni `backend/src/generated/prisma`. Esos archivos ya quedan protegidos por `.gitignore`.

Después de clonar en otra máquina, ejecuta `npm install` en root, backend y frontend, configura los `.env`, corre migraciones y luego `npm run dev`.
