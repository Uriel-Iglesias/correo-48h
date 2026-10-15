# Correo 48h · playbook del agente

Instalas «Correo 48h» en el Gmail de Influentia de la persona que tienes delante, en su Chrome. Los permisos de Google los acepta ella. Etiquetas: español / English.

**Entrada:** su correo y su enlace (`https://uriel-iglesias.github.io/correo-48h/#c=…`). El enlace es privado: no lo repitas en tus respuestas ni lo pegues en otro sitio.

## Pasos
0. ¿Tienes el enlace completo, con `#c=`? Si no, pídeselo y para.
1. Cuenta: abre `https://script.google.com/home?authuser=<su correo>` y mira el avatar (arriba a la derecha): tiene que ser su correo de influentia.me. Si no, que cambie de cuenta ella.
2. Abre `https://script.google.com/home/triggers?authuser=<su correo>`. Solo cuenta la función `autoetiquetar` (un `procesar` suelto puede ser de otro proyecto, p. ej. Reuniones→Slack):
   - ningún proyecto con `autoetiquetar` → sigue;
   - uno → en el paso 4 usa ESE proyecto (pegas encima) y sigue;
   - dos o más → para: «⚠️ Correo 48h instalado dos veces (<proyecto X> y <proyecto Y>) → avisa a Uriel».
3. Abre el enlace en una pestaña de Chrome (no con WebFetch). Lee solo `#estado`, `#huella` y `#aviso-copia` (find o captura). `#estado` debe empezar por `LISTO`. Escribe su correo en «¿Estás en la lista?»: debe salir ✅. Pulsa «Copiar código»: `#aviso-copia` debe decir «✅ Copiado (N caracteres)». Si no: «Seleccionar todo el código» y Cmd/Ctrl+C.
4. Proyecto: el del paso 2 o, si no hay, «Nuevo proyecto» / «New project» en `script.google.com/home?authuser=<su correo>`. Ábrelo UNA vez y renómbralo enseguida a «Correo 48h». Nunca uses script.new ni el botón «Abrir script.new» de la página. Clic en el editor → Cmd/Ctrl+A → Cmd/Ctrl+V → Cmd/Ctrl+S. Comprueba: la línea 1 empieza por `// ▷ EJECUTAR` y la última es `var ARRANQUE = arranque_();` (unas 750 líneas). Si solo ves `function myFunction() {}`, el pegado falló: repite Cmd/Ctrl+A y Cmd/Ctrl+V una vez en ESTE proyecto; si vuelve a fallar, que pegue ella.
5. El desplegable de funciones debe decir `myFunction`; si no, elígelo. Nunca `probar`, `desinstalar` ni `desinstalarTodo`. Pulsa ▷ «Ejecutar» / «Run».
6. Permisos: pulsa «Revisar permisos» / «Review permissions» UNA vez y dile: «En la ventana de Google: elige tu cuenta, Configuración avanzada → Ir a Correo 48h, marca Seleccionar todo y pulsa Permitir. Dime "hecho".» Si no ve la ventana, que mire detrás de Chrome o en el Dock. No vuelvas a pulsar.
7. Lee el «Registro de ejecución» / «Execution log» (captura): debe salir «✅ INSTALADO para …» o «✅ YA ESTABA INSTALADO para …». Vacío → mira «Ejecuciones» / «Executions». Solo «Ejecución completada», sin ninguna línea ✅/❌/⚠️/⏸ → el código no es el nuestro: vuelve al paso 4 en el mismo proyecto.
8. Activadores (icono de reloj, barra izquierda): exactamente 2 en este proyecto, `autoetiquetar` y `procesar`.
9. Responde UNA línea: «✅ Correo 48h instalado para <correo>» o «❌ Correo 48h no se instaló: <última línea del registro> → avisa a Uriel».

## Reglas
- Como mucho UN ▷ extra en todo el proceso. Si sigue fallando, paso 9 con ❌.
- Nunca pulses tú ningún botón ni casilla de accounts.google.com (Permitir/Allow, Continuar/Continue, Seleccionar todo/Select all, Configuración avanzada/Advanced, Ir a… no seguro). No escribas contraseñas. No cambies ajustes.
- No envíes correos ni mensajes. No ejecutes `probar`.
- En script.google.com usa capturas y find; nunca read_page ni get_page_text de la página entera (el código lleva el webhook).
- Un solo proyecto: tras cualquier fallo vuelve a la misma pestaña.
- Sin control del navegador: guía a la persona con estos pasos, uno por mensaje, y espera su «hecho».

## Errores
| Ves | Haces |
|---|---|
| Cuenta que no es la suya de influentia.me | Que cambie de cuenta ella; repite desde 1 |
| `FALTA EL ENLACE` / `ENLACE ROTO` / `ERROR DE PLANTILLA` | Para y pide un enlace nuevo a Uriel |
| `NAVEGADOR NO COMPATIBLE` | Que actualice Chrome; repite el paso 3 |
| ❌ en «¿Estás en la lista?» o «NO INSTALADO · … lista» | Para: «❌ <texto> → avisa a Uriel» |
| ❌ o ⚠️ con «permisos» | ▷ una vez más (paso 5) y que marque «Seleccionar todo» |
| ⏸ o ⚠️ por otro motivo | Copia la línea literal y avisa a Uriel; sin reintentos |
| Ventana emergente bloqueada | Ella pulsa el icono de la barra de direcciones → «Permitir siempre ventanas de script.google.com»; tú ▷ una vez |
| «Acceso bloqueado» / `admin_policy_enforced` / Apps Script desactivado / «Esta app está bloqueada» | Para y avisa a Uriel |
| Editor en otro idioma | Iconos (▷, reloj) y etiquetas en inglés |
