# Kiểm thử khói: mở mọi route, ghi lỗi console. Chạy: python3 test/e2e_routes.py [base_url] [data]
import sys, json
from playwright.sync_api import sync_playwright
BASE = sys.argv[1] if len(sys.argv) > 1 else 'http://localhost:8765/tieng-trung-khong-kho/'
DATA = sys.argv[2] if len(sys.argv) > 2 else 'test/data/'
Q = f'?data={DATA}' if DATA else ''
ROUTES = ['', 'vocab', 'vocab/1', 'vocab/1?tab=cards', 'vocab/1?tab=srs', 'vocab/4', 'exam', 'exam/test-de1', 'exam/test-79', 'exam/hsk4-de1', 'exam/hsk1-de1', 'exam/hsk2-de1', 'listening/2', 'reading/2', 'writing/chars/3', 'vocab/3',
  'listening/1', 'listening/7-9', 'reading/1', 'reading/7-9', 'writing', 'writing/chars/1', 'writing/chars/4', 'writing/practice/1', 'writing/practice/7-9',
  'speaking', 'speaking/chat', 'speaking/shadowing', 'speaking/hskk', 'speaking/hskk?paper=hsk3-de1-speaking', 'progress', 'settings', 'khong-co']
errs = []
with sync_playwright() as p:
    b = p.chromium.launch()
    pg = b.new_page(viewport={'width': 1280, 'height': 900})
    pg.on('console', lambda m: m.type in ('error',) and errs.append((pg.url, m.text)))
    pg.on('pageerror', lambda e: errs.append((pg.url, 'PAGEERROR ' + str(e))))
    for r in ROUTES:
        pg.goto(BASE + Q + '#/' + r)
        pg.wait_for_timeout(900)
        txt = pg.inner_text('#main')[:140].replace('\n', ' | ')
        print(f'#/{r:40s} {txt}')
    b.close()
print('\nERRORS:', len(errs))
for e in errs: print(' ', e)
