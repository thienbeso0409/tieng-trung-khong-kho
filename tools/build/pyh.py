"""Pinyin helper: P(zh) -> pinyin string (word-spaced, tone marks).
Override syntax in source text:  字{pīnyīn}  forces reading of preceding char.
"""
import json, re, os, sys, logging
import jieba
from pypinyin import pinyin, Style, load_phrases_dict
jieba.setLogLevel(logging.WARNING)

B = os.path.dirname(os.path.abspath(__file__))
OFF = json.load(open(os.path.join(B, 'official.json'), encoding='utf-8'))

# word -> pinyin (from official list); multi-reading single chars excluded
VOC = {}
for lv in ('1', '2', '3'):
    for h, p, _ in OFF[lv]:
        if h in ('虽然……但是',):
            continue
        if ',' in p:
            continue
        if len(h) == 1:
            continue  # single chars: use contextual pypinyin
        VOC.setdefault(h, p)
# extra words / names
EXTRA = {
    '王明': 'Wáng Míng', '李明': 'Lǐ Míng', '小王': 'Xiǎo Wáng', '小李': 'Xiǎo Lǐ', '小张': 'Xiǎo Zhāng',
    '小明': 'Xiǎomíng', '小月': 'Xiǎoyuè', '大卫': 'Dàwèi', '安娜': 'Ānnà', '玛丽': 'Mǎlì',
    '王老师': 'Wáng lǎoshī', '李老师': 'Lǐ lǎoshī', '张老师': 'Zhāng lǎoshī', '陈老师': 'Chén lǎoshī',
    '王先生': 'Wáng xiānsheng', '李先生': 'Lǐ xiānsheng', '张先生': 'Zhāng xiānsheng',
    '王小姐': 'Wáng xiǎojie', '李小姐': 'Lǐ xiǎojie', '张小姐': 'Zhāng xiǎojie',
    '王经理': 'Wáng jīnglǐ', '李经理': 'Lǐ jīnglǐ', '张经理': 'Zhāng jīnglǐ',
    '上海': 'Shànghǎi', '四十分钟': 'sìshí fēnzhōng', '二十分钟': 'èrshí fēnzhōng', '十分钟': 'shí fēnzhōng', '五分钟': 'wǔ fēnzhōng', '下个': 'xià ge', '上个': 'shàng ge', '假新闻': 'jiǎ xīnwén', '过春节': 'guò Chūnjié', '美国': 'Měiguó', '美国人': 'Měiguó rén', '小白': 'Xiǎobái', '日本': 'Rìběn', '英国': 'Yīngguó', '法国': 'Fǎguó', '小林': 'Xiǎo Lín', '小红': 'Xiǎohóng', '小刚': 'Xiǎogāng', '丽丽': 'Lìli', '小美': 'Xiǎoměi', '老王': 'Lǎo Wáng', '老李': 'Lǎo Lǐ', '小雨': 'Xiǎoyǔ', '玛丽': 'Mǎlì', '越南': 'Yuènán', '河内': 'Hénèi', '越南人': 'Yuènán rén', '中国人': 'Zhōngguó rén',
    '一点儿': 'yìdiǎnr', '哪儿': 'nǎr', '那儿': 'nàr', '这儿': 'zhèr', '一会儿': 'yíhuìr',
    '没有': 'méiyǒu', '不是': 'bú shì', '不要': 'bú yào', '不会': 'bú huì', '不去': 'bú qù', '不对': 'bú duì',
    '不太': 'bú tài', '不客气': 'bú kèqi', '对不起': 'duìbuqǐ', '不用': 'bú yòng', '不错': 'búcuò',
    '一个': 'yí ge', '这个': 'zhège', '那个': 'nàge', '哪个': 'nǎge', '几个': 'jǐ ge', '两个': 'liǎng ge',
    '三个': 'sān ge', '四个': 'sì ge', '五个': 'wǔ ge', '每个': 'měi ge',
    '一下': 'yíxià', '一起': 'yìqǐ', '一样': 'yíyàng', '一定': 'yídìng', '一共': 'yígòng', '一直': 'yìzhí',
    '一般': 'yìbān', '一边': 'yìbiān', '一些': 'yìxiē', '一天': 'yì tiān', '一年': 'yì nián',
    '一杯': 'yì bēi', '一本': 'yì běn', '一件': 'yí jiàn', '一次': 'yí cì', '一块': 'yí kuài',
    '一张': 'yì zhāng', '一条': 'yì tiáo', '一位': 'yí wèi', '一辆': 'yí liàng', '一双': 'yì shuāng',
    '一点': 'yìdiǎn', '一半': 'yíbàn', '一层': 'yì céng', '一碗': 'yì wǎn', '一只': 'yì zhī',
    '东西': 'dōngxi', '先生': 'xiānsheng', '知道': 'zhīdao', '已经': 'yǐjing', '时候': 'shíhou',
    '朋友': 'péngyou', '喜欢': 'xǐhuan', '衣服': 'yīfu', '谢谢': 'xièxie', '学生': 'xuésheng',
    '认识': 'rènshi', '漂亮': 'piàoliang', '什么': 'shénme', '怎么': 'zěnme', '多少': 'duōshao',
    '我们': 'wǒmen', '你们': 'nǐmen', '他们': 'tāmen', '她们': 'tāmen', '它们': 'tāmen', '咱们': 'zánmen',
    '这些': 'zhèxiē', '那些': 'nàxiē', '哪些': 'nǎxiē', '晚上': 'wǎnshang', '早上': 'zǎoshang',
    '休息': 'xiūxi', '告诉': 'gàosu', '觉得': 'juéde', '意思': 'yìsi', '事情': 'shìqing',
    '眼睛': 'yǎnjing', '丈夫': 'zhàngfu', '妻子': 'qīzi', '便宜': 'piányi', '孩子': 'háizi',
    '头发': 'tóufa', '舒服': 'shūfu', '明白': 'míngbai', '清楚': 'qīngchu', '聪明': 'cōngming',
    '关系': 'guānxi', '故事': 'gùshi', '地方': 'dìfang', '叔叔': 'shūshu', '奶奶': 'nǎinai',
    '爷爷': 'yéye', '耳朵': 'ěrduo', '月亮': 'yuèliang', '照顾': 'zhàogu', '记得': 'jìde',
    '起来': 'qǐlai', '太阳': 'tàiyáng', '葡萄': 'pútao', '别人': 'biéren', '还是': 'háishi',
    '为什么': 'wèishénme', '怎么样': 'zěnmeyàng', '后面': 'hòumian', '前面': 'qiánmiàn',
    '上面': 'shàngmian', '下面': 'xiàmian', '里面': 'lǐmian', '外面': 'wàimian',
    '右边': 'yòubian', '左边': 'zuǒbian', '旁边': 'pángbiān', '时间': 'shíjiān',
    '一百': 'yìbǎi', '一千': 'yìqiān', '一万': 'yíwàn', '第一': 'dì-yī', '星期一': 'xīngqīyī',
    '星期二': 'xīngqī\'èr', '星期三': 'xīngqīsān', '星期四': 'xīngqīsì', '星期五': 'xīngqīwǔ',
    '星期六': 'xīngqīliù', '星期天': 'xīngqītiān', '星期日': 'xīngqīrì',
    '女儿': 'nǚ\'ér', '儿子': 'érzi', '桌子': 'zhuōzi', '椅子': 'yǐzi', '杯子': 'bēizi',
    '名字': 'míngzi', '小姐': 'xiǎojie', '妈妈': 'māma', '爸爸': 'bàba', '哥哥': 'gēge',
    '姐姐': 'jiějie', '弟弟': 'dìdi', '妹妹': 'mèimei', '同学': 'tóngxué', '老师': 'lǎoshī',
    '可爱': 'kě\'ài', '生气': 'shēngqì', '要求': 'yāoqiú', '睡觉': 'shuìjiào',
    '一会': 'yíhuì', '一月': 'yīyuè', '十一': 'shíyī', '一号': 'yī hào', '一点钟': 'yī diǎn zhōng',
    '还给': 'huán gěi', '长大': 'zhǎngdà', '很长': 'hěn cháng', '多长': 'duō cháng', '太长': 'tài cháng',
    '得到': 'dédào', '觉得': 'juéde', '跑得': 'pǎo de', '说得': 'shuō de', '写得': 'xiě de', '做得': 'zuò de',
    '长得': 'zhǎng de', '唱得': 'chàng de', '游得': 'yóu de', '学得': 'xué de', '来得': 'lái de', '睡得': 'shuì de',
    '看得': 'kàn de', '吃得': 'chī de', '跳得': 'tiào de', '讲得': 'jiǎng de', '画得': 'huà de', '考得': 'kǎo de',
    '了解': 'liǎojiě', '为了': 'wèile', '因为': 'yīnwèi', '行李箱': 'xínglǐxiāng', '银行': 'yínháng',
    '中间': 'zhōngjiān', '着急': 'zháojí', '睡着': 'shuìzháo', '看着': 'kànzhe', '音乐': 'yīnyuè', '快乐': 'kuàilè',
    '一下儿': 'yíxiàr', '有点儿': 'yǒudiǎnr', '一块儿': 'yíkuàir', '玩儿': 'wánr', '好玩儿': 'hǎowánr',
    '大学': 'dàxué', '大学生': 'dàxuéshēng', '中文': 'Zhōngwén', '小时': 'xiǎoshí',
    '没关系': 'méi guānxi', '打电话': 'dǎ diànhuà', '公共汽车': 'gōnggòng qìchē',
}
import csv as _csv
for _x in _csv.DictReader(open('/tmp/dl/hsk30.csv', encoding='utf-8')):
    if _x['Level'] == '7-9':
        continue
    _forms = _x['Simplified'].split('|')
    _pys = _x['WebPinyin'].split('|')
    for _f, _p in zip(_forms, _pys):
        if '（' in _f or len(_f) < 2 or _f.startswith('…'):
            continue
        _p = _p.replace('∥', '').replace('·', '').replace('//', '')
        VOC.setdefault(_f, _p)
VOC.update(EXTRA)
for w in VOC:
    jieba.add_word(w, freq=2000000)
for w in ['认真地', '慢慢地', '高兴地']:
    jieba.del_word(w)

PUNCT = {'，': ',', '。': '.', '？': '?', '！': '!', '：': ':', '“': '"', '”': '"', '、': ',', '；': ';',
         '……': '...', '…': '...', '（': '(', '）': ')', '★': '★', '—': '-', '《': '"', '》': '"', '·': ' '}
FORCE = {'好': 'hǎo', '都': 'dōu', '少': 'shǎo', '和': 'hé', '要': 'yào', '看': 'kàn', '分': 'fēn', '中': 'zhōng', '正': 'zhèng', '当': 'dāng', '上': 'shàng', '下': 'xià', '大': 'dà', '会': 'huì', '没': 'méi', '那': 'nà', '哪': 'nǎ', '这': 'zhè', '吃': 'chī', '喝': 'hē', '听': 'tīng', '读': 'dú', '几': 'jǐ', '家': 'jiā', '里': 'lǐ', '能': 'néng', '是': 'shì', '谁': 'shéi', '月': 'yuè', '年': 'nián', '日': 'rì', '人': 'rén', '去': 'qù', '来': 'lái', '在': 'zài', '有': 'yǒu', '给': 'gěi', '把': 'bǎ', '被': 'bèi', '比': 'bǐ', '从': 'cóng', '对': 'duì', '向': 'xiàng', '跟': 'gēn', '离': 'lí', '往': 'wǎng', '让': 'ràng', '别': 'bié', '再': 'zài', '又': 'yòu', '也': 'yě', '就': 'jiù', '才': 'cái', '更': 'gèng', '最': 'zuì', '太': 'tài', '很': 'hěn', '真': 'zhēn', '多': 'duō', '还': 'hái', '长': 'cháng', '得': 'de', '地': 'de', '干': 'gān', '过': 'guo', '行': 'xíng', '为': 'wèi', '只': 'zhǐ', '种': 'zhǒng', '教': 'jiāo', '差': 'chà', '发': 'fā', '空': 'kòng', '重': 'zhòng', '数': 'shù', '便': 'biàn', '乐': 'lè', '相': 'xiāng', '觉': 'jué', '调': 'diào', '背': 'bèi', '假': 'jià', '场': 'chǎng', '应': 'yīng', '量': 'liàng', '头': 'tóu'}
FLAG = set('还长得地为行种便觉乐差只重教数空干相发头过着了调背假场应量好')
TONE4 = set('àèìòùǜ')
ANY_TONE = {'1': set('āēīōūǖ'), '2': set('áéíóúǘ'), '3': set('ǎěǐǒǔǚ'), '4': TONE4}


def tone_of(syl):
    for t, s in ANY_TONE.items():
        if any(c in s for c in syl):
            return t
    return '0'


def _first_syl(p):
    return p.split()[0] if p.split() else ''


def P(zh):
    """Return pinyin for Chinese text; also returns cleaned zh via Pz."""
    zh_clean, ov = strip_ov(zh)
    return _py(zh_clean, ov)


def strip_ov(zh):
    ov = {}
    out = []
    i = 0
    while i < len(zh):
        c = zh[i]
        if c == '{':
            j = zh.index('}', i)
            ov[len(out) - 1] = zh[i + 1:j]
            i = j + 1
            continue
        out.append(c)
        i += 1
    return ''.join(out), ov


def Z(zh):
    return strip_ov(zh)[0]


KNOWN = set(VOC) | {h for lv in ('1','2','3') for h,_,_ in OFF[lv]} | set('''足球 篮球 电影院 生日 大学 中学 小学 早饭 午饭 晚饭 今年 明年 后天 前天 上课 下课 下班 回家 一点儿 有点儿 车站 火车 汽车 上车 下车 东边 西边 南边 北边 春天 夏天 秋天 冬天 星期 每天 中午 医生 好看 好听 难看 晚饭 吃饭 说话 回来 出去 进来 出来 回去 上去 下来 起来 过来 过去 小猫 小狗 苹果 饭菜 朋友们 同学们 孩子们 老师们 鸡肉 牛肉 米饭 面包 越南 河内 上海 越南人 中国人 美国 日本 英国 法国 英语 汉字 生词 课文 作业 电话 号码 手机号 门口 学校 公园 超市 银行 小时 分钟 不错 当然 可是 但是 然后 后来 最后 以后 以前 晚上 早上 上午 下午 今天 明天 昨天 现在 那时 怎么办 没事 一些 有些 有时候 那么 这么 多么 真的 特别 比如 自己 大家 别人 一起 一样 一定 已经 正在 马上 刚才 一直 终于 总是 经常 常常 一边 一会儿 好像 认为 觉得 知道 希望 打算 准备 开始 结束 喜欢 帮助 帮忙 介绍 欢迎 谢谢 再见 对不起 没关系 不客气 请问 生病 感冒 发烧 医院 吃药 睡觉 起床 洗澡 刷牙 跑步 游泳 唱歌 跳舞 爬山 旅游 上网 聊天 照片 照相机 礼物 生日快乐 新年 春节 中秋节 房间 厨房 洗手间 客厅 宾馆 饭店 饭馆 商店 机场 火车站 地铁站 公共汽车 出租车 自行车'''.split())


def split_tok(tok):
    if len(tok) <= 1 or tok in KNOWN or not all('\u4e00' <= c <= '\u9fff' for c in tok):
        return [tok]
    out = []
    i = 0
    while i < len(tok):
        for L in range(min(6, len(tok) - i), 0, -1):
            w = tok[i:i + L]
            if L == 1 or w in KNOWN:
                out.append(w)
                i += L
                break
    return out


def _py(text, ov):
    # sentence-level pypinyin per char for context
    chars = list(text)
    base = []
    for c in chars:
        base.append(None)
    pp = pinyin(text, style=Style.TONE, errors=lambda x: [[ch] for ch in x])
    # pypinyin returns one item per han char, non-han grouped; realign
    k = 0
    flat = []
    for item in pp:
        flat.append(item[0])
    # build char->pinyin by walking
    idx = 0
    res = [None] * len(chars)
    fi = 0
    while idx < len(chars):
        c = chars[idx]
        if '一' <= c <= '鿿':
            res[idx] = flat[fi]
            fi += 1
            idx += 1
        else:
            # non-han: pypinyin groups consecutive non-han into one item
            s = flat[fi]
            fi += 1
            idx += len(s)
    tokens = []  # (text, pinyin or None for punct)
    pos = 0
    for tok0 in jieba.cut(text, HMM=False):
      for tok in split_tok(tok0):
        start = pos
        pos += len(tok)
        if tok == '\n':
            tokens.append((tok, '\n'))
            continue
        if tok.strip() == '':
            tokens.append((tok, ' '))
            continue
        if not any('一' <= c <= '鿿' for c in tok):
            tokens.append((tok, None))
            continue
        if any((start + i) in ov for i in range(len(tok))):
            sy = []
            for i, c in enumerate(tok):
                sy.append(ov.get(start + i, res[start + i]))
            tokens.append((tok, ''.join(sy)))
            continue
        if tok in VOC:
            tokens.append((tok, VOC[tok]))
            continue
        tokens.append((tok, ''.join(res[start:start + len(tok)])))
    # neutral / sandhi fixes on single-char tokens
    NEUT = {'的': 'de', '了': 'le', '吗': 'ma', '呢': 'ne', '吧': 'ba', '们': 'men', '啊': 'a', '着': 'zhe'}
    out = []
    for i, (t, p) in enumerate(tokens):
        if p is None or p in (' ', '\n'):
            out.append((t, p))
            continue
        nxt = None
        for t2, p2 in tokens[i + 1:]:
            if p2 is not None and p2 not in (' ', '\n'):
                nxt = p2
                break
            if p2 is None:
                break
        prev = tokens[i - 1][0] if i > 0 else ''
        if t in FORCE and len(t) == 1 and not any((sum(len(x[0]) for x in tokens[:i])) == k for k in ov):
            p = FORCE[t]
        if t in NEUT and not any(start in ov for start in []):
            if not (t == '了' and p == 'liǎo') and not (t == '着' and p in ('zháo',)):
                p = NEUT[t]
        if t == '不' and p == 'bù' and nxt and tone_of(_first_syl(nxt)) == '4':
            p = 'bú'
        if t == '不' and nxt is None:
            p = 'bù'
        nxt_t = ''
        for t2, p2 in tokens[i + 1:]:
            if p2 is not None and p2 not in (' ', '\n'):
                nxt_t = t2
                break
            if p2 is None:
                break
        if t == '儿' and out and out[-1][1] not in (None, ' ', '\n'):
            out[-1] = (out[-1][0] + '儿', out[-1][1] + 'r')
            continue
        if t == '一' and nxt_t[:1] in ('月', '日', '号', '楼', '层', '年级'):
            nxt = None
        if t == '一' and p == 'yī' and nxt and prev not in ('第', '十', '二', '三', '四', '五', '六', '七', '八', '九', '零', '星期') \
                and not re.match(r'^(yuè|hào|diǎn)', nxt or ''):
            p = 'yí' if tone_of(_first_syl(nxt)) in ('4',) or nxt.startswith('ge') else 'yì'
        if t == '只' and prev and (prev[-1:] in '一二三四五六七八九十两几这那哪每'):
            p = 'zhī'
        if t == '不' and prev and nxt_t and prev[-1:] == nxt_t[:1]:
            p = 'bu'
        if len(t) > 1 and t[0] == '不' and prev and prev[-1:] == t[1]:
            p = re.sub(r'^b[úù]', 'bu', p)
        if t == '个' and prev and (prev in '一二三四五六七八九十两几这那哪每' or prev.isdigit()):
            p = 'ge'
        out.append((t, p))
    # join
    s = ''
    for t, p in out:
        if p is None and re.match(r'^[A-Za-z0-9]+$', t):
            s += t + ' '
            continue
        if p is None and t == '“':
            s = s.rstrip(' ') + ' "'
            continue
        if p is None and t == '”':
            s = s.rstrip(' ') + '" '
            continue
        if p is None:
            mp = ''.join(PUNCT.get(c, c) for c in t) if t not in PUNCT else PUNCT[t]
            if t == '（ ）':
                mp = '( )'
            s = s.rstrip(' ')
            if mp in ('(', '"') and not s.endswith(' ') and s:
                # opening quote/paren gets space before
                if mp == '(':
                    s += ' '
            s += mp
            if mp not in ('(',):
                s += ' '
            continue
        if p == ' ':
            s += ' '
            continue
        if p == '\n':
            s = s.rstrip(' ') + '\n'
            continue
        s += p + ' '
    s = re.sub(r' +', ' ', s).strip(' ')
    s = re.sub(r' *\n *', '\n', s)
    s = s.replace('( )', '( )').replace('" ', '"', 0)
    s = re.sub(r'\(\s*\)', '( )', s)
    s = re.sub(r' ([,.?!:;])', r'\1', s)
    s = re.sub(r'^ +|(?<=\n) +', '', s)
    s = re.sub(r':"', ': "', s)
    return s


def T(zh, vi=None, pinyin_on=True):
    z = Z(zh)
    d = {'zh': z}
    if pinyin_on:
        d['pinyin'] = P(zh)
    if vi:
        d['vi'] = vi
    return d


if __name__ == '__main__':
    for s in sys.argv[1:]:
        print(Z(s), '|', P(s))
