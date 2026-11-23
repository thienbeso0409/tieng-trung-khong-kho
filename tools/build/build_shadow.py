import json, sys, os
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
from pyh import P, Z
OUT = '/home/claude/tieng-trung-khong-kho/data/speaking'
IT = [
    (1, 'Giới thiệu bản thân', [('女', '你好，我叫小月。', 'Xin chào, tôi tên Tiểu Nguyệt.'), ('女', '我是越南人，今年二十岁。', 'Tôi là người Việt Nam, năm nay hai mươi tuổi.'),
                               ('女', '我是大学生，在学汉语。', 'Tôi là sinh viên, đang học tiếng Trung.'), ('女', '认识你很高兴！', 'Rất vui được làm quen với bạn!')]),
    (1, 'Ở cửa hàng', [('男', '你好，这个多少钱？', 'Chào bạn, cái này bao nhiêu tiền?'), ('女', '十五块。', 'Mười lăm tệ.'),
                      ('男', '太贵了，便宜一点儿吧。', 'Đắt quá, rẻ hơn chút đi.'), ('女', '好吧，十块。', 'Thôi được, mười tệ.')]),
    (2, 'Một ngày của tôi', [('女', '我每天早上六点半起床。', 'Mỗi sáng tôi dậy lúc sáu rưỡi.'), ('女', '吃完早饭以后，我坐地铁去公司。', 'Ăn sáng xong, tôi đi tàu điện ngầm đến công ty.'),
                            ('女', '中午我和同事一起吃饭。', 'Buổi trưa tôi ăn cơm cùng đồng nghiệp.'), ('女', '晚上我常常在家看书或者看电视。', 'Buổi tối tôi thường ở nhà đọc sách hoặc xem tivi.')]),
    (2, 'Hỏi đường', [('男', '请问，地铁站怎么走？', 'Xin hỏi, đi đến ga tàu điện ngầm thế nào?'), ('女', '一直往前走，到了路口往右走。', 'Cứ đi thẳng, đến ngã tư thì rẽ phải.'),
                     ('男', '离这儿远吗？', 'Có xa đây không?'), ('女', '不远，走路五分钟就到了。', 'Không xa, đi bộ năm phút là đến.')]),
    (3, 'Kế hoạch cuối tuần', [('男', '这个周末你有什么打算？', 'Cuối tuần này bạn có dự định gì?'), ('女', '我打算和朋友一起去爬山。', 'Tôi định đi leo núi cùng bạn bè.'),
                              ('男', '听说山上的风景特别美。', 'Nghe nói phong cảnh trên núi đặc biệt đẹp.'), ('女', '是啊，而且爬山还能锻炼身体。', 'Đúng vậy, hơn nữa leo núi còn rèn luyện sức khỏe.'),
                              ('男', '如果天气好的话，我也想去。', 'Nếu thời tiết đẹp thì tôi cũng muốn đi.')]),
    (3, 'Học tiếng Trung', [('女', '刚开始学汉语的时候，我觉得声调特别难。', 'Lúc mới học tiếng Trung, tôi thấy thanh điệu đặc biệt khó.'), ('女', '后来我每天跟着录音练习。', 'Sau đó ngày nào tôi cũng luyện theo ghi âm.'),
                           ('女', '现在我已经能用汉语和中国朋友聊天了。', 'Bây giờ tôi đã có thể nói chuyện với bạn Trung Quốc bằng tiếng Trung.'), ('女', '只要坚持，你一定也能学好。', 'Chỉ cần kiên trì, bạn nhất định cũng học tốt.')]),
    (4, 'Áp lực công việc', [('男', '最近工作压力越来越大，经常要加班。', 'Dạo này áp lực công việc ngày càng lớn, thường xuyên phải tăng ca.'), ('男', '为了放松，我开始每天下班后去跑步。', 'Để thư giãn, tôi bắt đầu chạy bộ mỗi ngày sau giờ làm.'),
                            ('男', '跑完步以后，心情会好很多。', 'Chạy xong, tâm trạng tốt lên nhiều.'), ('男', '我觉得工作和生活应该保持平衡。', 'Tôi thấy công việc và cuộc sống nên giữ cân bằng.'),
                            ('男', '身体健康才是最重要的。', 'Sức khỏe mới là quan trọng nhất.')]),
    (5, 'Thói quen đọc sách', [('女', '随着智能手机的普及，人们的阅读习惯发生了很大变化。', 'Cùng với sự phổ biến của điện thoại thông minh, thói quen đọc của mọi người đã thay đổi lớn.'),
                              ('女', '很多人更喜欢在手机上看短文章。', 'Nhiều người thích đọc bài ngắn trên điện thoại hơn.'), ('女', '这种阅读方式虽然方便，但是容易让人注意力不集中。', 'Cách đọc này tuy tiện lợi nhưng dễ khiến người ta mất tập trung.'),
                              ('女', '我建议大家每天抽出半个小时读一本纸质书。', 'Tôi khuyên mọi người mỗi ngày dành nửa tiếng đọc một cuốn sách giấy.'), ('女', '坚持下去，你会发现自己的思考能力提高了。', 'Kiên trì, bạn sẽ thấy khả năng tư duy của mình được nâng cao.')]),
    (6, 'Bảo tồn văn hóa truyền thống', [('男', '在全球化的背景下，传统文化面临着前所未有的挑战。', 'Trong bối cảnh toàn cầu hóa, văn hóa truyền thống đối mặt với thách thức chưa từng có.'),
                                        ('男', '一些古老的手艺因为缺少传承人而逐渐消失。', 'Một số nghề thủ công cổ đang dần biến mất vì thiếu người kế thừa.'), ('男', '然而，也有不少年轻人开始用新的方式重新诠释传统。', 'Tuy nhiên, cũng có không ít người trẻ bắt đầu diễn giải lại truyền thống theo cách mới.'),
                                        ('男', '他们借助互联网，让更多人了解并爱上了这些文化遗产。', 'Họ nhờ internet giúp nhiều người hiểu và yêu những di sản văn hóa này.'), ('男', '可见，保护传统并不意味着拒绝创新。', 'Có thể thấy, bảo tồn truyền thống không có nghĩa là từ chối đổi mới.')]),
]
items = []
cnt = {}
for lv, title, segs in IT:
    cnt[lv] = cnt.get(lv, 0) + 1
    items.append({'id': f'sh-tts-{len(items) + 1:02d}', 'level': lv, 'title': title, 'source': 'tts', 'youtube': None,
                  'segments': [{'start': None, 'end': None, 'hanzi': Z(z), 'pinyin': P(z), 'vi': v, 'speaker': sp} for sp, z, v in segs]})
json.dump({'notes': 'Chỉ gồm bài nguồn TTS. Không đưa video YouTube vì chưa xác minh được videoId và mốc thời gian chính xác; người dùng có thể tự thêm bài YouTube trong web.',
           'items': items}, open(f'{OUT}/shadowing.json', 'w', encoding='utf-8'), ensure_ascii=False, indent=2)
import collections
c = collections.Counter()
for i in items: c[i['level']] += len(i['segments'])
print(c, sum(v for k, v in c.items() if k <= 3))
