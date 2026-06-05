import sys
import re
import shutil
from pathlib import Path

import pytest

PROJECT_ROOT = Path(__file__).resolve().parents[1]
if str(PROJECT_ROOT) not in sys.path:
    sys.path.insert(0, str(PROJECT_ROOT))


@pytest.fixture
def tmp_path(request):
    """
    Fixture local para evitar uso do Temp global em ambientes restritos.
    """
    safe_name = re.sub(r"[^a-zA-Z0-9_-]", "_", request.node.name)
    path = PROJECT_ROOT / ".test-tmp" / safe_name
    if path.exists():
        shutil.rmtree(path)
    path.mkdir(parents=True, exist_ok=True)

    yield path

    shutil.rmtree(path, ignore_errors=True)
