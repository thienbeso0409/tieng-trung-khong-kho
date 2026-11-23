import json, sys, os
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
from pyh import P, Z
from lvcheck import check
OUT = '/home/claude/tieng-trung-khong-kho/data/writing'


def T(zh, py=True):
    d = {'zh': Z(zh)}
    if py:
        d['pinyin'] = P(zh)
    return d


def reorder(prefix, items, lv):
    qs = []
    for i, (words, ans, acc, ex) in enumerate(items, 1):
        q = {'id': f'{prefix}-ro-{i:02d}', 'type': 'reorder_words', 'words': words, 'answer': ans}
        if acc:
            q['accepted_answers'] = acc
        q['pinyin'] = P(ans)
        q['explanation_vi'] = ex
        assert sorted(''.join(words)) == sorted(ans.translate(str.maketrans('', '', '。？！，'))), (words, ans)
        qs.append(q)
    return qs


def hanzi(prefix, items, py):
    qs = []
    for i, (st, bp, ans, ex) in enumerate(items, 1):
        assert '（ ）' in st and len(ans) == 1
        qs.append({'id': f'{prefix}-wh-{i:02d}', 'type': 'write_hanzi_from_pinyin', 'stem': T(st, py), 'blank_pinyin': bp, 'answer': ans, 'explanation_vi': ex})
    return qs


# ---------------- HSK1 ----------------
ro1 = reorder('wp1', [
    (['我', '是', '学生'], '我是学生。', None, 'Câu "是": 主语 + 是 + danh từ.'),
    (['你', '叫', '名字', '什么'], '你叫什么名字？', None, 'Từ để hỏi 什么 đứng ở vị trí của thông tin cần hỏi: 叫什么名字.'),
    (['我', '喝', '想', '水'], '我想喝水。', None, 'Động từ năng nguyện 想 đứng trước động từ chính 喝.'),
    (['他', '医院', '在', '工作'], '他在医院工作。', None, 'Giới từ chỉ nơi chốn 在 + địa điểm đứng TRƯỚC động từ (khác tiếng Việt).'),
    (['明天', '去', '我', '北京'], '我明天去北京。', ['明天我去北京。'], 'Trạng ngữ thời gian (明天) đứng trước động từ, có thể đứng đầu câu.'),
    (['很', '今天', '热', '天气'], '今天天气很热。', None, 'Câu vị ngữ tính từ: 主语 + 很 + tính từ, không dùng 是.'),
    (['我', '一个', '有', '哥哥'], '我有一个哥哥。', None, 'Số từ + lượng từ (一个) đứng trước danh từ.'),
    (['你', '吗', '中国人', '是'], '你是中国人吗？', None, 'Câu hỏi có/không: thêm 吗 ở cuối câu trần thuật.'),
    (['桌子上', '书', '有', '三本'], '桌子上有三本书。', None, 'Câu tồn tại: nơi chốn + 有 + số lượng + vật.'),
    (['我们', '吃饭', '一起', '吧'], '我们一起吃饭吧。', None, 'Phó từ 一起 đứng trước động từ; 吧 cuối câu là lời rủ.'),
    (['商店', '去', '下午', '我', '买东西'], '我下午去商店买东西。', ['下午我去商店买东西。'], 'Liên động: 去 + nơi chốn + mục đích (买东西).'),
    (['妈妈', '做饭', '在', '正'], '妈妈正在做饭。', None, '正在 + động từ = đang làm gì.'),
], 1)
wh1 = hanzi('wp1', [
    ('我（ ）中国人。', 'shì', '是', '是 = là.'),
    ('你好！我（ ）王明。', 'jiào', '叫', '叫 = tên là.'),
    ('我想（ ）茶。', 'hē', '喝', '喝 = uống, bộ 口.'),
    ('今天星期（ ）？', 'jǐ', '几', '星期几 = thứ mấy.'),
    ('这是我的好朋（ ）。', 'yǒu', '友', '朋友 = bạn bè.'),
    ('我（ ）你一起去。', 'hé', '和', '和 = và, cùng với.'),
    ('他（ ）在看书。', 'zhèng', '正', '正在 = đang.'),
    ('明天（ ）！', 'jiàn', '见', '明天见 = mai gặp.'),
    ('我不（ ）道。', 'zhī', '知', '知道 = biết.'),
    ('你（ ）哪儿？', 'qù', '去', '去 = đi.'),
], True)

# ---------------- HSK2 ----------------
COMP = [('A', '口', 'kǒu'), ('B', '亻', 'rén'), ('C', '氵', 'shuǐ'), ('D', '日', 'rì'), ('E', '女', 'nǚ'), ('F', '讠', 'yán')]
comp_opts = [{'key': k, 'text': {'zh': z, 'pinyin': p}} for k, z, p in COMP]
cc = []
for i, (w, tc, ti, sp, lay, ans, ex) in enumerate([
    ('喝水', '喝', 0, '曷', 'left-right', 'A', '喝 = 口 + 曷: uống bằng miệng → 口 (A).'),
    ('休息', '休', 0, '木', 'left-right', 'B', '休 = 亻 + 木 → 亻 (B).'),
    ('洗手', '洗', 0, '先', 'left-right', 'C', '洗 = 氵 + 先: rửa cần nước → 氵 (C).'),
    ('晚上', '晚', 0, '免', 'left-right', 'D', '晚 = 日 + 免: liên quan thời gian, mặt trời → 日 (D).'),
    ('姐姐', '姐', 0, '且', 'left-right', 'E', '姐 = 女 + 且: chị gái là nữ → 女 (E).'),
    ('说话', '说', 0, '兑', 'left-right', 'F', '说 = 讠 + 兑: liên quan lời nói → 讠 (F).'),
    ('你们', '们', 1, '门', 'left-right', 'B', '们 = 亻 + 门 → 亻 (B).'),
    ('汉语', '汉', 0, '又', 'left-right', 'C', '汉 = 氵 + 又 → 氵 (C).'),
    ('问题', '问', 0, '门', 'enclosure', 'A', '问 = 门 + 口 bên trong → 口 (A).'),
    ('时间', '时', 0, '寸', 'left-right', 'D', '时 = 日 + 寸 → 日 (D).'),
    ('妹妹', '妹', 0, '未', 'left-right', 'E', '妹 = 女 + 未 → 女 (E).'),
    ('请问', '请', 0, '青', 'left-right', 'F', '请 = 讠 + 青 → 讠 (F).'),
], 1):
    cc.append({'id': f'wp2-cc-{i:02d}', 'type': 'choose_component', 'word': T(w), 'target_char': tc, 'target_index': ti,
               'shown_part': sp, 'layout': lay, 'options': comp_opts, 'answer': ans, 'explanation_vi': ex})
wh2 = hanzi('wp2', [
    ('我（ ）天早上跑步。', 'měi', '每', '每天 = mỗi ngày.'),
    ('这件衣服太（ ）了。', 'guì', '贵', '贵 = đắt.'),
    ('我家（ ）公司很近。', 'lí', '离', 'A 离 B 近 = A gần B.'),
    ('他（ ）我高。', 'bǐ', '比', 'A 比 B + tính từ = A hơn B.'),
    ('请（ ）诉我你的名字。', 'gào', '告', '告诉 = nói cho biết.'),
    ('我已（ ）吃饭了。', 'jīng', '经', '已经 = đã.'),
    ('外边下（ ）了，很冷。', 'xuě', '雪', '下雪 = tuyết rơi.'),
    ('你的眼（ ）真漂亮。', 'jing', '睛', '眼睛 = mắt (睛 đọc nhẹ jing).'),
    ('我（ ）为生病，没去上课。', 'yīn', '因', '因为 = bởi vì.'),
    ('欢迎你来我家（ ）！', 'wán', '玩', '来……玩 = đến … chơi.'),
], True)
ro2 = reorder('wp2', [
    (['比', '我', '哥哥', '高'], '哥哥比我高。', None, 'So sánh: A + 比 + B + tính từ.'),
    (['已经', '我', '了', '吃饭'], '我已经吃饭了。', None, '已经 + động từ + 了: đã làm xong.'),
    (['离', '学校', '我家', '很远'], '我家离学校很远。', None, 'A + 离 + B + 远/近.'),
    (['跑', '他', '得', '很快'], '他跑得很快。', None, 'Bổ ngữ trình độ: động từ + 得 + 很 + tính từ.'),
    (['过', '我', '中国', '去'], '我去过中国。', None, 'Động từ + 过: đã từng.'),
    (['请', '告诉', '我', '你的手机号'], '请告诉我你的手机号。', None, '告诉 + người + việc (hai tân ngữ).'),
    (['给', '妈妈', '我', '打电话'], '我给妈妈打电话。', None, '给 + người + động từ: làm gì cho ai.'),
    (['因为', '下雨', '所以', '我', '没去'], '因为下雨，所以我没去。', None, 'Cặp liên từ 因为……所以…… (vì… nên…).'),
    (['从', '他', '回来', '北京'], '他从北京回来。', None, '从 + nơi chốn + 来/回来: từ đâu đến.'),
    (['准备', '你', '好了吗', '明天的考试'], '明天的考试你准备好了吗？', ['你准备好明天的考试了吗？'], 'Chủ đề (明天的考试) có thể đặt đầu câu; 准备好 = chuẩn bị xong.'),
], 2)

# ---------------- HSK3 ----------------
wh3 = hanzi('wp3', [
    ('我们要（ ）护环境。', 'bǎo', '保', '保护 = bảo vệ.'),
    ('他终（ ）找到了工作。', 'yú', '于', '终于 = cuối cùng.'),
    ('你（ ）心，我一定准时到。', 'fàng', '放', '放心 = yên tâm.'),
    ('这件事很重（ ）。', 'yào', '要', '重要 = quan trọng.'),
    ('请把门（ ）上。', 'guān', '关', '关上 = đóng lại.'),
    ('我对音乐很感兴（ ）。', 'qù', '趣', '感兴趣 = hứng thú.'),
    ('明天的会（ ）几点开始？', 'yì', '议', '会议 = cuộc họp.'),
    ('他的汉语水（ ）很高。', 'píng', '平', '水平 = trình độ.'),
    ('别（ ）心，问题不大。', 'dān', '担', '担心 = lo lắng.'),
    ('我每天都（ ）炼身体。', 'duàn', '锻', '锻炼 = rèn luyện.'),
    ('这个菜的（ ）道很好。', 'wèi', '味', '味道 = mùi vị.'),
    ('我想（ ）一本书给你。', 'jiè', '借', '借 = mượn/cho mượn.'),
    ('他（ ）然没来。', 'guǒ', '果', '果然 = quả nhiên.'),
    ('请大家（ ）意安全。', 'zhù', '注', '注意 = chú ý.'),
    ('这次比（ ）我们赢了。', 'sài', '赛', '比赛 = trận đấu.'),
    ('冬天北方很冷，南方比（ ）暖和。', 'jiào', '较', '比较 = tương đối.'),
], False)
ws3 = []
for i, (kw, em, alt, samples, ex) in enumerate([
    ('搬家', '📦🚚', 'Một gia đình đang khiêng thùng đồ lên xe tải', ['他们今天搬家。', '我们下个月要搬家了。'], 'Chủ ngữ + thời gian + 搬家.'),
    ('生气', '😠', 'Người mẹ đang tức giận nhìn đứa con', ['妈妈很生气。', '孩子没做作业，妈妈生气了。'], '生气 là động từ/tính từ: 很生气, 生气了.'),
    ('认真', '✍️📖', 'Học sinh đang chăm chú làm bài', ['他学习很认真。', '她在认真地写作业。'], '认真 làm tính từ (很认真) hoặc trạng ngữ (认真地 + động từ).'),
    ('参加', '🏃‍♀️🏁', 'Nhiều người tham gia cuộc thi chạy', ['很多人参加了这次比赛。', '我想参加明天的比赛。'], '参加 + hoạt động (比赛, 会议, 晚会).'),
    ('感冒', '🤧', 'Một cô gái đang hắt hơi, cầm khăn giấy', ['她感冒了。', '天气太冷，她感冒了。'], '感冒了 = bị cảm rồi.'),
    ('旅游', '🧳🗺️', 'Hai người cầm bản đồ đi du lịch', ['他们去中国旅游。', '放假的时候我想去旅游。'], '去 + nơi chốn + 旅游.'),
    ('送', '🎁', 'Cậu bé tặng quà cho bạn gái', ['他送了她一个礼物。', '这是我送给你的礼物。'], '送 + người + vật / 送给 + người.'),
    ('爬山', '🧗⛰️', 'Một nhóm bạn đang leo núi', ['周末我们去爬山。', '他们正在爬山。'], '爬山 là động từ li hợp, không thêm tân ngữ.'),
    ('终于', '🏁🎉', 'Vận động viên vượt qua vạch đích, rất vui', ['他终于跑到了。', '我终于完成了作业。'], '终于 đứng trước động từ, thường đi với 了.'),
    ('干净', '🧼✨', 'Căn bếp sạch bóng sau khi lau dọn', ['厨房非常干净。', '她把房间打扫得很干净。'], '干净 là tính từ: 很干净; bổ ngữ: 打扫得很干净.'),
    ('害怕', '😨🐕', 'Bé gái sợ hãi khi thấy con chó to', ['她很害怕那只狗。', '小女孩儿害怕大狗。'], '害怕 + đối tượng.'),
], 1):
    ws3.append({'id': f'wp3-ws-{i:02d}', 'type': 'write_sentence', 'prompt_vi': 'Nhìn hình, dùng từ cho sẵn viết một câu hoàn chỉnh.',
                'keyword': T(kw), 'image': {'emoji': em, 'alt_vi': alt}, 'min_chars': 5, 'sample_answers': samples,
                'max_points': 2, 'rubric_id': 'rb-w-sentence', 'answer': None, 'explanation_vi': ex})
ro3 = reorder('wp3', [
    (['把', '请', '门', '关上'], '请把门关上。', None, 'Câu 把: 把 + tân ngữ + động từ + thành phần khác.'),
    (['被', '我的自行车', '骑走了', '弟弟'], '我的自行车被弟弟骑走了。', None, 'Câu bị động 被: vật + 被 + người + động từ + kết quả.'),
    (['越来越', '天气', '冷', '了'], '天气越来越冷了。', None, '越来越 + tính từ = càng ngày càng.'),
    (['除了', '都', '小王', '大家', '来了'], '除了小王，大家都来了。', None, '除了……，都……: ngoài … ra, đều ….'),
    (['不但', '而且', '他', '会说汉语', '会写汉字'], '他不但会说汉语，而且会写汉字。', None, '不但……而且……: không những … mà còn ….'),
    (['得', '她', '流利', '说', '汉语', '很'], '她汉语说得很流利。', None, 'Bổ ngữ trình độ có tân ngữ: (说)汉语 + 说得 + 很流利; động từ thứ nhất có thể lược.'),
    (['一边', '一边', '他', '吃饭', '看电视'], '他一边吃饭一边看电视。', None, '一边……一边……: vừa … vừa ….'),
    (['如果', '就', '明天下雨', '我们', '不去了'], '如果明天下雨，我们就不去了。', None, '如果……就……: nếu … thì ….'),
    (['对', '感兴趣', '我', '中国文化', '很'], '我对中国文化很感兴趣。', None, '对 + đối tượng + 感兴趣.'),
    (['比', '多了', '今天', '昨天', '冷'], '今天比昨天冷多了。', None, 'So sánh mức độ: A 比 B + tính từ + 多了.'),
    (['已经', '三年', '了', '我', '学汉语', '学了'], '我学汉语已经学了三年了。', None, 'Bổ ngữ thời lượng: động từ + 了 + thời gian.'),
    (['给', '介绍', '一下', '我', '你'], '我给你介绍一下。', None, '给 + người + 介绍: giới thiệu cho ai.'),
    (['才', '他', '十点', '起床', '今天'], '他今天十点才起床。', ['今天他十点才起床。'], '才 = mới (muộn hơn dự kiến), đứng trước động từ.'),
    (['把', '作业', '完成了', '我', '已经'], '我已经把作业完成了。', None, 'Phó từ (已经) đứng trước 把.'),
    (['只要', '就', '你', '努力', '能学好'], '只要你努力，就能学好。', None, '只要……就……: chỉ cần … thì ….'),
], 3)

RUB = [{'id': 'rb-w-sentence', 'max_score': 2, 'criteria': [
    {'key': 'vocab_grammar', 'name_vi': 'Từ khóa & ngữ pháp', 'weight': 0.5, 'description_vi': 'Dùng đúng từ cho sẵn, câu đúng ngữ pháp.'},
    {'key': 'content', 'name_vi': 'Phù hợp hình', 'weight': 0.3, 'description_vi': 'Câu đúng nội dung hình, ý trọn vẹn.'},
    {'key': 'characters', 'name_vi': 'Chữ Hán', 'weight': 0.2, 'description_vi': 'Viết đúng chữ, có dấu câu.'}]}]
files = {
    1: [{'id': 'wp1-reorder', 'level': 1, 'type': 'reorder_words', 'title_vi': 'Sắp xếp từ thành câu – HSK 1', 'questions': ro1},
        {'id': 'wp1-hanzi', 'level': 1, 'type': 'write_hanzi_from_pinyin', 'title_vi': 'Viết chữ Hán theo pinyin – HSK 1', 'questions': wh1}],
    2: [{'id': 'wp2-component', 'level': 2, 'type': 'choose_component', 'title_vi': 'Chọn bộ kiện hoàn thành chữ – HSK 2', 'shared_options': comp_opts, 'questions': cc},
        {'id': 'wp2-hanzi', 'level': 2, 'type': 'write_hanzi_from_pinyin', 'title_vi': 'Viết chữ Hán theo pinyin – HSK 2', 'questions': wh2},
        {'id': 'wp2-reorder', 'level': 2, 'type': 'reorder_words', 'title_vi': 'Sắp xếp từ thành câu – HSK 2', 'questions': ro2}],
    3: [{'id': 'wp3-hanzi', 'level': 3, 'type': 'write_hanzi_from_pinyin', 'title_vi': 'Viết chữ Hán theo pinyin – HSK 3', 'questions': wh3},
        {'id': 'wp3-sentence', 'level': 3, 'type': 'write_sentence', 'title_vi': 'Nhìn hình đặt câu – HSK 3', 'questions': ws3},
        {'id': 'wp3-reorder', 'level': 3, 'type': 'reorder_words', 'title_vi': 'Sắp xếp từ thành câu – HSK 3 (luyện ngữ pháp)', 'questions': ro3}],
}
for lv, sets in files.items():
    d = {'level': lv, 'sets': sets}
    if lv == 3:
        d['rubrics'] = RUB
    json.dump(d, open(f'{OUT}/practice-hsk{lv}.json', 'w', encoding='utf-8'), ensure_ascii=False, indent=2)
    for s in sets:
        print(lv, s['id'], len(s['questions']))
        for q in s['questions']:
            t = q.get('answer') or ''
            if isinstance(t, str) and len(t) > 1:
                b = check(t, lv)
                if b: print('   LV', t, b)
