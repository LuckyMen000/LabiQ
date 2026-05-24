import re
from typing import List, Optional


MAX_SCAN_LENGTH = 1_000_000


SQL_INJECTION_PATTERNS = [
    {
        "name": "UNION SELECT injection",
        "regex": re.compile(
            r"(?i)\bunion\b\s+(all\s+)?select\b"
        ),
    },
    {
        "name": "Classic OR 1=1 injection",
        "regex": re.compile(
            r"(?i)(\'|\"|\)|\s)\s*(or|and)\s+1\s*=\s*1"
        ),
    },
    {
        "name": "Boolean based SQL injection",
        "regex": re.compile(
            r"(?i)(\'|\"|\))\s*(or|and)\s*(\'|\")?\w+(\'|\")?\s*=\s*(\'|\")?\w+"
        ),
    },
    {
        "name": "SQL comment after condition",
        "regex": re.compile(
            r"(?i)(or|and)\s+[\w'\"]+\s*=\s*[\w'\"]+\s*(--|#|/\*)"
        ),
    },
    {
        "name": "Stacked SQL queries",
        "regex": re.compile(
            r"(?i);\s*(select|insert|update|delete|drop|alter|create|truncate)\b"
        ),
    },
    {
        "name": "DROP TABLE injection",
        "regex": re.compile(
            r"(?i)\bdrop\s+table\b"
        ),
    },
    {
        "name": "Database delay injection",
        "regex": re.compile(
            r"(?i)\b(sleep\s*\(|benchmark\s*\(|pg_sleep\s*\(|waitfor\s+delay)\b"
        ),
    },
    {
        "name": "Information schema probing",
        "regex": re.compile(
            r"(?i)\b(information_schema|pg_catalog|sqlite_master|sysobjects)\b"
        ),
    },
    {
        "name": "SQL data extraction attempt",
        "regex": re.compile(
            r"(?i)\bselect\b.{0,80}\bfrom\b"
        ),
    },
    {
        "name": "SQL modification attempt",
        "regex": re.compile(
            r"(?i)\b(insert\s+into|update\s+\w+\s+set|delete\s+from|truncate\s+table)\b"
        ),
    },
]


def normalize_text(value: str) -> str:
    return value[:MAX_SCAN_LENGTH]


def detect_sql_injection_payload(text: Optional[str]) -> List[str]:
    if not text:
        return []

    normalized_text = normalize_text(text)

    detected_patterns: List[str] = []

    for pattern in SQL_INJECTION_PATTERNS:
        if pattern["regex"].search(normalized_text):
            detected_patterns.append(pattern["name"])

    return detected_patterns