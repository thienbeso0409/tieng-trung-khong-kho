import sys, csv, json, re
sys.path.insert(0, '/home/claude/pylib-b')
import logging, jieba
jieba.setLogLevel(logging.ERROR)
rows = list(csv.DictReader(open('/home/claude/srcdata-b/hsk30/hsk30.csv', encoding='utf-8')))
order = ['1','2','3','4','5','6','7-9']
def words_upto(lv):
    s = set()
    for r in rows:
        if order.index(r['Level']) <= order.index(lv):
            for h in r['Simplified'].split('|'):
                h = re.sub(r'[\d（）()…]', '', h); s.add(h)
    return s
def texts(o):
    if isinstance(o, dict):
        for k, v in o.items():
            if k in ('zh', 'text') and isinstance(v, str): yield v
            elif k == 'sample_answers': continue
            else: yield from texts(v)
    elif isinstance(o, list):
        for v in o: yield from texts(v)
    elif False: yield
for lv in ('4','5','6'):
    W = words_upto(lv); chars = set(''.join(W))
    d = json.load(open(f'/home/claude/tieng-trung-khong-kho/data/exams/hsk{lv}-de1.json', encoding='utf-8'))
    tot = 0; oov = {}
    for t in texts(d):
        for tok in jieba.cut(t):
            if not re.fullmatch(r'[一-鿿]+', tok): continue
            tot += 1
            if tok in W: continue
            # accept if compositional of known words (split into known pieces)
            ok = all(c in chars for c in tok) and (len(tok) <= 2 or any(tok[:i] in W and tok[i:] in W for i in range(1, len(tok))))
            if not ok: oov[tok] = oov.get(tok, 0) + 1
    n = sum(oov.values())
    print(lv, 'tokens', tot, 'oov', n, f'{100*n/tot:.1f}%', ' '.join(sorted(oov, key=lambda k: -oov[k])[:60]))
