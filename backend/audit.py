"""Append-only audit trail of agent-loop activity.

Every chat run and every tool call is appended to output/audit_trail.json with a
timestamp, the event type, the tool name, short args/results, and (for a completed run)
a stop reason. The file is **never wiped** between runs — new entries are appended to
the existing list — so it's a persistent record of what the agent did and why.
"""
from __future__ import annotations

import json
import threading
from datetime import datetime, timezone
from pathlib import Path
from typing import Any

HERE = Path(__file__).resolve().parent
AUDIT_PATH = HERE.parent / "output" / "audit_trail.json"

_lock = threading.Lock()


def _short(value: Any, limit: int = 200) -> Any:
    """Trim long strings so the trail stays readable (short args/results)."""
    if isinstance(value, str):
        return value if len(value) <= limit else value[:limit] + "…"
    if isinstance(value, dict):
        return {k: _short(v, limit) for k, v in value.items()}
    if isinstance(value, list):
        return [_short(v, limit) for v in value[:8]]
    return value


def append_audit(event_type: str, **fields: Any) -> None:
    """Append one entry to the audit trail (creating the file if needed)."""
    entry = {
        "timestamp": datetime.now(timezone.utc).isoformat(),
        "event_type": event_type,
        **{k: _short(v) for k, v in fields.items()},
    }
    with _lock:
        records: list = []
        if AUDIT_PATH.exists():
            try:
                records = json.loads(AUDIT_PATH.read_text(encoding="utf-8"))
                if not isinstance(records, list):
                    records = []
            except (json.JSONDecodeError, OSError):
                records = []
        records.append(entry)
        AUDIT_PATH.parent.mkdir(parents=True, exist_ok=True)
        AUDIT_PATH.write_text(json.dumps(records, indent=2), encoding="utf-8")
