from exlib import *

RUB = [{'id': 'rb-w-sentence', 'max_score': 2, 'name_vi': 'Đặt câu theo từ cho sẵn và hình (HSK3 W2)',
        'criteria': [
            {'key': 'vocab_grammar', 'name_vi': 'Từ khóa & ngữ pháp', 'weight': 0.5, 'description_vi': 'Dùng đúng từ cho sẵn, câu đúng ngữ pháp, trật tự từ đúng.'},
            {'key': 'content', 'name_vi': 'Phù hợp nội dung hình', 'weight': 0.3, 'description_vi': 'Câu mô tả đúng nội dung bức hình, có ý nghĩa trọn vẹn.'},
            {'key': 'characters', 'name_vi': 'Chữ Hán', 'weight': 0.2, 'description_vi': 'Viết đúng chữ Hán, không sai chữ, có dấu câu.'}]}]
E = Exam('hsk3-de1', 3, duration_minutes=83, total_score=300, pass_score=180, show_pinyin=False,
         score_mode='pass', speaking_paper='hsk3-de1-speaking', repeat_default=2, rubrics=RUB,
         notes='Đề tự soạn theo cấu trúc HSK 3.0 cấp 3 (Phụ lục A.2): nghe 30, đọc 30, viết 10; bài nói riêng ở speaking/hskk.json (hsk3-de1-speaking). Pinyin có trong dữ liệu để xem lại, web không hiển thị khi làm bài (show_pinyin=false).')
LS = E.section('listening', 'Nghe', '听力', 28)
RS = E.section('reading', 'Đọc', '阅读', 35)
WS = E.section('writing', 'Viết', '书写', 20)

# L1 match_image 2x5
p = E.part(LS, 'L1', 'match_image', 'Nghe hội thoại, chọn hình phù hợp. Mỗi hình dùng một lần.', '第一部分：听对话，选择对应的图片。')
g = E.group(p, shared=opts_img(('🧳✈️', 'Người kéo vali ở sân bay'), ('🎂', 'Chiếc bánh sinh nhật trên bàn'), ('🧑‍⚕️🤒', 'Bác sĩ đang khám cho người bệnh'),
                                ('🚴', 'Người đang đạp xe đi làm'), ('📷', 'Người đang chụp ảnh'), ('🧹🏠', 'Người đang quét dọn phòng')))
E.q(p, g, example=True, audio=AU(('男', '你在干什么呢？'), ('女', '打扫房间，周末家里要来客人。')), stem=None, answer='F', explanation_vi='Ví dụ: 打扫房间 = dọn phòng → hình F.')
for a, b, ans, ex in [
    (('女', '这张照片拍得真不错！'), ('男', '谢谢，我最近在学照相。'), 'E', '照片、照相 = ảnh, chụp ảnh → hình E.'),
    (('男', '您哪儿不舒服？'), ('女', '我头疼，还有点儿发烧。'), 'C', 'Câu hỏi của bác sĩ (哪儿不舒服) + 发烧 → hình C.'),
    (('女', '你的行李箱怎么这么重？'), ('男', '里面都是给家人的礼物。'), 'A', '行李箱 = vali → hình A.'),
    (('男', '今天是你的生日，我给你买了一个蛋糕。'), ('女', '太好了，谢谢你！'), 'B', '生日 + 蛋糕 = bánh sinh nhật → hình B.'),
    (('女', '你每天怎么去公司？'), ('男', '骑自行车，又方便又能锻炼身体。'), 'D', '骑自行车 = đạp xe → hình D.'),
]:
    E.q(p, g, audio=AU(a, b), stem=None, answer=ans, explanation_vi=ex)
g = E.group(p, shared=opts_img(('🍳', 'Người đang nấu ăn trong bếp'), ('🏊', 'Người đang bơi ở bể bơi'), ('📚🧑‍🎓', 'Sinh viên đang ôn bài trong thư viện'),
                                ('☂️🌧️', 'Người cầm ô đi dưới mưa'), ('🐼', 'Con gấu trúc ở vườn thú')))
for a, b, ans, ex in [
    (('男', '外边下雨了，你带伞了吗？'), ('女', '带了，在我的包里。'), 'D', '下雨 + 带伞 = mưa, mang ô → hình D.'),
    (('女', '周末我们去动物园看熊猫吧。'), ('男', '好啊，我还没见过熊猫呢。'), 'E', '熊猫 = gấu trúc → hình E.'),
    (('男', '你做的菜真香！'), ('女', '我刚学会的，你多吃点儿。'), 'A', '做的菜 = món tự nấu → hình A.'),
    (('女', '下个星期就要考试了，你复习得怎么样？'), ('男', '还好，我每天都来图书馆。'), 'C', '复习 + 图书馆 = ôn bài ở thư viện → hình C.'),
    (('男', '你游泳游得真快！'), ('女', '我从小就喜欢游泳。'), 'B', '游泳 = bơi → hình B.'),
]:
    E.q(p, g, audio=AU(a, b), stem=None, answer=ans, explanation_vi=ex)

# L2 dialogues
p = E.part(LS, 'L2', 'choose_option', 'Nghe hội thoại và câu hỏi, chọn đáp án đúng.', '第二部分：听对话，选择正确答案。')
g = E.group(p)
for lines, qq, ops, ans, ex in [
    ([('女', '服务员，我们要一个大一点儿的桌子，一共六个人。'), ('男', '好的，请跟我来，这边有。')], '他们最可能在哪儿？', ['饭馆', '医院', '银行'], 'A', 'Gọi 服务员 và cần bàn cho 6 người → nhà hàng (A).'),
    ([('男', '你的汉语说得这么好，学了多长时间了？'), ('女', '快三年了，我在大学一年级就开始学了。')], '女的学了多长时间汉语？', ['一年', '差不多三年', '五年'], 'B', '快三年了 = gần ba năm → 差不多三年 (B).'),
    ([('女', '这个周末你有什么打算？'), ('男', '本来想去爬山，可是天气预报说周末有雨。')], '男的本来想做什么？', ['爬山', '看电影', '在家休息'], 'A', '本来想去爬山 = vốn định đi leo núi (A).'),
    ([('男', '你怎么又迟到了？'), ('女', '对不起，我的手表慢了十分钟。')], '女的为什么迟到？', ['起床晚了', '手表慢了', '路上车多'], 'B', '手表慢了十分钟 = đồng hồ chạy chậm 10 phút (B).'),
    ([('女', '我想买一台新电脑，你有什么建议？'), ('男', '别买太贵的，够用就行。')], '男的是什么意思？', ['买贵的', '不用买', '买够用的就可以'], 'C', '够用就行 = đủ dùng là được (C).'),
    ([('男', '我们坐地铁去还是打车去？'), ('女', '现在是下班时间，路上车多，还是坐地铁吧。')], '他们最后怎么去？', ['打车', '坐地铁', '走路'], 'B', '还是坐地铁吧 = tốt hơn là đi tàu điện ngầm (B).'),
    ([('女', '你看起来很累，昨天晚上几点睡的？'), ('男', '两点才睡，我一直在写报告。')], '男的昨天晚上在做什么？', ['写报告', '看电视', '玩游戏'], 'A', '我一直在写报告 → viết báo cáo (A).'),
    ([('男', '这条裤子有点儿短，有没有长一点儿的？'), ('女', '有，您试试这条。')], '男的觉得裤子怎么样？', ['太长', '太贵', '太短'], 'C', '有点儿短 = hơi ngắn (C).'),
    ([('女', '听说你搬家了，新家怎么样？'), ('男', '比以前的大，离公司也近，就是房租贵了一点儿。')], '新家有什么问题？', ['太小', '房租有点儿贵', '离公司远'], 'B', '就是房租贵了一点儿 → B. Nhà mới to hơn và gần công ty.'),
    ([('男', '你妈妈的病好点儿了吗？'), ('女', '好多了，医生说下个星期就能出院了。')], '女的妈妈现在怎么样？', ['好多了', '已经出院了', '还在发烧'], 'A', '好多了 = đỡ nhiều rồi (A). Tuần sau mới xuất viện nên B sai.'),
]:
    E.q(p, g, audio=AU(*lines, ('旁白', '问：' + qq)), passage=None, question=T(qq), options=opts_text(*ops), answer=ans, explanation_vi=ex)

# L3 monologues
p = E.part(LS, 'L3', 'choose_option', 'Nghe đoạn nói và câu hỏi, chọn đáp án đúng.', '第三部分：听短文，选择正确答案。')
g = E.group(p)
for sp, tx, qq, ops, ans, ex in [
    ('男', '我每天早上七点起床，先去公园跑半个小时步，然后回家洗澡、吃早饭，八点半到公司。', '他几点到公司？', ['七点', '七点半', '八点半'], 'C', '八点半到公司 → C. 七点 là giờ dậy.'),
    ('女', '我女儿特别喜欢小动物，家里养了两只猫和一只狗。她每天放学回家第一件事就是跟它们玩儿。', '她家有几只猫？', ['一只', '两只', '三只'], 'B', '两只猫和一只狗 → hai con mèo (B). Bẫy: 一只 là số chó.'),
    ('男', '这家超市的东西又新鲜又便宜，周末的时候人特别多，所以我一般周三晚上来买东西。', '他为什么周三来超市？', ['周末人多', '周三便宜', '周末很忙'], 'A', '周末的时候人特别多，所以…… → vì cuối tuần đông (A).'),
    ('女', '各位旅客，飞机马上就要起飞了，请关上手机，坐好，谢谢！', '这段话最可能在哪儿听到？', ['火车站', '飞机上', '公交车上'], 'B', '飞机马上就要起飞了 = máy bay sắp cất cánh → trên máy bay (B).'),
    ('男', '我以前很怕说汉语，怕说错。后来老师告诉我，说错了没关系，多说才能进步。现在我每天都和中国朋友聊天。', '老师认为应该怎么学汉语？', ['多说', '多写', '多看书'], 'A', '多说才能进步 = nói nhiều mới tiến bộ (A).'),
    ('女', '我的家乡在南方，冬天不太冷，很少下雪。来北京以后，我第一次看到了这么大的雪，特别高兴。', '她的家乡怎么样？', ['冬天很冷', '常常下雪', '冬天不太冷'], 'C', '冬天不太冷，很少下雪 → C.'),
    ('男', '今天的会议改到下午三点了，在三楼的会议室，请大家不要迟到。', '会议什么时候开？', ['上午', '下午三点', '晚上'], 'B', '会议改到下午三点 → B. 三楼 là tầng ba, không phải giờ.'),
    ('女', '这本书我借了两个星期了，明天就要还给图书馆，可是我还没看完。', '关于这本书，可以知道什么？', ['她还没看完', '是她买的', '她已经还{huán}了'], 'A', '我还没看完 → A. Sách mượn (借) của thư viện, mai mới trả.'),
    ('男', '我哥哥是一名中学老师，他教数学。他对学生很热情，学生们都很喜欢他。', '哥哥教什么？', ['汉语', '历史', '数学'], 'C', '他教数学 → C.'),
    ('女', '周末我一般不出门，在家打扫打扫房间，洗洗衣服，有时候也做几个菜，请朋友来家里吃饭。', '她周末一般做什么？', ['去旅游', '在家做家务', '去公司上班'], 'B', 'Dọn phòng, giặt đồ, nấu ăn ở nhà = làm việc nhà (B).'),
]:
    E.q(p, g, audio=AU((sp, tx), ('旁白', '问：' + qq)), passage=None, question=T(qq), options=opts_text(*ops), answer=ans, explanation_vi=ex)

# R1 match_sentence 2x5
p = E.part(RS, 'R1', 'match_sentence', 'Chọn câu đáp lại phù hợp. Mỗi câu dùng một lần.', '第一部分：选择正确的回答。')
g = E.group(p, shared=opts_text('别担心，医生说没什么大问题。', '我也觉得，我们换一家吧。', '当然可以，你想借哪本？', '不客气，有问题随时问我。', '他去上海了，下个星期回来。', '已经订好了，明天上午十点的。'))
E.q(p, g, example=True, stem=T('去北京的机票你订了吗？'), answer='F', explanation_vi='Ví dụ: hỏi đặt vé chưa → 已经订好了 (F).')
for st, ans, ex in [
    ('我能借一下你的词典吗？', 'C', 'Hỏi mượn (借) → 当然可以，你想借哪本 (C).'),
    ('你奶奶的身体怎么样了？', 'A', 'Hỏi sức khỏe → 别担心，没什么大问题 (A).'),
    ('这家饭馆的菜不太好吃，服务也不好。', 'B', 'Chê quán → đồng ý và đề nghị đổi quán (B).'),
    ('谢谢你给我讲这道题。', 'D', 'Cảm ơn giảng bài → 不客气，有问题随时问我 (D).'),
    ('怎么最近没看到王经理？', 'E', 'Hỏi sao không thấy ai → 他去上海了 (E).'),
]:
    E.q(p, g, stem=T(st), answer=ans, explanation_vi=ex)
g = E.group(p, shared=opts_text('是啊，比去年胖了不少。', '因为我对中国文化很感兴趣。', '对，下了车往右走就到了。', '没问题，我下班以后就去。', '我更喜欢夏天，可以去游泳。'))
for st, ans, ex in [
    ('你为什么选择学汉语？', 'B', 'Hỏi lý do (为什么) → 因为…… (B).'),
    ('你能帮我去超市买点儿东西吗？', 'D', 'Nhờ giúp → 没问题 (D).'),
    ('请问，在这儿下车能到图书馆吗？', 'C', 'Hỏi đường xuống xe → 下了车往右走就到了 (C).'),
    ('你最近是不是胖了？', 'A', 'Hỏi có béo lên không → 比去年胖了不少 (A).'),
    ('春天和夏天，你更喜欢哪个季节？', 'E', 'Hỏi thích mùa nào → 我更喜欢夏天 (E).'),
]:
    E.q(p, g, stem=T(st), answer=ans, explanation_vi=ex)

# R2 fill blank 2x5
p = E.part(RS, 'R2', 'fill_blank_wordbank', 'Chọn từ thích hợp điền vào chỗ trống (A–F).', '第二部分：选词填空。')
g = E.group(p, shared=opts_text('终于', '检查', '习惯', '一般', '安静', '遇到'))
E.q(p, g, example=True, stem=T('图书馆里很（ ），大家都在看书。'), answer='E', explanation_vi='Ví dụ: thư viện, mọi người đọc sách → 安静 (E).')
for st, ans, ex in [
    ('我已经（ ）了这里的天气。', 'C', '习惯 + tân ngữ = đã quen với… → 习惯 (C).'),
    ('找了一个小时，我（ ）找到了我的手机。', 'A', 'Tìm cả tiếng, cuối cùng (终于) cũng thấy → A.'),
    ('医生给他（ ）了一下身体。', 'B', '检查身体 = khám sức khỏe → B.'),
    ('周末我（ ）在家休息，很少出去。', 'D', '一般 = thường thường, đi với 很少出去 → D.'),
    ('我在超市（ ）了我的中学同学。', 'F', '遇到 + người = tình cờ gặp → F.'),
]:
    E.q(p, g, stem=T(st), answer=ans, explanation_vi=ex)
g = E.group(p, shared=opts_text('打算', '而且', '结束', '担心', '刚才', '满意'))
E.q(p, g, example=True, stem=T('A：你对这个房间（ ）吗？\nB：很满意，又大又干净。'), answer='F', explanation_vi='Ví dụ: 对……满意 = hài lòng với… → F.')
for st, ans, ex in [
    ('A：考试什么时候（ ）？\nB：下午四点。', 'C', 'Hỏi khi nào kết thúc (结束) → C.'),
    ('A：（ ）谁给你打电话了？\nB：我妈妈。', 'E', '刚才 = vừa nãy, đứng đầu câu chỉ thời gian → E.'),
    ('A：放假以后你有什么（ ）？\nB：我想去中国旅游。', 'A', '有什么打算 = có dự định gì → A.'),
    ('A：这家咖啡店怎么样？\nB：咖啡很好喝，（ ）也不贵。', 'B', '而且 = hơn nữa, nối hai ưu điểm → B.'),
    ('A：孩子这么晚还没回来。\nB：别（ ），他一会儿就到了。', 'D', '别担心 = đừng lo → D.'),
]:
    E.q(p, g, stem=T(st), answer=ans, explanation_vi=ex)

# R3 passages
p = E.part(RS, 'R3', 'choose_option', 'Đọc đoạn văn, chọn đáp án đúng.', '第三部分：阅读短文，选择正确答案。')
def single(ps, qq, ops, ans, ex):
    g = E.group(p)
    E.q(p, g, passage=T(ps), question=T(qq), options=opts_text(*ops), answer=ans, explanation_vi=ex)
single('我叫安娜，来中国已经两年了。刚来的时候，我一句汉语也不会说，现在我不但能用汉语跟朋友聊天，还能看懂中文电影了。', '★ 安娜现在：', ['不会说汉语', '能看懂中文电影', '刚来中国'], 'B', '现在……还能看懂中文电影了 → B. A và C là lúc mới đến.')
single('很多人觉得早上起床以后喝一杯水对身体很好。我的习惯是起床先喝一杯水，然后再吃早饭。', '★ 他起床后第一件事是：', ['吃早饭', '跑步', '喝水'], 'C', '起床先喝一杯水，然后再吃早饭 → việc đầu tiên là uống nước (C).')
single('小王很喜欢运动，特别是踢足球。他每个周末都和同事去踢球，下雨的时候也去。', '★ 小王：', ['周末常去踢足球', '不喜欢运动', '下雨的时候不去'], 'A', '每个周末都和同事去踢球 → A. Trời mưa vẫn đi nên C sai.')
single('这个手机是我上个月买的，用了还不到一个月就坏了。我去商店，他们说可以给我换一个新的。', '★ 商店说可以：', ['换一个新的', '退钱', '不能修'], 'A', '可以给我换一个新的 → đổi máy mới (A).')
g = E.group(p, passage=T('我家附近新开了一家超市，东西很多，价格也比较便宜。超市晚上十点才关门，所以我下班以后常常去那儿买东西。上个星期，我在那儿还遇到了我的老同学。'))
E.q(p, g, passage=None, question=T('★ 这家超市：'), options=opts_text('东西很贵', '晚上十点关门', '离他家很远'), answer='B', explanation_vi='超市晚上十点才关门 → B. Giá 比较便宜, ở 附近 nên A, C sai.')
E.q(p, g, passage=None, question=T('★ 上个星期，他在超市：'), options=opts_text('遇到了老同学', '买了一台电脑', '工作'), answer='A', explanation_vi='我在那儿还遇到了我的老同学 → A.')
single('今天是爷爷八十岁生日，全家人都回来了。妈妈做了很多菜，我给爷爷买了一个大蛋糕。爷爷非常高兴。', '★ 今天：', ['是妈妈的生日', '爷爷很高兴', '爷爷不在家'], 'B', '爷爷非常高兴 → B. Hôm nay là sinh nhật ông, không phải mẹ.')
single('我以前不太喜欢喝茶，来中国以后，常常和中国朋友一起喝茶，慢慢地也喜欢上了。现在我每天都要喝两杯。', '★ 他现在：', ['不喝茶', '只喝咖啡', '每天喝茶'], 'C', '现在我每天都要喝两杯 → C.')
g = E.group(p, passage=T('李老师教了三十年书，明年就要退休了。她说，她最难忘的是第一次上课的时候，因为太紧张，把学生的名字都叫错了，学生们都笑了。现在，她的很多学生已经成了老师。'))
E.q(p, g, passage=None, question=T('★ 李老师第一次上课的时候：'), options=opts_text('很紧张', '很高兴', '迟到了'), answer='A', explanation_vi='因为太紧张，把学生的名字都叫错了 → A.')
E.q(p, g, passage=None, question=T('★ 关于李老师，可以知道：'), options=opts_text('已经退休了', '明年退休', '是新老师'), answer='B', explanation_vi='明年就要退休了 → B. Đã dạy 30 năm nên không phải giáo viên mới.')

# W1 write hanzi
p = E.part(WS, 'W1', 'write_hanzi_from_pinyin', 'Viết chữ Hán còn thiếu theo pinyin cho sẵn.', '第一部分：看拼音，写汉字。')
g = E.group(p)
for st, bp, ans, ex in [
    ('今天的作业我已经（ ）成了。', 'wán', '完', '完成 = hoàn thành. 完 (wán) có bộ 宀 + 元.'),
    ('这个问题很简（ ），我会回答。', 'dān', '单', '简单 = đơn giản.'),
    ('我对中国历（ ）很感兴趣。', 'shǐ', '史', '历史 = lịch sử.'),
    ('请把你的（ ）照给我看一下。', 'hù', '护', '护照 = hộ chiếu. 护 có bộ 扌 (tay).'),
    ('天气（ ）来越冷了。', 'yuè', '越', '越来越 = càng ngày càng.'),
]:
    E.q(p, g, stem=T(st, py=False), blank_pinyin=bp, answer=ans, explanation_vi=ex)

# W2 write_sentence
p = E.part(WS, 'W2', 'write_sentence', 'Nhìn hình, dùng từ cho sẵn viết một câu.', '第二部分：看图，用词造句。')
g = E.group(p)
for kw, img, alt, samples, ex in [
    ('打扫', '🧹🏠', 'Một cô gái đang quét dọn phòng', ['她正在打扫房间。', '周末我们一起打扫了房间。'], 'Cấu trúc: 主语 + 正在 + 打扫 + 房间. Có thể thêm thời gian: 周末/今天.'),
    ('照相', '📸⛰️', 'Hai người đang chụp ảnh trước một ngọn núi', ['他们在山上照相。', '我们在这儿照相吧。'], '照相 là động từ li hợp, không mang tân ngữ phía sau; nơi chốn đặt trước: 在……照相.'),
    ('迟到', '⏰🏃', 'Cậu bé vội chạy vào lớp, đồng hồ chỉ 8 giờ 10', ['他今天上课迟到了。', '他起床太晚，所以迟到了。'], '迟到 + 了 diễn tả việc đã xảy ra; có thể thêm nguyên nhân với 因为/所以.'),
    ('甜', '🍰😋', 'Em bé đang ăn bánh ngọt và cười tươi', ['这个蛋糕很甜。', '她觉得这个蛋糕非常甜。'], '甜 là tính từ, dùng: 主语 + 很/非常 + 甜.'),
    ('锻炼', '🏋️', 'Một người đàn ông đang tập thể dục trong phòng tập', ['他每天都去锻炼身体。', '为了健康，他常常锻炼。'], '锻炼身体 = rèn luyện thân thể; thêm 每天/常常 để câu tự nhiên.'),
]:
    E.q(p, g, prompt_vi='Nhìn hình, dùng từ cho sẵn viết một câu hoàn chỉnh.', keyword=T(kw), image=IMG(img, alt), min_chars=5,
        sample_answers=samples, max_points=2, rubric_id='rb-w-sentence', answer=None, explanation_vi=ex)

E.save()
