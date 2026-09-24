/* =====================================================
   ESTADO Y PERSISTENCIA
   Los datos se guardan en localStorage (en el navegador de
   cada dispositivo). Para compartirlos entre varios
   dispositivos se necesita un servidor (ver README).
   ===================================================== */
let DB = { usuarios:[], jornadas:[], estudiantes:[], registros:[] };
let session = { user:null };
let ui = { screen:'login', tab:'dia', filtro:'', loading:false, loginError:null, recoverMode:false };
let html5QrInstance = null;

async function loadDB(){
  try{
    const v = localStorage.getItem(CONFIG.storageKey);
    if(v){ DB = JSON.parse(v); return; }
  }catch(e){ /* no existe aún */ }
  await seedDB();
  await saveDB();
}
async function saveDB(){
  try{ localStorage.setItem(CONFIG.storageKey, JSON.stringify(DB)); }catch(e){ console.error('storage error', e); }
}
function uid(prefix){ return prefix + '-' + Math.random().toString(36).slice(2,7).toUpperCase(); }

/* DATOS DE DEMOSTRACIÓN: cambia aquí los usuarios y estudiantes
   iniciales. Solo se cargan la primera vez (o al reiniciar datos). */
async function seedDB(){
  // Datos alineados con la base de datos SchoolCheck (MySQL) proporcionada
  DB.jornadas = JSON.parse(JSON.stringify(CONFIG.jornadas)); // se editan en js/config.js
  DB.usuarios = [
    {id:'U1', nombre:'Laura Gómez Ruiz', correo:'laura.gomez@schoolcheck.edu.co', contrasena: await sha256Hex('coord123'), rol:'coordinador', id_jornada:'J1'},
    {id:'U2', nombre:'Carlos Pérez Díaz', correo:'carlos.perez@schoolcheck.edu.co', contrasena: await sha256Hex('coord123'), rol:'coordinador', id_jornada:'J2'},
    {id:'U3', nombre:'Directora Institución', correo:'directora@schoolcheck.edu.co', contrasena: await sha256Hex('directivo123'), rol:'directivo', id_jornada:null}
  ];
  // Estudiantes reales tomados de la base de datos (numero_documento, curso, acudiente)
  // codigo_qr incluye un token aleatorio: no se puede adivinar solo con el documento.
  DB.estudiantes = [
    {id:'E1', nombre:'Santiago Ramírez López', curso:'6-A', numero_documento:'1001234567', email_acudiente:'familia.ramirez@gmail.com', codigo_qr:generarCodigoQR('1001234567'), foto:null, estado:'Activo'},
    {id:'E2', nombre:'Valeria Torres Mora', curso:'6-A', numero_documento:'1001234568', email_acudiente:'familia.torres@gmail.com', codigo_qr:generarCodigoQR('1001234568'), foto:null, estado:'Activo'},
    {id:'E3', nombre:'Daniel Herrera Ruiz', curso:'10-A', numero_documento:'1001234599', email_acudiente:'familia.herrera@gmail.com', codigo_qr:generarCodigoQR('1001234599'), foto:null, estado:'Activo'},
    {id:'E4', nombre:'Mariana Castro Ríos', curso:'11-A', numero_documento:'1001234611', email_acudiente:'familia.castro@gmail.com', codigo_qr:generarCodigoQR('1001234611'), foto:null, estado:'Activo'}
  ];
  DB.registros = [];
}
