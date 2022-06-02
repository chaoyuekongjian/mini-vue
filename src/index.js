// import { render, h, Text, Fragment, createApp, nextTick } from './runtime';
// import { ref, reactive } from './reactive'
import { parse } from './compiler'

console.log(parse('<div class="a" v-if="ok">hello {{name}}</div>'))