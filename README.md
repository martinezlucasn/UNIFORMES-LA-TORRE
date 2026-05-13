# Uniformes La Torre - Sistema de Gestión Local

Este sistema ha sido diseñado para funcionar de manera **offline** (sin internet) en tu propia computadora.

## ⚠️ IMPORTANTE
**NO abrir el archivo `index.html` directamente.** Si lo haces, la página se verá en blanco. Debes seguir los pasos de "Instalación" y "Ejecución" detallados abajo.

## Requisitos
1. Tener **Node.js** instalado. Puedes descargarlo en [nodejs.org](https://nodejs.org/) (descarga la versión "LTS").

## Instalación
1. Descarga el archivo ZIP del proyecto y extráelo en una carpeta.
2. Abre una terminal o consola (**CMD** en Windows, o **Terminal** en Mac).
3. Entra a la carpeta del proyecto usando el comando `cd`:
   ```bash
   cd "ruta/de/tu/carpeta"
   ```
4. Instala los componentes necesarios (solo la primera vez):
   ```bash
   npm install
   ```

## Ejecución
Cada vez que quieras usar el programa:
1. Abre la terminal en la carpeta del proyecto.
2. Ejecuta:
   ```bash
   npm run dev
   ```
3. La terminal te dirá que el programa está listo. Abre tu navegador (Chrome, Edge, etc.) y escribe:
   `http://localhost:3000`

---

## Solución de Problemas (Si no carga)
1. **Error "npm no se reconoce":** Significa que no instalaste Node.js o debes reiniciar tu computadora después de instalarlo.
2. **Pantalla en blanco:** Asegúrate de estar entrando a `http://localhost:3000` y NO abriendo el archivo `.html`.
3. **Puerto ocupado:** Si ves un error de "port 3000 is already in use", significa que el programa ya se está ejecutando en otra ventana o tienes otra cosa abierta. Cierra las otras ventanas de terminal.
4. **Guardar datos:** Los datos se guardan en el navegador. No limpies el historial/cookies si quieres conservar tus productos y ventas.
