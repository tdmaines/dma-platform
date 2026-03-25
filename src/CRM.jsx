import { useState, useEffect } from 'react'
import { supabase } from './supabase'
import {
  DndContext, closestCenter, PointerSensor, useSensor, useSensors, DragOverlay
} from '@dnd-kit/core'
import { useDraggable, useDroppable } from '@dnd-kit/core'

const COLUMNS = [
  { key: 'new', label: 'New', color: '#1565C0', bg: '#E3F2FD' },
  { key: 'pending', label: 'Pending', color: '#F57F17', bg: '#FFF8E1' },
  { key: 'won', label: 'Won', color: '#2E7D32', bg: '#E8F5E9' },
  { key: 'lost', label: 'Lost', color: '#C62828', bg: '#FFEBEE' },
  { key: 'deferred', label: 'Deferred', color: '#6A1B9A', bg: '#F3E5F5' },
]

const END_MARKETS = [
  'Commercial','Government','Health Care','Higher-Ed','Industrial','K-12','Mixed-Use',
]

const MONTHS = ['January','February','March','April','May','June','July','August','September','October','November','December']
const DAYS = ['Sun','Mon','Tue','Wed','Thu','Fri','Sat']

const emptyForm = {
  name: '',
  end_market: 'Commercial',
  status: 'new',
  estimated_value: '',
  prebid_date: '',
  due_date: '',
  manufacturer_system: '',
  loss_reason: '',
  estimator_id: '',
}

function DraggableCard({ opp, onClick, estimators }) {
  const { attributes, listeners, setNodeRef, transform, isDragging } = useDraggable({ id: opp.id })
  const estimator = estimators.find(e => e.id === opp.estimator_id)
  const style = {
    transform: transform ? `translate(${transform.x}px, ${transform.y}px)` : undefined,
    opacity: isDragging ? 0.4 : 1,
    backgroundColor: 'white',
    borderRadius: '6px',
    padding: '0.75rem',
    marginBottom: '0.5rem',
    border: '1px solid #e0e0e0',
    cursor: 'grab',
    boxShadow: '0 1px 3px rgba(0,0,0,0.08)',
  }
  return (
    <div ref={setNodeRef} style={style} {...listeners} {...attributes}>
      <div
        style={{ fontWeight: '600', fontSize: '0.85rem', color: '#1E4D78', marginBottom: '0.35rem', cursor: 'pointer' }}
        onPointerDown={e => e.stopPropagation()}
        onClick={onClick}
      >
        {opp.name}
      </div>
      {opp.estimated_value && (
        <div style={{ fontSize: '0.8rem', color: '#333', marginBottom: '0.2rem' }}>
          ${Number(opp.estimated_value).toLocaleString()}
        </div>
      )}
      {opp.due_date && (
        <div style={{ fontSize: '0.75rem', color: '#888' }}>
          Due: {new Date(opp.due_date).toLocaleDateString()}
        </div>
      )}
      <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '0.3rem' }}>
        <span style={{ fontSize: '0.72rem', color: '#aaa' }}>{opp.end_market || '—'}</span>
        {estimator && <span style={{ fontSize: '0.72rem', color: '#888' }}>{estimator.name}</span>}
      </div>
    </div>
  )
}

function DroppableColumn({ col, opps, onCardClick, onAdd, estimators }) {
  const { setNodeRef, isOver } = useDroppable({ id: col.key })
  return (
    <div style={{ flex: 1, minWidth: '200px', display: 'flex', flexDirection: 'column' }}>
      <div style={{
        padding: '0.6rem 0.75rem',
        borderRadius: '6px 6px 0 0',
        backgroundColor: col.bg,
        borderBottom: `2px solid ${col.color}`,
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: '0.5rem',
      }}>
        <span style={{ fontWeight: '600', fontSize: '0.82rem', color: col.color }}>{col.label}</span>
        <span style={{
          backgroundColor: col.color, color: 'white', borderRadius: '10px',
          padding: '0.1rem 0.5rem', fontSize: '0.72rem', fontWeight: '600',
        }}>{opps.length}</span>
      </div>
      <div ref={setNodeRef} style={{
        flex: 1, minHeight: '200px', padding: '0.25rem',
        backgroundColor: isOver ? '#f0f4f8' : 'transparent',
        borderRadius: '4px', transition: 'background-color 0.15s',
      }}>
        {opps.map(opp => (
          <DraggableCard key={opp.id} opp={opp} onClick={() => onCardClick(opp)} estimators={estimators} />
        ))}
      </div>
      <button onClick={() => onAdd(col.key)} style={{
        marginTop: '0.5rem', padding: '0.4rem', backgroundColor: 'transparent',
        border: '1px dashed #ccc', borderRadius: '4px', color: '#aaa',
        cursor: 'pointer', fontSize: '0.8rem', width: '100%',
      }}>
        + Add
      </button>
    </div>
  )
}

function CalendarView({ opportunities, onCardClick, estimators }) {
  const today = new Date()
  const [year, setYear] = useState(today.getFullYear())
  const [month, setMonth] = useState(today.getMonth())

  const firstDay = new Date(year, month, 1).getDay()
  const daysInMonth = new Date(year, month + 1, 0).getDate()

  const prevMonth = () => { if (month === 0) { setMonth(11); setYear(y => y - 1) } else setMonth(m => m - 1) }
  const nextMonth = () => { if (month === 11) { setMonth(0); setYear(y => y + 1) } else setMonth(m => m + 1) }

  const getEventsForDay = (day) => {
    const dateStr = `${year}-${String(month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`
    return opportunities.filter(o => o.prebid_date === dateStr || o.due_date === dateStr)
  }

  const cells = []
  for (let i = 0; i < firstDay; i++) cells.push(null)
  for (let d = 1; d <= daysInMonth; d++) cells.push(d)

  return (
    <div style={{ backgroundColor: 'white', borderRadius: '8px', border: '1px solid #e0e0e0', overflow: 'hidden' }}>
      {/* Calendar Header */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '1rem 1.25rem', borderBottom: '1px solid #e0e0e0' }}>
        <button onClick={prevMonth} style={{ border: 'none', background: 'none', cursor: 'pointer', fontSize: '1.2rem', color: '#555' }}>‹</button>
        <span style={{ fontWeight: '600', color: '#1E4D78', fontSize: '1rem' }}>{MONTHS[month]} {year}</span>
        <button onClick={nextMonth} style={{ border: 'none', background: 'none', cursor: 'pointer', fontSize: '1.2rem', color: '#555' }}>›</button>
      </div>

      {/* Day Headers */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', borderBottom: '1px solid #e0e0e0' }}>
        {DAYS.map(d => (
          <div key={d} style={{ padding: '0.5rem', textAlign: 'center', fontSize: '0.75rem', fontWeight: '600', color: '#888' }}>{d}</div>
        ))}
      </div>

      {/* Calendar Grid */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)' }}>
        {cells.map((day, i) => {
          const events = day ? getEventsForDay(day) : []
          const isToday = day === today.getDate() && month === today.getMonth() && year === today.getFullYear()
          return (
            <div key={i} style={{
              minHeight: '90px',
              padding: '0.4rem',
              borderRight: '1px solid #f0f0f0',
              borderBottom: '1px solid #f0f0f0',
              backgroundColor: day ? 'white' : '#fafafa',
            }}>
              {day && (
                <>
                  <div style={{
                    fontSize: '0.8rem',
                    fontWeight: isToday ? '700' : '400',
                    color: isToday ? 'white' : '#555',
                    backgroundColor: isToday ? '#1E4D78' : 'transparent',
                    borderRadius: '50%',
                    width: '22px',
                    height: '22px',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    marginBottom: '0.25rem',
                  }}>{day}</div>
                  {events.map(opp => {
                    const isPreBid = opp.prebid_date === `${year}-${String(month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`
                    return (
                      <div
                        key={opp.id + (isPreBid ? '-pre' : '-due')}
                        onClick={() => onCardClick(opp)}
                        style={{
                          fontSize: '0.7rem',
                          padding: '0.15rem 0.35rem',
                          marginBottom: '0.2rem',
                          borderRadius: '3px',
                          cursor: 'pointer',
                          backgroundColor: isPreBid ? '#E3F2FD' : '#FFF8E1',
                          color: isPreBid ? '#1565C0' : '#F57F17',
                          fontWeight: '500',
                          overflow: 'hidden',
                          whiteSpace: 'nowrap',
                          textOverflow: 'ellipsis',
                        }}
                      >
                        {isPreBid ? '📋 ' : '📅 '}{opp.name}
                      </div>
                    )
                  })}
                </>
              )}
            </div>
          )
        })}
      </div>

      {/* Legend */}
      <div style={{ padding: '0.75rem 1.25rem', borderTop: '1px solid #e0e0e0', display: 'flex', gap: '1.5rem' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', fontSize: '0.75rem', color: '#555' }}>
          <span style={{ backgroundColor: '#E3F2FD', color: '#1565C0', padding: '0.1rem 0.4rem', borderRadius: '3px', fontSize: '0.7rem' }}>📋 Pre-Bid</span>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', fontSize: '0.75rem', color: '#555' }}>
          <span style={{ backgroundColor: '#FFF8E1', color: '#F57F17', padding: '0.1rem 0.4rem', borderRadius: '3px', fontSize: '0.7rem' }}>📅 Due Date</span>
        </div>
      </div>
    </div>
  )
}

export default function CRM() {
  const [opportunities, setOpportunities] = useState([])
  const [estimators, setEstimators] = useState([])
  const [loading, setLoading] = useState(true)
  const [showForm, setShowForm] = useState(false)
  const [form, setForm] = useState(emptyForm)
  const [saving, setSaving] = useState(false)
  const [selectedOpp, setSelectedOpp] = useState(null)
  const [activeId, setActiveId] = useState(null)
  const [view, setView] = useState('kanban')

  const sensors = useSensors(useSensor(PointerSensor, { activationConstraint: { distance: 5 } }))

  useEffect(() => {
    fetchOpportunities()
    fetchEstimators()
  }, [])

  const fetchOpportunities = async () => {
    setLoading(true)
    const { data, error } = await supabase.from('opportunities').select('*').order('created_at', { ascending: false })
    if (!error) setOpportunities(data)
    setLoading(false)
  }

  const fetchEstimators = async () => {
    const { data } = await supabase.from('users').select('id, name').eq('role', 'estimator')
    if (data) setEstimators(data)
  }

  const handleSave = async () => {
    setSaving(true)
    const payload = {
      ...form,
      estimated_value: form.estimated_value ? parseFloat(form.estimated_value) : null,
      prebid_date: form.prebid_date || null,
      due_date: form.due_date || null,
      estimator_id: form.estimator_id || null,
    }
    if (form.id) {
      await supabase.from('opportunities').update(payload).eq('id', form.id)
    } else {
      await supabase.from('opportunities').insert([payload])
    }
    setForm(emptyForm)
    setShowForm(false)
    setSelectedOpp(null)
    fetchOpportunities()
    setSaving(false)
  }

  const handleDragEnd = async ({ active, over }) => {
    setActiveId(null)
    if (!over || active.id === over.id) return
    const newStatus = over.id
    if (!COLUMNS.find(c => c.key === newStatus)) return
    setOpportunities(prev => prev.map(o => o.id === active.id ? { ...o, status: newStatus } : o))
    await supabase.from('opportunities').update({ status: newStatus }).eq('id', active.id)
  }

  const handleCardClick = (opp) => {
    setForm({
      ...opp,
      estimated_value: opp.estimated_value || '',
      prebid_date: opp.prebid_date || '',
      due_date: opp.due_date || '',
      estimator_id: opp.estimator_id || '',
    })
    setSelectedOpp(opp)
    setShowForm(true)
  }

  const handleAdd = (status) => {
    setForm({ ...emptyForm, status })
    setShowForm(true)
  }

  const closeForm = () => {
    setShowForm(false)
    setForm(emptyForm)
    setSelectedOpp(null)
  }

  const activeOpp = activeId ? opportunities.find(o => o.id === activeId) : null

  if (loading) return <div style={{ color: '#888', padding: '2rem' }}>Loading...</div>

  return (
    <div style={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          <div style={{ fontSize: '0.85rem', color: '#888', marginRight: '0.5rem' }}>{opportunities.length} total</div>
          {/* View Toggle */}
          <div style={{ display: 'flex', border: '1px solid #ddd', borderRadius: '4px', overflow: 'hidden' }}>
            {['kanban', 'calendar'].map(v => (
              <button
                key={v}
                onClick={() => setView(v)}
                style={{
                  padding: '0.4rem 0.9rem',
                  border: 'none',
                  backgroundColor: view === v ? '#1E4D78' : 'white',
                  color: view === v ? 'white' : '#555',
                  cursor: 'pointer',
                  fontSize: '0.82rem',
                  textTransform: 'capitalize',
                }}
              >
                {v === 'kanban' ? '⬛ Kanban' : '📅 Calendar'}
              </button>
            ))}
          </div>
        </div>
        <button
          onClick={() => { setForm(emptyForm); setShowForm(true) }}
          style={{ padding: '0.5rem 1.25rem', backgroundColor: '#1E4D78', color: 'white', border: 'none', borderRadius: '4px', cursor: 'pointer', fontSize: '0.9rem' }}
        >
          + New Opportunity
        </button>
      </div>

      {/* Kanban View */}
      {view === 'kanban' && (
        <DndContext sensors={sensors} collisionDetection={closestCenter} onDragStart={({ active }) => setActiveId(active.id)} onDragEnd={handleDragEnd}>
          <div style={{ display: 'flex', gap: '0.75rem', flex: 1, overflowX: 'auto', alignItems: 'flex-start' }}>
            {COLUMNS.map(col => (
              <DroppableColumn
                key={col.key}
                col={col}
                opps={opportunities.filter(o => o.status === col.key)}
                onCardClick={handleCardClick}
                onAdd={handleAdd}
                estimators={estimators}
              />
            ))}
          </div>
          <DragOverlay>
            {activeOpp && (
              <div style={{ backgroundColor: 'white', borderRadius: '6px', padding: '0.75rem', border: '1px solid #ccc', boxShadow: '0 4px 12px rgba(0,0,0,0.15)', width: '200px' }}>
                <div style={{ fontWeight: '600', fontSize: '0.85rem', color: '#1E4D78' }}>{activeOpp.name}</div>
                {activeOpp.estimated_value && <div style={{ fontSize: '0.8rem', color: '#333' }}>${Number(activeOpp.estimated_value).toLocaleString()}</div>}
              </div>
            )}
          </DragOverlay>
        </DndContext>
      )}

      {/* Calendar View */}
      {view === 'calendar' && (
        <CalendarView opportunities={opportunities} onCardClick={handleCardClick} estimators={estimators} />
      )}

      {/* Form Modal */}
      {showForm && (
        <div style={{ position: 'fixed', inset: 0, backgroundColor: 'rgba(0,0,0,0.4)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000 }}>
          <div style={{ backgroundColor: 'white', borderRadius: '8px', padding: '2rem', width: '520px', maxHeight: '90vh', overflowY: 'auto' }}>
            <h3 style={{ margin: '0 0 1.5rem', color: '#1E4D78' }}>{selectedOpp ? 'Edit Opportunity' : 'New Opportunity'}</h3>
            <div style={{ display: 'grid', gap: '1rem' }}>
              <div>
                <label style={labelStyle}>Opportunity Name *</label>
                <input style={inputStyle} value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} placeholder="e.g. Scranton School District - Building A" />
              </div>
              <div>
                <label style={labelStyle}>Estimator</label>
                <select style={inputStyle} value={form.estimator_id} onChange={e => setForm({ ...form, estimator_id: e.target.value })}>
                  <option value="">— Select Estimator —</option>
                  {estimators.map(e => <option key={e.id} value={e.id}>{e.name}</option>)}
                </select>
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                <div>
                  <label style={labelStyle}>End Market</label>
                  <select style={inputStyle} value={form.end_market} onChange={e => setForm({ ...form, end_market: e.target.value })}>
                    {END_MARKETS.map(m => <option key={m} value={m}>{m}</option>)}
                  </select>
                </div>
                <div>
                  <label style={labelStyle}>Status</label>
                  <select style={inputStyle} value={form.status} onChange={e => setForm({ ...form, status: e.target.value })}>
                    <option value="new">New</option>
                    <option value="pending">Pending</option>
                    <option value="won">Won</option>
                    <option value="lost">Lost</option>
                    <option value="deferred">Deferred</option>
                  </select>
                </div>
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                <div>
                  <label style={labelStyle}>Pre-Bid Date</label>
                  <input style={inputStyle} type="date" value={form.prebid_date} onChange={e => setForm({ ...form, prebid_date: e.target.value })} />
                </div>
                <div>
                  <label style={labelStyle}>Due Date</label>
                  <input style={inputStyle} type="date" value={form.due_date} onChange={e => setForm({ ...form, due_date: e.target.value })} />
                </div>
              </div>
              <div>
                <label style={labelStyle}>Estimated Value ($)</label>
                <input style={inputStyle} type="number" value={form.estimated_value} onChange={e => setForm({ ...form, estimated_value: e.target.value })} placeholder="0.00" />
              </div>
              <div>
                <label style={labelStyle}>Manufacturer System</label>
                <input style={inputStyle} value={form.manufacturer_system} onChange={e => setForm({ ...form, manufacturer_system: e.target.value })} placeholder="e.g. Carlisle Sure-Weld TPO" />
              </div>
              {form.status === 'lost' && (
                <div>
                  <label style={labelStyle}>Loss Reason</label>
                  <input style={inputStyle} value={form.loss_reason} onChange={e => setForm({ ...form, loss_reason: e.target.value })} placeholder="e.g. Price, competitor, no award" />
                </div>
              )}
            </div>
            <div style={{ display: 'flex', gap: '0.75rem', marginTop: '1.5rem', justifyContent: 'flex-end' }}>
              <button onClick={closeForm} style={{ padding: '0.5rem 1.25rem', border: '1px solid #1E4D78', borderRadius: '4px', cursor: 'pointer', backgroundColor: 'white', color: '#1E4D78', fontWeight: '500' }}>
                Cancel
              </button>
              <button onClick={handleSave} disabled={!form.name || saving} style={{ padding: '0.5rem 1.25rem', backgroundColor: '#1E4D78', color: 'white', border: 'none', borderRadius: '4px', cursor: 'pointer' }}>
                {saving ? 'Saving...' : 'Save'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

const labelStyle = { display: 'block', fontSize: '0.8rem', color: '#555', marginBottom: '0.3rem', fontWeight: '500' }
const inputStyle = { width: '100%', padding: '0.5rem', border: '1px solid #ddd', borderRadius: '4px', fontSize: '0.88rem', boxSizing: 'border-box' }