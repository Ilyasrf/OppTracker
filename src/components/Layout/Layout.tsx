import { Outlet } from 'react-router-dom'
import Navbar from './Navbar'
export default function Layout() {
  return (
    <div className="min-h-screen">
      <a href="#main-content" className="skip-link">
        Skip to content
      </a>
      <Navbar />
      <main id="main-content" className="main-shell">
        <Outlet />
      </main>
      <footer className="site-footer">
        <span>OppNote / A little more organized.</span>
        <span className="handwritten text-xl">make room for what’s next</span>
      </footer>
    </div>
  )
}
