import styles from "./createnew.module.css";
import { useNavigate } from "react-router-dom";
import { useState } from "react";
function CreateNewProject() {
  const navigate = useNavigate();
  const [project, setProject] = useState({
      global_admin: "curuser",
      name: "",
      description: "",
      project_admin: "",
      members: [""]
    });
  
    async function clkcreatedProject() {
      try{
        const res = await fetch("http://localhost:3000/createnew", {
          method: "POST",
          headers: {
            "Content-Type": "application/json"
          },
          credentials: "include",
          body: JSON.stringify(project)
        });
        const state = await res.json();
        if(state.created){
          navigate("/mainpage");
        }
      } catch (error) {
        console.log("Server connection failed:", error);
      }
    }
  return (
    <div className = {styles.container}>
    <h1 className= {styles.header} >Project Name:
        <input type="text" placeholder="New Project" onChange={(e) => setProject({...project, name: e.target.value})}></input>
    </h1>
    <h1 className= {styles.header}>Description
        <input type="text" placeholder="About this project" onChange={(e) => setProject({...project, description:e.target.value})}></input>
    </h1>
    <button className={styles.button} onClick={clkcreatedProject}>Create project</button>
    </div>
  )
}

export default CreateNewProject;