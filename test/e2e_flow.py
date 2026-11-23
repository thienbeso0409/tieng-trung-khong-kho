# Kiểm thử luồng: làm đề, nộp, xem điểm; chụp màn hình desktop + mobile.
import sys
from playwright.sync_api import sync_playwright
BASE = 'http://localhost:8765/tieng-trung-khong-kho/?data=test/data/'
SHOT = 'test/screenshots/'
errs = []
def watch(pg):
    pg.on('console', lambda m: m.type == 'error' and '404' not in m.text and errs.append((pg.url, m.text)))
    pg.on('pageerror', lambda e: errs.append((pg.url, 'PAGEERROR ' + str(e))))
with sync_playwright() as p:
    b = p.chromium.launch(args=['--use-fake-ui-for-media-stream', '--use-fake-device-for-media-stream', '--autoplay-policy=no-user-gesture-required'])
    for name, vp in [('desktop', {'width': 1366, 'height': 900}), ('mobile', {'width': 375, 'height': 760})]:
        ctx = b.new_context(viewport=vp, device_scale_factor=1)
        pg = ctx.new_page(); watch(pg)
        pg.on('dialog', lambda d: d.accept())
        pg.goto(BASE + '#/'); pg.wait_for_timeout(1500)
        pg.screenshot(path=f'{SHOT}{name}-home.png', full_page=(name == 'mobile'))
        # Đề test-de1
        pg.goto(BASE + '#/exam/test-de1'); pg.wait_for_timeout(800)
        pg.screenshot(path=f'{SHOT}{name}-exam-intro.png')
        pg.click('text=Bắt đầu làm bài'); pg.wait_for_timeout(500)
        # trả lời: chọn nút đầu tiên của mỗi câu chưa là ví dụ
        qs = pg.query_selector_all('.q:not(.example)')
        for q in qs:
            btn = q.query_selector('.choice:not([disabled]), .tile')
            if btn: btn.click()
        # ô viết chữ
        for inp in pg.query_selector_all('.blank-input'): inp.fill('给')
        tas = pg.query_selector_all('textarea.textarea')
        if tas: tas[0].fill('他们每个周末都去打篮球。')
        if len(tas) > 1: tas[1].fill('我家有三口人：爸爸、妈妈和我。爸爸是医生。')
        pg.wait_for_timeout(300)
        pg.screenshot(path=f'{SHOT}{name}-exam-doing.png', full_page=False)
        pg.click('.exam-bar >> text=Nộp bài'); pg.wait_for_timeout(400)
        pg.click('.modal button.primary'); pg.wait_for_timeout(1200)
        print(name, 'de1 result:', pg.inner_text('.result-hero')[:200].replace('\n', ' | '))
        pg.screenshot(path=f'{SHOT}{name}-exam-result.png', full_page=False)
        pg.evaluate("window.scrollTo(0, 1400)"); pg.wait_for_timeout(300)
        pg.screenshot(path=f'{SHOT}{name}-exam-review.png')
        # Đề 7-9
        pg.goto(BASE + '#/exam/test-79'); pg.wait_for_timeout(800)
        pg.click('text=Bắt đầu làm bài'); pg.wait_for_timeout(500)
        for q in pg.query_selector_all('.q:not(.example)'):
            btn = q.query_selector('.choice:not([disabled])')
            if btn: btn.click()
        for inp in pg.query_selector_all('.q input.input'): inp.fill('竹子')
        for ta in pg.query_selector_all('.q textarea'): ta.fill('从图中可以看出，电动汽车销量持续增长。')
        pg.evaluate("document.querySelector('#sec-reading')?.scrollIntoView()"); pg.wait_for_timeout(300)
        pg.screenshot(path=f'{SHOT}{name}-79-reading.png')
        pg.evaluate("document.querySelector('#sec-writing')?.scrollIntoView()"); pg.wait_for_timeout(300)
        pg.screenshot(path=f'{SHOT}{name}-79-writing.png')
        pg.click('.exam-bar >> text=Nộp bài'); pg.wait_for_timeout(400)
        pg.click('.modal button.primary'); pg.wait_for_timeout(1200)
        print(name, '79 result:', pg.inner_text('.result-hero')[:300].replace('\n', ' | '))
        pg.screenshot(path=f'{SHOT}{name}-79-result.png')
        if name == 'desktop':
            # Từ vựng thẻ
            pg.goto(BASE + '#/vocab/1'); pg.wait_for_timeout(800)
            pg.screenshot(path=f'{SHOT}{name}-vocab.png')
            pg.click('.tabs >> text=Thẻ ghi nhớ'); pg.wait_for_timeout(400); pg.click('.flashcard'); pg.wait_for_timeout(800)
            pg.screenshot(path=f'{SHOT}{name}-flash.png')
            pg.click('.tabs >> text=Ôn tập (SRS)'); pg.wait_for_timeout(300); pg.click('text=Hiện đáp án'); pg.wait_for_timeout(700)
            pg.click('.srs-btns >> text=Nhớ'); pg.wait_for_timeout(300)
            # Chữ Hán
            pg.goto(BASE + '#/writing/chars/1'); pg.wait_for_timeout(4000)
            pg.screenshot(path=f'{SHOT}{name}-chars.png')
            print('hanzi svg paths:', pg.evaluate("document.querySelectorAll('.hw svg path').length"), 'steps:', pg.evaluate("document.querySelectorAll('.stroke-steps svg').length"))
            pg.goto(BASE + '#/speaking/shadowing'); pg.wait_for_timeout(800)
            pg.click('text=Luyện >> nth=0'); pg.wait_for_timeout(500)
            pg.screenshot(path=f'{SHOT}{name}-shadowing.png')
            pg.goto(BASE + '#/speaking/chat'); pg.wait_for_timeout(800)
            pg.click('.topic-card >> nth=0'); pg.wait_for_timeout(500)
            pg.screenshot(path=f'{SHOT}{name}-chat.png')
            pg.goto(BASE + '#/speaking/hskk'); pg.wait_for_timeout(800)
            pg.screenshot(path=f'{SHOT}{name}-hskk.png')
            pg.goto(BASE + '#/settings'); pg.wait_for_timeout(1200)
            pg.screenshot(path=f'{SHOT}{name}-settings.png')
            pg.goto(BASE + '#/progress'); pg.wait_for_timeout(800)
            pg.screenshot(path=f'{SHOT}{name}-progress.png')
            # dark mode
            pg.goto(BASE + '#/'); pg.wait_for_timeout(500); pg.click('#themeToggle'); pg.wait_for_timeout(400)
            pg.screenshot(path=f'{SHOT}{name}-home-dark.png')
            pg.click('#themeToggle')
        ctx.close()
    b.close()
print('ERRORS', len(errs))
for e in errs: print(' ', e)
