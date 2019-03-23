import {
  mkdirSync,
  readdirSync,
  readFileSync,
  rmdirSync,
  statSync,
  unlinkSync,
  writeFileSync
} from 'fs';
import MarkdownIt from 'markdown-it';
import MarkdownItAttrs from 'markdown-it-attrs';
import Path from 'path';

const DOCS_FOLDER = `${process.cwd()}/docs`;
const STYLE_FOLDER = `${process.cwd()}/styles`;
const BUILD_FOLDER = `${process.cwd()}/build`;

interface FileResult {
  path: string;
  walked: string;
}

const rmrf = (path: string) => {
  if (statSync(path).isFile()) {
    unlinkSync(path);
    return;
  }
  const subPaths = readdirSync(path);

  subPaths.flatMap(subPath => rmrf(Path.join(path, subPath)));

  rmdirSync(path);
};

const listFiles = (path: string, walked = ''): FileResult[] => {
  if (statSync(path).isFile()) {
    return [
      {
        path,
        walked
      }
    ];
  }
  const subPaths = readdirSync(path);

  return subPaths.flatMap(subPath =>
    listFiles(Path.join(path, subPath), Path.join(walked, subPath))
  );
};

try {
  rmrf(BUILD_FOLDER);
} catch {
  // ignore
}
try {
  mkdirSync(BUILD_FOLDER);
} catch {
  // ignore
}

const styles = listFiles(STYLE_FOLDER)
  .filter(it => it.walked !== 'base')
  .map(it => {
    const parsed = Path.parse(it.walked);
    return Path.join(parsed.dir, parsed.name);
  });

writeFileSync(
  Path.join(BUILD_FOLDER, `base.css`),
  readFileSync(Path.join(STYLE_FOLDER, `base.css`))
);

const renderer = new MarkdownIt({
  typographer: true
}).use(MarkdownItAttrs);

const BASE_HTML = readFileSync(`${process.cwd()}/assets/base.html`).toString();

const apply = (head: string, body: string) =>
  BASE_HTML.replace('#head', head).replace('#body', body);

for (const file of listFiles(DOCS_FOLDER)) {
  const parsed = Path.parse(file.walked);
  const ownStyle = styles.find(
    style => style === Path.join(parsed.dir, parsed.name)
  );

  const rendered = renderer.render(readFileSync(file.path).toString());

  const output = Path.join(BUILD_FOLDER, parsed.dir, `${parsed.name}.html`);

  if (ownStyle) {
    writeFileSync(
      output,
      apply(`<link rel="stylesheet" href="${ownStyle}.css">`, rendered)
    );
    writeFileSync(
      Path.join(BUILD_FOLDER, `${ownStyle}.css`),
      readFileSync(Path.join(STYLE_FOLDER, `${ownStyle}.css`))
    );
  } else {
    writeFileSync(output, apply('', rendered));
  }
}
