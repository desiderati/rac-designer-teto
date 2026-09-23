#!/usr/bin/env python3
"""Compatibility wrapper for the documentation structure repairer."""

from __future__ import annotations

import importlib.util
from pathlib import Path
import sys

# The installed pack keeps its public filenames and direct package layout.
if Path(__file__).name == "documentation_repair_structure.py":
    # Bind the catalog owner by file: an external regular package can shadow a
    # namespace package. A missing local owner must fail, never fall back to it.
    package_dir = (
        Path(__file__).resolve().parent
        / "documentation"
        / "repair_documentation_structure"
    )

    package_name = "repair_documentation_structure"
    spec = importlib.util.spec_from_file_location(
        package_name,
        package_dir / "__init__.py",
        submodule_search_locations=[str(package_dir)],
    )

    if spec is None or spec.loader is None:
        raise RuntimeError(f"Cannot load local documentation owner: {package_dir}")

    module = importlib.util.module_from_spec(spec)
    sys.modules[package_name] = module
    spec.loader.exec_module(module)
    main = module.main
else:
    from repair_documentation_structure.cli import main


if __name__ == "__main__":
    raise SystemExit(main())
