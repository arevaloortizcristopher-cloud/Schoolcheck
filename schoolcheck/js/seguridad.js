/* ================= SEGURIDAD ================= */
function sanitize(str){
  // Guarda simple contra caracteres típicos de inyección (comillas, punto y coma,
  // comentarios SQL "--"), sin tocar guiones normales de códigos, cursos o documentos.
  return str.replace(/['";]|--/g,'').trim();
}
/* Hash de contraseñas: evita que queden en texto plano en el almacenamiento.
   Nota de seguridad: esto es una mejora frente a texto plano, pero al ser una
   app 100% cliente (sin backend), un hash client-side no sustituye una
   autenticación real en servidor. Para producción se necesita backend con
   hashing server-side (bcrypt/scrypt/argon2) y sesiones firmadas. */
async function sha256Hex(texto){
  const buf = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(texto));
  return Array.from(new Uint8Array(buf)).map(b=>b.toString(16).padStart(2,'0')).join('');
}
/* Genera un código QR con un sufijo aleatorio no derivable del número de
   documento, para que no se pueda adivinar/forzar a partir de documentos
   conocidos o secuenciales. */
function generarCodigoQR(documento){
  const token = Math.random().toString(36).slice(2,8).toUpperCase();
  return 'SC-'+documento+'-'+token;
}
/* Límite de intentos de inicio de sesión (mitiga fuerza bruta sobre contraseñas). */
let loginAttempts = {};
function loginBloqueado(correo){
  const a = loginAttempts[correo];
  if(!a) return 0;
  const restante = a.lockUntil - Date.now();
  return restante>0 ? Math.ceil(restante/1000) : 0;
}
function registrarIntentoFallido(correo){
  const a = loginAttempts[correo] || {count:0, lockUntil:0};
  a.count++;
  if(a.count>=CONFIG.seguridad.intentosMaximos){ a.lockUntil = Date.now()+CONFIG.seguridad.bloqueoSegundos*1000; a.count=0; }
  loginAttempts[correo]=a;
}
function limpiarIntentos(correo){ delete loginAttempts[correo]; }
