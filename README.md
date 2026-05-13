# Uniformes La Torre - Sistema de Gestión Local

Este sistema ha sido diseñado para funcionar de manera **offline** y local. Todos los datos se guardan en el almacenamiento de tu navegador (LocalStorage).

## Requisitos
1. Tener [Node.js](https://nodejs.org/) instalado.
2. El archivo del logo debe estar en `public/logo.png`.

## Instalación
1. Descarga y extrae el archivo ZIP del proyecto.
2. Abre una terminal (CMD o PowerShell) en la carpeta del proyecto.
3. Instala los módulos necesarios:
   ```bash
   npm install
   ```

## Ejecución
Para iniciar el sistema:
```bash
npm run dev
```
Luego abre tu navegador en: `http://localhost:3000`

## Notas Importantes
- **Datos:** Los datos se guardan por navegador. Si usas Chrome, los datos estarán ahí. Si abres el programa en otro navegador, la lista estará vacía. 
- **Respaldo:** Se recomienda no borrar el historial del navegador/cookies para no perder la base de datos de productos.
- **Boleta:** La boleta se genera en tamaño A5 (media hoja A4) lista para imprimir.
