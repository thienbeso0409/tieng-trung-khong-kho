import csv, re, sys, json, os
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
from pyh import jieba, Z
LV = {}
rows = list(csv.DictReader(open('/tmp/dl/hsk30.csv', encoding='utf-8')))
def lvnum(s):
    return 7 if s == '7-9' else int(s)
for x in rows:
    forms = set()
    for v in x['Simplified'].split('|'):
        v = v.lstrip('…')
        m = re.match(r'^(.+?)（(.+)）$', v)
        if m:
            forms.add(m.group(1)); forms.add(m.group(2))
            forms.add(v.replace('（', '').replace('）', ''))
            forms.add(re.sub(r'（.*?）', '', v))
        else:
            forms.add(v)
    for f in forms:
        if f:
            LV[f] = min(LV.get(f, 99), lvnum(x['Level']))
for _n, _rows in json.load(open('/tmp/ttkk_build/syl2025.json', encoding='utf-8')).items():
    for _r in _rows:
        LV[_r[0]] = min(LV.get(_r[0], 99), int(_n))
# common names / proper nouns allowed
NAMES = set('王明 李明 小王 小李 小张 小明 小月 大卫 安娜 玛丽 王 李 张 陈 刘 上海 越南 河内 美国 日本 英国 法国 小红 小美 小刚 老王 老李 老张 丽丽 东东 明明 方方 天天 京京 小雨 小林 林 杨 赵'.split())
# grammatical combos
def maxmatch(tok, lim):
    out = []
    i = 0
    while i < len(tok):
        for L in range(min(6, len(tok) - i), 0, -1):
            w = tok[i:i + L]
            if L == 1 or (w in LV and LV[w] <= lim) or w in NAMES:
                out.append(w)
                i += L
                break
    return out
NUM = set('零一二三四五六七八九十百千万两几')
def check(text, lim):
    text = Z(text)
    bad = []
    for tok in jieba.cut(text, HMM=False):
        if not re.search(r'[一-鿿]', tok):
            continue
        if tok in NAMES or (tok in LV and LV[tok] <= lim):
            continue
        if all(c in NUM for c in tok):
            continue
        for w in maxmatch(tok, lim):
            if w in NAMES or (w in LV and LV[w] <= lim) or all(c in NUM for c in w):
                continue
            if w in '儿们子的了着过吗呢吧啊地得个':
                continue
            bad.append(f'{w}({LV.get(w, "?")})')
    return bad
if __name__ == '__main__':
    lim = int(sys.argv[1])
    for t in sys.argv[2:]:
        print(t, check(t, lim))
