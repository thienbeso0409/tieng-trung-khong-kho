from exlib import *

E = Exam('hsk1-de1', 1, duration_minutes=40, total_score=200, pass_score=120, show_pinyin=True,
         score_mode='pass', speaking_paper=None, repeat_default=2, rubrics=[],
         notes='Đề tự soạn theo cấu trúc HSK 3.0 cấp 1 (Phụ lục A.2). Từ vựng trong phạm vi HSK 1.')
LS = E.section('listening', 'Nghe', '听力', 15)
RS = E.section('reading', 'Đọc', '阅读', 20)

# ---------- L1 choose_image ----------
p = E.part(LS, 'L1', 'choose_image', 'Nghe và chọn hình đúng (A, B hoặc C).', '第一部分：听录音，选择正确的图片。')
g = E.group(p)
L1 = [
    ('女', '我想喝水。', [('🍵', 'Một tách trà nóng'), ('🥛💧', 'Một cốc nước lọc'), ('☕', 'Một cốc cà phê')], 'B',
     '喝水 = uống nước → hình cốc nước (B). Trà là 茶, không phải 水.'),
    ('男', '他在打电话。', [('🧑📞', 'Một người đàn ông đang gọi điện thoại'), ('🧑📺', 'Một người đang xem tivi'), ('🧑📖', 'Một người đang đọc sách')], 'A',
     '打电话 = gọi điện thoại → hình A. 看电视 là xem tivi, 看书 là đọc sách.'),
    ('女', '今天下雨了。', [('☀️', 'Trời nắng to'), ('🌬️', 'Trời có gió to'), ('🌧️☂️', 'Trời đang mưa, người cầm ô')], 'C',
     '下雨 = mưa → hình C.'),
    ('男', '我坐飞机去北京。', [('🚆', 'Tàu hỏa'), ('✈️', 'Máy bay'), ('🚕', 'Taxi')], 'B',
     '飞机 = máy bay → hình B. 火车 là tàu hỏa, 出租车 là taxi.'),
    ('女', '桌子上有三本书。', [('📚', 'Ba quyển sách trên bàn'), ('📕', 'Một quyển sách trên bàn'), ('🖊️🖊️🖊️', 'Ba cái bút trên bàn')], 'A',
     '三本书 = ba quyển sách → hình A. Chú ý số lượng (三) và đồ vật (书).'),
]
for sp, tx, ims, ans, ex in L1:
    E.q(p, g, audio=AU((sp, tx)), options=opts_img(*ims), answer=ans, explanation_vi=ex)

# ---------- L2 choose_option (question null) ----------
p = E.part(LS, 'L2', 'choose_option', 'Nghe một câu, chọn câu đáp lại phù hợp (A, B hoặc C).', '第二部分：听录音，选择正确的回答。')
g = E.group(p)
L2 = [
    ('男', '你叫什么名字？', ['我八岁。', '我叫王明。', '我是老师。'], 'B', 'Hỏi tên (叫什么名字) → trả lời 我叫王明 (B).'),
    ('女', '谢谢你！', ['不客气。', '对不起。', '再见。'], 'A', 'Đáp lại lời cảm ơn (谢谢) dùng 不客气 = không có gì.'),
    ('男', '你家有几口人？', ['我家在北京。', '我很好。', '四口人。'], 'C', 'Hỏi nhà có mấy người (几口人) → 四口人 (C). A trả lời "ở đâu" nên sai.'),
    ('女', '你明天去学校吗？', ['去，我上午有课。', '他是学生。', '学校很大。'], 'A', 'Câu hỏi có/không (去……吗) → 去 + lý do (A).'),
    ('男', '现在几点了？', ['星期三。', '十点半。', '五月。'], 'B', 'Hỏi giờ (几点) → 十点半 = 10 giờ rưỡi (B). 星期三 là thứ, 五月 là tháng.'),
]
for sp, tx, ops, ans, ex in L2:
    E.q(p, g, audio=AU((sp, tx)), passage=None, question=None, options=opts_text(*ops), answer=ans, explanation_vi=ex)

# ---------- L3 match_image ----------
p = E.part(LS, 'L3', 'match_image', 'Nghe hội thoại, chọn hình phù hợp (A–F). Mỗi hình dùng một lần.', '第三部分：听对话，选择对应的图片。')
shared = opts_img(('🍜', 'Một người đang ăn mì'), ('🛏️😴', 'Đứa trẻ đang ngủ trên giường'), ('🛒🏬', 'Người đang mua đồ trong cửa hàng'),
                  ('🏥🤒', 'Người bệnh nằm trong bệnh viện'), ('📱', 'Chiếc điện thoại trên bàn'), ('🐱', 'Một con mèo trắng'))
g = E.group(p, shared=shared)
E.q(p, g, example=True, audio=AU(('女', '你的猫真好看！'), ('男', '谢谢，它叫小白。')), stem=None, answer='F',
    explanation_vi='Ví dụ: nói về con mèo (猫) → hình F.')
L3 = [
    (('男', '你吃饭了吗？'), ('女', '没有，我想吃面条儿。'), 'A', '面条儿 = mì → hình người ăn mì (A).'),
    (('女', '他怎么了？'), ('男', '他病了，在医院。'), 'D', '病了 + 在医院 = bị ốm, ở bệnh viện → hình D.'),
    (('男', '你去哪儿？'), ('女', '我去商店买东西。'), 'C', '去商店买东西 = đi cửa hàng mua đồ → hình C.'),
    (('男', '我的手机呢？'), ('女', '在桌子上。'), 'E', '手机 = điện thoại; 在桌子上 = trên bàn → hình E.'),
    (('女', '孩子睡了吗？'), ('男', '睡了，你别说话。'), 'B', '睡了 = ngủ rồi → hình đứa trẻ đang ngủ (B).'),
]
for a, b, ans, ex in L3:
    E.q(p, g, audio=AU(a, b), stem=None, answer=ans, explanation_vi=ex)

# ---------- L4 choose_option ----------
p = E.part(LS, 'L4', 'choose_option', 'Nghe câu nói và câu hỏi, chọn đáp án đúng (A, B hoặc C).', '第四部分：听录音，回答问题。')
g = E.group(p)
L4 = [
    ('女', '我今天下午去商店买衣服。', '她下午去哪儿？', ['医院', '商店', '学校'], 'B', '去商店买衣服 → đi cửa hàng (B).'),
    ('男', '我女儿今年七岁，是小学生。', '他女儿几岁？', ['六岁', '十岁', '七岁'], 'C', '今年七岁 = năm nay bảy tuổi (C).'),
    ('女', '我爸爸是医生，在医院工作。', '她爸爸做什么工作？', ['医生', '老师', '工人'], 'A', '爸爸是医生 → bố là bác sĩ (A).'),
    ('男', '昨天很冷，今天很热。', '今天天气怎么样？', ['很冷', '很热', '下雨'], 'B', 'Bẫy: 很冷 là hôm qua (昨天). Hôm nay (今天) 很热 → B.'),
    ('女', '我们明天上午九点在学校门口见吧。', '他们明天几点见？', ['九点', '十点', '八点'], 'A', '上午九点 = 9 giờ sáng (A).'),
]
for sp, tx, qq, ops, ans, ex in L4:
    E.q(p, g, audio=AU((sp, tx), ('旁白', '问：' + qq)), passage=None, question=T(qq), options=opts_text(*ops), answer=ans, explanation_vi=ex)

# ---------- R1 match_image ----------
p = E.part(RS, 'R1', 'match_image', 'Đọc câu, chọn hình phù hợp (A–F). Mỗi hình dùng một lần.', '第一部分：选择与句子对应的图片。')
shared = opts_img(('🧑‍🏫✍️', 'Thầy giáo đang viết chữ trên bảng'), ('🚕', 'Một chiếc taxi'), ('🍎🍎', 'Mấy quả táo đỏ'),
                  ('👴🍵', 'Ông cụ đang uống trà'), ('🐶', 'Một chú chó nhỏ'), ('🏃', 'Một người đang chạy ngoài trời'))
g = E.group(p, shared=shared)
E.q(p, g, example=True, stem=T('我们坐出租车去吧。'), answer='B', explanation_vi='Ví dụ: 出租车 = taxi → hình B.')
R1 = [
    ('我很喜欢吃苹果。', 'C', '苹果 = quả táo → hình C.'),
    ('王老师在教我们写汉字。', 'A', '老师 + 写汉字 = thầy giáo viết chữ Hán → hình A.'),
    ('爷爷在喝茶。', 'D', '爷爷 = ông; 喝茶 = uống trà → hình D.'),
    ('他在外边跑。', 'F', '跑 = chạy → hình người đang chạy (F).'),
    ('这是我家的小狗。', 'E', '小狗 = chó nhỏ → hình E.'),
]
for st, ans, ex in R1:
    E.q(p, g, stem=T(st), answer=ans, explanation_vi=ex)

# ---------- R2 match_sentence ----------
p = E.part(RS, 'R2', 'match_sentence', 'Chọn câu trả lời phù hợp với câu hỏi (A–F). Mỗi câu dùng một lần.', '第二部分：选择正确的回答。')
shared = opts_text('在学校旁边。', '我想喝茶。', '不贵，十块钱。', '是的，她是我妹妹。', '我叫李明。', '星期六。')
g = E.group(p, shared=shared)
E.q(p, g, example=True, stem=T('你叫什么名字？'), answer='E', explanation_vi='Ví dụ: hỏi tên → 我叫李明 (E).')
R2 = [
    ('你喝什么？', 'B', 'Hỏi uống gì (喝什么) → 我想喝茶 (B).'),
    ('医院在哪儿？', 'A', 'Hỏi ở đâu (在哪儿) → 在学校旁边 (A).'),
    ('她是你妹妹吗？', 'D', 'Câu hỏi 是……吗 → 是的，她是我妹妹 (D).'),
    ('这个杯子多少钱？', 'C', 'Hỏi giá (多少钱) → 十块钱 (C).'),
    ('你哪天有时间？', 'F', 'Hỏi ngày nào (哪天) → 星期六 (F).'),
]
for st, ans, ex in R2:
    E.q(p, g, stem=T(st), answer=ans, explanation_vi=ex)

# ---------- R3 fill_blank_wordbank ----------
p = E.part(RS, 'R3', 'fill_blank_wordbank', 'Chọn từ thích hợp điền vào chỗ trống (A–F).', '第三部分：选词填空。')
shared = opts_text('开', '认识', '块', '热', '名字', '旁边')
g = E.group(p, shared=shared)
E.q(p, g, example=True, stem=T('你叫什么（ ）？'), answer='E', explanation_vi='Ví dụ: 叫什么名字 = tên là gì → 名字 (E).')
R3 = [
    ('很高兴（ ）你。', 'B', 'Cụm cố định 很高兴认识你 = rất vui được quen bạn → 认识 (B).'),
    ('这个面包三（ ）钱。', 'C', 'Số + 块钱 = … tệ → 块 (C).'),
    ('今天太（ ）了，我想喝水。', 'D', 'Muốn uống nước vì trời nóng → 热 (D).'),
    ('请（ ）门。', 'A', '开门 = mở cửa → 开 (A).'),
    ('书店在学校（ ）。', 'F', 'Danh từ + 旁边 chỉ vị trí: ở bên cạnh trường → 旁边 (F).'),
]
for st, ans, ex in R3:
    E.q(p, g, stem=T(st), answer=ans, explanation_vi=ex)

# ---------- R4 choose_option passage ----------
p = E.part(RS, 'R4', 'choose_option', 'Đọc đoạn văn, chọn đáp án đúng cho câu ★.', '第四部分：阅读短文，选择正确答案。')
R4 = [
    ('我叫大卫，是美国人。我在北京学习汉语。', '★ 大卫在北京做什么？', ['工作', '学习汉语', '看朋友'], 'B', '我在北京学习汉语 → học tiếng Trung (B).'),
    ('今天是星期天，我不上班。上午我在家看书，下午和朋友去看电影。', '★ 他下午做什么？', ['看书', '上班', '看电影'], 'C', 'Buổi sáng đọc sách, buổi chiều (下午) đi xem phim → C.'),
    ('我家有一只猫，它很小，是白的。', '★ 他的猫：', ['很小', '很大', '不在家'], 'A', '它很小 = nó rất nhỏ → A.'),
    ('王先生，您的电话。是您女儿打来的，她说她晚上不回家吃饭。', '★ 王先生的女儿晚上：', ['在家吃饭', '不回家吃饭', '去医院'], 'B', '她说她晚上不回家吃饭 → không về nhà ăn tối (B).'),
    ('我的书包在椅子下边，书包里有两本书和一个杯子。', '★ 书包里有什么？', ['杯子', '手机', '钱'], 'A', 'Trong cặp có 两本书和一个杯子 → cái cốc (A).'),
]
for ps, qq, ops, ans, ex in R4:
    g = E.group(p)
    E.q(p, g, passage=T(ps), question=T(qq), options=opts_text(*ops), answer=ans, explanation_vi=ex)

E.save()
