import { createBrowserRouter, RouterProvider, Navigate } from 'react-router-dom'
import Layout from './components/Layout'
import Landing from './components/Landing'
import Login from './components/Login'
import Register from './components/Register'
import Onboarding from './components/Onboarding'
import Profile from './components/Profile'
import Feed from './components/Feed'
import Catalog from './components/Catalog'
import Inventory from './components/Inventory'
import SetPage from './components/SetPage'
import ArticlePage from './components/ArticlePage'
import ProtectedRoute from './components/ProtectedRoute'

const Protected = ({ children }) => (
  <ProtectedRoute><Layout>{children}</Layout></ProtectedRoute>
)

const router = createBrowserRouter([
  { path: '/',           element: <Layout><Landing /></Layout> },
  { path: '/login',      element: <Layout><Login /></Layout> },
  { path: '/register',   element: <Layout><Register /></Layout> },
  { path: '/onboarding', element: <Layout><Onboarding /></Layout> },
  { path: '/profile',    element: <Layout><Profile /></Layout> },
  { path: '/feed',       element: <Protected><Feed /></Protected> },
  { path: '/catalog',    element: <Protected><Catalog /></Protected> },
  { path: '/inventory',  element: <Protected><Inventory /></Protected> },
  { path: '/catalog/:category/:setId', element: <Protected><SetPage /></Protected> },
  { path: '/article/:articleId',       element: <Protected><ArticlePage /></Protected> },
  { path: '*',           element: <Navigate to="/" replace /> },
])

function App() {
  return <RouterProvider router={router} />
}

export default App
