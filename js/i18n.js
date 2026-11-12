// English, 中文, Español, Français. The English text is the key: t('Surprise me') returns the chosen language's text.
// Per-animation text (title, trick, notes) comes from anims/i18n-<code>.js, loaded only for the chosen language;
// anything missing falls back to English. The code, the CLI and the code comments stay English.
export const LANGS = [
  { code: 'en', name: 'English', short: 'EN', html: 'en' },
  { code: 'zh', name: '中文', short: '中文', html: 'zh-Hans' },
  { code: 'es', name: 'Español', short: 'ES', html: 'es' },
  { code: 'fr', name: 'Français', short: 'FR', html: 'fr' },
];

let lang = 'en';
try { const saved = localStorage.getItem('ml-lang'); if (LANGS.some(l => l.code === saved)) lang = saved; } catch {}
export const LANG = lang;
document.documentElement.lang = LANGS.find(l => l.code === lang).html;

// the chosen language's text for every animation (one file, fetched only when that language is on)
const PACK = lang === 'en' ? {} : await import(`../anims/i18n-${lang}.js`).then(m => Object.values(m)[0]).catch(() => ({}));

export function setLang(next) {
  if (next === lang) return;
  try { localStorage.setItem('ml-lang', next); } catch {}
  location.reload();
}

const CATS = { zh: {
  flow: '流动与粒子', fluid: '流体', chrome: '金属与 3D', shaders: '着色器与故障', generative: '生成与数学',
  simulation: '模拟', retro: '复古与信号', basics: '基础', transitions: '页面过渡', text: '文字', scroll: '滚动',
  hover: '悬停与光标', micro: '微交互与加载', springs: '弹簧与物理', morph: '变形与 SVG',
} };

const S = { zh: {
  'All': '全部',
  'Hearted': '收藏',
  'All animations': '全部动画',
  'Surprise me': '随便看看',
  'Skip to animations': '跳到动画',
  'Categories': '分类',
  'Language': '语言',
  'New group': '新建分组', 'Export all': '全部导出', 'Rename': '重命名', 'Export': '导出', 'Delete': '删除',
  'No hearted animations yet': '还没有收藏的动画',
  'Hover any card and press the heart to keep it here. You can sort them into groups later.': '把鼠标移到任意卡片上，点心形即可收藏到这里。之后可以再分组。',
  'Empty for now. Open the heart menu on any design to move it here.': '暂时为空。在任意作品的心形菜单里可以把它移到这里。',
  'How it works': '原理',
  'Install': '安装',
  'Code': '代码',
  'Copy': '复制', 'Copied': '已复制', 'Prompt': '提示词', 'Download .html': '下载 .html',
  'Share': '分享', 'Embed': '嵌入', 'Close': '关闭', 'Play': '播放',
  'Tweak': '调整', 'Reset': '重置', 'Tweak the numbers': '调整数值',
  'Interactive: move or press inside': '可交互：在画面内移动或按下',
  'Scroll inside the stage': '在画面内滚动',
  'Code copied': '代码已复制', 'Link copied': '链接已复制', 'Embed code copied': '嵌入代码已复制',
  'Command copied: run it in your project folder': '命令已复制：在项目文件夹里运行',
  'Prompt copied: paste it into Claude or Cursor': '提示词已复制：粘贴到 Claude 或 Cursor',
  'Questions': '常见问题',
} };
export const t = s => S[lang]?.[s] || s;
export const catName = c => CATS[lang]?.[c.id] || c.name;
// one animation's text field ('title' | 'trick' | 'notes'), in the chosen language when available
export const tr = (a, field) => PACK[a.id]?.[field] || a[field];
const COUNT = { zh: n => `${n} 个动画` };
export const countText = n => COUNT[lang]?.(n) ?? `${n} ${n === 1 ? 'animation' : 'animations'}`;

export { FAQ } from './faq.js';
