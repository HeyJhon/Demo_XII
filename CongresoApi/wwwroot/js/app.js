// =========================================================
// XII Congreso ISC · TecNM Ajalpan — SPA simple (HTML + JS)
// Rutas por hash: #/  #/acceso  #/login/alumno  #/login/profesor
//                 #/talleres  #/taller/:id  #/taller/nuevo  #/taller/:id/editar
// =========================================================

const ROL = { PROFESOR: 1, ALUMNO: 2 };
const app = document.getElementById('app');

// ---------- Utilidades ----------
const esc = s => String(s ?? '').replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
const go = hash => { location.hash = hash; };

const session = {
  get: () => JSON.parse(sessionStorage.getItem('congresoUser') || 'null'),
  set: u => sessionStorage.setItem('congresoUser', JSON.stringify(u)),
  clear: () => sessionStorage.removeItem('congresoUser'),
};

async function api(path, { method = 'GET', body } = {}) {
  const headers = {};
  const user = session.get();
  if (user) headers['X-User-Id'] = user.id;
  if (body !== undefined) headers['Content-Type'] = 'application/json';

  const res = await fetch(path, { method, headers, body: body !== undefined ? JSON.stringify(body) : undefined });
  if (res.status === 204) return null;
  const data = await res.json().catch(() => null);
  if (!res.ok) {
    const err = new Error(data?.detail || data?.title || `Error ${res.status}`);
    err.errors = data?.errors || {};
    err.status = res.status;
    throw err;
  }
  return data;
}

function toast(msg, type = 'ok') {
  const el = document.createElement('div');
  el.className = `alert alert-${type}`;
  el.textContent = msg;
  document.getElementById('toasts').appendChild(el);
  setTimeout(() => el.remove(), 3500);
}

function confirmar({ title, text, ok = 'Confirmar' }) {
  const dlg = document.getElementById('confirm');
  document.getElementById('confirm-title').textContent = title;
  document.getElementById('confirm-text').innerHTML = text;
  document.getElementById('confirm-ok').textContent = ok;
  dlg.returnValue = '';
  dlg.showModal();
  return new Promise(resolve => dlg.addEventListener('close', () => resolve(dlg.returnValue === 'yes'), { once: true }));
}

const horarioChip = t =>
  `<span class="chip ${t.horario === 1 ? 'chip-manana' : 'chip-tarde'}">${t.horario === 1 ? '☀' : '☾'} ${esc(t.horarioNombre)}</span>`;

// Portada: flyer /img/talleres/{id}.jpg; si no existe, se muestra una portada genérica con el estilo del congreso.
const cover = (t, withChip = true) => `
  <div class="cover">
    <img src="/img/talleres/${t.id}.jpg" alt="Flyer del taller ${esc(t.name)}" loading="lazy"
         onerror="this.parentElement.classList.add('no-img'); this.remove();">
    <div class="cover-fallback"><span class="title-plate">Taller</span><strong>${esc(t.name)}</strong></div>
    ${withChip ? horarioChip(t) : ''}
  </div>`;

function tallerCard(t, actions) {
  return `
    <article class="taller-card">
      ${cover(t)}
      <div class="body">
        <h3>${esc(t.name)}</h3>
        <div class="meta">
          <span class="chip">⏱ ${t.horas} horas</span>
          <span class="chip">👥 ${t.inscritos} inscritos</span>
        </div>
        <p class="desc">${esc(t.description || 'Sin descripción.')}</p>
        <div class="footer">
          <div class="instructor"><small>Imparte</small>${esc(t.instructor)}</div>
          <div class="row" style="gap:.4rem">${actions}</div>
        </div>
      </div>
    </article>`;
}

function renderNav() {
  const user = session.get();
  const current = location.hash || '#/';
  const link = (href, text) => `<a href="${href}" class="${current.startsWith(href) && href !== '#/' || current === href ? 'active' : ''}">${text}</a>`;
  document.getElementById('nav').innerHTML = user
    ? `${link('#/', 'Inicio')}${link('#/talleres', user.userRol === ROL.ALUMNO ? 'Mis talleres' : 'Talleres')}
       <span class="user-pill">
         <span>${esc(user.username)}</span><span class="chip chip-dark">${esc(user.rolNombre)}</span>
         <a href="#/salir">Salir</a>
       </span>`
    : `${link('#/', 'Inicio')}${link('#/talleres', 'Talleres')}`;
}

const loading = () => { app.innerHTML = '<p class="muted">Cargando…</p>'; };
const errorView = e => { app.innerHTML = `<div class="alert alert-error">${esc(e.message)}</div>`; };

// ---------- Vistas ----------

async function viewHome() {
  app.innerHTML = `
    <section class="hero">
      <div class="stack">
        <p class="eyebrow">Tecnológico Nacional de México · Campus Ajalpan</p>
        <h1>XII Congreso de <span class="text-gradient">Ingeniería en Sistemas</span> Computacionales</h1>
        <p class="lead">Talleres prácticos de impresión 3D, IoT con ESP32, DevSecOps, IA para interfaces y Power BI. Elige tu taller e inscríbete.</p>
        <div class="row">
          <a class="btn btn-primary" href="#/talleres">Ver talleres</a>
        </div>
      </div>
      <div class="hero-collage">
        <img src="/img/talleres/2.jpg" alt="">
        <img src="/img/talleres/3.jpg" alt="">
        <img src="/img/talleres/1.jpg" alt="">
      </div>
    </section>`;
}

function viewAcceso() {
  app.innerHTML = `
    <div style="text-align:center">
      <p class="eyebrow">Acceso a talleres</p>
      <h1>¿Quién eres?</h1>
      <p class="muted">Selecciona tu tipo de usuario para iniciar sesión.</p>
    </div>
    <div class="role-grid">
      <a class="role-card" href="#/login/alumno">
        <span class="role-icon">🎓</span>
        <h3>Alumno</h3>
        <p>Consulta talleres, inscríbete y administra tus inscripciones.</p>
      </a>
      <a class="role-card profesor" href="#/login/profesor">
        <span class="role-icon">👨‍🏫</span>
        <h3>Profesor</h3>
        <p>Da de alta, edita y elimina talleres, y consulta a los inscritos.</p>
      </a>
    </div>`;
}

function viewLogin(tipo) {
  const rol = tipo === 'profesor' ? ROL.PROFESOR : ROL.ALUMNO;
  const titulo = rol === ROL.PROFESOR ? 'Profesor' : 'Alumno';
  app.innerHTML = `
    <div class="auth-wrap">
      <a class="back-link" href="#/acceso">← Cambiar tipo de usuario</a>
      <form class="panel panel-dark panel-cut stack" id="login-form" novalidate>
        <span class="title-plate">Acceso ${titulo}</span>
        <p style="margin-bottom:0;opacity:.8">Ingresa con tu usuario y contraseña.</p>
        <div id="login-error"></div>
        <div class="field"><label for="u">Usuario</label><input id="u" class="input" autocomplete="username" required autofocus></div>
        <div class="field"><label for="p">Contraseña</label><input id="p" class="input" type="password" autocomplete="current-password" required></div>
        <button class="btn btn-primary btn-block" id="login-btn">Entrar</button>
      </form>
    </div>`;

  document.getElementById('login-form').addEventListener('submit', async ev => {
    ev.preventDefault();
    const errBox = document.getElementById('login-error');
    const btn = document.getElementById('login-btn');
    const username = document.getElementById('u').value.trim();
    const password = document.getElementById('p').value;
    errBox.innerHTML = '';
    if (!username || !password) { errBox.innerHTML = '<div class="alert alert-error">Escribe tu usuario y contraseña.</div>'; return; }

    btn.disabled = true;
    try {
      const user = await api('/api/auth/login', { method: 'POST', body: { username, password } });
      if (user.userRol !== rol) {
        errBox.innerHTML = `<div class="alert alert-error">Esta cuenta es de <b>${esc(user.rolNombre)}</b>. Regresa y elige ese tipo de usuario.</div>`;
        return;
      }
      session.set(user);
      toast(`¡Bienvenido, ${user.username}!`);
      go('#/talleres');
    } catch (e) {
      errBox.innerHTML = `<div class="alert alert-error">${esc(e.message)}</div>`;
    } finally {
      btn.disabled = false;
    }
  });
}

async function viewTalleres() {
  const user = session.get();
  loading();
  try {
    if (user.userRol === ROL.ALUMNO) await viewTalleresAlumno(user);
    else await viewTalleresProfesor();
  } catch (e) { errorView(e); }
}

async function viewTalleresAlumno(user) {
  const [talleres, mias] = await Promise.all([api('/api/talleres'), api(`/api/users/${user.id}/inscripciones`)]);
  const inscritoEn = new Map(mias.map(i => [i.tallerId, i.id]));  // tallerId -> inscripcionId
  const misTalleres = talleres.filter(t => inscritoEn.has(t.id));
  const disponibles = talleres.filter(t => !inscritoEn.has(t.id));
  const totalHoras = misTalleres.reduce((s, t) => s + t.horas, 0);

  app.innerHTML = `
    <div class="page-head">
      <div><p class="eyebrow">Alumno</p><h1>Mis talleres</h1></div>
      <div class="row"><span class="chip">📚 ${misTalleres.length} talleres</span><span class="chip">⏱ ${totalHoras} horas</span></div>
    </div>
    ${misTalleres.length
      ? `<div class="grid-talleres">${misTalleres.map(t => tallerCard(t, `
          <a class="btn btn-ghost btn-sm" href="#/taller/${t.id}">Info</a>
          <button class="btn btn-danger btn-sm" data-baja="${inscritoEn.get(t.id)}" data-name="${esc(t.name)}">Darme de baja</button>`)).join('')}</div>`
      : `<div class="empty">Aún no estás inscrito en ningún taller. ¡Elige uno abajo! 👇</div>`}

    <hr class="divider-glow">

    <div class="page-head"><div><p class="eyebrow">Inscríbete</p><h2>Talleres disponibles</h2></div></div>
    ${disponibles.length
      ? `<div class="grid-talleres">${disponibles.map(t => tallerCard(t, `
          <a class="btn btn-ghost btn-sm" href="#/taller/${t.id}">Info</a>
          <button class="btn btn-primary btn-sm" data-inscribir="${t.id}">Inscribirme</button>`)).join('')}</div>`
      : `<div class="empty">¡Ya estás inscrito en todos los talleres! 🎉</div>`}`;

  bindAlumnoActions(user, viewTalleres);
}

// Botones "Inscribirme" / "Darme de baja" (se usan en el listado y en el detalle)
function bindAlumnoActions(user, refresh) {
  app.querySelectorAll('[data-inscribir]').forEach(b => b.addEventListener('click', async () => {
    b.disabled = true;
    try {
      const r = await api('/api/inscripciones', { method: 'POST', body: { userId: user.id, tallerId: +b.dataset.inscribir } });
      toast(`¡Listo! Quedaste inscrito en ${r.tallerName}.`);
      refresh();
    } catch (e) { toast(e.message, 'error'); b.disabled = false; }
  }));

  app.querySelectorAll('[data-baja]').forEach(b => b.addEventListener('click', async () => {
    const ok = await confirmar({ title: 'Darme de baja', text: `¿Seguro que quieres darte de baja de <b>${esc(b.dataset.name)}</b>?`, ok: 'Darme de baja' });
    if (!ok) return;
    try {
      await api(`/api/inscripciones/${b.dataset.baja}`, { method: 'DELETE' });
      toast(`Te diste de baja de ${b.dataset.name}.`, 'warn');
      refresh();
    } catch (e) { toast(e.message, 'error'); }
  }));
}

async function viewTalleresProfesor() {
  const talleres = await api('/api/talleres');
  const totalInscritos = talleres.reduce((s, t) => s + t.inscritos, 0);

  app.innerHTML = `
    <div class="page-head">
      <div><p class="eyebrow">Profesor</p><h1>Talleres</h1>
        <div class="row" style="margin-top:.5rem"><span class="chip">📚 ${talleres.length} talleres</span><span class="chip">👥 ${totalInscritos} inscripciones</span></div>
      </div>
      <a class="btn btn-dark" href="#/taller/nuevo">＋ Nuevo taller</a>
    </div>
    ${talleres.length
      ? `<div class="grid-talleres">${talleres.map(t => tallerCard(t, `
          <a class="btn btn-ghost btn-sm" href="#/taller/${t.id}">Ver</a>
          <a class="btn btn-sm" href="#/taller/${t.id}/editar">Editar</a>
          <button class="btn btn-danger btn-sm" data-eliminar="${t.id}" data-name="${esc(t.name)}" data-inscritos="${t.inscritos}">Eliminar</button>`)).join('')}</div>`
      : `<div class="empty">No hay talleres. Crea el primero con <b>Nuevo taller</b>.</div>`}`;

  bindEliminar(viewTalleres);
}

function bindEliminar(after) {
  app.querySelectorAll('[data-eliminar]').forEach(b => b.addEventListener('click', async () => {
    const n = +b.dataset.inscritos;
    const ok = await confirmar({
      title: 'Eliminar taller',
      text: `¿Eliminar <b>${esc(b.dataset.name)}</b>?` + (n ? `<br><span class="muted">Tiene ${n} alumno(s) inscrito(s); sus inscripciones también se eliminarán.</span>` : ''),
      ok: 'Eliminar',
    });
    if (!ok) return;
    try {
      await api(`/api/talleres/${b.dataset.eliminar}`, { method: 'DELETE' });
      toast(`Taller "${b.dataset.name}" eliminado.`, 'warn');
      after();
    } catch (e) { toast(e.message, 'error'); }
  }));
}

async function viewDetalle(id) {
  const user = session.get();
  loading();
  try {
    const esProfesor = user.userRol === ROL.PROFESOR;
    const [t, extra] = await Promise.all([
      api(`/api/talleres/${id}`),
      esProfesor ? api(`/api/talleres/${id}/alumnos`) : api(`/api/users/${user.id}/inscripciones`),
    ]);

    let acciones, lateral = '';
    if (esProfesor) {
      acciones = `
        <a class="btn" href="#/taller/${t.id}/editar">Editar</a>
        <button class="btn btn-danger" data-eliminar="${t.id}" data-name="${esc(t.name)}" data-inscritos="${t.inscritos}">Eliminar</button>`;
      lateral = `
        <div class="panel stack">
          <p class="eyebrow">Alumnos inscritos (${extra.length})</p>
          ${extra.length
            ? `<ul class="list-plain">${extra.map(a => `<li><span class="avatar">${esc(a.username.slice(0, 2).toUpperCase())}</span>${esc(a.username)}</li>`).join('')}</ul>`
            : '<p class="muted" style="margin-bottom:0">Todavía no hay alumnos inscritos.</p>'}
        </div>`;
    } else {
      const insc = extra.find(i => i.tallerId === t.id);
      acciones = insc
        ? `<span class="chip chip-ok">✓ Estás inscrito</span>
           <button class="btn btn-danger" data-baja="${insc.id}" data-name="${esc(t.name)}">Darme de baja</button>`
        : `<button class="btn btn-primary" data-inscribir="${t.id}">Inscribirme</button>`;
    }

    app.innerHTML = `
      <a class="back-link" href="#/talleres">← Volver a talleres</a>
      <div class="detail">
        <div class="stack">
          ${cover(t, false)}
          ${lateral}
        </div>
        <div class="panel panel-cut stack">
          <span class="title-plate">Taller</span>
          <h1 style="font-size:2rem">${esc(t.name)}</h1>
          <p class="muted" style="margin-bottom:0">${esc(t.description || 'Sin descripción.')}</p>
          <dl>
            <dt>Imparte</dt><dd>${esc(t.instructor)}</dd>
            <dt>Horario</dt><dd>${horarioChip(t)}</dd>
            <dt>Duración</dt><dd>${t.horas} horas</dd>
            <dt>Inscritos</dt><dd>${t.inscritos} alumno(s)</dd>
          </dl>
          <div class="row">${acciones}</div>
        </div>
      </div>`;

    if (esProfesor) bindEliminar(() => go('#/talleres'));
    else bindAlumnoActions(user, () => viewDetalle(id));
  } catch (e) {
    errorView(e.status === 404 ? new Error('El taller no existe.') : e);
  }
}

async function viewForm(id) {
  const user = session.get();
  if (user.userRol !== ROL.PROFESOR) { go('#/talleres'); return; }

  let t = { name: '', description: '', instructor: '', horario: 1, horas: 2 };
  if (id) {
    loading();
    try { t = await api(`/api/talleres/${id}`); } catch (e) { errorView(e); return; }
  }

  app.innerHTML = `
    <a class="back-link" href="${id ? `#/taller/${id}` : '#/talleres'}">← Volver</a>
    <form class="panel panel-cut" id="taller-form" novalidate style="max-width:720px">
      <span class="title-plate">${id ? 'Editar taller' : 'Nuevo taller'}</span>
      <div id="form-error" style="margin-top:1rem"></div>
      <div class="form-grid" style="margin-top:1rem">
        <div class="field span-2" data-f="name">
          <label for="f-name">Nombre del taller *</label>
          <input id="f-name" class="input" maxlength="50" value="${esc(t.name)}" required>
          <span class="hint"></span>
        </div>
        <div class="field span-2" data-f="description">
          <label for="f-desc">Descripción</label>
          <textarea id="f-desc" class="textarea" maxlength="200" rows="3">${esc(t.description)}</textarea>
          <span class="counter" id="desc-count"></span>
          <span class="hint"></span>
        </div>
        <div class="field span-2" data-f="instructor">
          <label for="f-inst">Instructor *</label>
          <input id="f-inst" class="input" maxlength="100" value="${esc(t.instructor)}" placeholder="Ing. Nombre Apellido" required>
          <span class="hint"></span>
        </div>
        <div class="field" data-f="horario">
          <label for="f-hor">Horario *</label>
          <select id="f-hor" class="select">
            <option value="1" ${t.horario === 1 ? 'selected' : ''}>☀ Mañana</option>
            <option value="2" ${t.horario === 2 ? 'selected' : ''}>☾ Tarde</option>
          </select>
          <span class="hint"></span>
        </div>
        <div class="field" data-f="horas">
          <label for="f-horas">Duración (horas) *</label>
          <input id="f-horas" class="input" type="number" min="1" value="${t.horas}" required>
          <span class="hint"></span>
        </div>
      </div>
      <div class="row" style="justify-content:flex-end">
        <a class="btn btn-ghost" href="${id ? `#/taller/${id}` : '#/talleres'}">Cancelar</a>
        <button class="btn btn-primary" id="save-btn">${id ? 'Guardar cambios' : 'Crear taller'}</button>
      </div>
    </form>`;

  const desc = document.getElementById('f-desc');
  const updateCount = () => { document.getElementById('desc-count').textContent = `${desc.value.length}/200`; };
  desc.addEventListener('input', updateCount); updateCount();

  document.getElementById('taller-form').addEventListener('submit', async ev => {
    ev.preventDefault();
    const btn = document.getElementById('save-btn');
    document.getElementById('form-error').innerHTML = '';
    app.querySelectorAll('.field').forEach(f => { f.classList.remove('has-error'); f.querySelector('.hint').textContent = ''; });

    const body = {
      name: document.getElementById('f-name').value,
      description: desc.value,
      instructor: document.getElementById('f-inst').value,
      horario: +document.getElementById('f-hor').value,
      horas: parseInt(document.getElementById('f-horas').value, 10) || 0,
    };

    btn.disabled = true;
    try {
      const saved = await api(id ? `/api/talleres/${id}` : '/api/talleres', { method: id ? 'PUT' : 'POST', body });
      toast(id ? 'Cambios guardados.' : `Taller "${saved.name}" creado.`);
      go(`#/taller/${saved.id}`);
    } catch (e) {
      const fields = Object.entries(e.errors || {});
      fields.forEach(([k, msgs]) => {
        const f = app.querySelector(`.field[data-f="${k.toLowerCase()}"]`);
        if (f) { f.classList.add('has-error'); f.querySelector('.hint').textContent = msgs.join(' '); }
      });
      if (!fields.length) document.getElementById('form-error').innerHTML = `<div class="alert alert-error">${esc(e.message)}</div>`;
    } finally {
      btn.disabled = false;
    }
  });
}

// ---------- Router ----------
async function router() {
  const hash = location.hash || '#/';
  const user = session.get();
  const parts = hash.slice(2).split('/');  // "#/taller/3/editar" -> ["taller","3","editar"]

  if (hash === '#/salir') { session.clear(); toast('Sesión cerrada.', 'warn'); go('#/'); return; }

  // Rutas protegidas: si no hay sesión, primero se elige el tipo de usuario.
  const protegida = parts[0] === 'talleres' || parts[0] === 'taller';
  if (protegida && !user) { go('#/acceso'); return; }
  if ((parts[0] === 'acceso' || parts[0] === 'login') && user) { go('#/talleres'); return; }

  renderNav();
  window.scrollTo(0, 0);

  if (parts[0] === '' ) return viewHome();
  if (parts[0] === 'acceso') return viewAcceso();
  if (parts[0] === 'login' && (parts[1] === 'alumno' || parts[1] === 'profesor')) return viewLogin(parts[1]);
  if (parts[0] === 'talleres') return viewTalleres();
  if (parts[0] === 'taller' && parts[1] === 'nuevo') return viewForm(null);
  if (parts[0] === 'taller' && /^\d+$/.test(parts[1]) && parts[2] === 'editar') return viewForm(+parts[1]);
  if (parts[0] === 'taller' && /^\d+$/.test(parts[1])) return viewDetalle(+parts[1]);

  app.innerHTML = `<div class="empty">Página no encontrada. <a href="#/">Ir al inicio</a></div>`;
}

window.addEventListener('hashchange', router);
router();
