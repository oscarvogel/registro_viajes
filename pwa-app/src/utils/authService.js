import localforage from 'localforage';
import axios from 'axios';

const AIRTABLE_BASE = import.meta.env.VITE_AIRTABLE_BASE_ID;
const AIRTABLE_TOKEN = import.meta.env.VITE_AIRTABLE_TOKEN;
const USUARIOS_TABLE = import.meta.env.VITE_AIRTABLE_USUARIOS_TABLE || 'Usuarios';
const USUARIOS_VIEW = import.meta.env.VITE_AIRTABLE_USUARIOS_VIEW;

// Sincronizar usuarios desde Airtable
export async function syncUsuariosFromAirtable() {
  try {
    console.log('🔄 Iniciando sincronización de usuarios...');
    console.log('Base ID:', AIRTABLE_BASE);
    console.log('Tabla:', USUARIOS_TABLE);
    console.log('View ID:', USUARIOS_VIEW);
    console.log('Token (primeros 20 chars):', AIRTABLE_TOKEN?.substring(0, 20) + '...');
    
    // Intentar primero sin la vista para verificar permisos básicos
    const url = `https://api.airtable.com/v0/${AIRTABLE_BASE}/${encodeURIComponent(USUARIOS_TABLE)}`;
    const params = {};
    // Comentar temporalmente la vista para probar
    // if (USUARIOS_VIEW) {
    //   params.view = USUARIOS_VIEW;
    // }
    
    console.log('URL:', url);
    console.log('Params:', params);
    
    const resp = await axios.get(url, {
      headers: { 
        Authorization: `Bearer ${AIRTABLE_TOKEN}`,
        'Content-Type': 'application/json'
      },
      params,
      timeout: 15000
    });
    
    console.log('✅ Respuesta recibida:', resp.data);
    
    const usuarios = resp.data.records.map(r => ({
      id: r.id,
      usuario: r.fields.usuario || r.fields.Usuario,
      cliente_id: r.fields.cliente_id || r.fields['cliente_id'],
      password: r.fields.password || r.fields.Password
    }));
    
    console.log('📋 Usuarios procesados:', usuarios.length);
    console.log('Primer usuario (sin password):', {
      id: usuarios[0]?.id,
      usuario: usuarios[0]?.usuario,
      cliente_id: usuarios[0]?.cliente_id
    });
    
    await localforage.setItem('usuarios_data', {
      usuarios,
      lastSync: new Date().toISOString()
    });
    
    console.log('💾 Usuarios guardados en localStorage');
    
    return { success: true, count: usuarios.length };
  } catch (err) {
    console.error('❌ Error sincronizando usuarios:', err);
    console.error('Detalles del error:', err.response?.data || err.message);
    console.error('Status:', err.response?.status);
    
    // Sugerencia de error más específica
    let errorMsg = 'Error desconocido';
    if (err.response?.status === 403) {
      errorMsg = 'Permisos insuficientes. Verifique que el token tenga acceso a la tabla "Usuarios" en Airtable.';
    } else if (err.response?.status === 404) {
      errorMsg = 'Tabla no encontrada. Verifique que la tabla se llame exactamente "Usuarios".';
    } else {
      errorMsg = err.response?.data?.error?.message || err.message;
    }
    
    return { 
      success: false, 
      error: errorMsg
    };
  }
}

// Obtener lista de usuarios desde localStorage
export async function getUsuarios() {
  const cached = await localforage.getItem('usuarios_data');
  if (cached && cached.usuarios) {
    return cached.usuarios;
  }
  return [];
}

// Validar credenciales
export async function validateLogin(usuario, password) {
  const usuarios = await getUsuarios();
  const user = usuarios.find(u => u.usuario === usuario);
  
  if (!user) {
    return { success: false, error: 'Usuario no encontrado' };
  }
  
  if (user.password !== password) {
    return { success: false, error: 'Contraseña incorrecta' };
  }
  
  // Guardar sesión
  await localforage.setItem('current_user', {
    usuario: user.usuario,
    cliente_id: user.cliente_id,
    loginTime: new Date().toISOString()
  });
  
  return { success: true, user };
}

// Obtener usuario actual
export async function getCurrentUser() {
  return await localforage.getItem('current_user');
}

// Cerrar sesión
export async function logout() {
  await localforage.removeItem('current_user');
}

// Verificar si hay sesión activa
export async function isLoggedIn() {
  const user = await getCurrentUser();
  return !!user;
}
