// ▷ EJECUTAR: en el desplegable de arriba debe poner myFunction (si no, elígelo) y pulsa ▷ Ejecutar.
// Mira el «Registro de ejecución»: ✅ INSTALADO · ✅ YA ESTABA INSTALADO · ❌ NO INSTALADO (en rojo).
function myFunction() {
  return instalarForzado_();
}

/**
 * Correo 48 h → Slack · motor del kit de instalación (plantilla SIN datos)
 *
 * Qué hace, en la cuenta de Gmail de quien lo ejecuta (y solo en la suya):
 *   (a) ENVIADOS  · escribes a alguien de fuera → el hilo se etiqueta «48h» solo. Si a las 48 h no te ha
 *                   contestado, te avisa UNA vez por mensaje directo de Slack. Si contesta, la etiqueta se quita sola.
 *   (b) RECIBIDOS · (apagado por defecto) alguien de fuera te escribe a ti y llevas 48 h sin contestar → aviso.
 *
 * Interruptores (sin tocar código):
 *   · Un correo concreto: quitar la etiqueta «48h» (enviados) o poner la etiqueta «48h-no» (los dos sentidos).
 *   · Todo: crear en Gmail la etiqueta «48h-pausa». Para volver a encenderlo, borrar esa etiqueta.
 *
 * DATOS: la página de instalación cambia los dos marcadores de las líneas EQUIPO y COMUN (justo debajo)
 * por la lista del equipo y la configuración común. Tal cual está, este fichero no lleva ningún dato y,
 * si se ejecuta así, se para con «❌ NO INSTALADO · configuración vacía».
 *
 * ARRANQUE (bloque de nivel superior, la última línea del fichero). Apps Script ejecuta el código de nivel
 * superior en CADA ejecución (a mano o por activador) y antes de la función elegida. El arranque:
 *   · sin activadores → instala (autoetiquetar cada 10 min y procesar cada hora) y escribe
 *     «✅ INSTALADO para <nombre> · activadores: autoetiquetar, procesar»;
 *   · con los activadores justos → no toca nada y escribe «✅ YA ESTABA INSTALADO para <nombre> · activadores: …».
 *     Es lo que pasa en cada ejecución por activador: ni reinstala ni lanza error;
 *   · con activadores que faltan o sobran → los deja limpios y lo dice («· reparado (había: …)»);
 *   · cuenta fuera de la lista, configuración vacía o permisos a medias (no se marcó «Seleccionar todo») → Error en rojo
 *     «❌ NO INSTALADO · <motivo> · cuenta: <correo>».
 *     Si ya había activadores no lanza (rompería las ejecuciones por activador): lo escribe con «⚠️» y no toca nada;
 *   · después de desinstalar() (propiedad de usuario «correo48h_desinstalado» = «1») → no reinstala y escribe
 *     «⏸ DESINSTALADO a propósito …». myFunction quita la marca y vuelve a instalar.
 *
 *   · si en ESTA ejecución acaba de instalar, probar · desinstalar · desinstalarTodo · procesar no hacen nada
 *     (por si el desplegable no estaba en myFunction): lo dicen con «↪ … no se ejecuta».
 *
 * Funciones del desplegable (las internas acaban en «_» y no salen):
 *   myFunction      · instala o reinstala limpio (quita la marca de desinstalado). Es la que sale por defecto.
 *   comprobar       · SOLO LECTURA: lista activadores, etiquetas y marca. Ojo: el arranque corre antes que ella;
 *                     si no estaba instalado, la línea de arriba dirá que lo acaba de instalar.
 *   desinstalar     · quita los activadores y deja la marca: el arranque ya no reinstala. Para volver: myFunction.
 *   desinstalarTodo · lo mismo y además borra la memoria (la marca se conserva).
 *   probar          · manda UN mensaje de prueba a tu Slack. Solo a mano: nada la llama sola.
 *   diagnosticar · simular · verificar · instalar · instalarEnsayo · pasarAReal · procesar · autoetiquetar
 *
 * ESTE SCRIPT NO ENVÍA NINGÚN CORREO. Solo lee Gmail, pone y quita etiquetas y llama a Slack cuando toca
 * avisar (o en probar). Instalar, comprobar y desinstalar no llaman a Slack.
 * Sin doGet: esta variante se pega en script.new y no se publica como aplicación web (el arranque corre en
 * todas las ejecuciones y, en una cuenta fuera de la lista, una página web acabaría en error).
 */
var EQUIPO = /*__EQUIPO__*/{};
var COMUN = /*__COMUN__*/{};

var CLAVE_DESINSTALADO = 'correo48h_desinstalado'; // '1' = desinstalado a propósito: el arranque no reinstala
var RE_WEBHOOK = /^https:\/\/hooks\.slack\.com\/triggers\/\S+$/;
var RE_SLACK_ID = /^[UW][A-Z0-9]{5,}$/;
var POR_DEFECTO = { destino: 'mensaje directo de Slack', zona: 'Europe/Madrid', horas: 48, enviados: true,
  recibidos: false, solo_laborables: false, recibidos_solo_conocidos: true };
var ORDEN_ACTIVADORES = ['autoetiquetar', 'procesar'];

function tieneClaves_(o) {
  if (!o || typeof o !== 'object') return false;
  for (var k in o) { if (Object.prototype.hasOwnProperty.call(o, k)) return true; }
  return false;
}
/** Ficha de la persona en EQUIPO (sin distinguir mayúsculas). null = no está en la lista. */
function fichaDe_(correo) {
  var e = String(correo || '').toLowerCase();
  if (!e || !tieneClaves_(EQUIPO)) return null;
  for (var k in EQUIPO) {
    if (Object.prototype.hasOwnProperty.call(EQUIPO, k) && String(k).toLowerCase() === e) return EQUIPO[k] || null;
  }
  return null;
}
/** CONFIG de la cuenta que ejecuta = valores por defecto + COMUN + su ficha. null = no está en la lista. */
function configWeb_() {
  var e = cuentaActual_(), f = fichaDe_(e), k;
  if (!f || typeof f !== 'object') return null;
  var c = {};
  for (k in POR_DEFECTO) c[k] = POR_DEFECTO[k];
  if (COMUN && typeof COMUN === 'object') { for (k in COMUN) { if (Object.prototype.hasOwnProperty.call(COMUN, k)) c[k] = COMUN[k]; } }
  for (k in f) { if (Object.prototype.hasOwnProperty.call(f, k)) c[k] = f[k]; }
  c.correo = e;
  c.persona = c.persona || e.split('@')[0];
  c.nombre = c.nombre || c.persona;
  c.dominio = String(c.dominio || e.split('@')[1] || '').toLowerCase();
  c.horas = Number(c.horas) > 0 ? Number(c.horas) : POR_DEFECTO.horas;
  return c;
}
var CONFIG = configWeb_() || { persona: '__FUERA__', nombre: '__FUERA__', correo: '__FUERA__', slack_id: '__FUERA__',
  webhook: '', destino: POR_DEFECTO.destino, horas: POR_DEFECTO.horas, enviados: false, recibidos: false,
  solo_laborables: false, recibidos_solo_conocidos: true, dominio: '__FUERA__', zona: POR_DEFECTO.zona };

var ETIQUETA_SEGUIR = '48h';                  // enviados en seguimiento (se pone sola)
var ETIQUETA_AVISADO = '48h-avisado';         // enviados ya avisados
var ETIQUETA_POR_CONTESTAR = '48h-por-contestar'; // recibidos ya avisados
var ETIQUETA_NO = '48h-no';                   // la persona: «este hilo, nunca»
var ETIQUETA_PAUSA = '48h-pausa';             // si EXISTE en Gmail, todo queda en pausa
var PREFIJO_MEMORIA = 'c48::';                // enviados: c48::<hilo> → id del envío avisado
var PREFIJO_RECIBIDOS = 'r48::';              // recibidos: r48::<hilo> → id del mensaje avisado
var CLAVE_ULTIMO_AUTO = 'ultimo_auto';        // enviados: último envío propio ya mirado (ms)
var CLAVE_INICIO_RECIBIDOS = 'inicio_recibidos'; // recibidos: nada anterior a esto avisa (ms)
var CLAVE_MODO = 'modo';                      // 'ensayo' (solo registro) | 'real'
var MAX_AVISOS_POR_PASADA = 10;
var MAX_HILOS = 200;
var MAX_DESTINATARIOS_RECIBIDOS = 8;          // más gente que esto en Para+Cc = envío masivo
var BUSQUEDA_ENVIADOS = 'in:sent newer_than:2d -in:chats -in:drafts';
var BUSQUEDA_SEGUIMIENTO = '(label:' + ETIQUETA_SEGUIR + ' OR label:' + ETIQUETA_AVISADO + ') -in:trash -in:spam';
var BUSQUEDA_RECIBIDOS = 'in:inbox newer_than:10d -in:chats -in:drafts -label:' + ETIQUETA_NO +
  ' -category:promotions -category:social -category:updates -category:forums';
var ROBOTS = /(noreply|no-reply|no_reply|notification|notifications|notificaciones|mailer-daemon|postmaster|newsletter|donotreply|do-not-reply|bounce|calendar-notification|@resource\.calendar\.google\.com)/;

function ahora_() { return Date.now(); }

// ── Instalación ─────────────────────────────────────────────────────────────
function instalar() { return instalar_('real'); }
function instalarEnsayo() { return instalar_('ensayo'); }
function pasarAReal() {
  if (!configOk_(true)) return false;
  PropertiesService.getUserProperties().setProperty(CLAVE_MODO, 'real');
  Logger.log('Modo REAL: a partir de ahora los avisos llegan a Slack (' + CONFIG.destino + ').');
  return true;
}
function instalar_(modo, nota) { return !!instalarDetalle_(modo, nota, false); }
/**
 * Instalación limpia bajo candado: quita TODOS los activadores del proyecto, quita la marca de desinstalado
 * y crea los justos. soloSiFalta = true (arranque): si al coger el candado ya están completos, no toca nada.
 * Devuelve 'instalado' | 'ya' | '' (no se puede instalar en esta cuenta).
 */
function instalarDetalle_(modo, nota, soloSiFalta) {
  if (!configOk_(true)) return '';
  return conCandado_(function () {
    if (soloSiFalta) {
      var est = estadoActivadores_();
      if (est.completo) {
        Logger.log('✅ YA ESTABA INSTALADO para ' + CONFIG.nombre + ' · activadores: ' + est.lista);
        return 'ya';
      }
    }
    quitarActivadores_();
    var props = PropertiesService.getUserProperties();
    var ahora = ahora_();
    props.deleteProperty(CLAVE_DESINSTALADO);
    props.setProperty(CLAVE_MODO, modo);
    etiqueta_(ETIQUETA_NO);                     // a mano para la persona desde el primer día
    if (CONFIG.enviados) {
      etiqueta_(ETIQUETA_SEGUIR); etiqueta_(ETIQUETA_AVISADO);
      var previo = Number(props.getProperty(CLAVE_ULTIMO_AUTO) || 0);
      if (!previo || ahora - previo > 24 * 3600000) props.setProperty(CLAVE_ULTIMO_AUTO, String(ahora));
      ScriptApp.newTrigger('autoetiquetar').timeBased().everyMinutes(10).create();
    }
    if (CONFIG.recibidos) {
      etiqueta_(ETIQUETA_POR_CONTESTAR);
      if (!props.getProperty(CLAVE_INICIO_RECIBIDOS)) props.setProperty(CLAVE_INICIO_RECIBIDOS, String(ahora));
    }
    if (CONFIG.enviados || CONFIG.recibidos) ScriptApp.newTrigger('procesar').timeBased().everyHours(1).create();
    Logger.log('Configuración · ' + CONFIG.nombre + ' <' + CONFIG.correo + '> · modo ' + String(modo).toUpperCase() +
      ' · enviados ' + (CONFIG.enviados ? 'SÍ' : 'NO') + ' · recibidos ' + (CONFIG.recibidos ? 'SÍ' : 'NO') +
      ' · umbral ' + CONFIG.horas + ' h' + (CONFIG.solo_laborables ? ' laborables' : '') + ' · Slack: ' + CONFIG.destino);
    Logger.log('✅ INSTALADO para ' + CONFIG.nombre + ' · activadores: ' + estadoActivadores_().lista + (nota ? ' · ' + nota : ''));
    return 'instalado';
  });
}
/** myFunction: instalación limpia forzada (quita la marca de desinstalado). */
function instalarForzado_() {
  var motivo = motivoNoInstalable_();
  if (motivo) noInstalado_(motivo);
  if (faltanPermisos_()) noInstalado_(MOTIVO_PERMISOS);
  if (typeof ARRANQUE !== 'undefined' && ARRANQUE && ARRANQUE.accion === 'instalado') {
    Logger.log('myFunction · ya quedó instalado hace un instante, en esta misma ejecución: no hace falta repetir.');
    return true;
  }
  var r = '';
  try { r = instalarDetalle_('real', 'reinstalación limpia (myFunction)', false); }
  catch (e) { noInstalado_('fallo al crear los activadores (' + ((e && e.message) || e) + ')'); }
  if (!r) noInstalado_('no se pudo instalar');
  return true;
}
function conCandado_(fn) {
  var candado = null;
  try {
    candado = LockService.getUserLock();
    if (!candado.tryLock(20000)) { Logger.log('Aviso: otra ejecución tenía el candado; sigo igualmente.'); candado = null; }
  } catch (e) { candado = null; }
  try { return fn(); } finally { if (candado) { try { candado.releaseLock(); } catch (e2) {} } }
}
function quitarActivadores_() {
  var n = 0;
  ScriptApp.getProjectTriggers().forEach(function (t) { ScriptApp.deleteTrigger(t); n++; });
  return n;
}
function desinstalar() {
  if (recienInstalado_('desinstalar')) return 0;
  var n = quitarActivadores_();
  PropertiesService.getUserProperties().setProperty(CLAVE_DESINSTALADO, '1');
  Logger.log('⏹ DESINSTALADO · activadores eliminados: ' + n + ' · ya no se reinstala solo al ejecutar. ' +
    'Para volver a activarlo: elige myFunction y pulsa ▷ Ejecutar.');
  return n;
}
function desinstalarTodo() {
  if (recienInstalado_('desinstalarTodo')) return 0;
  var n = quitarActivadores_();
  var props = PropertiesService.getUserProperties();
  props.deleteAllProperties();
  props.setProperty(CLAVE_DESINSTALADO, '1');
  Logger.log('⏹ DESINSTALADO y memoria borrada · activadores eliminados: ' + n + '. Las etiquetas 48h* siguen en Gmail: ' +
    'se pueden borrar a mano. Para volver a activarlo: elige myFunction y pulsa ▷ Ejecutar.');
  return n;
}
function marcadoDesinstalado_() {
  return PropertiesService.getUserProperties().getProperty(CLAVE_DESINSTALADO) === '1';
}
function noInstalado_(motivo) {
  var texto = '❌ NO INSTALADO · ' + motivo + ' · cuenta: ' + (cuentaActual_() || 'desconocida');
  Logger.log(texto);
  throw new Error(texto);
}
var MOTIVO_PERMISOS = 'faltan permisos de Google (se aceptaron a medias): pulsa ▷ Ejecutar otra vez, marca «Seleccionar todo» y pulsa Permitir';
/** true = Google no tiene todos los permisos del script (consentimiento parcial) · false = todos · null = no se pudo saber. */
function faltanPermisos_() {
  try {
    var info = ScriptApp.getAuthorizationInfo(ScriptApp.AuthMode.FULL);
    return info.getAuthorizationStatus() === ScriptApp.AuthorizationStatus.REQUIRED;
  } catch (e) { return null; }
}
/** Si esta misma ejecución acaba de instalar, la función elegida no era myFunction: no se hace nada más. */
function recienInstalado_(funcion) {
  if (typeof ARRANQUE === 'undefined' || !ARRANQUE || ARRANQUE.accion !== 'instalado') return false;
  Logger.log('↪ ' + funcion + ' no se ejecuta: el arranque acaba de instalarlo en esta misma ejecución. No hace falta nada más.');
  return true;
}
function activadoresEsperados_() {
  var out = [];
  if (CONFIG.enviados) out.push('autoetiquetar');
  if (CONFIG.enviados || CONFIG.recibidos) out.push('procesar');
  return out;
}
/** Activadores del proyecto frente a los esperados (exactamente uno de cada, ninguno más). */
function estadoActivadores_() {
  var nombres = ScriptApp.getProjectTriggers().map(function (t) { return String(t.getHandlerFunction()); });
  var esperados = activadoresEsperados_();
  var cuenta = {};
  nombres.forEach(function (n) { cuenta[n] = (cuenta[n] || 0) + 1; });
  var completo = esperados.length > 0 && nombres.length === esperados.length &&
    esperados.every(function (n) { return cuenta[n] === 1; });
  var claves = Object.keys(cuenta).sort(function (a, b) {
    var ia = ORDEN_ACTIVADORES.indexOf(a), ib = ORDEN_ACTIVADORES.indexOf(b);
    ia = ia === -1 ? 99 : ia; ib = ib === -1 ? 99 : ib;
    return ia !== ib ? ia - ib : (a < b ? -1 : a > b ? 1 : 0);
  });
  var lista = claves.map(function (n) { return n + (cuenta[n] > 1 ? ' ×' + cuenta[n] : ''); }).join(', ');
  return { total: nombres.length, completo: completo, lista: lista || 'ninguno' };
}
function verificar() {
  var fallos = [];
  var ok = function (c, texto) { Logger.log((c ? 'OK    · ' : 'FALLO · ') + texto); if (!c) fallos.push(texto); };
  ok(configRellena_(), 'Configuración rellena (sin «__»)');
  ok(identidadOk_(), 'El script corre en la cuenta de ' + CONFIG.correo + ' (cuenta actual: ' + cuentaActual_() + ')');
  ok(RE_WEBHOOK.test(String(CONFIG.webhook || '')), 'Webhook de Slack con el formato esperado');
  var nombres = ScriptApp.getProjectTriggers().map(function (t) { return t.getHandlerFunction(); });
  ok(!CONFIG.enviados || nombres.indexOf('autoetiquetar') !== -1, 'Activador autoetiquetar (cada 10 min)' + (CONFIG.enviados ? '' : ' — no aplica'));
  ok(nombres.indexOf('procesar') !== -1, 'Activador procesar (cada hora)');
  ok(nombres.length === (CONFIG.enviados ? 2 : 1), 'Número de activadores: ' + nombres.length + ' (sin duplicados)');
  ok(!!GmailApp.getUserLabelByName(ETIQUETA_NO), 'Etiqueta «' + ETIQUETA_NO + '» creada');
  if (CONFIG.enviados) ok(!!GmailApp.getUserLabelByName(ETIQUETA_SEGUIR), 'Etiqueta «' + ETIQUETA_SEGUIR + '» creada');
  Logger.log('Modo: ' + modo_().toUpperCase() + ' · Pausa: ' + (enPausa_() ? 'SÍ (existe «' + ETIQUETA_PAUSA + '»)' : 'no'));
  Logger.log(fallos.length ? '=== ' + fallos.length + ' FALLO(S) ===' : '=== VERIFICACIÓN CORRECTA ===');
  return fallos;
}
/** SOLO LECTURA: no crea, no borra, no cambia nada (ni activadores, ni etiquetas, ni memoria). */
function comprobar() {
  var cuenta = cuentaActual_() || 'desconocida';
  var motivo = motivoNoInstalable_();
  var activadores = ScriptApp.getProjectTriggers().map(function (t) {
    var tipo = '';
    try { tipo = String(t.getEventType()); } catch (e) {}
    return String(t.getHandlerFunction()) + (tipo ? ' (' + tipo + ')' : '');
  });
  var est = estadoActivadores_();
  var etiquetas = [ETIQUETA_SEGUIR, ETIQUETA_AVISADO, ETIQUETA_NO, ETIQUETA_POR_CONTESTAR, ETIQUETA_PAUSA].map(function (n) {
    return n + (GmailApp.getUserLabelByName(n) ? ' ✔' : ' ✘');
  });
  var marca = marcadoDesinstalado_();
  var estado = motivo ? 'NO INSTALABLE EN ESTA CUENTA' : est.completo ? 'INSTALADO Y COMPLETO' :
    est.total ? 'ACTIVADORES QUE NO CUADRAN (ejecuta myFunction)' : marca ? 'DESINSTALADO A PROPÓSITO' : 'NO INSTALADO';
  Logger.log('=== COMPROBAR (solo lectura: no cambia nada) · cuenta: ' + cuenta + ' ===');
  Logger.log('En la lista del equipo: ' + (motivo ? 'NO · ' + motivo : 'SÍ · ' + CONFIG.nombre));
  Logger.log('Activadores (' + activadores.length + '): ' + (activadores.join(' | ') || 'ninguno') +
    ' · esperados: ' + (activadoresEsperados_().join(', ') || 'ninguno'));
  Logger.log('Etiquetas: ' + etiquetas.join(' · ') + ' («' + ETIQUETA_PAUSA + '» ✘ = no está en pausa)');
  Logger.log('Marca de desinstalado: ' + (marca ? 'SÍ' : 'no') + ' · Modo: ' + modo_().toUpperCase());
  Logger.log('=== RESULTADO: ' + estado + ' ===');
  return { estado: estado, cuenta: cuenta, activadores: activadores, etiquetas: etiquetas, desinstalado: marca };
}
/** Manda UN mensaje de prueba al Slack de la persona. Solo a mano: nada lo llama solo. */
function probar() {
  if (recienInstalado_('probar')) return false;
  if (!configOk_(true)) return false;
  var carga = { account: CONFIG.slack_id, asunto: 'Prueba de Correo 48h', remitente: 'Correo 48h', horas: 0,
    fecha: Utilities.formatDate(new Date(ahora_()), CONFIG.zona, 'dd/MM HH:mm'),
    enlace: 'https://mail.google.com/mail/u/0/#inbox',
    texto: '🧪 Prueba de Correo 48h: si ves este mensaje, los avisos te llegarán aquí. No hay que hacer nada.' };
  var ok = enviar_(CONFIG.webhook, carga);
  Logger.log(ok ? '✅ PRUEBA ENVIADA: mira tu Slack (mensaje directo).' : '❌ La prueba no llegó a Slack: mira la línea de arriba.');
  return ok;
}

// ── Identidad y configuración ──────────────────────────────────────────────
function configRellena_() {
  return ['persona', 'nombre', 'correo', 'slack_id', 'webhook'].every(function (k) {
    return CONFIG[k] && String(CONFIG[k]).indexOf('__') === -1;
  });
}
function cuentaActual_() {
  var e = '';
  try { e = Session.getEffectiveUser().getEmail() || ''; } catch (x) {}
  if (!e) { try { e = Session.getActiveUser().getEmail() || ''; } catch (y) {} }
  return String(e).toLowerCase();
}
function identidadOk_() { return cuentaActual_() === String(CONFIG.correo).toLowerCase(); }
/** '' = se puede instalar y trabajar en esta cuenta; si no, el motivo en llano. */
function motivoNoInstalable_() {
  if (!tieneClaves_(EQUIPO) || !tieneClaves_(COMUN)) {
    return 'configuración vacía (este código no lleva la lista del equipo: cópialo otra vez desde la página de instalación, abierta con el enlace completo)';
  }
  if (!RE_WEBHOOK.test(String(COMUN.webhook || ''))) return 'configuración incompleta (falta el webhook de Slack o no tiene el formato esperado)';
  var e = cuentaActual_();
  if (!e) return 'no se puede leer la cuenta de Google que ejecuta el script';
  if (!fichaDe_(e)) return 'esta cuenta no está en la lista del equipo';
  if (!identidadOk_()) return 'la cuenta cambió durante la ejecución';
  if (!RE_SLACK_ID.test(String(CONFIG.slack_id || ''))) return 'a esta persona le falta el slack_id en la lista (o no tiene el formato de Slack)';
  if (!RE_WEBHOOK.test(String(CONFIG.webhook || ''))) return 'el webhook de esta persona no tiene el formato esperado';
  if (!CONFIG.enviados && !CONFIG.recibidos) return 'enviados y recibidos están apagados: no hay nada que vigilar';
  return '';
}
function configOk_(registrar) {
  var motivo = motivoNoInstalable_();
  if (motivo && registrar) Logger.log('PARADO: ' + motivo + ' · cuenta: ' + (cuentaActual_() || 'desconocida') + '. No se hace nada.');
  return !motivo;
}
function enPausa_() { return !!GmailApp.getUserLabelByName(ETIQUETA_PAUSA); }
function modo_() { return PropertiesService.getUserProperties().getProperty(CLAVE_MODO) || 'real'; }
function puedoTrabajar_() {
  if (!configOk_(true)) return false;
  if (typeof ARRANQUE !== 'undefined' && ARRANQUE && ARRANQUE.accion === 'sin-permisos') {
    Logger.log('PARADO: ' + MOTIVO_PERMISOS + '. No se hace nada.');
    return false;
  }
  if (enPausa_()) { Logger.log('En pausa: existe la etiqueta «' + ETIQUETA_PAUSA + '». No se hace nada.'); return false; }
  return true;
}

// ── Enviados: auto-etiquetado y seguimiento ────────────────────────────────
function autoetiquetar() {
  if (!CONFIG.enviados) { Logger.log('Enviados apagado para ' + CONFIG.persona + '.'); return 0; }
  if (!puedoTrabajar_()) return 0;
  var ensayo = modo_() === 'ensayo';
  var props = PropertiesService.getUserProperties();
  var desde = Number(props.getProperty(CLAVE_ULTIMO_AUTO) || 0);
  if (!desde) {
    props.setProperty(CLAVE_ULTIMO_AUTO, String(ahora_()));
    Logger.log('Primera ejecución: punto de partida en ahora, no se etiqueta el histórico.');
    return 0;
  }
  var hilos = buscarHilos_(BUSQUEDA_ENVIADOS);
  var mias = misDirecciones_();
  var lSeguir = ensayo ? null : etiqueta_(ETIQUETA_SEGUIR);
  var lAvisado = GmailApp.getUserLabelByName(ETIQUETA_AVISADO);
  var etiquetados = 0, visto = 0;
  hilos.forEach(function (hilo) {
    var nuevos = [];
    hilo.getMessages().forEach(function (m) {
      if (!esMio_(email_(m.getFrom()), mias)) return;
      var t = m.getDate().getTime();
      if (t <= desde) return;
      if (t > visto) visto = t;
      nuevos.push(m);
    });
    if (!nuevos.length) return;
    if (tieneEtiqueta_(hilo, ETIQUETA_NO)) return;          // la persona dijo «nunca»
    var bueno = null;
    for (var i = 0; i < nuevos.length; i++) { if (motivoEnvio_(nuevos[i]) === '') { bueno = nuevos[i]; break; } }
    if (!bueno) return;
    etiquetados++;
    if (ensayo) { Logger.log('ENSAYO → etiquetaría 48h: ' + (bueno.getSubject() || '(sin asunto)')); return; }
    try { hilo.addLabel(lSeguir); } catch (e) { Logger.log('No se pudo etiquetar: ' + e); etiquetados--; return; }
    if (lAvisado) { try { hilo.removeLabel(lAvisado); } catch (e2) {} }
    props.deleteProperty(PREFIJO_MEMORIA + hilo.getId());
    Logger.log('Etiquetado 48h: ' + (bueno.getSubject() || '(sin asunto)') + ' → ' + clienteDe_(bueno));
  });
  if (!ensayo) props.setProperty(CLAVE_ULTIMO_AUTO, String(visto || ahora_()));
  Logger.log('Auto-etiquetado · revisados: ' + hilos.length + ' · etiquetados: ' + etiquetados + (ensayo ? ' (ENSAYO)' : ''));
  return etiquetados;
}
function motivoEnvio_(m) {
  try { var auto = m.getHeader('Auto-Submitted') || ''; if (auto && !/^no$/i.test(auto)) return 'respuesta automática mía'; } catch (e) {}
  if (esInvitacionCalendario_(m.getSubject())) return 'invitación de calendario';
  if (!destinatariosExternos_(m).length) return 'sin destinatarios externos (solo gente de casa o robots)';
  return '';
}
function procesar() {
  if (recienInstalado_('procesar')) return { avisos: 0, respondidos: 0, ignorados: 0, recibidos: 0 };
  return pasada_(modo_() === 'ensayo');
}
function simular() { return pasada_(true); }
function pasada_(soloRegistro) {
  var r = { avisos: 0, respondidos: 0, ignorados: 0, recibidos: 0 };
  if (!puedoTrabajar_()) return r;
  var cupo = { quedan: MAX_AVISOS_POR_PASADA };
  if (CONFIG.enviados) recorrerEnviados_(soloRegistro, r, cupo);
  if (CONFIG.recibidos) recorrerRecibidos_(soloRegistro, r, cupo);
  Logger.log('Resumen · avisos enviados: ' + r.avisos + ' · recibidos: ' + r.recibidos + ' · respondidos: ' +
    r.respondidos + ' · ignorados: ' + r.ignorados + (soloRegistro ? ' (simulado)' : ''));
  return r;
}
function recorrerEnviados_(soloRegistro, r, cupo) {
  var hilos = buscarHilos_(BUSQUEDA_SEGUIMIENTO);
  Logger.log('Hilos en seguimiento: ' + hilos.length);
  var props = PropertiesService.getUserProperties();
  var lSeguir = GmailApp.getUserLabelByName(ETIQUETA_SEGUIR);
  var lAvisado = soloRegistro ? null : etiqueta_(ETIQUETA_AVISADO);
  for (var i = 0; i < hilos.length; i++) {
    var hilo = hilos[i];
    if (tieneEtiqueta_(hilo, ETIQUETA_NO)) {                 // apagado a mano en este hilo
      if (!soloRegistro && lSeguir) { try { hilo.removeLabel(lSeguir); } catch (e0) {} }
      r.ignorados++; continue;
    }
    var d = analizarEnvio_(hilo);
    if (!d.enviadoId) {
      Logger.log('Sin envío propio, se ignora: ' + d.asunto);
      if (!soloRegistro && lSeguir) { try { hilo.removeLabel(lSeguir); } catch (e) {} }
      r.ignorados++; continue;
    }
    if (d.respuesta) {
      Logger.log('Respondido: ' + d.cliente + ' · ' + d.asunto);
      if (!soloRegistro) {
        if (lSeguir) { try { hilo.removeLabel(lSeguir); } catch (e2) {} }
        if (lAvisado) { try { hilo.removeLabel(lAvisado); } catch (e3) {} }
        props.deleteProperty(PREFIJO_MEMORIA + d.threadId);
      }
      r.respondidos++; continue;
    }
    if (d.horas < CONFIG.horas) continue;
    if (props.getProperty(PREFIJO_MEMORIA + d.threadId) === d.enviadoId) continue;
    if (cupo.quedan <= 0) { Logger.log('Tope de avisos por pasada; el resto, en la siguiente.'); break; }
    var carga = carga_(d.threadId, d.asunto, d.cliente, d.horas, d.fecha,
      '⏰ Sin respuesta en ' + d.horas + ' h · ' + d.cliente + ' · ' + asuntoCorto_(d.asunto));
    if (soloRegistro) { Logger.log('SIMULADO → ' + JSON.stringify(carga)); r.avisos++; cupo.quedan--; continue; }
    if (enviar_(CONFIG.webhook, carga)) {
      props.setProperty(PREFIJO_MEMORIA + d.threadId, d.enviadoId);
      try { hilo.addLabel(lAvisado); } catch (e4) {}
      if (lSeguir) { try { hilo.removeLabel(lSeguir); } catch (e5) {} }
      r.avisos++; cupo.quedan--;
      Logger.log('Avisado (enviado): ' + d.cliente + ' · ' + d.asunto + ' · ' + d.horas + ' h');
    } else {
      Logger.log('NO avisado (fallo de webhook), se reintenta en la próxima pasada: ' + d.asunto);
    }
  }
}
function analizarEnvio_(hilo) {
  var d = { threadId: hilo.getId(), enviadoId: '', asunto: hilo.getFirstMessageSubject() || '(sin asunto)',
    cliente: '', fecha: '', horas: 0, respuesta: false };
  var mensajes = hilo.getMessages();
  var mias = misDirecciones_();
  var idx = -1;
  for (var i = mensajes.length - 1; i >= 0; i--) { if (esMio_(email_(mensajes[i].getFrom()), mias)) { idx = i; break; } }
  if (idx === -1) return d;
  var enviado = mensajes[idx];
  d.enviadoId = enviado.getId();
  d.asunto = enviado.getSubject() || d.asunto;
  d.cliente = clienteDe_(enviado);
  d.fecha = Utilities.formatDate(enviado.getDate(), CONFIG.zona, 'dd/MM HH:mm');
  d.horas = horasDesde_(enviado.getDate().getTime());
  for (var j = idx + 1; j < mensajes.length; j++) {
    var m = mensajes[j], from = m.getFrom() || '', email = email_(from);
    if (esMio_(email, mias) || esInterno_(email)) continue;
    if (esAutomatico_(from, m)) continue;
    d.respuesta = true; break;
  }
  return d;
}

// ── Recibidos (el «revés», apagado por defecto) ────────────────────────────
/**
 * Avisa cuando alguien de FUERA te ha escrito a TI (en Para) y llevas CONFIG.horas sin contestar.
 * Anti-ruido (cualquiera de estos = no avisa):
 *   · solo bandeja de entrada (si lo archivas, se da por atendido) y nada de Promociones/Social/Notificaciones/Foros
 *   · remitentes robot (noreply, notificaciones…), boletines y listas (List-Unsubscribe, List-Id, Precedence, Auto-Submitted)
 *   · invitaciones de calendario · gente de casa (@dominio) · tú solo en Cc · envíos a más de 8 personas
 *   · remitentes a los que nunca has escrito (recibidos_solo_conocidos) · nada anterior a la instalación
 *   · hilos con la etiqueta «48h-no»
 */
function recorrerRecibidos_(soloRegistro, r, cupo) {
  var props = PropertiesService.getUserProperties();
  var inicio = Number(props.getProperty(CLAVE_INICIO_RECIBIDOS) || 0);
  if (!inicio) {
    if (!soloRegistro) props.setProperty(CLAVE_INICIO_RECIBIDOS, String(ahora_()));
    Logger.log('[recibidos] Primera ejecución: punto de partida en ahora, no se avisa del histórico.');
    return;
  }
  var mias = misDirecciones_();
  var lPor = soloRegistro ? null : etiqueta_(ETIQUETA_POR_CONTESTAR);
  buscarHilos_('label:' + ETIQUETA_POR_CONTESTAR).forEach(function (hilo) {
    var d = analizarRecibido_(hilo, mias, inicio);
    if (d.contestado && !soloRegistro) {
      try { hilo.removeLabel(lPor); } catch (e) {}
      props.deleteProperty(PREFIJO_RECIBIDOS + d.threadId);
    }
  });
  var hilos = buscarHilos_(BUSQUEDA_RECIBIDOS);
  Logger.log('[recibidos] hilos revisados: ' + hilos.length);
  for (var i = 0; i < hilos.length; i++) {
    var d = analizarRecibido_(hilos[i], mias, inicio);
    if (!d.avisar) continue;
    if (props.getProperty(PREFIJO_RECIBIDOS + d.threadId) === d.mensajeId) continue;
    if (cupo.quedan <= 0) { Logger.log('[recibidos] Tope de avisos por pasada.'); break; }
    var nombre = soloNombre_(d.remitente);
    var carga = carga_(d.threadId, d.asunto, nombre, d.horas, d.fecha,
      '📬 Sin contestar en ' + d.horas + ' h · ' + nombre + ' · ' + asuntoCorto_(d.asunto));
    if (soloRegistro) { Logger.log('[recibidos] SIMULADO → ' + JSON.stringify(carga)); r.recibidos++; cupo.quedan--; continue; }
    if (enviar_(CONFIG.webhook, carga)) {
      props.setProperty(PREFIJO_RECIBIDOS + d.threadId, d.mensajeId);
      try { hilos[i].addLabel(lPor); } catch (e2) {}
      r.recibidos++; cupo.quedan--;
      Logger.log('[recibidos] Avisado: ' + nombre + ' · ' + d.asunto + ' · ' + d.horas + ' h');
    }
  }
}
function analizarRecibido_(hilo, mias, inicio) {
  var d = { threadId: hilo.getId(), mensajeId: '', asunto: hilo.getFirstMessageSubject() || '(sin asunto)',
    remitente: '', horas: 0, fecha: '', contestado: false, avisar: false, motivo: '' };
  if (tieneEtiqueta_(hilo, ETIQUETA_NO)) { d.motivo = 'hilo con 48h-no'; return d; }
  var mensajes = hilo.getMessages();
  var ultimo = null;
  for (var i = mensajes.length - 1; i >= 0; i--) {
    if (!esAutomatico_(mensajes[i].getFrom() || '', mensajes[i]) || esMio_(email_(mensajes[i].getFrom()), mias)) { ultimo = mensajes[i]; break; }
  }
  if (!ultimo) { d.motivo = 'solo mensajes automáticos'; return d; }
  var from = ultimo.getFrom() || '', email = email_(from);
  d.mensajeId = ultimo.getId();
  d.asunto = ultimo.getSubject() || d.asunto;
  d.remitente = from;
  d.fecha = Utilities.formatDate(ultimo.getDate(), CONFIG.zona, 'dd/MM HH:mm');
  d.horas = horasDesde_(ultimo.getDate().getTime());
  if (esMio_(email, mias)) { d.contestado = true; d.motivo = 'ya contestado'; return d; }
  var motivo = ruidoRecibido_(ultimo, email, mias, inicio);
  if (motivo) { d.motivo = motivo; return d; }
  if (d.horas < CONFIG.horas) { d.motivo = 'solo ' + d.horas + ' h'; return d; }
  d.avisar = true;
  return d;
}
function ruidoRecibido_(m, email, mias, inicio) {
  if (m.getDate().getTime() <= inicio) return 'anterior a la instalación';
  if (esInterno_(email)) return 'remitente de casa';
  if (esAutomatico_(m.getFrom() || '', m)) return 'automático / boletín';
  try { if (m.getHeader('List-Id')) return 'lista de correo'; } catch (e) {}
  if (esInvitacionCalendario_(m.getSubject())) return 'invitación de calendario';
  var para = direcciones_(m.getTo ? m.getTo() : '');
  var cc = direcciones_(m.getCc ? m.getCc() : '');
  var enPara = para.some(function (x) { return esMio_(x, mias); });
  if (!enPara) return cc.some(function (x) { return esMio_(x, mias); }) ? 'estás solo en Cc' : 'no estás en Para (lista o Cco)';
  if (para.length + cc.length > MAX_DESTINATARIOS_RECIBIDOS) return 'envío a muchas personas';
  if (CONFIG.recibidos_solo_conocidos && !esConocido_(email)) return 'remitente al que nunca has escrito';
  return '';
}
var conocidosMemo_ = {};
function esConocido_(email) {
  var e = String(email || '').toLowerCase();
  if (!e) return false;
  if (conocidosMemo_.hasOwnProperty(e)) return conocidosMemo_[e];
  var cache = null;
  try { cache = (typeof CacheService !== 'undefined') ? CacheService.getUserCache() : null; } catch (x) {}
  var guardado = cache ? cache.get('k48::' + e) : null;
  var si;
  if (guardado !== null && guardado !== undefined) si = guardado === '1';
  else {
    si = GmailApp.search('in:sent to:' + e, 0, 1).length > 0;
    if (cache) { try { cache.put('k48::' + e, si ? '1' : '0', 21600); } catch (y) {} }
  }
  conocidosMemo_[e] = si;
  return si;
}
function diagnosticar() {
  Logger.log('=== DIAGNÓSTICO · ' + CONFIG.nombre + ' <' + CONFIG.correo + '> ===');
  Logger.log('Cuenta actual: ' + (cuentaActual_() || '(desconocida)') + (identidadOk_() ? ' ✔' : ' ✘ NO COINCIDE: no instales aquí'));
  Logger.log('Modo: ' + modo_() + ' · Pausa: ' + (enPausa_() ? 'SÍ' : 'no') + ' · umbral ' + CONFIG.horas + ' h' +
    (CONFIG.solo_laborables ? ' laborables' : '') + ' · enviados ' + (CONFIG.enviados ? 'SÍ' : 'NO') +
    ' · recibidos ' + (CONFIG.recibidos ? 'SÍ' : 'NO') + ' · Slack ' + CONFIG.slack_id + ' (' + CONFIG.destino + ')');
  var mias = misDirecciones_();
  Logger.log('--- ENVIADOS recientes (qué se etiquetaría) ---');
  buscarHilos_(BUSQUEDA_ENVIADOS).slice(0, 15).forEach(function (hilo, i) {
    var propios = hilo.getMessages().filter(function (m) { return esMio_(email_(m.getFrom()), mias); });
    if (!propios.length) return;
    var m = propios[propios.length - 1], motivo = motivoEnvio_(m);
    Logger.log('· ' + (i + 1) + ') ' + (m.getSubject() || '(sin asunto)') + ' → ' + (motivo ? 'NO — ' + motivo : 'SÍ (48h)'));
  });
  Logger.log('--- RECIBIDOS en bandeja (qué avisaría el «revés» si estuviera encendido, sin mirar la fecha de instalación) ---');
  buscarHilos_(BUSQUEDA_RECIBIDOS).slice(0, 25).forEach(function (hilo, i) {
    var d = analizarRecibido_(hilo, mias, 0);
    Logger.log('· ' + (i + 1) + ') ' + d.asunto + ' · ' + soloNombre_(d.remitente) + ' · ' + d.horas + ' h → ' +
      (d.avisar ? 'AVISARÍA' : 'no — ' + d.motivo));
  });
  Logger.log('=== FIN ===');
}

// ── Utilidades ──────────────────────────────────────────────────────────────
function carga_(threadId, asunto, quien, horas, fecha, texto) {
  return { account: CONFIG.slack_id, asunto: asunto, remitente: quien, horas: horas, fecha: fecha,
    enlace: 'https://mail.google.com/mail/u/0/#all/' + threadId, texto: texto };
}
function enviar_(url, carga) {
  if (!url || String(url).indexOf('__') !== -1) { Logger.log('Sin webhook: no se envía nada.'); return false; }
  try {
    var r = UrlFetchApp.fetch(url, { method: 'post', contentType: 'application/json',
      payload: JSON.stringify(carga), muteHttpExceptions: true });
    var c = r.getResponseCode();
    if (c >= 200 && c < 300) return true;
    Logger.log('Slack respondió ' + c + ': ' + r.getContentText());
    return false;
  } catch (err) { Logger.log('Error al llamar al webhook: ' + err); return false; }
}
function misDirecciones_() {
  var out = [];
  var add = function (x) { x = String(x || '').toLowerCase(); if (x && out.indexOf(x) === -1) out.push(x); };
  add(CONFIG.correo);
  add(cuentaActual_());
  try { GmailApp.getAliases().forEach(add); } catch (e) {}
  return out;
}
function esMio_(email, mias) {
  var e = String(email || '').toLowerCase();
  return !!e && (mias || misDirecciones_()).indexOf(e) !== -1;
}
function esInterno_(email) {
  var e = String(email || '').toLowerCase();
  if (!e) return true;
  var suf = '@' + String(CONFIG.dominio).toLowerCase();
  return e.length > suf.length && e.slice(-suf.length) === suf;
}
function esAutomatico_(from, msg) {
  if (ROBOTS.test(String(from || '').toLowerCase())) return true;
  try { if (msg.getHeader('List-Unsubscribe')) return true; } catch (e) {}
  try { if (/bulk|list|junk|auto_reply/i.test(msg.getHeader('Precedence') || '')) return true; } catch (e2) {}
  try { var a = msg.getHeader('Auto-Submitted'); if (a && !/^no$/i.test(a)) return true; } catch (e3) {}
  return false;
}
function esInvitacionCalendario_(asunto) {
  return /^\s*(invitaci[oó]n|invitation|aceptado|accepted|rechazado|declined|actualizaci[oó]n invitaci[oó]n|updated invitation|cancelado|canceled|cancelled)\s*:/i.test(String(asunto || ''));
}
function destinatariosExternos_(m) {
  var lista = '';
  try { lista = (m.getTo() || '') + ',' + (m.getCc() || ''); } catch (e) { return []; }
  var out = [];
  direcciones_(lista).forEach(function (e) {
    if (esInterno_(e) || esMio_(e)) return;
    if (ROBOTS.test(e)) return;
    if (out.indexOf(e) === -1) out.push(e);
  });
  return out;
}
function direcciones_(lista) {
  var out = [];
  String(lista || '').split(',').forEach(function (t) { var e = email_(t).toLowerCase(); if (e) out.push(e); });
  return out;
}
function clienteDe_(m) {
  var para = '';
  try { para = m.getTo() || ''; } catch (e) {}
  return soloNombre_(String(para).split(',')[0].trim()) || '(sin destinatario)';
}
function tieneEtiqueta_(hilo, nombre) {
  try { return hilo.getLabels().some(function (l) { return l.getName() === nombre; }); } catch (e) { return false; }
}
function horasDesde_(t) {
  var ahora = ahora_();
  if (!CONFIG.solo_laborables) return Math.floor((ahora - t) / 3600000);
  var horas = 0, paso = 3600000, tope = 24 * 45;
  for (var x = t; x + paso <= ahora && tope-- > 0; x += paso) {
    var dia = Number(Utilities.formatDate(new Date(x), CONFIG.zona, 'u'));   // 1 = lunes … 7 = domingo
    if (dia < 6) horas++;
  }
  return horas;
}
function buscarHilos_(consulta) {
  var out = [];
  for (var inicio = 0; inicio < MAX_HILOS; inicio += 50) {
    var lote = GmailApp.search(consulta, inicio, 50);
    out = out.concat(lote);
    if (lote.length < 50) break;
  }
  return out;
}
function email_(from) {
  var m = String(from || '').match(/<([^>]+)>/);
  if (m) return m[1].trim();
  m = String(from || '').match(/[^\s<>,;"]+@[^\s<>,;"]+/);
  return m ? m[0].trim() : '';
}
function soloNombre_(remitente) {
  var r = String(remitente || '').trim();
  var nombre = r.replace(/\s*<[^>]*>\s*/g, '').replace(/["']/g, '').trim();
  if (nombre && nombre.indexOf('@') === -1) return nombre;
  var email = email_(r) || nombre;
  return (email.split('@')[0] || email).replace(/[<>]/g, '').trim();
}
function asuntoCorto_(asunto) {
  var a = String(asunto || '').trim();
  while (/^\s*(re|rv|fwd|fw)\s*:\s*/i.test(a)) a = a.replace(/^\s*(re|rv|fwd|fw)\s*:\s*/i, '');
  a = a.replace(/\s{2,}/g, ' ').trim() || '(sin asunto)';
  return a.length > 60 ? a.slice(0, 59).trim() + '…' : a;
}
function etiqueta_(nombre) { return GmailApp.getUserLabelByName(nombre) || GmailApp.createLabel(nombre); }

// ── ARRANQUE ────────────────────────────────────────────────────────────────
/**
 * Corre en cada ejecución, antes de la función elegida (ver la cabecera). Siempre deja UNA línea clara:
 * ✅ INSTALADO · ✅ YA ESTABA INSTALADO · ⏸ DESINSTALADO · ⚠️ (activadores presentes, configuración que no vale)
 * o lanza «❌ NO INSTALADO · …». Con activadores presentes nunca lanza (puede ser una ejecución por activador).
 */
function arranque_() {
  var cuenta = cuentaActual_() || 'desconocida';
  var est;
  try { est = estadoActivadores_(); }
  catch (e) { noInstalado_('no se pueden leer los activadores (' + ((e && e.message) || e) + ')'); }
  var motivo = motivoNoInstalable_();
  if (est.total && motivo) {
    Logger.log('⚠️ HAY ACTIVADORES (' + est.lista + ') PERO ESTA CONFIGURACIÓN NO VALE · ' + motivo + ' · cuenta: ' + cuenta +
      ' · no se toca nada; para quitarlos: desinstalar');
    return { accion: 'sin-config' };
  }
  if (motivo) noInstalado_(motivo);
  if (faltanPermisos_()) {
    if (!est.total) noInstalado_(MOTIVO_PERMISOS);
    Logger.log('⚠️ ' + MOTIVO_PERMISOS + ' · cuenta: ' + cuenta + ' · activadores: ' + est.lista + ' · no se toca nada');
    return { accion: 'sin-permisos' };
  }
  if (est.completo) {
    Logger.log('✅ YA ESTABA INSTALADO para ' + CONFIG.nombre + ' · activadores: ' + est.lista);
    return { accion: 'ya' };
  }
  if (marcadoDesinstalado_()) {
    Logger.log('⏸ DESINSTALADO a propósito para ' + CONFIG.nombre + ' · no se reinstala solo' +
      (est.total ? ' (quedan activadores sueltos: ' + est.lista + ')' : '') + ' · para volver a activarlo: elige myFunction y pulsa ▷ Ejecutar');
    return { accion: 'desinstalado' };
  }
  var r = '';
  try { r = instalarDetalle_(est.total ? modo_() : 'real', est.total ? 'reparado (había: ' + est.lista + ')' : '', true); }
  catch (e2) {
    var fallo = 'fallo al crear los activadores (' + ((e2 && e2.message) || e2) + ')';
    if (est.total) { Logger.log('⚠️ ' + fallo + ' · cuenta: ' + cuenta + ' · se reintenta en la próxima ejecución'); return { accion: 'fallo' }; }
    noInstalado_(fallo);
  }
  if (!r) noInstalado_('no se pudo instalar');
  return { accion: r };
}
var ARRANQUE = arranque_();
