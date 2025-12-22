# validate_airtable.py
import os
import requests
from dotenv import load_dotenv

# Cargar variables del archivo .env
load_dotenv()

# Leer credenciales
TOKEN = os.getenv("AIRTABLE_TOKEN")
BASE_ID = os.getenv("AIRTABLE_BASE_ID")
TABLE_ID = os.getenv("AIRTABLE_TABLE_NAME_USUARIO")

# Validar que las variables existen
if not all([TOKEN, BASE_ID, TABLE_ID]):
    print("❌ Error: Faltan variables en el archivo .env.")
    print("Asegúrate de tener:")
    print("  AIRTABLE_TOKEN=...")
    print("  AIRTABLE_BASE_ID=app...")
    print("  AIRTABLE_TABLE_ID=tbl...")
    exit(1)

# URL de la API de Airtable
url = f"https://api.airtable.com/v0/{BASE_ID}/{TABLE_ID}"

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
        print("✅ Conexión exitosa. Los datos de Airtable son válidos.")
        print(f"  Base ID: {BASE_ID}")
        print(f"  Table ID: {TABLE_ID}")
        # Opcional: muestra un registro de ejemplo
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
    print("❌ Error: La solicitud a Airtable excedió el tiempo de espera.")
except requests.exceptions.ConnectionError:
    print("❌ Error: No se pudo conectar a Airtable. Verifica tu conexión a internet.")
except Exception as e:
    print(f"❌ Error inesperado: {e}")