import { Paragraph, renderParagraphs } from './utils/bilibili-opus-render';
import { fetchOpus } from './utils/fetch-opus';
import fastify from 'fastify';

const main = async () => {
  const response = await fetchOpus('1133181564352462851');
  const module_content = response.data?.item?.modules?.find((module) => module.module_type === 'MODULE_TYPE_CONTENT')?.module_content;
  if (!module_content) {
    console.error('Module content not found, check opus id and cookie settings');
    return;
  }
  const html = renderParagraphs(module_content?.paragraphs as Paragraph[]);
  console.log(html);

  const app = fastify();
  app.get('/', (_, res) => {
    res
      .type('text/html; charset=utf-8')
      .send(`<!doctype html><html>
        <head><meta charset="utf-8">
        <link rel="stylesheet" href="https://s1.hdslb.com/bfs/static/stone-free/opus-detail/css/opus-detail.0.cfe8274d62b9ef5e70e578525ae89e1f70da8c84.css">
        <link rel="stylesheet" href="https://s1.hdslb.com/bfs/static/stone-free/opus-detail/css/opus-detail.1.cfe8274d62b9ef5e70e578525ae89e1f70da8c84.css">
        </head><body><div class="opus-module-content opus-paragraph-children" style="max-width: 708px; margin: 0 auto;">${html}</div></body></html>`);
  });
  app.listen({ port: 2333 }, () => {
    console.log('Server is running on http://localhost:2333');
  });
};

main();