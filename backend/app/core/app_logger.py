import logging
from logging.handlers import RotatingFileHandler
from pathlib import Path


BASE_DIR = Path(__file__).resolve().parents[2]
LOG_DIR = BASE_DIR / "logs"

APP_LOG_FILE = LOG_DIR / "labiq.log"
SECURITY_LOG_FILE = LOG_DIR / "security.log"
AUDIT_LOG_FILE = LOG_DIR / "audit.log"
AUTH_LOG_FILE = LOG_DIR / "auth.log"


def setup_logging():
    LOG_DIR.mkdir(parents=True, exist_ok=True)

    formatter = logging.Formatter(
        fmt="%(asctime)s | %(levelname)s | %(name)s | %(message)s",
        datefmt="%Y-%m-%d %H:%M:%S",
    )

    loggers_config = {
        "labiq": APP_LOG_FILE,
        "labiq.security": SECURITY_LOG_FILE,
        "labiq.audit": AUDIT_LOG_FILE,
        "labiq.auth": AUTH_LOG_FILE,
    }

    for logger_name, log_file in loggers_config.items():
        logger = logging.getLogger(logger_name)
        logger.setLevel(logging.INFO)
        logger.propagate = False

        if logger.handlers:
            continue

        file_handler = RotatingFileHandler(
            filename=log_file,
            maxBytes=5 * 1024 * 1024,
            backupCount=5,
            encoding="utf-8",
        )
        file_handler.setFormatter(formatter)

        console_handler = logging.StreamHandler()
        console_handler.setFormatter(formatter)

        logger.addHandler(file_handler)
        logger.addHandler(console_handler)


def get_app_logger():
    return logging.getLogger("labiq")


def get_security_logger():
    return logging.getLogger("labiq.security")


def get_audit_logger():
    return logging.getLogger("labiq.audit")


def get_auth_logger():
    return logging.getLogger("labiq.auth")


def clear_log_files():
    LOG_DIR.mkdir(parents=True, exist_ok=True)

    cleared_files = []

    for log_file in [
        APP_LOG_FILE,
        SECURITY_LOG_FILE,
        AUDIT_LOG_FILE,
        AUTH_LOG_FILE,
    ]:
        log_file.parent.mkdir(parents=True, exist_ok=True)

        with open(log_file, "w", encoding="utf-8") as file:
            file.write("")

        cleared_files.append(str(log_file))

    return cleared_files