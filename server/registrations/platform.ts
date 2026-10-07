import { microsites } from '@server/db/schema/microsites'
import { faqItems, pageSections } from '@server/db/schema/public'
import { registerTranslatable } from '@server/services/seams/translatable.registry'
// The data-export job must exist before `/me/export` can enqueue it.
import '@server/jobs/platform.job'

/** P60: the platform-owned `{ en, ar }` columns (microsites, P02/P03 page sections, FAQ). */
registerTranslatable({
  entity: 'microsite',
  table: microsites,
  id: microsites.id,
  fields: { name: microsites.name, subtitle: microsites.subtitle },
})

registerTranslatable({
  entity: 'page',
  table: pageSections,
  id: pageSections.id,
  fields: { title: pageSections.title, body: pageSections.body },
  richFields: ['body'],
})

registerTranslatable({
  entity: 'faq',
  table: faqItems,
  id: faqItems.id,
  fields: { question: faqItems.question, answer: faqItems.answer },
  richFields: ['answer'],
})
