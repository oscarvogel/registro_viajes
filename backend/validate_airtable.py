# validate_airtable.py
import os
import requests
from dotenv import load_dotenv

# Cargar variables del archivo .env
load_dotenv()

# Leer credenciales
TOKEN = os.getenv("AIRTABLE_TOKEN")
BASE_ID = os.getenv("AIRTABLE_BASE_ID")

# Definir tablas a validar
TABLES = {
    "USUARIO": os.getenv("AIRTABLE_TABLE_NAME_USUARIO"),
    "CAMIONES": os.getenv("AIRTABLE_TABLE_NAME_CAMIONES"),
    "CHOFERES": os.getenv("AIRTABLE_TABLE_NAME_CHOFERES")
}

# Validar que las variables críticas existen
if not all([TOKEN, BASE_ID]):
    print("❌ Error: Faltan variables base en el archivo .env.")
    print("Asegúrate de tener:")
    print("  AIRTABLE_TOKEN=...")
    print("  AIRTABLE_BASE_ID=...")
    exit(1)

def validate_table(table_name, table_id):
    if not table_id:
        print(f"⚠️ Advertencia: No se ha configurado la variable para la tabla {table_name}.")
        return

    print(f"\n🔍 Validando tabla: {table_name} ({table_id})...")
    
    # URL de la API de Airtable
    url = f"https://api.airtable.com/v0/{BASE_ID}/{table_id}"

    # Cabeceras
    headers = {
        "Authorization": f"Bearer {TOKEN}",
        "Content-Type": "application/json"
    }

    # Realizar solicitud GET (solo 1 registro para validar)
    params = {"maxRecords": 1}

    try:
        response = requests.get(url, headers=headers, params=params, timeout=10)
        status = response.status_code
        data = response.json()

        if status == 200:
            print(f"✅ Conexión exitosa con tabla {table_name}.")
            if data.get("records"):
                print("  Ejemplo de registro obtenido.")
            else:
                print("  La tabla está vacía (pero es accesible).")
        elif status == 401:
            print("❌ Error 401: Token inválido o no autorizado.")
            print("  Verifica que el token sea correcto y tenga acceso a esta base.")
        elif status == 403:
            print("❌ Error 403: Acceso denegado.")
            print("  El token no tiene permisos para esta base o tabla.")
        elif status == 404:
            print("❌ Error 404: Base o tabla no encontrada.")
            print("  Verifica que el Base ID y Table ID sean correctos.")
        elif status == 422:
            print("❌ Error 422: Nombre de tabla inválido.")
            print("  Si usas un nombre en lugar de Table ID, asegúrate de que coincida exactamente.")
        else:
            print(f"❌ Error inesperado (HTTP {status}): {data.get('error', {}).get('message', 'Desconocido')}")

    except requests.exceptions.Timeout:
        print(f"❌ Error: Timeout al conectar con tabla {table_name}.")
    except requests.exceptions.ConnectionError:
        print(f"❌ Error: Error de conexión al validar tabla {table_name}.")
    except Exception as e:
        print(f"❌ Error inesperado en tabla {table_name}: {e}")

# Ejecutar validación para todas las tablas configuradas
print(f"Validando conexión a Base ID: {BASE_ID}")
for name, table_id in TABLES.items():
    validate_table(name, table_id)