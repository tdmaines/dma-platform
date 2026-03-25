import { useState } from 'react'
import { supabase } from './supabase'

const navItems = [
  { label: 'Home', key: 'home' },
  {
    label: 'Customers', key: 'customers', children: [
      { label: 'Companies', key: 'companies' },
      { label: 'Properties', key: 'properties' },
      { label: 'Contacts', key: 'contacts' },
    ]
  },
  { label: 'CRM', key: 'crm' },
  { label: 'Service', key: 'service' },
  { label: 'Production', key: 'production' },
  { label: 'Reporting', key: 'reporting' },
  { label: 'Admin Settings', key: 'admin' },
]

export default function Layout({ session, currentPage, setCurrentPage, children }) {
  const [expanded, setExpanded] = useState({ customers: true })

  const handleLogout = async () => {
    await supabase.auth.signOut()
  }

  const toggleExpand = (key) => {
    setExpanded(prev => ({ ...prev, [key]: !prev[key] }))
  }

  return (
    <div style={{ display: 'flex', height: '100vh', fontFamily: 'Arial', backgroundColor: '#f4f5f7' }}>
      {/* Sidebar */}
      <div style={{
        width: '220px',
        backgroundColor: '#1E4D78',
        display: 'flex',
        flexDirection: 'column',
        flexShrink: 0,
        overflowY: 'auto',
      }}>
        {/* Logo */}
        <div style={{ padding: '1.5rem 1.25rem', borderBottom: '1px solid rgba(255,255,255,0.1)' }}>
          <div style={{ color: 'white', fontWeight: 'bold', fontSize: '1.1rem' }}>DMA Platform</div>
          <div style={{ color: 'rgba(255,255,255,0.5)', fontSize: '0.75rem', marginTop: '0.25rem' }}>
            {session.user.email}
          </div>
        </div>

        {/* Nav Items */}
        <nav style={{ flex: 1, padding: '0.75rem 0' }}>
          {navItems.map(item => (
            <div key={item.key}>
              <div
                onClick={() => {
                  if (item.children) {
                    toggleExpand(item.key)
                  } else {
                    setCurrentPage(item.key)
                  }
                }}
                style={{
                  padding: '0.7rem 1.25rem',
                  color: currentPage === item.key ? 'white' : 'rgba(255,255,255,0.75)',
                  backgroundColor: currentPage === item.key ? 'rgba(255,255,255,0.15)' : 'transparent',
                  cursor: 'pointer',
                  fontSize: '0.9rem',
                  borderLeft: currentPage === item.key ? '3px solid white' : '3px solid transparent',
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                }}
              >
                <span>{item.label}</span>
                {item.children && (
                  <span style={{ fontSize: '0.7rem', opacity: 0.6 }}>
                    {expanded[item.key] ? '▲' : '▼'}
                  </span>
                )}
              </div>

              {item.children && expanded[item.key] && item.children.map(child => (
                <div
                  key={child.key}
                  onClick={() => setCurrentPage(child.key)}
                  style={{
                    padding: '0.55rem 1.25rem 0.55rem 2rem',
                    color: currentPage === child.key ? 'white' : 'rgba(255,255,255,0.55)',
                    backgroundColor: currentPage === child.key ? 'rgba(255,255,255,0.1)' : 'transparent',
                    cursor: 'pointer',
                    fontSize: '0.82rem',
                    borderLeft: currentPage === child.key ? '3px solid rgba(255,255,255,0.7)' : '3px solid transparent',
                  }}
                >
                  {child.label}
                </div>
              ))}
            </div>
          ))}
        </nav>

        {/* Logout */}
        <div style={{ padding: '1rem 1.25rem', borderTop: '1px solid rgba(255,255,255,0.1)' }}>
          <button
            onClick={handleLogout}
            style={{
              width: '100%',
              padding: '0.5rem',
              backgroundColor: 'transparent',
              border: '1px solid rgba(255,255,255,0.3)',
              color: 'rgba(255,255,255,0.7)',
              cursor: 'pointer',
              borderRadius: '4px',
              fontSize: '0.85rem',
            }}
          >
            Log Out
          </button>
        </div>
      </div>

      {/* Main Content */}
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
        {/* Top Bar */}
        <div style={{
          backgroundColor: 'white',
          padding: '1rem 1.5rem',
          borderBottom: '1px solid #e0e0e0',
          fontSize: '1.1rem',
          fontWeight: 'bold',
          color: '#1E4D78',
        }}>
          {navItems.flatMap(i => i.children ? i.children : [i]).find(i => i.key === currentPage)?.label || 'Home'}
        </div>

        {/* Page Content */}
        <div style={{ flex: 1, overflow: 'auto', padding: '1.5rem' }}>
          {children}
        </div>
      </div>
    </div>
  )
}