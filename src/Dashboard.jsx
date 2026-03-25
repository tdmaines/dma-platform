export default function Dashboard() {
  return (
    <div>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '1rem', marginBottom: '2rem' }}>
        {[
          { label: 'Open Opportunities', value: '—' },
          { label: 'Active Projects', value: '—' },
          { label: 'Tasks Due Today', value: '—' },
          { label: 'Won This Month', value: '—' },
        ].map(card => (
          <div key={card.label} style={{
            backgroundColor: 'white',
            padding: '1.25rem',
            borderRadius: '8px',
            border: '1px solid #e0e0e0',
          }}>
            <div style={{ fontSize: '0.8rem', color: '#888', marginBottom: '0.5rem' }}>{card.label}</div>
            <div style={{ fontSize: '1.75rem', fontWeight: 'bold', color: '#1E4D78' }}>{card.value}</div>
          </div>
        ))}
      </div>
      <div style={{ color: '#888', fontSize: '0.9rem' }}>Dashboard widgets will populate as data is added.</div>
    </div>
  )
}