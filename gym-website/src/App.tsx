import { BrowserRouter, Routes, Route } from 'react-router-dom'
import Landing from './pages/Landing'
import SignUp from './pages/SignUp'
import Login from './pages/Login'
import AppLayout from './components/AppLayout'
import Dashboard from './pages/Dashboard'
import LogWorkout from './pages/LogWorkout'
import History from './pages/History'
import HistoryDetail from './pages/HistoryDetail'
import CalendarPage from './pages/Calendar'
import Progress from './pages/Progress'
import Achievements from './pages/Achievements'
import Exercises from './pages/Exercises'
import ExerciseDetail from './pages/ExerciseDetail'
import Profile from './pages/Profile'
import More from './pages/More'
import { WorkoutsProvider } from './context/WorkoutsContext'
import { ProfileProvider } from './context/ProfileContext'
import { AchievementsProvider } from './context/AchievementsContext'

export default function App() {
  return (
    <ProfileProvider>
      <WorkoutsProvider>
        <AchievementsProvider>
        <BrowserRouter>
          <Routes>
            <Route path="/" element={<Landing />} />
            <Route path="/signup" element={<SignUp />} />
            <Route path="/login" element={<Login />} />
            <Route path="/app" element={<AppLayout />}>
              <Route index element={<Dashboard />} />
              <Route path="log" element={<LogWorkout />} />
              <Route path="history" element={<History />} />
              <Route path="history/:id" element={<HistoryDetail />} />
              <Route path="calendar" element={<CalendarPage />} />
              <Route path="progress" element={<Progress />} />
              <Route path="achievements" element={<Achievements />} />
              <Route path="exercises" element={<Exercises />} />
              <Route path="exercises/:name" element={<ExerciseDetail />} />
              <Route path="profile" element={<Profile />} />
              <Route path="more" element={<More />} />
            </Route>
          </Routes>
        </BrowserRouter>
        </AchievementsProvider>
      </WorkoutsProvider>
    </ProfileProvider>
  )
}
