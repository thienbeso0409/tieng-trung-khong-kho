import sys, csv, json, re, glob
sys.path.insert(0, '/home/claude/scripts-b')
from pyzh import to_pinyin
SRC = '/home/claude/srcdata-b/hsk30/hsk30.csv'
OUT = '/home/claude/tieng-trung-khong-kho/data/vocab'
POSMAP = {'N':'danh từ','V':'động từ','Adj':'tính từ','Adv':'phó từ','M':'lượng từ','Conj':'liên từ','Prep':'giới từ',
          'Pron':'đại từ','Aux':'trợ từ','Suffix':'danh từ','Intj':'thán từ','Num':'số từ'}
OV = {'N':'danh từ','V':'động từ','A':'tính từ','D':'phó từ','M':'lượng từ','C':'liên từ','P':'giới từ','R':'đại từ','U':'trợ từ','Num':'số từ','Ph':'cụm từ','I':'thán từ'}
TARGET = {'4':1000,'5':1071,'6':1140}
rows = list(csv.DictReader(open(SRC, encoding='utf-8')))
def clean_h(s):
    s = s.split('|')[0]
    s = re.sub(r'\d', '', s)
    m = re.match(r'^(.+?)（(.+)）$', s)
    if m and len(m.group(1)) == 1 and len(m.group(2)) > 1:  # suffix like 品（工艺品）
        return m.group(1), m.group(2)
    return s.replace('（', '').replace('）', ''), None
def clean_p(p):
    p = p.split('|')[0].strip()
    p = re.sub(r'\s*\((?:[^)]*\s[^)]*|[^)]{4,})\)\s*$', '', p)  # suffix explanation
    p = p.replace('(', '').replace(')', '')
    return p.strip()
low = {}
for r in rows:
    if r['Level'] in ('1','2','3'):
        for h in r['Simplified'].split('|'):
            low.setdefault(clean_h(h)[0], r['Level'])
stats = {}
for lv in ('4','5','6'):
    content = {}
    for f in sorted(glob.glob(f'/home/claude/scripts-b/content/v{lv}*.txt')):
        for line in open(f, encoding='utf-8'):
            line = line.rstrip('\n')
            if not line.strip(): continue
            parts = line.split('|')
            if len(parts) < 3: raise SystemExit(f'bad line {f}: {line}')
            num, pos, mean = parts[0], parts[1], parts[2]
            zh = parts[3] if len(parts) > 3 else ''
            vi = parts[4] if len(parts) > 4 else ''
            if num in content: raise SystemExit(f'dup {lv} {num}')
            content[num] = (pos, mean, zh, vi)
    lvrows = [r for r in rows if r['Level'] == lv]
    words = []; seen = {}
    nex = 0
    for i, r in enumerate(lvrows, 1):
        num = r['ID'].split('-')[1]
        if num not in content: raise SystemExit(f'missing {lv} {num} {r["Simplified"]}')
        pos_o, mean, zh, vi = content[num]
        h, sfx = clean_h(r['Simplified'])
        py = clean_p(r['Pinyin'])
        if pos_o: pos = ', '.join(OV[x] for x in pos_o.split('/'))
        else:
            codes = [c for c in r['POS'].split('/') if c]
            if not codes: raise SystemExit(f'no pos {lv} {num} {h}')
            pos = ', '.join(dict.fromkeys(POSMAP[c] for c in codes))
        w = {'id': f'hsk{lv}-{i:04d}', 'hanzi': h, 'pinyin': py, 'pos': pos, 'meaning_vi': mean}
        if zh and vi:
            if h not in zh: print('WARN example lacks word', lv, num, h, zh)
            w['example'] = {'zh': zh, 'pinyin': to_pinyin(zh, [(h, py.replace(' ', '').replace('-', ''))]), 'vi': vi}
            nex += 1
        trad = clean_h(r['Traditional'])[0]
        if trad != h: w['traditional'] = trad
        notes = []
        if '|' in r['Simplified']: notes.append('Dạng khác: ' + r['Simplified'].split('|',1)[1].replace('|', ', '))
        if sfx: notes.append(f'Hậu tố, ví dụ: {sfx}')
        if h in low: notes.append(f'Cùng mặt chữ với từ HSK {low[h]} nhưng là nghĩa/từ loại/âm đọc mới theo GF0025-2021')
        if h in seen: notes.append(f'Đồng hình với {seen[h]} trong cùng cấp (khác âm/nghĩa)')
        seen.setdefault(h, w['id'])
        if notes: w['notes'] = '; '.join(notes)
        words.append(w)
    doc = {'level': int(lv), 'standard': 'HSK3.0-2025', 'source': 'GF0025-2021 (ivankra/hsk30)', 'target_count': TARGET[lv],
           'count': len(words), 'complete': len(words) >= TARGET[lv], 'words': words}
    json.dump(doc, open(f'{OUT}/hsk{lv}.json', 'w', encoding='utf-8'), ensure_ascii=False, indent=2)
    stats[lv] = (len(words), nex)
print(stats)
