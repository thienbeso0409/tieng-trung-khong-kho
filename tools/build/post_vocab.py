import json
D='/home/claude/tieng-trung-khong-kho/data/vocab'
seen={}
for L in (1,2,3):
    f=f'{D}/hsk{L}.json'; d=json.load(open(f,encoding='utf-8'))
    local={}
    for w in d['words']:
        h=w['hanzi']; prev=seen.get(h) or local.get(h)
        if prev:
            n=f"Cùng mặt chữ với {prev['id']} ({prev['pinyin']}: {prev['meaning_vi']}) nhưng là mục từ riêng trong danh sách chính thức (khác nghĩa/cách đọc/cách dùng)."
            w['notes']=(w['notes']+'; ' if w.get('notes') else '')+n
        local.setdefault(h,w)
    for h,w in local.items(): seen.setdefault(h,w)
    json.dump(d,open(f,'w',encoding='utf-8'),ensure_ascii=False,indent=2)
