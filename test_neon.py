import psycopg2

try:
    conn = psycopg2.connect(
        "postgresql://neondb_owner:npg_Ho2N4KipPbAk@ep-orange-lake-adhvvwb0-pooler.c-2.us-east-1.aws.neon.tech/neondb?sslmode=require"
    )
    cur = conn.cursor()
    cur.execute("SELECT * FROM attendance;")
    rows = cur.fetchall()
    for r in rows:
        print(r)
    conn.close()
except Exception as e:
    print("Connection failed:", e)
