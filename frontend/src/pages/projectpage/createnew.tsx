// import styles from "./createnew.module.css";
// import { useNavigate } from "react-router-dom";
// import { useState } from "react";
// function CreateNewProject() {
//   const navigate = useNavigate();
//   const [project, setProject] = useState({
//       global_admin: "curuser",
//       name: "",
//       description: "",
//       project_admin: "",
//       members: [""],
//       boards: [""],
//     });
  
//     async function clkcreatedProject() {
//       try{
//         const res = await fetch("http://localhost:3000/createnew", {
//           method: "POST",
//           headers: {
//             "Content-Type": "application/json"
//           },
//           credentials: "include",
//           body: JSON.stringify(project)
//         });
//         const state = await res.json();
//         if(state.created){
//           navigate("/profilepage");
//         }
//       } catch (error) {
//         console.log("Server connection failed:", error);
//       }
//     }
//   return (
//     <div className = {styles.container}>
//     <h1 className= {styles.header} >Project Name:
//         <input type="text" placeholder="New Project" onChange={(e) => setProject({...project, name: e.target.value})}></input>
//     </h1>
//     <h1 className= {styles.header}>Description
//         <input type="text" placeholder="About this project" onChange={(e) => setProject({...project, description:e.target.value})}></input>
//     </h1>
//     <button className={styles.button} onClick={clkcreatedProject}>Create project</button>
//     </div>
//   )
// }

// export default CreateNewProject;




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
    members: [""],
    boards: [""],
  });

  async function clkcreatedProject() {

    try {

      const res = await fetch("http://localhost:3000/createnew", {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        credentials: "include",
        body: JSON.stringify(project)
      });

      const state = await res.json();

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

        <h1 className={styles.title}>
          Create New Project
        </h1>

        <div className={styles.form}>

          <label>Project Name</label>
          <input
            className={styles.input}
            type="text"
            placeholder="New Project"
            onChange={(e) =>
              setProject({ ...project, name: e.target.value })
            }
          />

          <label>Description</label>
          <input
            className={styles.input}
            type="text"
            placeholder="About this project"
            onChange={(e) =>
              setProject({ ...project, description: e.target.value })
            }
          />

        </div>

        <button
          className={styles.button}
          onClick={clkcreatedProject}
        >
          Create Project
        </button>

      </div>

    </div>

  );
}

export default CreateNewProject;