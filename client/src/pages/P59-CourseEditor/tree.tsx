// client: hand-built page (P59 course editor). Curriculum: modules > units > blocks, all sortable.
import { type ReactNode, useId, useState } from 'react'
import { BlockDialog } from './blocks'
import { useCourse } from './ctx'
import { ModuleDialog, UnitDialog } from './dialogs'
import { SortableItem, SortableList } from './sortable'
import type { Block, ModuleNode, UnitNode } from './types'
import { BLOCK_ICON, ConfirmDialog, cvar, Ic, IconBtn, PATH, useCb } from './ui'

function Toggle({
  open,
  onToggle,
  controls,
  children,
}: {
  open: boolean
  onToggle: () => void
  controls: string
  children: ReactNode
}) {
  const { s } = useCb()
  return (
    <button
      type="button"
      className="cb-toggle"
      aria-expanded={open}
      aria-controls={controls}
      title={open ? s.collapse : s.expand}
      onClick={onToggle}
    >
      <Ic d={PATH.chevron} size={16} className={`cb-chev ${open ? 'open' : ''}`} />
      {children}
    </button>
  )
}

function AddRow({ label, onClick }: { label: string; onClick: () => void }) {
  return (
    <button type="button" className="cb-add-dash" onClick={onClick}>
      <Ic d={PATH.plus} size={16} />
      {label}
    </button>
  )
}

/* ---------------------------------------------------------------- block */

function BlockRow({
  block,
  handle,
  onEdit,
  onDelete,
}: {
  block: Block
  handle: ReactNode
  onEdit: () => void
  onDelete: () => void
}) {
  const { s, t } = useCb()
  const ic = BLOCK_ICON[block.type]
  const name = t(block.payload.title) || s.untitled
  return (
    <div className="cb-block">
      {handle}
      <span className="cb-bi" style={cvar(ic.c)} aria-hidden="true">
        <Ic d={ic.d} size={16} />
      </span>
      <span className="cb-bt">
        <b>{name}</b>
        <span>
          {s.blockTypesInfo[block.type][0]}
          {block.required ? <span className="cb-req"> · {s.required}</span> : null}
        </span>
      </span>
      {block.required ? <span className="tag mut">{s.required}</span> : null}
      <IconBtn d={PATH.pencil} label={`${s.editBlock}: ${name}`} onClick={onEdit} />
      <IconBtn d={PATH.trash} danger label={`${s.deleteBlock}: ${name}`} onClick={onDelete} />
    </div>
  )
}

/* ----------------------------------------------------------------- unit */

function UnitRow({ unit, handle }: { unit: UnitNode; handle: ReactNode }) {
  const { s, t, toast } = useCb()
  const { api } = useCourse()
  const [open, setOpen] = useState(false)
  const [dlg, setDlg] = useState<
    'edit' | 'delete' | { block: Block | 'new' } | { del: Block } | null
  >(null)
  const bodyId = useId()
  const blocks = [...unit.blocks].sort((a, b) => a.order - b.order)
  const name = t(unit.title) || s.untitled
  const first = blocks[0]
  const ic = first ? BLOCK_ICON[first.type] : { d: PATH.file, c: '#6D7782' }
  const nameOf = (id: string) =>
    t(blocks.find((b) => b.id === id)?.payload.title ?? { en: '', ar: '' }) || s.untitled

  return (
    <>
      <div className="cb-unit-h">
        {handle}
        <Toggle open={open} onToggle={() => setOpen((o) => !o)} controls={bodyId}>
          <span className="cb-bi" style={cvar(ic.c)} aria-hidden="true">
            <Ic d={ic.d} size={16} />
          </span>
          <span className="cb-bt">
            <b>{name}</b>
            <span>{s.blocksN(blocks.length)}</span>
          </span>
        </Toggle>
        <IconBtn d={PATH.pencil} label={`${s.editUnit}: ${name}`} onClick={() => setDlg('edit')} />
        <IconBtn
          d={PATH.trash}
          danger
          label={`${s.deleteUnit}: ${name}`}
          onClick={() => setDlg('delete')}
        />
      </div>
      <div id={bodyId} className="cb-unit-b" hidden={!open}>
        {blocks.length === 0 ? <p className="cb-empty-line">{s.emptyBlocks}</p> : null}
        <SortableList
          ids={blocks.map((b) => b.id)}
          nameOf={nameOf}
          onReorder={(ids) => api.reorderBlocks(unit.id, ids)}
        >
          {blocks.map((b) => (
            <SortableItem
              key={b.id}
              id={b.id}
              handleLabel={`${s.dragBlock}: ${nameOf(b.id)}`}
              className="cb-block-w"
            >
              {(h) => (
                <BlockRow
                  block={b}
                  handle={h}
                  onEdit={() => setDlg({ block: b })}
                  onDelete={() => setDlg({ del: b })}
                />
              )}
            </SortableItem>
          ))}
        </SortableList>
        <button type="button" className="cb-add-line" onClick={() => setDlg({ block: 'new' })}>
          <Ic d={PATH.plus} size={16} />
          {s.addBlock}
        </button>
      </div>

      {dlg === 'edit' ? (
        <UnitDialog
          initial={{ title: unit.title, durationMin: unit.durationMin }}
          onClose={() => setDlg(null)}
          onSave={(v) => {
            api.updateUnit(unit.id, v)
            setDlg(null)
            toast(s.tUnit)
          }}
        />
      ) : null}
      {dlg === 'delete' ? (
        <ConfirmDialog
          danger
          eyebrow={s.delEy}
          title={s.delUnitH(name)}
          body={s.delUnitP}
          confirmLabel={s.delBtn}
          onClose={() => setDlg(null)}
          onConfirm={() => {
            api.deleteUnit(unit.id)
            toast(s.tDeleted)
          }}
        />
      ) : null}
      {dlg && typeof dlg === 'object' && 'block' in dlg ? (
        <BlockDialog
          unitId={unit.id}
          initial={dlg.block === 'new' ? undefined : dlg.block}
          onClose={() => setDlg(null)}
          onSave={(input) => {
            if (dlg.block === 'new') {
              api.createBlock(unit.id, input)
              setOpen(true)
            } else api.updateBlock(dlg.block.id, input)
            setDlg(null)
            toast(s.tBlock)
          }}
        />
      ) : null}
      {dlg && typeof dlg === 'object' && 'del' in dlg ? (
        <ConfirmDialog
          danger
          eyebrow={s.delEy}
          title={s.delBlockH(t(dlg.del.payload.title))}
          body={s.delBlockP}
          confirmLabel={s.delBtn}
          onClose={() => setDlg(null)}
          onConfirm={() => {
            api.deleteBlock(dlg.del.id)
            toast(s.tDeleted)
          }}
        />
      ) : null}
    </>
  )
}

/* --------------------------------------------------------------- module */

function ModuleCard({
  module: m,
  handle,
  defaultOpen,
}: {
  module: ModuleNode
  handle: ReactNode
  defaultOpen: boolean
}) {
  const { s, t, toast } = useCb()
  const { api } = useCourse()
  const [open, setOpen] = useState(defaultOpen)
  const [dlg, setDlg] = useState<'edit' | 'delete' | 'unit' | null>(null)
  const bodyId = useId()
  const units = [...m.units].sort((a, b) => a.order - b.order)
  const name = t(m.title) || s.untitled
  const nameOf = (id: string) =>
    t(units.find((u) => u.id === id)?.title ?? { en: '', ar: '' }) || s.untitled
  return (
    <>
      <div className="cb-mod-h">
        {handle}
        <Toggle open={open} onToggle={() => setOpen((o) => !o)} controls={bodyId}>
          <span className="cb-bt cb-mt">
            <h3>{name}</h3>
            <span>{s.unitsN(units.length)}</span>
          </span>
        </Toggle>
        <IconBtn
          d={PATH.pencil}
          label={`${s.editModule}: ${name}`}
          onClick={() => setDlg('edit')}
        />
        <IconBtn
          d={PATH.trash}
          danger
          label={`${s.deleteModule}: ${name}`}
          onClick={() => setDlg('delete')}
        />
      </div>
      <div id={bodyId} className="cb-mod-b" hidden={!open}>
        <AddRow label={s.addUnit} onClick={() => setDlg('unit')} />
        {units.length === 0 ? <p className="cb-empty-line">{s.emptyUnits}</p> : null}
        <SortableList
          ids={units.map((u) => u.id)}
          nameOf={nameOf}
          onReorder={(ids) => api.reorderUnits(m.id, ids)}
        >
          {units.map((u) => (
            <SortableItem
              key={u.id}
              id={u.id}
              handleLabel={`${s.dragUnit}: ${nameOf(u.id)}`}
              className="cb-unit"
            >
              {(h) => <UnitRow unit={u} handle={h} />}
            </SortableItem>
          ))}
        </SortableList>
      </div>

      {dlg === 'edit' ? (
        <ModuleDialog
          initial={m.title}
          onClose={() => setDlg(null)}
          onSave={(title) => {
            api.updateModule(m.id, title)
            setDlg(null)
            toast(s.tModule)
          }}
        />
      ) : null}
      {dlg === 'unit' ? (
        <UnitDialog
          onClose={() => setDlg(null)}
          onSave={(v) => {
            api.createUnit(m.id, v)
            setOpen(true)
            setDlg(null)
            toast(s.tUnit)
          }}
        />
      ) : null}
      {dlg === 'delete' ? (
        <ConfirmDialog
          danger
          eyebrow={s.delEy}
          title={s.delModuleH(name)}
          body={s.delModuleP(units.length)}
          confirmLabel={s.delBtn}
          onClose={() => setDlg(null)}
          onConfirm={() => {
            api.deleteModule(m.id)
            toast(s.tDeleted)
          }}
        />
      ) : null}
    </>
  )
}

/* ----------------------------------------------------------------- tree */

export function ModuleTree() {
  const { s, t, toast } = useCb()
  const { tree, api } = useCourse()
  const [adding, setAdding] = useState(false)
  const modules = [...tree.modules].sort((a, b) => a.order - b.order)
  const nameOf = (id: string) =>
    t(modules.find((m) => m.id === id)?.title ?? { en: '', ar: '' }) || s.untitled
  return (
    <section aria-labelledby="cb-cur-h" className="cb-cur">
      <div className="cb-sec-h">
        <div>
          <span className="cb-kicker">{s.curriculum}</span>
          <h2 id="cb-cur-h">{s.modulesContent}</h2>
        </div>
        <button type="button" className="btn btn-primary" onClick={() => setAdding(true)}>
          <Ic d={PATH.plus} size={18} w={2.4} />
          {s.addModule}
        </button>
      </div>
      {modules.length === 0 ? (
        <div className="pcard cb-empty">
          <strong>{s.emptyModules}</strong>
          <p>{s.emptyModulesP}</p>
        </div>
      ) : null}
      <SortableList
        ids={modules.map((m) => m.id)}
        nameOf={nameOf}
        onReorder={(ids) => api.reorderModules(ids)}
      >
        {modules.map((m, n) => (
          <SortableItem
            key={m.id}
            id={m.id}
            handleLabel={`${s.dragModule}: ${nameOf(m.id)}`}
            className="pcard cb-mod"
          >
            {(h) => <ModuleCard module={m} handle={h} defaultOpen={n === 0} />}
          </SortableItem>
        ))}
      </SortableList>
      {adding ? (
        <ModuleDialog
          onClose={() => setAdding(false)}
          onSave={(title) => {
            api.createModule(title)
            setAdding(false)
            toast(s.tModule)
          }}
        />
      ) : null}
    </section>
  )
}
