export interface OpusResponse {
  item: OpusItem;
}

export interface OpusItem {
  /** 动态/opus 全局字符串ID */
  id_str: string;
  /** 类型：图文=1（样例） */
  type: number;
  /** 一些归属与标题等基础信息 */
  basic: {
    collection_id?: number;
    comment_id_str?: string;
    comment_type?: number;
    rid_str?: string;
    title?: string;
    uid?: number;
    like_icon?: {
      id?: number;
      start_url?: string;
      end_url?: string;
      action_url?: string;
    };
  };
  /** 页面模块（标题、作者、文集、正文、底部、统计等） */
  modules: Module[];
}

/* -------------------- 模块联合体 -------------------- */

export type Module =
  | TitleModule
  | AuthorModule
  | CollectionModule
  | ContentModule
  | BottomModule
  | StatModule;

export interface TitleModule {
  module_type: 'MODULE_TYPE_TITLE';
  module_title: { text: string };
}

export interface AuthorModule {
  module_type: 'MODULE_TYPE_AUTHOR';
  module_author: {
    mid: number | string;
    name: string;
    face: string;
    face_nft?: boolean;
    following?: boolean;
    jump_url?: string;
    label?: string;
    pub_location_text?: string;
    pub_time?: string; // "2025年11月02日 14:54"
    pub_ts?: number;   // 1762066480
    views_text?: string;
    official?: { type?: number; title?: string; desc?: string; role?: number };
    pendant?: {
      pid?: number; name?: string; expire?: number;
      image?: string; image_enhance?: string; image_enhance_frame?: string; n_pid?: number;
    };
    vip?: {
      type?: number; status?: number; role?: number; theme_type?: number;
      due_date?: number; tv_vip_status?: number; tv_due_date?: number;
      vip_pay_type?: number; tv_vip_pay_type?: number;
      nickname_color?: string;
      avatar_icon?: { icon_type?: number; icon_resource?: unknown };
      avatar_subscript?: number; avatar_subscript_url?: string;
      label?: {
        text?: string; text_color?: string; bg_color?: string; bg_style?: number;
        border_color?: string; label_theme?: string;
        use_img_label?: boolean;
        img_label_uri_hans?: string; img_label_uri_hans_static?: string;
        img_label_uri_hant?: string; img_label_uri_hant_static?: string;
        path?: string;
      };
    };
    more?: { three_point_items?: { label: string; type: string }[] };
    avatar?: {
      container_size?: { width?: number; height?: number };
      fallback_layers?: {
        is_critical_group?: boolean;
        layers?: unknown[]; // 头像分层描述，通常前端渲染使用
      };
    };
    decorate_card?: {
      id?: number;
      name?: string;
      card_type?: number;
      card_type_name?: string;
      big_card_url?: string;
      card_url?: string;
      image_enhance?: string;
      item_id?: number;
      jump_url?: string;
      fan?: {
        is_fan?: number;
        name?: string;
        number?: number | string;
        num_desc?: string;
        color?: string;
        color_format?: {
          colors?: string[];
          start_point?: string;
          end_point?: string;
          gradients?: number[];
        };
      };
    };
  };
}

export interface CollectionModule {
  module_type: 'MODULE_TYPE_COLLECTION';
  module_collection: {
    id: number;
    name: string;
    title: string;
    /** 例如 "214篇" */
    count?: string;
  };
}

export interface ContentModule {
  module_type: 'MODULE_TYPE_CONTENT';
  module_content: {
    paragraphs: Paragraph[];
  };
}

/* -------------------- 段落与文本节点 -------------------- */

export type Paragraph =
  | ParaText
  | ParaPics
  | ParaLine
  | ParaBlockquote
  | ParaList
  | ParaLinkCard
  | ParaCode
  | ParaHeading
  | UnknownParagraph;

export interface BaseParagraph {
  /** 0=left,1=center,2=right */
  align?: number;
  /** 具体类型见各子接口 `para_type` */
  para_type: number;
  /** 样例里出现的富格式对象（对齐/缩进），前端可忽略或自用 */
  format?: { align?: number; indent?: number | null };
}

export interface ParaText extends BaseParagraph {
  /** 文本段落 */
  para_type: 1;
  text: { nodes: TextNode[] };
}

export interface ParaPics extends BaseParagraph {
  /** 图片段落 */
  para_type: 2;
  pic: {
    style?: number;
    pics: Array<{
      url: string;
      width?: number; height?: number;
      size?: number | null;
      live_url?: string | null;
      /** 可能还有 AIGC 标注等 */
      aigc?: unknown | null;
    }>;
  };
}

export interface ParaLine extends BaseParagraph {
  /** 分割线（可能是图片线条） */
  para_type: 3;
  line?: { pic?: { url?: string; height?: number } };
}

export interface ParaBlockquote extends BaseParagraph {
  /** 引用块 */
  para_type: 4;
  text: { nodes: TextNode[] };
}

export interface ParaList extends BaseParagraph {
  /** 列表段（样例里未出现 items 细节，这里做可选） */
  para_type: 5;
  list?: {
    style?: number; // 1=ol, 2=ul（社区约定）
    items?: Array<{ level?: number; order?: number; nodes?: TextNode[] }>;
  };
}

export interface ParaLinkCard extends BaseParagraph {
  /** 链接卡片（样例多为外链/商品等） */
  para_type: 6;
  link_card?: { card?: { type?: string; jump_url?: string; [k: string]: any } };
}

export interface ParaCode extends BaseParagraph {
  /** 代码块 */
  para_type: 7;
  code?: { content?: string; lang?: string };
}

export interface ParaHeading extends BaseParagraph {
  /** 标题段（样例中为 para_type=8） */
  para_type: 8;
  heading: { level: number; nodes: TextNode[] };
}

export interface UnknownParagraph extends BaseParagraph {
  /** 兜底，避免后续 para_type 扩展导致解析失败 */
  [k: string]: any;
}

/* —— 文本节点：WORD / RICH / FORMULA —— */

export type TextNode = WordNode | RichNode | FormulaNode | UnknownNode;

export interface WordNode {
  type: 'TEXT_NODE_TYPE_WORD';
  word: {
    /** 实际文本，可能包含换行符 */
    words: string;
    /** 字号（样例常见 17/22/24 等） */
    font_size?: number;
    /** 比如 'regular'/'xLarge'/'xxLarge' 等等级名 */
    font_level?: string;
    /** 颜色十六进制或 null */
    color?: string | null;
    /** 诸如 { bold: true } 等样式标记 */
    style?: Record<string, any>;
    /** 复杂背景样式对象（前端可忽略或自用） */
    bg_style?: any;
  };
}

export interface RichNode {
  type: 'TEXT_NODE_TYPE_RICH';
  rich: {
    /** 富文本子类型，如 RICH_TEXT_NODE_TYPE_AT/_TOPIC/_WEB/_EMOJI/_BV/_AV/_CV/... */
    type: string;
    /** 渲染文本与原始文本 */
    text?: string;
    orig_text?: string;
    /** 相关ID（如 @ 的 mid，番剧的 seasonId/epid 等） */
    rid?: string | number;
    /** 跳转链接（有些类型提供） */
    jump_url?: string;
    /** 表情节点时的资源与元数据 */
    emoji?: {
      text?: string;
      size?: number;
      icon_url?: string;
      webp_url?: string;
      gif_url?: string;
      type?: number;
      [k: string]: any;
    };
    /** 预留：不同类型还会带自有字段 */
    [k: string]: any;
  };
}

export interface FormulaNode {
  type: 'TEXT_NODE_TYPE_FORMULA';
  formula: { latex_content: string };
}

export interface UnknownNode {
  /** 向前兼容 */
  type?: string;
  [k: string]: any;
}

/* -------------------- 底部分享与统计 -------------------- */

export interface BottomModule {
  module_type: 'MODULE_TYPE_BOTTOM';
  module_bottom: {
    share_info?: {
      title?: string;
      summary?: string;
      pic?: string;
    };
  };
}

export interface StatModule {
  module_type: 'MODULE_TYPE_STAT';
  module_stat: {
    like?:    { count?: number; status?: boolean; forbidden?: boolean };
    coin?:    { count?: number; status?: boolean; forbidden?: boolean };
    favorite?:{ count?: number; status?: boolean; forbidden?: boolean };
    forward?: { count?: number; forbidden?: boolean };
    comment?: { count?: number; forbidden?: boolean };
  };
}
