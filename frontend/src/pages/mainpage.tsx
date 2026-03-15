
import styles from "./mainpage.module.css";
import { useNavigate } from "react-router-dom";
import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
interface Project {
  _id: string;
  name: string;
  description: string;
}
interface User {
  avatar: string;
    name: string;
    _id: string;
}
 
interface Task {
    _id: string;
    boardname: string;
    storyname: string;
    name: string;
    description: string; 
    assigneeid: string;
    assignee: string;
    reporterid: string;
    reporter: string;
    status: string;
    dueDate: string;
    priority: string;
}

interface Board {
    _id: string;
    projectname: string;
    todo: Task[];
    inprogress: Task[];
    done: Task[];
    stories: Story[ ];
    __v: number;
}

interface Story {
    _id: string;
    boardname: string;
  storyname: string;
  status: string;
  tasks: [string];
}
interface Notification {
    _id: string;
    Message: string,
    sendto: User,
    sendfrom: User,
    task: Task,
    board: Board,
    project: Project,
    story: Story,
    date: string,
    read: boolean,
}

function ProjectDashboard() {
  const [projects, setProjects] = useState<Project[]>([]);
  useEffect(() => {
    fetch("http://localhost:3000/projects", {
      credentials: "include"
    })
      .then(res => res.json())
      .then(data => {
        setProjects(data.projects);
      });
  }, []);

  const [user, setUser] = useState<User>({
    _id: "",
    name: "",
    avatar: "",
  }); 
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

  const navigate = useNavigate();
  async function clickedLogout() {

    try{
      const res = await fetch("http://localhost:3000/logout", {
        method:"POST",
        credentials: "include"
      });
      const cond = await res.json();
      if(cond.logout){
        navigate("/");
      }
    } catch (error) {
      console.log("Server connection failed:", error);
    }
  }
  function clkcreateproject() {
      navigate("/createnew");
  }

  const [messages, setMessages] = useState<Notification[]>([]);

  async function fetchnotifications(){
    fetch(`http://localhost:3000/getnotifications/${user._id}`, {
        credentials: "include"
        }).then(res => res.json())
        .then(data => {
            setMessages(data.notifications);
        });
  }
  useEffect(() => {
  if(user._id){
    fetchnotifications();
  }
}, [user._id])

  return (
    <div className={styles.container}>
      <nav className={styles.nav}>
      <h1 style={{position:"relative",left:"550px"}}> Project Management</h1>
      <button className={styles.userToggleBtn} onClick={() => setisOpen(!isopen)}>
      <div >👤</div>
      </button>
      <div  className={`${styles.userBox} ${isopen ? styles.userBoxOpen : ''}`}>
      <div >
        <div>Profile </div>
        <div>Name: {user.name} </div>
        <div>Avatar: {user.avatar} </div>
        <button className={`${styles.userCloseButton} ${isopen ? styles.userBoxOpen : ''}`} onClick={() => setisOpen(false)}>Close ×</button>
        <br></br>
        <button className={styles.button} onClick={clickedLogout}>Logout</button>
      </div>
      </div>
      </nav>

      <div className={styles.loginCard} style={position:"relative",left:"400px">
        notifications
        <div className={styles.tableWrapper}>
           {messages.map((message) => (
                    <div> {message.Message} </div>
                    ))}
        </div>
      </div>
      <main className={styles.loginCard} style={position:"relative",right:"300px">
        <nav>
          <button className={styles.actionButton} onClick={clkcreateproject}>Create New Project</button>
          <div>Projects</div>
          <table className={styles.tableWrapper}> {projects.map((project) => (
            < tr className={styles.tableHead} key={project._id}> 
              <td><Link to={`/projectinfo/${project._id}`}>
                {project.name}
              </Link></td>
            </tr>
            
          ))}</table>
          <button className={styles.button}>See Completed Projects</button>
          <hr />
          <button className={styles.button} onClick={clickedLogout}>Logout</button>
        </nav>
      </main>
    </div>
  );
};

export default ProjectDashboard;
