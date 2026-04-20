import json
from pathlib import Path

src = Path('/home/ubuntu/rac-designer-teto/analysis/racs_sheet_grid.json')
out = Path('/home/ubuntu/rac-designer-teto/analysis/racs_sheet_values.tsv')

with src.open() as f:
    data = json.load(f)

sheet = data['sheets'][0]
rows = sheet['data'][0]['rowData']
max_cols = 50
matrix = []
for row in rows:
    values = []
    for cell in row.get('values', []):
        if 'formattedValue' in cell:
            values.append(str(cell['formattedValue']))
        elif 'userEnteredValue' in cell:
            u = cell['userEnteredValue']
            values.append(str(next(iter(u.values()))))
        else:
            values.append('')
    if len(values) < max_cols:
        values.extend([''] * (max_cols - len(values)))
    matrix.append(values[:max_cols])

with out.open('w') as f:
    for row in matrix:
        f.write('\t'.join(row).rstrip('\t') + '\n')

print(out)
print('rows', len(matrix))
print('cols', max(len(r) for r in matrix) if matrix else 0)
for i, row in enumerate(matrix[:15], start=1):
    print(f'{i:02d}: ' + ' | '.join(row[:25]))
