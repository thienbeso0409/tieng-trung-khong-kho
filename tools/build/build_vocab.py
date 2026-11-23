import csv, json, re, sys, os, unicodedata
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
from pyh import P, Z, jieba
OUT = '/home/claude/tieng-trung-khong-kho/data/vocab'
os.makedirs(OUT, exist_ok=True)
POS = {'N': 'danh từ', 'V': 'động từ', 'Adj': 'tính từ', 'Adv': 'phó từ', 'M': 'lượng từ', 'Pron': 'đại từ',
       'Conj': 'liên từ', 'Prep': 'giới từ', 'Num': 'số từ', 'Aux': 'trợ từ', 'Suffix': 'trợ từ', 'Prefix': 'trợ từ',
       'Intj': 'thán từ', 'Phonetic': 'thán từ', '': 'cụm từ'}
rows = [x for x in csv.DictReader(open('/tmp/dl/hsk30.csv', encoding='utf-8')) if x['Level'] in '123']

def headword(s):
    s = s.split('|')[0]
    m = re.match(r'^(.+?)（(.+)）$', s)
    if m:
        base, ex = m.groups()
        if '一' == ex:  # 有（一）些
            return base + s.split('）')[1] if False else base
        return base
    return s

def norm_hw(x):
    s = x['Simplified']
    if s.startswith('有（一）'):
        return '有' + s.split('）')[1]
    if s.startswith('…'):
        return s.lstrip('…')
    return re.sub(r'\d+$', '', headword(s))

def norm_py(x):
    p = x['Pinyin'].split('|')[0].split('/')[0]
    p = re.sub(r'\s*\(.*\)$', '', p)
    p = p.replace('(yī)', '')
    return p.strip()

def sort_key(p, h):
    base = unicodedata.normalize('NFD', p.lower())
    letters = ''.join(c for c in base if c.isalpha() and ord(c) < 128)
    tones = ''
    for syl in re.findall(r'[^\s\']+', base):
        t = '5'
        for mark, n in (('̄', '1'), ('́', '2'), ('̌', '3'), ('̀', '4')):
            if mark in syl:
                t = n
        tones += t
    return (letters, tones, h)

def load_src(lv):
    L = []
    for line in open(f'/tmp/ttkk_build/src_v{lv}.txt', encoding='utf-8'):
        line = line.rstrip('\n')
        if not line.strip():
            continue
        parts = line.split('|')
        while len(parts) < 4:
            parts.append('')
        L.append(parts[:4] + parts[4:])
    return L

ALLW = {}
SYL = {}
for _n, _rows in json.load(open('/tmp/ttkk_build/syl2025.json', encoding='utf-8')).items():
    for _r in _rows:
        SYL.setdefault(_r[0], int(_n))
report = []
for lv in [l for l in ('1', '2', '3') if os.path.exists(f'/tmp/ttkk_build/src_v{l}.txt')]:
    R = [x for x in rows if x['Level'] == lv]
    src = load_src(lv)
    if len(src) != len(R):
        print('COUNT MISMATCH', lv, len(src), len(R))
    words = []
    for i, x in enumerate(R):
        hw = norm_hw(x)
        s = src[i] if i < len(src) else None
        if not s or s[0] != hw:
            print('MISMATCH', lv, i, hw, s[0] if s else None)
            sys.exit(1)
        w = {'hanzi': hw, 'pinyin': norm_py(x), 'pos': ', '.join(dict.fromkeys(POS[p] for p in x['POS'].split('/'))),
             'meaning_vi': s[1]}
        notes = []
        variants = x['Simplified'].split('|')
        if len(variants) > 1:
            notes.append('Dạng khác: ' + '、'.join(variants[1:]) + ' (' + x['Pinyin'].split('|')[1] + ')')
        m = re.match(r'^(.+?)（(.+)）$', x['Simplified'])
        if m and m.group(2) != '一':
            notes.append('Ví dụ dùng: ' + m.group(2))
        if x['POS'] in ('Suffix', 'Prefix'):
            notes.append('Phụ tố (词缀)')
        if x['Simplified'].startswith('有（一）'):
            notes.append('Cũng nói: 有一' + x['Simplified'].split('）')[1])
        if s[2].strip() and s[3].strip():
            w['example'] = {'zh': Z(s[2]), 'pinyin': P(s[2]), 'vi': s[3]}
            report.append((lv, hw, s[2]))
        if x['Traditional'].split('|')[0] != x['Simplified'].split('|')[0] and not m:
            w['traditional'] = x['Traditional'].split('|')[0]
        w['notes'] = '; '.join(notes) if notes else None
        if not w['notes']:
            del w['notes']
        w['_src_id'] = x['ID']
        if hw in SYL:
            w['syllabus2025'] = True
            w['syllabus2025_level'] = SYL[hw]
        words.append(w)
    words.sort(key=lambda w: sort_key(w['pinyin'], w['hanzi']))
    for k, w in enumerate(words, 1):
        w2 = {'id': f'hsk{lv}-{k:04d}'}
        w2.update({kk: vv for kk, vv in w.items() if kk != '_src_id'})
        words[k - 1] = w2
    TGT = {'1': 500, '2': 772, '3': 973}
    data = {'level': int(lv), 'standard': 'HSK3.0-2021', 'target_count': TGT[lv], 'count': len(words), 'complete': len(words) >= TGT[lv],
            'notes': 'Danh sách từ theo 国际中文教育中文水平等级标准 GF0025-2021 (nguồn mở ivankra/hsk30). Field syllabus2025/syllabus2025_level: từ có trong đại cương thi HSK 2025 (cấp 1–3), theo danh sách công bố trên hsklord.com.',
            'words': words}
    json.dump(data, open(f'{OUT}/hsk{lv}.json', 'w', encoding='utf-8'), ensure_ascii=False, indent=2)
    ex = sum(1 for w in words if 'example' in w)
    print(f'hsk{lv}: {len(words)} words, {ex} examples ({100*ex//len(words)}%)')
    ALLW[lv] = words
json.dump(report, open('/tmp/ttkk_build/ex_report.json', 'w'), ensure_ascii=False)
