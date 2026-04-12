import { BrowserRouter } from 'react-router-dom'
import { AppRoutes } from './app/Routes'

export default function App() {
  return (
    <BrowserRouter>
      <AppRoutes />
    </BrowserRouter>
  )
}
