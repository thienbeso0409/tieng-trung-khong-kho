#!/usr/bin/env python3
"""Step 1: extract HSK 7-9 words from hsk30, match CVDICT, write draft TSV/JSON.
Usage: python3 -I s1_extract.py SRC_DIR OUT_JSON"""
import csv, json, re, sys, os

src, out = sys.argv[1], sys.argv[2]
rows = []
with open(os.path.join(src, 'hsk30', 'hsk30.csv'), encoding='utf-8') as f:
    for r in csv.DictReader(f):
        if r['Level'] == '7-9':
            rows.append(r)
print('L7 rows', len(rows))

# CVDICT index
cv = {}
pat = re.compile(r'^(\S+) (\S+) \[([^\]]*)\] /(.*)/\s*$')
with open(os.path.join(src, 'cvdict', 'CVDICT.u8'), encoding='utf-8') as f:
    for line in f:
        if line.startswith('#'):
            continue
        m = pat.match(line)
        if not m:
            continue
        trad, simp, py, defs = m.groups()
        cv.setdefault(simp, []).append({'trad': trad, 'py': py, 'defs': defs.split('/')})

def cedict_keys(s):
    # 'trad|simp[py]' possibly multiple separated by ';'? check
    res = []
    for m in re.finditer(r'([^|\s\[\]]+)\|([^|\s\[\]]+)\[([^\]]+)\]', s or ''):
        res.append((m.group(1), m.group(2), m.group(3)))
    return res

data = []
for r in rows:
    simp = r['Simplified']
    variants = []
    if r['Variants']:
        try:
            variants = json.loads(r['Variants'])
        except Exception:
            variants = []
    main = variants[0] if variants else {'Simplified': simp, 'Pinyin': r['Pinyin'], 'POS': r['POS'], 'Traditional': r['Traditional'].split('|')[0], 'CEDICT': r['CEDICT']}
    keys = cedict_keys(main.get('CEDICT') or r['CEDICT'])
    defs = []
    for trad, s, py in keys:
        for e in cv.get(s, []):
            if e['py'].lower() == py.lower() and (e['py'] == py or not defs):
                defs.append({'py': e['py'], 'defs': e['defs']})
    if not defs:
        for e in cv.get(main['Simplified'], []):
            defs.append({'py': e['py'], 'defs': e['defs']})
    data.append({
        'src_id': r['ID'], 'hanzi': main['Simplified'], 'raw': simp,
        'variants': [v['Simplified'] for v in variants[1:]] if variants else [],
        'trad': main.get('Traditional') or r['Traditional'].split('|')[0],
        'pinyin': main.get('Pinyin') or r['Pinyin'], 'webpinyin': r['WebPinyin'],
        'pos_src': main.get('POS') if variants else r['POS'],
        'cvdict': defs,
    })
json.dump(data, open(out, 'w', encoding='utf-8'), ensure_ascii=False, indent=1)
print('no cvdict:', sum(1 for d in data if not d['cvdict']))
print('variants:', sum(1 for d in data if d['raw'] != d['hanzi']))
