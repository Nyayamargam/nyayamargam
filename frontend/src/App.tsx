import { useEffect } from 'react'
import { createBrowserRouter, RouterProvider } from 'react-router-dom'
import { getLang, setHtmlLang } from './i18n'
import { Home } from './pages/Home'
import { Intake } from './pages/Intake'
import { CaseWorkspace } from './pages/CaseWorkspace'

const router = createBrowserRouter([
  { path: '/', element: <Home /> },
  { path: '/intake/:code', element: <Intake /> },
  { path: '/case/:code', element: <CaseWorkspace /> },
])

export default function App() {
  useEffect(() => {
    setHtmlLang(getLang())
  }, [])

  return <RouterProvider router={router} />
}
