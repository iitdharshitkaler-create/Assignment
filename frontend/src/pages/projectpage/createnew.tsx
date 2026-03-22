import styles from "./createnew.module.css";
import { useNavigate } from "react-router-dom";
import { useState } from "react";

function CreateNewProject() {
  const navigate = useNavigate();

  // keeping track of what the user is typing for the new project
  // uses default blank values to start with so it doesn't break
  const [project, setProject] = useState({
    global_admin: "curuser",
    name: "",
    description: "",
    project_admin: "",
    members: [""],
    boards: [""],
  });

  // the main function that runs when user clicks create button
  async function clkcreatedProject() {

    try {

      // sending the project info we saved in our state over to the database
      const res = await fetch("http://localhost:3000/createnew", {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        credentials: "include",
        body: JSON.stringify(project)
      });

      // wait to see what the server replies back with
      const state = await res.json();

      // if it successfully created the project, redirect user back to their profile dashboard
      if (state.created) {
        navigate("/profilepage");
      }

    } catch (error) {
      console.log("Server connection failed:", error);
    }
  }
  return (

    <div className={styles.container}>
      <div className={styles.card}>
        <h1 className={styles.title}>  Create New Project </h1>
        <div className={styles.form}>
          <label>Project Name</label>
          <input  className={styles.input} type="text" placeholder="New Project"
            // whenever they type a letter, update just the name part of our project state
            onChange={(e) =>
              setProject({ ...project, name: e.target.value })
            }/>

          <label>Description</label>
          <input className={styles.input} type="text" placeholder="About this project"
            // same thing here, update the description part of our state as they type
            onChange={(e) =>
              setProject({ ...project, description: e.target.value })
            } />
        </div>

        <button className={styles.button} onClick={clkcreatedProject} > Create Project </button>
      </div>
    </div>
  );
}

export default CreateNewProject;