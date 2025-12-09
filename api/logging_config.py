import logging
import os
from logging.handlers import RotatingFileHandler

def setup_logging(debug: bool = False):

    # Create logs directory if not exists
    log_dir = "logs"
    os.makedirs(log_dir, exist_ok=True)

    # Formatter
    formatter = logging.Formatter(
        "%(asctime)s - %(name)s - %(levelname)s - %(message)s"
    )

    # 1. Console handler (always enabled)
    console_handler = logging.StreamHandler()
    console_handler.setFormatter(formatter)

    # Root logger
    root = logging.getLogger()
    root.setLevel(logging.INFO)
    root.addHandler(console_handler)

    # 2. Optional file logging (only if debug=True)
    if debug:
        file_path = os.path.join(log_dir, "pipeline.log")

        file_handler = RotatingFileHandler(
            file_path, maxBytes=2_000_000, backupCount=5
        )
        file_handler.setFormatter(formatter)
        root.addHandler(file_handler)

    # Prevent duplicate logs
    root.propagate = False

    logging.info("Logging initialized. Debug file logging = %s", debug)
