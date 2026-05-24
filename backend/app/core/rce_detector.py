import re
from typing import List, Optional


MAX_SCAN_LENGTH = 1_000_000


RCE_PATTERNS = [
    {
        "name": "Shell command chaining",
        "regex": re.compile(
            r"(?i)(;|\|\||&&|\|)\s*(cat|ls|pwd|whoami|id|uname|curl|wget|nc|netcat|bash|sh|cmd|powershell|python|perl|ruby)\b"
        ),
    },
    {
        "name": "Command substitution",
        "regex": re.compile(
            r"(?i)(`[^`]+`|\$\([^)]+\))"
        ),
    },
    {
        "name": "Shell interpreter execution",
        "regex": re.compile(
            r"(?i)\b(/bin/sh|/bin/bash|bash\s+-c|sh\s+-c|cmd\.exe|powershell\s+-command|powershell\.exe)\b"
        ),
    },
    {
        "name": "Dangerous download execution",
        "regex": re.compile(
            r"(?i)\b(curl|wget)\b.{0,80}\b(bash|sh|python|perl|ruby)\b"
        ),
    },
    {
        "name": "Python code execution",
        "regex": re.compile(
            r"(?i)\b(__import__|eval\s*\(|exec\s*\(|compile\s*\(|os\.system|subprocess\.|popen\s*\()\b"
        ),
    },
    {
        "name": "Java runtime execution",
        "regex": re.compile(
            r"(?i)\b(Runtime\.getRuntime\s*\(\)\.exec|ProcessBuilder\s*\()\b"
        ),
    },
    {
        "name": "PHP code execution",
        "regex": re.compile(
            r"(?i)\b(system\s*\(|shell_exec\s*\(|passthru\s*\(|proc_open\s*\(|popen\s*\(|eval\s*\()\b"
        ),
    },
    {
        "name": "Node.js process execution",
        "regex": re.compile(
            r"(?i)\b(child_process|execSync\s*\(|spawnSync\s*\(|require\s*\(\s*['\"]child_process['\"]\s*\))\b"
        ),
    },
    {
        "name": "Suspicious reverse shell tools",
        "regex": re.compile(
            r"(?i)\b(nc\s+-e|netcat\s+-e|mkfifo|/dev/tcp/|socat)\b"
        ),
    },
]


def normalize_text(value: str) -> str:
    return value[:MAX_SCAN_LENGTH]


def detect_rce_payload(text: Optional[str]) -> List[str]:
    if not text:
        return []

    normalized_text = normalize_text(text)

    detected_patterns: List[str] = []

    for pattern in RCE_PATTERNS:
        if pattern["regex"].search(normalized_text):
            detected_patterns.append(pattern["name"])

    return detected_patterns