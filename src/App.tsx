import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import './App.css'
import Dashboard from   './pages/dashboard';
import Layout from './layout/layout';

function App() {

  return (
    <Router>
    <Routes>
      <Route element={<Layout />}>
        <Route path="/" element={<Dashboard />} />
      </Route>
    </Routes>
  </Router>
  )
}

export default App
