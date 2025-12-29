import localforage from 'localforage';
import axios from 'axios';

const AIRTABLE_BASE = import.meta.env.VITE_AIRTABLE_BASE_ID;
const AIRTABLE_TOKEN = import.meta.env.VITE_AIRTABLE_TOKEN;
const USUARIOS_TABLE = import.meta.env.VITE_AIRTABLE_USUARIOS_TABLE || 'Usuarios';
const USUARIOS_VIEW = import.meta.env.VITE_AIRTABLE_USUARIOS_VIEW;
const CAMIONES_TABLE = import.meta.env.VITE_AIRTABLE_CAMIONES_TABLE || 'Camiones';
const CHOFER_TABLE = import.meta.env.VITE_AIRTABLE_CHOFER_TABLE || 'Chofer';

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
    
    // Mapear y filtrar usuarios válidos
    const usuariosSinFiltrar = resp.data.records.map(r => ({
      id: r.id,
      usuario: r.fields.usuario || r.fields.Usuario,
      cliente_id: r.fields.cliente_id || r.fields['cliente_id'],
      password: r.fields.password || r.fields.Password
    }));
    
    // Filtrar usuarios vacíos o incompletos
    const usuarios = usuariosSinFiltrar.filter(u => {
      const esValido = u.usuario && u.usuario.trim() !== '' && 
                       u.cliente_id && u.cliente_id.toString().trim() !== '' && 
                       u.password && u.password.trim() !== '';
      
      if (!esValido) {
        console.warn('⚠️ Usuario inválido descartado:', {
          id: u.id,
          usuario: u.usuario || '(vacío)',
          cliente_id: u.cliente_id || '(vacío)',
          tienePassword: !!u.password
        });
      }
      
      return esValido;
    });
    
    console.log(`📋 Usuarios procesados: ${usuarios.length} válidos de ${usuariosSinFiltrar.length} totales`);
    if (usuarios.length > 0) {
      console.log('Primer usuario válido (sin password):', {
        id: usuarios[0]?.id,
        usuario: usuarios[0]?.usuario,
        cliente_id: usuarios[0]?.cliente_id
      });
    }
    
    // Validar que haya al menos un usuario
    if (usuarios.length === 0) {
      throw new Error('No se encontraron usuarios válidos en Airtable');
    }
    
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

// Sincronizar camiones filtrados por cliente_id
export async function syncCamionesByCliente(cliente_id) {
  console.log(`🚛 Sincronizando camiones para cliente: ${cliente_id}`);
  
  try {
    const url = `https://api.airtable.com/v0/${AIRTABLE_BASE}/${encodeURIComponent(CAMIONES_TABLE)}`;
    
    const resp = await axios.get(url, {
      headers: { 
        Authorization: `Bearer ${AIRTABLE_TOKEN}`,
        'Content-Type': 'application/json'
      },
      params: {
        filterByFormula: `{cliente_id} = '${cliente_id}'`
      },
      timeout: 15000
    });
    
    const camiones = resp.data.records.map(r => ({
      id: r.id,
      patente: r.fields.patente || '',
      modelo: r.fields.modelo || '',
      cliente_id: r.fields.cliente_id || ''
    }));
    
    await localforage.setItem(`camiones_${cliente_id}`, {
      camiones,
      lastSync: new Date().toISOString()
    });
    
    console.log(`✅ ${camiones.length} camiones sincronizados para cliente ${cliente_id}`);
    
    return { success: true, count: camiones.length };
  } catch (err) {
    console.error('❌ Error sincronizando camiones:', err);
    return { success: false, error: err.message };
  }
}

// Sincronizar choferes filtrados por cliente_id
export async function syncChoferesByCliente(cliente_id) {
  console.log(`👤 Sincronizando choferes para cliente: ${cliente_id}`);
  
  try {
    const url = `https://api.airtable.com/v0/${AIRTABLE_BASE}/${encodeURIComponent(CHOFER_TABLE)}`;
    
    const resp = await axios.get(url, {
      headers: { 
        Authorization: `Bearer ${AIRTABLE_TOKEN}`,
        'Content-Type': 'application/json'
      },
      params: {
        filterByFormula: `{cliente_id} = '${cliente_id}'`
      },
      timeout: 15000
    });
    
    const choferes = resp.data.records.map(r => ({
      id: r.id,
      nombre: r.fields.nombre || '',
      apellido: r.fields.apellido || '',
      dni: r.fields.dni || '',
      cliente_id: r.fields.cliente_id || ''
    }));
    
    await localforage.setItem(`choferes_${cliente_id}`, {
      choferes,
      lastSync: new Date().toISOString()
    });
    
    console.log(`✅ ${choferes.length} choferes sincronizados para cliente ${cliente_id}`);
    
    return { success: true, count: choferes.length };
  } catch (err) {
    console.error('❌ Error sincronizando choferes:', err);
    return { success: false, error: err.message };
  }
}

// Obtener camiones del cliente desde localStorage
export async function getCamionesByCliente(cliente_id) {
  const cached = await localforage.getItem(`camiones_${cliente_id}`);
  if (cached && cached.camiones) {
    return cached.camiones;
  }
  return [];
}

// Obtener choferes del cliente desde localStorage
export async function getChoferesByCliente(cliente_id) {
  const cached = await localforage.getItem(`choferes_${cliente_id}`);
  if (cached && cached.choferes) {
    return cached.choferes;
  }
  return [];
}

// Validar credenciales y sincronizar datos del cliente
export async function validateLogin(usuario, password) {
  const usuarios = await getUsuarios();
  const user = usuarios.find(u => u.usuario === usuario);
  
  if (!user) {
    return { success: false, error: 'Usuario no encontrado' };
  }
  
  if (user.password !== password) {
    return { success: false, error: 'Contraseña incorrecta' };
  }
  
  // Sincronizar camiones y choferes del cliente en background
  console.log(`🔄 Sincronizando datos para cliente ${user.cliente_id}...`);
  
  try {
    const [camionesResult, choferesResult] = await Promise.all([
      syncCamionesByCliente(user.cliente_id),
      syncChoferesByCliente(user.cliente_id)
    ]);
    
    console.log('Resultados sincronización:', { camiones: camionesResult, choferes: choferesResult });
  } catch (err) {
    console.warn('⚠️ Error en sincronización de datos maestros:', err);
    // No bloqueamos el login si falla la sincronización
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
