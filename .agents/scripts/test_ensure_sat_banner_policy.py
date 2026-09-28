"""Regressões da política local de identidade documental."""
import json
import tempfile
import unittest
from pathlib import Path

from ensure_sat_banner.cli import CANONICAL_BANNER, main, normalize_banner


class BannerPolicyTest(unittest.TestCase):
    def test_default_still_requires_banner(self):
        self.assertIn(CANONICAL_BANNER, normalize_banner('# Produto\n'))

    def test_forbidden_preserves_document_and_fenced_examples(self):
        text = f'# TETO\n\n```md\n{CANONICAL_BANNER}\n```\n'
        self.assertEqual(text, normalize_banner(text, required=False))
        self.assertNotIn(CANONICAL_BANNER, normalize_banner(f'{CANONICAL_BANNER}\n\n# TETO\n', required=False))
        mixed_newlines = '# TETO\r\n\nTexto\r\n'
        self.assertEqual(mixed_newlines, normalize_banner(mixed_newlines, required=False))

    def test_local_policy_checks_and_removes_banner(self):
        with tempfile.TemporaryDirectory() as directory:
            root = Path(directory)
            (root / '.agents').mkdir()
            (root / '.agents/documentation-policy.json').write_text(json.dumps({'sat_banner': 'forbidden'}))
            readme = root / 'README.md'
            readme.write_text('# TETO\n', encoding='utf-8')
            self.assertEqual(0, main(['--repo-root', directory, '--check']))
            readme.write_text(f'{CANONICAL_BANNER}\n\n# TETO\n', encoding='utf-8')
            self.assertEqual(1, main(['--repo-root', directory, '--check']))
            self.assertEqual(0, main(['--repo-root', directory, '--write']))
            self.assertNotIn(CANONICAL_BANNER, readme.read_text())


if __name__ == '__main__':
    unittest.main()
