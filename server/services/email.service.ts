import { existsSync, readFileSync } from 'node:fs'
import { join } from 'node:path'
import { SESv2Client, SendEmailCommand } from '@aws-sdk/client-sesv2'
import { env, mailTransport } from '@server/config/env'
import Handlebars from 'handlebars'
import nodemailer from 'nodemailer'

/**
 * E-mail rendering and transport. SES when deployed, Mailpit (SMTP) in development, an in-memory
 * outbox in tests. Templates live in server/templates/<name>.hbs with an optional `{{!-- subject: … --}}`
 * first line; both languages are in the template (`{{#if ar}}`).
 */

const TEMPLATES_DIR = join(import.meta.dir, '../templates')

Handlebars.registerPartial(
  'layout',
  readFileSync(join(TEMPLATES_DIR, 'partials/layout.hbs'), 'utf-8'),
)

type Compiled = { subject: string; render: HandlebarsTemplateDelegate }
const cache = new Map<string, Compiled>()

function load(name: string): Compiled {
  const cached = cache.get(name)
  if (cached) return cached
  const file = join(TEMPLATES_DIR, `${name}.hbs`)
  if (!existsSync(file)) throw new Error(`Unknown e-mail template: ${name}`)
  const source = readFileSync(file, 'utf-8')
  const subject = /\{\{!--\s*subject:\s*(.+?)\s*--\}\}/.exec(source)?.[1] ?? 'DCT Learn'
  const compiled = { subject, render: Handlebars.compile(source) }
  cache.set(name, compiled)
  return compiled
}

export type OutboxMessage = {
  to: string
  subject: string
  html: string
  text: string
  template: string
  data: Record<string, unknown>
}

/** Test transport: everything sent is kept here, newest last. */
export const outbox: OutboxMessage[] = []

export function stripHtml(html: string): string {
  return html
    .replace(/<style[^>]*>[\s\S]*?<\/style>/gi, '')
    .replace(/<title[^>]*>[\s\S]*?<\/title>/gi, '')
    .replace(/<a[^>]*href="([^"]*)"[^>]*>([\s\S]*?)<\/a>/gi, '$2 ($1)')
    .replace(/<[^>]+>/g, '')
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&nbsp;/g, ' ')
    .replace(/&#x3D;/g, '=')
    .replace(/[ \t]+\n/g, '\n')
    .replace(/\n{3,}/g, '\n\n')
    .trim()
}

const ses =
  mailTransport === 'ses'
    ? new SESv2Client({
        region: env.SES_REGION,
        credentials:
          env.SES_ACCESS_KEY_ID && env.SES_SECRET_ACCESS_KEY
            ? { accessKeyId: env.SES_ACCESS_KEY_ID, secretAccessKey: env.SES_SECRET_ACCESS_KEY }
            : undefined,
      })
    : null

const smtp =
  mailTransport === 'smtp'
    ? nodemailer.createTransport({ host: env.MAILPIT_HOST, port: env.MAILPIT_PORT, secure: false })
    : null

export function renderEmail(
  template: string,
  data: Record<string, unknown>,
  locale: 'en' | 'ar' = 'en',
) {
  const compiled = load(template)
  const html = compiled.render({
    ...data,
    ar: locale === 'ar',
    appName: 'DCT Learn',
    appUrl: env.APP_URL,
    year: String(new Date().getFullYear()),
  })
  const subject = Handlebars.compile(compiled.subject, { noEscape: true })(data)
  return { subject, html, text: stripHtml(html) }
}

/** Sends now. Most callers should use `queueEmail` (jobs) so a mail outage never fails a request. */
export async function deliverEmail(
  to: string,
  template: string,
  data: Record<string, unknown>,
  locale: 'en' | 'ar' = 'en',
): Promise<void> {
  const { subject, html, text } = renderEmail(template, data, locale)
  if (mailTransport === 'memory') {
    outbox.push({ to, subject, html, text, template, data })
    return
  }
  if (smtp) {
    await smtp.sendMail({ from: env.MAIL_FROM, to, subject, html, text })
    return
  }
  await ses?.send(
    new SendEmailCommand({
      FromEmailAddress: env.MAIL_FROM,
      Destination: { ToAddresses: [to] },
      Content: {
        Simple: {
          Subject: { Data: subject, Charset: 'UTF-8' },
          Body: { Html: { Data: html, Charset: 'UTF-8' }, Text: { Data: text, Charset: 'UTF-8' } },
        },
      },
    }),
  )
}
