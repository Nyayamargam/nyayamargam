import { createBrowserRouter, RouterProvider } from 'react-router-dom'
import { Home } from './pages/Home'
import { Intake } from './pages/Intake'
import { CaseWorkspace } from './pages/CaseWorkspace'

const router = createBrowserRouter([
  { path: '/', element: <Home /> },
  { path: '/intake/:code', element: <Intake /> },
  { path: '/case/:code', element: <CaseWorkspace /> },
])

export default function App() {
  return <RouterProvider router={router} />
}
