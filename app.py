import os
import json
import sqlite3
import random
from datetime import datetime
from flask import Flask, render_template, request, jsonify

app = Flask(__name__)
DB_FILE = "quiz_master.db"

QUESTIONS_BANK = {
    "Python": [
        {
            "id": 1,
            "question": "What is the primary difference between a Python list and a tuple?",
            "options": [
                "Lists are immutable, tuples are mutable",
                "Lists are mutable, tuples are immutable",
                "Lists only store numbers, tuples store everything",
                "Tuples cannot be indexed or sliced"
            ],
            "answer": 1,
            "explanation": "Lists in Python are mutable (can be changed after creation), whereas tuples are immutable."
        },
        {
            "id": 2,
            "question": "Which cryptographic function is used in PBKDF2 for key stretching?",
            "options": ["MD5", "HMAC (e.g. SHA-256)", "DES", "ROT13"],
            "answer": 1,
            "explanation": "PBKDF2 applies a pseudorandom function, typically HMAC with a secure digest like SHA-256, over thousands of iterations."
        },
        {
            "id": 3,
            "question": "What does Python's GIL (Global Interpreter Lock) prevent?",
            "options": [
                "Memory leaks from recursion",
                "Multiple native threads from executing Python bytecodes in parallel",
                "Variables from being reassigned in functions",
                "Importing third-party C extensions"
            ],
            "answer": 1,
            "explanation": "The GIL is a mutex that protects access to Python objects, preventing multiple threads from executing Python bytecodes simultaneously in CPython."
        },
        {
            "id": 4,
            "question": "Which built-in function returns an iterator that yields tuples of (index, item)?",
            "options": ["map()", "zip()", "enumerate()", "filter()"],
            "answer": 2,
            "explanation": "enumerate() takes a collection and returns an enumerate object yielding (index, item) pairs."
        },
        {
            "id": 5,
            "question": "What will `bool([])` evaluate to in Python?",
            "options": ["True", "False", "None", "TypeError"],
            "answer": 1,
            "explanation": "Empty collections (lists, dicts, tuples, sets) evaluate to False in boolean context."
        }
    ],
    "Web Development": [
        {
            "id": 6,
            "question": "Which HTTP status code indicates a successful resource creation?",
            "options": ["200 OK", "201 Created", "204 No Content", "302 Found"],
            "answer": 1,
            "explanation": "HTTP 201 Created is the standard REST status returned after a new resource has been successfully created."
        },
        {
            "id": 7,
            "question": "In CSS, what does `backdrop-filter: blur(16px)` do?",
            "options": [
                "Blurs the text inside the element",
                "Blurs the area behind the element, creating a glassmorphism effect",
                "Blurs only the outer box shadow",
                "Disables GPU acceleration"
            ],
            "answer": 1,
            "explanation": "backdrop-filter applies graphical effects such as blurring to the area behind an element."
        },
        {
            "id": 8,
            "question": "Which JavaScript keyword declares a block-scoped variable that cannot be re-assigned?",
            "options": ["var", "let", "const", "static"],
            "answer": 2,
            "explanation": "const declares block-scoped identifiers whose binding cannot be re-assigned."
        },
        {
            "id": 9,
            "question": "What does CORS stand for in web security?",
            "options": [
                "Cross-Origin Resource Sharing",
                "Central Object Routing System",
                "Client-Only Rendering Standard",
                "Cascading Override Rule Set"
            ],
            "answer": 0,
            "explanation": "CORS (Cross-Origin Resource Sharing) is an HTTP-header based mechanism that allows servers to indicate origins other than its own from which a browser should permit loading resources."
        },
        {
            "id": 10,
            "question": "What is the primary role of an event loop in modern JavaScript engines?",
            "options": [
                "Compile TypeScript into assembly",
                "Coordinate execution of synchronous code, microtasks (Promises), and macrotasks (timers)",
                "Allocate garbage collection heap",
                "Encrypt WebSocket connections"
            ],
            "answer": 1,
            "explanation": "The event loop continuously checks the call stack and dequeues pending microtasks and macrotasks."
        }
    ],
    "Data Structures & Algorithms": [
        {
            "id": 11,
            "question": "What is the average-case time complexity of searching in a Hash Map?",
            "options": ["O(1)", "O(log n)", "O(n)", "O(n log n)"],
            "answer": 0,
            "explanation": "Average-case lookup, insert, and delete operations in a hash table operate in O(1) constant time."
        },
        {
            "id": 12,
            "question": "Which data structure follows the First-In, First-Out (FIFO) principle?",
            "options": ["Stack", "Queue", "Binary Search Tree", "Max Heap"],
            "answer": 1,
            "explanation": "Queues process items in FIFO order, where the first element added is the first one removed."
        },
        {
            "id": 13,
            "question": "Which algorithm is optimal for finding the shortest path in a weighted graph with non-negative weights?",
            "options": ["Depth-First Search", "Dijkstra's Algorithm", "Bellman-Ford", "Floyd-Warshall"],
            "answer": 1,
            "explanation": "Dijkstra's algorithm finds the single-source shortest path in graphs with non-negative edge weights in O((V + E) log V) using a priority queue."
        },
        {
            "id": 14,
            "question": "What is the worst-case time complexity of QuickSort?",
            "options": ["O(n log n)", "O(n)", "O(n²)", "O(2ⁿ)"],
            "answer": 2,
            "explanation": "QuickSort degrades to O(n²) when the chosen pivot consistently divides the array into extremely unbalanced subproblems (e.g. sorted array with first element as pivot)."
        },
        {
            "id": 15,
            "question": "Which tree traversal visits nodes in the order: Left Subtree, Root, Right Subtree?",
            "options": ["Pre-order", "In-order", "Post-order", "Level-order"],
            "answer": 1,
            "explanation": "In-order traversal visits Left -> Root -> Right, yielding sorted order in a Binary Search Tree."
        }
    ]
}

def init_db():
    conn = sqlite3.connect(DB_FILE)
    conn.execute("""
        CREATE TABLE IF NOT EXISTS leaderboard (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            player_name TEXT NOT NULL,
            category TEXT NOT NULL,
            score INTEGER NOT NULL,
            total_questions INTEGER NOT NULL,
            time_seconds REAL NOT NULL,
            accuracy_pct REAL NOT NULL,
            played_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        )
    """)
    # Seed top players if empty
    cur = conn.cursor()
    cur.execute("SELECT COUNT(*) FROM leaderboard")
    if cur.fetchone()[0] == 0:
        samples = [
            ("Praveen Raja", "Python", 5, 5, 24.5, 100.0),
            ("DevNinja", "Python", 4, 5, 31.2, 80.0),
            ("CodeMaster", "Web Development", 5, 5, 27.8, 100.0),
            ("AlgorithmPro", "Data Structures & Algorithms", 5, 5, 34.0, 100.0),
            ("TechEnthusiast", "Web Development", 4, 5, 42.1, 80.0)
        ]
        conn.executemany("""
            INSERT INTO leaderboard (player_name, category, score, total_questions, time_seconds, accuracy_pct)
            VALUES (?, ?, ?, ?, ?, ?)
        """, samples)
        conn.commit()
    conn.close()

init_db()

@app.route("/")
def index():
    return render_template("index.html")

@app.route("/api/categories", methods=["GET"])
def get_categories():
    data = []
    for cat, qs in QUESTIONS_BANK.items():
        data.append({
            "name": cat,
            "count": len(qs)
        })
    return jsonify({"categories": data})

@app.route("/api/questions", methods=["GET"])
def get_questions():
    category = request.args.get("category", "Python").strip()
    questions = QUESTIONS_BANK.get(category)
    if not questions:
        questions = QUESTIONS_BANK["Python"]

    shuffled = list(questions)
    random.shuffle(shuffled)

    # Don't reveal correct answer index or explanation to the client upfront
    sanitized = []
    for q in shuffled:
        sanitized.append({
            "id": q["id"],
            "question": q["question"],
            "options": q["options"]
        })

    return jsonify({
        "category": category,
        "questions": sanitized
    })

@app.route("/api/submit", methods=["POST"])
def submit_quiz():
    data = request.json or {}
    category = data.get("category", "Python")
    answers = data.get("answers", {})  # map of question_id -> chosen_index
    time_taken = float(data.get("time_seconds", 0))
    player_name = data.get("player_name", "Anonymous").strip() or "Anonymous"

    questions = QUESTIONS_BANK.get(category, [])
    q_map = {q["id"]: q for q in questions}

    score = 0
    review = []

    for q_id_str, user_ans in answers.items():
        q_id = int(q_id_str)
        if q_id in q_map:
            q = q_map[q_id]
            is_correct = (user_ans == q["answer"])
            if is_correct:
                score += 1
            review.append({
                "id": q["id"],
                "question": q["question"],
                "options": q["options"],
                "user_answer": user_ans,
                "correct_answer": q["answer"],
                "is_correct": is_correct,
                "explanation": q["explanation"]
            })

    total = len(review) if review else len(questions)
    accuracy = round((score / total * 100), 1) if total > 0 else 0

    # Save to SQLite Leaderboard
    conn = sqlite3.connect(DB_FILE)
    conn.execute("""
        INSERT INTO leaderboard (player_name, category, score, total_questions, time_seconds, accuracy_pct)
        VALUES (?, ?, ?, ?, ?, ?)
    """, (player_name, category, score, total, time_taken, accuracy))
    conn.commit()
    conn.close()

    return jsonify({
        "score": score,
        "total": total,
        "accuracy_pct": accuracy,
        "time_seconds": round(time_taken, 1),
        "review": review
    })

@app.route("/api/leaderboard", methods=["GET"])
def get_leaderboard():
    category = request.args.get("category", "").strip()
    conn = sqlite3.connect(DB_FILE)
    conn.row_factory = sqlite3.Row

    if category and category != "All":
        rows = conn.execute("""
            SELECT player_name, category, score, total_questions, time_seconds, accuracy_pct, played_at
            FROM leaderboard
            WHERE category = ?
            ORDER BY score DESC, time_seconds ASC
            LIMIT 10
        """, (category,)).fetchall()
    else:
        rows = conn.execute("""
            SELECT player_name, category, score, total_questions, time_seconds, accuracy_pct, played_at
            FROM leaderboard
            ORDER BY score DESC, time_seconds ASC
            LIMIT 15
        """, ()).fetchall()

    conn.close()
    return jsonify({"leaderboard": [dict(r) for r in rows]})

if __name__ == "__main__":
    app.run(debug=True, port=5004)
