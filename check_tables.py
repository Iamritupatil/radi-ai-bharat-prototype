import psycopg2

conn = psycopg2.connect(
    host='db.hwmqslotiotgudjjlxyl.supabase.co',
    port=5432,
    database='postgres',
    user='postgres',
    password='O29CyZpS4v4Mf9AF'
)
cur = conn.cursor()
cur.execute("SELECT table_name FROM information_schema.tables WHERE table_schema='public' ORDER BY table_name")
rows = cur.fetchall()
print("Tables in public schema:")
for r in rows:
    print(f"  - {r[0]}")
conn.close()
