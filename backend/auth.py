"""Account creation, login, and signed session tokens.

Passwords are stored as ``pbkdf2_sha256$<salt>$<hash>`` — the same format the
seeded ``users`` rows use (PBKDF2-HMAC-SHA256, 120,000 iterations, per-user salt).
Matching the seed means the provided test account validates with no data changes and
every new account we create uses the identical secure scheme.

Why this is safe against humans and AIs: we never store the plaintext password. We
store a one-way hash with a unique random salt per user, so identical passwords get
different hashes and precomputed/rainbow-table attacks don't work; the 120k-iteration
stretch makes brute-forcing each hash expensive. Verification is constant-time.
Sessions are stateless JWTs signed with a server secret.
"""
from __future__ import annotations

import hashlib
import hmac
import os
import secrets
import sqlite3
from datetime import datetime, timedelta, timezone

import jwt

from db import connect

# Matches the seed database's hashes so the provided test user logs in unchanged.
PBKDF2_ITERATIONS = 120_000
JWT_ALGORITHM = "HS256"
TOKEN_TTL = timedelta(days=7)

# A dev secret is fine for the assignment; override via env in any real deploy.
JWT_SECRET = os.getenv("JWT_SECRET", "campus-customs-dev-secret-change-me")


def hash_password(password: str) -> str:
    salt = secrets.token_hex(8)
    digest = hashlib.pbkdf2_hmac(
        "sha256", password.encode(), salt.encode(), PBKDF2_ITERATIONS
    ).hex()
    return f"pbkdf2_sha256${salt}${digest}"


def verify_password(password: str, stored: str) -> bool:
    try:
        algorithm, salt, digest = stored.split("$", 2)
    except ValueError:
        return False
    if algorithm != "pbkdf2_sha256":
        return False
    computed = hashlib.pbkdf2_hmac(
        "sha256", password.encode(), salt.encode(), PBKDF2_ITERATIONS
    ).hex()
    return hmac.compare_digest(computed, digest)


def create_user(first_name: str, last_name: str, email: str, password: str) -> dict:
    """Insert a new user. Raises ValueError if the email is already taken."""
    email = email.strip().lower()
    first_name = first_name.strip()
    last_name = last_name.strip()
    full_name = f"{first_name} {last_name}".strip()
    conn = connect()
    try:
        try:
            cur = conn.execute(
                "INSERT INTO users (name, email, password_hash, first_name, last_name) "
                "VALUES (?, ?, ?, ?, ?)",
                (full_name, email, hash_password(password), first_name, last_name),
            )
            conn.commit()
        except sqlite3.IntegrityError as exc:
            raise ValueError("An account with that email already exists.") from exc
        user_id = cur.lastrowid
        row = conn.execute(
            "SELECT id, name, email, first_name, last_name FROM users WHERE id = ?",
            (user_id,),
        ).fetchone()
    finally:
        conn.close()
    return _user_out(row)


def authenticate(email: str, password: str) -> dict | None:
    email = email.strip().lower()
    conn = connect()
    try:
        row = conn.execute(
            "SELECT id, name, email, first_name, last_name, password_hash "
            "FROM users WHERE lower(email) = ?",
            (email,),
        ).fetchone()
    finally:
        conn.close()
    if row is None or not verify_password(password, row["password_hash"]):
        return None
    return _user_out(row)


def _user_out(row: sqlite3.Row) -> dict:
    return {
        "id": row["id"],
        "name": row["name"],
        "email": row["email"],
        "first_name": row["first_name"] or "",
        "last_name": row["last_name"] or "",
    }


def create_token(user: dict) -> str:
    now = datetime.now(timezone.utc)
    payload = {
        "sub": str(user["id"]),
        "name": user["name"],
        "email": user["email"],
        "iat": now,
        "exp": now + TOKEN_TTL,
    }
    return jwt.encode(payload, JWT_SECRET, algorithm=JWT_ALGORITHM)


def decode_token(token: str) -> dict | None:
    try:
        payload = jwt.decode(token, JWT_SECRET, algorithms=[JWT_ALGORITHM])
    except jwt.PyJWTError:
        return None
    return {
        "id": int(payload["sub"]),
        "name": payload.get("name", ""),
        "email": payload.get("email", ""),
    }
