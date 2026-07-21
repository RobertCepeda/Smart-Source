export type ModuleStatus = "base" | "next" | "planned";

export type SmartModule = {
  title: string;
  route: string;
  status: ModuleStatus;
  description: string;
  endpoints: string[];
  nextWork: string;
};

export const smartModules: SmartModule[] = [
  {
    title: "Dashboard",
    route: "/",
    status: "base",
    description: "Vista inicial con métricas, accesos rápidos y actividad reciente.",
    endpoints: ["GET /api/reports/summary", "GET /api/reports/spending"],
    nextWork: "Base lista: conectar más gráficas finas cuando crezca la data.",
  },
  {
    title: "Suplidores",
    route: "/suppliers",
    status: "base",
    description: "Directorio visual de suplidores con filtros por categoría, ciudad y etiqueta.",
    endpoints: ["GET /api/suppliers", "GET /api/suppliers/:id"],
    nextWork: "Módulo 1: CRUD real y tarjetas conectadas a PostgreSQL.",
  },
  {
    title: "Organizaciones",
    route: "/organizations",
    status: "base",
    description: "Gestión de organizaciones clientes, planes, usuarios y datos separados por empresa.",
    endpoints: ["GET /api/organizations"],
    nextWork: "Base lista: organización activa, plan, usuarios y conteos conectados.",
  },
  {
    title: "Catálogo",
    route: "/catalog",
    status: "base",
    description: "Materiales, servicios, categorías, marcas y asociación con suplidores.",
    endpoints: ["GET /api/items", "POST /api/items", "GET /api/categories", "GET /api/brands"],
    nextWork: "Módulo 2: CRUD de materiales/servicios y asociación suplidor-item.",
  },
  {
    title: "Búsqueda",
    route: "/search",
    status: "base",
    description: "Buscador global para suplidores, materiales, servicios, marcas y vendedores.",
    endpoints: ["GET /api/search?q=texto"],
    nextWork: "Módulo 3: búsqueda global conectada con resultados agrupados.",
  },
  {
    title: "Registro",
    route: "/registration",
    status: "base",
    description: "Alta en pasos para suplidores, contactos, catálogo y etiquetas.",
    endpoints: ["POST /api/suppliers", "POST /api/suppliers/:id/contacts"],
    nextWork: "Módulo 1: formulario por pasos con validación.",
  },
  {
    title: "Configuración",
    route: "/settings",
    status: "base",
    description: "Perfil de usuario, organización, preferencias, seguridad e integraciones.",
    endpoints: ["GET /api/auth/me"],
    nextWork: "Base lista: perfil, seguridad, organización e integraciones preparadas.",
  },
  {
    title: "Centro de Atención",
    route: "/support",
    status: "base",
    description: "Buzón elegante para soporte, mantenimiento, facturación e ideas.",
    endpoints: ["GET /api/support/tickets", "POST /api/support/tickets"],
    nextWork: "Base lista: solicitudes llegan al portal privado de Smart Source.",
  },
  {
    title: "Órdenes de Compra",
    route: "/purchase-orders",
    status: "base",
    description: "Generador de órdenes con líneas, ITBIS, total y PDF.",
    endpoints: ["POST /api/purchase-orders", "GET /api/purchase-orders/:id/pdf"],
    nextWork: "Módulo 4: cálculo, numeración, estados y listado conectados.",
  },
  {
    title: "Historial",
    route: "/purchase-history",
    status: "base",
    description: "Tabla filtrable de compras por suplidor, fecha, estado y monto.",
    endpoints: ["GET /api/purchase-orders"],
    nextWork: "Módulo 5: filtros, detalle y línea de tiempo de compras conectados.",
  },
  {
    title: "Precios",
    route: "/price-history",
    status: "base",
    description: "Evolución y comparativa de precios por ítem y suplidor.",
    endpoints: ["GET /api/price-history?itemId=..."],
    nextWork: "Módulo 6: gráficas con Recharts y comparativa por suplidor conectadas.",
  },
  {
    title: "Reportes",
    route: "/reports",
    status: "base",
    description: "Gastos por categoría, suplidor y mes, con exportaciones futuras.",
    endpoints: ["GET /api/reports/summary", "GET /api/reports/spending"],
    nextWork: "Módulo 7: resumen, gráficas y rankings conectados.",
  },
];
