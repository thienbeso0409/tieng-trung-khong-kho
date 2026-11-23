# ĐẶC TẢ DỮ LIỆU (DATA_SCHEMA) — "Tiếng Trung không khó"

Hợp đồng giữa đội Chuyên môn A/B/C (ghi `data/`, phân vùng theo PLAN §5) và Agent Web (đọc `data/`). Chuẩn **HSK 3.0, 9 cấp** — cấu trúc đề ở **Phụ lục A** (thắng mọi chỗ mâu thuẫn bên trên). Mọi thứ ở đây là **bắt buộc** trừ khi ghi "(tùy chọn)". Không thêm field bắt buộc mới; field lạ được phép nhưng web bỏ qua. Field `notes` (chuỗi) được phép ở mọi object.

## 1. Quy ước chung

- File JSON UTF-8, không BOM, không comment, không dấu phẩy thừa. Thụt lề 2 khoảng trắng.
- Đường dẫn trong JSON là **tương đối so với thư mục `data/`** (vd `"vocab/hsk1.json"`).
- **Chuẩn: HSK 3.0** (đề chính thức từ 13/12/2026). Mọi nội dung HSK 2.0 đã bỏ.
- `level` (HSK): số nguyên `1`–`6`, hoặc chuỗi `"7-9"` cho bậc cao gộp (đề, vocab, chữ Hán, nói đều dùng `"7-9"`; không có file riêng hsk7/hsk8/hsk9). Trong tên file viết `hsk7-9`. Web so sánh bằng `String(level)`. Cấp HSKK độc lập (tùy chọn): `"so"` | `"trung"` | `"cao"`.
- Pinyin: dùng **dấu thanh** (`nǐ hǎo`), cách nhau theo từ, viết thường (trừ tên riêng/đầu câu tùy chọn). Không dùng số thanh.
- Chữ Hán: giản thể. Dấu câu tiếng Trung toàn khổ (`，。？！：“”`).
- Chỗ trống trong câu: chuỗi `"（ ）"` (ngoặc toàn khổ + 1 khoảng trắng) — web thay bằng ô trống/ô nhập. Mỗi câu tối đa 1 chỗ trống.
- "Ảnh" không có file thật → object **Image**: `{ "emoji": "🍎", "alt_vi": "Một quả táo đỏ" }`. `emoji` 1–3 emoji; `alt_vi` mô tả đủ để phân biệt đáp án (web hiển thị emoji lớn + mô tả nhỏ).
- **Text** (đoạn văn hiển thị có thể kèm pinyin/dịch): `{ "zh": "...", "pinyin": "..."(tùy chọn), "vi": "..."(tùy chọn) }`. HSK1–2: `pinyin` bắt buộc trên mọi Text hiển thị cho thí sinh. `vi` chỉ hiển thị khi xem lại sau nộp.
- **Audio** (âm thanh TTS từ transcript):
  ```json
  { "lines": [ { "speaker": "男", "text": "你好！", "pinyin": "nǐ hǎo!" } ], "repeat": 2 }
  ```
  `speaker`: `"男"` | `"女"` | `"旁白"`. `text`: Hán tự sẽ đọc. `pinyin` tùy chọn (hiện ở transcript). `repeat`: số lần phát (luôn 2 trong đề thi). Câu hỏi được đọc ở cuối (dạng `问：……？`) là một dòng `speaker: "旁白"`.
- **Option**: `{ "key": "A", "text": Text (tùy chọn), "image": Image (tùy chọn) }` — có ít nhất `text` hoặc `image`. `key` là chữ in hoa A, B, C, D, E, F liên tục.
- ID: chữ thường, số, gạch ngang. Duy nhất trong file. Câu hỏi đề thi: `{examId}-{no:02}` (vd `hsk1-de1-07`).

## 2. `data/index.json` — manifest

```json
{
  "schema_version": 1,
  "updated": "2026-11-22",
  "levels": [
    {
      "level": 1,
      "name_vi": "HSK 1",
      "vocab": "vocab/hsk1.json",
      "exams": [ { "id": "hsk1-de1", "file": "exams/hsk1-de1.json", "title_vi": "Đề thi thử HSK 1 – Đề 1" } ]
    },
    { "level": 2, "name_vi": "HSK 2", "vocab": "vocab/hsk2.json",
      "exams": [ { "id": "hsk2-de1", "file": "exams/hsk2-de1.json", "title_vi": "Đề thi thử HSK 2 – Đề 1" } ] },
    { "level": 3, "name_vi": "HSK 3", "vocab": "vocab/hsk3.json",
      "characters": "writing/characters-hsk3.json", "practice": "writing/practice-hsk3.json",
      "exams": [ { "id": "hsk3-de1", "file": "exams/hsk3-de1.json", "title_vi": "Đề thi thử HSK 3 – Đề 1" } ] },
    "… level 4, 5, 6 tương tự …",
    { "level": "7-9", "name_vi": "HSK 7–9", "vocab": "vocab/hsk7-9.json",
      "characters": "writing/characters-hsk7-9.json", "practice": null,
      "exams": [ { "id": "hsk7-9-de1", "file": "exams/hsk7-9-de1.json", "title_vi": "Đề thi thử HSK 7–9 – Đề 1" } ] }
  ],
  "speaking": {
    "topics": "speaking/topics.json",
    "hskk": "speaking/hskk.json",
    "shadowing": "speaking/shadowing.json"
  }
}
```
(Chuỗi `"… level 4, 5, 6 tương tự …"` chỉ là chú thích trong tài liệu, file thật phải đủ 7 object: 1, 2, 3, 4, 5, 6, "7-9".)
- Mỗi level có: `level`, `name_vi`, `vocab`, `characters`, `practice` (null nếu không có), `exams`.
- **Agent A viết toàn bộ manifest ngay từ đầu** với đủ 7 level và tên file cố định như trên (tên file theo quy tắc: `vocab/hsk{L}.json`, `writing/characters-hsk{L}.json`, `writing/practice-hsk{L}.json`, `exams/hsk{L}-de1.json`, với `{L}` = `1`…`6` hoặc `7-9`). Agent B, C không sửa manifest. File chưa có → web hiển thị "Đang soạn" (fetch 404 không được làm crash).
- Web lấy danh sách cấp/đề **chỉ** từ manifest (không hard-code).

## 3. `data/vocab/hsk{L}.json` — từ vựng (`{L}` = 1…6 hoặc `7-9`)

Mỗi file chỉ chứa từ **mới** của cấp đó (HSK2 không lặp từ HSK1).

```json
{
  "level": 1,
  "standard": "HSK3.0-2025",
  "target_count": 500,
  "count": 500,
  "complete": true,
  "words": [
    {
      "id": "hsk1-0001",
      "hanzi": "爱",
      "pinyin": "ài",
      "pos": "động từ",
      "meaning_vi": "yêu, thích",
      "han_viet": "ái",
      "example": { "zh": "我爱我的妈妈。", "pinyin": "wǒ ài wǒ de māma.", "vi": "Tôi yêu mẹ tôi." },
      "topic": "cảm xúc"
    }
  ]
}
```
- Bắt buộc: `id` (`hsk{L}-{stt:04}`), `hanzi`, `pinyin`, `pos`, `meaning_vi`. Tùy chọn: `han_viet`, `example` (Text có đủ zh/pinyin/vi), `topic`, `traditional`.
- `pos` dùng một trong: `danh từ`, `động từ`, `tính từ`, `phó từ`, `đại từ`, `số từ`, `lượng từ`, `giới từ`, `liên từ`, `trợ từ`, `trợ động từ`, `thán từ`, `cụm từ`, `danh từ riêng`. Nhiều loại: nối bằng `, `.
- `count` = độ dài `words`; `target_count` = số từ mới theo đề cương (Phụ lục A.1); `complete` = (`count` ≥ `target_count`). Sắp theo pinyin (a→z). `id` luôn dạng `hsk{L}-{stt:04}` (4 chữ số, vd `hsk1-0001`, `hsk7-9-0001`) — ví dụ `hsk1-001` ở trên thay bằng `hsk1-0001`. File `hsk7-9.json` có `level: "7-9"`.

## 4. Cấu trúc đề — ĐÃ THAY

> **Bảng HSK 2.0 cũ đã bị thay** bằng cấu trúc HSK 3.0 ở **Phụ lục A** (cuối file). Mọi đề phải theo Phụ lục A (mã part, số câu, `type`, thời gian, thang điểm, pinyin).

Điểm phần = round(max_score × số câu đúng / số câu tính điểm của phần) cho câu khách quan; câu chủ quan (viết đoạn, dịch, nói) có `max_points` riêng và được chấm theo rubric (AI). Câu `is_example: true` không tính và **không** thuộc số câu ở Phụ lục A (đánh `no: 0`, hiển thị "Ví dụ" đã có đáp án).

## 5. `data/exams/hsk{L}-de{k}.json` — đề thi (`hsk1-de1` … `hsk6-de1`, `hsk7-9-de1`)

### 5.1 Khung

```json
{
  "id": "hsk1-de1",
  "level": 1,
  "title_vi": "Đề thi thử HSK 1 – Đề 1",
  "standard": "HSK3.0",
  "duration_minutes": 40,
  "total_score": 200,
  "pass_score": 120,
  "show_pinyin": true,
  "sections": [
    {
      "id": "listening",
      "name_vi": "Nghe",
      "name_zh": "听力",
      "max_score": 100,
      "duration_minutes": 15,
      "parts": [
        {
          "code": "L1",
          "type": "true_false_image",
          "expected_count": 5,
          "instruction_vi": "Nghe và phán đoán hình ảnh đúng (✓) hay sai (✗).",
          "instruction_zh": "第一部分：判断对错。",
          "groups": [
            {
              "id": "hsk1-de1-L1-g1",
              "shared_options": null,
              "passage": null,
              "questions": [ /* Question theo type, xem 5.3 */ ]
            }
          ]
        }
      ]
    },
    { "id": "reading", "name_vi": "Đọc", "name_zh": "阅读", "max_score": 100, "duration_minutes": 17, "parts": [] },
    { "id": "writing", "name_vi": "Viết", "name_zh": "书写", "max_score": 100, "duration_minutes": 15, "parts": [] }
  ]
}
```
- `sections[].id` ∈ `listening` | `reading` | `writing` | `translation` | `speaking`. Thứ tự theo Phụ lục A. HSK1 không có `writing`. `translation` chỉ có ở 7-9. `speaking` **không** nằm trong file đề HSK3–6 (đề nói là bài thi riêng, nằm ở `speaking/hskk.json`, xem A.4); exam có field `speaking_paper` = id paper trong hskk.json hoặc `null`. Đề 7-9: phần nói cũng tham chiếu `speaking_paper`; phần dịch nói (视译) nằm trong section `translation` của file đề.
- `level` của đề: 1–6 (số) hoặc `"7-9"`.
- `group.audio` (tùy chọn): Audio dùng chung cho cả group (một đoạn nghe có nhiều câu hỏi — HSK4+). Khi có `group.audio`, câu hỏi trong group có thể không có `audio` riêng hoặc chỉ có audio câu hỏi (`旁白`).
- Mọi part đều có `groups` (≥1). `expected_count` = tổng câu không phải ví dụ trong mọi group.
- `group.shared_options`: mảng Option dùng chung (cho `match_image`, `match_sentence`, `fill_blank_wordbank`), ngược lại `null`.
- `group.passage`: Text dùng chung cho cả group (dùng cho đoạn văn dài HSK4+), ngược lại `null`.
- Tùy chọn `section.duration_minutes`; phần nghe không có đồng hồ riêng (phát tuần tự).

### 5.2 Field chung của Question

| Field | Kiểu | Bắt buộc | Mô tả |
|---|---|---|---|
| `id` | string | ✓ | `hsk1-de1-07`; ví dụ: `hsk1-de1-L1-ex` |
| `no` | int | ✓ | số thứ tự trong đề 1..N liên tục toàn đề; ví dụ = 0 |
| `type` | string | ✓ | trùng `part.type` |
| `is_example` | bool | – | mặc định false |
| `audio` | Audio | ✓ với mọi câu trong section listening | |
| `answer` | xem từng type | ✓ | |
| `explanation_vi` | string | ✓ | giải thích tiếng Việt: vì sao đúng, từ khóa, bẫy |
| `pinyin` | string | – | pinyin của phần chữ chính (nếu không nằm trong Text) |
| `tags` | string[] | – | vd `["thời gian","số đếm"]` |

### 5.3 Các `type` câu hỏi

> Ghi chú trong ngoặc sau tên type (vd "HSK1 L1") là theo bản HSK 2.0 cũ, **chỉ để tham khảo**; type nào dùng ở part nào thì theo **Phụ lục A.2**. Field của từng type vẫn đúng như dưới đây, cộng thay đổi ở A.3.

**`true_false_image`** — (HSK1 L1, R1; HSK2 L1)
```json
{ "id": "hsk1-de1-01", "no": 1, "type": "true_false_image",
  "image": { "emoji": "🚕", "alt_vi": "Một chiếc taxi" },
  "audio": { "lines": [ { "speaker": "旁白", "text": "出租车", "pinyin": "chūzūchē" } ], "repeat": 2 },
  "stem": null,
  "answer": true,
  "explanation_vi": "出租车 = taxi, khớp với hình." }
```
Nghe: có `audio`, `stem: null`. Đọc: không có `audio`, `stem` là Text (từ/câu hiển thị cạnh ảnh). `answer`: boolean.

**`choose_image`** — (HSK1 L2) nghe 1 câu, chọn ảnh.
```json
{ "id": "hsk1-de1-06", "no": 6, "type": "choose_image",
  "audio": { "lines": [ { "speaker": "女", "text": "我喜欢喝茶。" } ], "repeat": 2 },
  "options": [ { "key": "A", "image": { "emoji": "🍵", "alt_vi": "Tách trà" } },
               { "key": "B", "image": { "emoji": "☕", "alt_vi": "Cốc cà phê" } },
               { "key": "C", "image": { "emoji": "🥛", "alt_vi": "Cốc sữa" } } ],
  "answer": "A", "explanation_vi": "喝茶 = uống trà." }
```

**`match_image`** — (HSK1 L3, R2; HSK2 L2, R1; HSK3 L1) ảnh dùng chung ở `group.shared_options` (5–6 Option có `image`). Mỗi câu chọn 1 key; mỗi key dùng tối đa 1 lần trong group (kể cả ví dụ).
```json
{ "id": "hsk1-de1-11", "no": 11, "type": "match_image",
  "audio": { "lines": [ { "speaker": "男", "text": "你在做什么？" }, { "speaker": "女", "text": "我在看书。" } ], "repeat": 2 },
  "stem": null,
  "answer": "C", "explanation_vi": "看书 = đọc sách → ảnh C." }
```
Đọc: không `audio`, `stem` là Text (câu cần ghép với ảnh).

**`choose_option`** — (HSK1 L4; HSK2 L3, L4; HSK3 L3, L4, R3) chọn 1 trong 3 phương án chữ.
```json
{ "id": "hsk1-de1-16", "no": 16, "type": "choose_option",
  "audio": { "lines": [ { "speaker": "男", "text": "下午我去商店买东西。" },
                        { "speaker": "旁白", "text": "问：他下午去哪儿？" } ], "repeat": 2 },
  "passage": null,
  "question": { "zh": "他下午去哪儿？", "pinyin": "tā xiàwǔ qù nǎr?" },
  "options": [ { "key": "A", "text": { "zh": "商店", "pinyin": "shāngdiàn" } },
               { "key": "B", "text": { "zh": "医院", "pinyin": "yīyuàn" } },
               { "key": "C", "text": { "zh": "学校", "pinyin": "xuéxiào" } } ],
  "answer": "A", "explanation_vi": "去商店买东西 → đi cửa hàng." }
```
- Nghe: `audio` bắt buộc; `question` chỉ hiện ở xem lại (thí sinh nghe câu hỏi); `passage: null`.
- Đọc (HSK3 R3): không `audio`; `passage` là Text (đoạn văn), `question` là Text hiển thị, thường có dạng `★ ……` hoặc câu hỏi.
- Mặc định 3 phương án A/B/C; HSK4+ có thể 4 (A–D).

**`true_false_statement`** — (HSK2 R3; HSK3 L2) đoạn văn/đoạn nghe + câu ★, đúng/sai.
```json
{ "id": "hsk3-de1-11", "no": 11, "type": "true_false_statement",
  "audio": { "lines": [ { "speaker": "女", "text": "我每天早上七点起床，八点去公司上班。" } ], "repeat": 2 },
  "passage": null,
  "statement": { "zh": "★ 她八点起床。" },
  "answer": false, "explanation_vi": "Cô ấy dậy lúc 7 giờ, 8 giờ đi làm." }
```
Đọc: không `audio`, `passage` là Text. `statement` luôn hiển thị (bắt đầu bằng `★ `).

**`match_sentence`** — (HSK1 R3; HSK2 R4; HSK3 R1) câu dùng chung trong `group.shared_options` (5–6 Option có `text`); mỗi câu chọn 1 key, mỗi key tối đa 1 lần trong group.
```json
{ "id": "hsk1-de1-31", "no": 31, "type": "match_sentence",
  "stem": { "zh": "你叫什么名字？", "pinyin": "nǐ jiào shénme míngzi?" },
  "answer": "D", "explanation_vi": "Hỏi tên → trả lời 我叫王明 (D)." }
```

**`fill_blank_wordbank`** — (HSK1 R4; HSK2 R2; HSK3 R2) từ dùng chung trong `group.shared_options` (6 Option có `text`, gồm cả từ của câu ví dụ); câu có `（ ）`. Có thể là câu đơn hoặc hội thoại 2 dòng (dùng `\n` trong `zh`, dòng đầu ghi `A：`, `B：`).
```json
{ "id": "hsk1-de1-36", "no": 36, "type": "fill_blank_wordbank",
  "stem": { "zh": "这是我（ ）的苹果。", "pinyin": "zhè shì wǒ ( ) de píngguǒ." },
  "answer": "B", "explanation_vi": "买 = mua: 'táo tôi mua'." }
```

**`reorder_words`** — (HSK3 W1; HSK4 W1)
```json
{ "id": "hsk3-de1-71", "no": 71, "type": "reorder_words",
  "words": ["我", "去", "明天", "北京"],
  "answer": "我明天去北京。",
  "accepted_answers": ["明天我去北京。"],
  "pinyin": "wǒ míngtiān qù běijīng.",
  "explanation_vi": "Trạng ngữ thời gian đứng trước động từ." }
```
`words`: mảng mảnh từ đã xáo (không chứa dấu câu cuối). `answer`: câu chuẩn có dấu câu cuối. Chấm: bỏ khoảng trắng + dấu câu rồi so với `answer` hoặc `accepted_answers` (tùy chọn).

**`write_hanzi_from_pinyin`** — (HSK3 W2)
```json
{ "id": "hsk3-de1-76", "no": 76, "type": "write_hanzi_from_pinyin",
  "stem": { "zh": "我（ ）你介绍一下，这是我朋友。" },
  "blank_pinyin": "gěi",
  "answer": "给",
  "explanation_vi": "给…介绍 = giới thiệu cho ai." }
```
`answer`: đúng 1 chữ Hán (HSK3). Chấm: so khớp tuyệt đối sau trim.

**`write_sentence`** — (HSK3 W2, HSK4 W1; luyện tập) viết câu dùng từ cho trước (+ ảnh tùy chọn).
```json
{ "id": "wp3-ws-01", "type": "write_sentence",
  "prompt_vi": "Đặt một câu có dùng từ cho sẵn, phù hợp với hình.",
  "keyword": { "zh": "打篮球", "pinyin": "dǎ lánqiú" },
  "image": { "emoji": "🏀", "alt_vi": "Hai người đang chơi bóng rổ" },
  "min_chars": 6,
  "sample_answers": ["他们每个周末都去打篮球。"],
  "answer": null,
  "explanation_vi": "Gợi ý cấu trúc: 主语 + 时间 + 打篮球." }
```
Chấm: có Gemini key → AI chấm (§9.2); không key → đạt nếu chứa `keyword.zh`, độ dài ≥ `min_chars`, và hiện `sample_answers` để tự so. `image` tùy chọn.

Các type mới của HSK 3.0 (`choose_reply`, `choose_component`, `cloze_option`, `cloze_sentence`, `order_position`, `short_answer`, `write_essay`, `picture_story_writing`, `chart_description`, `translate_written`, `translate_oral`) và các thay đổi field của type cũ: xem **Phụ lục A.3**. `true_false_image` và `reorder_words` không còn trong đề HSK 3.0 nhưng vẫn giữ để dùng trong bài luyện tập.

### 5.4 Ví dụ part có group dùng chung (HSK1 R4)

```json
{
  "code": "R4", "type": "fill_blank_wordbank", "expected_count": 5,
  "instruction_vi": "Chọn từ thích hợp điền vào chỗ trống.",
  "instruction_zh": "第四部分：选词填空。",
  "groups": [ {
    "id": "hsk1-de1-R4-g1",
    "passage": null,
    "shared_options": [
      { "key": "A", "text": { "zh": "米饭", "pinyin": "mǐfàn" } },
      { "key": "B", "text": { "zh": "买", "pinyin": "mǎi" } },
      { "key": "C", "text": { "zh": "名字", "pinyin": "míngzi" } },
      { "key": "D", "text": { "zh": "坐", "pinyin": "zuò" } },
      { "key": "E", "text": { "zh": "怎么", "pinyin": "zěnme" } },
      { "key": "F", "text": { "zh": "医生", "pinyin": "yīshēng" } }
    ],
    "questions": [
      { "id": "hsk1-de1-R4-ex", "no": 0, "is_example": true, "type": "fill_blank_wordbank",
        "stem": { "zh": "你叫什么（ ）？", "pinyin": "nǐ jiào shénme ( )?" },
        "answer": "C", "explanation_vi": "名字 = tên." }
    ]
  } ]
}
```

## 6. `data/speaking/topics.json` — chủ đề hội thoại AI

```json
{
  "topics": [
    {
      "id": "t1-chao-hoi",
      "level": 1,
      "title_vi": "Chào hỏi, giới thiệu bản thân",
      "title_zh": "打招呼",
      "scenario_vi": "Bạn gặp một bạn học mới người Trung Quốc ở trường.",
      "ai_role_zh": "你是一个中国大学生，叫李明，第一次见到越南同学。",
      "ai_role_vi": "Lý Minh, sinh viên Trung Quốc",
      "goals_vi": ["Chào hỏi", "Nói tên, quốc tịch", "Hỏi tuổi"],
      "starter": { "zh": "你好！你叫什么名字？", "pinyin": "nǐ hǎo! nǐ jiào shénme míngzi?", "vi": "Xin chào! Bạn tên là gì?" },
      "key_vocab": [ { "hanzi": "名字", "pinyin": "míngzi", "vi": "tên" } ],
      "max_turns": 10
    }
  ]
}
```
Bắt buộc mọi field trên trừ `ai_role_vi`, `max_turns` (mặc định 10). `level` 1–6. `key_vocab` 4–10 mục, chỉ dùng từ ≤ cấp. ≥ 6 chủ đề mỗi cấp 1, 2, 3.

## 7. `data/speaking/hskk.json` — luyện thi HSKK

Cấu trúc thật HSKK (dùng cho `parts`):

| Cấp | Part | `code` | `type` | Số câu thật | Chuẩn bị | Trả lời |
|---|---|---|---|---|---|---|
| so (sơ cấp, ~HSK1–2) | 1 | `so-1` | `repeat` | 15 | 0 s | ~10 s/câu |
| | 2 | `so-2` | `listen_answer` | 10 | 0 s | ~10 s/câu |
| | 3 | `so-3` | `answer_question` | 2 | 7 phút chung (tổng đề) | 90 s/câu |
| trung (~HSK3–4) | 1 | `trung-1` | `repeat` | 10 | 0 s | ~15 s/câu |
| | 2 | `trung-2` | `describe_picture` | 2 | 10 phút chung | 120 s/câu |
| | 3 | `trung-3` | `answer_question` | 2 | (chung) | 120 s/câu |
| cao (~HSK5–6) | 1 | `cao-1` | `retell` | 3 | 0 s | 120 s |
| | 2 | `cao-2` | `read_aloud` | 1 | 10 phút chung | 120 s |
| | 3 | `cao-3` | `answer_question` | 2 | (chung) | 150 s/câu |

```json
{
  "levels": [
    { "level": "so", "name_vi": "HSKK Sơ cấp", "hsk_equiv": [1, 2],
      "parts": [ { "code": "so-1", "type": "repeat", "name_vi": "Nghe và nhắc lại", "name_zh": "听后重复",
                   "instruction_vi": "Nghe câu và nhắc lại chính xác.", "real_count": 15,
                   "prep_seconds": 0, "answer_seconds": 10, "rubric_id": "rb-repeat" } ] }
  ],
  "rubrics": [
    { "id": "rb-repeat", "max_score": 10,
      "criteria": [
        { "key": "accuracy", "name_vi": "Độ chính xác nội dung", "weight": 0.6, "description_vi": "Nhắc lại đúng, đủ các từ của câu gốc." },
        { "key": "pronunciation", "name_vi": "Phát âm & thanh điệu", "weight": 0.4, "description_vi": "Thanh điệu, âm đầu/vần chuẩn." }
      ] }
  ],
  "items": [
    {
      "id": "so-1-01", "level": "so", "part": "so-1", "type": "repeat",
      "prompt": { "zh": "我今天很忙。", "pinyin": "wǒ jīntiān hěn máng.", "vi": "Hôm nay tôi rất bận." },
      "audio": { "lines": [ { "speaker": "女", "text": "我今天很忙。" } ], "repeat": 1 },
      "image": null,
      "prep_seconds": 0, "answer_seconds": 10,
      "sample_answer": { "zh": "我今天很忙。", "pinyin": "wǒ jīntiān hěn máng.", "vi": "Hôm nay tôi rất bận." },
      "keywords": ["今天", "忙"],
      "rubric_id": "rb-repeat"
    }
  ]
}
```
- `type` ∈ `repeat` | `listen_answer` | `answer_question` | `describe_picture` | `retell` | `read_aloud`.
- `prompt`: Text. Với `repeat`/`listen_answer`/`retell`: `audio` bắt buộc và `prompt` chỉ hiện sau khi trả lời. Với `answer_question`/`read_aloud`: `prompt` hiển thị ngay (`audio` có thể `null`). `describe_picture`: `image` (Image) bắt buộc, `prompt.zh` là yêu cầu (vd `请描述这张图片。`).
- `prep_seconds`, `answer_seconds` trên item ghi đè giá trị của part.
- `sample_answer`: Text; `keywords`: 2–8 từ dùng cho chấm dự phòng.
- Rubric gợi ý: `rb-repeat` (accuracy, pronunciation); `rb-answer-short` cho `listen_answer` (relevance, grammar, pronunciation); `rb-speech` cho `answer_question`/`describe_picture`/`retell` (content, fluency, vocab_grammar, pronunciation). Tổng `weight` = 1. `max_score` số nguyên.
- Số lượng tối thiểu và bộ đề nói HSK 3.0: xem Phụ lục A.4.

## 8. `data/speaking/shadowing.json`

```json
{
  "items": [
    {
      "id": "sh-tts-01",
      "level": 1,
      "title": "Giới thiệu bản thân",
      "source": "tts",
      "youtube": null,
      "segments": [
        { "start": null, "end": null, "hanzi": "你好，我叫小月。", "pinyin": "nǐ hǎo, wǒ jiào Xiǎoyuè.", "vi": "Xin chào, tôi tên Tiểu Nguyệt.", "speaker": "女" }
      ]
    },
    {
      "id": "sh-yt-01",
      "level": 2,
      "title": "…",
      "source": "youtube",
      "youtube": { "videoId": "XXXXXXXXXXX", "verified": true, "channel": "tên kênh", "url": "https://www.youtube.com/watch?v=XXXXXXXXXXX" },
      "segments": [ { "start": 12.5, "end": 15.8, "hanzi": "…", "pinyin": "…", "vi": "…" } ]
    }
  ]
}
```
- `source` ∈ `tts` | `youtube`. `tts`: `youtube: null`, `start`/`end` = `null`, `speaker` tùy chọn (`男`/`女`, mặc định `女`). `youtube`: `start`/`end` là giây (số thực, `end > start`), `videoId` 11 ký tự.
- Web chỉ hiển thị item youtube có `verified: true` mặc định (item `false` ẩn sau tùy chọn "hiện chưa xác minh").
- Bài người dùng tự thêm: web lưu ở localStorage `ttkk:shadowing:user` cùng cấu trúc item (id tiền tố `user-`).
- ≥ 15 segment nguồn `tts` tổng cộng (khuyến nghị phủ level 1–3).

## 9. Writing

### 9.1 `data/writing/characters-hsk{L}.json` (mỗi cấp một file; `{L}` = 1…6 hoặc `7-9`)
```json
{
  "characters": [
    { "hanzi": "好", "pinyin": "hǎo", "meaning_vi": "tốt, hay", "han_viet": "hảo",
      "strokes": 6, "radical": "女", "radical_meaning_vi": "nữ (phụ nữ)", "level": 1,
      "words": ["你好", "好吃"] }
  ]
}
```
Bắt buộc: `hanzi` (đúng 1 ký tự, không trùng trong file và không trùng với file cấp thấp hơn), `pinyin`, `meaning_vi`, `strokes` (int), `radical`, `level` (cấp đầu tiên chữ xuất hiện). Tùy chọn: `han_viet`, `radical_meaning_vi`, `words` (từ trong vocab chứa chữ này). Sắp theo `level` rồi pinyin.

### 9.2 `data/writing/practice-hsk{L}.json` — luyện viết ngoài đề (mỗi cấp một file)
```json
{
  "sets": [
    { "id": "wp3-reorder", "level": 3, "type": "reorder_words", "title_vi": "Sắp xếp từ thành câu – HSK 3",
      "questions": [ { "id": "wp3-ro-01", "type": "reorder_words", "words": ["…"], "answer": "…。", "explanation_vi": "…" } ] }
  ]
}
```
- Mỗi set một `type` (`reorder_words` | `write_hanzi_from_pinyin` | `choose_component` | `write_sentence` | `write_essay` | `picture_story_writing` | `chart_description` | `translate_written`); câu hỏi dùng đúng schema §5.3, không cần `no`, không cần `audio`.
- Prompt AI chấm `write_sentence` (web tự xây): chấm thang 0–10 về ngữ pháp, dùng đúng từ khóa, phù hợp ảnh, độ tự nhiên; trả JSON `{score, corrected_zh, pinyin, feedback_vi}`.

### 9.3 Định dạng trả lời AI (tham chiếu cho Agent Web, không phải file data)
- Hội thoại: Gemini trả JSON `{ "zh": "...", "pinyin": "...", "vi": "...", "correction_vi": "..."|null }` (dùng `generationConfig.responseMimeType: "application/json"`).
- Chấm HSKK: `{ "scores": { "<criteria.key>": number(0..10) }, "total": number(0..max_score), "transcript_note_vi": "...", "feedback_vi": "...", "suggested_answer_zh": "..." }`; web tính `total` = Σ weight × score × max_score/10 nếu AI trả thiếu.
- Chấm dự phòng (không key): độ khớp ký tự = LCS(chuỗi nhận dạng, chuỗi mẫu)/độ dài mẫu (bỏ dấu câu, khoảng trắng); với câu mở: tỷ lệ `keywords` xuất hiện.

---

# PHỤ LỤC A — CHUẨN HSK 3.0 (bắt buộc, thay cho HSK 2.0)

Kỳ thi HSK 3.0 cấp 1–6 chính thức từ **13/12/2026**; HSK 7–9 là một bài thi gộp. Số liệu dưới đây tổng hợp từ trang chinesetest.cn (CTI), đề mẫu chính thức của CLEC (bản PDF "HSK4/5/6级考试结构与样题"), saymei.app, studycli.org, hsklord.com (tra ngày 23/11/2026). Ô có dấu **(giả định)** là chỗ nguồn không nói rõ → làm theo giá trị ghi ở đây cho thống nhất, ghi lại trong CONTENT_NOTES nếu tìm được nguồn khác.

## A.1 Quy mô từ vựng / chữ Hán (đề cương 2025, cộng dồn)

> **[CHỐT bởi điều phối chính — ưu tiên hơn bảng dưới]** `target_count` của file vocab theo chuẩn GF0025-2021 (ivankra/hsk30): 1=500, 2=772, 3=973, 4=1000, 5=1071, 6=1140, "7-9"=5636. Bảng dưới (đại cương 2025) chỉ để tham khảo độ khó đề thi. Field tùy chọn `syllabus2025: true` trên từ thuộc đại cương 2025.

| Level | Từ cộng dồn | **Từ mới của cấp = `target_count`** | Chữ nhận biết (cộng dồn) | Chữ viết tay (cộng dồn) | File vocab |
|---|---|---|---|---|---|
| 1 | 300 | 300 | 246 | 100 (chung với cấp 2) | `vocab/hsk1.json` |
| 2 | 500 | 200 | 371 | 100 | `vocab/hsk2.json` |
| 3 | 1 000 | 500 | 655 | 250 | `vocab/hsk3.json` |
| 4 | 2 000 | 1 000 | 1 096 | 400 | `vocab/hsk4.json` |
| 5 | 3 600 | 1 600 | 1 527 | 550 | `vocab/hsk5.json` |
| 6 | 5 400 | 1 800 | 1 940 | 700 | `vocab/hsk6.json` |
| "7-9" | ~11 000 | 5 600 | 3 088 | 1 200 | `vocab/hsk7-9.json` (**gộp một file**, vì đề cương không tách 7/8/9) |

- Lưu ý: một số trang ghi 500/772/973/… là đề cương GF0025-2021 (bản cũ) — **không dùng**.
- Chữ Hán: `writing/characters-hsk{L}.json`; `target_count` của chữ = số chữ nhận biết mới của cấp (1: 246, 2: 125, 3: 284, 4: 441, 5: 431, 6: 413, 7-9: 1 148). Thêm field `handwrite: true` cho chữ thuộc danh sách viết tay. File chữ có khung `{ "level", "target_count", "count", "complete", "characters": [...] }`.

## A.2 Cấu trúc đề từng cấp

Ký hiệu: `opt3` = 3 phương án A–C, `opt4` = 4 phương án A–D. "g a×b" = a group, mỗi group b câu. Thời gian tính phút, không gồm 5–8 phút điền thông tin. `repeat` = số lần phát âm thanh nghe.

### HSK 1 — 40 câu, ~40 phút, không viết, không nói. Thang 200 (nghe 100 + đọc 100), đạt 120. Pinyin: có. `repeat: 2`.
| Phần | Part | Câu | Số | `type` | Mô tả |
|---|---|---|---|---|---|
| Nghe (~12 + 3 chép đáp án) | L1 | 1–5 | 5 | `choose_image` | Nghe từ/câu ngắn, chọn 1 trong 3 ảnh |
| | L2 | 6–10 | 5 | `choose_option` (`question: null`, opt3) | Nghe một câu nói/câu hỏi, chọn câu đáp lại in sẵn |
| | L3 | 11–15 | 5 | `match_image` (g 1×5, 6 ảnh gồm ví dụ) | Nghe hội thoại ngắn, ghép ảnh |
| | L4 | 16–20 | 5 | `choose_option` opt3 | Nghe câu + câu hỏi, chọn đáp án chữ |
| Đọc (20) | R1 | 21–25 | 5 | `match_image` | Câu ↔ ảnh |
| | R2 | 26–30 | 5 | `match_sentence` | Câu hỏi ↔ câu trả lời |
| | R3 | 31–35 | 5 | `fill_blank_wordbank` (6 từ) | Chọn từ điền trống |
| | R4 | 36–40 | 5 | `choose_option` opt3 (có `passage`, `question` dạng ★) | Đọc đoạn ngắn, trả lời câu ★ |

### HSK 2 — 60 câu, ~60 phút, không nói. Thang 300 (nghe/đọc/viết mỗi phần 100), đạt 180. Pinyin: có (cả phần viết). `repeat: 2`.
| Phần | Part | Câu | Số | `type` | Mô tả |
|---|---|---|---|---|---|
| Nghe (~17 + 3) | L1 | 1–5 | 5 | `choose_image` | Nghe câu, chọn 1/3 ảnh |
| | L2 | 6–15 | 10 | `match_image` g 2×5 | Hội thoại ↔ ảnh |
| | L3 | 16–25 | 10 | `choose_option` opt3 | Hội thoại + câu hỏi |
| Đọc (25) | R1 | 26–30 | 5 | `match_image` | Câu ↔ ảnh |
| | R2 | 31–35 | 5 | `fill_blank_wordbank` | Chọn từ điền trống |
| | R3 | 36–45 | 10 | `match_sentence` g 2×5 | Câu ↔ câu đáp |
| | R4 | 46–50 | 5 | `choose_option` opt3 (passage + ★) | Đọc đoạn ngắn |
| Viết (10) | W1 | 51–55 | 5 | `choose_component` (6 bộ kiện A–F dùng chung) | Hoàn thành chữ bằng cách chọn bộ phận còn thiếu |
| | W2 | 56–60 | 5 | `write_hanzi_from_pinyin` | Viết chữ còn thiếu theo pinyin |

### HSK 3 — 70 câu, ~83 phút + bài nói 15 phút. Thang viết 300 (100/100/100), đạt 180. Pinyin: không. `repeat: 2` (giả định).
| Phần | Part | Câu | Số | `type` | Mô tả |
|---|---|---|---|---|---|
| Nghe (~23 + 5) | L1 | 1–10 | 10 | `match_image` g 2×5 | Hội thoại ngắn ↔ ảnh |
| | L2 | 11–20 | 10 | `choose_option` opt3 | Hội thoại + câu hỏi |
| | L3 | 21–30 | 10 | `choose_option` opt3 | Đoạn nói ngắn (độc thoại) + câu hỏi |
| Đọc (30) | R1 | 31–40 | 10 | `match_sentence` g 2×5 | Câu ↔ câu đáp |
| | R2 | 41–50 | 10 | `fill_blank_wordbank` g 2×5 | Chọn từ điền trống |
| | R3 | 51–60 | 10 | `choose_option` opt3 (★) | Đoạn ngắn; 2 đoạn có 2 câu hỏi (dùng `group.passage`) |
| Viết (20) | W1 | 61–65 | 5 | `write_hanzi_from_pinyin` | Viết chữ còn thiếu theo pinyin |
| | W2 | 66–70 | 5 | `write_sentence` (có `image`, `max_points: 2` giả định) | Đặt câu với từ cho sẵn + ảnh |
| Nói | — | 15 mục | | xem A.4 | nhắc lại 8 · tả ảnh 5 · trả lời 2 |

### HSK 4 — 70 câu, ~85 phút + nói 20 phút. Thang 300, đạt 180. `repeat: 1` (giả định).
| Phần | Part | Câu | Số | `type` | Mô tả |
|---|---|---|---|---|---|
| Nghe (~20 + 5) | L1 | 1–14 | 14 | `choose_option` opt4 | Hội thoại ngắn + câu hỏi |
| | L2 | 15–32 | 18 | `choose_option` opt4 | Đoạn độc thoại/tin nhắn; một số đoạn 2 câu hỏi (`group.audio`) |
| Đọc (30) | R1 | 33–42 | 10 | `fill_blank_wordbank` g 2×5 (5 từ A–E) | 33–37 câu đơn, 38–42 hội thoại 2 lượt |
| | R2 | 43–57 | 15 | `choose_option` opt4 | 43–50: đoạn ngắn + câu ★; 51–57: đoạn dài, mỗi đoạn 2 câu (group.passage) |
| | R3 | 58–64 | 7 | `cloze_sentence` | Điền câu A–… vào chỗ trống đánh số trong đoạn văn |
| Viết (25) | W1 | 65–69 | 5 | `write_sentence` (không ảnh, `max_points: 4` giả định) | Đặt câu với từ cho sẵn |
| | W2 | 70 | 1 | `write_essay` (`min_chars: 80`, `max_points: 20`) | Đoạn văn ≥ 80 chữ theo đề |
| Nói | — | 5 mục | | A.4 | thuật lại 2 · kể chuyện theo 3 ảnh 1 · trả lời 2 |

### HSK 5 — 72 câu, ~110 phút + nói 23 phút. Thang 300, `pass_score: 180` (giả định — chưa công bố). `repeat: 1` (giả định).
| Phần | Part | Câu | Số | `type` | Mô tả |
|---|---|---|---|---|---|
| Nghe (~25 + 5) | L1 | 1–19 | 19 | `choose_option` opt4 | Hội thoại ngắn |
| | L2 | 20–35 | 16 | `choose_option` opt4 | Đoạn dài, nhiều câu/đoạn (`group.audio`) |
| Đọc (35) | R1 | 36–45 | 10 | `cloze_option` | Đoạn văn có chỗ trống, mỗi chỗ 4 phương án |
| | R2 | 46–55 | 10 | `order_position` g 2×5 (5 đoạn A–E) | Sắp xếp 5 câu/đoạn thành bài mạch lạc |
| | R3 | 56–70 | 15 | `choose_option` opt4 | Bài đọc, nhiều câu/bài |
| Viết (40) | W1 | 71 | 1 | `picture_story_writing` (4 ảnh, `min_chars: 100`, `max_points: 40`) | Kể chuyện theo tranh |
| | W2 | 72 | 1 | `write_essay` (`min_chars: 200`, `max_points: 60`) | Bài văn theo đề |
| Nói | — | 5 mục | | A.4 | thuật lại 2 · kể chuyện theo 3 ảnh 1 · trả lời 2 |

### HSK 6 — 82 câu, ~125 phút + nói 23 phút. Thang 300, `pass_score: 180` (giả định). `repeat: 1` (giả định).
| Phần | Part | Câu | Số | `type` | Mô tả |
|---|---|---|---|---|---|
| Nghe (~30 + 5) | L1 | 1–8 | 8 | `choose_option` opt4 (`question: null`) | Nghe đoạn ngắn, chọn câu khớp nghĩa |
| | L2 | 9–28 | 20 | `choose_option` opt4, g 5×4 (`group.audio`) | 5 đoạn độc thoại, mỗi đoạn 4 câu |
| | L3 | 29–40 | 12 | `choose_option` opt4, g 3×4 (`group.audio`) | 3 hội thoại nam–nữ, mỗi bài 4 câu |
| Đọc (40) | R1 | 41–50 | 10 | `cloze_option` g 2×5 | 2 đoạn, mỗi đoạn 5 chỗ trống, 4 phương án |
| | R2 | 51–60 | 10 | `cloze_sentence` g 2×5 (6 câu A–F, thừa 1) | Điền câu vào đoạn |
| | R3 | 61–80 | 20 | `choose_option` opt4, g 5×4 | 5 bài đọc × 4 câu |
| Viết (45) | W1 | 81 | 1 | `write_essay` (`genre: "practical"`, `min_chars: 150`, `max_points: 40`) | Văn bản ứng dụng (thông báo…) |
| | W2 | 82 | 1 | `write_essay` (`genre: "argumentative"`, `min_chars: 300`, `max_points: 60`) | Nghị luận |
| Nói | — | 5 mục | | A.4 | thuật lại 2 · kể chuyện theo 4 ảnh 1 · trả lời 2 |

### HSK 7–9 (đề gộp) — `level: "7-9"`, file `exams/hsk7-9-de1.json`, 91 câu, ~200 phút. Theo trang CTI hiện tại (một bản khác ghi 98 câu/210 phút — dùng bản 91). `repeat: 1`. Mỗi kỹ năng chấm 0–100; kết quả xếp bậc: dưới 7 / 7 / 8 / 9.
| Phần (`section.id`) | Part | Số | `type` | Mô tả |
|---|---|---|---|---|
| Nghe `listening` (~33) | L1 | 10 | `true_false_statement` (giả định) | Nghe, phán đoán đúng/sai |
| | L2 | 12 | 9 `choose_option` opt4 + 3 `short_answer` (`group.audio`) | Đoạn nghe dài: chọn + điền ngắn |
| | L3 | 18 | 15 `choose_option` opt4 + 3 `short_answer` | Bài giảng/phỏng vấn dài |
| Đọc `reading` (50) | R1 | 21 | `choose_option` opt4 (group.passage) | Bài đọc dài |
| | R2 | 5 | `order_position` hoặc `cloze_sentence` (giả định: `cloze_sentence`, 6–7 đoạn A–G) | Điền đoạn/sắp xếp đoạn |
| | R3 | 14 | `short_answer` (`max_chars` ≤ 10) | Trả lời ngắn theo bài đọc |
| Viết `writing` (55) | W1 | 1 | `chart_description` (`min_chars: 200`, ~15 phút) | Mô tả, phân tích biểu đồ |
| | W2 | 1 | `write_essay` (`genre: "argumentative"`, `min_chars: 600`, ~40 phút) | Nghị luận |
| Dịch `translation` (42) | T1 | 2 | `translate_written` | Dịch viết đoạn tiếng nước ngoài → tiếng Trung |
| | T2 | 2 | `translate_oral` | Dịch nói (视译): đọc đoạn văn, nói bản dịch tiếng Trung |
| Nói `speaking` (~20) | — | 5 | A.4 (paper `hsk7-9-de1-speaking`) | 1 trình bày theo tài liệu · 3 nghe rồi trả lời · 1 trả lời quan điểm (chuẩn bị 3', nói 3') |

Khung riêng của file 7-9: `"total_score": null`, `"pass_score": null`, `"score_mode": "bands"`, mỗi section `max_score: 100`, và:
```json
"band_rules": { "basis": "average_section_score", "official": false,
  "bands": [ { "min": 0, "label_vi": "Dưới HSK 7" }, { "min": 60, "label_vi": "HSK 7" },
             { "min": 75, "label_vi": "HSK 8" }, { "min": 90, "label_vi": "HSK 9" } ] }
```
(ngưỡng tạm do web ước lượng — **không chính thức**, web phải hiện dòng cảnh báo đó.) HSK1–6: `"score_mode": "pass"`.

## A.3 Type câu hỏi mới / thay đổi

**Thay đổi chung**
- `choose_option`: `options` có 3 (HSK1–3) hoặc 4 (HSK4+) phần tử; `question` được phép `null` (HSK1 L2: chọn câu đáp lại; HSK6 L1: chọn câu khớp nghĩa) — khi đó web hiện "Chọn đáp án phù hợp".
- `write_sentence`: thêm `max_points` (int); `image` có ở HSK3, không có ở HSK4.
- Câu chủ quan (`write_sentence`, `short_answer`, `write_essay`, `picture_story_writing`, `chart_description`, `translate_written`, `translate_oral`) bắt buộc có `max_points` và `rubric_id` (trỏ tới `exam.rubrics[]`, cùng cấu trúc rubric §7; tiêu chí gợi ý: content, organization, vocab_grammar, characters / accuracy, fluency cho dịch). `answer: null` trừ `short_answer`.
- Điểm một section = round(`max_score` × điểm đạt / tổng điểm tối đa), câu khách quan = 1 điểm.
- Trong đoạn văn có chỗ trống đánh số, ký hiệu chỗ trống là `（{no}）`, vd `（41）` (khác `（ ）` của câu đơn).

**`choose_component`** (HSK2 W1). `group.shared_options`: 6 Option `{key, text:{zh:"马"}}` là bộ kiện.
```json
{ "id": "hsk2-de1-51", "no": 51, "type": "choose_component",
  "word": { "zh": "妈妈", "pinyin": "māma" },
  "target_char": "妈", "target_index": 0,
  "shown_part": "女", "layout": "left-right",
  "answer": "B", "explanation_vi": "妈 = 女 + 马 (B)." }
```
`layout` ∈ `left-right` | `top-bottom` | `enclosure` | `other`. Web hiển thị `word` với chữ thứ `target_index` thay bằng `shown_part` + ô trống theo `layout`.

**`cloze_option`** (HSK5 R1, HSK6 R1). Đoạn văn ở `group.passage` chứa `（36）`…; mỗi câu một chỗ trống.
```json
{ "id": "hsk5-de1-36", "no": 36, "type": "cloze_option", "blank_no": 36,
  "options": [ { "key": "A", "text": { "zh": "方便" } }, { "key": "B", "text": { "zh": "随便" } },
               { "key": "C", "text": { "zh": "顺便" } }, { "key": "D", "text": { "zh": "轻便" } } ],
  "answer": "A", "explanation_vi": "…" }
```

**`cloze_sentence`** (HSK4 R3, HSK6 R2, 7-9 R2). `group.passage` chứa `（58）`…; `group.shared_options` là các câu/đoạn A–F (có thể thừa); mỗi key dùng tối đa 1 lần.
```json
{ "id": "hsk4-de1-58", "no": 58, "type": "cloze_sentence", "blank_no": 58, "answer": "B", "explanation_vi": "…" }
```

**`order_position`** (HSK5 R2). `group.shared_options` = 5 câu/đoạn A–E đã xáo; `group.passage` (tùy chọn) = tiêu đề/câu mở đầu. Mỗi câu hỏi là một vị trí; mỗi key dùng đúng 1 lần.
```json
{ "id": "hsk5-de1-46", "no": 46, "type": "order_position", "position": 1, "answer": "C", "explanation_vi": "C giới thiệu nhân vật nên đứng đầu." }
```

**`short_answer`** (7-9 L2, L3, R3). Ngữ liệu ở `group.audio` hoặc `group.passage`.
```json
{ "id": "hsk7-9-de1-20", "no": 20, "type": "short_answer",
  "question": { "zh": "作者认为城市绿化最大的作用是什么？" },
  "max_chars": 10, "answer": "改善空气质量", "accepted_answers": ["提高空气质量"],
  "keywords": ["空气"], "max_points": 1, "rubric_id": "rb-short", "explanation_vi": "…" }
```
Chấm không AI: đúng nếu khớp `answer`/`accepted_answers` (bỏ dấu câu) hoặc chứa mọi `keywords`.

**`write_essay`** (HSK4 W2, HSK5 W2, HSK6 W1–W2, 7-9 W2)
```json
{ "id": "hsk4-de1-70", "no": 70, "type": "write_essay",
  "genre": "narrative",
  "prompt": { "zh": "请写一篇不少于80字的短文，介绍一下你最难忘的一次旅行。" },
  "prompt_vi": "Viết đoạn văn ≥ 80 chữ kể về chuyến du lịch đáng nhớ nhất.",
  "keywords": [], "image": null, "min_chars": 80, "max_chars": null,
  "time_minutes": null,
  "sample_answers": ["…"], "outline_vi": ["Mở: …", "Thân: …", "Kết: …"],
  "max_points": 20, "rubric_id": "rb-essay", "answer": null, "explanation_vi": "…" }
```
`genre` ∈ `narrative` | `practical` | `argumentative` | `descriptive`.

**`picture_story_writing`** (HSK5 W1)
```json
{ "id": "hsk5-de1-71", "no": 71, "type": "picture_story_writing",
  "images": [ { "emoji": "🧒📚", "alt_vi": "Cậu bé ngồi đọc sách một mình" }, { "emoji": "…", "alt_vi": "…" },
              { "emoji": "…", "alt_vi": "…" }, { "emoji": "…", "alt_vi": "…" } ],
  "prompt": { "zh": "请根据下面四张图片写一个不少于100字的故事。" }, "prompt_vi": "…",
  "min_chars": 100, "sample_answers": ["…"], "max_points": 40, "rubric_id": "rb-essay",
  "answer": null, "explanation_vi": "…" }
```

**`chart_description`** (7-9 W1). Web vẽ biểu đồ đơn giản (SVG/bảng) từ `chart`.
```json
{ "id": "hsk7-9-de1-81", "no": 81, "type": "chart_description",
  "chart": { "kind": "bar", "title_zh": "2020—2024年某市电动汽车销量", "unit": "万辆",
             "labels": ["2020","2021","2022","2023","2024"],
             "series": [ { "name": "销量", "values": [3.2, 4.8, 7.1, 9.6, 12.3] } ] },
  "prompt": { "zh": "请描述并分析上图，写一篇200字左右的短文。" }, "prompt_vi": "…",
  "min_chars": 200, "time_minutes": 15, "sample_answers": ["…"],
  "max_points": 30, "rubric_id": "rb-chart", "answer": null, "explanation_vi": "…" }
```
`chart.kind` ∈ `bar` | `line` | `pie` | `table`; `values.length` = `labels.length`.

**`translate_written`** (7-9 T1) và **`translate_oral`** (7-9 T2)
```json
{ "id": "hsk7-9-de1-83", "no": 83, "type": "translate_written",
  "source": { "lang": "en", "text": "…English passage…" },
  "source_vi": "…bản tiếng Việt tương đương (tùy chọn, cho người Việt luyện)…",
  "reference_zh": "…bản dịch mẫu…", "time_minutes": 20,
  "max_points": 25, "rubric_id": "rb-translate", "answer": null, "explanation_vi": "…" }
```
`translate_oral` thêm `prep_seconds` (vd 60), `answer_seconds` (vd 120); bài làm là ghi âm → nhận dạng → AI chấm so với `reference_zh`. Đề thật dùng tiếng Anh: `source.lang: "en"` bắt buộc, `source_vi` tùy chọn.

## A.4 Bài thi nói HSK 3.0 (trong `speaking/hskk.json` — Agent A)

`hskk.json` giữ cấu trúc §7, mở rộng:
- `levels[].level` thêm `3`, `4`, `5`, `6`, `"7-9"` (cấp HSKK độc lập `so|trung|cao` thành tùy chọn).
- `items[].type` thêm `picture_story` (`images`: 3–4 Image theo thứ tự) và `present_material` (`prompt` là tài liệu hiển thị, có `prep_seconds`). `describe_picture` ở HSK3 = nói 1 câu cho 1 ảnh.
- Mảng mới `papers`: bộ đề nói hoàn chỉnh, đề viết tham chiếu qua `exam.speaking_paper`.
```json
"papers": [ { "id": "hsk4-de1-speaking", "level": 4, "title_vi": "Đề nói HSK 4 – Đề 1",
              "warmup": true, "prep_total_seconds": 600,
              "item_ids": ["hsk4-s-01", "hsk4-s-02", "hsk4-s-03", "hsk4-s-04", "hsk4-s-05"] } ]
```
`warmup: true` → web phát phần chào + 3 câu hỏi cá nhân (tên, quốc tịch, 5 số cuối số báo danh; 10 s mỗi câu, không chấm). Âm thanh đề nói phát **1 lần**. Câu hỏi part 3 chỉ in chữ Hán (không pinyin, không đọc).

| Level | Part `code` | `type` | Số mục | Chuẩn bị | Trả lời |
|---|---|---|---|---|---|
| 3 | `hsk3-1` | `repeat` (câu 7–10 chữ) | 8 | 0 | 10 s |
| | `hsk3-2` | `describe_picture` (1 câu/ảnh) | 5 | 0 | 15 s |
| | `hsk3-3` | `answer_question` | 2 | 180 s/câu | 90 s |
| 4 | `hsk4-1` | `retell` (đoạn nghe 14–20 s) | 2 | 0 | 40 s |
| | `hsk4-2` | `picture_story` (3 ảnh) | 1 | 180 s | 120 s |
| | `hsk4-3` | `answer_question` | 2 | 210 s/câu | 120 s |
| 5 | `hsk5-1` | `retell` (đoạn 30–36 s) | 2 | 0 | 90 s |
| | `hsk5-2` | `picture_story` (3 ảnh) | 1 | 180 s | 120 s |
| | `hsk5-3` | `answer_question` | 2 | 210 s/câu | 150 s |
| 6 | `hsk6-1` | `retell` (đoạn 30–36 s) | 2 | 0 | 90 s |
| | `hsk6-2` | `picture_story` (4 ảnh) | 1 | 180 s | 120 s |
| | `hsk6-3` | `answer_question` | 2 | 210 s/câu | 150 s |
| 7-9 | `hsk7-9-1` | `present_material` | 1 | 120 s (giả định) | 180 s (giả định) |
| | `hsk7-9-2` | `listen_answer` | 3 | 0 (giả định) | 60 s (giả định) |
| | `hsk7-9-3` | `answer_question` (quan điểm) | 1 | 180 s | 180 s |

Item id: `hsk{L}-s-{stt:02}`. Rubric gợi ý: `rb-repeat`, `rb-speech` (dùng chung), `rb-present`.

## A.5 Tên file đề và quy ước
- HSK1–6: `data/exams/hsk{n}-de1.json` (`id` `hsk{n}-de1`). Đề gộp: `data/exams/hsk7-9-de1.json` (`id` `hsk7-9-de1`, `level: "7-9"`). Đề thứ k: `-de{k}`.
- Field mới của exam: `"score_mode": "pass" | "bands"`, `"speaking_paper": "<paper id>" | null`, `"rubrics": [...]` (cho câu chủ quan), `"band_rules"` (chỉ 7-9), `"repeat_default"` (2 cho HSK1–3, 1 cho HSK4+). `"standard": "HSK3.0"`.
- `show_pinyin`: `true` cho HSK1–2, `false` từ HSK3.

## A.6 `data/writing/radicals.json` — 214 bộ thủ Khang Hy (bổ sung 2026-11-23)

Manifest: khóa cấp cao nhất `"radicals": "writing/radicals.json"` trong `data/index.json`.

```json
{
  "count": 214,
  "radicals": [
    { "id": 9, "radical": "人", "variants": ["亻"], "pinyin": "rén", "han_viet": "nhân",
      "meaning_vi": "người", "strokes": 2, "common": true }
  ],
  "variant_to_radical": { "亻": "人", "氵": "水", "讠": "言", "阝": "阜", "人": "人" },
  "char_radical_override": { "都": "邑", "那": "邑" }
}
```
- `id` 1–214 theo thứ tự Khang Hy; `radical` = dạng chuẩn Khang Hy (NFKC của khối Unicode Kangxi Radicals, có thể là dạng phồn thể như 見, 言, 貝); `variants` = biến thể bộ thủ và dạng giản thể (见, 讠, 贝…); `strokes` = số nét của dạng chuẩn; `common: true` cho ~70 bộ hay gặp.
- `variant_to_radical`: chuẩn hóa MỌI giá trị `radical` xuất hiện trong `characters-*.json` (kể cả dạng chuẩn tự map về chính nó). Web tra: `R = char_radical_override[hanzi] ?? variant_to_radical[c.radical] ?? c.radical`.
- Quy ước 阝: `variant_to_radical["阝"] = "阜"` (bộ phụ, 阝 bên trái: 院, 阳…). Chữ có 阝 bên phải (bộ ấp 邑: 都, 那, 部, 邮…) nằm trong `char_radical_override` (sinh tự động từ cấu trúc chữ của Make Me a Hanzi).

## A.7 Shadowing YouTube (bổ sung 2026-11-23)

Item `source: "youtube"` trong `speaking/shadowing.json` có thêm:
- `youtube.title`, `youtube.channel` (lấy từ oEmbed), `youtube.verified_method: "oembed"`, `youtube.verified_at` (ngày). `verified: true` chỉ khi `https://www.youtube.com/oembed?url=…&format=json` trả về title/author (video tồn tại, cho phép nhúng).
- `description_vi` (tùy chọn): mô tả ngắn, nêu nếu video có giải thích tiếng Anh/giọng Đài Loan.
- `auto_segments: true` + `segments: []`: chưa có mốc thời gian; web hiển thị nút "Tạo phụ đề bằng AI" (Gemini đọc video) hoặc cho người dùng tự thêm đoạn. Khi đã có `segments` (start/end thật) thì `auto_segments` có thể bỏ hoặc `false`.
- `level` của item YouTube là cấp gợi ý (1–6 hoặc "7-9").
