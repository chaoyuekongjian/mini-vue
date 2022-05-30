import { reactive } from './reactive/reactive'
import { effect } from './reactive/effect'

const oberverd = window.oberverd = reactive([1,2,3,4])
console.log(oberverd)
effect(() => {
  effect(() => {
    console.log('my length is：' + oberverd.length)
  })
  console.log('mycount：' + oberverd[1])
})