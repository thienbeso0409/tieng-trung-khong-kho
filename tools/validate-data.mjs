#!/usr/bin/env node
// Kiểm tra dữ liệu theo docs/DATA_SCHEMA.md — không phụ thuộc thư viện ngoài.
// Dùng: node tools/validate-data.mjs [thư_mục_data]   (mặc định: data)
// Exit code: 0 = không lỗi (có thể có cảnh báo), 1 = có lỗi.
import { readFileSync, existsSync, statSync } from 'node:fs';
import { join, resolve } from 'node:path';

const DATA_DIR = resolve(process.argv[2] || 'data');
const errors = [];
const warnings = [];
const err = (file, msg) => errors.push(`${file}: ${msg}`);
const warn = (file, msg) => warnings.push(`${file}: ${msg}`);

const POS = ['danh từ', 'động từ', 'tính từ', 'phó từ', 'đại từ', 'số từ', 'lượng từ', 'giới từ', 'liên từ', 'trợ từ', 'trợ động từ', 'thán từ', 'cụm từ', 'danh từ riêng'];
const SPEAKERS = ['男', '女', '旁白'];
const Q_TYPES = ['true_false_image', 'choose_image', 'match_image', 'choose_option', 'true_false_statement', 'match_sentence', 'fill_blank_wordbank', 'reorder_words', 'write_hanzi_from_pinyin', 'write_sentence', 'order_sentences', 'write_essay',
  'choose_reply', 'choose_component', 'cloze_option', 'cloze_sentence', 'order_position', 'short_answer', 'picture_story_writing', 'chart_description', 'translate_written', 'translate_oral'];
const SHARED_TYPES = ['match_image', 'match_sentence', 'fill_blank_wordbank', 'choose_component', 'cloze_sentence', 'order_position'];
const SUBJECTIVE = ['write_sentence', 'short_answer', 'write_essay', 'picture_story_writing', 'chart_description', 'translate_written', 'translate_oral'];
const HSKK_TYPES = ['repeat', 'listen_answer', 'answer_question', 'describe_picture', 'retell', 'read_aloud', 'picture_story', 'present_material'];
const LEVEL_KEYS = ['1', '2', '3', '4', '5', '6', '7-9'];
const isLevel = (l) => LEVEL_KEYS.includes(String(l));
const ID_RE = /^[A-Za-z0-9-]+$/; // schema ví dụ dùng "hsk1-de1-L1-ex"
const BLANK = '（ ）';

// Cấu trúc HSK 3.0 (DATA_SCHEMA Phụ lục A.2). type có thể là mảng (part trộn nhiều dạng).
const CO = 'choose_option';
const STRUCTURE = {
  1: { total: 200, pass: 120, pinyin: true, sections: { listening: [['L1', 'choose_image', 5], ['L2', CO, 5], ['L3', 'match_image', 5], ['L4', CO, 5]], reading: [['R1', 'match_image', 5], ['R2', 'match_sentence', 5], ['R3', 'fill_blank_wordbank', 5], ['R4', CO, 5]] } },
  2: { total: 300, pass: 180, pinyin: true, sections: { listening: [['L1', 'choose_image', 5], ['L2', 'match_image', 10], ['L3', CO, 10]], reading: [['R1', 'match_image', 5], ['R2', 'fill_blank_wordbank', 5], ['R3', 'match_sentence', 10], ['R4', CO, 5]], writing: [['W1', 'choose_component', 5], ['W2', 'write_hanzi_from_pinyin', 5]] } },
  3: { total: 300, pass: 180, pinyin: false, sections: { listening: [['L1', 'match_image', 10], ['L2', CO, 10], ['L3', CO, 10]], reading: [['R1', 'match_sentence', 10], ['R2', 'fill_blank_wordbank', 10], ['R3', CO, 10]], writing: [['W1', 'write_hanzi_from_pinyin', 5], ['W2', 'write_sentence', 5]] } },
  4: { total: 300, pass: 180, pinyin: false, sections: { listening: [['L1', CO, 14], ['L2', CO, 18]], reading: [['R1', 'fill_blank_wordbank', 10], ['R2', CO, 15], ['R3', 'cloze_sentence', 7]], writing: [['W1', 'write_sentence', 5], ['W2', 'write_essay', 1]] } },
  5: { total: 300, pass: 180, pinyin: false, sections: { listening: [['L1', CO, 19], ['L2', CO, 16]], reading: [['R1', 'cloze_option', 10], ['R2', 'order_position', 10], ['R3', CO, 15]], writing: [['W1', 'picture_story_writing', 1], ['W2', 'write_essay', 1]] } },
  6: { total: 300, pass: 180, pinyin: false, sections: { listening: [['L1', CO, 8], ['L2', CO, 20], ['L3', CO, 12]], reading: [['R1', 'cloze_option', 10], ['R2', 'cloze_sentence', 10], ['R3', CO, 20]], writing: [['W1', 'write_essay', 1], ['W2', 'write_essay', 1]] } },
  '7-9': { total: null, pass: null, pinyin: false, bands: true, sections: {
    listening: [['L1', 'true_false_statement', 10], ['L2', [CO, 'short_answer'], 12], ['L3', [CO, 'short_answer'], 18]],
    reading: [['R1', CO, 21], ['R2', ['cloze_sentence', 'order_position'], 5], ['R3', 'short_answer', 14]],
    writing: [['W1', 'chart_description', 1], ['W2', 'write_essay', 1]],
    translation: [['T1', 'translate_written', 2], ['T2', 'translate_oral', 2]] } },
};
const SECTION_ORDER = ['listening', 'reading', 'writing', 'translation', 'speaking'];

const isObj = (v) => v !== null && typeof v === 'object' && !Array.isArray(v);
const isStr = (v) => typeof v === 'string' && v.trim().length > 0;
const hasHan = (s) => /[㐀-鿿]/.test(s || '');

const refs = { speakingPapers: [], missing: [] };
// optional = true: file khai báo trong manifest nhưng chưa có → cảnh báo "đang soạn" (web hiện "Đang soạn").
function loadJSON(rel, label = rel, optional = false) {
  const p = join(DATA_DIR, rel);
  if (!existsSync(p) || !statSync(p).isFile()) {
    if (optional) { refs.missing.push(rel); warn(label, 'chưa có file (đang soạn)'); } else err(label, `không tìm thấy file (${rel})`);
    return null;
  }
  const buf = readFileSync(p);
  if (buf[0] === 0xef && buf[1] === 0xbb && buf[2] === 0xbf) err(rel, 'file có BOM UTF-8 (phải bỏ BOM)');
  try { return JSON.parse(buf.toString('utf8').replace(/^﻿/, '')); }
  catch (e) { err(rel, `JSON không hợp lệ: ${e.message}`); return null; }
}

function checkPinyin(file, where, py) {
  if (py == null) return;
  if (typeof py !== 'string') return err(file, `${where}: pinyin phải là chuỗi`);
  if (/[a-zü][1-5]\b/i.test(py)) warn(file, `${where}: pinyin có vẻ dùng số thanh ("${py}")`);
  if (hasHan(py)) err(file, `${where}: pinyin chứa chữ Hán ("${py}")`);
}

function checkText(file, where, t, { needPinyin = false, required = true } = {}) {
  if (t == null) { if (required) err(file, `${where}: thiếu Text`); return; }
  if (!isObj(t)) return err(file, `${where}: Text phải là object {zh, pinyin?, vi?}`);
  if (!isStr(t.zh)) err(file, `${where}: Text thiếu "zh"`);
  if (t.pinyin != null) checkPinyin(file, where, t.pinyin);
  if (needPinyin && !isStr(t.pinyin)) err(file, `${where}: HSK1–2 bắt buộc có pinyin trên Text hiển thị`);
  if (t.vi != null && typeof t.vi !== 'string') err(file, `${where}: Text.vi phải là chuỗi`);
}

function checkImage(file, where, img, required = true) {
  if (img == null) { if (required) err(file, `${where}: thiếu image`); return; }
  if (!isObj(img)) return err(file, `${where}: image phải là object {emoji, alt_vi}`);
  if (!isStr(img.emoji)) err(file, `${where}: image thiếu emoji`);
  if (!isStr(img.alt_vi)) err(file, `${where}: image thiếu alt_vi`);
}

function checkAudio(file, where, a, { examRepeat = false } = {}) {
  if (!isObj(a)) return err(file, `${where}: thiếu/sai audio`);
  if (!Array.isArray(a.lines) || !a.lines.length) err(file, `${where}: audio.lines rỗng`);
  else a.lines.forEach((l, i) => {
    if (!SPEAKERS.includes(l?.speaker)) err(file, `${where}: audio.lines[${i}].speaker phải là 男/女/旁白`);
    if (!isStr(l?.text)) err(file, `${where}: audio.lines[${i}].text rỗng`);
    if (l?.pinyin != null) checkPinyin(file, `${where} audio.lines[${i}]`, l.pinyin);
  });
  if (!Number.isInteger(a.repeat) || a.repeat < 1) err(file, `${where}: audio.repeat phải là số nguyên ≥ 1`);
  else if (examRepeat && a.repeat !== examRepeat) warn(file, `${where}: audio.repeat = ${a.repeat}, đề cấp này nên là ${examRepeat}`);
}

function checkOptions(file, where, opts, { needPinyin, kind } = {}) {
  if (!Array.isArray(opts) || !opts.length) { err(file, `${where}: options rỗng`); return []; }
  const keys = [];
  opts.forEach((o, i) => {
    const w = `${where} option[${i}]`;
    if (!isObj(o)) return err(file, `${w}: phải là object`);
    const expect = String.fromCharCode(65 + i);
    if (o.key !== expect) err(file, `${w}: key phải là "${expect}" (A, B, C… liên tục), đang là "${o.key}"`);
    keys.push(o.key);
    if (o.text == null && o.image == null) err(file, `${w}: cần text hoặc image`);
    if (o.text != null) checkText(file, w, o.text, { needPinyin });
    if (o.image != null) checkImage(file, w, o.image);
    if (kind === 'image' && o.image == null) err(file, `${w}: dạng này cần image`);
    if (kind === 'text' && o.text == null) err(file, `${w}: dạng này cần text`);
  });
  if (opts.length > 6) warn(file, `${where}: nhiều hơn 6 phương án`);
  return keys;
}

// ---------- Question ----------
function checkQuestion(file, q, ctx) {
  const where = `câu ${q?.id ?? '?'}`;
  if (!isObj(q)) return err(file, `${ctx.where}: câu hỏi không phải object`);
  if (!isStr(q.id) || !ID_RE.test(q.id)) err(file, `${where}: id không hợp lệ`);
  if (ctx.ids) { if (ctx.ids.has(q.id)) err(file, `${where}: id trùng`); ctx.ids.add(q.id); }
  if (!Q_TYPES.includes(q.type)) { err(file, `${where}: type lạ "${q.type}"`); return; }
  const allowed = ctx.allowedTypes || (ctx.partType ? [ctx.partType] : null);
  if (allowed && !allowed.includes(q.type)) err(file, `${where}: type "${q.type}" không khớp part (${allowed.join('|')})`);
  if (SUBJECTIVE.includes(q.type) && ctx.exam) {
    if (!Number.isFinite(q.max_points) || q.max_points <= 0) err(file, `${where}: câu chủ quan cần max_points > 0`);
    if (!isStr(q.rubric_id)) err(file, `${where}: câu chủ quan cần rubric_id`);
    else if (ctx.rubrics && !ctx.rubrics.has(q.rubric_id)) err(file, `${where}: rubric_id "${q.rubric_id}" không có trong exam.rubrics`);
  }
  if (ctx.exam) {
    if (!Number.isInteger(q.no)) err(file, `${where}: thiếu "no" (số nguyên)`);
    if (q.is_example === true && q.no !== 0) err(file, `${where}: câu ví dụ phải có no = 0`);
    if (q.is_example !== true && q.no === 0) err(file, `${where}: no = 0 nhưng không đánh is_example`);
    if (q.is_example !== true && ctx.examId && !q.id.startsWith(ctx.examId + '-')) warn(file, `${where}: id nên có dạng ${ctx.examId}-NN`);
  }
  if (!isStr(q.explanation_vi)) err(file, `${where}: explanation_vi rỗng`);
  const listening = ctx.section === 'listening';
  const np = ctx.needPinyin;
  if (listening) { if (q.audio != null || !ctx.groupAudio) checkAudio(file, where, q.audio, { examRepeat: ctx.exam ? ctx.repeat : null }); }
  else if (q.audio != null && ctx.exam) warn(file, `${where}: câu không thuộc phần nghe nhưng có audio`);

  const keysOf = (arr) => (arr || []).map((o) => o?.key);
  const sharedKeys = keysOf(ctx.shared);
  const needShared = () => {
    if (!Array.isArray(ctx.shared) || !ctx.shared.length) { err(file, `${where}: ${q.type} cần group.shared_options`); return false; }
    return true;
  };
  const checkLetter = (keys) => {
    if (typeof q.answer !== 'string' || !keys.includes(q.answer)) err(file, `${where}: answer "${q.answer}" không nằm trong options (${keys.join(',')})`);
  };

  switch (q.type) {
    case 'true_false_image':
      checkImage(file, where, q.image);
      if (listening) { if (q.stem != null) warn(file, `${where}: câu nghe nên có stem: null`); }
      else checkText(file, `${where} stem`, q.stem, { needPinyin: np });
      if (typeof q.answer !== 'boolean') err(file, `${where}: answer phải là boolean`);
      break;
    case 'choose_image': {
      const keys = checkOptions(file, where, q.options, { kind: 'image', needPinyin: np });
      checkLetter(keys);
      break;
    }
    case 'match_image':
    case 'match_sentence':
    case 'fill_blank_wordbank':
      if (needShared()) checkLetter(sharedKeys);
      if (q.type === 'match_image') {
        if (!listening) checkText(file, `${where} stem`, q.stem, { needPinyin: np });
      } else {
        checkText(file, `${where} stem`, q.stem, { needPinyin: np });
        if (q.type === 'fill_blank_wordbank' && q.stem?.zh && !q.stem.zh.includes(BLANK)) err(file, `${where}: stem.zh thiếu chỗ trống "${BLANK}"`);
      }
      if (ctx.usedKeys && typeof q.answer === 'string') {
        if (ctx.usedKeys.has(q.answer)) err(file, `${where}: key "${q.answer}" đã dùng cho câu khác trong group`);
        ctx.usedKeys.add(q.answer);
      }
      break;
    case 'choose_option': {
      const keys = checkOptions(file, where, q.options, { kind: 'text', needPinyin: np });
      if (keys.length < 3 || keys.length > 4) warn(file, `${where}: choose_option nên có 3 (hoặc 4) phương án`);
      checkLetter(keys);
      if (listening) { if (q.question != null) checkText(file, `${where} question`, q.question, { required: false }); }
      else {
        if (q.passage == null && !ctx.groupPassage) err(file, `${where}: câu đọc cần passage (hoặc group.passage)`);
        if (q.passage != null) checkText(file, `${where} passage`, q.passage, { needPinyin: np });
        if (q.question != null) checkText(file, `${where} question`, q.question, { needPinyin: np });
      }
      break;
    }
    case 'true_false_statement':
      checkText(file, `${where} statement`, q.statement, { needPinyin: np });
      if (q.statement?.zh && !q.statement.zh.startsWith('★')) warn(file, `${where}: statement nên bắt đầu bằng "★ "`);
      if (!listening && q.passage == null && !ctx.groupPassage) err(file, `${where}: câu đọc cần passage`);
      if (q.passage != null) checkText(file, `${where} passage`, q.passage, { needPinyin: np });
      if (typeof q.answer !== 'boolean') err(file, `${where}: answer phải là boolean`);
      break;
    case 'reorder_words': {
      if (!Array.isArray(q.words) || q.words.length < 2 || !q.words.every(isStr)) err(file, `${where}: words phải là mảng ≥ 2 chuỗi`);
      if (!isStr(q.answer)) { err(file, `${where}: answer phải là câu chuẩn`); break; }
      const norm = (s) => s.replace(/[\s，。？！、：；“”‘’,.?!:;"'（）()…—]/g, '');
      if (Array.isArray(q.words)) {
        const joined = q.words.join('');
        if ([...norm(joined)].sort().join('') !== [...norm(q.answer)].sort().join('')) err(file, `${where}: các mảnh words không ghép được thành answer`);
        if (q.words.some((w) => /[。？！]$/.test(w))) warn(file, `${where}: words không nên chứa dấu câu cuối`);
      }
      if (!/[。？！]$/.test(q.answer)) warn(file, `${where}: answer nên có dấu câu cuối`);
      if (q.accepted_answers != null && !(Array.isArray(q.accepted_answers) && q.accepted_answers.every(isStr))) err(file, `${where}: accepted_answers phải là mảng chuỗi`);
      if (q.pinyin != null) checkPinyin(file, where, q.pinyin);
      break;
    }
    case 'write_hanzi_from_pinyin':
      checkText(file, `${where} stem`, q.stem, {});
      if (q.stem?.zh && !q.stem.zh.includes(BLANK)) err(file, `${where}: stem.zh thiếu chỗ trống "${BLANK}"`);
      if (!isStr(q.blank_pinyin)) err(file, `${where}: thiếu blank_pinyin`);
      if (!isStr(q.answer) || !hasHan(q.answer)) err(file, `${where}: answer phải là chữ Hán`);
      else if (ctx.level === 3 && [...q.answer.trim()].length !== 1) err(file, `${where}: HSK3 answer phải đúng 1 chữ Hán`);
      break;
    case 'write_sentence':
      if (!isStr(q.prompt_vi)) err(file, `${where}: thiếu prompt_vi`);
      checkText(file, `${where} keyword`, q.keyword, {});
      if (q.image != null) checkImage(file, where, q.image);
      if (!Number.isInteger(q.min_chars) || q.min_chars < 1) err(file, `${where}: min_chars phải là số nguyên ≥ 1`);
      if (!Array.isArray(q.sample_answers) || !q.sample_answers.length) err(file, `${where}: sample_answers rỗng`);
      else if (q.keyword?.zh && !q.sample_answers.every((s) => s.includes(q.keyword.zh))) warn(file, `${where}: có sample_answer không chứa keyword`);
      if (q.answer !== null) err(file, `${where}: answer phải là null`);
      break;
    case 'choose_reply':
    case 'cloze_option': {
      const keys = checkOptions(file, where, q.options, { kind: 'text', needPinyin: np });
      checkLetter(keys);
      if (q.type === 'cloze_option') checkBlankNo(file, where, q, ctx);
      break;
    }
    case 'choose_component':
    case 'cloze_sentence':
    case 'order_position':
      if (needShared()) checkLetter(sharedKeys);
      if (ctx.usedKeys && typeof q.answer === 'string') {
        if (ctx.usedKeys.has(q.answer)) err(file, `${where}: key "${q.answer}" đã dùng cho câu khác trong group`);
        ctx.usedKeys.add(q.answer);
      }
      if (q.type === 'choose_component') {
        checkText(file, `${where} word`, q.word, { needPinyin: np });
        if (typeof q.target_char !== 'string' || [...q.target_char].length !== 1) err(file, `${where}: target_char phải là 1 chữ`);
        if (!Number.isInteger(q.target_index) || (q.word?.zh && [...q.word.zh][q.target_index] !== q.target_char)) err(file, `${where}: target_index không trỏ đúng target_char trong word.zh`);
        if (!isStr(q.shown_part)) err(file, `${where}: thiếu shown_part`);
        if (!['left-right', 'top-bottom', 'enclosure', 'other'].includes(q.layout)) err(file, `${where}: layout phải là left-right|top-bottom|enclosure|other`);
      }
      if (q.type === 'cloze_sentence') checkBlankNo(file, where, q, ctx);
      if (q.type === 'order_position' && !Number.isInteger(q.position)) err(file, `${where}: order_position cần position (số nguyên)`);
      break;
    case 'short_answer':
      if (q.question != null) checkText(file, `${where} question`, q.question, {});
      else err(file, `${where}: short_answer cần question`);
      if (!isStr(q.answer)) err(file, `${where}: short_answer cần answer (chuỗi)`);
      if (q.accepted_answers != null && !(Array.isArray(q.accepted_answers) && q.accepted_answers.every(isStr))) err(file, `${where}: accepted_answers phải là mảng chuỗi`);
      if (!listening && !ctx.groupPassage && !q.passage && ctx.exam) warn(file, `${where}: short_answer đọc nên có group.passage`);
      break;
    case 'picture_story_writing':
      if (!Array.isArray(q.images) || q.images.length < 3) err(file, `${where}: picture_story_writing cần ≥ 3 images`);
      else q.images.forEach((im, i) => checkImage(file, `${where} images[${i}]`, im));
      checkOpenCommon(file, where, q);
      break;
    case 'chart_description': {
      const c = q.chart;
      if (!isObj(c)) err(file, `${where}: thiếu chart`);
      else {
        if (!['bar', 'line', 'pie', 'table'].includes(c.kind)) err(file, `${where}: chart.kind phải là bar|line|pie|table`);
        if (!Array.isArray(c.labels) || !c.labels.length) err(file, `${where}: chart.labels rỗng`);
        if (!Array.isArray(c.series) || !c.series.length) err(file, `${where}: chart.series rỗng`);
        else c.series.forEach((sr, i) => { if (!Array.isArray(sr.values) || sr.values.length !== c.labels?.length || !sr.values.every((v) => typeof v === 'number')) err(file, `${where}: chart.series[${i}].values phải là ${c.labels?.length} số`); });
      }
      checkOpenCommon(file, where, q);
      break;
    }
    case 'translate_written':
    case 'translate_oral':
      if (!isObj(q.source) || !isStr(q.source.text)) err(file, `${where}: thiếu source.text`);
      else if (!isStr(q.source.lang)) err(file, `${where}: thiếu source.lang`);
      if (!isStr(q.reference_zh)) err(file, `${where}: thiếu reference_zh`);
      if (q.answer !== null) err(file, `${where}: answer phải là null`);
      if (q.type === 'translate_oral' && (!Number.isInteger(q.answer_seconds))) warn(file, `${where}: translate_oral nên có prep_seconds/answer_seconds`);
      break;
    case 'order_sentences': {
      const keys = checkOptions(file, where, q.sentences, { kind: 'text' });
      if (typeof q.answer !== 'string' || [...q.answer].sort().join('') !== [...keys].sort().join('')) err(file, `${where}: answer phải là hoán vị của ${keys.join('')}`);
      break;
    }
    case 'write_essay':
      if (q.keywords != null && !Array.isArray(q.keywords)) err(file, `${where}: keywords phải là mảng`);
      if (q.genre != null && !['narrative', 'practical', 'argumentative', 'descriptive'].includes(q.genre)) err(file, `${where}: genre không hợp lệ`);
      checkOpenCommon(file, where, q);
      break;
  }
}

function checkOpenCommon(file, where, q) {
  if (!isStr(q.prompt_vi) && !isObj(q.prompt) && !isStr(q.prompt_zh)) err(file, `${where}: cần prompt (Text) hoặc prompt_vi`);
  if (q.prompt != null && isObj(q.prompt)) checkText(file, `${where} prompt`, q.prompt, {});
  if (!Number.isInteger(q.min_chars) || q.min_chars < 1) err(file, `${where}: min_chars phải là số nguyên ≥ 1`);
  if (!Array.isArray(q.sample_answers) || !q.sample_answers.length) err(file, `${where}: sample_answers rỗng`);
  if (q.answer !== null) err(file, `${where}: answer phải là null`);
}

function checkBlankNo(file, where, q, ctx) {
  const n = q.blank_no ?? q.no;
  if (!Number.isInteger(n)) return err(file, `${where}: cần blank_no`);
  const p = ctx.groupPassage?.zh || q.passage?.zh || '';
  if (!p.includes(`（${n}）`)) err(file, `${where}: group.passage không chứa chỗ trống "（${n}）"`);
}

// ---------- Exam ----------
function checkExam(rel, meta, level) {
  const ex = loadJSON(rel, rel, true);
  if (!ex) return;
  const f = rel;
  const L = String(level);
  if (ex.id !== meta.id) err(f, `id "${ex.id}" khác manifest "${meta.id}"`);
  if (String(ex.level) !== L) err(f, `level ${ex.level} khác manifest ${level}`);
  for (const k of ['title_vi', 'standard']) if (!isStr(ex[k])) err(f, `thiếu ${k}`);
  if (ex.standard && ex.standard !== 'HSK3.0') warn(f, `standard nên là "HSK3.0" (đang "${ex.standard}")`);
  if (!Number.isInteger(ex.duration_minutes)) err(f, 'duration_minutes phải là số nguyên');
  if (typeof ex.show_pinyin !== 'boolean') err(f, 'show_pinyin phải là boolean');
  const st = ex.test === true ? null : STRUCTURE[L];
  if (ex.test === true) warn(f, 'đề kiểm thử (test: true) — bỏ qua kiểm tra cấu trúc Phụ lục A.2');
  const bands = ex.score_mode === 'bands';
  if (ex.score_mode != null && !['pass', 'bands'].includes(ex.score_mode)) err(f, 'score_mode phải là "pass" hoặc "bands"');
  if (STRUCTURE[L]?.bands && !bands) err(f, 'đề 7-9 phải có score_mode: "bands"');
  if (bands) {
    const br = ex.band_rules;
    if (!isObj(br) || !Array.isArray(br.bands) || !br.bands.length) err(f, 'score_mode bands cần band_rules.bands');
    else {
      if (br.official !== false) warn(f, 'band_rules.official nên là false (ngưỡng ước lượng)');
      br.bands.forEach((b, i) => { if (typeof b.min !== 'number' || !isStr(b.label_vi)) err(f, `band_rules.bands[${i}] cần min (số) + label_vi`); });
    }
  } else {
    for (const k of ['total_score', 'pass_score']) if (!Number.isInteger(ex[k])) err(f, `${k} phải là số nguyên`);
    if (st && st.total != null) {
      if (ex.total_score !== st.total) err(f, `total_score phải là ${st.total}`);
      if (ex.pass_score !== st.pass) err(f, `pass_score phải là ${st.pass}`);
    }
  }
  if (st && ex.show_pinyin !== st.pinyin) warn(f, `show_pinyin nên là ${st.pinyin}`);
  if (ex.speaking_paper != null && !isStr(ex.speaking_paper)) err(f, 'speaking_paper phải là chuỗi hoặc null');
  if (isStr(ex.speaking_paper)) refs.speakingPapers.push({ file: f, id: ex.speaking_paper });
  const rubrics = new Map();
  if (ex.rubrics != null) {
    if (!Array.isArray(ex.rubrics)) err(f, 'rubrics phải là mảng');
    else ex.rubrics.forEach((r) => { checkRubric(f, r); if (r?.id) rubrics.set(r.id, r); });
  }
  const repeat = Number.isInteger(ex.repeat_default) ? ex.repeat_default : (st ? (['1', '2', '3'].includes(L) ? 2 : 1) : null);
  if (!Array.isArray(ex.sections) || !ex.sections.length) return err(f, 'sections rỗng');
  let lastIdx = -1; let expectNo = 1; const ids = new Set();
  let maxSum = 0;
  for (const sec of ex.sections) {
    const sw = `section ${sec?.id}`;
    const idx = SECTION_ORDER.indexOf(sec?.id);
    if (idx === -1) err(f, `${sw}: id phải là ${SECTION_ORDER.join('|')}`);
    else { if (idx <= lastIdx) err(f, `${sw}: sai thứ tự (${SECTION_ORDER.join(' → ')})`); lastIdx = idx; }
    if (!isStr(sec.name_vi)) err(f, `${sw}: thiếu name_vi`);
    if (!Number.isInteger(sec.max_score)) err(f, `${sw}: max_score phải là số nguyên`); else maxSum += sec.max_score;
    if (!Array.isArray(sec.parts) || !sec.parts.length) { err(f, `${sw}: parts rỗng`); continue; }
    const expParts = st?.sections?.[sec.id];
    if (st && !expParts) err(f, `${sw}: HSK ${L} không có phần này trong file đề`);
    if (expParts && expParts.length !== sec.parts.length) err(f, `${sw}: cần ${expParts.length} part, đang có ${sec.parts.length}`);
    sec.parts.forEach((part, pi) => {
      const pw = `${sw} part ${part?.code}`;
      if (!isStr(part.code)) err(f, `${pw}: thiếu code`);
      if (!Q_TYPES.includes(part.type)) err(f, `${pw}: type lạ "${part.type}"`);
      if (!isStr(part.instruction_vi)) err(f, `${pw}: thiếu instruction_vi`);
      const exp = expParts?.[pi];
      const expTypes = exp ? [].concat(exp[1]) : null;
      if (exp) {
        if (part.code !== exp[0]) err(f, `${pw}: code phải là ${exp[0]}`);
        if (!expTypes.includes(part.type)) err(f, `${pw}: type phải là ${expTypes.join(' hoặc ')}`);
        if (part.expected_count !== exp[2]) err(f, `${pw}: expected_count phải là ${exp[2]}`);
      }
      const allowedTypes = expTypes && expTypes.length > 1 ? expTypes : (part.type === 'choose_option' && L === '7-9' ? ['choose_option', 'short_answer'] : [part.type]);
      if (!Array.isArray(part.groups) || !part.groups.length) { err(f, `${pw}: groups rỗng`); return; }
      let count = 0; const answers = [];
      for (const g of part.groups) {
        if (!isStr(g?.id)) err(f, `${pw}: group thiếu id`);
        const shared = g.shared_options;
        if (SHARED_TYPES.includes(part.type)) {
          checkOptions(f, `${pw} group ${g.id} shared_options`, shared, { kind: part.type === 'match_image' ? 'image' : 'text', needPinyin: st?.pinyin && part.type !== 'match_image' });
        } else if (shared != null) warn(f, `${pw} group ${g.id}: shared_options nên là null`);
        if (g.passage != null) checkText(f, `${pw} group ${g.id} passage`, g.passage, { needPinyin: !!st?.pinyin });
        if (g.audio != null) checkAudio(f, `${pw} group ${g.id}`, g.audio, { examRepeat: repeat });
        if (['cloze_option', 'cloze_sentence'].includes(part.type) && !g.passage) err(f, `${pw} group ${g.id}: ${part.type} cần group.passage`);
        if (!Array.isArray(g.questions) || !g.questions.length) { err(f, `${pw} group ${g.id}: questions rỗng`); continue; }
        const usedKeys = new Set();
        for (const q of g.questions) {
          checkQuestion(f, q, { exam: true, examId: ex.id, ids, section: sec.id, partType: part.type, allowedTypes, shared, usedKeys, needPinyin: !!st?.pinyin, level: L, groupPassage: g.passage, groupAudio: g.audio, rubrics, repeat, where: pw });
          if (q?.is_example === true) continue;
          count++;
          answers.push(q?.answer);
          if (q?.no !== expectNo) err(f, `câu ${q?.id}: no = ${q?.no}, mong đợi ${expectNo} (phải liên tục)`);
          expectNo = (Number.isInteger(q?.no) ? q.no : expectNo) + 1;
        }
      }
      if (count !== part.expected_count) err(f, `${pw}: có ${count} câu, expected_count = ${part.expected_count}`);
      if (count >= 5) {
        const objective = answers.filter((a) => a != null);
        if (objective.length && objective.every((a) => typeof a === 'boolean')) {
          if (!objective.includes(true) || !objective.includes(false)) warn(f, `${pw}: đúng/sai nên có cả đúng và sai`);
        } else if (!SHARED_TYPES.includes(part.type)) {
          const freq = {};
          objective.forEach((a) => { if (typeof a === 'string' && a.length === 1) freq[a] = (freq[a] || 0) + 1; });
          for (const [k, n] of Object.entries(freq)) if (n / count > 0.4) warn(f, `${pw}: đáp án "${k}" chiếm ${Math.round(100 * n / count)}% (> 40%)`);
        }
      }
    });
  }
  if (!bands && Number.isInteger(ex.total_score) && maxSum !== ex.total_score) err(f, `tổng max_score các phần (${maxSum}) ≠ total_score (${ex.total_score})`);
}

function checkRubric(f, r) {
  if (!isStr(r?.id)) return err(f, 'rubric thiếu id');
  if (!Number.isInteger(r.max_score)) err(f, `rubric ${r.id}: max_score phải là số nguyên`);
  if (!Array.isArray(r.criteria) || !r.criteria.length) return err(f, `rubric ${r.id}: criteria rỗng`);
  let sum = 0;
  r.criteria.forEach((c) => { if (!isStr(c.key) || !isStr(c.name_vi)) err(f, `rubric ${r.id}: criterion thiếu key/name_vi`); sum += Number(c.weight) || 0; });
  if (Math.abs(sum - 1) > 0.001) err(f, `rubric ${r.id}: tổng weight = ${sum} (phải = 1)`);
}

// ---------- Vocab ----------
const VOCAB_TARGET = { 1: 500, 2: 772, 3: 973, 4: 1000, 5: 1071, 6: 1140, '7-9': 5636 };
function checkVocab(rel, level, seenHanzi) {
  const v = loadJSON(rel, rel, true);
  if (!v) return;
  const f = rel;
  const L = String(level);
  if (String(v.level) !== L) err(f, `level ${v.level} khác manifest ${level}`);
  if (!Array.isArray(v.words)) return err(f, 'words phải là mảng');
  if (v.count !== v.words.length) err(f, `count = ${v.count} nhưng có ${v.words.length} từ`);
  if (v.target_count != null) {
    if (!Number.isInteger(v.target_count)) err(f, 'target_count phải là số nguyên');
    if (typeof v.complete === 'boolean' && v.complete !== (v.words.length >= v.target_count)) err(f, `complete = ${v.complete} không khớp (count ${v.words.length} / target ${v.target_count})`);
    if (VOCAB_TARGET[L] && v.target_count !== VOCAB_TARGET[L]) warn(f, `target_count nên là ${VOCAB_TARGET[L]} (đã chốt)`);
  } else warn(f, 'thiếu target_count');
  const ids = new Set(); let withEx = 0;
  const re = new RegExp(`^hsk${L.replace('-', '\\-')}-\\d{4}$`);
  v.words.forEach((w, i) => {
    const where = `từ #${i + 1} (${w?.hanzi ?? '?'})`;
    if (!isObj(w)) return err(f, `${where}: không phải object`);
    if (!isStr(w.id) || !re.test(w.id)) err(f, `${where}: id "${w.id}" phải dạng hsk${L}-0001`);
    if (ids.has(w.id)) err(f, `${where}: id trùng ${w.id}`); ids.add(w.id);
    if (!isStr(w.hanzi) || !hasHan(w.hanzi)) err(f, `${where}: thiếu hanzi`);
    if (!isStr(w.pinyin)) err(f, `${where}: thiếu pinyin`); else checkPinyin(f, where, w.pinyin);
    if (!isStr(w.meaning_vi)) err(f, `${where}: thiếu meaning_vi`);
    if (!isStr(w.pos)) err(f, `${where}: thiếu pos`);
    else w.pos.split(', ').forEach((p) => { if (!POS.includes(p)) err(f, `${where}: pos lạ "${p}"`); });
    if (w.example != null) {
      withEx++;
      checkText(f, `${where} example`, w.example, { needPinyin: true });
      if (!isStr(w.example?.vi)) err(f, `${where}: example thiếu vi`);
    }
    if (seenHanzi && w.hanzi) {
      const k = `${w.hanzi}|${w.pinyin}`;
      if (seenHanzi.has(k) && seenHanzi.get(k) !== L) warn(f, `${where}: từ đã có ở cấp ${seenHanzi.get(k)}`);
      else if (seenHanzi.has(k)) warn(f, `${where}: từ lặp trong file`);
      else seenHanzi.set(k, L);
    }
  });
  if (v.words.length && withEx / v.words.length < 0.5) warn(f, `chỉ ${Math.round(100 * withEx / v.words.length)}% từ có example (yêu cầu ≥ 50%)`);
  return v;
}

// ---------- Speaking ----------
function checkTopics(rel) {
  const d = loadJSON(rel, rel, true); if (!d) return;
  const f = rel;
  if (!Array.isArray(d.topics)) return err(f, 'topics phải là mảng');
  const ids = new Set(); const perLevel = {};
  d.topics.forEach((t, i) => {
    const where = `topic ${t?.id ?? '#' + i}`;
    if (!isStr(t.id) || !ID_RE.test(t.id)) err(f, `${where}: id không hợp lệ`);
    if (ids.has(t.id)) err(f, `${where}: id trùng`); ids.add(t.id);
    if (!isLevel(t.level)) err(f, `${where}: level phải là 1–6 hoặc "7-9"`);
    perLevel[String(t.level)] = (perLevel[String(t.level)] || 0) + 1;
    for (const k of ['title_vi', 'title_zh', 'scenario_vi', 'ai_role_zh']) if (!isStr(t[k])) err(f, `${where}: thiếu ${k}`);
    if (!Array.isArray(t.goals_vi) || !t.goals_vi.length) err(f, `${where}: goals_vi rỗng`);
    checkText(f, `${where} starter`, t.starter, { needPinyin: true });
    if (!Array.isArray(t.key_vocab) || t.key_vocab.length < 4 || t.key_vocab.length > 10) err(f, `${where}: key_vocab cần 4–10 mục`);
    else t.key_vocab.forEach((k, j) => { if (!isStr(k?.hanzi) || !isStr(k?.pinyin) || !isStr(k?.vi)) err(f, `${where}: key_vocab[${j}] thiếu hanzi/pinyin/vi`); });
    if (t.max_turns != null && !Number.isInteger(t.max_turns)) err(f, `${where}: max_turns phải là số nguyên`);
  });
  for (const l of LEVEL_KEYS) if ((perLevel[l] || 0) < 6) warn(f, `level ${l} có ${perLevel[l] || 0} chủ đề (cần ≥ 6)`);
}

function checkHskk(rel) {
  const d = loadJSON(rel, rel, true); if (!d) return;
  const f = rel;
  const rubrics = new Map();
  if (!Array.isArray(d.rubrics)) err(f, 'rubrics phải là mảng');
  else d.rubrics.forEach((r) => { checkRubric(f, r); if (r?.id) rubrics.set(r.id, r); });
  const parts = new Map();
  const HSKK_LEVELS = ['so', 'trung', 'cao', ...LEVEL_KEYS];
  if (!Array.isArray(d.levels)) err(f, 'levels phải là mảng');
  else d.levels.forEach((lv) => {
    if (!HSKK_LEVELS.includes(String(lv?.level))) err(f, `level lạ "${lv?.level}"`);
    if (!isStr(lv.name_vi)) err(f, `level ${lv.level}: thiếu name_vi`);
    (lv.parts || []).forEach((p) => {
      if (parts.has(p.code)) err(f, `part ${p.code}: trùng code`);
      parts.set(p.code, { ...p, level: String(lv.level) });
      if (!HSKK_TYPES.includes(p.type)) err(f, `part ${p.code}: type lạ "${p.type}"`);
      if (!rubrics.has(p.rubric_id)) err(f, `part ${p.code}: rubric_id "${p.rubric_id}" không tồn tại`);
      if (!Number.isInteger(p.prep_seconds) || !Number.isInteger(p.answer_seconds)) err(f, `part ${p.code}: prep_seconds/answer_seconds phải là số nguyên`);
      if (!isStr(p.name_vi) || !isStr(p.instruction_vi)) err(f, `part ${p.code}: thiếu name_vi/instruction_vi`);
    });
  });
  const ids = new Set(); const perLevel = {}; const perPart = {};
  (d.items || []).forEach((it) => {
    const where = `item ${it?.id}`;
    if (!isStr(it.id) || ids.has(it.id)) err(f, `${where}: id thiếu/trùng`); ids.add(it.id);
    const p = parts.get(it.part);
    if (!p) err(f, `${where}: part "${it.part}" không có trong levels`);
    else {
      if (p.level !== String(it.level)) err(f, `${where}: level khác part`);
      if (p.type !== it.type) err(f, `${where}: type khác part`);
    }
    perLevel[String(it.level)] = (perLevel[String(it.level)] || 0) + 1;
    perPart[it.part] = (perPart[it.part] || 0) + 1;
    if (!HSKK_TYPES.includes(it.type)) err(f, `${where}: type lạ`);
    checkText(f, `${where} prompt`, it.prompt, {});
    if (['repeat', 'listen_answer', 'retell'].includes(it.type)) checkAudio(f, where, it.audio);
    else if (it.audio != null) checkAudio(f, where, it.audio);
    if (it.type === 'describe_picture') checkImage(f, where, it.image);
    if (it.type === 'picture_story') {
      if (!Array.isArray(it.images) || it.images.length < 3) err(f, `${where}: picture_story cần 3–4 images`);
      else it.images.forEach((im, i) => checkImage(f, `${where} images[${i}]`, im));
    }
    if (it.sample_answer != null) checkText(f, `${where} sample_answer`, it.sample_answer, {});
    else err(f, `${where}: thiếu sample_answer`);
    if (!Array.isArray(it.keywords) || it.keywords.length < 2 || it.keywords.length > 8) warn(f, `${where}: keywords nên có 2–8 từ`);
    if (it.rubric_id && !rubrics.has(it.rubric_id)) err(f, `${where}: rubric_id không tồn tại`);
  });
  const paperIds = new Set();
  if (d.papers != null && !Array.isArray(d.papers)) err(f, 'papers phải là mảng');
  (d.papers || []).forEach((pp) => {
    const where = `paper ${pp?.id}`;
    if (!isStr(pp.id) || paperIds.has(pp.id)) err(f, `${where}: id thiếu/trùng`); paperIds.add(pp.id);
    if (!isLevel(pp.level)) err(f, `${where}: level phải là 3–6 hoặc "7-9"`);
    if (!isStr(pp.title_vi)) err(f, `${where}: thiếu title_vi`);
    if (!Array.isArray(pp.item_ids) || !pp.item_ids.length) err(f, `${where}: item_ids rỗng`);
    else pp.item_ids.forEach((id) => { if (!ids.has(id)) err(f, `${where}: item "${id}" không tồn tại`); });
  });
  for (const r of refs.speakingPapers) if (!paperIds.has(r.id)) warn(r.file, `speaking_paper "${r.id}" chưa có trong ${rel}`);
  for (const l of ['3', '4', '5', '6', '7-9']) if (!(d.papers || []).some((pp) => String(pp.level) === l)) warn(f, `chưa có paper đề nói cho level ${l}`);
  for (const [code] of parts) if ((perPart[code] || 0) < 2 && !/^hsk(4|5|6)-2$|^hsk7-9-(1|3)$/.test(code)) warn(f, `part ${code} có ${perPart[code] || 0} item (khuyến nghị ≥ 2)`);
}

function checkShadowing(rel) {
  const d = loadJSON(rel, rel, true); if (!d) return;
  const f = rel;
  if (!Array.isArray(d.items)) return err(f, 'items phải là mảng');
  let tts = 0; const ids = new Set();
  d.items.forEach((it) => {
    const where = `item ${it?.id}`;
    if (!isStr(it.id) || ids.has(it.id)) err(f, `${where}: id thiếu/trùng`); ids.add(it.id);
    if (!isStr(it.title)) err(f, `${where}: thiếu title`);
    if (!['tts', 'youtube'].includes(it.source)) err(f, `${where}: source phải là tts|youtube`);
    if (it.source === 'youtube') {
      if (!isObj(it.youtube)) err(f, `${where}: thiếu youtube`);
      else {
        if (!/^[A-Za-z0-9_-]{11}$/.test(it.youtube.videoId || '')) err(f, `${where}: videoId phải 11 ký tự`);
        if (typeof it.youtube.verified !== 'boolean') err(f, `${where}: youtube.verified phải là boolean`);
      }
    } else if (it.youtube != null) err(f, `${where}: tts phải có youtube: null`);
    if (!Array.isArray(it.segments)) return err(f, `${where}: segments phải là mảng`);
    if (!it.segments.length) {
      if (it.source === 'youtube' && it.auto_segments === true) return; // web tạo câu bằng AI (A.7)
      return err(f, `${where}: segments rỗng (YouTube chưa có mốc thời gian thì đặt auto_segments: true)`);
    }
    it.segments.forEach((s, i) => {
      const sw = `${where} seg[${i}]`;
      if (!isStr(s.hanzi) || !isStr(s.pinyin) || !isStr(s.vi)) err(f, `${sw}: thiếu hanzi/pinyin/vi`);
      if (it.source === 'youtube') {
        if (typeof s.start !== 'number' || typeof s.end !== 'number' || !(s.end > s.start)) err(f, `${sw}: start/end phải là số, end > start`);
      } else {
        tts++;
        if (s.start != null || s.end != null) warn(f, `${sw}: tts nên có start/end = null`);
        if (s.speaker != null && !['男', '女'].includes(s.speaker)) err(f, `${sw}: speaker phải là 男/女`);
      }
    });
  });
  if (tts < 15) warn(f, `chỉ có ${tts} segment TTS (cần ≥ 15)`);
}

function checkCharacters(rel, level, vocabHanzi, seenChars) {
  const d = loadJSON(rel, rel, true); if (!d) return;
  const f = rel;
  const L = String(level ?? '');
  if (!Array.isArray(d.characters)) return err(f, 'characters phải là mảng');
  if (level != null) {
    if (d.level != null && String(d.level) !== L) err(f, `level ${d.level} khác manifest ${L}`);
    if (d.count != null && d.count !== d.characters.length) err(f, `count = ${d.count} nhưng có ${d.characters.length} chữ`);
    if (Number.isInteger(d.target_count) && typeof d.complete === 'boolean' && d.complete !== (d.characters.length >= d.target_count)) err(f, 'complete không khớp count/target_count');
  }
  const seen = new Set();
  d.characters.forEach((c, i) => {
    const where = `chữ #${i + 1} (${c?.hanzi})`;
    if (typeof c.hanzi !== 'string' || [...c.hanzi].length !== 1 || !hasHan(c.hanzi)) err(f, `${where}: hanzi phải đúng 1 chữ Hán`);
    if (seen.has(c.hanzi)) err(f, `${where}: trùng trong file`); seen.add(c.hanzi);
    if (seenChars) { if (seenChars.has(c.hanzi)) err(f, `${where}: đã có ở ${seenChars.get(c.hanzi)}`); else seenChars.set(c.hanzi, f); }
    if (!isStr(c.pinyin) || !isStr(c.meaning_vi) || !isStr(c.radical)) err(f, `${where}: thiếu pinyin/meaning_vi/radical`);
    if (!Number.isInteger(c.strokes) || c.strokes < 1) err(f, `${where}: strokes phải là số nguyên ≥ 1`);
    if (!isLevel(c.level)) err(f, `${where}: level không hợp lệ`);
    else if (level != null && String(c.level) !== L) warn(f, `${where}: level ${c.level} khác cấp của file (${L})`);
  });
  if (L === '1' && vocabHanzi?.['1']) {
    const missing = [...vocabHanzi['1']].filter((ch) => !seen.has(ch));
    if (missing.length) warn(f, `thiếu ${missing.length} chữ của từ vựng HSK1: ${missing.slice(0, 30).join('')}${missing.length > 30 ? '…' : ''}`);
  }
}

const PRACTICE_TYPES = ['reorder_words', 'write_hanzi_from_pinyin', 'choose_component', 'write_sentence', 'write_essay', 'picture_story_writing', 'chart_description', 'translate_written'];
function checkPractice(rel, level) {
  const d = loadJSON(rel, rel, true); if (!d) return;
  const f = rel;
  if (!Array.isArray(d.sets)) return err(f, 'sets phải là mảng');
  const ids = new Set();
  d.sets.forEach((s) => {
    const where = `set ${s?.id}`;
    if (!isStr(s.id) || ids.has(s.id)) err(f, `${where}: id thiếu/trùng`); ids.add(s.id);
    if (!PRACTICE_TYPES.includes(s.type)) err(f, `${where}: type không hợp lệ "${s.type}"`);
    if (!isLevel(s.level)) err(f, `${where}: thiếu/sai level`);
    else if (level != null && String(s.level) !== String(level)) warn(f, `${where}: level ${s.level} khác cấp của file`);
    if (!isStr(s.title_vi)) err(f, `${where}: thiếu title_vi`);
    if (!Array.isArray(s.questions) || !s.questions.length) return err(f, `${where}: questions rỗng`);
    const usedKeys = s.type === 'choose_component' ? new Set() : null;
    s.questions.forEach((q) => checkQuestion(f, q, { exam: false, ids, section: 'writing', partType: s.type, level: String(s.level), shared: s.shared_options || q.options, where }));
    void usedKeys;
  });
}

function checkRadicals(rel) {
  const d = loadJSON(rel, rel, true); if (!d) return;
  const f = rel;
  if (!Array.isArray(d.radicals) || !d.radicals.length) return err(f, 'radicals rỗng');
  const set = new Set();
  d.radicals.forEach((r, i) => {
    const w = `bộ #${i + 1} (${r?.radical})`;
    if (!isStr(r.radical)) err(f, `${w}: thiếu radical`);
    if (set.has(r.radical)) err(f, `${w}: trùng`); set.add(r.radical);
    if (!Number.isInteger(r.strokes)) err(f, `${w}: strokes phải là số nguyên`);
    if (!isStr(r.meaning_vi)) warn(f, `${w}: thiếu meaning_vi`);
    if (r.variants != null && !Array.isArray(r.variants)) err(f, `${w}: variants phải là mảng`);
  });
  for (const [k, v] of Object.entries(d.variant_to_radical || {})) if (!set.has(v)) err(f, `variant_to_radical["${k}"] = "${v}" không có trong radicals`);
  for (const [k, v] of Object.entries(d.char_radical_override || {})) if (!set.has(v)) err(f, `char_radical_override["${k}"] = "${v}" không có trong radicals`);
}

// ---------- Main ----------
console.log(`Kiểm tra dữ liệu: ${DATA_DIR}`);
const idx = loadJSON('index.json');
if (idx) {
  if (idx.schema_version !== 1) err('index.json', 'schema_version phải là 1');
  if (!Array.isArray(idx.levels) || !idx.levels.length) err('index.json', 'levels rỗng');
  const seenHanzi = new Map();
  const seenChars = new Map();
  const vocabHanzi = {};
  const examIds = new Set();
  const checkPath = (p, what) => { if (typeof p === 'string' && (p.startsWith('/') || p.startsWith('data/') || /^[a-z]+:/i.test(p))) err('index.json', `${what}: đường dẫn phải tương đối so với data/ ("${p}")`); };
  for (const lv of idx.levels || []) {
    if (!isObj(lv)) { err('index.json', 'phần tử levels không phải object'); continue; }
    const L = String(lv.level);
    if (!isLevel(lv.level)) err('index.json', `level không hợp lệ: ${lv.level} (1–6 hoặc "7-9")`);
    if (!isStr(lv.name_vi)) err('index.json', `level ${L}: thiếu name_vi`);
    if (isStr(lv.vocab)) {
      checkPath(lv.vocab, `level ${L} vocab`);
      const v = checkVocab(lv.vocab, lv.level, seenHanzi);
      if (v?.words) vocabHanzi[L] = new Set(v.words.flatMap((w) => [...(w.hanzi || '')].filter((ch) => hasHan(ch))));
    } else err('index.json', `level ${L}: thiếu vocab`);
    if (lv.characters != null) { checkPath(lv.characters, `level ${L} characters`); checkCharacters(lv.characters, lv.level, vocabHanzi, seenChars); }
    else if (!idx.writing?.characters) warn('index.json', `level ${L}: thiếu characters`);
    if (lv.practice != null) { checkPath(lv.practice, `level ${L} practice`); checkPractice(lv.practice, lv.level); }
    if (!Array.isArray(lv.exams)) err('index.json', `level ${L}: exams phải là mảng`);
    for (const ex of lv.exams || []) {
      if (!isStr(ex.id) || !isStr(ex.file) || !isStr(ex.title_vi)) { err('index.json', `level ${L}: exam thiếu id/file/title_vi`); continue; }
      if (examIds.has(ex.id)) err('index.json', `exam id trùng ${ex.id}`); examIds.add(ex.id);
      checkPath(ex.file, `exam ${ex.id}`);
      checkExam(ex.file, ex, lv.level);
    }
  }
  if (idx.radicals) checkRadicals(idx.radicals);
  const sp = idx.speaking || {};
  if (sp.topics) checkTopics(sp.topics); else warn('index.json', 'thiếu speaking.topics');
  if (sp.hskk) checkHskk(sp.hskk); else warn('index.json', 'thiếu speaking.hskk');
  if (sp.shadowing) checkShadowing(sp.shadowing); else warn('index.json', 'thiếu speaking.shadowing');
  // tương thích manifest cũ (writing dùng chung)
  if (idx.writing?.characters) checkCharacters(idx.writing.characters, null, vocabHanzi, null);
  if (idx.writing?.practice) checkPractice(idx.writing.practice, null);
  if (refs.missing.length) console.log(`  ℹ ${refs.missing.length} file trong manifest chưa có (web sẽ hiện "Đang soạn").`);
}

for (const w of warnings) console.log(`  ⚠ ${w}`);
for (const e of errors) console.log(`  ✗ ${e}`);
console.log(`\nKết quả: ${errors.length} lỗi, ${warnings.length} cảnh báo.`);
process.exit(errors.length ? 1 : 0);
