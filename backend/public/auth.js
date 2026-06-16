// Simple client-side auth for demo purposes (no backend)
const users = [
  { email: 'admin@example.com', password: 'admin123', role: 'admin', name: 'Administrator' },
  { email: 'dr1@example.com', password: 'doc123', role: 'practitioner', name: 'Dr. Ravi' },
  { email: 'ituser@example.com', password: 'it123', role: 'it', name: 'IT Support' }
];

function getRegisteredUsers(){
  try{
    const raw = localStorage.getItem('registeredUsers');
    if(raw) return JSON.parse(raw);
  }catch(e){}
  // initialize with demo users
  localStorage.setItem('registeredUsers', JSON.stringify(users));
  return users.slice();
}

function saveRegisteredUsers(arr){
  localStorage.setItem('registeredUsers', JSON.stringify(arr));
}

function registerUser({name, email, password, role}){
  const regs = getRegisteredUsers();
  if(regs.find(u=>u.email === email && u.role === role)){
    return { success: false, message: 'Already registered' };
  }
  regs.push({ name, email, password, role });
  saveRegisteredUsers(regs);
  return { success: true };
}

function login(email, password, role) {
  const regs = getRegisteredUsers();
  const user = regs.find(u => u.email === email && u.password === password && u.role === role);
  if (!user) {
    // not registered or wrong password — redirect to register page with prefilled role/email
    window.location.href = `register.html?role=${encodeURIComponent(role)}&email=${encodeURIComponent(email)}`;
    return false;
  }
  const safeUser = { email: user.email, role: user.role, name: user.name };
  sessionStorage.setItem('currentUser', JSON.stringify(safeUser));
  updateHeader();
  window.location.href = 'index.html';
  return true;
}

function setSessionUser(role, name, email) {
  const user = { email: email || '', role: role || '', name: name || (email ? email.split('@')[0] : '') };
  sessionStorage.setItem('currentUser', JSON.stringify(user));
  updateHeader();
  window.location.href = 'index.html';
}

function registerAndLogin(form){
  const res = registerUser(form);
  if(!res.success){
    alert(res.message || 'Registration failed');
    return false;
  }
  setSessionUser(form.role, form.name, form.email);
  return true;
}

function getCurrentUser() {
  try {
    const raw = sessionStorage.getItem('currentUser');
    return raw ? JSON.parse(raw) : null;
  } catch (e) {
    return null;
  }
}

function logout() {
  const user = getCurrentUser();
  sessionStorage.removeItem('currentUser');
  updateHeader();
  // hide dropdowns if present
  const pd = document.getElementById('profileDropdown'); if(pd) pd.classList.add('hidden');
  const sd = document.getElementById('sidebarDropdown'); if(sd) sd.classList.add('hidden');
  // redirect to appropriate login page
  if(user && user.role === 'practitioner') window.location.href = 'practitioner_login.html';
  else window.location.href = 'admin_login.html';
}

function updateHeader() {
  const user = getCurrentUser();
  const headerUser = document.getElementById('headerUser');
  const profileLink = document.getElementById('profileLink');
  const logoutBtn = document.getElementById('logoutBtn');
  const sidebarAvatar = document.getElementById('sidebarAvatar');
  const sidebarName = document.getElementById('sidebarName');
  const sidebarRole = document.getElementById('sidebarRole');
  if (user) {
    const hasName = user.name && user.name.trim() !== '';
    const displayName = hasName ? user.name : (user.role ? user.role.charAt(0).toUpperCase() + user.role.slice(1) : 'Account');
    if (headerUser) headerUser.textContent = `Signed in: ${displayName}` + (hasName ? ` (${user.role})` : '');
    if (sidebarName) sidebarName.textContent = displayName;
    if (sidebarRole) sidebarRole.textContent = user.role ? user.role.charAt(0).toUpperCase() + user.role.slice(1) : '';
    // avatar: use initials from name if present, otherwise role initials (first two letters)
    if (sidebarAvatar) {
      if (hasName) sidebarAvatar.textContent = user.name.split(' ').map(s=>s[0]).slice(0,2).join('').toUpperCase();
      else sidebarAvatar.textContent = (user.role || 'DR').slice(0,2).toUpperCase();
    }
    if (profileLink) profileLink.classList.remove('hidden');
    if (logoutBtn) logoutBtn.classList.remove('hidden');
  } else {
    if (headerUser) headerUser.textContent = '';
    if (profileLink) profileLink.classList.add('hidden');
    if (logoutBtn) logoutBtn.classList.add('hidden');
    if (sidebarName) sidebarName.textContent = 'Data Entry Portal';
    if (sidebarRole) sidebarRole.textContent = 'Logged in';
    if (sidebarAvatar) sidebarAvatar.textContent = 'DR';
  }
}

// Profile dropdown handling
function toggleProfileDropdown(e){
  if(e) e.preventDefault();
  const dd = document.getElementById('profileDropdown');
  const user = getCurrentUser();
  if(!dd) return;
  if(!user){
    // redirect to login if not signed in
    window.location.href = 'admin_login.html';
    return;
  }
  const nameEl = document.getElementById('dropdownName');
  const roleEl = document.getElementById('dropdownRole');
  if(nameEl) nameEl.textContent = user.name && user.name.trim() !== '' ? user.name : (user.role ? user.role.charAt(0).toUpperCase()+user.role.slice(1) : 'Account');
  if(roleEl) roleEl.textContent = user.role ? user.role.charAt(0).toUpperCase()+user.role.slice(1) : '';
  dd.classList.toggle('hidden');
}

document.addEventListener('DOMContentLoaded', function(){
  const profileBtn = document.getElementById('dropdownProfileBtn');
  const logoutBtn = document.getElementById('dropdownLogoutBtn');
  if(profileBtn) profileBtn.addEventListener('click', ()=>{ window.location.href='profile.html'; });
  if(logoutBtn) logoutBtn.addEventListener('click', ()=>{ logout(); const dd = document.getElementById('profileDropdown'); if(dd) dd.classList.add('hidden'); });

  // Close profile dropdown when clicking outside
  document.addEventListener('click', function(ev){
    const dd = document.getElementById('profileDropdown');
    const pl = document.getElementById('profileLink');
    if(!dd || dd.classList.contains('hidden')) return;
    const target = ev.target;
    if(pl && pl.contains(target)) return;
    if(dd && dd.contains(target)) return;
    dd.classList.add('hidden');
  });
  // Sidebar avatar dropdown
  const sidebarAvatar = document.getElementById('sidebarAvatar');
  const sidebarDropdown = document.getElementById('sidebarDropdown');
  const sbProfileBtn = document.getElementById('sbProfileBtn');
  const sbLogoutBtn = document.getElementById('sbLogoutBtn');
  if(sidebarAvatar && sidebarDropdown){
    sidebarAvatar.addEventListener('click', function(e){
      e.stopPropagation();
      const user = getCurrentUser();
      if(!user){ window.location.href = 'admin_login.html'; return; }
      const sbName = document.getElementById('sbName');
      const sbRole = document.getElementById('sbRole');
      if(sbName) sbName.textContent = user.name && user.name.trim() !== '' ? user.name : (user.role? user.role.charAt(0).toUpperCase()+user.role.slice(1): 'Account');
      if(sbRole) sbRole.textContent = user.role ? user.role.charAt(0).toUpperCase()+user.role.slice(1) : '';
      // If hidden, show and position the dropdown using fixed coords so it's never clipped
      if(sidebarDropdown.classList.contains('hidden')){
        // temporarily show hidden to measure
        sidebarDropdown.classList.remove('hidden');
        sidebarDropdown.style.position = 'fixed';
        sidebarDropdown.style.zIndex = '9999';
        sidebarDropdown.style.visibility = 'hidden';
        // ensure it's measurable
        sidebarDropdown.style.display = 'block';
        const rect = sidebarAvatar.getBoundingClientRect();
        const ddHeight = sidebarDropdown.offsetHeight;
        // center vertically on avatar, but keep some margin from top
        const top = Math.max(8, Math.round(rect.top + rect.height/2 - ddHeight/2));
        const left = Math.round(rect.right + 8);
        sidebarDropdown.style.left = left + 'px';
        sidebarDropdown.style.top = top + 'px';
        sidebarDropdown.style.visibility = 'visible';
      } else {
        sidebarDropdown.classList.add('hidden');
        // clear inline positioning
        sidebarDropdown.style.left = '';
        sidebarDropdown.style.top = '';
        sidebarDropdown.style.position = '';
        sidebarDropdown.style.zIndex = '';
        sidebarDropdown.style.visibility = '';
      }
    });
  }
  if(sbProfileBtn) sbProfileBtn.addEventListener('click', ()=>{ window.location.href='profile.html'; });
  if(sbLogoutBtn) sbLogoutBtn.addEventListener('click', ()=>{ logout(); });
  // Close sidebar dropdown when clicking outside
  document.addEventListener('click', function(ev){
    const sd = document.getElementById('sidebarDropdown');
    if(!sd || sd.classList.contains('hidden')) return;
    const target = ev.target;
    const av = document.getElementById('sidebarAvatar');
    if(av && av.contains(target)) return;
    if(sd && sd.contains(target)) return;
    sd.classList.add('hidden');
  });
});

function saveProfile(updated) {
  const user = getCurrentUser();
  if (!user) return false;
  const newUser = { ...user, ...updated };
  sessionStorage.setItem('currentUser', JSON.stringify(newUser));
  updateHeader();
  return true;
}

document.addEventListener('DOMContentLoaded', () => updateHeader());
