#!/usr/bin/env python3
"""Build data/vocab/hsk7-9.json from draft.tsv + overrides + examples.
Usage: python3 -I s3_build_vocab.py WORK_DIR DRAFT_JSON OUT_JSON [--rank RANK_TXT]
Examples file: WORK_DIR/examples*.tsv  lines: hanzi<TAB>zh<TAB>vi  (or src_no<TAB>zh<TAB>vi)
"""
import json, re, sys, glob, os, unicodedata
import warnings
warnings.filterwarnings('ignore')
import jieba
jieba.setLogLevel(60)
from pypinyin import pinyin, Style, load_phrases_dict

work, draft_json, out = sys.argv[1], sys.argv[2], sys.argv[3]
draft = json.load(open(draft_json, encoding='utf-8'))
rows = [l.rstrip('\n').split('\t') for l in open(os.path.join(work, 'draft.tsv'), encoding='utf-8')]
assert len(rows) == len(draft) == 5636
ovr = {}
for f in sorted(glob.glob(os.path.join(work, 'ovr*.tsv'))):
    for l in open(f, encoding='utf-8'):
        if l.strip():
            a, b = l.rstrip('\n').split('\t')
            ovr[a] = b

def cleanup(m):
    m = re.sub(r'\((nghĩa đen (và|hoặc) (nghĩa )?bóng)\)\s*', '', m)
    m = re.sub(r'nghĩa bóng:\s*', '(nghĩa bóng) ', m)
    m = re.sub(r'\s+;', ';', m)
    m = re.sub(r'\(\s*\)', '', m)
    m = re.sub(r'\s+', ' ', m).strip(' ;,')
    parts = [p.strip() for p in m.split(';') if p.strip()]
    # keep at most 4 senses and ~90 chars
    keep = []
    for p in parts:
        if keep and len('; '.join(keep + [p])) > 90:
            break
        keep.append(p)
        if len(keep) >= 4:
            break
    return '; '.join(keep)

# examples
examples = {}
for f in sorted(glob.glob(os.path.join(work, 'examples*.tsv'))):
    for l in open(f, encoding='utf-8'):
        l = l.rstrip('\n')
        if not l.strip() or l.startswith('#'):
            continue
        p = l.split('\t')
        if len(p) != 3:
            print('BAD EX LINE', f, l[:60]); continue
        examples[p[0].strip()] = (p[1].strip(), p[2].strip())

# register word pinyin from hsk30 so pypinyin uses them
phr = {}
from pypinyin.contrib.tone_convert import to_tone
for d in draft:
    h = d['hanzi']
    if len(h) < 2:
        continue
    m = re.search(r'\[([^\]]+)\]', [x for x in [''] ][0]) if False else None
    src = d['cvdict'][0]['py'] if d['cvdict'] else ''
    sy = src.lower().replace('u:', 'v').split()
    if len(sy) == len(h) and all(re.match(r'^[a-zv]+[1-5]$', x) for x in sy):
        phr[h] = [[to_tone(x.replace('5', '')) if x.endswith('5') else to_tone(x)] for x in sy]
load_phrases_dict(phr)
for h in phr:
    jieba.add_word(h, freq=100000)

PUNCT = {'，': ',', '。': '.', '？': '?', '！': '!', '：': ':', '；': ';', '、': ',', '“': '"', '”': '"', '…': '...', '——': '—', '（': '(', '）': ')', '《': '«', '》': '»'}

def syl_join(w):
    sy = [x[0] for x in pinyin(w, style=Style.TONE, heteronym=False)]
    out = ''
    for i, x in enumerate(sy):
        if i and x[:1] in 'aāáǎàoōóǒòeēéěè':
            out += "'"
        out += x
    return out

def fine_split(w, keep):
    if len(w) <= 3 or w in keep:
        return [w]
    res, i = [], 0
    while i < len(w):
        if i + 1 < len(w) and (w[i:i+2] in jieba.dt.FREQ and jieba.dt.FREQ[w[i:i+2]] > 0):
            res.append(w[i:i+2]); i += 2
        else:
            res.append(w[i]); i += 1
    return res

def to_pinyin(zh, target=''):
    out = []
    keep = set(phr) | {target}
    for w0 in jieba.cut(zh, HMM=False):
        for w in (fine_split(w0, keep) if re.match(r'^[\u3400-\u9fff]+$', w0) else [w0]):
            if re.match(r'^[\u3400-\u9fff]+$', w):
                out.append({'地': 'de', '得': 'de', '着': 'zhe', '了': 'le'}.get(w) or syl_join(w))
            elif w.strip():
                t = ''.join(PUNCT.get(c, c) for c in w)
                if out and re.match(r'^[,.?!:;)"»]+', t):
                    out[-1] += t
                else:
                    out.append(t)
    s = ' '.join(out)
    s = re.sub(r'\s+([,.?!:;])', r'\1', s)
    return s.lower()

def split_vi_cases(s):
    return s

words = []
missing_ex = []
for i, (r, d) in enumerate(zip(rows, draft)):
    no = r[0][3:]
    meaning = cleanup(ovr.get(no, r[4]))
    w = {
        'id': 'hsk7-9-%04d' % (i + 1),
        'hanzi': d['hanzi'],
        'pinyin': d['pinyin'],
        'pos': r[3],
        'meaning_vi': meaning,
    }
    if d['trad'] and d['trad'] != d['hanzi']:
        w['traditional'] = d['trad']
    ex = examples.get(no) or examples.get(d['hanzi'])
    if ex:
        zh, vi = ex
        w['example'] = {'zh': zh, 'pinyin': to_pinyin(zh, d['hanzi']), 'vi': vi}
    if d['raw'] != d['hanzi']:
        w['notes'] = 'Mục gốc trong danh sách GF0025-2021: ' + d['raw']
    words.append(w)

doc = {
    'level': '7-9',
    'standard': 'HSK3.0-2025',
    'source': 'Danh sách từ HSK 7–9 theo GF0025-2021 (ivankra/hsk30, MIT); nghĩa tiếng Việt tham khảo CVDICT (CC BY-SA 4.0, ph0ngp/CVDICT) đã hiệu đính',
    'target_count': 5636,
    'count': len(words),
    'complete': len(words) >= 5636 and all(w['meaning_vi'] for w in words),
    'words': words,
}
json.dump(doc, open(out, 'w', encoding='utf-8'), ensure_ascii=False, indent=2)
open(out, 'a', encoding='utf-8').write('\n')
nex = sum(1 for w in words if 'example' in w)
print('words', len(words), 'with meaning', sum(1 for w in words if w['meaning_vi']), 'with example', nex, '%.1f%%' % (100 * nex / len(words)))
print('unused examples:', [k for k in examples if k not in {r[0][3:] for r in rows} and k not in {d['hanzi'] for d in draft}][:20])
