#!/usr/bin/env python3
"""Step 2: clean CVDICT senses into short meaning_vi drafts + POS mapping.
Usage: python3 -I s2_clean.py DRAFT_JSON OUT_TSV"""
import json, re, sys

d = json.load(open(sys.argv[1], encoding='utf-8'))
POS = {'N': 'danh từ', 'V': 'động từ', 'Adj': 'tính từ', 'Adv': 'phó từ', 'Pron': 'đại từ',
       'Num': 'số từ', 'M': 'lượng từ', 'Prep': 'giới từ', 'Conj': 'liên từ', 'Aux': 'trợ động từ',
       'Intj': 'thán từ', 'Suffix': 'trợ từ', 'Phonetic': 'thán từ', 'Prefix': 'trợ từ', 'Part': 'trợ từ'}

BAD = [r'^họ\b', r'^Họ\b', r'biến thể của', r'^xem ', r'^Xem ', r'^CL:', r'^cũng viết là', r'^cũng được viết',
       r'^dạng cổ', r'^\(cổ\)', r'^\(văn cổ\)', r'^phồn thể', r'^viết tắt của', r'^tên ', r'^Tên ', r'^LT:', r'^lượng từ', r'^Lượng từ', r'^cũng đọc', r'^Cũng đọc', r'phát âm ở Đài Loan', r'^\(Đài Loan\)', r'^cách viết', r'^Cách viết', r'^tiền tố', r'^hậu tố cho', r'^viết tắt cho', r'^\(viết tắt\)']

def clean_sense(s):
    s = s.strip()
    s = re.sub(r'\s*CL:.*$', '', s)
    s = re.sub(r'[㐀-鿿]+\|[㐀-鿿]+\[[^\]]+\]', '', s)  # trad|simp[py]
    s = re.sub(r'[㐀-鿿]+\[[^\]]+\]', '', s)
    s = re.sub(r'\[[a-zA-Z0-9 ]+\]', '', s)
    s = re.sub(r'\s*\((từ mượn|viết tắt của\s*|viết tắt cho\s*|khẩu ngữ|văn viết|thành ngữ)\)\s*', ' ', s)
    s = re.sub(r'\s*LT:.*$', '', s)
    s = re.sub(r'\s+', ' ', s).strip(' ;,')
    return s

def pos_of(x):
    p = x['pos_src'] or ''
    if p:
        out = []
        for t in p.split('/'):
            v = POS.get(t)
            if v and v not in out:
                out.append(v)
        if out:
            return ', '.join(out)
    if '∥' in x['webpinyin'] or '//' in x['webpinyin']:
        return 'động từ'
    return 'cụm từ'

rows = []
for i, x in enumerate(d):
    senses = []
    lower = [e for e in x['cvdict'] if e['py'][:1].islower()] or x['cvdict']
    for e in lower:
        for s in e['defs']:
            if not s.strip() or any(re.search(b, s.strip()) for b in BAD):
                continue
            c = clean_sense(s)
            if c and c not in senses:
                senses.append(c)
    m = '; '.join(senses[:3])
    flag = []
    if not m:
        flag.append('EMPTY')
    if re.search(r'\b(the|of|to|and|a|an|is|for|with)\b', m):
        flag.append('EN')
    if len(m) > 90:
        flag.append('LONG')
    rows.append([x['src_id'], x['hanzi'], x['pinyin'], pos_of(x), m, ','.join(flag)])

with open(sys.argv[2], 'w', encoding='utf-8') as f:
    for r in rows:
        f.write('\t'.join(r) + '\n')
from collections import Counter
print(Counter(f for r in rows for f in r[5].split(',') if f))
