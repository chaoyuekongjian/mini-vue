import { render, h, Text, Fragment } from './runtime';
import { reactive } from './reactive/reactive'

const root = document.body
const Child = {
  props: ['foo'],
  render(ctx) {
    return h('div', { class: 'a', id: ctx.bar }, ctx.foo);
  },
};

const Parent = {
  setup() {
    const vnodeProps = reactive({
      foo: 'foo',
      bar: 'bar',
    });
    return { vnodeProps };
  },
  render(ctx) {
    return h(Child, ctx.vnodeProps);
  },
};

render(h(Parent), root);