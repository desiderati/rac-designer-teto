"""Render the shared Visualize fragment for closeout and improvement."""

import argparse
import json
import sys
from html import escape
from pathlib import Path

FIELDS = {
    "closeout": (
        "Prioridade",
        "Situação",
        "Justificativa",
        "Próxima ação necessária",
    ),
    "improvement": (
        "Evidências e datas",
        "Frequência e confiança",
        "Forma recomendada",
        "Justificativa",
    ),
}

TITLES = {
    "closeout": "Itens possivelmente em aberto",
    "improvement": "Melhorias recomendadas",
}

STYLE = """
#shortcut-panorama {
  container-type: inline-size;
  --gap: var(--font-size-base);
  --detail-gap: calc(var(--gap) * .25);
  --heading-gap: calc(var(--gap) * .5);
  --field-gap: calc(var(--gap) * .75);
  --inline-gap: calc(var(--gap) * .5);
  margin-block-start: var(--gap);
  overflow-wrap: anywhere;
}
#shortcut-panorama :is(h2, dl, dd, hr) { margin: 0; }
#shortcut-panorama article { display: grid; }
#shortcut-panorama article + article { margin-block-start: var(--gap); }
#shortcut-panorama .item-title {
  display: flex;
  align-items: flex-start;
  gap: var(--inline-gap);
  margin-block-end: var(--heading-gap);
}
#shortcut-panorama h2 { min-inline-size: 0; }
#shortcut-panorama .item-number {
  display: grid;
  place-items: center;
  inline-size: calc(var(--gap) * 1.5);
  block-size: calc(var(--gap) * 1.5);
  flex: none;
  border-radius: 50%;
  background: var(--accent);
  color: var(--foreground);
}
#shortcut-panorama dl {
  display: grid;
  grid-template-columns: minmax(0, 1fr);
  gap: var(--field-gap) var(--inline-gap);
}
#shortcut-panorama dl > div { display: grid; align-content: start; gap: var(--detail-gap); }
#shortcut-panorama dt { font-weight: 500; }
#shortcut-panorama dd {
  border-inline-start: 1px dashed var(--border);
  padding-inline-start: var(--inline-gap);
}
#shortcut-panorama hr {
  margin-block-start: var(--gap);
  border: 0;
  border-block-start: 1px solid var(--green);
}
@container (min-width: 38rem) {
  #shortcut-panorama[data-kind="closeout"] dl {
    grid-template-columns: repeat(2, minmax(0, 1fr));
  }
  #shortcut-panorama[data-kind="closeout"] :is(.field-1, .field-4) { grid-column: 1 / -1; }
}
"""


def render(kind, items):
    labels = FIELDS[kind]
    if not isinstance(items, list) or not items:
        raise ValueError("Informe uma lista não vazia de itens.")

    articles = []
    for number, item in enumerate(items, 1):
        if not isinstance(item, dict) or set(item) != {"title", *labels}:
            raise ValueError(f"Campos inválidos no item {number}.")

        for label, value in item.items():
            if kind == "closeout" and label == labels[-1] and value is None:
                continue

            if not isinstance(value, str) or not value.strip():
                raise ValueError(f"Texto obrigatório no item {number}: {label}.")

        action = item[labels[-1]]
        if (
            kind == "closeout"
            and isinstance(action, str)
            and action.strip().casefold().startswith("nenhuma")
        ):
            raise ValueError("Use null para indicar ausência de próxima ação.")

        fields = [
            f'<div class="field-{index}"><dt>{label}</dt>'
            f"<dd>{escape(item[label] if item[label] is not None else 'Nenhuma.')}</dd></div>"
            for index, label in enumerate(labels, 1)
        ]

        articles.append(
            f'<article><div class="item-title"><span class="item-number" aria-hidden="true">'
            f"{number:02d}</span><h2>{escape(item['title'])}</h2></div>"
            "<dl>" + "\n".join(fields) + "</dl><hr></article>"
        )

    return (
        f'<section id="shortcut-panorama" data-kind="{kind}" aria-label="{TITLES[kind]}">\n'
        f"<style>{STYLE}</style>\n" + "\n".join(articles) + "\n</section>\n"
    )


def main():
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("kind", choices=FIELDS)
    parser.add_argument("output", type=Path)
    args = parser.parse_args()
    try:
        output = args.output
        if (
            output.suffix != ".html"
            or output.parent.resolve(strict=True) != output.parent
        ):
            raise ValueError(
                "Informe um destino HTML absoluto com diretório físico existente."
            )

        fragment = render(args.kind, json.load(sys.stdin.buffer))
        with output.open("x", encoding="utf-8") as file:
            file.write(fragment)
    except (ValueError, OSError) as error:
        parser.exit(1, f"{error}\n")


if __name__ == "__main__":
    main()
