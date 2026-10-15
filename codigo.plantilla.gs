// ▷ EJECUTAR: da igual qué función salga en el desplegable. Al pulsar ▷ Ejecutar se instala solo.
// Mira el «Registro de ejecución»: ✅ INSTALADO · ✅ YA ESTABA INSTALADO · ❌ NO INSTALADO (en rojo).
function myFunction() {
  return _instalarForzado();
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
 *   · cuenta fuera de la lista o configuración vacía → Error en rojo «❌ NO INSTALADO · <motivo> · cuenta: <correo>».
 *     Si ya había activadores no lanza (rompería las ejecuciones por activador): lo escribe con «⚠️» y no toca nada;
 *   · después de desinstalar() (propiedad de usuario «correo48h_desinstalado» = «1») → no reinstala y escribe
 *     «⏸ DESINSTALADO a propósito …». myFunction quita la marca y vuelve a instalar.
 *
 * Funciones del desplegable:
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

function _tieneClaves(o) {
  if (!o || typeof o !== 'object') return false;
  for (var k in o) { if (Object.prototype.hasOwnProperty.call(o, k)) return true; }
  return false;
}
/** Ficha de la persona en EQUIPO (sin distinguir mayúsculas). null = no está en la lista. */
function _fichaDe(correo) {
  var e = String(correo || '').toLowerCase();
  if (!e || !_tieneClaves(EQUIPO)) return null;
  for (var k in EQUIPO) {
    if (Object.prototype.hasOwnProperty.call(EQUIPO, k) && String(k).toLowerCase() === e) return EQUIPO[k] || null;
  }
  return null;
}
/** CONFIG de la cuenta que ejecuta = valores por defecto + COMUN + su ficha. null = no está en la lista. */
function _configWeb() {
  var e = _cuentaActual(), f = _fichaDe(e), k;
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
var CONFIG = _configWeb() || { persona: '__FUERA__', nombre: '__FUERA__', correo: '__FUERA__', slack_id: '__FUERA__',
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

function _ahora() { return Date.now(); }

// ── Instalación ─────────────────────────────────────────────────────────────
function instalar() { return _instalar('real'); }
function instalarEnsayo() { return _instalar('ensayo'); }
function pasarAReal() {
  if (!_configOk(true)) return false;
  PropertiesService.getUserProperties().setProperty(CLAVE_MODO, 'real');
  Logger.log('Modo REAL: a partir de ahora los avisos llegan a Slack (' + CONFIG.destino + ').');
  return true;
}
function _instalar(modo, nota) { return !!_instalarDetalle(modo, nota, false); }
/**
 * Instalación limpia bajo candado: quita TODOS los activadores del proyecto, quita la marca de desinstalado
 * y crea los justos. soloSiFalta = true (arranque): si al coger el candado ya están completos, no toca nada.
 * Devuelve 'instalado' | 'ya' | '' (no se puede instalar en esta cuenta).
 */
function _instalarDetalle(modo, nota, soloSiFalta) {
  if (!_configOk(true)) return '';
  return _conCandado(function () {
    if (soloSiFalta) {
      var est = _estadoActivadores();
      if (est.completo) {
        Logger.log('✅ YA ESTABA INSTALADO para ' + CONFIG.nombre + ' · activadores: ' + est.lista);
        return 'ya';
      }
    }
    _quitarActivadores();
    var props = PropertiesService.getUserProperties();
    var ahora = _ahora();
    props.deleteProperty(CLAVE_DESINSTALADO);
    props.setProperty(CLAVE_MODO, modo);
    _etiqueta(ETIQUETA_NO);                     // a mano para la persona desde el primer día
    if (CONFIG.enviados) {
      _etiqueta(ETIQUETA_SEGUIR); _etiqueta(ETIQUETA_AVISADO);
      var previo = Number(props.getProperty(CLAVE_ULTIMO_AUTO) || 0);
      if (!previo || ahora - previo > 24 * 3600000) props.setProperty(CLAVE_ULTIMO_AUTO, String(ahora));
      ScriptApp.newTrigger('autoetiquetar').timeBased().everyMinutes(10).create();
    }
    if (CONFIG.recibidos) {
      _etiqueta(ETIQUETA_POR_CONTESTAR);
      if (!props.getProperty(CLAVE_INICIO_RECIBIDOS)) props.setProperty(CLAVE_INICIO_RECIBIDOS, String(ahora));
    }
    if (CONFIG.enviados || CONFIG.recibidos) ScriptApp.newTrigger('procesar').timeBased().everyHours(1).create();
    Logger.log('Configuración · ' + CONFIG.nombre + ' <' + CONFIG.correo + '> · modo ' + String(modo).toUpperCase() +
      ' · enviados ' + (CONFIG.enviados ? 'SÍ' : 'NO') + ' · recibidos ' + (CONFIG.recibidos ? 'SÍ' : 'NO') +
      ' · umbral ' + CONFIG.horas + ' h' + (CONFIG.solo_laborables ? ' laborables' : '') + ' · Slack: ' + CONFIG.destino);
    Logger.log('✅ INSTALADO para ' + CONFIG.nombre + ' · activadores: ' + _estadoActivadores().lista + (nota ? ' · ' + nota : ''));
    return 'instalado';
  });
}
/** myFunction: instalación limpia forzada (quita la marca de desinstalado). */
function _instalarForzado() {
  var motivo = _motivoNoInstalable();
  if (motivo) _noInstalado(motivo);
  if (typeof ARRANQUE !== 'undefined' && ARRANQUE && ARRANQUE.accion === 'instalado') {
    Logger.log('myFunction · ya quedó instalado hace un instante, en esta misma ejecución: no hace falta repetir.');
    return true;
  }
  var r = '';
  try { r = _instalarDetalle('real', 'reinstalación limpia (myFunction)', false); }
  catch (e) { _noInstalado('fallo al crear los activadores (' + ((e && e.message) || e) + ')'); }
  if (!r) _noInstalado('no se pudo instalar');
  return true;
}
function _conCandado(fn) {
  var candado = null;
  try {
    candado = LockService.getUserLock();
    if (!candado.tryLock(20000)) { Logger.log('Aviso: otra ejecución tenía el candado; sigo igualmente.'); candado = null; }
  } catch (e) { candado = null; }
  try { return fn(); } finally { if (candado) { try { candado.releaseLock(); } catch (e2) {} } }
}
function _quitarActivadores() {
  var n = 0;
  ScriptApp.getProjectTriggers().forEach(function (t) { ScriptApp.deleteTrigger(t); n++; });
  return n;
}
function desinstalar() {
  var n = _quitarActivadores();
  PropertiesService.getUserProperties().setProperty(CLAVE_DESINSTALADO, '1');
  Logger.log('⏹ DESINSTALADO · activadores eliminados: ' + n + ' · ya no se reinstala solo al ejecutar. ' +
    'Para volver a activarlo: elige myFunction y pulsa ▷ Ejecutar.');
  return n;
}
function desinstalarTodo() {
  var n = _quitarActivadores();
  var props = PropertiesService.getUserProperties();
  props.deleteAllProperties();
  props.setProperty(CLAVE_DESINSTALADO, '1');
  Logger.log('⏹ DESINSTALADO y memoria borrada · activadores eliminados: ' + n + '. Las etiquetas 48h* siguen en Gmail: ' +
    'se pueden borrar a mano. Para volver a activarlo: elige myFunction y pulsa ▷ Ejecutar.');
  return n;
}
function _marcadoDesinstalado() {
  return PropertiesService.getUserProperties().getProperty(CLAVE_DESINSTALADO) === '1';
}
function _noInstalado(motivo) {
  var texto = '❌ NO INSTALADO · ' + motivo + ' · cuenta: ' + (_cuentaActual() || 'desconocida');
  Logger.log(texto);
  throw new Error(texto);
}
function _activadoresEsperados() {
  var out = [];
  if (CONFIG.enviados) out.push('autoetiquetar');
  if (CONFIG.enviados || CONFIG.recibidos) out.push('procesar');
  return out;
}
/** Activadores del proyecto frente a los esperados (exactamente uno de cada, ninguno más). */
function _estadoActivadores() {
  var nombres = ScriptApp.getProjectTriggers().map(function (t) { return String(t.getHandlerFunction()); });
  var esperados = _activadoresEsperados();
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
  ok(_configRellena(), 'Configuración rellena (sin «__»)');
  ok(_identidadOk(), 'El script corre en la cuenta de ' + CONFIG.correo + ' (cuenta actual: ' + _cuentaActual() + ')');
  ok(RE_WEBHOOK.test(String(CONFIG.webhook || '')), 'Webhook de Slack con el formato esperado');
  var nombres = ScriptApp.getProjectTriggers().map(function (t) { return t.getHandlerFunction(); });
  ok(!CONFIG.enviados || nombres.indexOf('autoetiquetar') !== -1, 'Activador autoetiquetar (cada 10 min)' + (CONFIG.enviados ? '' : ' — no aplica'));
  ok(nombres.indexOf('procesar') !== -1, 'Activador procesar (cada hora)');
  ok(nombres.length === (CONFIG.enviados ? 2 : 1), 'Número de activadores: ' + nombres.length + ' (sin duplicados)');
  ok(!!GmailApp.getUserLabelByName(ETIQUETA_NO), 'Etiqueta «' + ETIQUETA_NO + '» creada');
  if (CONFIG.enviados) ok(!!GmailApp.getUserLabelByName(ETIQUETA_SEGUIR), 'Etiqueta «' + ETIQUETA_SEGUIR + '» creada');
  Logger.log('Modo: ' + _modo().toUpperCase() + ' · Pausa: ' + (_enPausa() ? 'SÍ (existe «' + ETIQUETA_PAUSA + '»)' : 'no'));
  Logger.log(fallos.length ? '=== ' + fallos.length + ' FALLO(S) ===' : '=== VERIFICACIÓN CORRECTA ===');
  return fallos;
}
/** SOLO LECTURA: no crea, no borra, no cambia nada (ni activadores, ni etiquetas, ni memoria). */
function comprobar() {
  var cuenta = _cuentaActual() || 'desconocida';
  var motivo = _motivoNoInstalable();
  var activadores = ScriptApp.getProjectTriggers().map(function (t) {
    var tipo = '';
    try { tipo = String(t.getEventType()); } catch (e) {}
    return String(t.getHandlerFunction()) + (tipo ? ' (' + tipo + ')' : '');
  });
  var est = _estadoActivadores();
  var etiquetas = [ETIQUETA_SEGUIR, ETIQUETA_AVISADO, ETIQUETA_NO, ETIQUETA_POR_CONTESTAR, ETIQUETA_PAUSA].map(function (n) {
    return n + (GmailApp.getUserLabelByName(n) ? ' ✔' : ' ✘');
  });
  var marca = _marcadoDesinstalado();
  var estado = motivo ? 'NO INSTALABLE EN ESTA CUENTA' : est.completo ? 'INSTALADO Y COMPLETO' :
    est.total ? 'ACTIVADORES QUE NO CUADRAN (ejecuta myFunction)' : marca ? 'DESINSTALADO A PROPÓSITO' : 'NO INSTALADO';
  Logger.log('=== COMPROBAR (solo lectura: no cambia nada) · cuenta: ' + cuenta + ' ===');
  Logger.log('En la lista del equipo: ' + (motivo ? 'NO · ' + motivo : 'SÍ · ' + CONFIG.nombre));
  Logger.log('Activadores (' + activadores.length + '): ' + (activadores.join(' | ') || 'ninguno') +
    ' · esperados: ' + (_activadoresEsperados().join(', ') || 'ninguno'));
  Logger.log('Etiquetas: ' + etiquetas.join(' · ') + ' («' + ETIQUETA_PAUSA + '» ✘ = no está en pausa)');
  Logger.log('Marca de desinstalado: ' + (marca ? 'SÍ' : 'no') + ' · Modo: ' + _modo().toUpperCase());
  Logger.log('=== RESULTADO: ' + estado + ' ===');
  return { estado: estado, cuenta: cuenta, activadores: activadores, etiquetas: etiquetas, desinstalado: marca };
}
/** Manda UN mensaje de prueba al Slack de la persona. Solo a mano: nada lo llama solo. */
function probar() {
  if (!_configOk(true)) return false;
  var carga = { account: CONFIG.slack_id, asunto: 'Prueba de Correo 48h', remitente: 'Correo 48h', horas: 0,
    fecha: Utilities.formatDate(new Date(_ahora()), CONFIG.zona, 'dd/MM HH:mm'),
    enlace: 'https://mail.google.com/mail/u/0/#inbox',
    texto: '🧪 Prueba de Correo 48h: si ves este mensaje, los avisos te llegarán aquí. No hay que hacer nada.' };
  var ok = _enviar(CONFIG.webhook, carga);
  Logger.log(ok ? '✅ PRUEBA ENVIADA: mira tu Slack (mensaje directo).' : '❌ La prueba no llegó a Slack: mira la línea de arriba.');
  return ok;
}

// ── Identidad y configuración ──────────────────────────────────────────────
function _configRellena() {
  return ['persona', 'nombre', 'correo', 'slack_id', 'webhook'].every(function (k) {
    return CONFIG[k] && String(CONFIG[k]).indexOf('__') === -1;
  });
}
function _cuentaActual() {
  var e = '';
  try { e = Session.getEffectiveUser().getEmail() || ''; } catch (x) {}
  if (!e) { try { e = Session.getActiveUser().getEmail() || ''; } catch (y) {} }
  return String(e).toLowerCase();
}
function _identidadOk() { return _cuentaActual() === String(CONFIG.correo).toLowerCase(); }
/** '' = se puede instalar y trabajar en esta cuenta; si no, el motivo en llano. */
function _motivoNoInstalable() {
  if (!_tieneClaves(EQUIPO) || !_tieneClaves(COMUN)) {
    return 'configuración vacía (este código no lleva la lista del equipo: cópialo otra vez desde la página de instalación, abierta con el enlace completo)';
  }
  if (!RE_WEBHOOK.test(String(COMUN.webhook || ''))) return 'configuración incompleta (falta el webhook de Slack o no tiene el formato esperado)';
  var e = _cuentaActual();
  if (!e) return 'no se puede leer la cuenta de Google que ejecuta el script';
  if (!_fichaDe(e)) return 'esta cuenta no está en la lista del equipo';
  if (!_identidadOk()) return 'la cuenta cambió durante la ejecución';
  if (!RE_SLACK_ID.test(String(CONFIG.slack_id || ''))) return 'a esta persona le falta el slack_id en la lista (o no tiene el formato de Slack)';
  if (!RE_WEBHOOK.test(String(CONFIG.webhook || ''))) return 'el webhook de esta persona no tiene el formato esperado';
  if (!CONFIG.enviados && !CONFIG.recibidos) return 'enviados y recibidos están apagados: no hay nada que vigilar';
  return '';
}
function _configOk(registrar) {
  var motivo = _motivoNoInstalable();
  if (motivo && registrar) Logger.log('PARADO: ' + motivo + ' · cuenta: ' + (_cuentaActual() || 'desconocida') + '. No se hace nada.');
  return !motivo;
}
function _enPausa() { return !!GmailApp.getUserLabelByName(ETIQUETA_PAUSA); }
function _modo() { return PropertiesService.getUserProperties().getProperty(CLAVE_MODO) || 'real'; }
function _puedoTrabajar() {
  if (!_configOk(true)) return false;
  if (_enPausa()) { Logger.log('En pausa: existe la etiqueta «' + ETIQUETA_PAUSA + '». No se hace nada.'); return false; }
  return true;
}

// ── Enviados: auto-etiquetado y seguimiento ────────────────────────────────
function autoetiquetar() {
  if (!CONFIG.enviados) { Logger.log('Enviados apagado para ' + CONFIG.persona + '.'); return 0; }
  if (!_puedoTrabajar()) return 0;
  var ensayo = _modo() === 'ensayo';
  var props = PropertiesService.getUserProperties();
  var desde = Number(props.getProperty(CLAVE_ULTIMO_AUTO) || 0);
  if (!desde) {
    props.setProperty(CLAVE_ULTIMO_AUTO, String(_ahora()));
    Logger.log('Primera ejecución: punto de partida en ahora, no se etiqueta el histórico.');
    return 0;
  }
  var hilos = _buscarHilos(BUSQUEDA_ENVIADOS);
  var mias = _misDirecciones();
  var lSeguir = ensayo ? null : _etiqueta(ETIQUETA_SEGUIR);
  var lAvisado = GmailApp.getUserLabelByName(ETIQUETA_AVISADO);
  var etiquetados = 0, visto = 0;
  hilos.forEach(function (hilo) {
    var nuevos = [];
    hilo.getMessages().forEach(function (m) {
      if (!_esMio(_email(m.getFrom()), mias)) return;
      var t = m.getDate().getTime();
      if (t <= desde) return;
      if (t > visto) visto = t;
      nuevos.push(m);
    });
    if (!nuevos.length) return;
    if (_tieneEtiqueta(hilo, ETIQUETA_NO)) return;          // la persona dijo «nunca»
    var bueno = null;
    for (var i = 0; i < nuevos.length; i++) { if (_motivoEnvio(nuevos[i]) === '') { bueno = nuevos[i]; break; } }
    if (!bueno) return;
    etiquetados++;
    if (ensayo) { Logger.log('ENSAYO → etiquetaría 48h: ' + (bueno.getSubject() || '(sin asunto)')); return; }
    try { hilo.addLabel(lSeguir); } catch (e) { Logger.log('No se pudo etiquetar: ' + e); etiquetados--; return; }
    if (lAvisado) { try { hilo.removeLabel(lAvisado); } catch (e2) {} }
    props.deleteProperty(PREFIJO_MEMORIA + hilo.getId());
    Logger.log('Etiquetado 48h: ' + (bueno.getSubject() || '(sin asunto)') + ' → ' + _clienteDe(bueno));
  });
  if (!ensayo) props.setProperty(CLAVE_ULTIMO_AUTO, String(visto || _ahora()));
  Logger.log('Auto-etiquetado · revisados: ' + hilos.length + ' · etiquetados: ' + etiquetados + (ensayo ? ' (ENSAYO)' : ''));
  return etiquetados;
}
function _motivoEnvio(m) {
  try { var auto = m.getHeader('Auto-Submitted') || ''; if (auto && !/^no$/i.test(auto)) return 'respuesta automática mía'; } catch (e) {}
  if (_esInvitacionCalendario(m.getSubject())) return 'invitación de calendario';
  if (!_destinatariosExternos(m).length) return 'sin destinatarios externos (solo gente de casa o robots)';
  return '';
}
function procesar() { return _pasada(_modo() === 'ensayo'); }
function simular() { return _pasada(true); }
function _pasada(soloRegistro) {
  var r = { avisos: 0, respondidos: 0, ignorados: 0, recibidos: 0 };
  if (!_puedoTrabajar()) return r;
  var cupo = { quedan: MAX_AVISOS_POR_PASADA };
  if (CONFIG.enviados) _recorrerEnviados(soloRegistro, r, cupo);
  if (CONFIG.recibidos) _recorrerRecibidos(soloRegistro, r, cupo);
  Logger.log('Resumen · avisos enviados: ' + r.avisos + ' · recibidos: ' + r.recibidos + ' · respondidos: ' +
    r.respondidos + ' · ignorados: ' + r.ignorados + (soloRegistro ? ' (simulado)' : ''));
  return r;
}
function _recorrerEnviados(soloRegistro, r, cupo) {
  var hilos = _buscarHilos(BUSQUEDA_SEGUIMIENTO);
  Logger.log('Hilos en seguimiento: ' + hilos.length);
  var props = PropertiesService.getUserProperties();
  var lSeguir = GmailApp.getUserLabelByName(ETIQUETA_SEGUIR);
  var lAvisado = soloRegistro ? null : _etiqueta(ETIQUETA_AVISADO);
  for (var i = 0; i < hilos.length; i++) {
    var hilo = hilos[i];
    if (_tieneEtiqueta(hilo, ETIQUETA_NO)) {                 // apagado a mano en este hilo
      if (!soloRegistro && lSeguir) { try { hilo.removeLabel(lSeguir); } catch (e0) {} }
      r.ignorados++; continue;
    }
    var d = _analizarEnvio(hilo);
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
    var carga = _carga(d.threadId, d.asunto, d.cliente, d.horas, d.fecha,
      '⏰ Sin respuesta en ' + d.horas + ' h · ' + d.cliente + ' · ' + _asuntoCorto(d.asunto));
    if (soloRegistro) { Logger.log('SIMULADO → ' + JSON.stringify(carga)); r.avisos++; cupo.quedan--; continue; }
    if (_enviar(CONFIG.webhook, carga)) {
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
function _analizarEnvio(hilo) {
  var d = { threadId: hilo.getId(), enviadoId: '', asunto: hilo.getFirstMessageSubject() || '(sin asunto)',
    cliente: '', fecha: '', horas: 0, respuesta: false };
  var mensajes = hilo.getMessages();
  var mias = _misDirecciones();
  var idx = -1;
  for (var i = mensajes.length - 1; i >= 0; i--) { if (_esMio(_email(mensajes[i].getFrom()), mias)) { idx = i; break; } }
  if (idx === -1) return d;
  var enviado = mensajes[idx];
  d.enviadoId = enviado.getId();
  d.asunto = enviado.getSubject() || d.asunto;
  d.cliente = _clienteDe(enviado);
  d.fecha = Utilities.formatDate(enviado.getDate(), CONFIG.zona, 'dd/MM HH:mm');
  d.horas = _horasDesde(enviado.getDate().getTime());
  for (var j = idx + 1; j < mensajes.length; j++) {
    var m = mensajes[j], from = m.getFrom() || '', email = _email(from);
    if (_esMio(email, mias) || _esInterno(email)) continue;
    if (_esAutomatico(from, m)) continue;
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
function _recorrerRecibidos(soloRegistro, r, cupo) {
  var props = PropertiesService.getUserProperties();
  var inicio = Number(props.getProperty(CLAVE_INICIO_RECIBIDOS) || 0);
  if (!inicio) {
    if (!soloRegistro) props.setProperty(CLAVE_INICIO_RECIBIDOS, String(_ahora()));
    Logger.log('[recibidos] Primera ejecución: punto de partida en ahora, no se avisa del histórico.');
    return;
  }
  var mias = _misDirecciones();
  var lPor = soloRegistro ? null : _etiqueta(ETIQUETA_POR_CONTESTAR);
  _buscarHilos('label:' + ETIQUETA_POR_CONTESTAR).forEach(function (hilo) {
    var d = _analizarRecibido(hilo, mias, inicio);
    if (d.contestado && !soloRegistro) {
      try { hilo.removeLabel(lPor); } catch (e) {}
      props.deleteProperty(PREFIJO_RECIBIDOS + d.threadId);
    }
  });
  var hilos = _buscarHilos(BUSQUEDA_RECIBIDOS);
  Logger.log('[recibidos] hilos revisados: ' + hilos.length);
  for (var i = 0; i < hilos.length; i++) {
    var d = _analizarRecibido(hilos[i], mias, inicio);
    if (!d.avisar) continue;
    if (props.getProperty(PREFIJO_RECIBIDOS + d.threadId) === d.mensajeId) continue;
    if (cupo.quedan <= 0) { Logger.log('[recibidos] Tope de avisos por pasada.'); break; }
    var nombre = _soloNombre(d.remitente);
    var carga = _carga(d.threadId, d.asunto, nombre, d.horas, d.fecha,
      '📬 Sin contestar en ' + d.horas + ' h · ' + nombre + ' · ' + _asuntoCorto(d.asunto));
    if (soloRegistro) { Logger.log('[recibidos] SIMULADO → ' + JSON.stringify(carga)); r.recibidos++; cupo.quedan--; continue; }
    if (_enviar(CONFIG.webhook, carga)) {
      props.setProperty(PREFIJO_RECIBIDOS + d.threadId, d.mensajeId);
      try { hilos[i].addLabel(lPor); } catch (e2) {}
      r.recibidos++; cupo.quedan--;
      Logger.log('[recibidos] Avisado: ' + nombre + ' · ' + d.asunto + ' · ' + d.horas + ' h');
    }
  }
}
function _analizarRecibido(hilo, mias, inicio) {
  var d = { threadId: hilo.getId(), mensajeId: '', asunto: hilo.getFirstMessageSubject() || '(sin asunto)',
    remitente: '', horas: 0, fecha: '', contestado: false, avisar: false, motivo: '' };
  if (_tieneEtiqueta(hilo, ETIQUETA_NO)) { d.motivo = 'hilo con 48h-no'; return d; }
  var mensajes = hilo.getMessages();
  var ultimo = null;
  for (var i = mensajes.length - 1; i >= 0; i--) {
    if (!_esAutomatico(mensajes[i].getFrom() || '', mensajes[i]) || _esMio(_email(mensajes[i].getFrom()), mias)) { ultimo = mensajes[i]; break; }
  }
  if (!ultimo) { d.motivo = 'solo mensajes automáticos'; return d; }
  var from = ultimo.getFrom() || '', email = _email(from);
  d.mensajeId = ultimo.getId();
  d.asunto = ultimo.getSubject() || d.asunto;
  d.remitente = from;
  d.fecha = Utilities.formatDate(ultimo.getDate(), CONFIG.zona, 'dd/MM HH:mm');
  d.horas = _horasDesde(ultimo.getDate().getTime());
  if (_esMio(email, mias)) { d.contestado = true; d.motivo = 'ya contestado'; return d; }
  var motivo = _ruidoRecibido(ultimo, email, mias, inicio);
  if (motivo) { d.motivo = motivo; return d; }
  if (d.horas < CONFIG.horas) { d.motivo = 'solo ' + d.horas + ' h'; return d; }
  d.avisar = true;
  return d;
}
function _ruidoRecibido(m, email, mias, inicio) {
  if (m.getDate().getTime() <= inicio) return 'anterior a la instalación';
  if (_esInterno(email)) return 'remitente de casa';
  if (_esAutomatico(m.getFrom() || '', m)) return 'automático / boletín';
  try { if (m.getHeader('List-Id')) return 'lista de correo'; } catch (e) {}
  if (_esInvitacionCalendario(m.getSubject())) return 'invitación de calendario';
  var para = _direcciones(m.getTo ? m.getTo() : '');
  var cc = _direcciones(m.getCc ? m.getCc() : '');
  var enPara = para.some(function (x) { return _esMio(x, mias); });
  if (!enPara) return cc.some(function (x) { return _esMio(x, mias); }) ? 'estás solo en Cc' : 'no estás en Para (lista o Cco)';
  if (para.length + cc.length > MAX_DESTINATARIOS_RECIBIDOS) return 'envío a muchas personas';
  if (CONFIG.recibidos_solo_conocidos && !_esConocido(email)) return 'remitente al que nunca has escrito';
  return '';
}
var _conocidosMemo = {};
function _esConocido(email) {
  var e = String(email || '').toLowerCase();
  if (!e) return false;
  if (_conocidosMemo.hasOwnProperty(e)) return _conocidosMemo[e];
  var cache = null;
  try { cache = (typeof CacheService !== 'undefined') ? CacheService.getUserCache() : null; } catch (x) {}
  var guardado = cache ? cache.get('k48::' + e) : null;
  var si;
  if (guardado !== null && guardado !== undefined) si = guardado === '1';
  else {
    si = GmailApp.search('in:sent to:' + e, 0, 1).length > 0;
    if (cache) { try { cache.put('k48::' + e, si ? '1' : '0', 21600); } catch (y) {} }
  }
  _conocidosMemo[e] = si;
  return si;
}
function diagnosticar() {
  Logger.log('=== DIAGNÓSTICO · ' + CONFIG.nombre + ' <' + CONFIG.correo + '> ===');
  Logger.log('Cuenta actual: ' + (_cuentaActual() || '(desconocida)') + (_identidadOk() ? ' ✔' : ' ✘ NO COINCIDE: no instales aquí'));
  Logger.log('Modo: ' + _modo() + ' · Pausa: ' + (_enPausa() ? 'SÍ' : 'no') + ' · umbral ' + CONFIG.horas + ' h' +
    (CONFIG.solo_laborables ? ' laborables' : '') + ' · enviados ' + (CONFIG.enviados ? 'SÍ' : 'NO') +
    ' · recibidos ' + (CONFIG.recibidos ? 'SÍ' : 'NO') + ' · Slack ' + CONFIG.slack_id + ' (' + CONFIG.destino + ')');
  var mias = _misDirecciones();
  Logger.log('--- ENVIADOS recientes (qué se etiquetaría) ---');
  _buscarHilos(BUSQUEDA_ENVIADOS).slice(0, 15).forEach(function (hilo, i) {
    var propios = hilo.getMessages().filter(function (m) { return _esMio(_email(m.getFrom()), mias); });
    if (!propios.length) return;
    var m = propios[propios.length - 1], motivo = _motivoEnvio(m);
    Logger.log('· ' + (i + 1) + ') ' + (m.getSubject() || '(sin asunto)') + ' → ' + (motivo ? 'NO — ' + motivo : 'SÍ (48h)'));
  });
  Logger.log('--- RECIBIDOS en bandeja (qué avisaría el «revés» si estuviera encendido, sin mirar la fecha de instalación) ---');
  _buscarHilos(BUSQUEDA_RECIBIDOS).slice(0, 25).forEach(function (hilo, i) {
    var d = _analizarRecibido(hilo, mias, 0);
    Logger.log('· ' + (i + 1) + ') ' + d.asunto + ' · ' + _soloNombre(d.remitente) + ' · ' + d.horas + ' h → ' +
      (d.avisar ? 'AVISARÍA' : 'no — ' + d.motivo));
  });
  Logger.log('=== FIN ===');
}

// ── Utilidades ──────────────────────────────────────────────────────────────
function _carga(threadId, asunto, quien, horas, fecha, texto) {
  return { account: CONFIG.slack_id, asunto: asunto, remitente: quien, horas: horas, fecha: fecha,
    enlace: 'https://mail.google.com/mail/u/0/#all/' + threadId, texto: texto };
}
function _enviar(url, carga) {
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
function _misDirecciones() {
  var out = [];
  var add = function (x) { x = String(x || '').toLowerCase(); if (x && out.indexOf(x) === -1) out.push(x); };
  add(CONFIG.correo);
  add(_cuentaActual());
  try { GmailApp.getAliases().forEach(add); } catch (e) {}
  return out;
}
function _esMio(email, mias) {
  var e = String(email || '').toLowerCase();
  return !!e && (mias || _misDirecciones()).indexOf(e) !== -1;
}
function _esInterno(email) {
  var e = String(email || '').toLowerCase();
  if (!e) return true;
  var suf = '@' + String(CONFIG.dominio).toLowerCase();
  return e.length > suf.length && e.slice(-suf.length) === suf;
}
function _esAutomatico(from, msg) {
  if (ROBOTS.test(String(from || '').toLowerCase())) return true;
  try { if (msg.getHeader('List-Unsubscribe')) return true; } catch (e) {}
  try { if (/bulk|list|junk|auto_reply/i.test(msg.getHeader('Precedence') || '')) return true; } catch (e2) {}
  try { var a = msg.getHeader('Auto-Submitted'); if (a && !/^no$/i.test(a)) return true; } catch (e3) {}
  return false;
}
function _esInvitacionCalendario(asunto) {
  return /^\s*(invitaci[oó]n|invitation|aceptado|accepted|rechazado|declined|actualizaci[oó]n invitaci[oó]n|updated invitation|cancelado|canceled|cancelled)\s*:/i.test(String(asunto || ''));
}
function _destinatariosExternos(m) {
  var lista = '';
  try { lista = (m.getTo() || '') + ',' + (m.getCc() || ''); } catch (e) { return []; }
  var out = [];
  _direcciones(lista).forEach(function (e) {
    if (_esInterno(e) || _esMio(e)) return;
    if (ROBOTS.test(e)) return;
    if (out.indexOf(e) === -1) out.push(e);
  });
  return out;
}
function _direcciones(lista) {
  var out = [];
  String(lista || '').split(',').forEach(function (t) { var e = _email(t).toLowerCase(); if (e) out.push(e); });
  return out;
}
function _clienteDe(m) {
  var para = '';
  try { para = m.getTo() || ''; } catch (e) {}
  return _soloNombre(String(para).split(',')[0].trim()) || '(sin destinatario)';
}
function _tieneEtiqueta(hilo, nombre) {
  try { return hilo.getLabels().some(function (l) { return l.getName() === nombre; }); } catch (e) { return false; }
}
function _horasDesde(t) {
  var ahora = _ahora();
  if (!CONFIG.solo_laborables) return Math.floor((ahora - t) / 3600000);
  var horas = 0, paso = 3600000, tope = 24 * 45;
  for (var x = t; x + paso <= ahora && tope-- > 0; x += paso) {
    var dia = Number(Utilities.formatDate(new Date(x), CONFIG.zona, 'u'));   // 1 = lunes … 7 = domingo
    if (dia < 6) horas++;
  }
  return horas;
}
function _buscarHilos(consulta) {
  var out = [];
  for (var inicio = 0; inicio < MAX_HILOS; inicio += 50) {
    var lote = GmailApp.search(consulta, inicio, 50);
    out = out.concat(lote);
    if (lote.length < 50) break;
  }
  return out;
}
function _email(from) {
  var m = String(from || '').match(/<([^>]+)>/);
  if (m) return m[1].trim();
  m = String(from || '').match(/[^\s<>,;"]+@[^\s<>,;"]+/);
  return m ? m[0].trim() : '';
}
function _soloNombre(remitente) {
  var r = String(remitente || '').trim();
  var nombre = r.replace(/\s*<[^>]*>\s*/g, '').replace(/["']/g, '').trim();
  if (nombre && nombre.indexOf('@') === -1) return nombre;
  var email = _email(r) || nombre;
  return (email.split('@')[0] || email).replace(/[<>]/g, '').trim();
}
function _asuntoCorto(asunto) {
  var a = String(asunto || '').trim();
  while (/^\s*(re|rv|fwd|fw)\s*:\s*/i.test(a)) a = a.replace(/^\s*(re|rv|fwd|fw)\s*:\s*/i, '');
  a = a.replace(/\s{2,}/g, ' ').trim() || '(sin asunto)';
  return a.length > 60 ? a.slice(0, 59).trim() + '…' : a;
}
function _etiqueta(nombre) { return GmailApp.getUserLabelByName(nombre) || GmailApp.createLabel(nombre); }

// ── ARRANQUE ────────────────────────────────────────────────────────────────
/**
 * Corre en cada ejecución, antes de la función elegida (ver la cabecera). Siempre deja UNA línea clara:
 * ✅ INSTALADO · ✅ YA ESTABA INSTALADO · ⏸ DESINSTALADO · ⚠️ (activadores presentes, configuración que no vale)
 * o lanza «❌ NO INSTALADO · …». Con activadores presentes nunca lanza (puede ser una ejecución por activador).
 */
function _arranque() {
  var cuenta = _cuentaActual() || 'desconocida';
  var est;
  try { est = _estadoActivadores(); }
  catch (e) { _noInstalado('no se pueden leer los activadores (' + ((e && e.message) || e) + ')'); }
  var motivo = _motivoNoInstalable();
  if (est.total && motivo) {
    Logger.log('⚠️ HAY ACTIVADORES (' + est.lista + ') PERO ESTA CONFIGURACIÓN NO VALE · ' + motivo + ' · cuenta: ' + cuenta +
      ' · no se toca nada; para quitarlos: desinstalar');
    return { accion: 'sin-config' };
  }
  if (motivo) _noInstalado(motivo);
  if (est.completo) {
    Logger.log('✅ YA ESTABA INSTALADO para ' + CONFIG.nombre + ' · activadores: ' + est.lista);
    return { accion: 'ya' };
  }
  if (_marcadoDesinstalado()) {
    Logger.log('⏸ DESINSTALADO a propósito para ' + CONFIG.nombre + ' · no se reinstala solo' +
      (est.total ? ' (quedan activadores sueltos: ' + est.lista + ')' : '') + ' · para volver a activarlo: elige myFunction y pulsa ▷ Ejecutar');
    return { accion: 'desinstalado' };
  }
  var r = '';
  try { r = _instalarDetalle(est.total ? _modo() : 'real', est.total ? 'reparado (había: ' + est.lista + ')' : '', true); }
  catch (e2) {
    var fallo = 'fallo al crear los activadores (' + ((e2 && e2.message) || e2) + ')';
    if (est.total) { Logger.log('⚠️ ' + fallo + ' · cuenta: ' + cuenta + ' · se reintenta en la próxima ejecución'); return { accion: 'fallo' }; }
    _noInstalado(fallo);
  }
  if (!r) _noInstalado('no se pudo instalar');
  return { accion: r };
}
var ARRANQUE = _arranque();
