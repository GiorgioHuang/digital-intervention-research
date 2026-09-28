import { useMemo, useRef, useState } from 'react';
import { Modal } from '../Modal.js';
import { preferenceStore } from '../../device-mode.js';
import {
  applyHint,
  failed,
  findFlame,
  findHint,
  generateLevel,
  MAX_HINTS,
  newPlay,
  solved,
  starsFor,
  STARTING_HINTS,
  tap,
  HEARTS,
  type Hint,
  type Play,
  type Square,
} from '../../flame-puzzle.js';

/**
 * The flame puzzle, reached from the exercises.
 *
 * Asked for by the owner (2026-09-28) with every feature of the first
 * version kept: levels, the flame count, three hearts, hints, "find a
 * flame", pencil marks, a level list, sound and a Chinese/English switch,
 * plus a way to share it. Drawn in the Classical palette of this workspace
 * rather than the red-and-gold palace of the original.
 *
 * What is remembered — the furthest level, stars and hints left — goes to
 * `preferenceStore()`, so on a shared device it is gone when the tab
 * closes, like every other preference. Nothing from it reaches the study.
 */

type Lang = 'en' | 'zh';

const WORDS = {
  en: {
    back: '‹ All exercises',
    title: 'Flame puzzle',
    level: (n: number, size: number) => `Level ${n} · ${size} × ${size}`,
    flames: (found: number, size: number) => `${found} of ${size} flames lit`,
    hearts: (h: number) => `${h} of ${HEARTS} hearts left`,
    rules: [
      'One flame in each colour.',
      'One flame in each row and each column.',
      'No two flames touch, not even at the corners.',
    ],
    mark: 'Mark squares',
    markOn: 'Marking: on',
    hint: (n: number) => `Hint (${n} left)`,
    find: (n: number) => `Find a flame (${n} left)`,
    levels: 'Levels',
    howTo: 'How to play',
    share: 'Share',
    soundOn: 'Sound: on',
    soundOff: 'Sound: off',
    otherLang: '中文',
    square: (r: number, c: number, what: string) => `Row ${r}, column ${c}: ${what}`,
    squareIs: { '': 'empty', flame: 'flame', 'ruled-out': 'crossed out', wrong: 'no flame here', mark: 'your mark' } as Record<Square, string>,
    say: {
      start: 'Tap a square to place a flame.',
      flame: 'A flame. The squares it rules out are crossed out.',
      wrong: 'No flame there. That cost a heart.',
      marked: 'Marked. Tap it again to erase it.',
      unmarked: 'Mark erased.',
      protected: 'You marked this square. Turn on marking to erase it first.',
      markOn: 'Marking is on: tapping a square pencils a cross.',
      markOff: 'Marking is off: tapping a square places a flame.',
      'only-in-region': 'This colour has only this square left. The flame goes here.',
      'only-in-row': 'This row has only this square left. The flame goes here.',
      'only-in-column': 'This column has only this square left. The flame goes here.',
      'would-block': 'A flame here would leave another group with nowhere to go, so it is crossed out.',
      'ruled-out': 'This square can be crossed out.',
      noHints: 'No hints left. You get one for each level you finish.',
      found: 'Here is a flame.',
    },
    quotes: [
      'Still water runs deep.',
      'A journey of a thousand miles begins with one step.',
      'Know the ground before you move.',
      'More haste, less speed.',
      'Calm the mind and the way appears.',
    ],
    solvedTitle: 'Every flame is lit',
    solvedText: (size: number, hearts: number, stars: number) =>
      `All ${size} flames, with ${hearts} of ${HEARTS} hearts left: ${stars} of 3 stars. You also get one more hint.`,
    next: 'Next level',
    again: 'Play this level again',
    failedTitle: 'No hearts left',
    failedText: 'All three hearts are used. The level starts again from the beginning.',
    retry: 'Start the level again',
    levelsTitle: 'Choose a level',
    levelButton: (n: number, stars: number, open: boolean) =>
      open ? `Level ${n}, ${stars} of 3 stars` : `Level ${n}, not open yet`,
    close: 'Close',
    howToTitle: 'How to play',
    howTo2: [
      'A correct flame crosses out every square it rules out.',
      'A wrong square costs a heart. With all three gone, the level starts again.',
      'Mark squares lets you pencil your own crosses while you think.',
      'A hint shows one step of reasoning. You start with three and get one for each level you finish.',
      'Find a flame lights one flame for you, once a level.',
    ],
    shareTitle: 'Share the flame puzzle',
    shareWhat: (n: number) =>
      `This sends a link to the flame puzzle and says you reached level ${n}. It does not include your name or anything else about you.`,
    shareWho: 'Whoever opens the link will need to sign in to this study first.',
    shareText: (n: number) => `I reached level ${n} of the flame puzzle. Try it:`,
    shareSend: 'Share the link',
    shareCopy: 'Copy the link',
    copied: 'The link is copied. Paste it wherever you like.',
    copyFailed: 'The link could not be copied. Select it below and copy it yourself.',
    shared: 'The share window opened. Whether it was sent is up to you there.',
  },
  zh: {
    back: '‹ 全部练习',
    title: '火苗谜题',
    level: (n: number, size: number) => `关卡 ${n} · ${size} × ${size}`,
    flames: (found: number, size: number) => `已点亮 ${found}/${size} 个火苗`,
    hearts: (h: number) => `剩余 ${h}/${HEARTS} 颗心`,
    rules: ['每种颜色一个火苗。', '每行、每列各一个火苗。', '火苗互不相邻，斜着也不行。'],
    mark: '标记格子',
    markOn: '标记：开',
    hint: (n: number) => `提示（剩 ${n} 次）`,
    find: (n: number) => `找出火苗（剩 ${n} 次）`,
    levels: '关卡',
    howTo: '玩法',
    share: '分享',
    soundOn: '声音：开',
    soundOff: '声音：关',
    otherLang: 'English',
    square: (r: number, c: number, what: string) => `第 ${r} 行第 ${c} 列：${what}`,
    squareIs: { '': '空', flame: '火苗', 'ruled-out': '已排除', wrong: '没有火苗', mark: '你的标记' } as Record<Square, string>,
    say: {
      start: '点一个格子放火苗。',
      flame: '火苗在此！它排除的格子已打叉。',
      wrong: '此处没有火苗，扣一颗心。',
      marked: '已标记，再点一次可擦掉。',
      unmarked: '标记已擦掉。',
      protected: '这格你标记过，先打开标记再擦掉。',
      markOn: '标记已打开：点格子画个叉。',
      markOff: '标记已关闭：点格子放火苗。',
      'only-in-region': '这个颜色只剩这一格，火苗就在这里。',
      'only-in-row': '这一行只剩这一格，火苗就在这里。',
      'only-in-column': '这一列只剩这一格，火苗就在这里。',
      'would-block': '若火苗放这里，会让另一组无处可放，所以排除。',
      'ruled-out': '这一格可以排除。',
      noHints: '提示用完了，每过一关再得一次。',
      found: '找到一个火苗。',
    },
    quotes: ['淡泊明志，宁静致远。', '千里之行，始于足下。', '知己知彼，百战不殆。', '欲速则不达。', '静以修身，俭以养德。'],
    solvedTitle: '火苗全部点亮',
    solvedText: (size: number, hearts: number, stars: number) =>
      `${size} 个火苗全部点亮，剩余 ${hearts}/${HEARTS} 颗心，获得 ${stars}/3 颗星，并多得一次提示。`,
    next: '下一关',
    again: '再玩一次',
    failedTitle: '心用完了',
    failedText: '三颗心都用完了，本关从头开始。',
    retry: '重新开始本关',
    levelsTitle: '选择关卡',
    levelButton: (n: number, stars: number, open: boolean) => (open ? `关卡 ${n}，${stars}/3 颗星` : `关卡 ${n}，尚未开放`),
    close: '关闭',
    howToTitle: '玩法',
    howTo2: [
      '放对火苗后，它排除的格子会自动打叉。',
      '点错一格扣一颗心，三颗心用完本关重来。',
      '标记格子可以自己画叉，帮助推理。',
      '提示会给出一步推理。开始有三次，每过一关再得一次。',
      '找出火苗每关可用一次，直接点亮一个火苗。',
    ],
    shareTitle: '分享火苗谜题',
    shareWhat: (n: number) => `会发送火苗谜题的链接，并说明你到了第 ${n} 关。不包含你的名字或其他任何个人信息。`,
    shareWho: '打开链接的人需要先登录这个研究平台。',
    shareText: (n: number) => `我玩到了火苗谜题第 ${n} 关，你也来试试：`,
    shareSend: '分享链接',
    shareCopy: '复制链接',
    copied: '链接已复制，可以粘贴到任何地方。',
    copyFailed: '无法自动复制，请选中下面的链接自行复制。',
    shared: '分享窗口已打开，是否发送由你决定。',
  },
};

const STORE_KEY = 'flame-puzzle';

interface Saved {
  unlocked: number;
  stars: Record<number, number>;
  hints: number;
  lang: Lang;
  sound: boolean;
  current: Play | null;
}

function load(): Saved {
  const fresh: Saved = { unlocked: 1, stars: {}, hints: STARTING_HINTS, lang: 'en', sound: false, current: null };
  try {
    const raw = preferenceStore()?.getItem(STORE_KEY);
    return raw ? { ...fresh, ...(JSON.parse(raw) as Partial<Saved>) } : fresh;
  } catch {
    return fresh;
  }
}

function save(s: Saved) {
  try {
    preferenceStore()?.setItem(STORE_KEY, JSON.stringify(s));
  } catch {
    /* remembered for this visit only */
  }
}

let audio: AudioContext | null = null;
function chime(freqs: number[], on: boolean) {
  if (!on) return;
  try {
    audio ??= new AudioContext();
    freqs.forEach((f, k) => {
      const o = audio!.createOscillator();
      const g = audio!.createGain();
      const t = audio!.currentTime + k * 0.1;
      o.type = 'sine';
      o.frequency.value = f;
      g.gain.setValueAtTime(0.1, t);
      g.gain.exponentialRampToValueAtTime(0.001, t + 0.25);
      o.connect(g).connect(audio!.destination);
      o.start(t);
      o.stop(t + 0.26);
    });
  } catch {
    /* no sound on this device */
  }
}

/** Lucide `flame`, filled with the accent so it reads at a glance. */
const FlameIcon = ({ size = 24 }: { size?: number }) => (
  <svg viewBox="0 0 24 24" width={size} height={size} aria-hidden="true" focusable="false" className="flame-icon">
    <path d="M8.5 14.5A2.5 2.5 0 0 0 11 12c0-1.38-.5-2-1-3-1.072-2.143-.224-4.054 2-6 .5 2.5 2 4.9 4 6.5 2 1.6 3 3.5 3 5.5a7 7 0 1 1-14 0c0-1.153.433-2.294 1-3a2.5 2.5 0 0 0 2.5 2.5z" />
  </svg>
);
const Cross = () => (
  <svg viewBox="0 0 24 24" width="22" height="22" aria-hidden="true" focusable="false">
    <path d="M6 6l12 12M18 6L6 18" />
  </svg>
);
const HeartIcon = ({ kept }: { kept: boolean }) => (
  <svg viewBox="0 0 24 24" width="22" height="22" aria-hidden="true" focusable="false" className={kept ? 'heart heart--kept' : 'heart'}>
    <path d="M19 14c1.49-1.46 3-3.21 3-5.5A5.5 5.5 0 0 0 16.5 3c-1.76 0-3 .5-4.5 2-1.5-1.5-2.74-2-4.5-2A5.5 5.5 0 0 0 2 8.5c0 2.3 1.5 4.05 3 5.5l7 7Z" />
  </svg>
);

export function FlamePuzzle({ onDone, shareUrl }: { onDone: () => void; shareUrl: string }) {
  const [saved, setSaved] = useState<Saved>(load);
  const [play, setPlay] = useState<Play>(() => {
    const s = load();
    return s.current ?? newPlay(generateLevel(Math.max(1, s.unlocked)));
  });
  const [marking, setMarking] = useState(false);
  const [say, setSay] = useState<string>('');
  const [pointed, setPointed] = useState<number | null>(null);
  const [window_, setWindow] = useState<null | 'solved' | 'failed' | 'levels' | 'how' | 'share'>(() =>
    load().unlocked === 1 && load().current === null ? 'how' : null,
  );
  const [shareNote, setShareNote] = useState('');
  const linkField = useRef<HTMLInputElement | null>(null);

  const w = WORDS[saved.lang];
  const level = useMemo(() => generateLevel(play.n), [play.n]);
  const { size } = level;

  const persist = (next: Partial<Saved>, p: Play | null = play) => {
    const merged = { ...saved, ...next, current: p && !solved(level, p) && !failed(p) ? p : null };
    setSaved(merged);
    save(merged);
  };

  const start = (n: number) => {
    const p = newPlay(generateLevel(n));
    setPlay(p);
    setPointed(null);
    setMarking(false);
    setWindow(null);
    setSay(WORDS[saved.lang].quotes[(n - 1) % WORDS[saved.lang].quotes.length]!);
    persist({}, p);
  };

  const onSquare = (i: number) => {
    const { play: next, outcome } = tap(level, play, i, marking);
    if (outcome === 'nothing') return;
    setPlay(next);
    setPointed(null);
    setSay(w.say[outcome]);
    if (outcome === 'flame') chime([660, 990], saved.sound);
    if (outcome === 'wrong') chime([220, 165], saved.sound);
    if (solved(level, next)) {
      const stars = Math.max(saved.stars[next.n] ?? 0, starsFor(next));
      chime([523, 659, 784, 1047], saved.sound);
      persist(
        {
          unlocked: Math.max(saved.unlocked, next.n + 1),
          stars: { ...saved.stars, [next.n]: stars },
          hints: Math.min(MAX_HINTS, saved.hints + 1),
        },
        next,
      );
      setWindow('solved');
      return;
    }
    if (failed(next)) {
      persist({}, next);
      setWindow('failed');
      return;
    }
    persist({}, next);
  };

  const onHint = () => {
    if (saved.hints <= 0) {
      setSay(w.say.noHints);
      return;
    }
    const hint: Hint | null = findHint(level, play);
    if (!hint) return;
    const next = applyHint(play, hint);
    setPlay(next);
    setPointed(hint.square);
    setSay(w.say[hint.kind]);
    persist({ hints: saved.hints - 1 }, next);
  };

  const onFind = () => {
    const found = findFlame(level, play);
    if (!found) return;
    setPlay(found.play);
    setPointed(found.square);
    setSay(w.say.found);
    chime([660, 990], saved.sound);
    if (solved(level, found.play)) {
      persist(
        {
          unlocked: Math.max(saved.unlocked, found.play.n + 1),
          stars: { ...saved.stars, [found.play.n]: Math.max(saved.stars[found.play.n] ?? 0, starsFor(found.play)) },
          hints: Math.min(MAX_HINTS, saved.hints + 1),
        },
        found.play,
      );
      setWindow('solved');
      return;
    }
    persist({}, found.play);
  };

  const reached = Math.max(play.n, saved.unlocked - 1, 1);
  const message = `${w.shareText(reached)} ${shareUrl}`;
  const onShare = async () => {
    try {
      await navigator.share({ title: w.title, text: w.shareText(reached), url: shareUrl });
      setShareNote(w.shared);
    } catch {
      /* closed without sharing: nothing to say */
    }
  };
  const onCopy = async () => {
    try {
      await navigator.clipboard.writeText(message);
      setShareNote(w.copied);
    } catch {
      setShareNote(w.copyFailed);
      linkField.current?.select();
    }
  };

  const border = (i: number, dr: number, dc: number) => {
    const r = Math.floor(i / size) + dr;
    const c = (i % size) + dc;
    if (r < 0 || c < 0 || r >= size || c >= size) return true;
    return level.regions[r * size + c] !== level.regions[i];
  };

  const levelsShown = Math.max(30, Math.ceil((saved.unlocked + 5) / 5) * 5);
  const stars = starsFor(play);
  const canShare = typeof navigator !== 'undefined' && typeof navigator.share === 'function';

  return (
    <section aria-labelledby="puzzle-heading" className="puzzle" lang={saved.lang === 'zh' ? 'zh-CN' : 'en'}>
      <p>
        <button className="back-link" onClick={onDone}>
          {w.back}
        </button>
      </p>
      <h1 id="puzzle-heading">{w.title}</h1>
      <p className="puzzle__level">{w.level(play.n, size)}</p>

      <div className="puzzle__standing">
        <p className="puzzle__flames">
          <FlameIcon size={22} />
          <span>{w.flames(play.found, size)}</span>
        </p>
        <p className="puzzle__hearts">
          <span className="puzzle__heart-row">
            {Array.from({ length: HEARTS }, (_, k) => (
              <HeartIcon key={k} kept={k < play.hearts} />
            ))}
          </span>
          <span>{w.hearts(play.hearts)}</span>
        </p>
      </div>

      <ul className="puzzle__rules">
        {w.rules.map((r) => (
          <li key={r}>{r}</li>
        ))}
      </ul>

      <div
        className={`puzzle__board puzzle__board--${size}`}
        role="grid"
        aria-label={w.level(play.n, size)}
      >
        {play.squares.map((s, i) => (
          <button
            key={`${play.n}-${i}`}
            role="gridcell"
            className={[
              'puzzle__square',
              `puzzle__square--${s || 'empty'}`,
              `puzzle__square--r${level.regions[i]! % 9}`,
              border(i, -1, 0) && 'puzzle__square--edge-t',
              border(i, 1, 0) && 'puzzle__square--edge-b',
              border(i, 0, -1) && 'puzzle__square--edge-l',
              border(i, 0, 1) && 'puzzle__square--edge-r',
              pointed === i && 'puzzle__square--pointed',
            ]
              .filter(Boolean)
              .join(' ')}
            aria-label={w.square(Math.floor(i / size) + 1, (i % size) + 1, w.squareIs[s])}
            onClick={() => onSquare(i)}
          >
            {s === 'flame' ? <FlameIcon /> : s === '' ? null : <Cross />}
          </button>
        ))}
      </div>

      <p className="puzzle__say" role="status">
        {say || w.quotes[(play.n - 1) % w.quotes.length]}
      </p>

      <div className="puzzle__tools">
        <button
          aria-pressed={marking}
          className={marking ? 'puzzle__tool puzzle__tool--on' : 'puzzle__tool'}
          onClick={() => {
            setMarking(!marking);
            setSay(marking ? w.say.markOff : w.say.markOn);
          }}
        >
          {marking ? w.markOn : w.mark}
        </button>
        <button className="puzzle__tool" onClick={onHint}>
          {w.hint(saved.hints)}
        </button>
        <button className="puzzle__tool" onClick={onFind} disabled={play.finds <= 0}>
          {w.find(play.finds)}
        </button>
      </div>
      <div className="puzzle__more">
        <button onClick={() => setWindow('levels')}>{w.levels}</button>
        <button onClick={() => setWindow('how')}>{w.howTo}</button>
        <button
          onClick={() => {
            setShareNote('');
            setWindow('share');
          }}
        >
          {w.share}
        </button>
        <button aria-pressed={saved.sound} onClick={() => persist({ sound: !saved.sound })}>
          {saved.sound ? w.soundOn : w.soundOff}
        </button>
        <button lang={saved.lang === 'en' ? 'zh-CN' : 'en'} onClick={() => persist({ lang: saved.lang === 'en' ? 'zh' : 'en' })}>
          {w.otherLang}
        </button>
      </div>

      {window_ === 'solved' && (
        <Modal labelledBy="puzzle-solved" onClose={() => start(play.n + 1)}>
          <h2 id="puzzle-solved" className="modal__heading">
            {w.solvedTitle}
          </h2>
          <p className="puzzle__stars" aria-hidden="true">
            {'★'.repeat(stars)}
            <span className="puzzle__stars-off">{'★'.repeat(3 - stars)}</span>
          </p>
          <p>{w.solvedText(size, play.hearts, stars)}</p>
          <p className="puzzle__window-actions">
            <button className="primary" onClick={() => start(play.n + 1)}>
              {w.next}
            </button>
            <button onClick={() => start(play.n)}>{w.again}</button>
            <button
              onClick={() => {
                setShareNote('');
                setWindow('share');
              }}
            >
              {w.share}
            </button>
          </p>
        </Modal>
      )}
      {window_ === 'failed' && (
        <Modal labelledBy="puzzle-failed" onClose={() => start(play.n)}>
          <h2 id="puzzle-failed" className="modal__heading">
            {w.failedTitle}
          </h2>
          <p>{w.failedText}</p>
          <p>
            <button className="primary" onClick={() => start(play.n)}>
              {w.retry}
            </button>
          </p>
        </Modal>
      )}
      {window_ === 'levels' && (
        <Modal labelledBy="puzzle-levels" role="dialog" onClose={() => setWindow(null)}>
          <h2 id="puzzle-levels" className="modal__heading">
            {w.levelsTitle}
          </h2>
          <ul className="puzzle__level-list">
            {Array.from({ length: levelsShown }, (_, k) => k + 1).map((n) => {
              const got = saved.stars[n] ?? 0;
              const isOpen = n <= saved.unlocked;
              return (
                <li key={n}>
                  <button
                    className={n === play.n ? 'puzzle__level-button puzzle__level-button--current' : 'puzzle__level-button'}
                    disabled={!isOpen}
                    aria-label={w.levelButton(n, got, isOpen)}
                    aria-current={n === play.n ? 'true' : undefined}
                    onClick={() => start(n)}
                  >
                    <span>{n}</span>
                    <span className="puzzle__level-stars" aria-hidden="true">
                      {'★'.repeat(got)}
                    </span>
                  </button>
                </li>
              );
            })}
          </ul>
          <p>
            <button onClick={() => setWindow(null)}>{w.close}</button>
          </p>
        </Modal>
      )}
      {window_ === 'how' && (
        <Modal labelledBy="puzzle-how" role="dialog" onClose={() => setWindow(null)}>
          <h2 id="puzzle-how" className="modal__heading">
            {w.howToTitle}
          </h2>
          <ul>
            {[...w.rules, ...w.howTo2].map((r) => (
              <li key={r}>{r}</li>
            ))}
          </ul>
          <p>
            <button className="primary" onClick={() => setWindow(null)}>
              {w.close}
            </button>
          </p>
        </Modal>
      )}
      {window_ === 'share' && (
        <Modal labelledBy="puzzle-share" role="dialog" onClose={() => setWindow(null)}>
          <h2 id="puzzle-share" className="modal__heading">
            {w.shareTitle}
          </h2>
          <p>{w.shareWhat(reached)}</p>
          <p>{w.shareWho}</p>
          <label className="puzzle__share-label">
            <span className="visually-hidden">{w.shareTitle}</span>
            <input ref={linkField} id="puzzle-share-link" readOnly value={message} onFocus={(e) => e.target.select()} />
          </label>
          <p className="puzzle__window-actions">
            {canShare && <button onClick={() => void onShare()}>{w.shareSend}</button>}
            <button onClick={() => void onCopy()}>{w.shareCopy}</button>
            <button onClick={() => setWindow(null)}>{w.close}</button>
          </p>
          {shareNote !== '' && <p role="status">{shareNote}</p>}
        </Modal>
      )}
    </section>
  );
}
