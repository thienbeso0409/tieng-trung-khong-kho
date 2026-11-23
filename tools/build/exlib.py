import json, sys, os, collections
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
from pyh import P, Z

OUTDIR = '/home/claude/tieng-trung-khong-kho/data/exams'
os.makedirs(OUTDIR, exist_ok=True)


def T(zh, vi=None, py=True):
    d = {'zh': Z(zh)}
    if py:
        d['pinyin'] = P(zh)
    if vi:
        d['vi'] = vi
    return d


def IMG(emoji, alt):
    return {'emoji': emoji, 'alt_vi': alt}


def AU(*lines, repeat=2):
    """lines: ('男','text') ..."""
    out = []
    for sp, tx in lines:
        out.append({'speaker': sp, 'text': Z(tx), 'pinyin': P(tx)})
    return {'lines': out, 'repeat': repeat}


def opts_text(*zhs, py=True):
    return [{'key': 'ABCDEF'[i], 'text': T(z, py=py)} for i, z in enumerate(zhs)]


def opts_img(*imgs):
    return [{'key': 'ABCDEF'[i], 'image': IMG(*im)} for i, im in enumerate(imgs)]


class Exam:
    def __init__(self, eid, level, **meta):
        self.id = eid
        self.level = level
        self.no = 0
        self.d = {'id': eid, 'level': level, 'title_vi': f'Đề thi thử HSK {level} – Đề 1', 'standard': 'HSK3.0'}
        self.d.update(meta)
        self.d['sections'] = []

    def section(self, sid, name_vi, name_zh, dur):
        s = {'id': sid, 'name_vi': name_vi, 'name_zh': name_zh, 'max_score': 100, 'duration_minutes': dur, 'parts': []}
        self.d['sections'].append(s)
        return s

    def part(self, sec, code, typ, ins_vi, ins_zh):
        p = {'code': code, 'type': typ, 'expected_count': 0, 'instruction_vi': ins_vi, 'instruction_zh': ins_zh, 'groups': []}
        sec['parts'].append(p)
        return p

    def group(self, part, shared=None, passage=None, audio=None):
        g = {'id': f"{self.id}-{part['code']}-g{len(part['groups']) + 1}", 'shared_options': shared, 'passage': passage}
        if audio:
            g['audio'] = audio
        g['questions'] = []
        part['groups'].append(g)
        return g

    def q(self, part, group, example=False, **fields):
        q = {}
        if example:
            q['id'] = f"{self.id}-{part['code']}-ex" + (str(len(part['groups'])) if len(part['groups']) > 1 else '')
            q['no'] = 0
            q['is_example'] = True
        else:
            self.no += 1
            q['id'] = f'{self.id}-{self.no:02d}'
            q['no'] = self.no
            part['expected_count'] += 1
        q['type'] = part['type']
        q.update(fields)
        group['questions'].append(q)
        return q

    def save(self):
        fn = f'{OUTDIR}/{self.id}.json'
        json.dump(self.d, open(fn, 'w', encoding='utf-8'), ensure_ascii=False, indent=2)
        # report
        print(self.id, 'questions:', self.no)
        for s in self.d['sections']:
            for p in s['parts']:
                ans = [q['answer'] for g in p['groups'] for q in g['questions'] if not q.get('is_example')]
                c = collections.Counter(map(str, ans))
                print(' ', p['code'], p['type'], p['expected_count'], dict(c))
