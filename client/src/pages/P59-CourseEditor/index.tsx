// client: hand-built page (P59 course editor). Replaces the generated artboard port
// (view.tsx / logic.js); rebuilt after the potential-template CourseBuilder.
import { useState } from 'react'
import { AppShell } from '@/components/shell/AppShell'
import { shellHelper } from '@/components/shell/shellHelper'
import { useLocale } from '@/i18n/useLocale'
import { CourseBuilder } from './builder'
import { seedCourse } from './mock'
import { CbProvider } from './ui'
import './style.css'

export default function P59CourseEditorPage({ course }: { course?: string }) {
  const { lang, ar, dir, L } = useLocale()
  const [root, setRoot] = useState<HTMLElement | null>(null)
  const key = (course || 'C01').toUpperCase()
  const title = seedCourse(key).course.title
  const sh = shellHelper(ar, 'admin', 'catalog', '', [
    { label: L('Admin', 'الإدارة'), href: '/admin' },
    { label: L('Catalog', 'الكتالوج'), href: '/admin/catalog' },
    { label: ar ? title.ar : title.en },
  ])
  return (
    <div className="pgs-P59-CourseEditor">
      <div className="ds pt proto" dir={dir} lang={lang} ref={setRoot}>
        <CbProvider lang={lang} portal={root}>
          <AppShell sh={sh}>
            <main className="pc" id="main">
              <CourseBuilder key={key} courseId={key} />
            </main>
          </AppShell>
        </CbProvider>
      </div>
    </div>
  )
}
