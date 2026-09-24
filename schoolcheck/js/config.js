/* =====================================================
   CONFIGURACIÓN DE SCHOOLCHECK
   Edita este archivo para adaptar la app sin tocar la lógica.
   ===================================================== */
const CONFIG = {
  // --- Identidad ---
  appNombre: 'School Check',
  appSubtitulo: 'Registro de ingresos y control de retardos',
  correoEjemplo: 'nombre@schoolcheck.edu',

  // --- Almacenamiento (si lo cambias, la app empieza con datos nuevos) ---
  storageKey: 'schoolcheck-db',

  // --- Jornadas y horarios ---
  // hora_limite = hora de entrada; tolerancia_min = minutos de gracia antes de contar retardo
  jornadas: [
    {id:'J1', nombre_jornada:'Mañana', hora_inicio:'06:00', hora_fin:'12:00', hora_limite:'06:00', tolerancia_min:5},
    {id:'J2', nombre_jornada:'Tarde',  hora_inicio:'12:30', hora_fin:'18:00', hora_limite:'12:30', tolerancia_min:5},
    {id:'J3', nombre_jornada:'Noche',  hora_inicio:'18:00', hora_fin:'22:00', hora_limite:'18:00', tolerancia_min:5}
  ],

  // --- Seguridad ---
  seguridad: {
    intentosMaximos: 5,      // intentos de login fallidos antes de bloquear
    bloqueoSegundos: 60,     // duración del bloqueo
    contrasenaMinima: 6      // longitud mínima de contraseña
  },

  // --- Pantalla de login ---
  // Pon mostrarCredencialesDemo en false cuando uses la app con datos reales.
  mostrarCredencialesDemo: true,
  textoCredencialesDemo: 'Demo: laura.gomez@schoolcheck.edu.co / coord123<br>directora@schoolcheck.edu.co / directivo123'
};
