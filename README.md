# Correo 48h

Aviso por Slack cuando un correo que enviaste a alguien de fuera lleva 48 h sin respuesta. Se instala en tu propia cuenta de Gmail con Google Apps Script.

- `index.html`: página instaladora. Ábrela con el enlace de instalación que te pasa el equipo; monta el código y lo deja listo para copiar.
- `prompt.html`: escribes tu nombre y te da TU prompt para Claude Cowork (con tu enlace personal), listo para copiar. No envía nada a ningún sitio: arma el enlace en tu navegador.
- `codigo.plantilla.gs`: el motor, sin datos. La página le añade la configuración que viaja en el enlace.
- `AGENTE.md`: pasos para que un asistente lo instale en tu Chrome. Los permisos de Google los aceptas tú.

Este repositorio no contiene datos del equipo ni claves. La config no se sube a ningún servidor: la página la lee del propio enlace. Trata el enlace como privado y no lo compartas.

Cada enlace fija la huella del código (`plantilla_sha256`): si el código publicado cambia, la página dice ERROR DE PLANTILLA y hace falta un enlace nuevo.
