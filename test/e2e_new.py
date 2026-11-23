# Kiểm thử: shadowing (thư viện, dán link, AI tạo câu – Gemini giả lập), viết chữ theo bộ thủ.
import json
from playwright.sync_api import sync_playwright
BASE = 'http://localhost:8766/'
SHOT = 'test/screenshots/'
errs = []
FAKE = {"title": "Chào hỏi", "segments": [{"start": 1.2, "end": 4.5, "hanzi": "大家好，我是小王。", "pinyin": "dàjiā hǎo, wǒ shì Xiǎo Wáng.", "vi": "Chào mọi người, tôi là Tiểu Vương."}, {"start": 4.8, "end": 8.0, "hanzi": "今天我们学习中文。", "pinyin": "jīntiān wǒmen xuéxí zhōngwén.", "vi": "Hôm nay chúng ta học tiếng Trung."}], "error_vi": None}
def gem(route):
    body = json.loads(route.request.post_data)
    part = body['contents'][0]['parts'][0]
    assert 'youtube.com/watch?v=' in part['fileData']['fileUri'], part
    route.fulfill(status=200, content_type='application/json', body=json.dumps({"candidates": [{"content": {"parts": [{"text": json.dumps(FAKE, ensure_ascii=False)}]}}]}))
with sync_playwright() as p:
    b = p.chromium.launch()
    for name, vp in [('desktop', {'width': 1366, 'height': 900}), ('mobile', {'width': 375, 'height': 780})]:
        c = b.new_context(viewport=vp)
        c.add_init_script("localStorage.setItem('ttkk:settings', JSON.stringify({geminiKey:'FAKE-KEY', level:'3'}))")
        pg = c.new_page()
        pg.on('pageerror', lambda e: errs.append(('PAGEERROR', str(e))))
        pg.on('console', lambda m: m.type == 'error' and '404' not in m.text and errs.append((pg.url, m.text)))
        pg.route('**/generativelanguage.googleapis.com/**', gem)
        pg.goto(BASE + '#/speaking/shadowing'); pg.wait_for_timeout(1500)
        print(name, 'video cards:', pg.locator('.vcard').count())
        pg.screenshot(path=f'{SHOT}{name}-sh-library.png', full_page=False)
        pg.fill('input[type=search]', 'HSK 3 听力'); pg.click('.card >> text=Tìm'); pg.wait_for_timeout(400)
        print(name, 'search fallback:', pg.locator('text=Mở tìm kiếm trên YouTube').count())
        pg.fill('input[aria-label="Dán link YouTube"]', 'https://youtu.be/dQw4w9WgXcQ'); pg.click('text=Mở video'); pg.wait_for_timeout(1200)
        pg.screenshot(path=f'{SHOT}{name}-sh-workspace.png')
        pg.click('text=Tạo câu shadowing bằng AI'); pg.wait_for_timeout(1500)
        print(name, 'segments after AI:', pg.locator('.seg').count())
        pg.screenshot(path=f'{SHOT}{name}-sh-ai-player.png')
        cached = pg.evaluate("Object.keys(JSON.parse(localStorage.getItem('ttkk:shadowing:ai')||'{}'))"); print(name, 'cached:', cached)
        pg.click('text=Sửa mốc thời gian'); pg.wait_for_timeout(600)
        print(name, 'editor segs:', pg.locator('text=Xóa câu').count())
        # mở video từ thư viện (auto_segments)
        pg.goto(BASE + '#/speaking/shadowing'); pg.wait_for_timeout(1200)
        if pg.locator('.vcard').count():
            pg.locator('.vcard').first.click(); pg.wait_for_timeout(800)
            print(name, 'lib open ->', 'workspace' if pg.locator('text=Tạo câu shadowing bằng AI').count() else 'player')
        # bộ thủ
        pg.goto(BASE + '#/writing/chars/1?mode=radical'); pg.wait_for_timeout(3000)
        print(name, 'radical cells:', pg.locator('.rad-cell').count())
        pg.screenshot(path=f'{SHOT}{name}-radicals.png')
        pg.click('.tabs >> text=Tất cả 214 bộ'); pg.wait_for_timeout(300); print(name, 'all:', pg.locator('.rad-cell').count())
        pg.goto(BASE + '#/writing/chars/1?mode=radical&r=' + '邑'); pg.wait_for_timeout(2500)
        print(name, '邑 chars:', pg.evaluate("[...document.querySelectorAll('.char-cell')].map(e=>e.textContent[1]||e.textContent).join('')")[:40])
        pg.goto(BASE + '#/writing/chars/1?mode=radical&r=' + '水'); pg.wait_for_timeout(3500)
        print(name, '水 chars:', pg.locator('.char-cell').count(), 'hw paths:', pg.evaluate("document.querySelectorAll('.hw svg path').length"))
        pg.screenshot(path=f'{SHOT}{name}-radical-detail.png')
        pg.goto(BASE + '#/exam/hsk5-de1'); pg.wait_for_timeout(1200)
        print(name, 'level select on hsk5 exam:', pg.eval_on_selector('#levelSelect', 'e=>e.value'))
        c.close()
    b.close()
print('ERRORS', len(errs))
for e in errs[:15]: print(' ', e)
