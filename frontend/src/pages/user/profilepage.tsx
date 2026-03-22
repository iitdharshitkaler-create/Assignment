import styles from "./loginpage.module.css";
import { useNavigate } from "react-router-dom";
import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import type { User, Project, Notification} from "../../types/type";

function ProfileDashboard() {

  // State variables to hold the dashboard data
  const [archiveprojects, setArchiveprojects] = useState<Project[]>([]);
  const [projects, setProjects] = useState<Project[]>([]);
  const [messages, setMessages] = useState<Notification[]>([]);
  const [user, setUser] = useState<User>({
    _id: "",
    name: "",
    avatar: "",
  });

  const navigate = useNavigate();

  // Fetches both active and archived projects for the user
  async function loadproject(){
    await fetch("http://localhost:3000/projects", {
      credentials: "include"
    })
      .then(res => res.json())
      .then(data => {
        setProjects(data.projects);
        setArchiveprojects(data.archiveprojects);
      });
  }

  // Load projects immediately when the component mounts
  useEffect(() => {
    loadproject()
  }, []);

  // Fetch basic user profile data (id, name, avatar) on mount
  useEffect(() => {
    fetch("http://localhost:3000/profile", {
      credentials: "include"
    })
      .then(res => res.json())
      .then(data => {
        setUser({
          _id: data._id,
          name: data.name,
          avatar: data.avatar
        });
      });
  }, []);

  // Fetches notifications specific to the currently logged-in user
  async function fetchnotifications() {
    fetch(`http://localhost:3000/getnotifications/${user._id}`, {
      credentials: "include"
    })
      .then(res => res.json())
      .then(data => {
        setMessages(data.notifications);
      });
  }

  // Ensure notifications are only fetched once we actually have the user's ID
  useEffect(() => {
    if (user._id) {
      fetchnotifications();
    }
  }, [user._id]);

  // Handles the logout process and redirects to the home/login screen
  async function clickedLogout() {
    try {
      const res = await fetch("http://localhost:3000/logout", {
        method: "POST",
        credentials: "include"
      });
      const cond = await res.json();
      if (cond.logout) {
        navigate("/");
      }
    } catch (error) {
      console.log("Server connection failed:", error);
    }
  }

  // Navigates the user to the project creation page
  function clkcreateproject() {
    navigate("/createnew");
  }

  // Toggles the visibility of the notifications dropdown
  const [show, setShow] = useState(false);
  function shownotifications(){
    setShow(prev => !prev);
  }

  // Tells the backend to clear all messages and refreshes the local list
  async function clkdclearmesages(){
    try {
      await fetch("http://localhost:3000/clearmesages", {
        method: "POST",
        credentials: "include"
      });
    } catch (error) {
      console.log("Server connection failed:", error);
    }
    fetchnotifications();
  }

  // Marks a specific message as read and refreshes the notifications
  async function clkreadmessage(messageid: string){
    try {
      await fetch(`http://localhost:3000/markasread/${messageid}`, {
        method: "POST",
        credentials: "include"
      });
    } catch (error) {
      console.log("Server connection failed:", error);
    }
    fetchnotifications();
  }

  // Archives a specific project and reloads the project lists
  async function clkdarchive(projectid: string){
    try {
      await fetch(`http://localhost:3000/archiveproject/${projectid}`, {
        method: "POST",
        credentials: "include"
      });
    } catch (error) {
      console.log("Server connection failed:", error);
    }
    loadproject();
  }

  // Toggles the visibility of the archived projects list
  const [showarchived, setShowarchieved] = useState(false);
  function showarchiveproject() {
    setShowarchieved(prev => !prev);
  }

  return (
    <div className={styles.container}>

      {/* Top section displaying user details */}
      <header className={styles.header}>
        <h1>Profile Dashboard</h1>

        <div className={styles.profileInfo}>
          <div className={styles.profileText}>
            <p>Name: {user.name}</p>
          </div>

           {/*this checks that if the user selected the avatar from its side or selected from the given optins*/}
          <img className={styles.avatar} src={user.avatar.startsWith("data:image") ? user.avatar : `/${user.avatar}.jpeg`} />

        </div>
      </header>

      {/* Notifications Section */}
      <section className={styles.notifications}>
        <h2 onClick={shownotifications}>Notifications</h2>
        
        {/* Only show messages if the 'show' state is true */}
        { show && <div className={styles.notificationList} >
          {messages.map((message) => (
            <div onClick={() => clkreadmessage(message._id)} className={styles.notificationCard} key={message._id} style={{backgroundColor: !message.read ? "lightgreen" : ""}}>
              {message.Message}
              
            </div>
            
          ))}
          <button className={styles.logout} onClick={clkdclearmesages}>Clear messages</button>
        </div>}
      </section>

      {/* Main content and sidebar navigation */}
      <main className={styles.main}>

        <nav className={styles.sidebar}>

          <button
            className={styles.button}
            onClick={clkcreateproject}
          >
            Create New Project
          </button>

          {/* Active Projects List */}
          <div className={styles.projectList}>
            {projects.map((project) => (
              <div key={project._id} className={styles.projectItem}>
                <Link to={`/projectinfo/${project._id}`}>
                  {project.name}
                </Link> 
                <button className={styles.button} style = {{width:"100px", lineHeight:"80%",backgroundColor:"rgb(0,100,200)"}} onClick={() => clkdarchive(project._id)}>Archive</button>
              </div>
            ))}
          </div>

          {/* Archived Projects Toggle & List */}
          <button className={styles.logout} onClick={showarchiveproject}>
            See Archived Projects
          </button>
         { showarchived && <div className={styles.projectList}>
            {archiveprojects.map((project, index) => (
              <div key={index} className={styles.projectItem}>
                <Link to={`/projectinfo/${project._id}`}>
                  {project.name}
                </Link> 
              </div>
            ))}
          </div>}

          <hr />

          <button
            className={styles.logout}
            onClick={clickedLogout}
          >
            Logout
          </button>

        </nav>

      </main>

    </div>
  );
}

export default ProfileDashboard;