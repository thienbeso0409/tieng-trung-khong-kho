#!/usr/bin/env python3
"""Build data/exams/hsk7-9-de1.json. Usage: python3 s5_exam.py OUT_JSON"""
import json, re, sys, os
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
from exam_part1 import L1, L2, L3
from exam_part2 import R1, R2_PASSAGE, R2_OPTIONS, R2_ANS, R3
from exam_part3 import CHART, CHART_SAMPLE, ESSAY_PROMPT, ESSAY_SAMPLE, TW, TO

EID = 'hsk7-9-de1'
KEYS = 'ABCDEFG'
no = 0
def nid():
    global no
    no += 1
    return no, '%s-%02d' % (EID, no)

def T(zh):
    return {'zh': zh}

def remap_expl(expl, perm):
    return re.sub(r'(?<![A-Za-zÀ-ỹ])([A-D])(?![A-Za-zÀ-ỹ])', lambda m: perm.get(m.group(1), m.group(1)), expl)

def choose(q, opts, ans, expl, listening, target=None):
    n, i = nid()
    perm = {}
    if target and target != ans:
        a, b = KEYS.index(ans), KEYS.index(target)
        opts = list(opts); opts[a], opts[b] = opts[b], opts[a]
        perm = {ans: target, target: ans}
        expl = remap_expl(expl, perm); ans = target
    d = {'id': i, 'no': n, 'type': 'choose_option'}
    if listening:
        d['audio'] = {'lines': [{'speaker': '旁白', 'text': q}], 'repeat': 1}
    else:
        d['passage'] = None
    d['question'] = T(q)
    d['options'] = [{'key': KEYS[k], 'text': T(o)} for k, o in enumerate(opts)]
    d['answer'] = ans
    d['explanation_vi'] = expl
    return d

def short(q, ans, acc, kw, expl, listening):
    n, i = nid()
    d = {'id': i, 'no': n, 'type': 'short_answer'}
    if listening:
        d['audio'] = {'lines': [{'speaker': '旁白', 'text': q}], 'repeat': 1}
    d.update({'question': T(q), 'max_chars': 10, 'answer': ans, 'accepted_answers': acc, 'keywords': kw,
              'max_points': 1, 'rubric_id': 'rb-short', 'explanation_vi': expl})
    assert len(ans) <= 10, ans
    return d

# ---------- LISTENING ----------
l1q = []
for sp, text, st, ans, expl in L1:
    n, i = nid()
    l1q.append({'id': i, 'no': n, 'type': 'true_false_statement',
                'audio': {'lines': [{'speaker': sp, 'text': text}], 'repeat': 1},
                'passage': None, 'statement': T(st), 'answer': ans, 'explanation_vi': expl})

def listen_groups(code, data):
    groups = []
    for gi, (lines, qs) in enumerate(data, 1):
        qq = []
        for x in qs:
            if x[0] == 'c':
                qq.append(choose(x[1], x[2], x[3], x[4], True))
            else:
                qq.append(short(x[1], x[2], x[3], x[4], x[5], True))
        groups.append({'id': '%s-%s-g%d' % (EID, code, gi), 'shared_options': None, 'passage': None,
                       'audio': {'lines': [{'speaker': s, 'text': t} for s, t in lines], 'repeat': 1},
                       'questions': qq})
    return groups

listening = {'id': 'listening', 'name_vi': 'Nghe', 'name_zh': '听力', 'max_score': 100, 'parts': [
  {'code': 'L1', 'type': 'true_false_statement', 'expected_count': 10,
   'instruction_vi': 'Nghe từng đoạn ngắn (phát 1 lần), phán đoán câu ★ đúng hay sai.',
   'instruction_zh': '第一部分：听后判断对错。',
   'groups': [{'id': EID + '-L1-g1', 'shared_options': None, 'passage': None, 'questions': l1q}]},
  {'code': 'L2', 'type': 'choose_option', 'expected_count': 12,
   'instruction_vi': 'Nghe các cuộc hội thoại/phỏng vấn dài, mỗi bài có 4 câu: chọn đáp án đúng (A–D) hoặc trả lời ngắn (≤ 10 chữ).',
   'instruction_zh': '第二部分：听后选择正确答案或简短回答问题。',
   'groups': None},
  {'code': 'L3', 'type': 'choose_option', 'expected_count': 18,
   'instruction_vi': 'Nghe bài giảng/phỏng vấn dài, mỗi bài 6 câu: chọn đáp án đúng (A–D) hoặc trả lời ngắn (≤ 10 chữ).',
   'instruction_zh': '第三部分：听后选择正确答案或简短回答问题。',
   'groups': None},
]}
listening['parts'][1]['groups'] = listen_groups('L2', L2)
listening['parts'][2]['groups'] = listen_groups('L3', L3)

# ---------- READING ----------
R1_TARGET = list('ACDBBDA' 'CBADCBD' 'BACDACB')
r1groups = []
t = 0
for gi, (passage, qs) in enumerate(R1, 1):
    qq = []
    for q, opts, ans, expl in qs:
        qq.append(choose(q, opts, ans, expl, False, R1_TARGET[t])); t += 1
    r1groups.append({'id': '%s-R1-g%d' % (EID, gi), 'shared_options': None, 'passage': T(passage), 'questions': qq})

r2q = []
for bn, ans, expl in R2_ANS:
    n, i = nid(); assert n == bn, (n, bn)
    r2q.append({'id': i, 'no': n, 'type': 'cloze_sentence', 'blank_no': n, 'answer': ans, 'explanation_vi': expl})
r2opts = [{'key': o[0], 'text': T(o[2:])} for o in R2_OPTIONS]

r3groups = []
for gi, (passage, qs) in enumerate(R3, 1):
    qq = [short(q, a, acc, kw, e, False) for q, a, acc, kw, e in qs]
    r3groups.append({'id': '%s-R3-g%d' % (EID, gi), 'shared_options': None, 'passage': T(passage), 'questions': qq})

reading = {'id': 'reading', 'name_vi': 'Đọc', 'name_zh': '阅读', 'max_score': 100, 'duration_minutes': 60, 'parts': [
  {'code': 'R1', 'type': 'choose_option', 'expected_count': 21,
   'instruction_vi': 'Đọc 3 bài văn dài, mỗi bài 7 câu hỏi, chọn đáp án đúng (A–D).',
   'instruction_zh': '第一部分：阅读文章，选择正确答案。', 'groups': r1groups},
  {'code': 'R2', 'type': 'cloze_sentence', 'expected_count': 5,
   'instruction_vi': 'Chọn câu thích hợp (A–G) điền vào các chỗ trống (62)–(66). Có 2 câu thừa.',
   'instruction_zh': '第二部分：选句填空。',
   'groups': [{'id': EID + '-R2-g1', 'shared_options': r2opts, 'passage': T(R2_PASSAGE), 'questions': r2q}]},
  {'code': 'R3', 'type': 'short_answer', 'expected_count': 14,
   'instruction_vi': 'Đọc bài văn, trả lời ngắn gọn (không quá 10 chữ Hán), ưu tiên dùng từ ngữ trong bài.',
   'instruction_zh': '第三部分：阅读文章，简短回答问题（不超过10个字）。', 'groups': r3groups},
]}

# ---------- WRITING ----------
n, i = nid()
w1 = {'id': i, 'no': n, 'type': 'chart_description', 'chart': CHART,
      'prompt': T('请描述并分析上图，写一篇200字左右的短文。'),
      'prompt_vi': 'Mô tả và phân tích biểu đồ (thời lượng dùng điện thoại và đọc sách giấy mỗi ngày của cư dân một thành phố, 2019–2024), viết khoảng 200 chữ (≥ 200).',
      'min_chars': 200, 'time_minutes': 15, 'sample_answers': [CHART_SAMPLE],
      'outline_vi': ['Mở: giới thiệu biểu đồ và xu hướng chung', 'Thân: mô tả số liệu nổi bật (tăng mạnh 2020, sách giấy giảm rồi hồi phục 2024)', 'Phân tích nguyên nhân', 'Kết: nhận xét/kiến nghị'],
      'max_points': 40, 'rubric_id': 'rb-chart', 'answer': None,
      'explanation_vi': 'Cần nêu đúng số liệu (182→255 phút; 24→18→20 phút), so sánh hai xu hướng ngược nhau, dùng từ ngữ mô tả biểu đồ: 呈…趋势、增幅、回升、持平; có phân tích nguyên nhân hợp lý.'}
n, i = nid()
w2 = {'id': i, 'no': n, 'type': 'write_essay', 'genre': 'argumentative', 'prompt': T(ESSAY_PROMPT),
      'prompt_vi': 'Có người cho rằng AI giúp học sinh học hiệu quả hơn nên trường nên khuyến khích; người khác cho rằng phụ thuộc AI làm suy yếu tư duy độc lập nên cần hạn chế. Viết bài nghị luận ≥ 600 chữ nêu và lập luận quan điểm của bạn.',
      'keywords': ['人工智能', '独立思考'], 'image': None, 'min_chars': 600, 'max_chars': None, 'time_minutes': 40,
      'sample_answers': [ESSAY_SAMPLE],
      'outline_vi': ['Mở bài: nêu vấn đề, đưa luận điểm rõ ràng', 'Thân bài 1–2: lập luận ủng hộ kèm dẫn chứng', 'Thân bài 3: thừa nhận mặt trái (nhượng bộ)', 'Thân bài 4: giải pháp cụ thể', 'Kết bài: khẳng định lại quan điểm'],
      'max_points': 60, 'rubric_id': 'rb-essay', 'answer': None,
      'explanation_vi': 'Bài đạt điểm cao: luận điểm rõ, ≥ 2 luận cứ có dẫn chứng, có phản biện/nhượng bộ, bố cục mạch lạc, dùng từ nối nghị luận (首先、其次、当然、总而言之), từ vựng cao cấp và thành ngữ phù hợp (因噎废食、趋利避害、双刃剑).'}
writing = {'id': 'writing', 'name_vi': 'Viết', 'name_zh': '书写', 'max_score': 100, 'duration_minutes': 55, 'parts': [
  {'code': 'W1', 'type': 'chart_description', 'expected_count': 1, 'instruction_vi': 'Mô tả và phân tích biểu đồ (≈ 15 phút).', 'instruction_zh': '第一部分：图表描述。',
   'groups': [{'id': EID + '-W1-g1', 'shared_options': None, 'passage': None, 'questions': [w1]}]},
  {'code': 'W2', 'type': 'write_essay', 'expected_count': 1, 'instruction_vi': 'Viết bài nghị luận ≥ 600 chữ (≈ 40 phút).', 'instruction_zh': '第二部分：议论文写作。',
   'groups': [{'id': EID + '-W2-g1', 'shared_options': None, 'passage': None, 'questions': [w2]}]},
]}

# ---------- TRANSLATION ----------
tw = []
for src, vi, ref, expl in TW:
    n, i = nid()
    tw.append({'id': i, 'no': n, 'type': 'translate_written', 'source': {'lang': 'en', 'text': src}, 'source_vi': vi,
               'reference_zh': ref, 'time_minutes': 20, 'max_points': 25, 'rubric_id': 'rb-translate', 'answer': None,
               'explanation_vi': expl})
to = []
for src, vi, ref, expl in TO:
    n, i = nid()
    to.append({'id': i, 'no': n, 'type': 'translate_oral', 'source': {'lang': 'en', 'text': src}, 'source_vi': vi,
               'reference_zh': ref, 'prep_seconds': 60, 'answer_seconds': 120, 'max_points': 25, 'rubric_id': 'rb-translate-oral', 'answer': None,
               'explanation_vi': expl})
translation = {'id': 'translation', 'name_vi': 'Dịch', 'name_zh': '翻译', 'max_score': 100, 'duration_minutes': 41, 'parts': [
  {'code': 'T1', 'type': 'translate_written', 'expected_count': 2, 'instruction_vi': 'Dịch viết đoạn văn tiếng Anh sang tiếng Trung.', 'instruction_zh': '第一部分：笔译。',
   'groups': [{'id': EID + '-T1-g1', 'shared_options': None, 'passage': None, 'questions': tw}]},
  {'code': 'T2', 'type': 'translate_oral', 'expected_count': 2, 'instruction_vi': 'Dịch nói (视译): đọc đoạn tiếng Anh, chuẩn bị 60 giây, nói bản dịch tiếng Trung trong 120 giây.', 'instruction_zh': '第二部分：视译。',
   'groups': [{'id': EID + '-T2-g1', 'shared_options': None, 'passage': None, 'questions': to}]},
]}

def rub(i, mx, crit):
    return {'id': i, 'max_score': mx, 'criteria': [{'key': k, 'name_vi': n, 'weight': w, 'description_vi': d} for k, n, w, d in crit]}
rubrics = [
 rub('rb-short', 1, [('accuracy', 'Đúng ý', 0.8, 'Trả lời đúng thông tin trong bài nghe/đọc.'), ('characters', 'Chữ viết', 0.2, 'Viết đúng chữ Hán, ≤ 10 chữ.')]),
 rub('rb-chart', 40, [('content', 'Mô tả số liệu', 0.35, 'Nêu đúng, đủ số liệu và xu hướng chính.'), ('analysis', 'Phân tích', 0.25, 'Giải thích nguyên nhân, so sánh hợp lý.'),
                      ('organization', 'Bố cục', 0.15, 'Mạch lạc, có mở – thân – kết.'), ('vocab_grammar', 'Từ vựng – ngữ pháp', 0.25, 'Dùng chính xác từ ngữ mô tả biểu đồ, câu đa dạng.')]),
 rub('rb-essay', 60, [('content', 'Luận điểm – luận cứ', 0.35, 'Quan điểm rõ, lập luận chặt chẽ, dẫn chứng thuyết phục.'), ('organization', 'Bố cục', 0.2, 'Kết cấu nghị luận hoàn chỉnh, liên kết tốt.'),
                      ('vocab_grammar', 'Từ vựng – ngữ pháp', 0.35, 'Từ vựng cao cấp, thành ngữ, câu phức chính xác.'), ('characters', 'Chữ viết – độ dài', 0.1, 'Đủ 600 chữ, ít lỗi chữ.')]),
 rub('rb-translate', 25, [('accuracy', 'Chính xác', 0.5, 'Truyền đạt đúng, đủ ý bản gốc.'), ('fluency', 'Trôi chảy', 0.3, 'Câu văn tiếng Trung tự nhiên, không dịch máy móc.'), ('vocab_grammar', 'Từ vựng – ngữ pháp', 0.2, 'Dùng từ đúng ngữ cảnh, đúng ngữ pháp.')]),
 rub('rb-translate-oral', 25, [('accuracy', 'Chính xác', 0.5, 'Truyền đạt đúng, đủ ý.'), ('fluency', 'Lưu loát', 0.3, 'Nói liền mạch, ít ngắt quãng, đúng thời gian.'), ('pronunciation', 'Phát âm', 0.2, 'Phát âm, thanh điệu rõ ràng.')]),
]

exam = {'id': EID, 'level': '7-9', 'title_vi': 'Đề thi thử HSK 7–9 – Đề 1', 'standard': 'HSK3.0',
        'duration_minutes': 200, 'total_score': None, 'pass_score': None, 'score_mode': 'bands',
        'band_rules': {'basis': 'average_section_score', 'official': False,
                       'bands': [{'min': 0, 'label_vi': 'Dưới HSK 7'}, {'min': 60, 'label_vi': 'HSK 7'}, {'min': 75, 'label_vi': 'HSK 8'}, {'min': 90, 'label_vi': 'HSK 9'}]},
        'show_pinyin': False, 'repeat_default': 1, 'speaking_paper': 'hsk7-9-de1-speaking',
        'notes': 'Đề tự soạn theo cấu trúc HSK 3.0 bậc 7–9 (91 mục: 86 câu trong file này + 5 mục nói ở speaking/hskk.json). Ngưỡng xếp bậc là ước lượng, không chính thức.',
        'sections': [listening, reading, writing, translation], 'rubrics': rubrics}

assert no == 86, no
assert len(ESSAY_SAMPLE.replace('\n', '')) >= 600, len(ESSAY_SAMPLE)
assert len(CHART_SAMPLE) >= 200
for g in [CHART]:
    for s in g['series']:
        assert len(s['values']) == len(g['labels'])
json.dump(exam, open(sys.argv[1], 'w', encoding='utf-8'), ensure_ascii=False, indent=2)
print('ok', no, 'essay chars', len(re.sub(r'[\s，。、；：“”！？—]', '', ESSAY_SAMPLE)), 'chart chars', len(CHART_SAMPLE))
