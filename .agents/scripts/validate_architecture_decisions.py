#!/usr/bin/env python3
"""Public wrapper for the architecture decisions validator."""

from __future__ import annotations

import importlib.util
import sys
from pathlib import Path
from typing import Callable


def _load_main() -> Callable[[], int]:
    package_dir = Path(__file__).resolve().with_suffix("")
    package_name = f"_documentation_{package_dir.name}"
    spec = importlib.util.spec_from_file_location(
        package_name,
        package_dir / "__init__.py",
        submodule_search_locations=[str(package_dir)],
    )
    if spec is None or spec.loader is None:
        raise RuntimeError(f"cannot load validator package: {package_dir}")
    module = importlib.util.module_from_spec(spec)
    sys.modules[package_name] = module
    spec.loader.exec_module(module)
    return module.main


main = _load_main()


if __name__ == "__main__":
    sys.exit(main())
