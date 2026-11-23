#!/usr/bin/env python3
"""Build data/writing/characters-hsk7-9.json.
Usage: python3 -I s4_chars.py SRC_DIR WORK_DIR DATA_DIR"""
import csv, json, re, sys, os, glob
import warnings; warnings.filterwarnings('ignore')
from pypinyin import pinyin, Style

src, work, data = sys.argv[1:4]
dic, strokes = {}, {}
for l in open(os.path.join(src, 'mmah', 'dictionary.txt'), encoding='utf-8'):
    j = json.loads(l); dic[j['character']] = j
for l in open(os.path.join(src, 'mmah', 'graphics.txt'), encoding='utf-8'):
    j = json.loads(l); strokes[j['character']] = len(j['strokes'])

# lower-level characters already used by A/B
lower = set()
for f in glob.glob(os.path.join(data, 'writing', 'characters-hsk*.json')):
    if '7-9' in f: continue
    try:
        for c in json.load(open(f, encoding='utf-8')).get('characters', []):
            lower.add(c.get('hanzi'))
    except Exception as e:
        print('skip', f, e)

# CVDICT single chars
cv = {}
pat = re.compile(r'^(\S+) (\S+) \[([^\]]*)\] /(.*)/\s*$')
for line in open(os.path.join(src, 'cvdict', 'CVDICT.u8'), encoding='utf-8'):
    m = pat.match(line)
    if m and len(m.group(2)) == 1 and m.group(3)[:1].islower():
        cv.setdefault(m.group(2), []).append((m.group(3), m.group(4).split('/')))

vocab = json.load(open(os.path.join(data, 'vocab', 'hsk7-9.json'), encoding='utf-8'))['words']
v1 = {}
for w in vocab:
    if len(w['hanzi']) == 1:
        v1.setdefault(w['hanzi'], w)
words_by_char = {}
for w in vocab:
    for ch in w['hanzi']:
        words_by_char.setdefault(ch, [])
        if len(words_by_char[ch]) < 4 and w['hanzi'] not in words_by_char[ch]:
            words_by_char[ch].append(w['hanzi'])

BAD = re.compile(r'^(họ |Họ |biến thể|xem |CL:|LT:|dạng cổ|phồn thể|tên |Tên |cũng |Phát âm|phát âm|\(Đài Loan\)|viết tắt)')
def cv_meaning(ch):
    out = []
    for py, defs in cv.get(ch, []):
        for s in defs:
            s = s.strip()
            if not s or BAD.search(s) or re.search(r'[㐀-鿿]\|', s) or 'Đài Loan' in s:
                continue
            s = re.sub(r'\[[^\]]*\]', '', s)
            s = re.sub(r'\((dạng kết hợp|hình thức kết hợp|hình vị hạn chế|văn học|cổ|thông tục)\)\s*', '', s).strip(' ;')
            if s and s not in out:
                out.append(s)
            if len(out) >= 3: break
        if len(out) >= 3: break
    return '; '.join(out)

ovr = {}
p = os.path.join(work, 'char_ovr.tsv')
if os.path.exists(p):
    for l in open(p, encoding='utf-8'):
        if l.strip():
            a, b = l.rstrip('\n').split('\t'); ovr[a] = b

chars, skipped, nostroke = [], [], []
for r in csv.DictReader(open(os.path.join(src, 'hsk30', 'hsk30-chars.csv'), encoding='utf-8')):
    if r['Level'] != '7-9':
        continue
    ch = r['Hanzi']
    if ch in lower:
        skipped.append(ch); continue
    d = dic.get(ch)
    if not d or ch not in strokes:
        nostroke.append(ch); continue
    if ch in v1:
        py = v1[ch]['pinyin']; mean = v1[ch]['meaning_vi']
    else:
        py = pinyin(ch, style=Style.TONE)[0][0]
        mean = cv_meaning(ch)
    mean = ovr.get(ch, mean)
    parts = [x.strip() for x in mean.split(';') if x.strip()]
    keep = []
    for x in parts:
        if keep and len('; '.join(keep + [x])) > 60: break
        keep.append(x)
    mean = '; '.join(keep)
    rad = d.get('radical') or ch
    item = {'hanzi': ch, 'pinyin': py, 'meaning_vi': mean, 'strokes': strokes[ch], 'radical': rad,
            'level': '7-9'}
    if r.get('WritingLevel') == '7-9':
        item['handwrite'] = True
    ex = [w for w in (r['Examples'] or '').split() if w != ch][:4]
    ws = words_by_char.get(ch) or ex
    if ws:
        item['words'] = ws[:4]
    chars.append(item)

import unicodedata
def plain(x):
    return ''.join(ch for ch in unicodedata.normalize('NFD', x.lower()) if not unicodedata.combining(ch))
chars.sort(key=lambda c: (plain(c['pinyin']), c['pinyin'], c['hanzi']))
doc = {'level': '7-9', 'source': 'Danh sách chữ HSK 7–9 theo GF0025-2021 (ivankra/hsk30); số nét/bộ thủ: makemeahanzi', 'target_count': 1148,
       'count': len(chars), 'complete': len(chars) >= 1148, 'characters': chars}
json.dump(doc, open(os.path.join(data, 'writing', 'characters-hsk7-9.json'), 'w', encoding='utf-8'), ensure_ascii=False, indent=2)
print('chars', len(chars), 'skipped(lower)', len(skipped), skipped[:20], 'nostroke', nostroke)
print('empty meaning', [c['hanzi'] for c in chars if not c['meaning_vi']])
print('handwrite', sum(1 for c in chars if c.get('handwrite')))
