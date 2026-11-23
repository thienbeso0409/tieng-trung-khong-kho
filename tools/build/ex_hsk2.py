from exlib import *

E = Exam('hsk2-de1', 2, duration_minutes=60, total_score=300, pass_score=180, show_pinyin=True,
         score_mode='pass', speaking_paper=None, repeat_default=2, rubrics=[],
         notes='Đề tự soạn theo cấu trúc HSK 3.0 cấp 2 (Phụ lục A.2): nghe 25, đọc 25, viết 10. Từ vựng trong phạm vi HSK 1–2.')
LS = E.section('listening', 'Nghe', '听力', 20)
RS = E.section('reading', 'Đọc', '阅读', 25)
WS = E.section('writing', 'Viết', '书写', 15)

# L1 choose_image
p = E.part(LS, 'L1', 'choose_image', 'Nghe câu nói, chọn hình đúng (A, B hoặc C).', '第一部分：听录音，选择正确的图片。')
g = E.group(p)
L1 = [
    ('男', '我每天骑自行车去公司。', [('🚌', 'Xe buýt'), ('🚗', 'Ô tô con'), ('🚲', 'Xe đạp')], 'C', '骑自行车 = đi xe đạp → hình C.'),
    ('女', '妈妈在做饭呢。', [('👩‍🍳', 'Người mẹ đang nấu ăn'), ('👩🧺', 'Người mẹ đang giặt quần áo'), ('👩📺', 'Người mẹ đang xem tivi')], 'A', '做饭 = nấu cơm → hình A.'),
    ('男', '外边下雪了，你多穿点儿衣服。', [('☀️', 'Trời nắng'), ('❄️⛄', 'Tuyết rơi, có người tuyết'), ('🌧️', 'Trời mưa')], 'B', '下雪 = tuyết rơi → hình B. Đừng nhầm với 下雨 (mưa).'),
    ('女', '我的眼睛有点儿疼。', [('🦷', 'Răng bị đau'), ('🦵', 'Chân bị đau'), ('👁️', 'Mắt bị đau')], 'C', '眼睛 = mắt; 疼 = đau → hình C.'),
    ('男', '天气太热了，我们一起去游泳吧！', [('🏊', 'Người đang bơi'), ('⚽', 'Người đang đá bóng'), ('🏀', 'Người đang chơi bóng rổ')], 'A', '游泳 = bơi → hình A.'),
]
for sp, tx, ims, ans, ex in L1:
    E.q(p, g, audio=AU((sp, tx)), options=opts_img(*ims), answer=ans, explanation_vi=ex)

# L2 match_image 2x5
p = E.part(LS, 'L2', 'match_image', 'Nghe hội thoại, chọn hình phù hợp. Mỗi hình dùng một lần.', '第二部分：听对话，选择对应的图片。')
g = E.group(p, shared=opts_img(('🧑‍💻', 'Một người đang làm việc với máy tính'), ('🎁🎂', 'Món quà và bánh sinh nhật'), ('🏃‍♂️🌳', 'Người đang chạy bộ trong công viên'),
                                ('👧📖', 'Cô gái đang đọc sách trong thư viện yên tĩnh'), ('🎤', 'Một người đang hát'), ('👕🛍️', 'Hai người đang mua quần áo')))
E.q(p, g, example=True, audio=AU(('女', '这件衣服怎么样？'), ('男', '很好看，买吧。')), stem=None, answer='F', explanation_vi='Ví dụ: nói về mua áo (衣服, 买) → hình F.')
for a, b, ans, ex in [
    (('男', '你怎么还在用电脑？'), ('女', '今天工作太多了，还没做完。'), 'A', 'Đang dùng máy tính (用电脑) vì nhiều việc → hình A.'),
    (('女', '生日快乐！这是送你的礼物。'), ('男', '谢谢，真漂亮！'), 'B', '生日快乐 + 礼物 = sinh nhật, quà → hình B.'),
    (('男', '你早上常常跑步吗？'), ('女', '是啊，我常常在公园跑步。'), 'C', '在公园跑步 = chạy bộ ở công viên → hình C.'),
    (('女', '你唱得真好听！'), ('男', '谢谢，我从小就喜欢唱歌。'), 'E', '唱歌 = hát → hình E.'),
    (('男', '图书馆里人多吗？'), ('女', '不多，很安静，我在这儿看书呢。'), 'D', 'Thư viện yên tĩnh (安静), đang đọc sách → hình D.'),
]:
    E.q(p, g, audio=AU(a, b), stem=None, answer=ans, explanation_vi=ex)
g = E.group(p, shared=opts_img(('🚕✈️', 'Taxi chở khách ra sân bay'), ('🤒💊', 'Người bị ốm nằm trên giường, bên cạnh có thuốc'), ('🐕🚶', 'Người đang dắt chó đi dạo'),
                                ('🍜🥢', 'Người đang ăn bằng đũa'), ('📱💬', 'Điện thoại đang nhắn tin')))
for a, b, ans, ex in [
    (('女', '你生病了？吃药了吗？'), ('男', '吃了，我想睡一会儿。'), 'B', '生病 + 吃药 = bị ốm, uống thuốc → hình B.'),
    (('男', '你会用筷子吗？'), ('女', '会一点儿，我正在学。'), 'D', '用筷子 = dùng đũa → hình D.'),
    (('女', '我们打车去机场吧。'), ('男', '好，路上车不多，四十分钟就能到。'), 'A', '打车去机场 = bắt taxi ra sân bay → hình A.'),
    (('男', '你的狗真可爱！它几岁了？'), ('女', '两岁了，我每天带它出去走走。'), 'C', '狗 + 带它出去走走 = dắt chó đi dạo → hình C.'),
    (('女', '喂，你到了吗？'), ('男', '快到了，我一会儿给你发短信。'), 'E', '发短信 = gửi tin nhắn → hình E.'),
]:
    E.q(p, g, audio=AU(a, b), stem=None, answer=ans, explanation_vi=ex)

# L3 choose_option
p = E.part(LS, 'L3', 'choose_option', 'Nghe hội thoại và câu hỏi, chọn đáp án đúng.', '第三部分：听对话，回答问题。')
g = E.group(p)
L3 = [
    ([('女', '你今天怎么来得这么晚？'), ('男', '路上车太多了，公交车走得很慢。')], '男的为什么来晚了？', ['起床晚了', '路上车多', '生病了'], 'B', '路上车太多了 → đường đông xe (B).'),
    ([('男', '这件衣服多少钱？'), ('女', '三百块，现在便宜一百。')], '这件衣服现在多少钱？', ['一百块', '三百块', '两百块'], 'C', 'Giá gốc 300, giảm (便宜) 100 → còn 200 tệ (C). Bẫy: 300 là giá cũ.'),
    ([('女', '你喜欢什么运动？'), ('男', '我喜欢打篮球，也喜欢游泳。')], '男的喜欢什么？', ['打篮球', '踢足球', '跑步'], 'A', '我喜欢打篮球 → A. Bóng đá và chạy bộ không được nhắc tới.'),
    ([('男', '明天的考试你准备好了吗？'), ('女', '还没有，今天晚上我要去图书馆复习。')], '女的今天晚上做什么？', ['去图书馆', '考试', '看电影'], 'A', '今天晚上我要去图书馆复习 → A. Thi là ngày mai.'),
    ([('女', '你哥哥是做什么工作的？'), ('男', '他是医生，在北京的一家医院工作。')], '男的哥哥在哪儿工作？', ['学校', '医院', '公司'], 'B', '在……医院工作 → bệnh viện (B).'),
    ([('男', '我们几点出发？'), ('女', '火车九点半开，我们八点出发吧。')], '火车几点开？', ['八点', '八点半', '九点半'], 'C', 'Tàu chạy (开) lúc 九点半; 八点 là giờ xuất phát → C.'),
    ([('女', '你看到我的手机了吗？'), ('男', '在桌子上，你的包旁边。')], '手机在哪儿？', ['桌子上', '包里', '床上'], 'A', '在桌子上 = trên bàn (A). Bẫy: 包旁边 là bên cạnh túi, không phải trong túi.'),
    ([('男', '这个房间怎么样？'), ('女', '很大，也很干净，就是离公司有点儿远。')], '女的觉得房间怎么样？', ['太小', '离公司远', '不干净'], 'B', '就是离公司有点儿远 = chỉ có điều hơi xa công ty (B).'),
    ([('女', '外边天气怎么样？'), ('男', '阴天，好像要下雨，你别出去了。')], '现在天气怎么样？', ['阴天', '下雪', '晴天'], 'A', '阴天 = trời âm u (A). 要下雨 = sắp mưa, chưa mưa.'),
    ([('男', '你妹妹多大了？'), ('女', '她比我小三岁，今年十八岁。')], '女的今年多大？', ['十五岁', '十八岁', '二十一岁'], 'C', 'Em gái 18 tuổi, nhỏ hơn chị 3 tuổi → chị 21 tuổi (C).'),
]
for lines, qq, ops, ans, ex in L3:
    E.q(p, g, audio=AU(*lines, ('旁白', '问：' + qq)), passage=None, question=T(qq), options=opts_text(*ops), answer=ans, explanation_vi=ex)

# R1 match_image
p = E.part(RS, 'R1', 'match_image', 'Đọc câu, chọn hình phù hợp (A–F).', '第一部分：选择与句子对应的图片。')
g = E.group(p, shared=opts_img(('🚗🚫', 'Biển cấm đỗ xe, cạnh có ô tô'), ('🎁', 'Một hộp quà'), ('🧒🎒', 'Cậu bé đeo cặp đi học'),
                                ('🪑😴', 'Người đàn ông ngồi trên ghế ngủ gật'), ('🥚🥚', 'Hai quả trứng gà'), ('⚽🧒🧒', 'Mấy bạn nhỏ đang đá bóng')))
E.q(p, g, example=True, stem=T('他们在踢足球。'), answer='F', explanation_vi='Ví dụ: 踢足球 = đá bóng → hình F.')
for st, ans, ex in [
    ('早上七点，孩子背着书包去上学。', 'C', '背着书包去上学 = đeo cặp đi học → hình C.'),
    ('我早饭一般吃两个鸡蛋。', 'E', '两个鸡蛋 = hai quả trứng → hình E.'),
    ('对不起，这里不能停车。', 'A', '不能停车 = không được đỗ xe → hình A.'),
    ('这是朋友送给我的生日礼物。', 'B', '礼物 = quà → hình B.'),
    ('他太累了，坐在椅子上睡着了。', 'D', '坐在椅子上睡着了 = ngồi trên ghế ngủ thiếp đi → hình D.'),
]:
    E.q(p, g, stem=T(st), answer=ans, explanation_vi=ex)

# R2 fill blank
p = E.part(RS, 'R2', 'fill_blank_wordbank', 'Chọn từ thích hợp điền vào chỗ trống (A–F).', '第二部分：选词填空。')
g = E.group(p, shared=opts_text('告诉', '便宜', '正在', '离', '题', '准备'))
E.q(p, g, example=True, stem=T('这件衣服太贵了，有（ ）一点儿的吗？'), answer='B', explanation_vi='Ví dụ: đắt quá → hỏi cái rẻ hơn: 便宜 (B).')
for st, ans, ex in [
    ('请你（ ）我你的手机号。', 'A', '告诉 + người + việc: cho ai biết điều gì → 告诉 (A).'),
    ('我（ ）吃饭，等一下给你打电话。', 'C', '正在 + động từ = đang làm gì → 正在吃饭 (C).'),
    ('我家（ ）学校很近，走路十分钟。', 'D', 'A 离 B 很近 = A cách B rất gần → 离 (D).'),
    ('这道（ ）太难了，我不会做。', 'E', '道 là lượng từ của 题 (câu hỏi, bài tập) → 题 (E).'),
    ('明天考试，你（ ）好了吗？', 'F', '准备好 = chuẩn bị xong → 准备 (F).'),
]:
    E.q(p, g, stem=T(st), answer=ans, explanation_vi=ex)

# R3 match_sentence 2x5
p = E.part(RS, 'R3', 'match_sentence', 'Chọn câu đáp lại phù hợp. Mỗi câu dùng một lần.', '第三部分：选择正确的回答。')
g = E.group(p, shared=opts_text('没关系，我也刚到。', '好的，我们下午三点见。', '我是坐地铁来的。', '对，她是我们班的新同学。', '我不太舒服，想休息一下。', '不用谢，这是我应该做的。'))
E.q(p, g, example=True, stem=T('谢谢你帮助我！'), answer='F', explanation_vi='Ví dụ: đáp lời cảm ơn → 不用谢 (F).')
for st, ans, ex in [
    ('对不起，我来晚了。', 'A', 'Đáp lời xin lỗi → 没关系，我也刚到 (A).'),
    ('你今天怎么不去打球？', 'E', 'Hỏi lý do không đi chơi bóng → vì không khỏe (E).'),
    ('你是怎么来的？', 'C', 'Hỏi phương tiện (怎么来) → 坐地铁来的 (C).'),
    ('那个女孩儿是谁？是新来的吗？', 'D', 'Hỏi người mới → 她是我们班的新同学 (D).'),
    ('明天下午我们一起去看电影吧。', 'B', 'Lời rủ → đồng ý và hẹn giờ (B).'),
]:
    E.q(p, g, stem=T(st), answer=ans, explanation_vi=ex)
g = E.group(p, shared=opts_text('我也想去，我们一起去吧。', '已经吃过了，谢谢。', '因为今天是我的生日。', '我觉得红色的更好看。', '不远，坐公交车二十分钟。'))
for st, ans, ex in [
    ('你家离这儿远吗？', 'E', 'Hỏi xa không (远吗) → 不远，二十分钟 (E).'),
    ('你今天为什么这么高兴？', 'C', 'Hỏi tại sao (为什么) → 因为…… (C).'),
    ('你吃饭了吗？一起去吃吧。', 'B', 'Hỏi ăn chưa → 已经吃过了 (B).'),
    ('这两件衣服，你觉得哪件好？', 'D', 'Hỏi ý kiến chọn cái nào → 红色的更好看 (D).'),
    ('我想去书店买几本书。', 'A', 'Nói ý định → 我也想去，一起去吧 (A).'),
]:
    E.q(p, g, stem=T(st), answer=ans, explanation_vi=ex)

# R4 passage
p = E.part(RS, 'R4', 'choose_option', 'Đọc đoạn văn, chọn đáp án đúng cho câu ★.', '第四部分：阅读短文，选择正确答案。')
for ps, qq, ops, ans, ex in [
    ('我叫小林，是越南人。去年九月我来北京学习汉语。我有很多中国朋友，他们常常帮助我。', '★ 小林：', ['是中国人', '在北京学习', '没有朋友'], 'B', '我来北京学习汉语 → B. Tiểu Lâm là người Việt Nam và có nhiều bạn Trung Quốc.'),
    ('我每天早上六点半起床，先跑步，然后吃早饭。七点半坐地铁去公司，八点半开始工作。', '★ 他几点开始工作？', ['六点半', '七点半', '八点半'], 'C', '八点半开始工作 → C. 六点半 dậy, 七点半 đi tàu điện ngầm.'),
    ('今天是星期六，天气很好。爸爸妈妈带我去公园玩儿。公园里人很多，有的人在跑步，有的人在唱歌。', '★ 他们今天去了哪儿？', ['公园', '商店', '学校'], 'A', '带我去公园玩儿 → A.'),
    ('这家饭馆的菜很好吃，也不贵，所以中午有很多人来这儿吃饭。我和同事也常常来。', '★ 这家饭馆：', ['很贵', '中午人很多', '菜不好吃'], 'B', '中午有很多人来这儿吃饭 → B. Quán không đắt (不贵) và ngon.'),
    ('王老师，您好！我是李明的妈妈。李明今天生病了，不能去学校上课，想请一天假。谢谢您！', '★ 李明今天：', ['生病了', '去上课了', '在学校'], 'A', '李明今天生病了，不能去学校 → A.'),
]:
    g = E.group(p)
    E.q(p, g, passage=T(ps), question=T(qq), options=opts_text(*ops), answer=ans, explanation_vi=ex)

# W1 choose_component
p = E.part(WS, 'W1', 'choose_component', 'Chọn bộ phận (A–F) để hoàn thành chữ còn thiếu trong từ.', '第一部分：选择正确的部件，组成汉字。')
g = E.group(p, shared=[{'key': k, 'text': {'zh': z, 'pinyin': py}} for k, z, py in
                       [('A', '寸', 'cùn'), ('B', '木', 'mù'), ('C', '马', 'mǎ'), ('D', '口', 'kǒu'), ('E', '门', 'mén'), ('F', '青', 'qīng')]])
E.q(p, g, example=True, word=T('妈妈'), target_char='妈', target_index=0, shown_part='女', layout='left-right', answer='C',
    explanation_vi='Ví dụ: 妈 = 女 + 马 (C).')
for w, tc, ti, sp, lay, ans, ex in [
    ('吃饭', '吃', 0, '乞', 'left-right', 'D', '吃 = 口 + 乞: việc ăn liên quan đến miệng (口) → D.'),
    ('晴天', '晴', 0, '日', 'left-right', 'F', '晴 = 日 + 青 (青 gợi âm qíng) → F.'),
    ('时间', '时', 0, '日', 'left-right', 'A', '时 = 日 + 寸 → A.'),
    ('休息', '休', 0, '亻', 'left-right', 'B', '休 = 亻 (người) + 木 (cây): người tựa gốc cây nghỉ ngơi → B.'),
    ('问题', '问', 0, '口', 'enclosure', 'E', '问 = 门 bao ngoài + 口 bên trong: hỏi ở cửa → E.'),
]:
    E.q(p, g, word=T(w), target_char=tc, target_index=ti, shown_part=sp, layout=lay, answer=ans, explanation_vi=ex)

# W2 write_hanzi_from_pinyin
p = E.part(WS, 'W2', 'write_hanzi_from_pinyin', 'Viết chữ Hán còn thiếu theo pinyin cho sẵn.', '第二部分：看拼音，写汉字。')
g = E.group(p)
for st, bp, ans, ex in [
    ('我（ ）天早上喝牛奶。', 'měi', '每', '每天 = mỗi ngày. 每 (měi) gồm 𠂉 + 母.'),
    ('他是我的好朋（ ）。', 'yǒu', '友', '朋友 = bạn bè. 友 (yǒu) khác 有 (yǒu = có).'),
    ('你（ ）在做什么？', 'xiàn', '现', '现在 = bây giờ. 现 = 王 + 见.'),
    ('我家（ ）学校不远。', 'lí', '离', 'A 离 B 远/近: khoảng cách. 离 (lí) = cách.'),
    ('请（ ）一下，你叫什么名字？', 'wèn', '问', '请问 = xin hỏi. 问 = 门 + 口.'),
]:
    E.q(p, g, stem=T(st), blank_pinyin=bp, answer=ans, explanation_vi=ex)

E.save()
