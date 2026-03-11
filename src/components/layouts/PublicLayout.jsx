import { Outlet } from 'react-router-dom'
import PublicHeader from './PublicHeader.jsx'

export default function PublicLayout() {
  return (
    <div className="min-h-screen" style={{ background: '#f4f7f5' }}>
      <PublicHeader />
      <main>
        <Outlet />
      </main>
      <footer
        className="mt-16 py-6 text-center text-xs text-gray-400"
        style={{ borderTop: '1px solid #e5e7eb' }}
      >
        © {new Date().getFullYear()} Department of Education — Division of Zamboanga Sibugay &nbsp;·&nbsp; All Rights Reserved
      </footer>
    </div>
  )
}