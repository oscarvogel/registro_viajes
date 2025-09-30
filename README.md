# 🚛 Sistema de Registro de Viajes

Una Progressive Web App (PWA) desarrollada con Vue.js para el registro y sincronización de viajes de camiones con integración a Airtable y MySQL.

![Vue.js](https://img.shields.io/badge/Vue.js-3.x-4FC08D?style=flat-square&logo=vue.js)
![Vite](https://img.shields.io/badge/Vite-4.x-646CFF?style=flat-square&logo=vite)
![PWA](https://img.shields.io/badge/PWA-Ready-orange?style=flat-square)
![MySQL](https://img.shields.io/badge/MySQL-Database-4479A1?style=flat-square&logo=mysql)
![Airtable](https://img.shields.io/badge/Airtable-Integration-18BFFF?style=flat-square&logo=airtable)

## 📱 Características

- **Progressive Web App**: Funciona offline y se puede instalar como app nativa
- **Interfaz móvil**: Diseño responsive optimizado para dispositivos móviles
- **Almacenamiento offline**: Guarda los registros localmente cuando no hay conexión
- **Sincronización automática**: Envía los datos a Airtable cuando hay conectividad
- **Gestión de flotas**: Registro de camiones, choferes y destinos
- **Validación de datos**: Control de campos obligatorios y consistencia
- **Backend de sincronización**: Script Python para migrar datos de Airtable a MySQL

## 🏗️ Arquitectura del Proyecto

```
registro_viajes/
├── pwa-app/                    # Aplicación Vue.js PWA
│   ├── src/
│   │   ├── components/
│   │   │   ├── ViajeForm.vue      # Formulario de registro de viajes
│   │   │   ├── PendingList.vue    # Lista de viajes pendientes
│   │   │   ├── ToastContainer.vue # Sistema de notificaciones
│   │   │   └── Configuracion.vue  # Configuración de la app
│   │   ├── utils/
│   │   │   └── log.js            # Sistema de logging
│   │   ├── App.vue               # Componente principal
│   │   └── main.js               # Punto de entrada
│   ├── public/
│   │   └── data/                 # Archivos JSON estáticos
│   ├── package.json              # Dependencias del frontend
│   └── vite.config.js            # Configuración de Vite y PWA
├── backend/
│   └── sync_airtable_to_mysql.py # Script de sincronización
└── .gitignore                    # Exclusiones de Git
```

## 🚀 Instalación y Configuración

### Prerrequisitos

- **Node.js** ≥ 20.19.0 || ≥ 22.12.0
- **Python** ≥ 3.8 (para el backend)
- **MySQL** (para la base de datos)
- Cuenta de **Airtable** con API key/token

### 1. Clonar el repositorio

```bash
git clone https://github.com/oscarvogel/registro_viajes.git
cd registro_viajes
```

### 2. Configuración del Frontend (PWA)

```bash
cd pwa-app
npm install
```

#### Variables de entorno (Frontend)

Crear archivo `.env` en `pwa-app/`:

```env
VITE_AIRTABLE_BASE_ID=your_airtable_base_id
VITE_AIRTABLE_TABLE_NAME=your_table_name
VITE_AIRTABLE_TOKEN=your_airtable_token
```

### 3. Configuración del Backend

```bash
cd backend
pip install requests mysql-connector-python python-dotenv
```

#### Variables de entorno (Backend)

Crear archivo `.env` en `backend/`:

```env
# Airtable Configuration
AIRTABLE_TOKEN=your_airtable_personal_access_token
AIRTABLE_BASE_ID=your_airtable_base_id
AIRTABLE_TABLE_NAME=your_table_name

# MySQL Configuration
MYSQL_HOST=localhost
MYSQL_USER=your_mysql_user
MYSQL_PASSWORD=your_mysql_password
MYSQL_DATABASE=your_database_name

# Business Configuration
MOVILES_EMPRESA_ID=1
MOVILES_AREA_ID=1

# Optional: Placeholder movil creation
ALLOW_PLACEHOLDER_MOVIL=false
PLACEHOLDER_MOVIL_PREFIX=UNKNOWN
```

## 📊 Estructura de Datos

### Datos del Viaje
La aplicación registra los siguientes datos por viaje:

- **Información básica**: Fecha, origen, destino
- **Personal y vehículo**: Chofer (DNI), camión (patente)
- **Carga**: Tipo de producto, toneladas (pulpable, aserrable, chips)
- **Estado**: Sin actividad (con motivo), observaciones

### Archivos de Configuración
La app utiliza archivos JSON estáticos en `public/data/`:

- `choferes.json`: Lista de conductores
- `camiones.json`: Flota de vehículos
- `predios.json`: Predios/orígenes disponibles
- `destinos.json`: Destinos de carga
- `productos.json`: Tipos de productos transportables
- `motivos.json`: Motivos de inactividad

## 🔧 Uso

### Desarrollo

```bash
cd pwa-app
npm run dev
```

La aplicación estará disponible en `http://localhost:5173/viajes/`

### Producción

```bash
cd pwa-app
npm run build
```

Los archivos de producción se generan en `dist/`

### Sincronización Backend

```bash
cd backend

# Modo dry-run (solo mostrar datos, no modificar BD)
python sync_airtable_to_mysql.py --dry-run

# Insertar en MySQL sin borrar de Airtable
python sync_airtable_to_mysql.py --mysql

# Sincronización completa (inserta en MySQL y borra de Airtable)
python sync_airtable_to_mysql.py --confirm
```

## 🔄 Flujo de Datos

1. **Registro**: El usuario registra viajes en la PWA
2. **Almacenamiento local**: Los datos se guardan en IndexedDB (offline)
3. **Sincronización**: Cuando hay conexión, se envían a Airtable
4. **Procesamiento**: El script Python migra de Airtable a MySQL
5. **Limpieza**: Los registros procesados se eliminan de Airtable

## 🎯 Funcionalidades Principales

### 📝 Registro de Viajes
- Formulario intuitivo con validación
- Autocompletado de predios y destinos
- Selección de choferes y camiones
- Manejo de productos y tonelajes
- Registro de inactividad con motivos

### 📱 Modo Offline
- Funciona sin conexión a internet
- Almacena hasta 10 registros pendientes
- Sincronización automática al recuperar conexión
- Indicador visual de registros pendientes

### 🔧 Panel de Administración
- Lista de registros pendientes de sincronización
- Sincronización individual o masiva
- Eliminación de registros locales
- Monitoreo del estado de sincronización

## 🔒 Seguridad

- **Tokens de API**: Utiliza tokens de acceso personal de Airtable
- **Variables de entorno**: Configuración sensible en archivos .env
- **Validación**: Control de datos tanto en frontend como backend
- **Reintentos**: Manejo de errores con backoff exponencial

## 🛠️ Tecnologías Utilizadas

### Frontend
- **Vue.js 3**: Framework reactivo
- **Vite**: Build tool y dev server
- **Vite PWA Plugin**: Service Worker y manifest
- **LocalForage**: Almacenamiento IndexedDB
- **Axios**: Cliente HTTP
- **Tailwind CSS**: Styling (clases utilitarias)

### Backend
- **Python**: Script de sincronización
- **MySQL Connector**: Conexión a base de datos
- **Requests**: HTTP client para Airtable API
- **python-dotenv**: Manejo de variables de entorno

## 📝 Contribuir

1. Fork el proyecto
2. Crea tu feature branch (`git checkout -b feature/AmazingFeature`)
3. Commit tus cambios (`git commit -m 'Add some AmazingFeature'`)
4. Push a la branch (`git push origin feature/AmazingFeature`)
5. Abre un Pull Request

## 📄 Licencia

Este proyecto está bajo la Licencia MIT - ver el archivo [LICENSE.md](LICENSE.md) para detalles.

## 🤝 Soporte

Si tienes preguntas o necesitas ayuda:

1. Revisa la [documentación del proyecto](https://github.com/oscarvogel/registro_viajes)
2. Abre un [issue en GitHub](https://github.com/oscarvogel/registro_viajes/issues)
3. Contacta al equipo de desarrollo

## 📈 Roadmap

- [ ] Autenticación de usuarios
- [ ] Reportes y estadísticas
- [ ] Geolocalización GPS
- [ ] Notificaciones push
- [ ] API REST completa
- [ ] Dashboard web de administración

---

Desarrollado con ❤️ para la gestión eficiente de flotas de transporte.