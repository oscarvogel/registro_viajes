# inspect_airtable.py
import os
import requests
from dotenv import load_dotenv
from collections import defaultdict

load_dotenv()

TOKEN = os.getenv("AIRTABLE_TOKEN")
BASE_ID = os.getenv("AIRTABLE_BASE_ID")

TABLES = {
    "USUARIO": os.getenv("AIRTABLE_TABLE_NAME_USUARIO"),
    "CAMIONES": os.getenv("AIRTABLE_TABLE_NAME_CAMIONES"),
    "CHOFERES": os.getenv("AIRTABLE_TABLE_NAME_CHOFERES")
}

if not all([TOKEN, BASE_ID]):
    print("❌ Error: Faltan variables base en el archivo .env.")
    exit(1)

def inspect_table(table_name, table_id):
    if not table_id:
        print(f"\n⚠️ Omitiendo {table_name}: Variable no configurada.")
        return

    print(f"\n{'='*40}")
    print(f"🔍 INSPECCIONANDO TABLA: {table_name}")
    print(f"📋 ID: {table_id}")
    print(f"{'='*40}")

    url = f"https://api.airtable.com/v0/{BASE_ID}/{table_id}"
    headers = {"Authorization": f"Bearer {TOKEN}"}
    params = {"maxRecords": 5}

    try:
        response = requests.get(url, headers=headers, params=params, timeout=10)
        data = response.json()

        if response.status_code != 200:
            print(f"❌ Error HTTP {response.status_code}: {data.get('error', {}).get('message', 'Desconocido')}")
            return

        records = data.get("records", [])
        if not records:
            print("✅ Conexión exitosa, pero la tabla está vacía.")
            return

        # Recopilar todos los nombres de campos vistos
        all_fields = set()
        for record in records:
            all_fields.update(record.get("fields", {}).keys())

        all_fields = sorted(all_fields)

        print(f"✅ Conexión exitosa.")
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
                if isinstance(value, list):
                    value = ", ".join(str(v) for v in value)
                print(f"  {field}: {value}")

    except requests.exceptions.Timeout:
        print("❌ Error: Tiempo de espera agotado al conectar con Airtable.")
    except requests.exceptions.ConnectionError:
        print("❌ Error: No se pudo conectar a Airtable.")
    except Exception as e:
        print(f"❌ Error inesperado: {e}")

print(f"Inspeccionando Base ID: {BASE_ID}")
for name, table_id in TABLES.items():
    inspect_table(name, table_id)