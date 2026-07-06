from __future__ import annotations

import subprocess
import sys
import tempfile
import textwrap
import unittest
from pathlib import Path


VALIDATOR = Path(__file__).resolve().parents[1] / "validate_documentation_metadata.py"


class ValidateDocumentationMetadataCliTest(unittest.TestCase):
    def test_accepts_local_governance_policy_with_transitive_relative_links(self) -> None:
        with tempfile.TemporaryDirectory() as temp_dir:
            repo_root = Path(temp_dir)
            write(
                repo_root / ".agents/documentation.toml",
                """
                repo_acronym = "RAC"

                [docs_governance]
                allowed_nested_readmes = ["docs/business-rules/README.md"]
                filename_patterns = [
                  '^docs/business-rules/BUS-\\d{3}-[a-z0-9]+(?:-[a-z0-9]+)*\\.md$',
                  '^docs/product-requirements/PRD-\\d{3}-[a-z0-9]+\\.prd\\.assets/[a-z0-9-]+\\.md$',
                ]
                """,
            )
            write(repo_root / "OBSIDIAN.md", "# Indice\n\n- [Docs](docs/README.md)\n")
            write(
                repo_root / "docs/README.md",
                """
                ---
                doc_role: docs-index
                ---

                # Docs

                - [Regras](business-rules/README.md)
                - [Asset](product-requirements/PRD-005-release.prd.assets/checklist.md)
                """,
            )
            write(
                repo_root / "docs/business-rules/README.md",
                """
                ---
                doc_role: business-rules-index
                ---

                # Regras

                - [Regra](BUS-001-regra-local.md)
                """,
            )
            write(
                repo_root / "docs/business-rules/BUS-001-regra-local.md",
                """
                ---
                doc_role: business-rule
                ---

                # Regra Local
                """,
            )
            write(
                repo_root / "docs/product-requirements/PRD-005-release.prd.assets/checklist.md",
                """
                ---
                doc_role: validation-checklist
                ---

                # Checklist
                """,
            )

            result = run_validator(
                repo_root,
                "docs",
                "OBSIDIAN.md",
                "--enforce-docs-governance",
                "--skip-links",
            )

        self.assertEqual(result.returncode, 0, result.stderr)

    def test_reports_invalid_governance_toml(self) -> None:
        with tempfile.TemporaryDirectory() as temp_dir:
            repo_root = Path(temp_dir)
            write(repo_root / ".agents/documentation.toml", "repo_acronym = [")
            write(
                repo_root / "docs/README.md",
                """
                ---
                doc_role: docs-index
                ---

                # Docs
                """,
            )

            result = run_validator(
                repo_root,
                "docs",
                "--enforce-docs-governance",
                "--skip-index",
                "--skip-links",
            )

        self.assertEqual(result.returncode, 1)
        self.assertIn("invalid TOML", result.stderr)

    def test_reports_frontmatter_candidate_not_reachable_from_obsidian(self) -> None:
        with tempfile.TemporaryDirectory() as temp_dir:
            repo_root = Path(temp_dir)
            write(repo_root / "OBSIDIAN.md", "# Indice\n\n- [Docs](docs/README.md)\n")
            write(
                repo_root / "docs/README.md",
                """
                ---
                doc_role: docs-index
                ---

                # Docs
                """,
            )
            write(
                repo_root / "docs/business-rules/BUS-001-sem-indice.md",
                """
                ---
                doc_role: business-rule
                ---

                # Regra Sem Indice
                """,
            )

            result = run_validator(repo_root, "docs", "OBSIDIAN.md", "--skip-links")

        self.assertEqual(result.returncode, 1)
        self.assertIn(
            "OBSIDIAN.md: missing index connection to docs/business-rules/BUS-001-sem-indice.md",
            result.stderr,
        )


def run_validator(repo_root: Path, *args: str) -> subprocess.CompletedProcess[str]:
    return subprocess.run(
        [
            sys.executable,
            str(VALIDATOR),
            "--repo-root",
            str(repo_root),
            *args,
        ],
        capture_output=True,
        text=True,
        check=False,
    )


def write(path: Path, content: str) -> None:
    path.parent.mkdir(parents=True, exist_ok=True)
    path.write_text(textwrap.dedent(content).strip() + "\n", encoding="utf-8")


if __name__ == "__main__":
    unittest.main()
