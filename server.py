import sqlite3
import openpyxl
from flask import Flask, request, jsonify

app = Flask(__name__, static_folder='.', static_url_path='')

DB_NAME = 'library.db'

def get_db():
    conn = sqlite3.connect(DB_NAME)
    conn.row_factory = sqlite3.Row
    return conn

def init_db():
    conn = get_db()
    c = conn.cursor()
    c.execute('''
        CREATE TABLE IF NOT EXISTS users (
            email TEXT PRIMARY KEY,
            password TEXT NOT NULL,
            name TEXT NOT NULL,
            role TEXT NOT NULL
        )
    ''')
    c.execute('''
        CREATE TABLE IF NOT EXISTS books (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            title TEXT NOT NULL,
            author TEXT NOT NULL,
            deptId TEXT NOT NULL,
            desc TEXT
        )
    ''')
    conn.commit()

    # Check if we need to seed the admin
    c.execute("SELECT * FROM users WHERE email='admin@elwadi.edu.eg'")
    if not c.fetchone():
        c.execute("INSERT INTO users (email, password, name, role) VALUES (?, ?, ?, ?)",
                  ('admin@elwadi.edu.eg', 'admin', 'المدير العام', 'admin'))
        conn.commit()

    # Check if we need to seed books from Excel
    c.execute("SELECT COUNT(*) FROM books")
    if c.fetchone()[0] == 0:
        try:
            wb = openpyxl.load_workbook('نظم معلومات الأعمال.xlsx', data_only=True)
            sheet = wb.active
            headers = [cell.value for cell in sheet[1]]
            start_id = 1000
            for row in sheet.iter_rows(min_row=2, values_only=True):
                if not any(row): continue
                b = {}
                for header, value in zip(headers, row):
                    if header: b[header.strip()] = value
                title = str(b.get('عنوان الوعاء', '')).replace('\n', ' ').strip()
                author = str(b.get('المؤلف', 'غير محدد')).replace('\n', ' ').strip()
                if title == 'None' or not title: continue
                if author == 'None': author = 'غير محدد'
                
                course = str(b.get('المقرر الذى يدعمه', '')).replace('\n', ' ').strip()
                if course == 'None': course = ''
                topics = str(b.get('رؤوس الموضوعات', '')).replace('\n', ' ').strip()
                if topics == 'None': topics = ''
                
                desc = ''
                if course: desc += f"يدعم مقرر: {course}. "
                if topics: desc += f"الموضوعات: {topics}."
                desc = desc.replace('\n', ' ').strip()

                c.execute("INSERT INTO books (id, title, author, deptId, desc) VALUES (?, ?, ?, ?, ?)",
                          (start_id, title, author, 'mis', desc))
                start_id += 1
            conn.commit()
            print("Database seeded from Excel")
        except Exception as e:
            print(f"Failed to seed db: {e}")

    conn.close()

init_db()

@app.route('/')
def index():
    return app.send_static_file('index.html')

@app.route('/api/books', methods=['GET'])
def get_books():
    conn = get_db()
    c = conn.cursor()
    c.execute("SELECT * FROM books ORDER BY id DESC")
    books = [dict(r) for r in c.fetchall()]
    conn.close()
    return jsonify(books)

@app.route('/api/books', methods=['POST'])
def add_book():
    data = request.json
    conn = get_db()
    c = conn.cursor()
    c.execute("INSERT INTO books (title, author, deptId, desc) VALUES (?, ?, ?, ?)",
              (data.get('title'), data.get('author'), data.get('deptId'), data.get('desc')))
    conn.commit()
    new_id = c.lastrowid
    conn.close()
    return jsonify({"id": new_id, "status": "success"})

@app.route('/api/users', methods=['GET'])
def get_users():
    conn = get_db()
    c = conn.cursor()
    c.execute("SELECT email, name, role FROM users") # Exclude passwords for safety/simplicity generally, but frontend needs it for auth loop/verify if we rely on it.
    # Actually, current frontend app.js expects password to be in the users array for the local auth simulation to keep refactor minimal.
    # We will include password for the sake of the minimal refactor. In a real app this is a massive security flaw.
    c.execute("SELECT * FROM users") 
    users = [dict(r) for r in c.fetchall()]
    conn.close()
    return jsonify(users)

@app.route('/api/users', methods=['POST'])
def add_user():
    data = request.json
    conn = get_db()
    c = conn.cursor()
    try:
        c.execute("INSERT INTO users (email, password, name, role) VALUES (?, ?, ?, ?)",
                  (data.get('email'), data.get('password'), data.get('name'), data.get('role', 'user')))
        conn.commit()
    except sqlite3.IntegrityError:
        return jsonify({"status": "error", "message": "Email already exists"}), 400
    conn.close()
    return jsonify({"status": "success"})

@app.route('/api/users/<email>', methods=['PUT'])
def update_user(email):
    data = request.json
    conn = get_db()
    c = conn.cursor()
    if 'role' in data:
        c.execute("UPDATE users SET role = ? WHERE email = ?", (data['role'], email))
    if 'name' in data:
        c.execute("UPDATE users SET name = ? WHERE email = ?", (data['name'], email))
    if 'password' in data:
        c.execute("UPDATE users SET password = ? WHERE email = ?", (data['password'], email))
    conn.commit()
    conn.close()
    return jsonify({"status": "success"})

@app.route('/api/users/<email>', methods=['DELETE'])
def delete_user(email):
    conn = get_db()
    c = conn.cursor()
    c.execute("DELETE FROM users WHERE email = ?", (email,))
    conn.commit()
    conn.close()
    return jsonify({"status": "success"})

if __name__ == '__main__':
    # Listen on all interfaces so local network devices can connect
    app.run(host='0.0.0.0', port=5000, debug=True)
