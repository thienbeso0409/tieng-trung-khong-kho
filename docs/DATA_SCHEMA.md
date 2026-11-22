# ĐẶC TẢ DỮ LIỆU (DATA_SCHEMA) — "Tiếng Trung không khó"

Hợp đồng giữa Agent Chuyên môn (ghi `data/`) và Agent Web (đọc `data/`). Mọi thứ ở đây là **bắt buộc** trừ khi ghi "(tùy chọn)". Không thêm field bắt buộc mới; field lạ được phép nhưng web bỏ qua. Field `notes` (chuỗi) được phép ở mọi object.

## 1. Quy ước chung

- File JSON UTF-8, không BOM, không comment, không dấu phẩy thừa. Thụt lề 2 khoảng trắng.
- Đường dẫn trong JSON là **tương đối so với thư mục `data/`** (vd `"vocab/hsk1.json"`).
- `level` (HSK): số nguyên 1–6. Cấp HSKK: chuỗi `"so"` | `"trung"` | `"cao"`.
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
      "exams": [ { "id": "hsk3-de1", "file": "exams/hsk3-de1.json", "title_vi": "Đề thi thử HSK 3 – Đề 1" } ] }
  ],
  "speaking": {
    "topics": "speaking/topics.json",
    "hskk": "speaking/hskk.json",
    "shadowing": "speaking/shadowing.json"
  },
  "writing": {
    "characters": "writing/characters.json",
    "practice": "writing/practice.json"
  }
}
```
Web lấy danh sách cấp/đề **chỉ** từ manifest (không hard-code). Thêm HSK4 = thêm phần tử `levels`.

## 3. `data/vocab/hsk{n}.json` — từ vựng

Mỗi file chỉ chứa từ **mới** của cấp đó (HSK2 không lặp từ HSK1).

```json
{
  "level": 1,
  "count": 150,
  "words": [
    {
      "id": "hsk1-001",
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
- Bắt buộc: `id` (`hsk{n}-{stt:03}`), `hanzi`, `pinyin`, `pos`, `meaning_vi`. Tùy chọn: `han_viet`, `example` (Text có đủ zh/pinyin/vi), `topic`, `traditional`.
- `pos` dùng một trong: `danh từ`, `động từ`, `tính từ`, `phó từ`, `đại từ`, `số từ`, `lượng từ`, `giới từ`, `liên từ`, `trợ từ`, `trợ động từ`, `thán từ`, `cụm từ`, `danh từ riêng`. Nhiều loại: nối bằng `, `.
- `count` = độ dài `words`. Sắp theo pinyin (a→z).

## 4. Cấu trúc đề HSK 2.0 (bắt buộc tuân thủ)

| Cấp | Phần | Part | Mã part (`code`) | Số câu | `type` | Ghi chú |
|---|---|---|---|---|---|---|
| HSK1 | Nghe | 1 | `L1` | 5 | `true_false_image` | Nghe cụm từ, đúng/sai với ảnh |
| | | 2 | `L2` | 5 | `choose_image` | Nghe câu, chọn 1 trong 3 ảnh A/B/C |
| | | 3 | `L3` | 5 | `match_image` | Nghe hội thoại, chọn ảnh từ A–F (1 group, 6 ảnh, 1 ví dụ) |
| | | 4 | `L4` | 5 | `choose_option` | Nghe câu + câu hỏi, chọn A/B/C (chữ) |
| | Đọc | 1 | `R1` | 5 | `true_false_image` | Từ + ảnh, đúng/sai |
| | | 2 | `R2` | 5 | `match_image` | Câu ↔ ảnh A–F |
| | | 3 | `R3` | 5 | `match_sentence` | Câu hỏi ↔ câu trả lời A–F |
| | | 4 | `R4` | 5 | `fill_blank_wordbank` | Chọn từ A–F điền chỗ trống |
| HSK2 | Nghe | 1 | `L1` | 10 | `true_false_image` | Nghe câu, đúng/sai với ảnh |
| | | 2 | `L2` | 10 | `match_image` | Hội thoại ngắn ↔ ảnh; 2 group × 5 (mỗi group 5–6 ảnh) |
| | | 3 | `L3` | 10 | `choose_option` | Hội thoại 2 câu + câu hỏi, A/B/C |
| | | 4 | `L4` | 5 | `choose_option` | Hội thoại 4–5 câu + câu hỏi, A/B/C |
| | Đọc | 1 | `R1` | 5 | `match_image` | Câu ↔ ảnh A–F |
| | | 2 | `R2` | 5 | `fill_blank_wordbank` | Từ A–F điền chỗ trống |
| | | 3 | `R3` | 5 | `true_false_statement` | Đoạn văn + câu ★, đúng/sai |
| | | 4 | `R4` | 10 | `match_sentence` | Ghép câu A–E/F; 2 group × 5 |
| HSK3 | Nghe | 1 | `L1` | 10 | `match_image` | Hội thoại ↔ ảnh; 2 group × 5 |
| | | 2 | `L2` | 10 | `true_false_statement` | Nghe đoạn, phán đoán câu ★ |
| | | 3 | `L3` | 10 | `choose_option` | Hội thoại ngắn + câu hỏi, A/B/C |
| | | 4 | `L4` | 10 | `choose_option` | Hội thoại dài hơn (4–5 lượt) + câu hỏi, A/B/C |
| | Đọc | 1 | `R1` | 10 | `match_sentence` | Ghép câu; 2 group × 5 (A–F) |
| | | 2 | `R2` | 10 | `fill_blank_wordbank` | 2 group × 5 (mỗi group 6 từ A–F, 1 ví dụ) |
| | | 3 | `R3` | 10 | `choose_option` | Đoạn văn ngắn + câu hỏi, A/B/C |
| | Viết | 1 | `W1` | 5 | `reorder_words` | Sắp xếp từ thành câu |
| | | 2 | `W2` | 5 | `write_hanzi_from_pinyin` | Viết chữ Hán theo pinyin |

Thông tin đề:

| Cấp | `duration_minutes` | Thang điểm | `pass_score` | Pinyin trên đề |
|---|---|---|---|---|
| HSK1 | 40 | nghe 100 + đọc 100 = 200 | 120 | có |
| HSK2 | 55 | nghe 100 + đọc 100 = 200 | 120 | có |
| HSK3 | 90 | nghe 100 + đọc 100 + viết 100 = 300 | 180 | không |

Điểm phần = round(100 × số câu đúng / số câu tính điểm của phần). Câu `is_example: true` không tính và **không** thuộc số câu ở bảng trên (đánh `no: 0`, hiển thị "Ví dụ" đã có đáp án).

## 5. `data/exams/hsk{n}-de{k}.json` — đề thi

### 5.1 Khung

```json
{
  "id": "hsk1-de1",
  "level": 1,
  "title_vi": "Đề thi thử HSK 1 – Đề 1",
  "standard": "HSK2.0",
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
- `sections[].id` ∈ `listening` | `reading` | `writing` (HSK1–2 không có `writing`; HSK4–6 có thể thêm). Thứ tự: listening → reading → writing.
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

**`write_sentence`** — (HSK4 W2 / luyện viết mở rộng; dùng trong `writing/practice.json`) viết câu dùng từ cho trước (+ ảnh tùy chọn).
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

Type dành sẵn cho HSK4–6 (web render tối thiểu, đợt 1 chưa cần dữ liệu): `choose_option` với `passage` dài (đọc hiểu), `order_sentences` (`sentences`: Option[] A–C, `answer`: `"BAC"`), `write_essay` (`prompt_vi`, `prompt_zh`, `keywords`: string[], `min_chars`, `sample_answers`, `answer: null`).

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
- ≥ 10 item cho `so` và ≥ 10 cho `trung`, mỗi part của cấp có ≥ 2 item.

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

### 9.1 `data/writing/characters.json`
```json
{
  "characters": [
    { "hanzi": "好", "pinyin": "hǎo", "meaning_vi": "tốt, hay", "han_viet": "hảo",
      "strokes": 6, "radical": "女", "radical_meaning_vi": "nữ (phụ nữ)", "level": 1,
      "words": ["你好", "好吃"] }
  ]
}
```
Bắt buộc: `hanzi` (đúng 1 ký tự, không trùng trong file), `pinyin`, `meaning_vi`, `strokes` (int), `radical`, `level` (cấp đầu tiên chữ xuất hiện). Tùy chọn: `han_viet`, `radical_meaning_vi`, `words` (từ trong vocab chứa chữ này). Sắp theo `level` rồi pinyin.

### 9.2 `data/writing/practice.json` — luyện viết ngoài đề
```json
{
  "sets": [
    { "id": "wp3-reorder", "level": 3, "type": "reorder_words", "title_vi": "Sắp xếp từ thành câu – HSK 3",
      "questions": [ { "id": "wp3-ro-01", "type": "reorder_words", "words": ["…"], "answer": "…。", "explanation_vi": "…" } ] }
  ]
}
```
- Mỗi set một `type` (`reorder_words` | `write_hanzi_from_pinyin` | `write_sentence`); câu hỏi dùng đúng schema §5.3, không cần `no`, không cần `audio`.
- Prompt AI chấm `write_sentence` (web tự xây): chấm thang 0–10 về ngữ pháp, dùng đúng từ khóa, phù hợp ảnh, độ tự nhiên; trả JSON `{score, corrected_zh, pinyin, feedback_vi}`.

### 9.3 Định dạng trả lời AI (tham chiếu cho Agent Web, không phải file data)
- Hội thoại: Gemini trả JSON `{ "zh": "...", "pinyin": "...", "vi": "...", "correction_vi": "..."|null }` (dùng `generationConfig.responseMimeType: "application/json"`).
- Chấm HSKK: `{ "scores": { "<criteria.key>": number(0..10) }, "total": number(0..max_score), "transcript_note_vi": "...", "feedback_vi": "...", "suggested_answer_zh": "..." }`; web tính `total` = Σ weight × score × max_score/10 nếu AI trả thiếu.
- Chấm dự phòng (không key): độ khớp ký tự = LCS(chuỗi nhận dạng, chuỗi mẫu)/độ dài mẫu (bỏ dấu câu, khoảng trắng); với câu mở: tỷ lệ `keywords` xuất hiện.

## 10. Mở rộng HSK 4–6
- Thêm `levels[]` trong manifest + file `vocab/hsk4.json`, `exams/hsk4-de1.json`.
- Part code tiếp tục `L1..Ln`, `R1..Rn`, `W1..Wn`; dùng type ở §5.3 (kể cả `order_sentences`, `write_essay`); `choose_option` cho phép 4 phương án.
- `show_pinyin: false` từ HSK3 trở lên.
