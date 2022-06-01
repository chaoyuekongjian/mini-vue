const queue = []
let isFlush = false
const resolvedPromise = Promise.resolve()
let curFlushPromise = null
export function queueJob(job) {
  if (!queue.length || !queue.includes(job)) {
    queue.push(job)
    queueFlush()
  }
}

export function nextTick(fn) {
  const p = curFlushPromise || resolvedPromise
  return fn ? p.then(fn) : p
}

function queueFlush() {
  if (!isFlush) {
    isFlush = true
    curFlushPromise = resolvedPromise.then(flushJobs)
  }
}

function flushJobs() {
  try {
    for(let i = 0; i < queue.length; i++) {
      const job = queue[i]
      job()
    }
  } finally {
    isFlush = false
    queue.length = 0
    curFlushPromise = null
  }
}