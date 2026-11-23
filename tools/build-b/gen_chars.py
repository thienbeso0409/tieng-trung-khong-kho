import sys, csv, json, re
sys.path.insert(0, '/home/claude/scripts-b')
from radicals import R
D = '/home/claude/tieng-trung-khong-kho/data'
mm = {}
for line in open('/home/claude/srcdata-b/mmah/dictionary.txt', encoding='utf-8'):
    d = json.loads(line); mm[d['character']] = d
strokes = {}
for line in open('/home/claude/srcdata-b/mmah/graphics.txt', encoding='utf-8'):
    d = json.loads(line); strokes[d['character']] = len(d['strokes'])
chars = {x['Hanzi']: x for x in csv.DictReader(open('/home/claude/srcdata-b/hsk30/hsk30-chars.csv', encoding='utf-8'))}
A = set()
for l in (1, 2, 3):
    A |= {c['hanzi'] for c in json.load(open(f'{D}/writing/characters-hsk{l}.json', encoding='utf-8'))['characters']}
vocab = {}
for l in (4, 5, 6):
    vocab[l] = [w['hanzi'] for w in json.load(open(f'{D}/vocab/hsk{l}.json', encoding='utf-8'))['words']]
seen = set(A)
for lv in (4, 5, 6):
    out = []
    for line in open(f'/home/claude/scripts-b/content/c{lv}.txt', encoding='utf-8'):
        parts = line.rstrip('\n').split('=')
        h, hv, mean = parts[0], parts[1], parts[2]
        py = parts[3] if len(parts) > 3 else mm[h]['pinyin'][0]
        assert chars[h]['Level'] == str(lv), h
        assert h not in seen, h
        seen.add(h)
        rad = mm[h]['radical']
        c = {'hanzi': h, 'pinyin': py, 'meaning_vi': mean, 'han_viet': hv, 'strokes': strokes[h], 'radical': rad}
        if rad in R: c['radical_meaning_vi'] = R[rad]
        c['level'] = lv
        ws = [w for l2 in range(lv, 7) for w in vocab[l2] if h in w and len(w) > 1][:4]
        if ws: c['words'] = ws
        if chars[h]['WritingLevel']: c['handwrite'] = True
        out.append(c)
    import unicodedata; out.sort(key=lambda c: unicodedata.normalize('NFD', c['pinyin'].lower()).encode('ascii','ignore'))
    tgt = {4: 441, 5: 431, 6: 413}[lv]
    doc = {'level': lv, 'source': 'GF0025-2021 (ivankra/hsk30-chars); nét & bộ thủ: makemeahanzi', 'target_count': tgt,
           'count': len(out), 'complete': len(out) >= tgt, 'characters': out}
    json.dump(doc, open(f'{D}/writing/characters-hsk{lv}.json', 'w', encoding='utf-8'), ensure_ascii=False, indent=2)
    print(lv, len(out), sum(1 for c in out if 'handwrite' in c), sum(1 for c in out if 'radical_meaning_vi' not in c))
