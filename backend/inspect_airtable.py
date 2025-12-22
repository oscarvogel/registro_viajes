# inspect_airtable.py
import os
import requests
from dotenv import load_dotenv
from collections import defaultdict

load_dotenv()

TOKEN = os.getenv("AIRTABLE_TOKEN")
BASE_ID = os.getenv("AIRTABLE_BASE_ID")
TABLE_ID = os.getenv("AIRTABLE_TABLE_NAME_USUARIO")

if not all([TOKEN, BASE_ID, TABLE_ID]):
    print("❌ Error: Faltan variables en el archivo .env.")
    exit(1)

url = f"https://api.airtable.com/v0/{BASE_ID}/{TABLE_ID}"
headers = {"Authorization": f"Bearer {TOKEN}"}

# Solicitamos hasta 5 registros para inspeccionar estructura y datos
params = {"maxRecords": 5}

try:
    response = requests.get(url, headers=headers, params=params, timeout=10)
    data = response.json()

    if response.status_code != 200:
        print(f"❌ Error HTTP {response.status_code}: {data.get('error', {}).get('message', 'Desconocido')}")
        exit(1)

    records = data.get("records", [])
    if not records:
        print("✅ Conexión exitosa, pero la tabla está vacía.")
        exit(0)

    # Recopilar todos los nombres de campos vistos
    all_fields = set()
    for record in records:
        all_fields.update(record.get("fields", {}).keys())

    all_fields = sorted(all_fields)

    print("✅ Conexión exitosa.")
    print(f"📊 Base ID: {BASE_ID}")
    print(f"📋 Table ID: {TABLE_ID}")
    print(f"🔢 Registros inspeccionados: {len(records)}")
    print("\n--- Estructura de campos (nombres) ---")
    for field in all_fields:
        print(f"  • {field}")

    print("\n--- Datos de ejemplo (hasta 5 registros) ---")
    for i, record in enumerate(records, 1):
        print(f"\n🔹 Registro {i} (ID: {record['id']})")
        fields = record.get("fields", {})
        for field in all_fields:
            value = fields.get(field, "—")
            # Mostrar listas o valores complejos de forma legible
            if isinstance(value, list):
                value = ", ".join(str(v) for v in value)
            print(f"  {field}: {value}")

except requests.exceptions.Timeout:
    print("❌ Error: Tiempo de espera agotado al conectar con Airtable.")
except requests.exceptions.ConnectionError:
    print("❌ Error: No se pudo conectar a Airtable.")
except Exception as e:
    print(f"❌ Error inesperado: {e}")