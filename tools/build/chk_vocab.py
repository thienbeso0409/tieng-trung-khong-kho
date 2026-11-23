import json,sys
sys.path.insert(0,'.')
from lvcheck import check
for lv in (1,2,3):
    d=json.load(open(f'/home/claude/tieng-trung-khong-kho/data/vocab/hsk{lv}.json'))
    for w in d['words']:
        e=w.get('example')
        if not e: continue
        b=check(e['zh'],lv)
        if b: print(lv,w['hanzi'],'|',e['zh'],b)
