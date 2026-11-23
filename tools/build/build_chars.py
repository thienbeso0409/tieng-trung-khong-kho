import json, re, sys, os, unicodedata
sys.path.insert(0, '.')
from pypinyin import pinyin, Style
import importlib.util
_sp=importlib.util.spec_from_file_location('bv_sort','/dev/null')
from sortkey import sort_key
db = json.load(open('chardb.json', encoding='utf-8'))
lv = json.load(open('charlv.json', encoding='utf-8'))
RAD = {'亻':'nhân đứng (người)','人':'nhân (người)','口':'khẩu (miệng)','女':'nữ (phụ nữ)','子':'tử (con)','木':'mộc (cây)','氵':'thủy (nước)','水':'thủy (nước)','扌':'thủ (tay)','手':'thủ (tay)','讠':'ngôn (lời nói)','言':'ngôn (lời nói)','忄':'tâm đứng (lòng)','心':'tâm (tim, lòng)','日':'nhật (mặt trời)','月':'nguyệt (trăng, thịt)','土':'thổ (đất)','艹':'thảo (cỏ)','宀':'miên (mái nhà)','辶':'sước (đi)','纟':'mịch (sợi tơ)','钅':'kim (kim loại)','金':'kim (kim loại)','火':'hỏa (lửa)','灬':'hỏa (lửa)','目':'mục (mắt)','禾':'hòa (lúa)','竹':'trúc (tre)','⺮':'trúc (tre)','米':'mễ (gạo)','衤':'y (áo)','衣':'y (áo)','礻':'thị (thần)','王':'ngọc (ngọc)','贝':'bối (vỏ sò, tiền)','车':'xa (xe)','足':'túc (chân)','⻊':'túc (chân)','门':'môn (cửa)','阝':'phụ/ấp (gò, thành)','刂':'đao (dao)','刀':'đao (dao)','力':'lực (sức)','又':'hựu (tay, lại)','大':'đại (to)','小':'tiểu (nhỏ)','山':'sơn (núi)','广':'nghiễm (mái hiên)','疒':'nạch (bệnh)','饣':'thực (ăn)','食':'thực (ăn)','马':'mã (ngựa)','鸟':'điểu (chim)','鱼':'ngư (cá)','雨':'vũ (mưa)','页':'hiệt (đầu)','走':'tẩu (đi)','攵':'phộc (đánh)','欠':'khiếm (thiếu)','犭':'khuyển (chó)','父':'phụ (cha)','白':'bạch (trắng)','田':'điền (ruộng)','石':'thạch (đá)','穴':'huyệt (hang)','立':'lập (đứng)','耳':'nhĩ (tai)','见':'kiến (thấy)','皿':'mãnh (bát đĩa)','巾':'cân (khăn)','彳':'xích (bước chân)','尸':'thi (thân)','寸':'thốn (tấc)','工':'công (thợ)','己':'kỷ (bản thân)','几':'kỷ (ghế)','八':'bát (tám)','十':'thập (mười)','一':'nhất (một)','丨':'cổn (nét sổ)','丿':'phiệt (nét phẩy)','丶':'chủ (nét chấm)','乙':'ất','亠':'đầu (nắp)','冖':'mịch (khăn trùm)','冫':'băng (nước đá)','二':'nhị (hai)','儿':'nhi (trẻ con)','厂':'hán (sườn núi)','匚':'phương (hộp)','卜':'bốc (bói)','厶':'khư (riêng)','囗':'vi (vây quanh)','夕':'tịch (đêm)','夂':'tri (đi chậm)','弓':'cung (cung)','彡':'sam (lông)','戈':'qua (giáo mác)','户':'hộ (cửa)','方':'phương (hướng)','文':'văn (văn)','斤':'cân (rìu)','止':'chỉ (dừng)','歹':'đãi (xấu)','毛':'mao (lông)','气':'khí (hơi)','牛':'ngưu (bò)','牜':'ngưu (bò)','犬':'khuyển (chó)','玉':'ngọc','瓜':'qua (dưa)','生':'sinh (sống)','用':'dụng (dùng)','矢':'thỉ (mũi tên)','羊':'dương (dê)','⺶':'dương (dê)','羽':'vũ (lông vũ)','老':'lão (già)','而':'nhi (mà)','肉':'nhục (thịt)','自':'tự (tự mình)','舌':'thiệt (lưỡi)','舟':'chu (thuyền)','色':'sắc (màu)','虫':'trùng (sâu bọ)','血':'huyết (máu)','西':'tây (phía tây)','覀':'á (che)','角':'giác (sừng)','谷':'cốc (thung lũng)','豕':'thỉ (lợn)','身':'thân (thân thể)','酉':'dậu (rượu)','里':'lý (dặm)','长':'trường (dài)','隹':'chuy (chim đuôi ngắn)','青':'thanh (xanh)','非':'phi (không)','面':'diện (mặt)','音':'âm (âm thanh)','风':'phong (gió)','飞':'phi (bay)','首':'thủ (đầu)','香':'hương (thơm)','高':'cao (cao)','黑':'hắc (đen)','齿':'xỉ (răng)','龙':'long (rồng)','爫':'trảo (móng vuốt)','爪':'trảo (móng vuốt)','罒':'võng (lưới)','网':'võng (lưới)','皮':'bì (da)','示':'thị (chỉ thị)','殳':'thù (binh khí)','黄':'hoàng (vàng)','麻':'ma (gai)','鼻':'tỵ (mũi)','爿':'tường (mảnh gỗ)','门':'môn (cửa)','凵':'khảm (há miệng)','冂':'quynh (vùng biên)','廴':'dẫn (bước dài)','卩':'tiết (đốt tre)','彐':'kệ (đầu con nhím)','⺈':'đao','𠂉':'(bộ phận)','乚':'ất','亅':'quyết (nét móc)','比':'tỉ (so sánh)','牙':'nha (răng)','片':'phiến (mảnh)','斗':'đẩu (cái đấu)','无':'vô (không)','支':'chi (cành)','曰':'viết (nói)','止':'chỉ (dừng)','臣':'thần (bề tôi)','至':'chí (đến)','臼':'cữu (cối)','艮':'cấn','辛':'tân (cay)','辰':'thần','采':'biện','麦':'mạch (lúa mì)','鬼':'quỷ','齐':'tề (đều)','鼠':'thử (chuột)','革':'cách (da thuộc)','骨':'cốt (xương)','走':'tẩu (đi)','赤':'xích (đỏ)','豆':'đậu (hạt đậu)','邑':'ấp','龟':'quy (rùa)','⻌':'sước (đi)','⻏':'ấp (thành)','⻖':'phụ (gò)','⺌':'tiểu (nhỏ)','⺍':'tiểu (nhỏ)','⺊':'bốc','⺆':'quynh','⺗':'tâm','⺧':'ngưu','⺨':'khuyển','⺪':'sơ','⺫':'võng','⺮':'trúc','⺶':'dương','⻗':'vũ','⻝':'thực','⻞':'thực','⻢':'mã','⻣':'cốt','⻤':'quỷ','⻨':'mạch','⻩':'hoàng','⻮':'xỉ','⺼':'nhục (thịt)','丷':'bát (tám)','勹':'bao (bọc)','匸':'hệ (che đậy)','士':'sĩ (kẻ sĩ)','干':'can (khiên)','廾':'củng (chắp tay)','糸':'mịch (sợi tơ)','入':'nhập (vào)','尢':'uông (yếu)','母':'vô/mẫu','禸':'nhựu (vết chân thú)','耂':'lão (già)','舛':'suyễn (trái ngược)','⺀':'băng (nước đá)','乛':'ất','匕':'chủy (cái thìa)','夊':'truy (đi chậm)','氺':'thủy (nước)','瓦':'ngõa (ngói)','甘':'cam (ngọt)','行':'hành (đi)','㔾':'tiết (đốt tre)','丬':'tường (mảnh gỗ)','幺':'yêu (nhỏ)','弋':'dặc (cọc)','民':'dân','缶':'phẫu (đồ sành)','釆':'biện (phân biệt)'}
V = {}
SING = {}
for L in (1, 2, 3):
    d = json.load(open(f'/home/claude/tieng-trung-khong-kho/data/vocab/hsk{L}.json', encoding='utf-8'))
    for w in d['words']:
        if len(w['hanzi']) == 1:
            SING.setdefault(w['hanzi'], w['pinyin'].split(',')[0].strip())
        for c in set(w['hanzi']):
            V.setdefault(c, []).append(w['hanzi'])
OVP = {'得': 'dé', '地': 'dì', '着': 'zhe', '了': 'le', '还': 'hái', '长': 'cháng', '行': 'xíng', '只': 'zhǐ', '为': 'wèi', '种': 'zhǒng', '重': 'zhòng', '教': 'jiāo', '觉': 'jué', '乐': 'lè', '便': 'biàn', '差': 'chà', '调': 'diào', '背': 'bèi', '假': 'jiǎ', '干': 'gān', '空': 'kōng', '相': 'xiāng', '发': 'fā', '数': 'shù', '场': 'chǎng', '应': 'yīng', '量': 'liàng', '朵': 'duǒ', '么': 'me', '们': 'men', '吧': 'ba', '吗': 'ma', '呢': 'ne', '的': 'de', '啊': 'a', '子': 'zǐ', '个': 'gè', '头': 'tóu', '思': 'sī', '亮': 'liàng', '睛': 'jīng', '候': 'hòu', '识': 'shí', '宜': 'yí', '友': 'yǒu', '服': 'fú', '息': 'xī', '欢': 'huān', '谢': 'xiè', '诉': 'sù', '夫': 'fū', '楚': 'chǔ', '凌': 'líng', '冒': 'mào', '乎': 'hū', '戏': 'xì', '啡': 'fēi', '咖': 'kā', '儿': 'ér', '几': 'jǐ', '哪': 'nǎ', '那': 'nà', '都': 'dōu', '和': 'hé', '少': 'shǎo', '好': 'hǎo', '看': 'kàn', '要': 'yào', '没': 'méi', '会': 'huì', '中': 'zhōng', '正': 'zhèng', '分': 'fēn', '当': 'dāng', '难': 'nán', '处': 'chù', '角': 'jiǎo', '刻': 'kè', '片': 'piàn', '倒': 'dǎo', '省': 'shěng', '熟': 'shú', '称': 'chēng', '弄': 'nòng', '占': 'zhàn', '血': 'xuè', '漂': 'piào', '似': 'sì'}
ROOT = '/home/claude/tieng-trung-khong-kho/data/writing'
os.makedirs(ROOT, exist_ok=True)
TGT = {1: 246, 2: 125, 3: 284}
allc = set()
ALLROWS = {}
for L0, fn in ((1, 'ch1'), (2, 'ch2'), (3, 'ch3'), (3, 'ch3b')):
    for l in open(f'{fn}.txt', encoding='utf-8'):
        if l.strip():
            r = l.rstrip('\n').split('|')
            if r[0] in ALLROWS: print('DUPROW', r[0])
            ALLROWS.setdefault(r[0], (r, L0))
VL = {}
for L0 in (1, 2, 3):
    d0 = json.load(open(f'/home/claude/tieng-trung-khong-kho/data/vocab/hsk{L0}.json', encoding='utf-8'))
    for w in d0['words']:
        for c in w['hanzi']:
            VL.setdefault(c, L0)
def lvl(c, L0):
    return min(L0, VL.get(c, 9))
for L in (1, 2, 3):
    rows = [r for c, (r, L0) in ALLROWS.items() if lvl(c, L0) == L]
    chars = []
    for c, hv, mean in rows:
        assert len(c) == 1, c
        if c in allc:
            print('DUP', c); continue
        allc.add(c)
        info = db.get(c)
        if not info or not info['s']:
            print('NO DATA', c); continue
        py = OVP.get(c) or SING.get(c) or pinyin(c, style=Style.TONE)[0][0]
        r = info['r']
        o = {'hanzi': c, 'pinyin': py, 'meaning_vi': mean, 'han_viet': hv, 'strokes': info['s'], 'radical': r}
        if r in RAD:
            o['radical_meaning_vi'] = RAD[r]
        o['level'] = L
        ws = sorted(set(V.get(c, [])), key=len)[:6]
        if ws:
            o['words'] = ws
        chars.append(o)
    chars.sort(key=lambda o: sort_key(o['pinyin'], o['hanzi']))
    data = {'level': L, 'standard': 'HSK3.0', 'target_count': TGT[L], 'count': len(chars), 'complete': len(chars) >= TGT[L],
            'notes': 'Cấp của chữ = cấp thấp nhất xuất hiện trong từ vựng HSK 3.0 (chuẩn 2021, data/vocab) hoặc trong đại cương thi 2025. Bao phủ 100% chữ của vocab HSK1–2; HSK3 gồm toàn bộ chữ mới của đại cương 2025 cấp 3. Số nét, bộ thủ: Make Me a Hanzi (cùng nguồn dữ liệu nét của Hanzi Writer).',
            'characters': chars}
    json.dump(data, open(f'{ROOT}/characters-hsk{L}.json', 'w', encoding='utf-8'), ensure_ascii=False, indent=2)
    miss = [o['radical'] for o in chars if 'radical_meaning_vi' not in o]
    print(L, len(chars), 'no radical meaning:', ''.join(sorted(set(miss))))
want = set(lv)
print('missing from 2025 set:', ''.join(c for c in want if c not in allc))
