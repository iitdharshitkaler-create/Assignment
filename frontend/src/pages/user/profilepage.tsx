import styles from "./loginpage.module.css";
import { useNavigate } from "react-router-dom";
import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import type { User, Project, Notification} from "../../types/type";

function ProfileDashboard() {

  const [archiveprojects, setArchiveprojects] = useState<Project[]>([]);
  const [projects, setProjects] = useState<Project[]>([]);
  const [messages, setMessages] = useState<Notification[]>([]);
  const [user, setUser] = useState<User>({
    _id: "",
    name: "",
    avatar: "",
  });

  const navigate = useNavigate();
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
  useEffect(() => {
    loadproject()
  }, []);

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

  async function fetchnotifications() {
    fetch(`http://localhost:3000/getnotifications/${user._id}`, {
      credentials: "include"
    })
      .then(res => res.json())
      .then(data => {
        setMessages(data.notifications);
      });
  }

  useEffect(() => {
    if (user._id) {
      fetchnotifications();
    }
  }, [user._id]);

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

  function clkcreateproject() {
    navigate("/createnew");
  }
  const [show, setShow] = useState(false);
  function shownotifications(){
    setShow(prev => !prev);
  }
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
  const [showarchived, setShowarchieved] = useState(false);
  function showarchiveproject() {
    setShowarchieved(prev => !prev);
  }
  return (
    <div className={styles.container}>

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

      <section className={styles.notifications}>
        <h2 onClick={shownotifications}>Notifications</h2>
        

        { show && <div className={styles.notificationList} >
          {messages.map((message) => (
            <div onClick={() => clkreadmessage(message._id)} className={styles.notificationCard} key={message._id} style={{backgroundColor: !message.read ? "lightgreen" : ""}}>
              {message.Message}
              
            </div>
            
          ))}
          <button className={styles.logout} onClick={clkdclearmesages}>Clear messages</button>
        </div>}
      </section>

      <main className={styles.main}>

        <nav className={styles.sidebar}>

          <button
            className={styles.button}
            onClick={clkcreateproject}
          >
            Create New Project
          </button>

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