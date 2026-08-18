# FactuSky

Sistema de facturación y gestión empresarial en desarrollo.

## Descripción

FactuSky es una aplicación backend para la gestión completa de facturación, inventario y administración de empresas. Diseñado para manejar múltiples compañías, usuarios, productos, ventas, compras y control de stock.

## Funcionalidades principales

- **Gestión de empresas y usuarios** - Multi-empresa con roles y permisos
- **Catálogo de productos** - Categorías, unidades, precios y stock
- **Inventario y almacenes** - Control de stock, movimientos y múltiples bodegas
- **Ventas y facturación** - Procesos de venta, clientes y pagos
- **Compras y proveedores** - Gestión de compras, proveedores y órdenes
- **Planes y módulos** - Sistema de suscripciones y módulos activables por empresa

## Tecnologías

- **Backend**: Node.js + Express
- **Bases de datos**: MongoDB (usuarios, empresas, roles) + MySQL (productos, inventario, ventas, compras)
- **Autenticación**: JWT + bcrypt
- **Archivos**: Cloudinary + Multer
- **Tiempo real**: Socket.io

## Estado del proyecto

⚠️ **En desarrollo activo** - Funcionalidades incompletas, APIs sujetas a cambios.

## Instalación rápida

```bash
pnpm install
cp .env.example .env
# Configurar variables de entorno
pnpm run dev
```

## Variables de entorno requeridas

Ver `.env.example` para la lista completa. Incluye:
- Puertos y URLs
- Credenciales MongoDB y MySQL
- Secrets JWT
- Configuración Cloudinary

## Scripts disponibles

- `pnpm run dev` - Servidor en desarrollo con recarga automática
- `pnpm run build` - Compilar para producción