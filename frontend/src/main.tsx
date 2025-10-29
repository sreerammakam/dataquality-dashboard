import React from 'react'
import { createRoot } from 'react-dom/client'
import { createBrowserRouter, RouterProvider } from 'react-router-dom'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import App from './pages/App'
import Dashboard from './pages/Dashboard'
import Datasets from './pages/Datasets'
import Issues from './pages/Issues'
import Rules from './pages/Rules'
import LoadData from './pages/LoadData'
import SchemaPage from './pages/SchemaPage'

const router = createBrowserRouter([
  {
    path: '/',
    element: <App />,
    children: [
      { index: true, element: <Dashboard /> },
      { path: 'dashboard', element: <Dashboard /> },
      { path: 'datasets', element: <Datasets /> },
      { path: 'issues', element: <Issues /> },
      { path: 'rules', element: <Rules /> },
      { path: 'load-data', element: <LoadData /> },
      { path: 'schema', element: <SchemaPage /> }
    ]
  }
])

const queryClient = new QueryClient()

createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <QueryClientProvider client={queryClient}>
      <RouterProvider router={router} />
    </QueryClientProvider>
  </React.StrictMode>
)
