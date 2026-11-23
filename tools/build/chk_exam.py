import json,sys
sys.path.insert(0,'.')
from lvcheck import check
f=sys.argv[1]; lim=int(sys.argv[2])
d=json.load(open(f))
def texts(o):
    if isinstance(o,dict):
        if 'zh' in o and isinstance(o['zh'],str): yield o['zh']
        if 'text' in o and isinstance(o['text'],str): yield o['text']
        for k,v in o.items():
            if k in ('sample_answers',): continue
            yield from texts(v)
    elif isinstance(o,list):
        for v in o: yield from texts(v)
seen=set(); tot=0; badn=0
for t in texts(d):
    if t in seen: continue
    seen.add(t); tot+=1
    b=check(t,lim)
    if b: badn+=1; print(b,'|',t)
print('texts',tot,'with out-of-level',badn)
