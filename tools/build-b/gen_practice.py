import json
D = '/home/claude/tieng-trung-khong-kho/data/writing'
def T(zh, vi=None, py=None):
    t = {'zh': zh}
    if py: t['pinyin'] = py
    if vi: t['vi'] = vi
    return t
def ws(i, kw, py, samples, tip):
    return {'id': f'wp4-ws-{i:02d}', 'type': 'write_sentence', 'prompt_vi': 'Đặt một câu hoàn chỉnh có dùng từ cho sẵn (HSK4 W1).',
            'keyword': T(kw, py=py), 'image': None, 'min_chars': 8, 'sample_answers': samples, 'answer': None,
            'outline_vi': [tip, 'Kiểm tra: chủ ngữ – trạng ngữ – động từ – tân ngữ; kết thúc bằng dấu câu.'], 'max_points': 4,
            'explanation_vi': tip}
W4 = [ws(1,'干脆','gāncuì',['路上太堵了，我们干脆走过去吧。'],'干脆 + động từ: “thôi thì cứ…”, dùng khi đưa ra quyết định dứt khoát.'),
      ws(2,'不管','bùguǎn',['不管天气好不好，他每天都去跑步。'],'不管 + (A不A / 多…/ 疑问từ) …，都/也…'),
      ws(3,'竟然','jìngrán',['这么简单的问题，他竟然不知道。'],'竟然 đặt trước vị ngữ, biểu thị ngoài dự đoán.'),
      ws(4,'避免','bìmiǎn',['开车时不要看手机，以免……——为了避免发生事故，开车时不要看手机。'.split('——')[1]],'避免 + 发生/出现 + điều xấu.'),
      ws(5,'值得','zhíde',['这本书很有意思，值得一看。'],'值得 + động từ: đáng để làm gì.'),
      ws(6,'按时','ànshí',['医生让我每天按时吃药。'],'按时 đặt trước động từ: 按时完成/按时吃药/按时上班.'),
      ws(7,'难免','nánmiǎn',['第一次上台演讲，难免会有点儿紧张。'],'难免 + 会 + V: khó tránh khỏi.'),
      ws(8,'否则','fǒuzé',['我们得早点儿出发，否则会赶不上飞机。'],'Vế 1 (điều kiện/yêu cầu)，否则 + hậu quả.'),
      ws(9,'吸引','xīyǐn',['这里美丽的风景吸引了很多游客。'],'A 吸引 B / A 对 B 很有吸引力.'),
      ws(10,'甚至','shènzhì',['他太忙了，甚至连周末都要加班。'],'甚至 (连)…都/也… — nhấn mạnh mức độ cao nhất.'),
      ws(11,'由于','yóuyú',['由于下大雨，运动会推迟了。'],'由于 + nguyên nhân，(所以/因此) + kết quả.'),
      ws(12,'逐渐','zhújiàn',['天气逐渐暖和起来了。'],'逐渐 + V/Adj (起来/了): dần dần.')]
def es(id_, genre, zh, vi, minc, sample, outline, pts, expl):
    return {'id': id_, 'type': 'write_essay', 'genre': genre, 'prompt': T(zh, vi), 'prompt_vi': vi, 'keywords': [], 'image': None,
            'min_chars': minc, 'max_chars': None, 'time_minutes': None, 'sample_answers': [sample], 'outline_vi': outline,
            'max_points': pts, 'answer': None, 'explanation_vi': expl}
E4 = [es('wp4-es-01','narrative','请以“我的周末”为题，写一篇不少于80字的短文。','Viết đoạn ≥ 80 chữ: “Cuối tuần của tôi”.',80,
         '我的周末过得很充实。星期六上午，我一般会先打扫房间，然后去附近的超市买一些水果和蔬菜。下午，我常常和朋友一起去公园打羽毛球，运动完以后感觉特别轻松。星期天我喜欢待在家里，看看书，学学汉语，有时候也会给远方的父母打个视频电话。虽然周末很短，但是它让我放松了心情，也让我有精神迎接新的一周。',
         ['Mở: nhận xét chung về cuối tuần.','Thân: thứ Bảy làm gì (先……然后……), Chủ nhật làm gì.','Kết: cảm nhận (虽然……但是……).'],20,'Dùng từ chỉ trình tự 先、然后、有时候; ≥ 80 chữ.'),
      es('wp4-es-02','descriptive','请写一篇不少于80字的短文，介绍一位对你影响最大的人。','Viết đoạn ≥ 80 chữ giới thiệu người ảnh hưởng lớn nhất đến bạn.',80,
         '对我影响最大的人是我的高中老师王老师。她四十多岁，个子不高，说话很温和。王老师对学生要求很严格，但是也非常关心我们。有一次我考试没考好，心情很差，她不但没有批评我，还耐心地帮我找原因。在她的鼓励下，我的成绩越来越好，最后考上了理想的大学。王老师让我明白了，遇到困难不要放弃。',
         ['Mở: người đó là ai.','Thân: ngoại hình/tính cách + một câu chuyện cụ thể.','Kết: ảnh hưởng, bài học.'],20,'Miêu tả + kể một sự việc cụ thể; dùng 不但……还……, 在……的鼓励下.'),
      es('wp4-es-03','argumentative','有人喜欢住在大城市，有人喜欢住在小城市。你呢？请写一篇不少于80字的短文说明理由。','Bạn thích sống ở thành phố lớn hay nhỏ? Viết ≥ 80 chữ nêu lý do.',80,
         '我更喜欢住在小城市。首先，小城市的生活节奏比较慢，人们没有那么大的压力。其次，小城市的房价和物价都比较低，生活成本不高。另外，小城市空气好，交通也不太堵，上下班很方便。当然，大城市的工作机会更多，但是对我来说，舒适、轻松的生活更重要。',
         ['Mở: nêu lựa chọn.','Thân: 首先/其次/另外 — 2–3 lý do.','Kết: thừa nhận mặt kia (当然……但是……).'],20,'Bài nêu quan điểm ngắn: lựa chọn rõ + 2–3 lý do + câu kết.')]
def ps(i, imgs, zh, sample, outline):
    return {'id': f'wp5-ps-{i:02d}', 'type': 'picture_story_writing', 'images': [{'emoji': e, 'alt_vi': a} for e, a in imgs],
            'prompt': T(zh, 'Dựa vào các tranh, viết câu chuyện ≥ 100 chữ.'), 'prompt_vi': 'Dựa vào các tranh, viết câu chuyện ≥ 100 chữ Hán.',
            'min_chars': 100, 'sample_answers': [sample], 'outline_vi': outline, 'max_points': 40, 'answer': None,
            'explanation_vi': 'Kể đủ các tranh theo trình tự, có mở đầu – diễn biến – kết thúc, dùng từ chỉ thời gian và từ nối.'}
P5 = [ps(1,[('🧑‍💼⏰😴','Tranh 1: Anh nhân viên ngủ quên, đồng hồ chỉ 8 giờ.'),('🏃‍♂️🚌💨','Tranh 2: Anh chạy vội ra bến nhưng xe buýt vừa chạy mất.'),('🚲😅','Tranh 3: Anh đạp xe công cộng đến công ty, mồ hôi nhễ nhại.'),('🏢🗓️😮','Tranh 4: Đến nơi mới phát hiện hôm nay là thứ Bảy, công ty nghỉ.')],
         '请根据下面四张图片，写一个不少于100字的故事。',
         '小李平时工作很忙，常常晚上加班到很晚。这天早上，他一睁开眼睛，发现已经八点了，吓得马上从床上跳了起来。他连早饭都顾不上吃，就急忙跑到车站，可是公共汽车刚刚开走。没办法，他只好扫了一辆共享单车，拼命地往公司骑。到了公司楼下，他已经满头大汗。奇怪的是，公司的大门关着，一个人也没有。他拿出手机一看，才发现今天是星期六。小李又好气又好笑，决定以后一定要好好休息。',
         ['Tranh 1: bối cảnh (平时……这天早上……) + ngủ quên.','Tranh 2–3: vội vàng, lỡ xe, đạp xe (只好、拼命).','Tranh 4: bất ngờ ở cuối (才发现) + cảm xúc/bài học.']),
      ps(2,[('👧🐶📦','Tranh 1: Cô bé thấy một chú chó con trong thùng giấy bên đường.'),('👧🏠🐶🛁','Tranh 2: Cô mang chó về nhà, tắm và cho ăn.'),('📄🔍','Tranh 3: Cô dán thông báo tìm chủ.'),('👴🐶❤️','Tranh 4: Một ông cụ đến nhận chó, cảm ơn cô bé.')],
         '请根据下面四张图片，写一个不少于100字的故事。',
         '放学的路上，小红在路边发现了一个纸箱，里面有一只又脏又瘦的小狗，看起来很可怜。她犹豫了一下，还是把小狗抱回了家。回家后，她给小狗洗了澡，又喂了它一些牛奶。小红想，小狗的主人一定很着急，于是她写了一张寻找主人的启事，贴在小区门口。第二天，一位老爷爷找上门来，原来小狗是他的。老爷爷抱着小狗，激动地对小红说：“谢谢你，好孩子！”小红心里也特别高兴。',
         ['Tranh 1: phát hiện chó con (在……发现了……).','Tranh 2: chăm sóc (给……洗澡、喂……).','Tranh 3: dán thông báo (于是).','Tranh 4: chủ đến nhận, lời cảm ơn, cảm xúc.']),
      ps(3,[('👨‍👩‍👦🗺️🚗','Tranh 1: Gia đình lên kế hoạch lái xe đi du lịch.'),('🚗🛞😟','Tranh 2: Giữa đường xe bị thủng lốp.'),('🧑‍🔧🤝','Tranh 3: Một người nông dân đi ngang giúp thay lốp.'),('🍎🎁😊','Tranh 4: Gia đình mua táo của người nông dân để cảm ơn, mọi người cười vui.')],
         '请根据下面四张图片，写一个不少于100字的故事。',
         '国庆节放假，爸爸决定开车带全家去郊区旅游。出发前，大家一起看地图，选好了路线，心情都很兴奋。没想到，车开到半路，轮胎突然坏了，四周又没有修车的地方，爸爸急得不知道怎么办。这时，一位开着拖拉机的农民路过，他二话不说就停下来帮忙，不到半个小时就把轮胎换好了。爸爸要给他钱，他怎么也不肯收。为了表示感谢，我们买了他果园里的两箱苹果。虽然旅行计划被打乱了，但是大家都觉得这是一次难忘的经历。',
         ['Tranh 1: dịp nghỉ, kế hoạch.','Tranh 2: sự cố (没想到).','Tranh 3: người giúp (这时、二话不说).','Tranh 4: cảm ơn + câu kết (虽然……但是……).'])]
E5 = [es('wp5-es-01','argumentative','“读万卷书，不如行万里路。”你同意这种说法吗？请写一篇不少于200字的短文。','Đọc vạn quyển sách không bằng đi vạn dặm đường — bạn có đồng ý? Viết ≥ 200 chữ.',200,
         '“读万卷书，不如行万里路”的意思是，亲身经历比读书更重要。我认为读书和旅行都很重要，二者不能互相代替。\n一方面，旅行确实能让我们学到书本上学不到的东西。比如，书上说长城很雄伟，可是只有站在长城上，你才能真正感受到它的伟大；在旅途中和当地人交流，也能让我们更深入地了解不同的文化。\n另一方面，读书是旅行的基础。如果出发前对一个地方的历史一点儿也不了解，那么看到的只是风景，很难理解风景背后的故事。而且，并不是每个人都有时间和金钱去远方，书本能让我们用很少的花费“去”世界各地。\n总之，读书让我们的旅行更有意义，旅行又让书本上的知识变得生动。我们应该边读书，边走路。',
         ['Mở: giải thích câu nói + nêu quan điểm.','Thân 1 (一方面): giá trị của trải nghiệm thực tế + ví dụ.','Thân 2 (另一方面): giá trị của đọc sách + ví dụ.','Kết (总之): kết hợp cả hai.'],60,'Nghị luận ≥ 200 chữ: giải thích – quan điểm – 2 luận cứ – kết luận.'),
      es('wp5-es-02','narrative','请以“一次失败的经历”为题，写一篇不少于200字的短文。','Viết bài ≥ 200 chữ: “Một lần thất bại”.',200,
         '我永远忘不了高二那年的演讲比赛。那是我第一次代表班级参加学校的比赛，我准备了整整一个月，把演讲稿背得滚瓜烂熟。可是，当我站在舞台上，看到台下几百双眼睛的时候，脑子里突然一片空白，连第一句话都想不起来了。我站在台上，紧张得手都在发抖，最后只好拿出稿子读完了。比赛结果可想而知，我连前十名都没进。\n回到教室，我难过得哭了。班主任走过来对我说：“失败不可怕，可怕的是因为失败而不敢再尝试。”从那以后，我开始利用每一个机会锻炼自己，主动在课堂上发言，参加各种活动。一年后，我又一次参加了演讲比赛，这一次，我获得了一等奖。\n这次失败让我明白，失败并不是终点，而是成功的起点。',
         ['Mở: thời gian, sự kiện.','Thân: chuẩn bị → sự cố (突然) → kết quả; lời thầy; thay đổi sau đó.','Kết: bài học (……不是……而是……).'],60,'Kể chuyện ≥ 200 chữ, có cao trào, chi tiết tâm lý và bài học.'),
      es('wp5-es-03','argumentative','现在很多大学生毕业后选择自己创业。你怎么看待大学生创业？请写一篇不少于200字的短文。','Bạn nghĩ sao về việc sinh viên tốt nghiệp tự khởi nghiệp? Viết ≥ 200 chữ.',200,
         '近年来，越来越多的大学生毕业后选择自己创业。我认为，大学生创业是一件好事，但一定要做好充分的准备。\n首先，创业能让年轻人实现自己的梦想。大学生思维活跃，敢想敢做，常常能发现新的机会。很多有名的公司都是年轻人在宿舍里创办的。\n其次，创业也能带动就业。一家小公司成功了，就能为社会提供更多的工作岗位。\n但是，创业的风险也很大。大学生缺乏工作经验和资金，对市场也不够了解，失败的可能性很高。所以，我建议大学生不要盲目创业，可以先到企业工作几年，积累经验和人脉，再考虑自己做老板。\n总的来说，只要有准备、有计划，大学生创业是值得鼓励的。',
         ['Mở: hiện tượng + quan điểm.','Thân: lợi ích (首先、其次) + rủi ro (但是).','Gợi ý giải pháp (所以，我建议).','Kết luận.'],60,'Nghị luận ≥ 200 chữ, có cả mặt lợi và hại, có đề xuất.')]
E6p = [es('wp6-pr-01','practical','你在一家公司的人事部工作。公司决定组织员工参加周末的公益植树活动，请你写一份通知，不少于150字。','Viết thông báo ≥ 150 chữ về hoạt động trồng cây thiện nguyện cuối tuần cho nhân viên.',150,
          '关于组织员工参加公益植树活动的通知\n全体员工：\n为了响应“绿色城市”的号召，增强大家的环保意识，公司决定组织员工参加本周末的公益植树活动。具体安排如下：\n一、时间：3月16日（星期六）上午8:30—11:30。\n二、地点：城北森林公园东门。公司将于7:45在大楼门口安排大巴统一接送。\n三、内容：在公园指定区域种植树苗，并为每棵树挂上写有员工名字的牌子。\n四、报名：请于3月13日下班前向本部门负责人报名，名额共80人。\n五、注意事项：请穿运动鞋和方便活动的衣服，自带水杯；工具和手套由公司统一提供。\n欢迎大家踊跃参加！\n人事部\n3月10日',
          ['Tiêu đề + xưng hô.','Mục đích (为了……).','Các mục: thời gian, địa điểm, nội dung, đăng ký, lưu ý.','Kêu gọi, ký tên, ngày.'],40,'Văn bản thông báo: đủ thông tin, thể thức chuẩn, văn phong trang trọng.'),
       es('wp6-pr-02','practical','你在网上买了一台洗衣机，收到后发现不能正常使用，联系客服也没有得到解决。请给这家网店写一封投诉信，不少于150字。','Viết thư khiếu nại ≥ 150 chữ gửi cửa hàng online về máy giặt bị lỗi.',150,
          '尊敬的店铺负责人：\n您好！我是贵店的顾客张明，于11月2日在贵店购买了一台滚筒洗衣机，订单号为2025110287。洗衣机于11月5日送到，但安装后发现无法正常脱水，并且在工作时发出很大的噪音。\n11月6日，我已经通过网上客服说明了情况，并按照客服的要求上传了视频。可是，至今已经过去一个星期，客服只回复说“正在处理”，一直没有给出具体的解决办法。这不仅影响了我的正常生活，也让我对贵店的服务感到非常失望。\n根据相关规定，商品存在质量问题，消费者有权要求退换。因此，我希望贵店能在三天内上门检查，并为我更换一台新的洗衣机。如果问题仍得不到解决，我将向消费者协会投诉。\n期待您的答复。\n此致\n敬礼！\n张明\n11月13日',
          ['Xưng hô trang trọng (尊敬的……).','Trình bày sự việc: thời gian mua, mã đơn, lỗi.','Quá trình liên hệ chưa giải quyết + cảm xúc.','Yêu cầu cụ thể + thời hạn + biện pháp nếu không giải quyết.','此致敬礼 + ký tên + ngày.'],40,'Thư khiếu nại: sự việc rõ, yêu cầu cụ thể, lời lẽ lịch sự nhưng kiên quyết.'),
       es('wp6-pr-03','practical','你是学校留学生会的负责人，要在新学期开学时欢迎新同学。请写一封欢迎信，介绍学校生活的注意事项，不少于150字。','Viết thư chào mừng tân sinh viên quốc tế ≥ 150 chữ, giới thiệu những lưu ý trong cuộc sống ở trường.',150,
          '亲爱的新同学们：\n你们好！欢迎来到我们学校。我是留学生会的负责人。在新学期开始之际，我代表留学生会向大家表示热烈的欢迎！\n刚到一个新的环境，大家可能会有些不习惯。在这里，我想提醒大家几件事：第一，请在报到后一周内到国际处办理居留手续，并及时购买医疗保险；第二，学校图书馆早上八点到晚上十点开放，凭学生证可以免费借书；第三，宿舍晚上十一点关门，请大家注意安全，按时回宿舍。\n此外，留学生会每个月都会组织文化活动，比如包饺子、参观博物馆等，欢迎大家积极参加。如果在学习和生活中遇到困难，可以随时到留学生会办公室找我们。\n祝大家学习顺利，生活愉快！\n留学生会\n9月1日',
          ['Xưng hô + lời chào mừng.','Các lưu ý đánh số (第一、第二、第三).','Giới thiệu hoạt động + nơi hỗ trợ.','Lời chúc + ký tên, ngày.'],40,'Thư chào mừng: thân thiện, thông tin rõ ràng theo mục.')]
E6a = [es('wp6-ar-01','argumentative','有人说“兴趣是最好的老师”，也有人认为“坚持比兴趣更重要”。请谈谈你的看法，不少于300字。','“Hứng thú là người thầy tốt nhất” hay “kiên trì quan trọng hơn hứng thú”? Viết nghị luận ≥ 300 chữ.',300,
          '兴趣与坚持\n“兴趣是最好的老师”，这句话很多人都听过。但在我看来，兴趣只是开始，真正决定一个人能走多远的，是坚持。\n诚然，兴趣能给人带来动力。一个对音乐感兴趣的孩子，会主动去练琴，而不需要父母的催促。在兴趣的推动下，人们学习的效率往往更高。\n然而，任何事情做久了都会遇到困难和枯燥的时候。学钢琴的人都知道，一首曲子可能要重复练习上百遍，这时候最初的新鲜感早已消失。如果仅仅依靠兴趣，很多人就会半途而废。那些最终成为钢琴家的人，并不是一直都觉得练琴有趣，而是在没有兴趣的时候也能坚持下去。\n更重要的是，兴趣常常是在坚持中培养出来的。很多人一开始并不喜欢某件事，但随着不断练习，水平越来越高，从中获得了成就感，兴趣也就慢慢产生了。可见，坚持不仅能弥补兴趣的不足，还能创造新的兴趣。\n因此，我们既要珍惜自己的兴趣，更要培养坚持的品质。只有把兴趣和坚持结合起来，才能在自己选择的道路上走得更远。',
          ['Mở: dẫn câu nói, nêu quan điểm (坚持更重要).','诚然: thừa nhận vai trò của hứng thú.','然而: khi gặp khó khăn hứng thú không đủ — ví dụ piano.','更重要的是: hứng thú nảy sinh trong kiên trì.','因此: kết hợp cả hai.'],60,'Nghị luận có nhượng bộ – phản biện, từ nối cao cấp (诚然、然而、可见、因此).'),
       es('wp6-ar-02','argumentative','越来越多的城市开始限制私家车的使用。你认为这种做法合理吗？请写一篇不少于300字的议论文。','Nhiều thành phố hạn chế xe ô tô cá nhân — có hợp lý không? Viết ≥ 300 chữ.',300,
          '限制私家车是否合理？\n随着经济的发展，私家车已经走进了千家万户。与此同时，交通堵塞和空气污染也成了城市的“老大难”问题。为此，不少城市出台了限制私家车使用的政策。我认为，这种做法在现阶段是合理的，但需要配套措施的支持。\n首先，限制私家车能有效缓解交通压力。以北京为例，实行按车牌尾号限行以后，高峰时段的道路通行速度明显提高。其次，汽车尾气是城市空气污染的重要来源之一，减少私家车的使用，有利于改善空气质量，保护市民健康。\n不过，限制私家车并不能解决所有问题。如果公共交通不够方便，市民出行就会受到很大影响，政策也很难得到大家的支持。因此，政府在限制私家车的同时，必须加大对地铁、公交等公共交通的投入，增加线路，提高服务质量，并鼓励市民骑自行车或步行出行。\n总之，限制私家车是治理“城市病”的一种手段，而不是目的。只有“限”与“建”相结合，才能真正建设一个畅通、绿色、宜居的城市。',
          ['Mở: bối cảnh + quan điểm có điều kiện.','首先/其次: lợi ích (giảm tắc, giảm ô nhiễm) + ví dụ.','不过: hạn chế của chính sách.','因此: giải pháp đồng bộ.','总之: kết luận “限” + “建”.'],60,'Nghị luận chính sách: lợi – hạn chế – giải pháp – kết luận.'),
       es('wp6-ar-03','argumentative','“竞争”和“合作”哪个对个人的成长更重要？请结合实例，写一篇不少于300字的议论文。','Cạnh tranh hay hợp tác quan trọng hơn cho sự trưởng thành? Viết ≥ 300 chữ, có ví dụ.',300,
          '竞争与合作\n在现代社会，竞争无处不在：考试要竞争，求职要竞争，工作中也要竞争。于是有人认为，只有学会竞争，才能取得成功。但我认为，对个人成长来说，合作比竞争更重要。\n诚然，适度的竞争能激发人的潜力。运动员在比赛中往往能创造平时训练达不到的成绩，学生在竞争中也会更加努力。\n但是，一个人的能力总是有限的，很多事情单靠个人是无法完成的。一部电影的成功，离不开导演、演员、摄影师等几百人的共同努力；一项重大的科学发现，也往往是一个团队多年合作的结果。在合作中，我们能学习别人的长处，弥补自己的不足，这本身就是一种成长。\n更值得注意的是，过度的竞争容易让人变得自私和焦虑，甚至把身边的人都看作对手。而懂得合作的人，不仅能把事情做好，还能赢得别人的信任和尊重，获得更多的机会。\n当然，竞争与合作并不是对立的。最理想的状态是在合作中竞争，在竞争中合作。我们应该把对手当作伙伴，在互相学习中共同进步。',
          ['Mở: hiện tượng cạnh tranh + quan điểm (hợp tác quan trọng hơn).','诚然: mặt tích cực của cạnh tranh.','但是: giới hạn cá nhân, ví dụ phim/khoa học.','更值得注意的是: tác hại cạnh tranh quá mức.','当然: thống nhất hai mặt.'],60,'Nghị luận so sánh có ví dụ thực tế, kết luận biện chứng.')]
sets = {
 4: [{'id': 'wp4-sentence', 'level': 4, 'type': 'write_sentence', 'title_vi': 'Đặt câu với từ cho sẵn – HSK 4', 'questions': W4},
     {'id': 'wp4-essay', 'level': 4, 'type': 'write_essay', 'title_vi': 'Viết đoạn văn ≥ 80 chữ – HSK 4', 'questions': E4}],
 5: [{'id': 'wp5-picture', 'level': 5, 'type': 'picture_story_writing', 'title_vi': 'Kể chuyện theo tranh – HSK 5', 'questions': P5},
     {'id': 'wp5-essay', 'level': 5, 'type': 'write_essay', 'title_vi': 'Viết bài văn ≥ 200 chữ – HSK 5', 'questions': E5}],
 6: [{'id': 'wp6-practical', 'level': 6, 'type': 'write_essay', 'title_vi': 'Văn bản ứng dụng ≥ 150 chữ – HSK 6', 'questions': E6p},
     {'id': 'wp6-argument', 'level': 6, 'type': 'write_essay', 'title_vi': 'Nghị luận ≥ 300 chữ – HSK 6', 'questions': E6a}]}
for lv, s in sets.items():
    json.dump({'level': lv, 'sets': s}, open(f'{D}/practice-hsk{lv}.json', 'w', encoding='utf-8'), ensure_ascii=False, indent=2)
print('ok')
