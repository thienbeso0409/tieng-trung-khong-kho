import csv, json, re, sys
cv = {}
for l in open('/tmp/dl/cv/cv.u8', encoding='utf-8'):
    if l.startswith('#'): continue
    m = re.match(r'(\S+) (\S+) \[([^\]]+)\] /(.*)/\s*$', l)
    if not m: continue
    t, s, p, d = m.groups()
    cv.setdefault((s, p.lower()), []).append(d)
    cv.setdefault((s, None), []).append(d)
def clean(defs):
    senses = []
    for d in defs:
        for x in d.split('/'):
            x = x.strip()
            if not x: continue
            if re.match(r'^(họ |\(họ\)|tên |biến thể|cũng viết|xem |dạng cổ|viết tắt của|CL:|\(Đài Loan\)|\(văn\)|\(cổ\))', x, re.I): continue
            if 'Kangxi' in x or 'bộ thủ' in x: continue
            senses.append(x)
    return senses
r = [x for x in csv.DictReader(open('/tmp/dl/hsk30.csv', encoding='utf-8')) if x['Level'] in '123']
out = []
for x in r:
    m = re.match(r'(\S+)\|(\S+)\[([^\]]+)\]', x['CEDICT'] or '')
    defs = []
    if m:
        defs = cv.get((m.group(2), m.group(3).lower()), [])
    simp = re.split(r'[|（]', x['Simplified'])[0]
    if not defs:
        defs = cv.get((simp, None), [])
    out.append({'id': x['ID'], 'lv': x['Level'], 'h': x['Simplified'], 'p': x['Pinyin'], 'pos': x['POS'], 'defs': clean(defs)})
json.dump(out, open('draft.json', 'w'), ensure_ascii=False, indent=0)
lv = sys.argv[1] if len(sys.argv) > 1 else '1'
for o in out:
    if o['lv'] == lv:
        print(o['id'][3:], o['h'], o['p'], o['pos'], '||', ' / '.join(o['defs'][:4])[:150])
