import sys
sys.path.insert(0, '/home/claude/pylib-b')
import logging
import jieba
jieba.setLogLevel(logging.ERROR)
from pypinyin import lazy_pinyin, Style
PUNCT = {'，': ',', '。': '.', '？': '?', '！': '!', '、': ',', '：': ':', '；': ';', '“': '"', '”': '"', '（': '(', '）': ')', '…': '…', '—': '-', '《': '"', '》': '"', '‘': "'", '’': "'", '·': ' '}
def is_han(c):
    return '一' <= c <= '鿿'
TOK = {'长得':'zhǎng de','长裙':'chángqún','长时间':'cháng shíjiān','长三':'cháng sān','颈椎':'jǐngzhuī','他长':'tā zhǎng','她长':'tā zhǎng',
       '得很':'de hěn','得真':'de zhēn','师傅':'shīfu','女儿':"nǚ'ér",'扇扇子':'shān shànzi','粮食':'liángshi','爷爷':'yéye','奶奶':'nǎinai','妈妈':'māma','爸爸':'bàba','衣服':'yīfu','时候':'shíhou'}
SUBJ = set('我 你 他 她 它 我们 你们 他们 她们 咱们 大家 就 还 也 都 可 又 总 必须 我们俩'.split())
def seg_py(text):
    toks = list(jieba.cut(text))
    out = []
    for i, tok in enumerate(toks):
        prev = toks[i-1] if i > 0 else ''
        nxt = toks[i+1] if i + 1 < len(toks) else ''
        if tok in TOK: out.append(TOK[tok]); continue
        if tok == '儿' and out and prev and all(is_han(c) for c in prev): out[-1] += 'r'; continue
        if tok == '得':
            if nxt == '了' : out.append('dé')
            elif prev in SUBJ or prev == '' or not all(is_han(c) for c in prev): out.append('děi')
            else: out.append('de')
            continue
        if tok == '地' and prev and all(is_han(c) for c in prev) and prev not in ('在', '土', '这块', '那块'):
            out.append('de'); continue
        if tok == '长':
            out.append('zhǎng' if nxt in ('大', '得') else 'cháng'); continue
        if len(tok) >= 3 and tok.endswith('地') and tok not in ('目的地', '殖民地', '根据地', '所在地', '发源地', '大草地'):
            out.append(''.join(lazy_pinyin(tok[:-1], style=Style.TONE)) + ' de'); continue
        if len(tok) >= 2 and tok.endswith('儿') and tok not in ('女儿', '婴儿', '孤儿', '幼儿', '健儿', '男儿', '孙儿', '宠儿'):
            out.append(''.join(lazy_pinyin(tok[:-1], style=Style.TONE)) + 'r'); continue
        if all(is_han(c) for c in tok):
            out.append(''.join(lazy_pinyin(tok, style=Style.TONE)))
        else:
            out.append(tok)
    return out
def to_pinyin(text, forced=None):
    """forced: list of (hanzi, pinyin) to use verbatim when they appear."""
    parts = [(text, None)]
    for h, p in (forced or []):
        if not h: continue
        new = []
        for t, fp in parts:
            if fp is not None: new.append((t, fp)); continue
            segs = t.split(h)
            for i, s in enumerate(segs):
                if s: new.append((s, None))
                if i < len(segs) - 1: new.append((h, p))
        parts = new
    toks = []
    for t, fp in parts:
        if fp is not None: toks.append(fp)
        else: toks.extend(seg_py(t))
    # join: punctuation attaches to previous token
    s = ''
    for tok in toks:
        if tok in PUNCT or (len(tok) == 1 and not tok.isalnum() and not is_han(tok)):
            p = PUNCT.get(tok, tok)
            if p in ('(', '"') and not s.endswith(' ') and s: s += ' '
            s += p
            if p in ',.?!:;': s += ' '
        elif tok.strip() == '':
            continue
        else:
            if s and not s.endswith(' ') and not s.endswith('(') : s += ' '
            s += tok
    s = s.replace(' "', ' "').strip()
    # lowercase first letter (schema: lowercase)
    return ' '.join(s.split())
if __name__ == '__main__':
    for line in sys.argv[1:]:
        print(to_pinyin(line))
