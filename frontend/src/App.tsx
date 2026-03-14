import { BrowserRouter, Routes, Route } from "react-router-dom"

import Main from "./pages/main"
import MainPage from "./pages/mainpage"
import LoginPage from "./pages/loginpage"
import RegisterPage from "./pages/registerpage"
import CreateNewProject from "./pages/projectpage/createnew"
import ProjectInfo from "./pages/projectpage/projectinfo"
import BoardInfo from "./pages/projectpage/boardinfo"
import StoryInfo from "./pages/story/storypage"
import CommentInfo from "./pages/comments/commentpage"

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Main />} />
        <Route path="/mainpage" element={<MainPage />} />
        <Route path="/loginpage" element={<LoginPage />} />
        <Route path="/registerpage" element={<RegisterPage />} />
        <Route path="/createnew" element={<CreateNewProject />} />
        <Route path="/projectinfo" element={<ProjectInfo />} />
        <Route path="/projectinfo/:id" element={<ProjectInfo />} />
        <Route path="/projectinfo/:id/:boardid/:boardpos" element={<BoardInfo />} />
        <Route path="/storyinfo/:id/:boardid/:boardpos/:storyid" element={<StoryInfo />} />
        <Route path="/comment/:id/:boardid/:boardpos/:storyid/:taskid" element={<CommentInfo />} />

      </Routes>
    </BrowserRouter>
  )
}

export default App