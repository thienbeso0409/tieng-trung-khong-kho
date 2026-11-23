import re, unicodedata
def sort_key(p, h):
    base = unicodedata.normalize('NFD', p.lower())
    letters = ''.join(c for c in base if c.isalpha() and ord(c) < 128)
    tones = ''
    for syl in re.findall(r'[^\s\']+', base):
        t = '5'
        for mark, n in (('̄', '1'), ('́', '2'), ('̌', '3'), ('̀', '4')):
            if mark in syl:
                t = n
        tones += t
    return (letters, tones, h)

