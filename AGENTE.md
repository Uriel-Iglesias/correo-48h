# Correo 48h · playbook del agente

Instalas «Correo 48h» en el Gmail de la persona que tienes delante, en su Chrome. Ella solo pulsa «Permitir». Etiquetas: español / English.

**Entrada:** el enlace de instalación que te da la persona (`https://uriel-iglesias.github.io/correo-48h/#c=…`). Es privado: no lo pegues en ningún otro sitio.

## Pasos
0. ¿Tienes el enlace completo, con `#c=`? Si no, pídeselo y para.
1. Cuenta: Chrome y Google deben estar con el correo de Influentia (dominio influentia.me) de esta persona (avatar, arriba a la derecha).
2. Abre https://script.google.com/home/triggers . Si ya hay activadores `autoetiquetar` o `procesar` → NO instales otro (avisos dobles): responde «✅ Correo 48h ya estaba instalado para <correo> (proyecto <nombre>)» y para.
3. Abre el enlace. Espera a que `#estado` empiece por `LISTO` y `#huella` diga «N caracteres · M personas». Escribe su correo en «¿Estás en la lista?»: debe salir ✅ (si sale ❌, ve a Errores). Pulsa «Copiar código». Si el portapapeles falla: «Seleccionar todo el código» y Cmd/Ctrl+C.
4. Si en https://script.google.com/home ya existe un proyecto «Correo 48h» sin activadores, ábrelo; si no, abre https://script.new . Clic en el editor → Cmd/Ctrl+A → Cmd/Ctrl+V → Cmd/Ctrl+S. Arriba debe verse `function myFunction`. Renombra «Proyecto sin título» / «Untitled project» a «Correo 48h».
5. Pulsa ▷ «Ejecutar» / «Run». Da igual la función elegida en el desplegable.
6. Autorización: «Revisar permisos» / «Review permissions» → su cuenta → si sale, «Configuración avanzada» / «Advanced» → «Ir a Correo 48h (no seguro)» / «Go to Correo 48h (unsafe)». En la última pantalla NO pulses tú: dile exactamente «Pulsa Permitir» (si hay casillas: «Marca Seleccionar todo y pulsa Permitir») y espera.
7. Lee el «Registro de ejecución» / «Execution log»: debe salir «✅ INSTALADO para …» o «✅ YA ESTABA INSTALADO para …». Si sale «❌ NO INSTALADO · …», copia el texto literal. Si tras Permitir no sale nada, pulsa ▷ otra vez.
8. Icono de reloj «Activadores» / «Triggers» (barra izquierda): tiene que haber 2, `autoetiquetar` y `procesar`. Si no, elige `myFunction`, pulsa ▷ y vuelve a mirar.
9. Responde UNA línea: «✅ Correo 48h instalado para <correo>» o «❌ <error literal> → avisa a Uriel».

## Reglas
- No envíes correos ni mensajes. No ejecutes `probar()`.
- No escribas contraseñas: si Google pide iniciar sesión, lo hace la persona. No cambies ajustes.
- Un solo proyecto. Nunca pulses «Permitir» / «Allow».
- Sin control del navegador: guía a la persona con estos mismos pasos, uno por mensaje, frases cortas, y espera su «hecho».

## Errores
| Ves | Haces |
|---|---|
| Cuenta que no es la suya de influentia.me | Que cambie de cuenta; repite desde 1 |
| `FALTA EL ENLACE` / `ENLACE ROTO` | Pide el enlace otra vez, entero |
| ❌ en «¿Estás en la lista?» o «NO INSTALADO · … lista» | Para: «❌ <texto> → avisa a Uriel» con su correo |
| `ERROR DE PLANTILLA` | Recarga; si sigue, para y avisa a Uriel |
| Editor en otro idioma | Iconos (▷, reloj) y etiquetas en inglés |
| Ventana emergente bloqueada | Icono en la barra de direcciones → permitir script.google.com → ▷ otra vez |
| «Esta app está bloqueada» / «This app is blocked» | Para y avisa a Uriel |
