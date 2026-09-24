/* ================= LÓGICA Y PANTALLAS DE LA APP ================= */
/* ================= HELPERS DE NEGOCIO ================= */
function hoy(){ return new Date().toISOString().slice(0,10); }
function horaActual(){ const d=new Date(); return d.toTimeString().slice(0,8); }
function jornadaDe(usuario){ return DB.jornadas.find(j=>j.id===usuario.id_jornada); }
function calcularTipoRegistro(hora, jornada){
  if(!jornada) return 'Puntual';
  const base = jornada.hora_limite || jornada.hora_inicio;
  const [hi,mi] = base.split(':').map(Number);
  const limite = hi*60+mi+Number(jornada.tolerancia_min||0);
  const [hh,mm] = hora.split(':').map(Number);
  return (hh*60+mm) > limite ? 'Retardo' : 'Puntual';
}
function registrosDeHoy(idJornada){
  return DB.registros.filter(r=>{
    if(r.fecha!==hoy()) return false;
    if(!idJornada) return true;
    const u = DB.usuarios.find(u=>u.id===r.id_usuario);
    return u && u.id_jornada===idJornada;
  });
}
function fmtHora(h){ if(!h) return ''; const [hh,mm]=h.split(':'); let hn=Number(hh); const ap=hn>=12?'PM':'AM'; hn=hn%12||12; return hn+':'+mm+' '+ap; }

/* ================= RENDER RAÍZ ================= */
function setTopbar(title, sub, right){
  document.getElementById('tb-title').textContent = title;
  document.getElementById('tb-sub').textContent = sub || '';
  document.getElementById('tb-right').innerHTML = right || '';
}
function render(){
  const s = document.getElementById('screen');
  const nav = document.getElementById('navbar');
  if(!session.user){
    nav.style.display='none';
    setTopbar(CONFIG.appNombre, CONFIG.appSubtitulo);
    s.innerHTML = renderLogin();
    bindLogin();
    return;
  }
  nav.style.display='flex';
  renderNav();
  switch(ui.screen){
    case 'dashboard': setTopbar('¡Hola, '+session.user.nombre.split(' ')[0]+'!', jornadaSub(), bellBtn()); s.innerHTML = renderDashboard(); bindDashboard(); break;
    case 'estudiantes': setTopbar('Estudiantes','Gestión de estudiantes'); s.innerHTML = renderEstudiantes(); bindEstudiantes(); break;
    case 'escanear': setTopbar('Escanear QR','Registro de ingreso', backBtn()); s.innerHTML = renderEscanear(); bindEscanear(); break;
    case 'historial': setTopbar('Historial de retardos','', backBtn()); s.innerHTML = renderHistorial(); bindHistorial(); break;
    case 'reportes': setTopbar('Reportes','Estadísticas de puntualidad'); s.innerHTML = renderReportes(); bindReportes(); break;
    case 'perfil': setTopbar('Perfil','Mi cuenta'); s.innerHTML = renderPerfil(); bindPerfil(); break;
    case 'admin': setTopbar('Usuarios y jornadas','Administración', backBtn()); s.innerHTML = renderAdmin(); bindAdmin(); break;
  }
}
function jornadaSub(){
  if(session.user.rol==='directivo') return 'Directivo · vista general';
  const j = jornadaDe(session.user);
  return 'Jornada: '+(j?j.nombre_jornada:'—');
}
function bellBtn(){ return '<span style="position:relative;">'+ICONS.bell+'</span>'; }
function backBtn(){ return '<button onclick="goTo(\'dashboard\')" style="background:none;border:none;color:#fff;cursor:pointer;">'+ICONS.back+'</button>'; }
function goTo(screen){ ui.screen=screen; render(); }

function renderNav(){
  const nav = document.getElementById('navbar');
  const isDirectivo = session.user.rol==='directivo';
  const items = isDirectivo ? [
    {id:'dashboard', label:'Inicio', icon:'home'},
    {id:'admin', label:'Usuarios', icon:'users'},
    {id:'reportes', label:'Reportes', icon:'report'},
    {id:'perfil', label:'Perfil', icon:'user'}
  ] : [
    {id:'dashboard', label:'Inicio', icon:'home'},
    {id:'estudiantes', label:'Estudiantes', icon:'users'},
    {id:'escanear', label:'Escanear', icon:'qr'},
    {id:'reportes', label:'Reportes', icon:'report'},
    {id:'perfil', label:'Perfil', icon:'user'}
  ];
  nav.innerHTML = items.map(it=>`<button class="navitem ${ui.screen===it.id?'active':''}" onclick="goTo('${it.id}')">${ICONS[it.icon]}<span>${it.label}</span></button>`).join('');
}

/* ================= LOGIN ================= */
function renderLogin(){
  return `
  <div style="text-align:center; margin:18px 0 10px;">
    <div style="width:64px;height:64px;border-radius:18px;background:var(--azul);display:flex;align-items:center;justify-content:center;margin:0 auto 10px;">
      <svg viewBox="0 0 24 24" width="34" height="34" fill="none" stroke="#fff" stroke-width="2"><path d="M12 3l8 4-8 4-8-4 8-4z"/><path d="M4 11v5c0 1.5 3.5 3 8 3s8-1.5 8-3v-5"/></svg>
    </div>
    <div style="font-size:20px;font-weight:800;color:var(--azul);">${CONFIG.appNombre}</div>
  </div>
  ${!ui.recoverMode ? `
  <div class="card">
    <h2 class="section-title">Iniciar sesión</h2>
    <p style="font-size:12.5px;color:var(--gris);margin-top:-6px;">Accede con tu cuenta de coordinador o directivo.</p>
    <label>Usuario (correo)</label>
    <input id="in-correo" type="text" placeholder="${CONFIG.correoEjemplo}" autocomplete="username">
    <label>Contraseña</label>
    <div class="toggle-eye">
      <input id="in-pass" type="password" placeholder="Tu contraseña" autocomplete="current-password">
      <button type="button" id="btn-eye">${ICONS.eye}</button>
    </div>
    <label style="display:flex;align-items:center;gap:7px;font-weight:400;margin-top:12px;">
      <input type="checkbox" id="in-recordar" style="width:auto;"> Recordarme
    </label>
    <div id="login-msg"></div>
    <button class="btn btn-primary" id="btn-login" style="margin-top:14px;">Iniciar sesión</button>
    <button class="link" id="btn-forgot">¿Olvidaste tu contraseña?</button>
    ${CONFIG.mostrarCredencialesDemo ? '<div class="field-hint" style="margin-top:14px;text-align:center;">'+CONFIG.textoCredencialesDemo+'</div>' : ''}
  </div>` : `
  <div class="card">
    <h2 class="section-title">Recuperar contraseña</h2>
    <p style="font-size:12.5px;color:var(--gris);margin-top:-6px;">Escribe tu correo institucional y te generaremos una contraseña temporal.</p>
    <label>Correo</label>
    <input id="rec-correo" type="text" placeholder="${CONFIG.correoEjemplo}">
    <div id="rec-msg"></div>
    <button class="btn btn-primary" id="btn-recover" style="margin-top:14px;">Enviar</button>
    <button class="link" id="btn-cancel-recover">Volver a iniciar sesión</button>
  </div>`}
  `;
}
function bindLogin(){
  if(ui.recoverMode){
    document.getElementById('btn-cancel-recover').onclick = ()=>{ ui.recoverMode=false; render(); };
    document.getElementById('btn-recover').onclick = async ()=>{
      const correo = sanitize(document.getElementById('rec-correo').value.toLowerCase());
      const box = document.getElementById('rec-msg');
      const u = DB.usuarios.find(x=>x.correo.toLowerCase()===correo);
      // Mensaje genérico tanto si existe como si no la cuenta, para no revelar
      // qué correos están registrados en el sistema (enumeración de usuarios).
      if(!u){ box.innerHTML = msg('success','Si el correo existe en el sistema, se generó una contraseña temporal.'); return; }
      const temp = Math.random().toString(36).slice(2,8);
      u.contrasena = await sha256Hex(temp); await saveDB();
      // Nota: en producción esta contraseña temporal debería enviarse por un canal
      // verificado (correo institucional real), no mostrarse en pantalla.
      box.innerHTML = msg('success','Contraseña temporal generada: <b>'+temp+'</b>. Inicia sesión y cámbiala en tu perfil.');
    };
    return;
  }
  document.getElementById('btn-forgot').onclick = ()=>{ ui.recoverMode=true; render(); };
  document.getElementById('btn-eye').onclick = ()=>{
    const inp = document.getElementById('in-pass');
    const btn = document.getElementById('btn-eye');
    if(inp.type==='password'){ inp.type='text'; btn.innerHTML=ICONS.eyeoff; } else { inp.type='password'; btn.innerHTML=ICONS.eye; }
  };
  document.getElementById('btn-login').onclick = doLogin;
  document.getElementById('in-pass').addEventListener('keydown', e=>{ if(e.key==='Enter') doLogin(); });
}
function msg(type,text){ const icon = type==='error'?ICONS.x:(type==='success'?ICONS.check:ICONS.bell); return `<div class="msg ${type}">${text}</div>`; }
function doLogin(){
  const box = document.getElementById('login-msg');
  const correoRaw = document.getElementById('in-correo').value;
  const passRaw = document.getElementById('in-pass').value;
  if(!correoRaw.trim() || !passRaw.trim()){
    box.innerHTML = msg('error','Completa usuario y contraseña para continuar.');
    return;
  }
  const correo = sanitize(correoRaw);
  const pass = sanitize(passRaw);
  if(correo!==correoRaw.trim() || pass!==passRaw.trim()){
    box.innerHTML = msg('error','Tu entrada contiene caracteres no permitidos.');
    return;
  }
  const correoKey = correo.toLowerCase();
  const espera = loginBloqueado(correoKey);
  if(espera>0){
    box.innerHTML = msg('error','Demasiados intentos fallidos. Intenta de nuevo en '+espera+' segundos.');
    return;
  }
  const btn = document.getElementById('btn-login');
  btn.disabled = true; btn.innerHTML = '<span class="spinner"></span> Verificando...';
  setTimeout(async ()=>{
    const u = DB.usuarios.find(x=>x.correo.toLowerCase()===correoKey);
    const hashIngresado = await sha256Hex(pass);
    if(!u || u.contrasena!==hashIngresado){
      registrarIntentoFallido(correoKey);
      const restante = loginBloqueado(correoKey);
      box.innerHTML = restante>0
        ? msg('error','Demasiados intentos fallidos. Intenta de nuevo en '+restante+' segundos.')
        : msg('error','Usuario o contraseña incorrectos.');
      btn.disabled=false; btn.textContent='Iniciar sesión';
      return;
    }
    limpiarIntentos(correoKey);
    session.user = u; ui.screen='dashboard';
    render();
  }, 600);
}
function logout(){ session.user=null; ui.screen='login'; ui.recoverMode=false; render(); }

/* ================= DASHBOARD ================= */
function renderDashboard(){
  const isDirectivo = session.user.rol==='directivo';
  const jornada = isDirectivo ? null : jornadaDe(session.user);
  const regsHoy = registrosDeHoy(isDirectivo?null:jornada.id);
  const retardos = regsHoy.filter(r=>r.tipo_registro==='Retardo').length;
  const puntualidad = regsHoy.length ? Math.round((regsHoy.length-retardos)/regsHoy.length*100) : 100;
  const totalMes = DB.registros.filter(r=>{
    if(r.fecha.slice(0,7)!==hoy().slice(0,7)) return false;
    if(isDirectivo) return true;
    const u = DB.usuarios.find(u=>u.id===r.id_usuario); return u && u.id_jornada===jornada.id;
  }).filter(r=>r.tipo_registro==='Retardo').length;
  const recientes = regsHoy.slice().sort((a,b)=>b.hora_ingreso.localeCompare(a.hora_ingreso)).slice(0,5);

  return `
  <div class="stat-grid">
    <div class="stat-card" title="Estudiantes con ingreso registrado hoy"><div class="num">${regsHoy.length}</div><div class="label">Estudiantes registrados</div></div>
    <div class="stat-card orange" title="Ingresos marcados como retardo hoy"><div class="num">${retardos}</div><div class="label">Retardos hoy</div></div>
    <div class="stat-card green" title="Porcentaje de ingresos puntuales hoy"><div class="num">${puntualidad}%</div><div class="label">Puntualidad general</div></div>
    <div class="stat-card" title="Total de retardos acumulados este mes"><div class="num">${totalMes}</div><div class="label">Total retardos (mes)</div></div>
  </div>
  <div class="card">
    <h2 class="section-title">Accesos rápidos</h2>
    <div style="display:grid;grid-template-columns:1fr 1fr;gap:10px;">
      ${isDirectivo?`
        <button class="btn btn-secondary" onclick="goTo('admin')">👥 Usuarios</button>
        <button class="btn btn-secondary" onclick="goTo('reportes')">📊 Reportes</button>
      `:`
        <button class="btn btn-secondary" onclick="goTo('escanear')">▦ Escanear QR</button>
        <button class="btn btn-secondary" onclick="goTo('estudiantes')">👥 Estudiantes</button>
        <button class="btn btn-secondary" onclick="goTo('reportes')">📊 Reportes</button>
        <button class="btn btn-secondary" onclick="goTo('historial')">🕒 Historial</button>
      `}
    </div>
  </div>
  <div class="card">
    <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:6px;">
      <h2 class="section-title" style="margin:0;">Retardos recientes</h2>
      <span class="link" style="margin:0;" onclick="goTo('historial')">Ver todos</span>
    </div>
    ${recientes.length===0 ? `<p style="font-size:12.5px;color:var(--gris);">Aún no hay ingresos registrados hoy.</p>` :
    recientes.map(r=>{
      const e = DB.estudiantes.find(e=>e.id===r.id_estudiante);
      return `<div class="row"><div class="avatar">${iniciales(e?e.nombre:'?')}</div>
        <div class="info"><div class="name">${e?e.nombre:'Desconocido'}</div><div class="meta">${fmtHora(r.hora_ingreso)}</div></div>
        <span class="badge ${r.tipo_registro==='Retardo'?'retardo':'puntual'}">${r.tipo_registro}</span></div>`;
    }).join('')}
  </div>`;
}
function iniciales(n){ return n.split(' ').slice(0,2).map(w=>w[0]).join('').toUpperCase(); }
function avatarHtml(estudiante, size){
  const s = size || 34;
  if(estudiante && estudiante.foto){
    return `<img src="${estudiante.foto}" style="width:${s}px;height:${s}px;border-radius:50%;object-fit:cover;flex-shrink:0;" alt="Foto de ${estudiante.nombre}">`;
  }
  return `<div class="avatar" style="width:${s}px;height:${s}px;">${iniciales(estudiante?estudiante.nombre:'?')}</div>`;
}
function bindDashboard(){}

/* ================= ESTUDIANTES ================= */
function renderEstudiantes(){
  const filtro = ui.filtro.toLowerCase();
  const lista = DB.estudiantes.filter(e=> e.nombre.toLowerCase().includes(filtro) || e.curso.toLowerCase().includes(filtro));
  return `
  <div class="card">
    <div style="display:flex; gap:8px;">
      <input id="est-buscar" type="text" placeholder="Buscar por nombre o curso..." value="${ui.filtro}">
    </div>
  </div>
  <div class="card">
    <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:8px;">
      <h2 class="section-title" style="margin:0;">Estudiantes (${lista.length})</h2>
      <button class="btn btn-primary btn-sm" id="btn-nuevo-est">${ICONS.plus} Nuevo</button>
    </div>
    <div id="est-form-wrap"></div>
    ${lista.map(e=>`
      <div class="row" style="flex-wrap:wrap;">
        ${avatarHtml(e)}
        <div class="info"><div class="name">${e.nombre}</div><div class="meta">${e.curso} · Doc: ${e.numero_documento||'—'} · ${e.codigo_qr}</div></div>
        <span class="badge ${e.estado==='Activo'?'activo':'inactivo'}">${e.estado}</span>
        <div style="display:flex;gap:6px;width:100%;justify-content:flex-end;margin-top:6px;">
          <button class="btn btn-outline btn-sm" onclick="verQR('${e.id}')">QR</button>
          <button class="btn btn-outline btn-sm" onclick="editarEstudiante('${e.id}')">Editar</button>
          <button class="btn btn-danger btn-sm" onclick="eliminarEstudiante('${e.id}')">Eliminar</button>
        </div>
      </div>
      <div id="edit-est-${e.id}"></div>`).join('') || '<p style="font-size:12.5px;color:var(--gris);">No se encontraron estudiantes.</p>'}
  </div>
  <div id="qr-modal-wrap"></div>`;
}
function editarEstudiante(id){
  const e = DB.estudiantes.find(x=>x.id===id);
  const wrap = document.getElementById('edit-est-'+id);
  wrap.innerHTML = `
    <div class="card" style="background:var(--azul-claro);">
      <label>Nombre completo</label><input id="ee-nombre-${id}" type="text" value="${e.nombre}">
      <label>Número de documento</label><input id="ee-doc-${id}" type="text" value="${e.numero_documento||''}">
      <label>Curso</label><input id="ee-curso-${id}" type="text" value="${e.curso}">
      <label>Correo del acudiente (opcional)</label><input id="ee-acudiente-${id}" type="text" value="${e.email_acudiente||''}">
      <label>Estado</label>
      <select id="ee-estado-${id}">
        <option value="Activo" ${e.estado==='Activo'?'selected':''}>Activo</option>
        <option value="Inactivo" ${e.estado==='Inactivo'?'selected':''}>Inactivo</option>
      </select>
      <label>Reemplazar foto (opcional)</label>
      <input id="ee-foto-${id}" type="file" accept="image/*">
      <p class="field-hint">El código QR no cambia al editar; si necesitas uno nuevo, elimina y vuelve a crear al estudiante.</p>
      <div id="ee-msg-${id}"></div>
      <div style="display:flex;gap:8px;margin-top:10px;">
        <button class="btn btn-primary" id="ee-guardar-${id}">Guardar cambios</button>
        <button class="btn btn-secondary" id="ee-cancelar-${id}">Cancelar</button>
      </div>
    </div>`;
  document.getElementById('ee-cancelar-'+id).onclick = ()=>{ wrap.innerHTML=''; };
  document.getElementById('ee-guardar-'+id).onclick = async ()=>{
    const box = document.getElementById('ee-msg-'+id);
    const nombre = sanitize(document.getElementById('ee-nombre-'+id).value);
    const documento = sanitize(document.getElementById('ee-doc-'+id).value);
    const curso = sanitize(document.getElementById('ee-curso-'+id).value);
    const acudiente = sanitize(document.getElementById('ee-acudiente-'+id).value);
    const estado = document.getElementById('ee-estado-'+id).value;
    const fotoInput = document.getElementById('ee-foto-'+id);
    if(!nombre || !curso || !documento){ box.innerHTML = msg('error','Completa nombre, documento y curso.'); return; }
    const enUsoPorOtro = DB.estudiantes.some(x=>x.id!==id && x.numero_documento===documento);
    if(enUsoPorOtro){ box.innerHTML = msg('error','Ese número de documento ya está en uso por otro estudiante.'); return; }
    if(fotoInput.files && fotoInput.files[0]){
      e.foto = await new Promise(res=>{
        const reader = new FileReader();
        reader.onload = ()=>res(reader.result);
        reader.onerror = ()=>res(e.foto);
        reader.readAsDataURL(fotoInput.files[0]);
      });
    }
    e.nombre = nombre; e.numero_documento = documento; e.curso = curso;
    e.email_acudiente = acudiente || null; e.estado = estado;
    await saveDB(); render();
  };
}
function eliminarEstudiante(id){
  const e = DB.estudiantes.find(x=>x.id===id);
  const tieneRegistros = DB.registros.some(r=>r.id_estudiante===id);
  const advertencia = tieneRegistros
    ? '\n\nNota: sus registros de asistencia anteriores se conservarán en el historial para auditoría, pero quedarán sin ficha de estudiante asociada.'
    : '';
  if(confirm('¿Eliminar a '+e.nombre+'? Su código QR dejará de funcionar de inmediato.'+advertencia)){
    DB.estudiantes = DB.estudiantes.filter(x=>x.id!==id);
    saveDB(); render();
  }
}
function bindEstudiantes(){
  document.getElementById('est-buscar').oninput = (e)=>{ ui.filtro = e.target.value; render(); document.getElementById('est-buscar').focus(); document.getElementById('est-buscar').setSelectionRange(ui.filtro.length,ui.filtro.length); };
  document.getElementById('btn-nuevo-est').onclick = ()=>{
    document.getElementById('est-form-wrap').innerHTML = `
      <div class="card" style="background:var(--azul-claro);">
        <label>Nombre completo</label><input id="ne-nombre" type="text" placeholder="Nombre del estudiante">
        <label>Número de documento</label><input id="ne-doc" type="text" placeholder="Ej: 1001234567">
        <label>Curso</label><input id="ne-curso" type="text" placeholder="Ej: 8-A">
        <label>Correo del acudiente (opcional)</label><input id="ne-acudiente" type="text" placeholder="familia@correo.com">
        <label>Foto (opcional, recomendada para verificar identidad al escanear)</label>
        <input id="ne-foto" type="file" accept="image/*">
        <p class="field-hint">Si no subes foto, se usará un avatar con iniciales — la verificación visual será menos confiable.</p>
        <div id="ne-msg"></div>
        <div style="display:flex;gap:8px;margin-top:10px;">
          <button class="btn btn-primary" id="ne-guardar">Guardar y generar QR</button>
        </div>
      </div>`;
    document.getElementById('ne-guardar').onclick = async ()=>{
      const nombre = sanitize(document.getElementById('ne-nombre').value);
      const curso = sanitize(document.getElementById('ne-curso').value);
      const documento = sanitize(document.getElementById('ne-doc').value);
      const acudiente = sanitize(document.getElementById('ne-acudiente').value);
      const fotoInput = document.getElementById('ne-foto');
      const box = document.getElementById('ne-msg');
      if(!nombre || !curso || !documento){ box.innerHTML = msg('error','Completa nombre, documento y curso.'); return; }
      if(DB.estudiantes.some(e=>e.numero_documento===documento)){ box.innerHTML = msg('error','Ya existe un estudiante con ese número de documento.'); return; }
      let foto = null;
      if(fotoInput.files && fotoInput.files[0]){
        foto = await new Promise(res=>{
          const reader = new FileReader();
          reader.onload = ()=>res(reader.result);
          reader.onerror = ()=>res(null);
          reader.readAsDataURL(fotoInput.files[0]);
        });
      }
      const nuevo = {id:uid('E'), nombre, curso, numero_documento:documento, email_acudiente:acudiente||null, codigo_qr:generarCodigoQR(documento), foto, estado:'Activo'};
      DB.estudiantes.push(nuevo); await saveDB();
      ui.filtro=''; render();
      setTimeout(()=>verQR(nuevo.id),50);
    };
  };
}
function verQR(id){
  const e = DB.estudiantes.find(x=>x.id===id);
  const wrap = document.getElementById('qr-modal-wrap');
  wrap.innerHTML = `<div class="modal-overlay" id="qr-overlay">
    <div class="modal">
      <div style="display:flex;justify-content:center;margin-bottom:8px;">${avatarHtml(e,64)}</div>
      <h2 class="section-title">${e.nombre}</h2>
      <p style="font-size:12px;color:var(--gris);margin-top:-6px;">${e.curso} · Doc: ${e.numero_documento||'—'}<br>Código: ${e.codigo_qr}</p>
      <div id="qr-canvas" style="display:flex;justify-content:center;margin:14px 0;"></div>
      <p style="font-size:11.5px;color:var(--gris);">Muestra este código a la cámara en el módulo Escanear QR.</p>
      <button class="btn btn-secondary" id="qr-close">Cerrar</button>
    </div></div>`;
  new QRCode(document.getElementById('qr-canvas'), {text:e.codigo_qr, width:160, height:160, colorDark:'#1F4E79'});
  document.getElementById('qr-close').onclick = ()=>{ wrap.innerHTML=''; };
}

/* ================= ESCANEAR ================= */
function renderEscanear(){
  return `
  <div class="card" style="text-align:center;">
    <div id="qr-reader"></div>
    <div id="scan-result"></div>
    <p style="font-size:11.5px;color:var(--gris);margin-top:10px;">Coloca el código QR del estudiante frente a la cámara. Si no tienes cámara disponible, usa el registro manual.</p>
  </div>
  <div class="card">
    <h2 class="section-title">Registro manual (alternativo)</h2>
    <label>Código del estudiante</label>
    <div style="display:flex;gap:8px;">
      <input id="man-codigo" type="text" placeholder="SC-EST-0001">
      <button class="btn btn-primary btn-sm" id="man-btn">Buscar</button>
    </div>
    <p class="field-hint">También exige confirmar la identidad del estudiante antes de registrar, y queda marcado como "Manual" en el historial para auditoría.</p>
  </div>`;
}
function bindEscanear(){
  const resultBox = document.getElementById('scan-result');
  document.getElementById('man-btn').onclick = ()=>{
    const codigo = sanitize(document.getElementById('man-codigo').value.toUpperCase());
    buscarParaConfirmar(codigo, resultBox, 'Manual');
  };
  try{
    html5QrInstance = new Html5Qrcode('qr-reader');
    html5QrInstance.start(
      {facingMode:'environment'},
      {fps:10, qrbox:200},
      (decodedText)=>{ buscarParaConfirmar(decodedText.toUpperCase(), resultBox, 'QR'); },
      ()=>{}
    ).catch(()=>{
      document.getElementById('qr-reader').innerHTML = msg('info','No se pudo acceder a la cámara. Verifica los permisos del navegador o usa el registro manual abajo.');
    });
  }catch(e){
    document.getElementById('qr-reader').innerHTML = msg('info','La cámara no está disponible en este dispositivo. Usa el registro manual.');
  }
}
function pararScanner(){
  if(html5QrInstance){ try{ html5QrInstance.stop(); html5QrInstance.clear(); }catch(e){} html5QrInstance=null; }
}
/* Paso 1: busca el estudiante por código y exige confirmación visual antes de
   registrar. Así, aunque alguien use el código de otro estudiante (prestado,
   fotografiado o adivinado), el coordinador debe comparar el rostro con la
   foto/avatar en pantalla antes de que el ingreso quede registrado. */
function buscarParaConfirmar(codigo, box, metodo){
  if(html5QrInstance){ try{ html5QrInstance.pause(true); }catch(e){} }
  const est = DB.estudiantes.find(e=>e.codigo_qr===codigo);
  if(!est){
    box.innerHTML = msg('error','Código no reconocido, verifique con el estudiante o regístrelo en el módulo de Estudiantes.');
    reanudarScanner();
    return;
  }
  if(est.estado!=='Activo'){
    box.innerHTML = msg('info','Este estudiante figura como inactivo. Verifique su estado en el módulo de Estudiantes.');
    reanudarScanner();
    return;
  }
  const yaHoy = DB.registros.find(r=>r.id_estudiante===est.id && r.fecha===hoy());
  if(yaHoy){
    box.innerHTML = msg('info', est.nombre+' ya fue registrado hoy a las '+fmtHora(yaHoy.hora_ingreso)+'.');
    reanudarScanner();
    return;
  }
  box.innerHTML = `
    <div class="card" style="background:var(--azul-claro);text-align:center;">
      <p style="font-size:11.5px;color:var(--azul);font-weight:700;margin:0 0 8px;">Verifica que esta persona es quien está frente a ti</p>
      <div style="display:flex;justify-content:center;margin-bottom:8px;">${avatarHtml(est,72)}</div>
      <div style="font-weight:700;">${est.nombre}</div>
      <div style="font-size:12px;color:var(--gris);">${est.curso} · Doc: ${est.numero_documento||'—'}</div>
      <div style="display:flex;gap:8px;margin-top:12px;">
        <button class="btn btn-primary" id="conf-si">Sí, es esta persona</button>
        <button class="btn btn-secondary" id="conf-no">No coincide</button>
      </div>
    </div>`;
  document.getElementById('conf-si').onclick = ()=>{ confirmarRegistro(est.id, metodo, box); };
  document.getElementById('conf-no').onclick = ()=>{
    box.innerHTML = msg('error','Registro cancelado: la identidad no coincide con el código. Repórtelo si sospecha de un uso indebido.');
    reanudarScanner();
  };
}
function reanudarScanner(){
  if(html5QrInstance){ try{ html5QrInstance.resume(); }catch(e){} }
}
function confirmarRegistro(idEstudiante, metodo, box){
  const est = DB.estudiantes.find(e=>e.id===idEstudiante);
  const jornada = jornadaDe(session.user);
  const hora = horaActual();
  const tipo = calcularTipoRegistro(hora, jornada);
  DB.registros.push({id:uid('R'), id_estudiante:est.id, id_usuario:session.user.id, fecha:hoy(), hora_ingreso:hora, tipo_registro:tipo, metodo});
  saveDB();
  const nota = tipo==='Puntual' ? 'Gracias por llegar puntual 🎉' : 'Ingreso registrado como retardo.';
  box.innerHTML = `<div class="msg success"><div>${ICONS.check}</div><div><b>¡Registro exitoso!</b><br>${est.nombre}<br>Hora: ${fmtHora(hora)}<br><span style="font-size:11.5px;">${nota}</span></div></div>`;
  reanudarScanner();
}

/* ================= HISTORIAL ================= */
function renderHistorial(){
  const filtro = ui.filtro.toLowerCase();
  let regs = DB.registros;
  const now = new Date();
  if(ui.tab==='dia') regs = regs.filter(r=>r.fecha===hoy());
  else if(ui.tab==='semana'){
    const d = new Date(now); d.setDate(d.getDate()-7);
    regs = regs.filter(r=> new Date(r.fecha) >= d);
  } else {
    regs = regs.filter(r=>r.fecha.slice(0,7)===hoy().slice(0,7));
  }
  if(session.user.rol!=='directivo'){
    const j = jornadaDe(session.user);
    regs = regs.filter(r=>{ const u=DB.usuarios.find(u=>u.id===r.id_usuario); return u && u.id_jornada===j.id; });
  }
  if(filtro){
    regs = regs.filter(r=>{
      const e = DB.estudiantes.find(e=>e.id===r.id_estudiante);
      return e && (e.nombre.toLowerCase().includes(filtro) || e.curso.toLowerCase().includes(filtro));
    });
  }
  regs = regs.slice().sort((a,b)=> (b.fecha+b.hora_ingreso).localeCompare(a.fecha+a.hora_ingreso));
  const retardos = regs.filter(r=>r.tipo_registro==='Retardo').length;
  const puntualidad = regs.length ? Math.round((regs.length-retardos)/regs.length*100) : 100;

  return `
  <div class="tabs">
    <div class="tab ${ui.tab==='dia'?'active':''}" data-tab="dia">Día</div>
    <div class="tab ${ui.tab==='semana'?'active':''}" data-tab="semana">Semana</div>
    <div class="tab ${ui.tab==='mes'?'active':''}" data-tab="mes">Mes</div>
  </div>
  <div class="card">
    <input id="hist-buscar" type="text" placeholder="Filtrar por estudiante o curso..." value="${ui.filtro}">
  </div>
  <div class="stat-grid" style="grid-template-columns:1fr 1fr 1fr;">
    <div class="stat-card orange"><div class="num">${retardos}</div><div class="label">Retardos</div></div>
    <div class="stat-card"><div class="num">${regs.length}</div><div class="label">Ingresos</div></div>
    <div class="stat-card green"><div class="num">${puntualidad}%</div><div class="label">Puntualidad</div></div>
  </div>
  <div class="card">
    <table>
      <tr><th>Estudiante</th><th>Fecha</th><th>Hora</th><th>Estado</th><th>Método</th></tr>
      ${regs.map(r=>{
        const e = DB.estudiantes.find(e=>e.id===r.id_estudiante);
        return `<tr><td>${e?e.nombre:'—'}</td><td>${r.fecha}</td><td>${fmtHora(r.hora_ingreso)}</td><td><span class="badge ${r.tipo_registro==='Retardo'?'retardo':'puntual'}">${r.tipo_registro}</span></td><td>${r.metodo||'QR'}</td></tr>`;
      }).join('') || '<tr><td colspan="5" style="color:var(--gris);">Sin registros en este periodo.</td></tr>'}
    </table>
  </div>`;
}
function bindHistorial(){
  document.querySelectorAll('.tab').forEach(t=> t.onclick = ()=>{ ui.tab=t.dataset.tab; render(); });
  document.getElementById('hist-buscar').oninput = (e)=>{ ui.filtro=e.target.value; render(); document.getElementById('hist-buscar').focus(); };
}

/* ================= REPORTES ================= */
function renderReportes(){
  const isDirectivo = session.user.rol==='directivo';
  return `
  <div class="card">
    <h2 class="section-title">Retardos últimos 7 días</h2>
    <canvas id="chart-retardos" height="160"></canvas>
  </div>
  <div class="card">
    <h2 class="section-title">Puntualidad vs. retardo (mes actual)</h2>
    <canvas id="chart-dona" height="180"></canvas>
  </div>
  ${isDirectivo ? `
  <div class="card">
    <h2 class="section-title">Comparativo por jornada</h2>
    ${DB.jornadas.map(j=>{
      const regs = DB.registros.filter(r=>{ const u=DB.usuarios.find(u=>u.id===r.id_usuario); return u && u.id_jornada===j.id; });
      const ret = regs.filter(r=>r.tipo_registro==='Retardo').length;
      const punt = regs.length ? Math.round((regs.length-ret)/regs.length*100):100;
      return `<div class="row"><div class="info"><div class="name">${j.nombre_jornada}</div><div class="meta">${regs.length} ingresos · ${ret} retardos</div></div><span class="badge puntual">${punt}% puntual</span></div>`;
    }).join('')}
  </div>` : ''}
  <div class="card">
    <button class="btn btn-outline" onclick="goTo('historial')">Ver historial detallado</button>
  </div>`;
}
function bindReportes(){
  const dias = [...Array(7)].map((_,i)=>{ const d=new Date(); d.setDate(d.getDate()-(6-i)); return d.toISOString().slice(0,10); });
  const scopeRegs = session.user.rol==='directivo' ? DB.registros : DB.registros.filter(r=>{ const u=DB.usuarios.find(u=>u.id===r.id_usuario); return u && u.id_jornada===jornadaDe(session.user).id; });
  const data = dias.map(d=> scopeRegs.filter(r=>r.fecha===d && r.tipo_registro==='Retardo').length);
  new Chart(document.getElementById('chart-retardos'), {
    type:'bar',
    data:{ labels:dias.map(d=>d.slice(5)), datasets:[{label:'Retardos', data, backgroundColor:'#C7791F'}]},
    options:{ plugins:{legend:{display:false}}, scales:{y:{beginAtZero:true, ticks:{stepSize:1}}} }
  });
  const mesRegs = scopeRegs.filter(r=>r.fecha.slice(0,7)===hoy().slice(0,7));
  const retMes = mesRegs.filter(r=>r.tipo_registro==='Retardo').length;
  const puntMes = mesRegs.length - retMes;
  new Chart(document.getElementById('chart-dona'), {
    type:'doughnut',
    data:{ labels:['Puntual','Retardo'], datasets:[{data:[puntMes||0,retMes||0], backgroundColor:['#3B6D11','#B3261E']}]},
    options:{ plugins:{legend:{position:'bottom'}} }
  });
}

/* ================= PERFIL ================= */
function renderPerfil(){
  const u = session.user;
  const j = jornadaDe(u);
  return `
  <div class="card" style="text-align:center;">
    <div class="avatar" style="width:56px;height:56px;font-size:18px;margin:0 auto 8px;">${iniciales(u.nombre)}</div>
    <div style="font-weight:800;font-size:16px;">${u.nombre}</div>
    <div style="color:var(--gris);font-size:12.5px;">${u.correo}</div>
    <span class="badge" style="background:var(--azul-claro);color:var(--azul);margin-top:6px;display:inline-block;">${u.rol==='directivo'?'Directivo':'Coordinador · '+(j?j.nombre_jornada:'')}</span>
  </div>
  <div class="card">
    <h2 class="section-title">Datos de la cuenta</h2>
    <label>Nombre completo</label>
    <input id="pf-nombre" type="text" value="${u.nombre}">
    <label>Usuario / correo institucional</label>
    <input id="pf-correo" type="text" value="${u.correo}" placeholder="nombre@tuinstitucion.edu.co">
    <div id="pf-cuenta-msg"></div>
    <button class="btn btn-primary" id="pf-guardar-cuenta" style="margin-top:10px;">Guardar datos de la cuenta</button>
  </div>
  <div class="card">
    <h2 class="section-title">Cambiar contraseña</h2>
    <label>Nueva contraseña</label>
    <input id="pf-pass" type="password" placeholder="Mínimo 6 caracteres">
    <div id="pf-msg"></div>
    <button class="btn btn-primary" id="pf-guardar" style="margin-top:10px;">Actualizar contraseña</button>
  </div>
  <div class="card">
    <button class="btn btn-danger" id="pf-reset">Reiniciar datos de demostración</button>
    <p class="field-hint" style="text-align:center;">Borra estudiantes, usuarios y registros y vuelve a cargar los datos de ejemplo.</p>
  </div>
  <div class="card">
    <button class="btn btn-outline" id="pf-logout">Cerrar sesión</button>
  </div>`;
}
function bindPerfil(){
  document.getElementById('pf-guardar-cuenta').onclick = ()=>{
    const box = document.getElementById('pf-cuenta-msg');
    const nombre = sanitize(document.getElementById('pf-nombre').value);
    const correo = sanitize(document.getElementById('pf-correo').value);
    const emailRe = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if(!nombre || !correo){ box.innerHTML = msg('error','Completa nombre y usuario/correo.'); return; }
    if(!emailRe.test(correo)){ box.innerHTML = msg('error','Escribe un correo institucional válido (ej: nombre@tuinstitucion.edu.co).'); return; }
    const enUsoPorOtro = DB.usuarios.some(x=>x.id!==session.user.id && x.correo.toLowerCase()===correo.toLowerCase());
    if(enUsoPorOtro){ box.innerHTML = msg('error','Ese usuario/correo ya está en uso por otra cuenta.'); return; }
    session.user.nombre = nombre;
    session.user.correo = correo;
    saveDB();
    box.innerHTML = msg('success','Datos de la cuenta actualizados. Usa este correo la próxima vez que inicies sesión.');
    setTopbar('¡Hola, '+session.user.nombre.split(' ')[0]+'!', jornadaSub(), bellBtn());
  };
  document.getElementById('pf-guardar').onclick = async ()=>{
    const p = document.getElementById('pf-pass').value;
    const box = document.getElementById('pf-msg');
    if(p.length<CONFIG.seguridad.contrasenaMinima){ box.innerHTML = msg('error','La contraseña debe tener al menos '+CONFIG.seguridad.contrasenaMinima+' caracteres.'); return; }
    session.user.contrasena = await sha256Hex(sanitize(p)); await saveDB();
    box.innerHTML = msg('success','Contraseña actualizada correctamente.');
  };
  document.getElementById('pf-logout').onclick = logout;
  document.getElementById('pf-reset').onclick = async ()=>{
    if(confirm('¿Seguro que quieres reiniciar todos los datos de demostración?')){
      await seedDB(); await saveDB(); logout();
    }
  };
}

/* ================= ADMIN (DIRECTIVO) ================= */
function renderAdmin(){
  return `
  <div class="card">
    <div style="display:flex;justify-content:space-between;align-items:center;">
      <h2 class="section-title" style="margin:0;">Coordinadores</h2>
      <button class="btn btn-primary btn-sm" id="btn-nuevo-user">${ICONS.plus} Nuevo</button>
    </div>
    <div id="user-form-wrap"></div>
    ${DB.usuarios.filter(u=>u.rol==='coordinador').map(u=>{
      const j = jornadaDe(u);
      return `<div class="row"><div class="avatar">${iniciales(u.nombre)}</div>
        <div class="info"><div class="name">${u.nombre}</div><div class="meta">${u.correo} · ${j?j.nombre_jornada:'—'}</div></div>
        <button class="btn btn-outline btn-sm" onclick="editarUsuario('${u.id}')">Editar</button>
        <button class="btn btn-danger btn-sm" onclick="eliminarUsuario('${u.id}')">Eliminar</button></div>
      <div id="edit-form-${u.id}"></div>`;
    }).join('')}
  </div>
  <div class="card">
    <h2 class="section-title">Jornadas</h2>
    ${DB.jornadas.map(j=>`
      <div class="row"><div class="info"><div class="name">${j.nombre_jornada}</div><div class="meta">Entrada: ${fmtHora(j.hora_limite||j.hora_inicio)} · tolerancia ${j.tolerancia_min} min</div></div>
        <button class="btn btn-outline btn-sm" onclick="editarJornada('${j.id}')">Editar</button></div>
      <div id="edit-jornada-${j.id}"></div>
    `).join('')}
  </div>`;
}
function editarJornada(id){
  const j = DB.jornadas.find(x=>x.id===id);
  const wrap = document.getElementById('edit-jornada-'+id);
  wrap.innerHTML = `
    <div class="card" style="background:var(--azul-claro);">
      <label>Hora de entrada</label><input id="ej-entrada-${id}" type="time" value="${j.hora_limite||j.hora_inicio}">
      <label>Tolerancia (minutos)</label><input id="ej-tol-${id}" type="text" value="${j.tolerancia_min}">
      <div id="ej-msg-${id}"></div>
      <div style="display:flex;gap:8px;margin-top:10px;">
        <button class="btn btn-primary" id="ej-guardar-${id}">Guardar</button>
        <button class="btn btn-secondary" id="ej-cancelar-${id}">Cancelar</button>
      </div>
    </div>`;
  document.getElementById('ej-cancelar-'+id).onclick = ()=>{ wrap.innerHTML=''; };
  document.getElementById('ej-guardar-'+id).onclick = ()=>{
    const box = document.getElementById('ej-msg-'+id);
    const entrada = document.getElementById('ej-entrada-'+id).value;
    const tol = Number(document.getElementById('ej-tol-'+id).value);
    if(!entrada || isNaN(tol) || tol<0){ box.innerHTML = msg('error','Ingresa una hora válida y una tolerancia numérica.'); return; }
    j.hora_inicio = entrada; j.hora_limite = entrada; j.tolerancia_min = tol;
    saveDB(); render();
  };
}
function bindAdmin(){
  document.getElementById('btn-nuevo-user').onclick = ()=>{
    document.getElementById('user-form-wrap').innerHTML = `
      <div class="card" style="background:var(--azul-claro);">
        <label>Nombre</label><input id="nu-nombre" type="text">
        <label>Correo</label><input id="nu-correo" type="text">
        <label>Contraseña inicial</label><input id="nu-pass" type="text">
        <label>Jornada</label>
        <select id="nu-jornada">${DB.jornadas.map(j=>`<option value="${j.id}">${j.nombre_jornada}</option>`).join('')}</select>
        <div id="nu-msg"></div>
        <button class="btn btn-primary" id="nu-guardar" style="margin-top:10px;">Crear coordinador</button>
      </div>`;
    document.getElementById('nu-guardar').onclick = async ()=>{
      const nombre = sanitize(document.getElementById('nu-nombre').value);
      const correo = sanitize(document.getElementById('nu-correo').value);
      const pass = sanitize(document.getElementById('nu-pass').value);
      const jornada = document.getElementById('nu-jornada').value;
      const box = document.getElementById('nu-msg');
      if(!nombre||!correo||!pass){ box.innerHTML = msg('error','Completa todos los campos.'); return; }
      if(pass.length<CONFIG.seguridad.contrasenaMinima){ box.innerHTML = msg('error','La contraseña inicial debe tener al menos '+CONFIG.seguridad.contrasenaMinima+' caracteres.'); return; }
      if(DB.usuarios.some(u=>u.correo.toLowerCase()===correo.toLowerCase())){ box.innerHTML = msg('error','Ese correo ya está registrado.'); return; }
      DB.usuarios.push({id:uid('U'), nombre, correo, contrasena: await sha256Hex(pass), rol:'coordinador', id_jornada:jornada});
      await saveDB(); render();
    };
  };
}
function eliminarUsuario(id){
  if(confirm('¿Eliminar este coordinador?')){ DB.usuarios = DB.usuarios.filter(u=>u.id!==id); saveDB(); render(); }
}
function editarUsuario(id){
  const u = DB.usuarios.find(x=>x.id===id);
  const wrap = document.getElementById('edit-form-'+id);
  wrap.innerHTML = `
    <div class="card" style="background:var(--azul-claro);">
      <label>Nombre</label><input id="eu-nombre-${id}" type="text" value="${u.nombre}">
      <label>Usuario / correo institucional</label><input id="eu-correo-${id}" type="text" value="${u.correo}">
      <label>Jornada</label>
      <select id="eu-jornada-${id}">${DB.jornadas.map(j=>`<option value="${j.id}" ${j.id===u.id_jornada?'selected':''}>${j.nombre_jornada}</option>`).join('')}</select>
      <div id="eu-msg-${id}"></div>
      <div style="display:flex;gap:8px;margin-top:10px;">
        <button class="btn btn-primary" id="eu-guardar-${id}">Guardar cambios</button>
        <button class="btn btn-secondary" id="eu-cancelar-${id}">Cancelar</button>
      </div>
    </div>`;
  document.getElementById('eu-cancelar-'+id).onclick = ()=>{ wrap.innerHTML=''; };
  document.getElementById('eu-guardar-'+id).onclick = ()=>{
    const box = document.getElementById('eu-msg-'+id);
    const nombre = sanitize(document.getElementById('eu-nombre-'+id).value);
    const correo = sanitize(document.getElementById('eu-correo-'+id).value);
    const jornada = document.getElementById('eu-jornada-'+id).value;
    const emailRe = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if(!nombre || !correo){ box.innerHTML = msg('error','Completa nombre y usuario/correo.'); return; }
    if(!emailRe.test(correo)){ box.innerHTML = msg('error','Escribe un correo institucional válido.'); return; }
    const enUsoPorOtro = DB.usuarios.some(x=>x.id!==id && x.correo.toLowerCase()===correo.toLowerCase());
    if(enUsoPorOtro){ box.innerHTML = msg('error','Ese usuario/correo ya está en uso por otra cuenta.'); return; }
    u.nombre = nombre; u.correo = correo; u.id_jornada = jornada;
    saveDB(); render();
  };
}

/* ================= RELOJ ================= */
function tickClock(){
  const d = new Date();
  document.getElementById('clock').textContent = d.toTimeString().slice(0,5);
}
setInterval(tickClock, 1000*30); tickClock();

/* ================= INICIO ================= */
(async function init(){
  document.title = CONFIG.appNombre;
  document.getElementById('sb-nombre').textContent = CONFIG.appNombre;
  await loadDB();
  render();
})();
