/* Run from supplyed-admin: node scripts/check-backend-contract.mjs [--database]
 * Uses the sibling backend's real validators, DTO serializers and Prisma models.
 * --database additionally samples the configured database in a READ ONLY transaction.
 * No HTTP mutations, migrations, seeds, email, payment or storage calls are made.
 */
import assert from 'node:assert/strict'
import fs from 'node:fs'
import path from 'node:path'
import vm from 'node:vm'
import { createRequire } from 'node:module'
import { fileURLToPath } from 'node:url'
import ts from 'typescript'
const runtimeRequire = createRequire(import.meta.url)
const adminDir = fileURLToPath(new URL('../', import.meta.url))
const backendDir = path.resolve(process.env.SUPPLYED_BACKEND_DIR || path.join(adminDir, '../supplyed-backend'))
const backendRequire = createRequire(path.join(backendDir, 'package.json'))
backendRequire('reflect-metadata')
backendRequire('ts-node').register({ project: path.join(backendDir, 'tsconfig.json'), transpileOnly: true })
backendRequire('tsconfig-paths').register({ baseUrl: backendDir, paths: { 'src/*': ['src/*'] } })
const backend = file => backendRequire(path.join(backendDir, 'src', file))
const { ValidationPipe, RequestMethod } = backendRequire('@nestjs/common')
const { PATH_METADATA, METHOD_METADATA } = backendRequire('@nestjs/common/constants')
const prismaExports = backendRequire('@prisma/client')
const { Prisma } = prismaExports
const prismaSchema = fs.readFileSync(path.join(backendDir, 'prisma/schema.prisma'), 'utf8')
const pipe = new ValidationPipe({ whitelist: true, forbidNonWhitelisted: true, transform: true })
const cache = new Map()
let checks = 0
const failures = []
const json = value => JSON.parse(JSON.stringify(value))
const uuid = '11111111-1111-4111-8111-111111111111'
const now = new Date('2026-10-29T00:00:00Z')
const envelope = data => ({ success: true, statusCode: 200, message: 'OK', data, meta: { requestId: uuid, timestamp: now.toISOString(), path: '/api/audit', method: 'GET' } })

function admin(file) {
  const full = path.resolve(adminDir, file)
  if (cache.has(full)) return cache.get(full).exports
  const mod = { exports: {} }
  cache.set(full, mod)
  const source = fs.readFileSync(full, 'utf8')
  // Expose local boundary schemas to the audit without changing app exports.
  const ast = ts.createSourceFile(full, source, ts.ScriptTarget.Latest, true)
  const names = ast.statements.filter(s => ts.isVariableStatement(s) && !s.modifiers?.some(m => m.kind === ts.SyntaxKind.ExportKeyword)).flatMap(s => s.declarationList.declarations)
    .filter(d => ts.isIdentifier(d.name) && /Schema$/.test(d.name.text)).map(d => d.name.text)
  const code = ts.transpileModule(source, { compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022, esModuleInterop: true } }).outputText
  const localRequire = name => {
    if (name === 'server-only') return {}
    if (name === 'next/cache') return { revalidatePath() {} }
    if (name === '@/lib/auth/session') return {}
    if (name.startsWith('@/')) return admin(name.slice(2) + '.ts')
    if (name.startsWith('.')) return admin(path.relative(adminDir, path.resolve(path.dirname(full), name)) + '.ts')
    return runtimeRequire(name)
  }
  vm.runInNewContext(`(function(require,module,exports){${code}\nObject.assign(exports,{${names.join(',')}})})`, {
    URL, TextEncoder, AbortSignal, Response, console, process: { env: { NODE_ENV: 'production' } },
  })(localRequire, mod, mod.exports)
  return mod.exports
}
async function check(name, action) {
  try { await action(); checks++ }
  catch (error) {
    failures.push(name)
    console.error('FAIL:', name, error.issues?.map(i => ({ path: i.path, code: i.code })) || error.getResponse?.() || error.message)
  }
}
function parse(file, schema, data) { return admin(file)[schema].parse(json(data)) }
function model(name, overrides = {}) {
  const definition = Prisma.dmmf.datamodel.models.find(m => m.name === name)
  assert.ok(definition, `Prisma model ${name} exists`)
  const result = {}
  const block = prismaSchema.match(new RegExp('model ' + name + ' \\{([\\s\\S]*?)\\n\\}'))[1]
  for (const f of definition.fields.filter(f => f.kind !== 'object')) {
    const token = block.match(new RegExp('^\\s*' + f.name + '\\s+(\\S+)', 'm'))[1]
    result[f.name] = token.endsWith('[]') ? [] : token.endsWith('?') ? null : f.kind === 'enum'
      ? Object.values(prismaExports[f.type])[0]
      : f.type === 'DateTime' ? now : f.type === 'Boolean' ? false
      : f.type === 'Int' || f.type === 'Float' ? 0 : f.type === 'Decimal' ? new Prisma.Decimal(0)
      : f.type === 'Json' ? {} : /(^id$|Id$)/.test(f.name) ? uuid : f.name === 'email' ? 'sample@example.test' : 'Sample'
  }
  return { ...result, ...overrides }
}

const userDto = backend('modules/users/dto/admin-user-response.dto.ts').AdminUserResponseDto
const instructorDto = backend('modules/instructors/dto/instructor-response.dto.ts').InstructorResponseDto
const institutionDto = backend('modules/institutions/dto/institution-response.dto.ts').InstitutionResponseDto
const jobDto = backend('modules/jobs/dto/job-response.dto.ts').JobResponseDto
const documentDto = backend('modules/documents/dto/document-response.dto.ts').DocumentResponseDto
const invoiceDto = backend('modules/payments/dto/invoice-response.dto.ts').InvoiceResponseDto
const waitlistDto = backend('modules/contact/dto/founding-interest.dto.ts').FoundingInterestResponseDto
const conversationService = new (backend('modules/conversations/conversations.service.ts').ConversationsService)()
const observer = { id: uuid, role: 'ADMIN' }
const tests = [
  ['users', 'lib/users/schema.ts', 'userSchema', x => userDto.fromUser(x)],
  ['instructors', 'lib/users/get-role-profile.ts', 'instructorProfileSchema', x => instructorDto.fromEntity(x)],
  ['institutions', 'lib/users/get-role-profile.ts', 'institutionProfileSchema', x => institutionDto.fromEntity(x)],
  ['jobs', 'lib/jobs/schema.ts', 'jobSchema', x => jobDto.fromEntity(x)],
  ['document types', 'lib/document-types/schema.ts', 'documentTypeSchema', x => x],
  ['document requirements', 'lib/document-requirements/schema.ts', 'documentRequirementSchema', x => x],
  ['documents', 'lib/documents/schema.ts', 'documentSchema', x => documentDto.fromDocument(x)],
  ['document reviews', 'lib/document-reviews/schema.ts', 'documentReviewSchema', x => x],
  ['invoices', 'lib/invoices/schema.ts', 'invoiceSchema', x => invoiceDto.fromEntity(x)],
  ['waiting list', 'lib/waiting-list/schema.ts', 'submissionSchema', x => waitlistDto.fromEntity(x)],
  ['conversations', 'lib/conversations/schema.ts', 'conversationSchema', x => conversationService.toResponse(x, observer, 0)],
]
const fixtures = [
  model('User'), model('InstructorProfile'), model('InstitutionProfile'), model('Job'),
  model('DocumentType'), model('DocumentRequirement'), model('Documents'), model('DocumentReview'),
  model('BookingInvoice', { currency: 'gbp', booking: { ...model('Booking'), job: model('Job'), instructor: model('InstructorProfile'), institution: model('InstitutionProfile') } }),
  model('FoundingInterestSubmission'),
  { ...model('Conversation'), application: null, booking: null, job: null, instructor: model('InstructorProfile'), poster: { institutionProfile: null }, messages: [] },
]

async function validateRequests() {
  const examples = [
    ['login', 'lib/auth/validation.ts', 'loginSchema', { email: 'sample@example.test', password: 'Password123!' }, 'modules/auth/dto/login.dto.ts', 'LoginDto'],
    ...['INSTRUCTOR', 'INSTITUTION'].map(role => ['create ' + role, 'app/api/users/route.ts', 'inputSchema', { email: 'sample@example.test', password: 'Password123!', role, name: 'Sample', phone: '+441234567890', emailVerified: true, phoneVerified: true }, 'modules/users/dto/admin-create-user.dto.ts', 'AdminCreateUserDto']),
    ...['ADMIN', 'INSTRUCTOR', 'INSTITUTION'].map(role => ['edit ' + role, 'app/api/users/[id]/route.ts', 'updateUserInputSchema', { role, name: 'Sample', phone: '', emailVerified: true, phoneVerified: false }, 'modules/users/dto/admin-update-user.dto.ts', 'AdminUpdateUserDto']),
    ['job', 'lib/jobs/schema.ts', 'createJobInputSchema', { title: 'Cover', description: 'Teaching cover', subject: 'Mathematics', address: '1 School Lane', city: 'London', county: 'London', postalCode: 'SW1A 2AA', keyStages: ['KS3'], payAmount: 180, payType: 'daily', parkingInfo: '', startDate: '2027-01-02T09:00:00Z', endDate: '2027-01-02T17:00:00Z', expiresAt: '2027-01-01T12:00:00Z' }, 'modules/jobs/dto/create-job.dto.ts', 'CreateJobDto'],
    ['custom subject job', 'lib/jobs/schema.ts', 'createJobInputSchema', { title: 'Cover', description: 'Teaching cover', subjects: ['Other'], otherSubjects: ['Robotics'], keyStages: [] }, 'modules/jobs/dto/create-job.dto.ts', 'CreateJobDto'],
    ['create document type', 'lib/document-types/schema.ts', 'createDocumentTypeInputSchema', { code: 'DBS', name: 'DBS', description: '', allowedMimes: ['application/pdf'], maxSizeBytes: 10485760, isActive: true }, 'modules/document-types/dto/create-document-type.dto.ts', 'CreateDocumentTypeDto'],
    ['edit document type', 'lib/document-types/schema.ts', 'updateDocumentTypeInputSchema', { description: '', isActive: false }, 'modules/document-types/dto/update-document-type.dto.ts', 'UpdateDocumentTypeDto'],
    ...['INSTRUCTOR_PROFILE', 'INSTITUTION_PROFILE'].map(context => ['requirement ' + context, 'lib/document-requirements/schema.ts', 'createDocumentRequirementInputSchema', { documentTypeId: uuid, context, isRequired: true, requiresReview: true, isActive: true }, 'modules/document-requirements/dto/create-document-requirement.dto.ts', 'CreateDocumentRequirementDto']),
    ['edit requirement', 'lib/document-requirements/schema.ts', 'updateDocumentRequirementInputSchema', { isActive: false }, 'modules/document-requirements/dto/update-document-requirement.dto.ts', 'UpdateDocumentRequirementDto'],
    ...['APPROVED', 'REJECTED', 'REQUIRES_INFO'].map(status => ['review ' + status, 'lib/documents/schema.ts', 'reviewDocumentInputSchema', { status, notes: status === 'APPROVED' ? '' : 'Please replace this file.' }, 'modules/documents/dto/review-document.dto.ts', 'ReviewDocumentDto']),
    ['dropdown patch', 'lib/dropdowns/schema.ts', 'dropdownPatchSchema', { revision: 1, options: [{ key: 'sample', value: 'Sample', label: 'Sample', aliases: [], group: null, sortOrder: 0, isActive: true, isShared: false, subjectKeys: [] }] }, 'modules/dropdowns/dropdowns.dto.ts', 'UpdateDropdownDto'],
    ['dropdown retire options', 'lib/dropdowns/schema.ts', 'dropdownDeleteSchema', { revision: 1, optionKeys: ['sample'] }, 'modules/dropdowns/dropdowns.dto.ts', 'DeleteDropdownDto'],
    ['dropdown retire collection', 'lib/dropdowns/schema.ts', 'dropdownDeleteSchema', { revision: 1 }, 'modules/dropdowns/dropdowns.dto.ts', 'DeleteDropdownDto'],
  ]
  for (const [name, file, schema, input, dtoFile, dto] of examples) await check('request: ' + name, () => pipe.transform(json(parse(file, schema, input)), { type: 'body', metatype: backend(dtoFile)[dto] }))
  for (const status of admin('lib/users/profile-status.ts').ADMIN_PROFILE_STATUS_TARGETS) {
    for (const [file, dto] of [['common/dto/update-profile-status.dto.ts', 'AdminUpdateProfileStatusDto'], ['modules/instructors/dto/admin-update-instructor.dto.ts', 'AdminUpdateInstructorDto']]) {
      await check('profile status ' + dto + ' ' + status, () => pipe.transform({ status }, { type: 'body', metatype: backend(file)[dto] }))
    }
  }
  for (const status of ['NEW', 'CONTACTED', 'QUALIFIED', 'CONVERTED', 'CLOSED']) await check('waitlist status ' + status, () => pipe.transform({ status }, { type: 'body', metatype: backend('modules/contact/dto/founding-interest.dto.ts').UpdateFoundingInterestStatusDto }))
  const queries = [
    ['users', 'modules/users/dto/list-users-query.dto.ts', 'ListUsersQueryDto', { page: '1', limit: '100', search: 'Sample', role: 'INSTRUCTOR', accountType: 'USERS', countries: 'GB,PK', profileStatus: 'ACTIVE', emailVerified: 'true', phoneVerified: 'false', createdFrom: '2026-01-01', createdTo: '2026-12-31', sortBy: 'lastLogin', sortOrder: 'desc' }],
    ['profiles', 'common/dto/list-profiles-query.dto.ts', 'ListProfilesQueryDto', { userId: uuid, page: '1', limit: '100' }],
    ['documents', 'modules/documents/dto/list-documents-query.dto.ts', 'ListDocumentsQueryDto', { page: '1', limit: '100' }],
    ['reviews', 'modules/document-reviews/dto/list-document-reviews-query.dto.ts', 'ListDocumentReviewsQueryDto', { documentId: uuid }],
    ['jobs', 'modules/jobs/dto/list-jobs-query.dto.ts', 'ListJobsQueryDto', { page: '1', limit: '20' }],
    ['invoices', 'modules/payments/dto/list-invoices-query.dto.ts', 'AdminListInvoicesQueryDto', { page: '1', limit: '100', status: 'PAID', jobId: uuid }],
    ['job invoices', 'modules/payments/dto/list-invoices-query.dto.ts', 'JobInvoicesQueryDto', { page: '1', limit: '100', status: 'PAID' }],
    ['conversations', 'modules/conversations/dto/list-conversations-query.dto.ts', 'ListConversationsQueryDto', { page: '1', limit: '20' }],
    ['messages', 'modules/conversations/dto/list-messages-query.dto.ts', 'ListMessagesQueryDto', { limit: '30', before: uuid }],
    ['waiting list', 'modules/contact/dto/founding-interest.dto.ts', 'ListFoundingInterestQueryDto', { page: '1', limit: '100', type: 'SCHOOL', status: 'NEW', search: 'Sample', fromDate: '2026-01-01', toDate: '2026-12-31' }],
  ]
  for (const [name, file, dto, query] of queries) await check('query: ' + name, () => {
    assert.ok(backend(file)[dto], dto)
    return pipe.transform(query, { type: 'query', metatype: backend(file)[dto] })
  })
}

async function validateResponses() {
  for (let i = 0; i < tests.length; i++) {
    const [name, file, schema, convert] = tests[i]
    await check('response: ' + name, () => parse(file, schema, convert(fixtures[i])))
  }
  for (const status of ['DRAFT', 'ACTIVE', 'RESERVED', 'EXPIRED', 'FILLED', 'CLOSED', 'SUSPENDED']) await check('job status ' + status, () => parse('lib/jobs/schema.ts', 'jobSchema', jobDto.fromEntity(model('Job', { status }))))
  for (const role of ['INSTRUCTOR', 'INSTITUTION', 'ADMIN', 'USER']) await check('persisted user role ' + role, () => parse('lib/users/schema.ts', 'userSchema', userDto.fromUser(model('User', { role }))))
  for (const context of Object.values(prismaExports.DocumentContext)) await check('document context ' + context, () => parse('lib/document-requirements/schema.ts', 'documentRequirementSchema', model('DocumentRequirement', { context })))
  for (const application of [null, { id: uuid, status: 'APPLIED' }, { id: uuid, status: 'HIRED' }]) await check('chat nullable application ' + (application?.status ?? 'none'), () => parse('lib/conversations/schema.ts', 'conversationSchema', conversationService.toResponse({ ...fixtures[10], application, job: { id: uuid, title: 'Sample' } }, observer, 0)))
  await check('message with deleted sender', () => parse('lib/conversations/schema.ts', 'conversationMessageSchema', conversationService.toMessage(model('Message', { senderId: null, attachments: [] }), fixtures[10])))
  const page = { page: 1, limit: 20, total: 1, totalPages: 1, hasNextPage: false }
  const pages = [
    ['lib/jobs/get-jobs.ts', 'jobsResponseSchema', { jobs: [jobDto.fromEntity(fixtures[3])], pagination: page }],
    ['lib/documents/schema.ts', 'paginatedDocumentsResponseSchema', { documents: [documentDto.fromDocument(fixtures[6])], pagination: page }],
    ['lib/invoices/schema.ts', 'invoicesResponseSchema', { invoices: [invoiceDto.fromEntity(fixtures[8])], pagination: page }],
    ['lib/waiting-list/schema.ts', 'submissionsResponseSchema', { submissions: [waitlistDto.fromEntity(fixtures[9])], pagination: page }],
    ['lib/conversations/schema.ts', 'jobConversationsResponseSchema', { job: { id: uuid, title: 'Sample' }, conversations: [conversationService.toResponse({ ...fixtures[10], job: { id: uuid, title: 'Sample' } }, observer, 0)], pagination: page }],
  ]
  for (const [file, schema, data] of pages) await check('envelope: ' + schema, () => parse(file, schema, envelope(data)))
  const dropdowns = new (backend('modules/dropdowns/dropdowns.service.ts').DropdownsService)()
  await check('dropdown detail serializer', () => parse('lib/dropdowns/schema.ts', 'dropdownResponseSchema', envelope(dropdowns.present(model('Dropdown', { name: 'subject', revision: 1, isActive: true, options: [model('DropdownOption', { key: 'sample', value: 'Sample', label: 'Sample' })] }), true))))
}

async function validateRoutes() {
  const routes = new Map()
  function scan(dir) {
    for (const item of fs.readdirSync(dir, { withFileTypes: true })) {
      const file = path.join(dir, item.name)
      if (item.isDirectory()) scan(file)
      else if (item.name.endsWith('.controller.ts')) {
        for (const Controller of Object.values(backendRequire(file))) {
          if (typeof Controller !== 'function' || !Reflect.hasMetadata(PATH_METADATA, Controller)) continue
          for (const name of Object.getOwnPropertyNames(Controller.prototype)) {
            const fn = Controller.prototype[name]
            const method = Reflect.getMetadata(METHOD_METADATA, fn)
            if (method === undefined) continue
            const route = [Reflect.getMetadata(PATH_METADATA, Controller), Reflect.getMetadata(PATH_METADATA, fn)].join('/').replace(/\/+$/, '')
            routes.set(RequestMethod[method] + ' ' + route, Reflect.getMetadata('roles', fn) ?? Reflect.getMetadata('roles', Controller))
          }
        }
      }
    }
  }
  scan(path.join(backendDir, 'src/modules'))
  const required = [
    'POST auth/login', 'POST auth/refresh', 'POST auth/2fa/verify', 'POST auth/2fa/admin/:userId/disable',
    'GET users', 'GET users/:id', 'POST users/admin', 'PATCH users/admin/:id', 'DELETE users/admin/:id',
    'GET instructors', 'PATCH instructors/admin/:id', 'GET institutions', 'PATCH institutions/admin/:id/status',
    'GET jobs/admin/all', 'GET jobs/mine/:id', 'POST jobs',
    'GET document-types', 'GET document-types/:id', 'POST document-types', 'PATCH document-types/:id', 'DELETE document-types/:id',
    'GET document-requirements', 'POST document-requirements', 'PATCH document-requirements/:id', 'DELETE document-requirements/:id',
    'GET documents/admin', 'GET documents/admin/:id', 'GET documents/admin/:id/download-url', 'POST documents/admin/:id/review', 'GET document-reviews',
    'GET dropdowns/admin', 'GET dropdowns/admin/:name', 'PATCH dropdowns/:name', 'DELETE dropdowns/:name',
    'GET invoices', 'GET invoices/job/:jobId', 'GET conversations/job/:jobId', 'GET conversations/:id', 'GET conversations/:id/messages', 'GET conversations/:id/attachments/:attachmentId/download-url',
    'GET contact/founding-interest', 'GET contact/founding-interest/all', 'PATCH contact/founding-interest/:id/status',
  ]
  for (const route of required) await check('route and admin permission: ' + route, () => {
    assert.ok(routes.has(route), 'route exists')
    const roles = routes.get(route)
    assert.ok(!roles || roles.includes('ADMIN'), 'ADMIN permitted by route roles')
  })
}

async function validateDatabase() {
  backendRequire('dotenv').config({ path: path.join(backendDir, '.env'), quiet: true })
  const { PrismaClient } = backendRequire('@prisma/client')
  const { PrismaPg } = backendRequire('@prisma/adapter-pg')
  const client = new PrismaClient({ adapter: new PrismaPg({ connectionString: process.env.DATABASE_URL, options: '-c default_transaction_read_only=on', connectionTimeoutMillis: 5000 }) })
  try {
    await client.$transaction(async tx => {
      const samples = [
        () => tx.user.findMany({ take: 100, include: { instructorProfile: true, institutionProfile: true } }),
        () => tx.instructorProfile.findMany({ take: 100 }), () => tx.institutionProfile.findMany({ take: 100 }),
        () => tx.job.findMany({ take: 100 }), () => tx.documentType.findMany({ take: 100 }), () => tx.documentRequirement.findMany({ take: 100 }),
        () => tx.documents.findMany({ take: 100, include: { requirement: { include: { documentType: true } }, user: { select: { id: true, email: true, name: true } } } }),
        () => tx.documentReview.findMany({ take: 100 }),
        () => tx.bookingInvoice.findMany({ take: 100, include: backend('modules/payments/invoices.repository.ts').INVOICE_INCLUDE }),
        () => tx.foundingInterestSubmission.findMany({ take: 100 }),
        () => tx.conversation.findMany({ take: 100, include: backend('modules/conversations/conversations.repository.ts').CONVERSATION_INCLUDE }),
      ]
      for (let i = 0; i < tests.length; i++) {
        const [name, file, schema, convert] = tests[i]
        await check('database rows: ' + name, async () => {
          const rows = await samples[i]()
          for (const row of rows) parse(file, schema, convert(row))
          console.log('Read-only sample:', name, rows.length, 'rows')
        })
      }
      const service = new (backend('modules/dropdowns/dropdowns.service.ts').DropdownsService)({
        dropdown: tx.dropdown,
        // Already inside one read-only transaction; reuse it for catalogue snapshots.
        $transaction: work => work(tx),
      })
      await check('database dropdown list', async () => parse('lib/dropdowns/schema.ts', 'dropdownListResponseSchema', envelope(await service.list(true))))
      for (const name of ['subject', 'skill', 'keyStage', 'city', 'region', 'payType']) await check('database dropdown ' + name, async () => parse('lib/dropdowns/schema.ts', 'dropdownResponseSchema', envelope(await service.detail(name, true))))
      await check('job form options accepted by backend selection validator', async () => {
        for (const name of ['city', 'region', 'keyStage', 'payType']) {
          const detail = await service.detail(name, true)
          const choices = admin('lib/jobs/form-options.ts').activeJobOptions(json(detail))
          await service.assertSelections({ [name]: choices.map(item => item.value) })
        }
      })
      await check('admin job payload passes the backend prepareCreate business rules', async () => {
        const choose = async name => admin('lib/jobs/form-options.ts').activeJobOptions(json(await service.detail(name, true)))[0]?.value
        const subjects = admin('lib/jobs/form-options.ts').activeJobOptions(json(await service.detail('subject', true)))
        const input = parse('lib/jobs/schema.ts', 'createJobInputSchema', {
          title: 'Contract check', description: 'Prepared in memory; never saved',
          subject: subjects.find(item => item.value !== 'Other')?.value,
          city: await choose('city'), county: await choose('region'),
          keyStages: [await choose('keyStage')].filter(Boolean), payType: await choose('payType'),
          startDate: '2027-01-02T09:00:00Z', endDate: '2027-01-02T17:00:00Z', expiresAt: '2027-01-01T12:00:00Z',
        })
        const JobsService = backend('modules/jobs/jobs.service.ts').JobsService
        const jobs = new JobsService({}, {}, { resolveCoordinates: async () => ({ latitude: null, longitude: null }) }, service, {}, {})
        const prepared = await jobs.prepareCreate(uuid, 'ADMIN', input)
        assert.equal(prepared.title, input.title)
        if (subjects.some(item => item.value === 'Other')) {
          const custom = await jobs.prepareCreate(uuid, 'ADMIN', { ...input, subject: undefined, subjects: ['Other'], otherSubjects: ['Unlisted contract audit subject'] })
          assert.equal(custom.subject, 'Unlisted contract audit subject')
        }
      })
    }, { timeout: 30000 })
  } finally { await client.$disconnect() }
}

async function main() {
  await validateRequests()
  await validateResponses()
  await validateRoutes()
  if (process.argv.includes('--database')) await validateDatabase()
  console.log(JSON.stringify({ passed: checks, failed: failures.length, failures, databaseMode: process.argv.includes('--database') }, null, 2))
  if (failures.length) process.exitCode = 1
}
main().catch(error => { console.error(error.message); process.exitCode = 1 })
