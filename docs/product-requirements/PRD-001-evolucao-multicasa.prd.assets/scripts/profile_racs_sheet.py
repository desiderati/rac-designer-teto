import csv
from collections import Counter
from pathlib import Path

path = Path('/home/ubuntu/rac-designer-teto/analysis/racs_sheet_values.tsv')
rows = []
with path.open() as f:
    reader = csv.reader(f, delimiter='\t')
    rows = list(reader)

headers = rows[0]
data = rows[1:]

print('row_count', len(data))
print('column_count', len(headers))
print()

interesting = [
    'familia', 'comunidade', 'cc', 'lideres', 'casa', 'tipo', 'desnivel',
    'solo-outro', 'piloti-mestre', 'altura-mestre',
    'monitor-1', 'monitor-2', 'monitor-3', 'monitor-4', 'monitor-5', 'monitor-6'
]

for name in interesting:
    idx = headers.index(name)
    values = [row[idx] if idx < len(row) else '' for row in data]
    counts = Counter(v for v in values if v)
    print(f'## {name}')
    print('distinct', len(counts))
    for value, count in counts.most_common(10):
        print(f'  {count:>2}  {value}')
    print()

piloti_headers = [h for h in headers if h.startswith('piloti-') and h not in ('piloti-mestre',)]
total_headers = [h for h in headers if h.startswith('total-piloti-')]

print('## piloti headers')
print(', '.join(piloti_headers))
print()
print('## total headers')
print(', '.join(total_headers))
print()

print('## example records')
for row in data[:5]:
    record = {h: row[i] if i < len(row) else '' for i, h in enumerate(headers)}
    summary = {
        'familia': record['familia'],
        'comunidade': record['comunidade'],
        'tipo': record['tipo'],
        'desnivel': record['desnivel'],
        'piloti_mestre': record['piloti-mestre'],
        'altura_mestre': record['altura-mestre'],
        'solo_outro': record['solo-outro'],
    }
    print(summary)
