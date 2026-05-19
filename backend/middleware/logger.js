const RESET = '\x1b[0m'
const DIM   = '\x1b[2m'
const BOLD  = '\x1b[1m'
const RED   = '\x1b[31m'

const METHOD_COLOR = {
  GET:    '\x1b[36m', // cyan
  POST:   '\x1b[32m', // green
  PATCH:  '\x1b[33m', // yellow
  PUT:    '\x1b[33m', // yellow
  DELETE: '\x1b[31m', // red
}

function statusColor(code) {
  if (code >= 500) return '\x1b[31m' // red
  if (code >= 400) return '\x1b[33m' // yellow
  if (code >= 300) return '\x1b[36m' // cyan
  return '\x1b[32m'                  // green
}

function timestamp() {
  return new Date().toTimeString().slice(0, 8)
}

export function requestLogger(req, res, next) {
  const start = Date.now()
  const { method, url } = req

  res.on('finish', () => {
    const ms     = Date.now() - start
    const mColor = METHOD_COLOR[method] ?? '\x1b[37m'
    const sColor = statusColor(res.statusCode)

    console.log(
      `${DIM}${timestamp()}${RESET} ` +
      `${mColor}${BOLD}${method.padEnd(6)}${RESET} ` +
      `${url.padEnd(40)} ` +
      `${sColor}${res.statusCode}${RESET} ` +
      `${DIM}${ms}ms${RESET}`
    )
  })

  next()
}

export function errorLogger(err, req, res, next) {
  const { method, url } = req
  const status = err.status ?? err.statusCode ?? 500
  const time = timestamp()

  console.error(
    `${DIM}${time}${RESET} ` +
    `${RED}${BOLD}ERROR${RESET} ` +
    `${METHOD_COLOR[method] ?? '\x1b[37m'}${method}${RESET} ` +
    `${url} ` +
    `${RED}${status}${RESET} ` +
    `${RED}${err.message}${RESET}`
  )

  if (err.stack && process.env.NODE_ENV !== 'production') {
    const trace = err.stack.split('\n').slice(1, 4).map(l => `  ${DIM}${l.trim()}${RESET}`).join('\n')
    console.error(trace)
  }

  next(err)
}
