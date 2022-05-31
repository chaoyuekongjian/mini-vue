import { render, h, Text, Fragment } from './runtime';

const root = document.body
render(h('div', { class: 'b'}), root);

setTimeout(() => {
  render(h('div'), root);
}, 1000)