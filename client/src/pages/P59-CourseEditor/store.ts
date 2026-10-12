// client: hand-built page (P59 course editor).
// In-memory stand-in for the admin course API. Every method matches a CourseAdminApi call
// (see ./types.ts), so the merge replaces this hook with fetch calls and keeps every component.
import { useMemo, useState } from 'react'
import { seedCourse, uid } from './mock'
import type {
  Assessment,
  Block,
  CourseAdminApi,
  CourseTree,
  ModuleNode,
  Question,
  UnitNode,
} from './types'

function byIds<T extends { id: string; order: number }>(items: T[], ids: string[]): T[] {
  const rank = new Map(ids.map((id, n) => [id, n]))
  return [...items]
    .sort((a, b) => (rank.get(a.id) ?? 1e6) - (rank.get(b.id) ?? 1e6))
    .map((x, n) => ({ ...x, order: n }))
}

const mapUnits = (modules: ModuleNode[], fn: (u: UnitNode) => UnitNode): ModuleNode[] =>
  modules.map((m) => ({ ...m, units: m.units.map(fn) }))

const mapAssessment = (list: Assessment[], id: string, fn: (a: Assessment) => Assessment) =>
  list.map((a) => (a.id === id ? fn(a) : a))

export interface CourseAdmin {
  tree: CourseTree
  api: CourseAdminApi
  /** Incremented on every successful write; the UI shows "Saved" after it changes. */
  version: number
}

export function useCourseAdmin(courseId: string): CourseAdmin {
  const [tree, setTree] = useState<CourseTree>(() => seedCourse(courseId))
  const [version, setVersion] = useState(0)

  const api = useMemo<CourseAdminApi>(() => {
    const set = (fn: (t: CourseTree) => CourseTree) => {
      setTree((t) => fn(t))
      setVersion((v) => v + 1)
    }
    return {
      updateCourse: (patch) => set((t) => ({ ...t, course: { ...t.course, ...patch } })),
      publish: () => set((t) => ({ ...t, course: { ...t.course, status: 'published' } })),
      unpublish: () => set((t) => ({ ...t, course: { ...t.course, status: 'draft' } })),
      archive: () => set((t) => ({ ...t, course: { ...t.course, status: 'archived' } })),
      updateCertificate: (patch) =>
        set((t) => ({ ...t, certificate: { ...t.certificate, ...patch } })),

      createModule: (title) => {
        const id = uid('m')
        set((t) => ({
          ...t,
          modules: [...t.modules, { id, title, order: t.modules.length, units: [] }],
        }))
        return id
      },
      updateModule: (id, title) =>
        set((t) => ({ ...t, modules: t.modules.map((m) => (m.id === id ? { ...m, title } : m)) })),
      deleteModule: (id) =>
        set((t) => {
          const gone = t.modules.find((m) => m.id === id)
          const unitIds = new Set(gone?.units.map((u) => u.id))
          return {
            ...t,
            modules: t.modules.filter((m) => m.id !== id).map((m, n) => ({ ...m, order: n })),
            assessments: t.assessments.filter((a) => !(a.unitId && unitIds.has(a.unitId))),
          }
        }),
      reorderModules: (ids) => set((t) => ({ ...t, modules: byIds(t.modules, ids) })),

      createUnit: (moduleId, input) => {
        const id = uid('u')
        set((t) => ({
          ...t,
          modules: t.modules.map((m) =>
            m.id === moduleId
              ? {
                  ...m,
                  units: [
                    ...m.units,
                    { id, moduleId, order: m.units.length, blocks: [], ...input },
                  ],
                }
              : m,
          ),
        }))
        return id
      },
      updateUnit: (id, input) =>
        set((t) => ({
          ...t,
          modules: mapUnits(t.modules, (u) => (u.id === id ? { ...u, ...input } : u)),
        })),
      deleteUnit: (id) =>
        set((t) => ({
          ...t,
          modules: t.modules.map((m) => ({
            ...m,
            units: m.units.filter((u) => u.id !== id).map((u, n) => ({ ...u, order: n })),
          })),
          assessments: t.assessments.filter((a) => a.unitId !== id),
        })),
      reorderUnits: (moduleId, ids) =>
        set((t) => ({
          ...t,
          modules: t.modules.map((m) =>
            m.id === moduleId ? { ...m, units: byIds(m.units, ids) } : m,
          ),
        })),

      createBlock: (unitId, input) => {
        const id = uid('b')
        set((t) => ({
          ...t,
          modules: mapUnits(t.modules, (u) =>
            u.id === unitId
              ? { ...u, blocks: [...u.blocks, { id, unitId, order: u.blocks.length, ...input }] }
              : u,
          ),
        }))
        return id
      },
      updateBlock: (id, input) =>
        set((t) => ({
          ...t,
          modules: mapUnits(t.modules, (u) => ({
            ...u,
            blocks: u.blocks.map((b): Block => (b.id === id ? { ...b, ...input } : b)),
          })),
        })),
      deleteBlock: (id) =>
        set((t) => ({
          ...t,
          modules: mapUnits(t.modules, (u) => ({
            ...u,
            blocks: u.blocks.filter((b) => b.id !== id).map((b, n) => ({ ...b, order: n })),
          })),
        })),
      reorderBlocks: (unitId, ids) =>
        set((t) => ({
          ...t,
          modules: mapUnits(t.modules, (u) =>
            u.id === unitId ? { ...u, blocks: byIds(u.blocks, ids) } : u,
          ),
        })),

      createAssessment: (input) => {
        const id = uid('a')
        set((t) => ({
          ...t,
          assessments: [
            ...t.assessments,
            { ...input, id, version: 1, hasAttempts: false, questions: [] },
          ],
        }))
        return id
      },
      updateAssessment: (id, input) =>
        set((t) => ({
          ...t,
          assessments: mapAssessment(t.assessments, id, (a) => ({
            ...a,
            ...input,
            // A quiz that already has attempts is versioned on change; past attempts keep version 1.
            version: a.hasAttempts ? a.version + 1 : a.version,
            hasAttempts: false,
          })),
        })),
      deleteAssessment: (id) =>
        set((t) => ({ ...t, assessments: t.assessments.filter((a) => a.id !== id) })),
      createQuestion: (assessmentId, input) => {
        const id = uid('q')
        set((t) => ({
          ...t,
          assessments: mapAssessment(t.assessments, assessmentId, (a) => ({
            ...a,
            questions: [...a.questions, { ...input, id, order: a.questions.length }],
          })),
        }))
        return id
      },
      updateQuestion: (assessmentId, id, input) =>
        set((t) => ({
          ...t,
          assessments: mapAssessment(t.assessments, assessmentId, (a) => ({
            ...a,
            questions: a.questions.map((x): Question => (x.id === id ? { ...x, ...input } : x)),
          })),
        })),
      deleteQuestion: (assessmentId, id) =>
        set((t) => ({
          ...t,
          assessments: mapAssessment(t.assessments, assessmentId, (a) => ({
            ...a,
            questions: a.questions.filter((x) => x.id !== id).map((x, n) => ({ ...x, order: n })),
          })),
        })),
      reorderQuestions: (assessmentId, ids) =>
        set((t) => ({
          ...t,
          assessments: mapAssessment(t.assessments, assessmentId, (a) => ({
            ...a,
            questions: byIds(a.questions, ids),
          })),
        })),
    }
  }, [])

  return { tree, api, version }
}
