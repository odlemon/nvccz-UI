import mysql.connector
conn = mysql.connector.connect(
    host="localhost",
    user="root",
    password="vv8OGu5Pd8KkYMzT3YSHfL1s",
    database="matanho_nexus"
)
cursor = conn.cursor()
sql = """
    INSERT INTO users (id, email, name, password_hash, created_at, updated_at) VALUES 
    (UUID(), "test@procurement.matanho.com", "Test Procurement User", "$2b$12$LQv3c1yqBWVHxkd0LHAkCOYz6TtxMQJqhN8/LewdBPj/RK.PZvO.S", NOW(), NOW())
"""
cursor.execute(sql)
conn.commit()
print("User created:", cursor.rowcount)
cursor.close()
conn.close()