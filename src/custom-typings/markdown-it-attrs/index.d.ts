declare module 'markdown-it-attrs' {
  import MarkdownIt from 'markdown-it';

  const Plugin: (md: MarkdownIt) => void;

  export default Plugin;
}
