import 'dotenv/config'
import express from 'express'
import cors from 'cors'
import { requestLogger, errorLogger } from './middleware/logger.js'
import packagesRouter from './routes/packages.js'
import addonsRouter from './routes/addons.js'
import casesRouter from './routes/cases.js'
import crematoriumsRouter from './routes/crematoriums.js'
import ordersRouter from './routes/orders.js'
import portalRouter from './routes/portal.js'
import usersRouter from './routes/users.js'
import caseContactsRouter from './routes/case_contacts.js'
import caseDocumentsRouter from './routes/case_documents.js'
import caseFamilyMessagesRouter from './routes/case_family_messages.js'
import notificationsRouter from './routes/notifications.js'
import foldersRouter from './routes/folders.js'
import bookingsRouter from './routes/bookings.js'
import inboxRouter from './routes/inbox.js'
import emailTemplateRouter from './routes/email.js'

const app = express()
const PORT = process.env.PORT || 3001

app.use(cors({ origin: 'http://localhost:5173' }))
app.use(express.json())
app.use(requestLogger)

app.use('/api/packages', packagesRouter)
app.use('/api/addons', addonsRouter)
app.use('/api/cases', casesRouter)
app.use('/api/cases/:caseId/contacts', caseContactsRouter)
app.use('/api/cases/:caseId/documents', caseDocumentsRouter)
app.use('/api/cases/:caseId/messages', caseFamilyMessagesRouter)
app.use('/api/crematoriums', crematoriumsRouter)
app.use('/api/orders', ordersRouter)
app.use('/api/portal-settings', portalRouter)
app.use('/api/users', usersRouter)
app.use('/api/notifications', notificationsRouter)
app.use('/api/folders', foldersRouter)
app.use('/api/bookings', bookingsRouter)
app.use('/api/inbox', inboxRouter)
app.use('/api/email-template', emailTemplateRouter)

app.get('/api/health', (_req, res) => res.json({ ok: true }))

app.use(errorLogger)
app.use((err, _req, res, _next) => {
  const status = err.status ?? err.statusCode ?? 500
  res.status(status).json({ error: err.message ?? 'Internal server error' })
})

if (process.env.NODE_ENV !== 'test') {
  app.listen(PORT, () => console.log(`Passage API running on http://localhost:${PORT}`))
}

export default app
