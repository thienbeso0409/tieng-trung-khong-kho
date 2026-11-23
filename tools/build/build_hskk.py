import json, sys, os
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
from pyh import P, Z
OUT = '/home/claude/tieng-trung-khong-kho/data/speaking'


def T(zh, vi=None, py=True):
    d = {'zh': Z(zh)}
    if py:
        d['pinyin'] = P(zh)
    if vi:
        d['vi'] = vi
    return d


def AU(text, sp='女'):
    return {'lines': [{'speaker': sp, 'text': Z(text)}], 'repeat': 1}


RUBRICS = [
    {'id': 'rb-repeat', 'max_score': 10, 'criteria': [
        {'key': 'accuracy', 'name_vi': 'Độ chính xác nội dung', 'weight': 0.6, 'description_vi': 'Nhắc lại đúng, đủ các từ của câu gốc, đúng trật tự.'},
        {'key': 'pronunciation', 'name_vi': 'Phát âm & thanh điệu', 'weight': 0.4, 'description_vi': 'Thanh điệu, âm đầu, vần chuẩn; ngắt nghỉ tự nhiên.'}]},
    {'id': 'rb-describe', 'max_score': 10, 'criteria': [
        {'key': 'content', 'name_vi': 'Đúng nội dung ảnh', 'weight': 0.4, 'description_vi': 'Câu nói mô tả đúng hoạt động/sự vật chính trong ảnh.'},
        {'key': 'vocab_grammar', 'name_vi': 'Từ vựng & ngữ pháp', 'weight': 0.35, 'description_vi': 'Câu hoàn chỉnh, đúng ngữ pháp, dùng từ phù hợp cấp HSK3.'},
        {'key': 'pronunciation', 'name_vi': 'Phát âm & thanh điệu', 'weight': 0.25, 'description_vi': 'Phát âm rõ, thanh điệu đúng.'}]},
    {'id': 'rb-answer-short', 'max_score': 10, 'criteria': [
        {'key': 'relevance', 'name_vi': 'Trả lời đúng trọng tâm', 'weight': 0.4, 'description_vi': 'Hiểu câu hỏi và trả lời đúng ý.'},
        {'key': 'grammar', 'name_vi': 'Ngữ pháp & từ vựng', 'weight': 0.3, 'description_vi': 'Câu đúng ngữ pháp, dùng từ chính xác.'},
        {'key': 'pronunciation', 'name_vi': 'Phát âm & thanh điệu', 'weight': 0.3, 'description_vi': 'Phát âm rõ ràng, thanh điệu đúng.'}]},
    {'id': 'rb-speech', 'max_score': 10, 'criteria': [
        {'key': 'content', 'name_vi': 'Nội dung', 'weight': 0.3, 'description_vi': 'Đúng đề, đủ ý, có chi tiết/ví dụ, mạch lạc (mở–thân–kết).'},
        {'key': 'fluency', 'name_vi': 'Độ lưu loát', 'weight': 0.25, 'description_vi': 'Nói liên tục, ít ngập ngừng, dùng từ nối (首先、然后、所以…).'},
        {'key': 'vocab_grammar', 'name_vi': 'Từ vựng & ngữ pháp', 'weight': 0.25, 'description_vi': 'Từ vựng phong phú đúng cấp, câu phức đúng ngữ pháp.'},
        {'key': 'pronunciation', 'name_vi': 'Phát âm & thanh điệu', 'weight': 0.2, 'description_vi': 'Thanh điệu, ngữ điệu tự nhiên, người nghe hiểu dễ dàng.'}]},
    {'id': 'rb-present', 'max_score': 10, 'criteria': [
        {'key': 'content', 'name_vi': 'Khai thác tài liệu', 'weight': 0.3, 'description_vi': 'Nắm ý chính của tài liệu, trình bày có phân tích và quan điểm.'},
        {'key': 'organization', 'name_vi': 'Bố cục', 'weight': 0.2, 'description_vi': 'Có mở đầu, luận điểm rõ, kết luận.'},
        {'key': 'vocab_grammar', 'name_vi': 'Ngôn ngữ', 'weight': 0.3, 'description_vi': 'Dùng từ ngữ trang trọng, chính xác, đa dạng cấu trúc cao cấp.'},
        {'key': 'fluency', 'name_vi': 'Lưu loát & phát âm', 'weight': 0.2, 'description_vi': 'Trôi chảy, ngữ điệu tự nhiên.'}]},
]

PARTS = {
    3: [('hsk3-1', 'repeat', 'Nghe và nhắc lại', '听后重复', 'Nghe một câu (7–10 chữ) một lần, nhắc lại chính xác.', 8, 0, 10, 'rb-repeat'),
        ('hsk3-2', 'describe_picture', 'Nhìn ảnh nói một câu', '看图说话', 'Nhìn ảnh, dùng MỘT câu hoàn chỉnh nói nội dung ảnh.', 5, 0, 15, 'rb-describe'),
        ('hsk3-3', 'answer_question', 'Trả lời câu hỏi', '回答问题', 'Đọc câu hỏi (chỉ chữ Hán), chuẩn bị rồi trả lời thành đoạn.', 2, 180, 90, 'rb-speech')],
    4: [('hsk4-1', 'retell', 'Nghe rồi thuật lại', '听后复述', 'Nghe đoạn ngắn (14–20 giây) một lần, thuật lại nội dung.', 2, 0, 40, 'rb-speech'),
        ('hsk4-2', 'picture_story', 'Kể chuyện theo 3 tranh', '看图说话', 'Xem 3 tranh theo thứ tự, chuẩn bị rồi kể thành câu chuyện.', 1, 180, 120, 'rb-speech'),
        ('hsk4-3', 'answer_question', 'Trả lời câu hỏi', '回答问题', 'Đọc câu hỏi, chuẩn bị rồi trình bày quan điểm.', 2, 210, 120, 'rb-speech')],
    5: [('hsk5-1', 'retell', 'Nghe rồi thuật lại', '听后复述', 'Nghe đoạn (30–36 giây) một lần, thuật lại ý chính và chi tiết quan trọng.', 2, 0, 90, 'rb-speech'),
        ('hsk5-2', 'picture_story', 'Kể chuyện theo 3 tranh', '看图说话', 'Kể câu chuyện hoàn chỉnh theo 3 tranh, có diễn biến và kết thúc.', 1, 180, 120, 'rb-speech'),
        ('hsk5-3', 'answer_question', 'Trả lời câu hỏi', '回答问题', 'Trình bày quan điểm có lập luận và ví dụ.', 2, 210, 150, 'rb-speech')],
    6: [('hsk6-1', 'retell', 'Nghe rồi thuật lại', '听后复述', 'Nghe đoạn (30–36 giây) một lần, thuật lại chính xác, mạch lạc.', 2, 0, 90, 'rb-speech'),
        ('hsk6-2', 'picture_story', 'Kể chuyện theo 4 tranh', '看图说话', 'Kể câu chuyện theo 4 tranh, có tình tiết và ý nghĩa.', 1, 180, 120, 'rb-speech'),
        ('hsk6-3', 'answer_question', 'Trả lời câu hỏi', '回答问题', 'Nghị luận về một vấn đề xã hội, có luận điểm và dẫn chứng.', 2, 210, 150, 'rb-speech')],
    '7-9': [('hsk7-9-1', 'present_material', 'Trình bày theo tài liệu', '材料陈述', 'Đọc tài liệu, chuẩn bị rồi trình bày, phân tích và nêu quan điểm.', 1, 120, 180, 'rb-present'),
            ('hsk7-9-2', 'listen_answer', 'Nghe rồi trả lời', '听后回答', 'Nghe một đoạn, trả lời câu hỏi liên quan.', 3, 0, 60, 'rb-speech'),
            ('hsk7-9-3', 'answer_question', 'Trả lời quan điểm', '观点表达', 'Trình bày quan điểm về một vấn đề phức tạp.', 1, 180, 180, 'rb-speech')],
}
NAMES = {3: 'Bài nói HSK 3', 4: 'Bài nói HSK 4', 5: 'Bài nói HSK 5', 6: 'Bài nói HSK 6', '7-9': 'Bài nói HSK 7–9'}
PI = {}
for lv, parts in PARTS.items():
    for code, typ, *rest in parts:
        PI[code] = (typ, rest)

items = []
papers = []
cnt = {}


import jieba as _jb
STOPW = set('的 了 吗 呢 吧 着 过 我 你 他 她 它 我们 你们 他们 是 在 很 也 都 就 和 把 被 请 一 个 这 那 不 没 要 会 能 有'.split())
def fix_kw(kw, text):
    kw = [k for k in kw if k]
    if len(kw) >= 2:
        return kw[:8]
    for t in _jb.cut(Z(text)):
        if len(kw) >= 4: break
        if any('\u4e00' <= c <= '\u9fff' for c in t) and t not in STOPW and t not in kw and len(t) >= 1 and not all(c in '，。？！' for c in t):
            if len(t) >= 2 or len(kw) < 2:
                kw.append(t)
    return kw[:8]


def add(lv, code, prompt, sample, kw, audio=None, image=None, images=None, py=True, in_paper=False):
    cnt[lv] = cnt.get(lv, 0) + 1
    typ, (nv, nz, ins, real, prep, ans, rub) = PI[code]
    it = {'id': f'hsk{lv}-s-{cnt[lv]:02d}', 'level': lv, 'part': code, 'type': typ, 'prompt': prompt,
          'audio': audio, 'image': image}
    if images:
        it['images'] = images
    it.update({'prep_seconds': prep, 'answer_seconds': ans, 'sample_answer': sample, 'keywords': fix_kw(list(kw), sample['zh']), 'rubric_id': rub,
               'in_paper': in_paper})
    items.append(it)
    return it['id']


def IM(e, a):
    return {'emoji': e, 'alt_vi': a}

# ===================== HSK3 =====================
REP3 = [('我每天早上七点起床。', 'Mỗi sáng tôi dậy lúc bảy giờ.'), ('这家饭馆的菜很好吃。', 'Món ăn ở quán này rất ngon.'),
        ('明天下午我们去爬山吧。', 'Chiều mai chúng ta đi leo núi nhé.'), ('他的汉语说得很流利。', 'Anh ấy nói tiếng Trung rất lưu loát.'),
        ('请帮我把门关上。', 'Làm ơn đóng cửa giúp tôi.'), ('图书馆周末也开门。', 'Thư viện cuối tuần cũng mở cửa.'),
        ('我已经习惯这里的天气了。', 'Tôi đã quen với thời tiết ở đây rồi.'), ('你最近工作忙不忙？', 'Dạo này công việc bạn có bận không?'),
        # bank
        ('我妹妹比我小三岁。', 'Em gái tôi nhỏ hơn tôi ba tuổi.'), ('这个周末我想在家休息。', 'Cuối tuần này tôi muốn nghỉ ở nhà.'),
        ('别担心，他马上就到。', 'Đừng lo, anh ấy đến ngay.'), ('我对中国文化很感兴趣。', 'Tôi rất hứng thú với văn hóa Trung Quốc.'), ('这件衬衫比那件便宜。', 'Chiếc áo sơ mi này rẻ hơn chiếc kia.'), ('外边太冷了，别出去了。', 'Bên ngoài lạnh quá, đừng ra ngoài nữa.')]
DES3 = [(('🧒⚽', 'Cậu bé đang đá bóng trên sân cỏ'), '男孩儿在草地上踢足球。', ['踢', '足球']),
        (('👩‍🍳🍳', 'Người phụ nữ đang nấu ăn trong bếp'), '妈妈正在厨房做饭。', ['做饭']),
        (('🚴🌳', 'Một người đạp xe trong công viên'), '他在公园里骑自行车。', ['骑', '自行车']),
        (('👧📱😊', 'Cô gái vừa gọi điện thoại vừa cười'), '她一边打电话一边笑。', ['打电话', '笑']),
        (('🌧️☂️🚶', 'Trời mưa, một người cầm ô đi trên đường'), '外边下雨了，他打着伞走路。', ['下雨', '伞']),
        # bank
        (('👨‍🏫📖', 'Thầy giáo đang giảng bài trong lớp'), '老师正在给学生们上课。', ['老师', '上课']),
        (('🎂🕯️👨‍👩‍👧', 'Cả nhà quây quanh bánh sinh nhật'), '全家人在一起过生日。', ['生日']),
        (('🧳✈️', 'Người kéo vali ở sân bay'), '他拿着行李箱在机场等飞机。', ['机场', '行李箱'])]
ANS3 = [('你周末一般做什么？请说一说。', 'Cuối tuần bạn thường làm gì? Hãy kể.', '我周末一般很忙。星期六上午我去图书馆复习汉语，下午和朋友一起去打篮球。星期天我常常在家打扫房间、洗衣服，有时候也做几个菜，请朋友来我家吃饭。我觉得这样的周末又轻松又有意思。', ['周末', '一般', '然后', '朋友']),
        ('你为什么学习汉语？学习汉语的时候遇到过什么困难？', 'Tại sao bạn học tiếng Trung? Bạn gặp khó khăn gì?', '我学习汉语是因为我对中国文化很感兴趣，而且以后想去中国工作。刚开始学的时候，我觉得声调和汉字最难，常常说错、写错。后来老师告诉我要多听多说，我每天坚持练习，现在我的汉语水平提高了很多。', ['因为', '困难', '汉字', '练习']),
        # bank
        ('请介绍一下你的家乡。', 'Hãy giới thiệu quê hương bạn.', '我的家乡在越南北部，是一个不大的城市。那里的人很热情，东西也比较便宜。春天的时候，天气很舒服，到处都是花。我最喜欢家乡的米粉，又香又好吃。欢迎你去我的家乡玩儿。', ['家乡', '热情', '天气', '好吃']),
        ('你最好的朋友是谁？他/她是一个什么样的人？', 'Bạn thân nhất của bạn là ai? Là người thế nào?', '我最好的朋友叫小林，我们是中学同学。他个子很高，很聪明，也很热情。我遇到困难的时候，他总是第一个来帮助我。虽然现在我们不在一个城市，但是我们常常打电话聊天。', ['朋友', '热情', '帮助', '常常'])]
p3 = []
for i, (zh, vi) in enumerate(REP3):
    x = add(3, 'hsk3-1', T(zh, vi), T(zh, vi), [w for w in ['起床', '好吃', '爬山', '流利', '关上', '开门', '习惯', '忙', '小', '休息', '担心', '感兴趣', '便宜', '冷'] if w in zh] or [zh[:2]], audio=AU(zh, '女' if i % 2 == 0 else '男'), in_paper=i < 8)
    if i < 8: p3.append(x)
for i, (im, sample, kw) in enumerate(DES3):
    x = add(3, 'hsk3-2', T('请用一句话说说图片的内容。', 'Hãy dùng một câu nói nội dung bức ảnh.'), T(sample), kw, image=IM(*im), in_paper=i < 5)
    if i < 5: p3.append(x)
for i, (q, qvi, sample, kw) in enumerate(ANS3):
    x = add(3, 'hsk3-3', T(q, qvi), T(sample), kw, in_paper=i < 2)
    if i < 2: p3.append(x)
papers.append({'id': 'hsk3-de1-speaking', 'level': 3, 'title_vi': 'Đề nói HSK 3 – Đề 1', 'warmup': True, 'prep_total_seconds': 360, 'item_ids': p3})

# ===================== HSK4 =====================
RET4 = [('我以前每天开车上班，路上常常堵车，又累又浪费时间。后来我换成了坐地铁，不但更快，而且可以在车上看书。现在我觉得上班的路上也很有意思。',
         '他以前开车上班，常常堵车，又累又浪费时间。后来他改坐地铁，又快又能在车上看书，所以现在觉得上班路上很有意思。', ['开车', '堵车', '地铁', '看书']),
        ('很多人觉得运动一定要去健身房，其实不一定。每天下班后散步半个小时，周末去爬爬山，也是很好的锻炼方法。最重要的是坚持。',
         '很多人以为运动必须去健身房，其实每天散步半小时、周末爬山也是很好的锻炼。最重要的是坚持。', ['运动', '散步', '锻炼', '坚持']),
        # bank
        ('我的邻居是一位七十多岁的老人，他每天早上都在楼下的公园里打太极拳。他说，打太极拳让他身体健康，心情也很好。',
         '我的邻居是一位七十多岁的老人，每天早上在公园打太极拳，他说这让他身体健康、心情好。', ['邻居', '太极拳', '健康']),
        ('上个月我在网上买了一件衣服，收到以后发现颜色和照片上的不一样。我联系了客服，他们很快就帮我换了一件。',
         '他上个月网购了一件衣服，颜色和照片不一样，联系客服后很快就换了。', ['网上', '颜色', '客服', '换']),
        ('现在很多年轻人喜欢一个人去旅行。他们觉得一个人旅行比较自由，想去哪儿就去哪儿，还能认识很多新朋友。',
         '很多年轻人喜欢一个人旅行，因为比较自由，想去哪儿就去哪儿，还能交新朋友。', ['旅行', '自由', '朋友']),
        ('学习外语的时候，很多人怕说错，所以不敢开口。其实说错不要紧，只有多说多练，才能真正提高口语水平。',
         '学外语时很多人怕说错不敢说，其实说错不要紧，多说多练才能提高口语。', ['外语', '说错', '口语', '提高'])]
PIC4 = [([IM('🧑⏰😴', 'Tranh 1: chuông báo thức reo, chàng trai vẫn ngủ'), IM('🧑🏃💨', 'Tranh 2: anh ấy vội vàng chạy ra bến xe'), IM('🚌👋', 'Tranh 3: xe buýt vừa chạy mất, anh ấy đứng nhìn theo')],
         '今天早上，小王的闹钟响了，可是他太累了，没有起来。等他醒来的时候，已经八点了。他马上穿好衣服，跑着去车站。可是他到车站的时候，公共汽车刚刚开走。小王很后悔，决定以后晚上早点儿睡觉。', ['闹钟', '起床', '车站', '后悔']),
        # bank
        ([IM('👵🛍️', 'Tranh 1: bà cụ xách nhiều túi đồ nặng'), IM('🧒🤝', 'Tranh 2: một cậu bé chạy đến giúp xách đồ'), IM('👵🍎🧒', 'Tranh 3: bà cụ cảm ơn và tặng cậu bé quả táo')],
         '一位老奶奶从超市出来，手里拿着很多东西，走得很慢。一个小男孩儿看见了，马上跑过去帮她拿东西，一直把她送到家门口。老奶奶非常感动，送给小男孩儿一个大苹果，夸他是个好孩子。', ['帮助', '感动', '送']),
        ([IM('🧑‍🍳📱', 'Tranh 1: chàng trai xem điện thoại học nấu ăn'), IM('🔥😱', 'Tranh 2: chảo bốc khói, anh ấy hoảng hốt'), IM('🍜😄👫', 'Tranh 3: cuối cùng nấu thành công, mời bạn gái ăn')],
         '小李想给女朋友做一顿饭，就在手机上找做菜的方法。第一次做的时候，他太紧张了，菜都做糊了，厨房里全是烟。但是他没有放弃，又试了几次，终于做好了一碗面条。女朋友吃了以后说特别好吃，小李高兴极了。', ['做饭', '放弃', '终于']),
        ([IM('🐕🏞️', 'Tranh 1: cô gái dắt chó đi dạo công viên'), IM('🐕💨😟', 'Tranh 2: con chó chạy mất, cô gái lo lắng'), IM('👮🐕😊', 'Tranh 3: một chú bảo vệ dắt con chó trả lại')],
         '周末，小美带着她的小狗去公园散步。突然，小狗看见了一只猫，一下子就跑走了。小美找了很久也没找到，非常着急。后来，公园的保安叔叔把小狗送了回来。小美连忙向他表示感谢。', ['散步', '着急', '感谢'])]
ANS4 = [('你觉得大学生应该一边上学一边打工吗？为什么？', '我认为大学生可以适当打工。首先，打工能让我们了解社会，积累工作经验。其次，自己挣钱可以减轻父母的负担，也能学会怎样合理地花钱。但是，打工不能影响学习，因为学习才是学生最主要的任务。所以我觉得周末或者假期打工比较合适。', ['打工', '经验', '影响', '首先', '其次']),
        ('你更喜欢在大城市生活还是在小城市生活？请说说你的理由。', '我更喜欢在大城市生活。第一，大城市的工作机会多，收入也比较高。第二，大城市交通方便，有很多博物馆、电影院，生活很丰富。当然，大城市压力大、房子贵，但是对年轻人来说，在大城市可以学到更多东西，所以我选择大城市。', ['城市', '机会', '交通', '压力', '理由']),
        # bank
        ('你觉得网上购物有哪些好处和坏处？', '网上购物的好处很多：不用出门，东西多，价格也比较便宜。可是它也有坏处，比如有时候收到的东西质量不好，或者跟照片不一样。另外，因为太方便，很多人会买很多不需要的东西。所以网上购物的时候我们要多比较，买需要的东西。', ['好处', '坏处', '质量', '比较']),
        ('如果你有一个月的假期，你打算做什么？', '如果我有一个月的假期，我打算先回老家陪父母一个星期，因为平时工作忙，很少有时间陪他们。然后我想去中国旅行，去北京看看长城，去西安吃小吃，顺便练习我的汉语。最后几天我会在家好好休息，准备开始新的工作。', ['假期', '打算', '旅行', '休息']),
        ('你认为学好一门外语最重要的是什么？', '我认为学好外语最重要的是坚持和多练习。语言是用来交流的，只看书不说话是学不好的。我们应该多找机会和母语者聊天，多听多说，不要怕说错。另外，每天学一点儿，比一个星期学一天效果更好。只要坚持下去，就一定能学好。', ['坚持', '练习', '交流', '效果'])]
p4 = []
for i, (tx, samp, kw) in enumerate(RET4):
    x = add(4, 'hsk4-1', T('请听一段话，然后复述。', 'Nghe một đoạn, sau đó thuật lại.'), T(samp), kw, audio=AU(tx, '男' if i % 2 else '女'), in_paper=i < 2)
    if i < 2: p4.append(x)
for i, (ims, samp, kw) in enumerate(PIC4):
    x = add(4, 'hsk4-2', T('请根据下面三张图片讲一个故事。', 'Hãy kể một câu chuyện dựa theo ba bức tranh.'), T(samp), kw, images=ims, in_paper=i < 1)
    if i < 1: p4.append(x)
for i, (q, samp, kw) in enumerate(ANS4):
    x = add(4, 'hsk4-3', T(q), T(samp), kw, in_paper=i < 2)
    if i < 2: p4.append(x)
papers.append({'id': 'hsk4-de1-speaking', 'level': 4, 'title_vi': 'Đề nói HSK 4 – Đề 1', 'warmup': True, 'prep_total_seconds': 600, 'item_ids': p4})

# ===================== HSK5 =====================
RET5 = [('有一位年轻人去面试，面试官问了很多专业问题，他都回答得很好。最后，面试官让他把门口的一张纸捡起来。年轻人觉得很奇怪，但还是照做了。后来他才知道，那张纸是面试官故意放的，前面几位应聘者都没有注意到，而他正是因为这个细节得到了工作。这个故事告诉我们，细节往往决定成败。',
         '一个年轻人面试时专业问题回答得很好，面试官最后让他捡起门口的一张纸。这张纸是故意放的，前面的人都没注意，他因为注意到这个细节得到了工作。说明细节决定成败。', ['面试', '细节', '注意', '成败']),
        ('现在越来越多的城市开始提供共享单车。人们用手机扫一下就能骑车，到了目的地随便停在路边就可以，非常方便。共享单车不但减少了汽车尾气，还让人们有了锻炼身体的机会。不过，也有一些人乱停乱放，影响了交通，所以需要加强管理。',
         '很多城市有共享单车，手机一扫就能骑，很方便，还能减少尾气、锻炼身体。但有人乱停乱放影响交通，需要加强管理。', ['共享单车', '方便', '减少', '管理']),
        # bank
        ('心理学家做过一个实验：让两组学生做同样的题。第一组做完后，老师表扬他们聪明；第二组做完后，老师表扬他们努力。结果下一次，第二组学生更愿意选择难的题目。研究者认为，表扬孩子的努力比表扬聪明更能让他们勇敢面对挑战。',
         '实验中老师分别表扬两组学生聪明和努力，被表扬努力的那组后来更愿意选难题。所以表扬努力比表扬聪明更能让孩子面对挑战。', ['实验', '表扬', '努力', '挑战']),
        ('很多人喜欢在睡觉前玩手机，可是专家提醒，手机屏幕发出的光会影响大脑，让人更难入睡。长期睡眠不好，不但会让人白天没有精神，还可能引起各种健康问题。专家建议，睡前一个小时最好放下手机，看看书或者听听轻音乐。',
         '专家说睡前玩手机会影响大脑，使人难以入睡，长期睡眠不好影响健康。建议睡前一小时放下手机，看书或听轻音乐。', ['睡眠', '手机', '健康', '建议']),
        ('一个小男孩儿在沙滩上捡起被海浪冲上岸的小鱼，一条一条地扔回大海。有人对他说：“沙滩上有这么多鱼，你根本救不完，有什么意义呢？”男孩儿一边扔一边说：“这条鱼在乎，这条也在乎。”',
         '小男孩儿把被冲上沙滩的小鱼一条条扔回海里。有人说鱼太多救不完没有意义，男孩儿说每一条被救的鱼都在乎。说明做一点儿也有意义。', ['救', '意义', '在乎']),
        ('中国有句老话叫“读万卷书，行万里路”。意思是说，读书很重要，但只读书还不够，还要走出去，亲眼看看外面的世界。旅行能让我们了解不同的文化，开阔眼界，也能让书本上的知识变得更加生动。',
         '“读万卷书，行万里路”说明读书重要，但也要出去旅行、看世界。旅行能了解不同文化、开阔眼界，让书本知识更生动。', ['读书', '旅行', '文化', '眼界'])]
PIC5 = [([IM('👨‍💼💻🌙', 'Tranh 1: người đàn ông làm việc khuya bên máy tính'), IM('🏥😷', 'Tranh 2: ông ấy ngất xỉu, phải vào viện'), IM('🏃‍♂️👨‍👩‍👧🌳', 'Tranh 3: sau đó ông chạy bộ cùng gia đình trong công viên')],
         '张先生是一家公司的经理，工作非常努力，经常加班到深夜，几乎没有时间休息，也很少陪家人。有一天，他在办公室突然晕倒了，被送进了医院。医生告诉他，这是因为长期太累，身体出了问题。出院以后，张先生改变了自己的生活习惯，每天按时下班，周末还和家人一起去公园跑步。他终于明白，健康和家人比工作更重要。', ['加班', '健康', '改变', '明白']),
        ([IM('📚🧒😩', 'Tranh 1: cậu bé chán nản trước đống bài tập'), IM('👨‍🏫🎸', 'Tranh 2: thầy giáo dạy cậu chơi đàn ghi-ta'), IM('🎤🏆', 'Tranh 3: cậu bé đoạt giải cuộc thi âm nhạc')],
         '小明以前对学习一点儿兴趣也没有，每天看见作业就头疼。后来，音乐老师发现他很有音乐天赋，就开始教他弹吉他。慢慢地，小明对学校生活有了热情，学习也越来越认真。一年以后，他在全市的音乐比赛中得了一等奖。他说，是老师让他找到了自己的梦想。', ['兴趣', '发现', '梦想']),
        ([IM('🛍️🛍️💳', 'Tranh 1: cô gái mua sắm rất nhiều'), IM('📦📦😵', 'Tranh 2: phòng chất đầy hộp đồ chưa dùng'), IM('♻️🎁', 'Tranh 3: cô quyên góp đồ cũ cho người cần')],
         '小雨特别喜欢购物，一有打折活动就买很多东西。没过多久，她的房间里就堆满了盒子，很多衣服买回来一次都没穿过。有一天，她看到一篇关于“断舍离”的文章，很受启发。于是她把不需要的东西整理出来，捐给了需要帮助的人。从那以后，她买东西之前都会先想一想：我真的需要吗？', ['购物', '整理', '捐', '需要'])]
ANS5 = [('有人说“失败是成功之母”，你同意这个观点吗？请结合自己的经历谈一谈。', '我同意“失败是成功之母”这个观点。失败本身并不可怕，可怕的是失败以后不去思考原因。比如我第一次参加HSK考试的时候没有通过，我很难过，但是后来我分析了自己的问题，发现主要是听力不够好。于是我每天坚持听中文广播，第二次考试终于顺利通过了。所以我认为，只要我们能从失败中吸取教训，失败就会变成通向成功的台阶。', ['失败', '成功', '经历', '教训']),
        ('你认为孩子应该从小学习很多才艺吗？为什么？', '我认为孩子可以学习才艺，但不应该太多。一方面，学习音乐、画画等才艺可以培养孩子的兴趣，让他们全面发展。另一方面，如果父母为了让孩子“不输在起跑线上”而给他们报太多班，孩子就会失去玩耍的时间，压力也会很大，甚至讨厌学习。所以，最重要的是尊重孩子的兴趣，让他们选择自己真正喜欢的东西。', ['才艺', '兴趣', '压力', '尊重']),
        # bank
        ('你怎么看待“网红经济”？', '“网红经济”是互联网发展带来的新现象。它的好处是让很多普通人有了展示自己的机会，也带动了消费和就业。但是，一些网红为了流量故意制造话题，甚至传播不真实的信息，对年轻人产生了不好的影响。因此，我认为平台应该加强管理，观众也要提高判断能力，理性消费。', ['网红', '影响', '管理', '理性']),
        ('如果让你选择，你愿意做一份收入高但很忙的工作，还是收入一般但轻松的工作？', '如果让我选择，现阶段我更愿意做收入高但比较忙的工作。因为我还年轻，有精力，也希望多积累经验，为以后的发展打基础。当然，我不会为了工作完全放弃生活，我会合理安排时间，保证每周有时间运动和陪家人。等过几年经济条件稳定了，我可能会选择更轻松的工作。', ['收入', '经验', '安排', '稳定']),
        ('你觉得科技的发展让人与人之间的关系更近了还是更远了？', '我觉得科技的发展有两面性。一方面，有了手机和网络，我们可以随时和远方的家人朋友视频聊天，距离不再是问题。另一方面，很多人吃饭的时候也在看手机，面对面的交流反而越来越少。所以，关系的远近不在于科技本身，而在于我们怎样使用它。', ['科技', '关系', '交流', '使用']),
        ('你认为大学生毕业后应该马上工作，还是先继续读研究生？', '我认为这要根据个人情况来决定。如果一个人已经很清楚自己想从事什么职业，而且这个行业更看重实践经验，那么毕业后马上工作是不错的选择。相反，如果想从事研究或者专业性很强的工作，继续读研究生能打下更扎实的基础。最重要的是不要盲目跟风，要认真考虑自己的兴趣和长远规划。', ['毕业', '经验', '研究生', '规划'])]
p5 = []
for i, (tx, samp, kw) in enumerate(RET5):
    x = add(5, 'hsk5-1', T('请听一段话，然后复述。', 'Nghe một đoạn, sau đó thuật lại.'), T(samp), kw, audio=AU(tx, '男' if i % 2 else '女'), in_paper=i < 2)
    if i < 2: p5.append(x)
for i, (ims, samp, kw) in enumerate(PIC5):
    x = add(5, 'hsk5-2', T('请根据下面三张图片讲一个完整的故事。', 'Hãy kể một câu chuyện hoàn chỉnh theo ba bức tranh.'), T(samp), kw, images=ims, in_paper=i < 1)
    if i < 1: p5.append(x)
for i, (q, samp, kw) in enumerate(ANS5):
    x = add(5, 'hsk5-3', T(q), T(samp), kw, in_paper=i < 2)
    if i < 2: p5.append(x)
papers.append({'id': 'hsk5-de1-speaking', 'level': 5, 'title_vi': 'Đề nói HSK 5 – Đề 1', 'warmup': True, 'prep_total_seconds': 600, 'item_ids': p5})

# ===================== HSK6 =====================
RET6 = [('据调查，如今超过一半的年轻人有“熬夜”的习惯。他们中的很多人并不是因为工作忙，而是舍不得结束一天中属于自己的时间，这种现象被称为“报复性熬夜”。专家指出，长期熬夜会导致免疫力下降、记忆力减退。与其牺牲睡眠，不如在白天提高效率，给自己留出休息的空间。',
         '调查显示一半以上年轻人熬夜，很多不是因为工作，而是舍不得属于自己的时间，叫“报复性熬夜”。专家说长期熬夜会降低免疫力和记忆力，建议白天提高效率，而不是牺牲睡眠。', ['熬夜', '现象', '免疫力', '效率']),
        ('传统手工艺曾一度面临失传的危险，因为学习周期长、收入低，年轻人不愿意继承。近年来，一些手工艺人开始借助短视频平台展示制作过程，没想到吸引了大量观众，订单也随之增加。这说明，传统文化只要找到与现代生活结合的方式，就能焕发新的生命力。',
         '传统手工艺因为学得久、收入低，年轻人不愿继承，差点儿失传。后来手艺人用短视频展示制作过程，吸引了很多观众和订单。说明传统文化与现代结合就能有新的生命力。', ['手工艺', '失传', '短视频', '结合']),
        # bank
        ('有人做过统计，一个人一生中大约有三分之一的时间在睡眠中度过。睡眠不仅能消除疲劳，还对大脑整理记忆起着关键作用。研究发现，学习新知识后保证充足睡眠的人，第二天的记忆效果明显更好。因此，考前通宵复习其实是得不偿失的做法。',
         '人一生约三分之一时间在睡觉。睡眠能消除疲劳，还帮助大脑整理记忆。研究表明学习后睡好的人记忆更好，所以考前通宵复习得不偿失。', ['睡眠', '记忆', '研究', '得不偿失']),
        ('“慢生活”最近成为了一种流行的生活态度。它并不是提倡懒惰，而是鼓励人们放慢脚步，关注身边的美好，比如亲手做一顿饭、陪家人散步、读一本好书。在快节奏的社会里，适当地慢下来，反而能让我们更清楚自己真正想要什么。',
         '“慢生活”是一种流行态度，不是懒惰，而是放慢脚步，关注身边美好，比如做饭、散步、读书。在快节奏社会里慢下来，更能明白自己想要什么。', ['慢生活', '态度', '节奏']),
        ('一家企业招聘时，没有考专业知识，而是让应聘者分组完成一个任务。结果，能力最强的那个人并没有被录取，因为他始终不听别人的意见。招聘经理解释说，现代企业更需要的是懂得合作的人，一个人再优秀，也比不上一个团结的团队。',
         '一家企业招聘让应聘者分组做任务，能力最强的人因为不听别人意见没被录取。经理说企业需要懂合作的人，个人再优秀也比不上团结的团队。', ['招聘', '合作', '团队']),
        ('在许多国家，垃圾分类已经成为法律规定。刚开始时，不少居民觉得麻烦，常常分错。后来社区安排了志愿者在垃圾桶旁边指导，又通过手机程序提供查询功能。一年后，分类的准确率大大提高，人们也逐渐养成了习惯。可见，好的制度加上耐心的引导，才能真正改变人们的行为。',
         '很多国家把垃圾分类定为法律。居民开始嫌麻烦、常分错，后来社区派志愿者指导，用手机程序查询，一年后准确率大大提高，形成习惯。说明制度加引导才能改变行为。', ['垃圾分类', '志愿者', '习惯', '制度'])]
PIC6 = [([IM('🏚️👴🌱', 'Tranh 1: ông lão trồng cây non trên đồi trọc'), IM('😏👥', 'Tranh 2: dân làng cười nhạo ông'), IM('🌧️🌳', 'Tranh 3: nhiều năm sau cây mọc thành rừng'), IM('👨‍👩‍👧‍👦🌲😊', 'Tranh 4: dân làng cùng nhau trồng cây, nghỉ dưới bóng mát')],
         '村子后面有一座光秃秃的山，每到雨季就会发生泥石流。有一位老人决定每天上山种树。村里人都笑他，说他年纪这么大，等树长大了也看不到了。老人并不在意，二十年如一日地坚持着。许多年过去，荒山变成了一片茂密的树林，泥石流再也没有发生过。村民们终于明白了老人的良苦用心，也纷纷加入了种树的队伍。这个故事告诉我们，有些事情虽然短期看不到回报，却能造福后人。', ['坚持', '种树', '明白', '造福']),
        # bank
        ([IM('👩‍💼📱🚇', 'Tranh 1: cô gái mải xem điện thoại trên tàu điện'), IM('👵🧍', 'Tranh 2: bà cụ đứng bên cạnh không có chỗ ngồi'), IM('👦🪑', 'Tranh 3: một cậu bé đứng dậy nhường ghế'), IM('👩‍💼😳💡', 'Tranh 4: cô gái ngượng ngùng, nhận ra bài học')],
         '早高峰的地铁上人很多，一位年轻女士坐在座位上，一直低头看手机。一位提着菜篮子的老奶奶上车后，只能扶着扶手站着。这时，一个背着书包的小男孩儿站起来，礼貌地把座位让给了老奶奶。年轻女士抬头看到这一幕，脸一下子红了。从那以后，她坐地铁时总会留意身边需要帮助的人。', ['让座', '礼貌', '留意']),
        ([IM('🧑‍🔬🧪❌', 'Tranh 1: nhà khoa học thí nghiệm thất bại'), IM('🗑️📄📄', 'Tranh 2: giấy ghi chép bị vứt đầy thùng rác'), IM('☕💡', 'Tranh 3: uống cà phê, chợt nảy ra ý tưởng'), IM('🏅👏', 'Tranh 4: thành công, được mọi người vỗ tay')],
         '一位年轻的研究员为了研制一种新材料，进行了上百次实验，结果都失败了，废纸篓里堆满了记录。同事们劝他放弃，他却一次次重新分析数据。一天下午，他在喝咖啡时突然受到启发，找到了问题的关键。最终，实验取得了成功，他也获得了行业大奖。他在领奖时说：“每一次失败，都让我离成功更近一步。”', ['实验', '失败', '启发', '成功'])]
ANS6 = [('在信息爆炸的时代，有人认为“读书无用”，因为网上什么都能查到。你怎么看？', '我不同意“读书无用”的说法。首先，网上的信息虽然多，但往往零散、片面，甚至真假难辨；而系统地读书能帮助我们建立完整的知识结构，培养独立思考的能力。其次，读书的过程本身就是与作者对话、沉淀心灵的过程，这是碎片化浏览无法代替的。当然，我们也应该善于利用网络作为补充。总之，查到信息不等于获得知识，读书在今天依然不可替代。', ['信息', '系统', '思考', '不可替代']),
        ('有人说“选择比努力更重要”，你同意吗？请谈谈你的看法。', '我认为选择和努力同样重要，二者相辅相成。正确的选择决定了努力的方向，如果方向错了，越努力可能离目标越远。但是，没有努力，再好的选择也只是空想。比如两个人选择了同一个热门行业，最终取得成就的，往往是那个持续学习、不断积累的人。所以，我们应该在关键时刻慎重选择，在选定之后全力以赴。', ['选择', '努力', '方向', '相辅相成']),
        # bank
        ('城市化进程中，很多老建筑被拆除，取而代之的是高楼大厦。你认为应该如何处理城市发展与保护历史建筑的关系？', '我认为城市发展和保护历史建筑并不矛盾。老建筑承载着一座城市的记忆和文化，一旦拆除就无法恢复。政府在制定规划时，应该对有价值的老建筑进行评估和保护，同时可以通过合理改造，让它们发挥新的功能，比如变成博物馆、书店或文化中心。这样既保留了城市的个性，又能推动经济发展，实现双赢。', ['发展', '保护', '规划', '双赢']),
        ('有人认为人工智能写作会让作家失业，你怎么看？', '在我看来，人工智能写作更可能成为作家的工具，而不是替代者。人工智能可以快速生成文字、整理资料，提高写作效率；但真正打动人的作品，来自作者独特的生命体验和情感，这是机器难以模仿的。因此，作家与其担心失业，不如学会利用新技术，把更多精力放在思想深度和创造力上。', ['人工智能', '工具', '情感', '创造力']),
        ('你认为“躺平”是一种消极的生活态度吗？', '“躺平”这个词反映了一部分年轻人在高压之下的无奈。我认为不能简单地说它是消极的。如果“躺平”意味着放弃所有追求，那确实不可取；但如果它代表的是拒绝无意义的内卷、重新思考生活的价值，那么它在某种程度上也是一种理性的选择。关键在于找到适合自己的节奏，在奋斗和生活之间取得平衡。', ['躺平', '压力', '理性', '平衡']),
        ('有人主张城市应全面禁止燃油车进入市中心，你怎么看？', '我认为全面禁止燃油车进入市中心的出发点是好的，有利于减少空气污染和交通拥堵，但需要循序渐进。如果公共交通还不够完善，贸然禁止会给市民出行带来很大不便，尤其是老人和住在郊区的上班族。比较可行的做法是先设立低排放区，逐步提高收费标准，同时大力发展地铁和公交，并完善充电设施。只有替代方案到位了，禁令才能得到市民的支持。', ['污染', '循序渐进', '公共交通', '可行'])]
p6 = []
for i, (tx, samp, kw) in enumerate(RET6):
    x = add(6, 'hsk6-1', T('请听一段话，然后复述。', 'Nghe một đoạn, sau đó thuật lại.', py=False), T(samp, py=False), kw, audio=AU(tx, '男' if i % 2 else '女'), in_paper=i < 2)
    if i < 2: p6.append(x)
for i, (ims, samp, kw) in enumerate(PIC6):
    x = add(6, 'hsk6-2', T('请根据下面四张图片讲一个完整的故事。', 'Hãy kể một câu chuyện hoàn chỉnh theo bốn bức tranh.', py=False), T(samp, py=False), kw, images=ims, in_paper=i < 1)
    if i < 1: p6.append(x)
for i, (q, samp, kw) in enumerate(ANS6):
    x = add(6, 'hsk6-3', T(q, py=False), T(samp, py=False), kw, in_paper=i < 2)
    if i < 2: p6.append(x)
papers.append({'id': 'hsk6-de1-speaking', 'level': 6, 'title_vi': 'Đề nói HSK 6 – Đề 1', 'warmup': True, 'prep_total_seconds': 600, 'item_ids': p6})

# ===================== HSK7-9 =====================
L79 = '7-9'
p79 = []
MAT = [('材料：某市统计显示，2025年该市居民人均每日使用手机时间为6.2小时，其中短视频占2.4小时；与此同时，居民年均纸质书阅读量从2015年的5.1本下降到3.2本。请根据材料，谈谈数字时代阅读方式的变化及其影响，并提出你的建议。',
        '各位评委好。这份材料反映了数字时代阅读方式的深刻变化：一方面，人们的屏幕时间大幅增加，短视频成为获取信息的重要渠道；另一方面，纸质书阅读量十年间下降了近四成。我认为，这种变化有其积极意义——信息获取更便捷、更即时；但碎片化阅读也容易导致注意力下降、思考浅表化。对此，我有三点建议：第一，学校和家庭应引导青少年培养深度阅读习惯；第二，出版机构可以借助数字平台推广优质内容，实现线上线下融合；第三，个人应有意识地管理屏幕时间。总之，阅读的载体可以改变，但深度思考的能力不能丢失。',
        ['碎片化', '深度阅读', '一方面', '建议']),
       ('材料：近年来，“银发族”参与在线学习的人数快速增长，某老年大学线上课程报名人数三年增长了四倍，热门课程包括智能手机使用、书法和养生。请分析这一现象出现的原因，并谈谈社会应如何更好地满足老年人的学习需求。',
        '这份材料说明，老年人的精神文化需求正在快速增长。其原因主要有三：一是人口老龄化加快，退休群体规模扩大；二是互联网普及降低了学习门槛；三是老年人希望跟上时代、融入数字社会。为了更好地满足他们的需求，我认为，政府应加大对老年教育的投入，社区可以提供面对面的辅导，科技企业则应开发更适老化的产品。让老年人“老有所学”，也是建设学习型社会的重要一环。',
        ['老龄化', '需求', '适老化', '老有所学'])]
LA = [('近年来，越来越多的企业推行“四天工作制”。试点结果表明，员工的工作效率不降反升，离职率也明显下降。不过也有管理者担心，这种制度并不适用于所有行业，比如医疗和制造业。', '请问：试点“四天工作制”取得了什么结果？有人担心什么？',
       '试点结果显示员工工作效率不但没有下降，反而提高了，离职率也明显下降。但有管理者担心这种制度并不适用于所有行业，比如医疗和制造业。', ['效率', '离职率', '适用']),
      ('研究人员对三千名大学生进行了跟踪调查，发现每周参加两次以上体育锻炼的学生，期末成绩平均高出百分之八，焦虑程度也更低。研究者认为，运动能够促进大脑分泌有益物质，从而改善情绪和专注力。', '请问：这项研究发现了什么？研究者如何解释？',
       '研究发现每周锻炼两次以上的大学生，期末成绩平均高出百分之八，焦虑程度也更低。研究者解释说，运动能促进大脑分泌有益物质，改善情绪和专注力。', ['锻炼', '成绩', '焦虑', '专注力']),
      ('一些博物馆推出了“夜场”开放，晚上八点到十一点仍可参观，并配合讲座和音乐表演。上线首月，夜场观众中三十五岁以下的年轻人占到了七成。馆方表示，夜场让博物馆从“安静的殿堂”变成了“城市的客厅”。', '请问：博物馆夜场有什么特点？馆方怎样评价？',
       '博物馆夜场晚上八点到十一点开放，还有讲座和音乐表演，首月观众七成是三十五岁以下的年轻人。馆方认为夜场让博物馆从安静的殿堂变成了城市的客厅。', ['夜场', '年轻人', '城市的客厅'])]
OPI = [('有人认为，全球化时代学习外语的重要性会因为机器翻译的进步而下降。你是否同意？请阐述你的观点。',
        '我不同意这一观点。诚然，机器翻译的进步极大地降低了跨语言交流的门槛，在日常和商务场景中已能满足基本需求。然而，语言不仅是传递信息的工具，更是理解一种文化思维方式的钥匙。机器可以翻译字面意思，却难以准确传达语境、情感和言外之意；而真正深入的合作与信任，往往建立在对彼此文化的理解之上。此外，学习外语的过程本身能锻炼认知能力，拓宽视野。因此，在机器翻译时代，外语学习的目标或许会从“会用”转向“深知”，但其价值不会下降，反而更加凸显。',
        ['机器翻译', '文化', '诚然', '然而', '因此']),
       ('“流量至上”是否应该成为媒体的生存法则？请谈谈你的看法。',
        '我认为“流量至上”不应成为媒体的生存法则。流量固然是媒体生存的现实压力，但一味追逐流量，容易导致标题党、低俗化甚至虚假报道，损害公信力。媒体的核心价值在于提供真实、客观、有深度的信息，引导公共讨论。从长远来看，只有坚持专业主义，才能赢得受众的持久信任，而信任才是最稳定的“流量”。当然，媒体也应创新表达方式，在坚守价值与贴近受众之间找到平衡。',
        ['流量', '公信力', '专业主义', '平衡'])]
for i, (m, samp, kw) in enumerate(MAT):
    x = add(L79, 'hsk7-9-1', T(m, py=False), T(samp, py=False), kw, in_paper=i < 1)
    if i < 1: p79.append(x)
for i, (tx, q, samp, kw) in enumerate(LA):
    x = add(L79, 'hsk7-9-2', T(q, py=False), T(samp, py=False), kw, audio={'lines': [{'speaker': '女' if i % 2 == 0 else '男', 'text': tx}, {'speaker': '旁白', 'text': q}], 'repeat': 1}, in_paper=True)
    p79.append(x)
for i, (q, samp, kw) in enumerate(OPI):
    x = add(L79, 'hsk7-9-3', T(q, py=False), T(samp, py=False), kw, in_paper=i < 1)
    if i < 1: p79.append(x)
papers.append({'id': 'hsk7-9-de1-speaking', 'level': '7-9', 'title_vi': 'Đề nói HSK 7–9 – Đề 1', 'warmup': True, 'prep_total_seconds': 300, 'item_ids': p79})

levels = []
for lv, parts in PARTS.items():
    levels.append({'level': lv, 'name_vi': NAMES[lv], 'hsk_equiv': [lv] if lv != '7-9' else [7, 8, 9],
                   'parts': [{'code': c, 'type': t, 'name_vi': nv, 'name_zh': nz, 'instruction_vi': ins, 'real_count': rc,
                              'prep_seconds': pr, 'answer_seconds': an, 'rubric_id': rb} for c, t, nv, nz, ins, rc, pr, an, rb in parts]})
data = {'standard': 'HSK3.0', 'notes': 'Bài thi nói HSK 3.0 (Phụ lục A.4). Item có in_paper=true thuộc đề nói chính thức (papers); còn lại là ngân hàng luyện tập. Nội dung tự soạn.',
        'levels': levels, 'rubrics': RUBRICS, 'papers': papers, 'items': items}
json.dump(data, open(f'{OUT}/hskk.json', 'w', encoding='utf-8'), ensure_ascii=False, indent=2)
import collections
print('items', len(items), collections.Counter((str(i['level']), i['in_paper']) for i in items))
for p in papers: print(p['id'], len(p['item_ids']))
