
import styles from "./loginpage.module.css";
import { useNavigate } from "react-router-dom";
import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
function ProjectDashboard() {
  interface Project {
    _id: string;
    name: string;
    description: string;
  }
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

  const [user, setUser] = useState({
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

  return (
    <div className={styles.container}>
      <header>
        <h1>Profile</h1>
      </header>
      <div>
        <div>Name: {user.name} </div>
        <div>Avatar: {user.avatar} </div>

      </div>
      <main>
        <nav>
          <button className={styles.button} onClick={clkcreateproject}>Create New Project</button>
          <div> {projects.map((project) => (
            <div key={project._id}> 
              <Link to={`/projectinfo/${project._id}`}>
                {project.name}
              </Link>
            </div> 
          ))} </div>
          <button className={styles.button}>See Completed Projects</button>
          <hr />
          <button className={styles.button} onClick={clickedLogout}>Logout</button>
        </nav>
      </main>
    </div>
  );
};

export default ProjectDashboard;
