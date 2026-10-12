// client: hand-built page (P16 learner course player). The "Course content" menu: pre-test, modules, units
// with their blocks, post-test. Checks mark completed items, the current one is highlighted, and anything
// after the first unfinished block shows a lock.
import { type ReactNode, useEffect, useState } from 'react'
import { usePc } from './ctx'
import {
  assessmentStatus,
  attemptsOf,
  blockLocked,
  moduleProgress,
  same,
  type Target,
  targetHref,
  unitLocked,
  unitTarget,
} from './nav'
import { BLOCK_ICON, Ic, PATH, useLp } from './ui'

/** One flat row: icon, text, state. A link when the place is open, a disabled span when not. */
function Row({
  href,
  current,
  locked,
  done,
  icon,
  eyebrow,
  title,
  className,
  stateText,
  children,
}: {
  href: string
  current: boolean
  locked: boolean
  done: boolean
  icon: ReactNode
  eyebrow?: string
  title: string
  className: string
  stateText: string
  children?: ReactNode
}) {
  const { s } = useLp()
  const body = (
    <>
      <span className="ri" aria-hidden="true">
        {locked ? <Ic d={PATH.lock} size={14} /> : icon}
      </span>
      <span className="rt">
        {eyebrow ? <small>{eyebrow}</small> : null}
        <b>{title}</b>
      </span>
      {children}
      {locked ? (
        <span className="rs lk">{s.locked}</span>
      ) : done ? (
        <span className="rs ok" aria-hidden="true">
          <Ic d={PATH.check} size={14} w={3} />
        </span>
      ) : null}
      <span className="sr">{stateText}</span>
    </>
  )
  const cls = `${className} ${current ? 'on' : ''} ${locked ? 'locked' : ''}`
  return locked ? (
    <span className={cls} aria-disabled="true">
      {body}
    </span>
  ) : (
    <a className={cls} href={href} aria-current={current ? 'step' : undefined}>
      {body}
    </a>
  )
}

export function CourseMenu({ open, onToggle }: { open: boolean; onToggle: () => void }) {
  const { s, t, site, slug } = useLp()
  const { data, p, target } = usePc()
  const href = (x: Target) => targetHref(site, slug, x)

  const curUnit = target?.kind === 'block' ? target.unit : -1
  const curModule =
    curUnit >= 0
      ? data.modules.findIndex((m) => m.unitIds.includes(data.unitOrder[curUnit] as string))
      : 0
  const [mods, setMods] = useState<Record<string, boolean>>(() => ({
    [data.modules[Math.max(0, curModule)]?.id ?? '']: true,
  }))
  const [units, setUnits] = useState<Record<string, boolean>>(() =>
    curUnit >= 0 ? { [data.unitOrder[curUnit] as string]: true } : {},
  )
  // Moving to a block opens its module and unit; the learner's own folding is kept otherwise.
  // biome-ignore lint/correctness/useExhaustiveDependencies: only the place changes what opens
  useEffect(() => {
    if (curUnit < 0) return
    const uid = data.unitOrder[curUnit] as string
    const mid = data.modules[curModule]?.id
    setUnits((u) => (u[uid] ? u : { ...u, [uid]: true }))
    if (mid) setMods((m) => (m[mid] ? m : { ...m, [mid]: true }))
  }, [curUnit, curModule])

  const pre = data.preId ? data.assessments[data.preId] : undefined
  const post = data.postId ? data.assessments[data.postId] : undefined
  const preAttempted = !!data.preId && attemptsOf(p, data.preId).length > 0
  const postStatus = assessmentStatus(data, p, data.postId)

  return (
    <nav className={`pcard lp-menu ${open ? 'is-open' : ''}`} aria-label={s.menuH} id="lp-menu">
      <div className="hd">
        <h2>
          <Ic d={PATH.book} size={18} />
          {s.menuH}
        </h2>
        <button
          type="button"
          className="lp-menu-x"
          onClick={onToggle}
          aria-label={s.close}
          aria-expanded={open}
          aria-controls="lp-menu"
        >
          <Ic d={PATH.close} size={18} />
        </button>
      </div>

      {pre ? (
        <Row
          className="lp-row lp-row-a"
          href={href({ kind: 'pre' })}
          current={target?.kind === 'pre'}
          locked={false}
          done={preAttempted}
          icon={<Ic d={PATH.clipboard} size={16} />}
          eyebrow={s.preTest}
          title={t(pre.title)}
          stateText={preAttempted ? s.attempted : ''}
        />
      ) : null}

      <ul className="lp-mods">
        {data.modules.map((m, mi) => {
          const pct = moduleProgress(data, p, mi)
          const isOpen = !!mods[m.id]
          return (
            <li key={m.id} className="lp-mod">
              <button
                type="button"
                className="lp-mh"
                aria-expanded={isOpen}
                aria-controls={`lp-m-${m.id}`}
                onClick={() => setMods((x) => ({ ...x, [m.id]: !x[m.id] }))}
              >
                <span className={`lp-num ${pct === 100 ? 'ok' : ''}`} aria-hidden="true">
                  {pct === 100 ? <Ic d={PATH.check} size={14} w={3} /> : mi + 1}
                </span>
                <span className="rt">
                  <small className="sr">{s.moduleN(mi + 1)}</small>
                  <b>{t(m.title)}</b>
                  <span className="cap">{s.unitMeta(m.unitIds.length, pct)}</span>
                </span>
                <Ic d={PATH.chevron} size={16} className={`lp-chev ${isOpen ? 'up' : ''}`} />
              </button>
              {isOpen ? (
                <ul className="lp-units" id={`lp-m-${m.id}`}>
                  {m.unitIds.map((uid) => {
                    const ui = data.unitOrder.indexOf(uid)
                    const u = data.units[uid]
                    if (!u) return null
                    const done = !!p.unitsDone[uid]
                    const lockedU = unitLocked(data, p, ui)
                    const unitOpen = !!units[uid]
                    const isCur = curUnit === ui
                    return (
                      <li key={uid} className="lp-unit">
                        <div className={`lp-urow ${isCur ? 'cur' : ''} ${lockedU ? 'locked' : ''}`}>
                          <button
                            type="button"
                            className="lp-ux"
                            aria-expanded={unitOpen}
                            aria-controls={`lp-u-${uid}`}
                            aria-label={`${unitOpen ? s.hideBlocks : s.showBlocks}: ${t(u.title)}`}
                            onClick={() => setUnits((x) => ({ ...x, [uid]: !x[uid] }))}
                          >
                            <Ic
                              d={PATH.chevronEnd}
                              size={14}
                              className={`lp-chev-e ${unitOpen ? 'down' : ''}`}
                            />
                          </button>
                          {lockedU ? (
                            <span className="lp-ul" aria-disabled="true" title={s.lockedUnitTip}>
                              <Ic d={PATH.lock} size={14} />
                              <b>{t(u.title)}</b>
                              <span className="rs lk">{s.locked}</span>
                            </span>
                          ) : (
                            <a className="lp-ul" href={href(unitTarget(data, p, ui))}>
                              <b>{t(u.title)}</b>
                              {done ? (
                                <span className="rs ok" aria-hidden="true">
                                  <Ic d={PATH.check} size={14} w={3} />
                                </span>
                              ) : null}
                              {done ? <span className="sr">{s.completed}</span> : null}
                            </a>
                          )}
                        </div>
                        {unitOpen ? (
                          <ul className="lp-blocks" id={`lp-u-${uid}`}>
                            {u.blocks.map((b, bi) => {
                              const here: Target = { kind: 'block', unit: ui, block: bi }
                              const lockedB = blockLocked(data, p, ui, bi)
                              const doneB = !!p.blocksDone[b.id]
                              const title = t(b.payload.title)
                              return (
                                <li key={b.id}>
                                  <Row
                                    className="lp-row lp-row-b"
                                    href={href(here)}
                                    current={!!target && same(target, here)}
                                    locked={lockedB}
                                    done={doneB}
                                    icon={<Ic d={BLOCK_ICON[b.type]} size={15} />}
                                    title={title}
                                    stateText={`${s.blockType[b.type]}${doneB ? `, ${s.completed}` : ''}`}
                                  />
                                </li>
                              )
                            })}
                          </ul>
                        ) : null}
                      </li>
                    )
                  })}
                </ul>
              ) : null}
            </li>
          )
        })}
      </ul>

      {post ? (
        <Row
          className="lp-row lp-row-a"
          href={href({ kind: 'post' })}
          current={target?.kind === 'post'}
          locked={postStatus === 'locked'}
          done={postStatus === 'passed'}
          icon={<Ic d={PATH.clipboard} size={16} />}
          eyebrow={s.postTest}
          title={t(post.title)}
          stateText={postStatus === 'passed' ? s.completed : ''}
        />
      ) : null}
    </nav>
  )
}
