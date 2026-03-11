import 'dotenv/config'
import express from 'express'
import cors from 'cors'
import packagesRouter from './routes/packages.js'
import addonsRouter from './routes/addons.js'
import casesRouter from './routes/cases.js'
import crematoriumsRouter from './routes/crematoriums.js'
import ordersRouter from './routes/orders.js'

const app = express()
const PORT = process.env.PORT || 3001

app.use(cors({ origin: 'http://localhost:5173' }))
app.use(express.json())

app.use('/api/packages', packagesRouter)
app.use('/api/addons', addonsRouter)
app.use('/api/cases', casesRouter)
app.use('/api/crematoriums', crematoriumsRouter)
app.use('/api/orders', ordersRouter)

app.get('/api/health', (_req, res) => res.json({ ok: true }))

// Generic error handler
app.use((err, _req, res, _next) => {
  console.error(err)
  res.status(500).json({ error: err.message ?? 'Internal server error' })
})

app.listen(PORT, () => console.log(`Passage API running on http://localhost:${PORT}`))
