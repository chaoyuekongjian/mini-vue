import { render, h, Text, Fragment } from './runtime';
import { ref } from './reactive'

const root = document.body
const comp = {
  setup() {
    const count = ref(0)
    const add = () => {
      count.value++
      count.value++
      count.value++
      count.value++
      count.value++
      count.value++
    }
    return {
      count,
      add
    }
  },
  render(ctx) {
    console.log('render')
    return [
      h('div', null, ctx.count.value),
      h('button', {
        onClick: ctx.add
      }, 'add')
    ]
  }
}

render(h(comp), root);