import Login from './pages/login'
import Dashboard from './pages/dashboard'
import Tasks from './pages/tasks'
import Trash from './pages/trash'
import Users from './pages/users'
import TaskDetails from './pages/taskDetails'
import { Routes, Route, Navigate, Outlet, useLocation } from 'react-router-dom'
import { useSelector } from 'react-redux'

function Layout() {
  const { user } = useSelector(state => state.auth);
  const location = useLocation();
  return user ? (
    <div className='w-full h-screen flex flex-col md:flex-row'>
      <div className='w-1/5 h-screen bg-white sticky top-0 hidden md:block'>
        {/* Sidebar component here */}
      </div>
      {/* Mobile sidebar component here */}
      <div className='flex-1 overflow-y-auto'>
        {/* Navbar component here */}
        <div className='p-4 2xl:px-10'>
          <Outlet/>
        </div>
      </div>
    </div>
  ) : (
    <Navigate to='/login' state={{ from: location }} replace/>
  )
}

function App() {
  return (
    <main className='w-full min-h-screen bg-[#f3f4f6]'>
      <Routes>
        <Route element={<Layout/>}>
          <Route path='/' element={<Navigate to='/dashboard'/>}/>
          <Route path='/dashboard' element={<Dashboard/>}/>
          <Route path='/tasks' element={<Tasks/>}/>
          <Route path='/completed/:status' element={<Tasks/>}/>
          <Route path='/in-progress/:status' element={<Tasks/>}/>
          <Route path='/todo/:status' element={<Tasks/>}/>
          <Route path='/team' element={<Users/>}/>
          <Route path='/trashed' element={<Trash/>}/>
          <Route path='/task/:id' element={<TaskDetails/>}/>
        </Route>
        
        <Route path='/login' element={<Login/>}/>
      </Routes>
    </main>
  )
}

export default App
