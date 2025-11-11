/**
 * Bilibili Opus paragraph renderer (B 站同款结构)
 * Input: module_content.paragraphs[].text.nodes / pic / line ...
 * Output: HTML string that mimics Bilibili's page DOM
 */

export type TextNodeWord = {
  type: 'TEXT_NODE_TYPE_WORD';
  word: {
    words: string;
    font_size?: number;
    font_level?: string;
    color?: string | null;
    style?: Record<string, unknown> | null; // 例如 { bold:true, italic:true, underline:true }
    bg_style?: unknown;
  };
};

export type RichEmoji = {
  gif_url?: string;
  icon_url?: string;
  webp_url?: string;
  size?: number;
  text?: string;
  type?: number;
};

export type TextNodeRich = {
  type: 'TEXT_NODE_TYPE_RICH';
  rich: {
    type: string; // RICH_TEXT_NODE_TYPE_*
    text?: string;
    orig_text?: string;
    rid?: string | number;
    jump_url?: string;
    emoji?: RichEmoji;
    [k: string]: unknown;
  };
};

export type TextNodeFormula = {
  type: 'TEXT_NODE_TYPE_FORMULA';
  formula: { latex_content: string };
};

export type TextNode = TextNodeWord | TextNodeRich | TextNodeFormula | { type?: string; [k: string]: any };

export type Paragraph =
  | {
      para_type: 1; // text
      align?: number; // 0/1/2 -> left/center/right
      text?: { nodes?: TextNode[] };
    }
  | {
      para_type: 2; // pictures
      align?: number;
      pic?: { style?: number; pics?: { url: string; width?: number; height?: number }[] };
    }
  | {
      para_type: 3; // line
      align?: number;
      line?: { pic?: { url?: string; height?: number } };
    }
  | {
      para_type: 4; // blockquote
      align?: number;
      text?: { nodes?: TextNode[] };
    }
  | {
      para_type: 5; // list
      align?: number;
      list?: { style?: number; items?: { level?: number; nodes?: TextNode[]; order?: number }[] };
    }
  | {
      para_type: 6; // link-card (minimal)
      align?: number;
      link_card?: { card?: { type?: string; jump_url?: string; [k: string]: any } };
    }
  | {
      para_type: 7; // code
      align?: number;
      code?: { content?: string; lang?: string };
    }
  | {
      para_type: 8; // heading (部分返回存在)
      align?: number;
      heading: { level: number; nodes: TextNode[] };
    };

export type RenderOptions = {
  /** 在文本/标题节点上添加 Vue 的 scoped attr，例如 data-v-2505e99a */
  scopedAttr?: string | false; // 默认 'data-v-2505e99a'
  /** 图片渲染区域的目标宽度（容器宽），B 站常见为 596px */
  imageDisplayWidth?: number; // 默认 596
  /** srcset 的宽度（一般是容器宽的 2x） */
  pictureSrcsetBaseWidth?: number; // 默认 1192
  /** 标题检测阈值：>=26 -> h1, >=22 -> h2 */
  h1Size?: number; // 默认 26
  h2Size?: number; // 默认 22
  /** 标题是否强制 <strong> 包裹子节点 */
  headingStrong?: boolean; // 默认 true
};

const DEFAULTS: Required<RenderOptions> = {
  scopedAttr: 'data-v-2505e99a',
  imageDisplayWidth: 596,
  pictureSrcsetBaseWidth: 1192,
  h1Size: 26,
  h2Size: 22,
  headingStrong: true,
};

/* ================== 基础工具 ================== */
function escHtml(s: string): string {
  return (s ?? '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

function alignToCss(align?: number): 'left' | 'center' | 'right' {
  return align === 1 ? 'center' : align === 2 ? 'right' : 'left';
}

function ensureProtocolRelative(url: string): string {
  if (!url) return '';
  return url.replace(/^https?:/, ''); // 变成 //host/path
}

function withSizeSuffix(url: string, width: number, ext: 'webp' | 'avif'): string {
  // 输入可为 i*.hdslb.com/bfs/new_dyn/xxx.png 或 jpg
  // 输出 //i*.hdslb.com/...@{width}w.{ext}
  const u = ensureProtocolRelative(url);
  const noQuery = u.split('?')[0];
  return `${noQuery}@${width}w.${ext}`;
}

function cssFromWord(word: TextNodeWord['word']): string {
  const styles: string[] = [];
  if (word.color) styles.push(`color:${word.color}`);
  if (word.font_size && Number.isFinite(word.font_size)) styles.push(`font-size:${word.font_size}px`);
  const s = word.style as Record<string, any> | null | undefined;
  if (s) {
    if (s.bold) styles.push('font-weight:700');
    if (s.italic) styles.push('font-style:italic');
    // 支持组合下划线
    if (s.underline) styles.push('text-decoration:underline');
    if (s.strike || s.strikethrough) styles.push('text-decoration:line-through');
    if (s.lineHeight) styles.push(`line-height:${s.lineHeight}`);
    if (s.letterSpacing) styles.push(`letter-spacing:${s.letterSpacing}`);
  }
  return styles.join(';');
}

function textWithBr(s: string): string {
  if (!s) return '';
  return escHtml(s).replace(/\n/g, '<br>');
}

function wrapStrong(html: string, enable: boolean): string {
  if (!enable || !html) return html;
  return `<strong>${html}</strong>`;
}

/* ================== RICH 节点渲染 ================== */
function renderEmoji(emoji: RichEmoji | undefined): string {
  if (!emoji) return '';
  const alt = escHtml(emoji.text || '');
  const src = emoji.webp_url || emoji.icon_url || emoji.gif_url || '';
  const size = emoji.size || 2;
  const em = size === 1 ? 1.0 : size === 3 ? 1.5 : 1.25;
  const style = `width:${em}em;height:${em}em;vertical-align:middle;`;
  return src ? `<img src="${escHtml(ensureProtocolRelative(src))}" alt="${alt}" style="${style}">` : alt;
}

function renderRichInline(node: TextNodeRich, opts: Required<RenderOptions>, { asHeading = false } = {}): string {
  const r = node.rich || ({} as any);
  const type = r.type || '';
  const text = (r.text ?? r.orig_text ?? '') + '';
  switch (type) {
    case 'RICH_TEXT_NODE_TYPE_EMOJI':
      return renderEmoji(r.emoji as RichEmoji);
    case 'RICH_TEXT_NODE_TYPE_AT': {
      const mid = String(r.rid ?? '').replace(/\D+/g, '');
      const label = escHtml(text || '@');
      return wrapStrong(`<a href="https://space.bilibili.com/${mid}" target="_blank">${label}</a>`, asHeading);
    }
    case 'RICH_TEXT_NODE_TYPE_TOPIC': {
      const topic = text.replace(/^#+|#+$/g, '');
      const href = r.jump_url ? String(r.jump_url) : `https://search.bilibili.com/all?keyword=${encodeURIComponent(topic)}`;
      return wrapStrong(`<a href="${escHtml(href)}" target="_blank">${escHtml(text.startsWith('#') ? text : `#${topic}`)}</a>`, asHeading);
    }
    case 'RICH_TEXT_NODE_TYPE_WEB': {
      const href = /^https?:/i.test(text) ? text : 'https://' + text.replace(/^\/*/, '');
      return wrapStrong(`<a href="${escHtml(href)}" target="_blank">${escHtml(text)}</a>`, asHeading);
    }
    case 'RICH_TEXT_NODE_TYPE_MAIL':
      return wrapStrong(`<a href="mailto:${escHtml(text)}">${escHtml(text)}</a>`, asHeading);
    case 'RICH_TEXT_NODE_TYPE_BV': {
      const bv = (text.match(/BV[0-9A-Za-z]+/) || [text])[0];
      return wrapStrong(`<a href="https://www.bilibili.com/video/${bv}" target="_blank">${escHtml(text)}</a>`, asHeading);
    }
    case 'RICH_TEXT_NODE_TYPE_AV': {
      const av = (text.match(/\d+/) || [text])[0];
      return wrapStrong(`<a href="https://www.bilibili.com/video/av${av}" target="_blank">${escHtml(text)}</a>`, asHeading);
    }
    case 'RICH_TEXT_NODE_TYPE_CV': {
      const cv = (text.match(/\d+/) || [text])[0];
      return wrapStrong(`<a href="https://www.bilibili.com/read/cv${cv}" target="_blank">${escHtml(text)}</a>`, asHeading);
    }
    default: {
      if (typeof r.jump_url === 'string' && r.jump_url) {
        return wrapStrong(`<a href="${escHtml(r.jump_url)}" target="_blank">${escHtml(text || r.jump_url)}</a>`, asHeading);
      }
      return wrapStrong(textWithBr(text), asHeading);
    }
  }
}

/* ================== WORD / FORMULA 渲染 ================== */
function renderWordInline(node: TextNodeWord, opts: Required<RenderOptions>, { asHeading = false } = {}): string {
  const { scopedAttr } = opts;
  const style = cssFromWord(node.word);
  const attr = scopedAttr ? ` ${scopedAttr}=""` : '';
  const content = textWithBr(String(node.word.words ?? ''));
  const span = `<span${attr}${style ? ` style="${style}"` : ''}>${content}</span>`;
  return asHeading ? wrapStrong(span, true) : span;
}

function renderFormulaInline(node: TextNodeFormula): string {
  const latex = String(node.formula?.latex_content ?? '');
  return `<span data-latex="${escHtml(latex)}">${escHtml(latex)}</span>`;
}

function renderNodesInline(nodes: TextNode[] | undefined, opts: Required<RenderOptions>, { asHeading = false } = {}): string {
  if (!Array.isArray(nodes) || nodes.length === 0) return '';
  return nodes
    .map(n => {
      if (!n || typeof n !== 'object') return '';
      if (n.type === 'TEXT_NODE_TYPE_WORD' && (n as TextNodeWord).word) return renderWordInline(n as TextNodeWord, opts, { asHeading });
      if (n.type === 'TEXT_NODE_TYPE_RICH' && (n as TextNodeRich).rich) return renderRichInline(n as TextNodeRich, opts, { asHeading });
      if (n.type === 'TEXT_NODE_TYPE_FORMULA' && (n as TextNodeFormula).formula) return renderFormulaInline(n as TextNodeFormula);
      // Fallbacks
      if ((n as any).word?.words) return renderWordInline(n as any, opts, { asHeading });
      if ((n as any).rich) return renderRichInline(n as any, opts, { asHeading });
      return '';
    })
    .join('');
}

/* ================== 段落渲染 ================== */
export function renderParagraph(paragraph: Paragraph, options: RenderOptions = {}): string {
  const opts: Required<RenderOptions> = { ...DEFAULTS, ...options } as any;
  const alignCss = alignToCss((paragraph as any).align);
  const attr = opts.scopedAttr ? ` ${opts.scopedAttr}=""` : '';

  // Headings (para_type=8 优先)
  if ((paragraph as any).para_type === 8 && (paragraph as any).heading) {
    const level = Math.min(6, Math.max(1, (paragraph as any).heading.level || 2));
    const tag = level === 1 ? 'h1' : level === 2 ? 'h2' : `h${level}`;
    const inner = renderNodesInline((paragraph as any).heading.nodes, opts, { asHeading: opts.headingStrong });
    const style = ` style=\"text-align:${alignCss};\"`;
    return `<${tag}${style}${attr}>${inner}</${tag}>`;
  }

  // Text paragraph -> 若检测到大字号，则转为 h1/h2
  if ((paragraph as any).para_type === 1) {
    const nodes = (paragraph as any).text?.nodes as TextNode[] | undefined;
    let maxFont = 0;
    if (nodes) {
      for (const n of nodes) {
        if (n && n.type === 'TEXT_NODE_TYPE_WORD' && (n as TextNodeWord).word?.font_size) {
          maxFont = Math.max(maxFont, (n as TextNodeWord).word!.font_size!);
        }
      }
    }
    const style = ` style=\"text-align:${alignCss};\"`;
    if (maxFont >= opts.h1Size) {
      const inner = renderNodesInline(nodes, opts, { asHeading: opts.headingStrong });
      return `<h1${style}${attr}>${inner}</h1>`;
    } else if (maxFont >= opts.h2Size) {
      const inner = renderNodesInline(nodes, opts, { asHeading: opts.headingStrong });
      return `<h2${style}${attr}>${inner}</h2>`;
    }
    // 普通段落
    const inner = renderNodesInline(nodes, opts);
    return `<p${style}${attr}>${inner}</p>`;
  }

  // Pictures -> 生成 opus-para-pic 结构
  if ((paragraph as any).para_type === 2) {
    const pics = (paragraph as any).pic?.pics || [];
    if (!pics.length) return '';
    const clsCenter = alignCss === 'center' ? ' center' : '';
    const blocks = pics
      .map((p: any) => {
        const dispW = opts.imageDisplayWidth;
        const width = Number(p.width) > 0 ? Number(p.width) : dispW;
        const height = Number(p.height) > 0 ? Number(p.height) : dispW * 0.56;
        const scale = width ? dispW / width : 1;
        const hScaled = +(height * scale).toFixed(3);
        const styleWH = `style=\"width: ${dispW}px; height: ${hScaled}px;\"`;
        const base = p.url || '';
        const avif = withSizeSuffix(base, opts.pictureSrcsetBaseWidth, 'avif');
        const webp = withSizeSuffix(base, opts.pictureSrcsetBaseWidth, 'webp');
        const imgSrc = webp; // 页面里 <img> 用 webp
        return (
          `<div class=\"opus-para-pic${clsCenter}\">` +
          `<div class=\"bili-dyn-pic\" ${styleWH}>` +
          `<div class=\"bili-dyn-pic__img\">` +
          `<div class=\"b-img\">` +
          `<picture class=\"b-img__inner\">` +
          `<source type=\"image/avif\" srcset=\"${escHtml(avif)}\">` +
          `<source type=\"image/webp\" srcset=\"${escHtml(webp)}\">` +
          `<img src=\"${escHtml(imgSrc)}\" loading=\"lazy\" onload=\"bmgOnLoad(this)\" onerror=\"bmgOnError(this)\" data-onload=\"bmgCmptOnload\" data-onerror=\"bmgCmptOnerror\">` +
          `</picture>` +
          `</div> <!---->` +
          `</div> <!---->` +
          `</div>` +
          `</div>`
        );
      })
      .join('');
    return blocks;
  }

  // Line -> figure.opus-para-line
  if ((paragraph as any).para_type === 3) {
    const picUrl = (paragraph as any).line?.pic?.url;
    const h = Number((paragraph as any).line?.pic?.height) || 2;
    if (!picUrl) return `<figure class=\"opus-para-line\" style=\"max-height:${h}px;\"><img alt=\"cut-off\" src=\"\" style=\"max-height:${h}px;\"></figure>`;
    const src = ensureProtocolRelative(picUrl);
    return `<figure class=\"opus-para-line\" style=\"max-height:${h}px;\"><img alt=\"cut-off\" src=\"${escHtml(src)}\" style=\"max-height:${h}px;\"></figure>`;
  }

  // Blockquote
  if ((paragraph as any).para_type === 4) {
    const inner = renderNodesInline((paragraph as any).text?.nodes, opts);
    return `<blockquote style=\"text-align:${alignCss};\"${attr}>${inner}</blockquote>`;
  }

  // List (简化)
  if ((paragraph as any).para_type === 5) {
    const ol = (paragraph as any).list?.style === 1;
    const tag = ol ? 'ol' : 'ul';
    const inner = ((paragraph as any).list?.items || [])
      .map((it: any) => `<li>${renderNodesInline(it.nodes, opts)}</li>`)?.join('');
    return `<${tag} style=\"text-align:${alignCss};\">${inner}</${tag}>`;
  }

  // Link card (最小)
  if ((paragraph as any).para_type === 6) {
    const href = (paragraph as any).link_card?.card?.jump_url || '#';
    const label = (paragraph as any).link_card?.card?.type || 'LINK_CARD';
    return `<div style=\"text-align:${alignCss};\"><a href=\"${escHtml(String(href))}\" target=\"_blank\">${escHtml(String(label))}</a></div>`;
  }

  // Code
  if ((paragraph as any).para_type === 7) {
    const lang = (paragraph as any).code?.lang ? ` data-lang=\"${escHtml(String((paragraph as any).code.lang))}\"` : '';
    const code = escHtml(String((paragraph as any).code?.content ?? ''));
    return `<pre style=\"text-align:${alignCss};\"><code${lang}>${code}</code></pre>`;
  }

  return '';
}

export function renderParagraphs(paragraphs: Paragraph[] | undefined, options: RenderOptions = {}): string {
  if (!Array.isArray(paragraphs) || paragraphs.length === 0) return '';
  return paragraphs.map(p => renderParagraph(p, options)).join('');
}

/**
 * 便捷函数：仅渲染某段落中的 text.nodes（不包裹 <p>）
 */
export function renderNodes(nodes: TextNode[] | undefined, options: RenderOptions = {}): string {
  const opts: Required<RenderOptions> = { ...DEFAULTS, ...options } as any;
  return renderNodesInline(nodes, opts);
}
