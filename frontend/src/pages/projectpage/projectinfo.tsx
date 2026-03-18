// import { useEffect, useState } from "react";
// import { useParams, useNavigate } from "react-router-dom";
// import type { Project, User, Board } from "../../types/type";

// function ProjectInfo() {
//     const navigate = useNavigate();
//     const { id } = useParams();  
//     const [role, setRole] = useState("");
//     const[project, setProject] = useState<Project>({
//         name: "",
//         description: "",
//         project_admin: [],
//     });

//     useEffect(() => {
//         fetch(`http://localhost:3000/project/${id}`, {
//         credentials: "include"
//         })
//         .then(res => res.json())
//         .then(data => {
//             setProject(data.project);
//             setRole(data.role);
//         });
//     }, []); 

//     const[allusers, setAllusers] = useState<User[]>([]);
//     useEffect(() => {
//         fetch(`http://localhost:3000/allusers`, {
//         credentials: "include"
//         })
//         .then(res => res.json())
//         .then(data => {
//             setAllusers(data.userlist);
//         });
//     }, []); 

//     const[allprojectadmins, setAllprojectadmins] = useState<User[]>([]);
//     async function loadAdmins() {
//         fetch(`http://localhost:3000/getprojectadmins/${id}`, {
//         credentials: "include"
//         })
//         .then(res => res.json())
//         .then(data => {
//             setAllprojectadmins(data.project_admins);
//         });
//     }
//     useEffect(() =>{
//         loadAdmins();
//     }, [])
//     async function clkaddboard() {
//         try{
//             await fetch("http://localhost:3000/addboardinproject", {
//             method: "POST",
//             headers: {
//                 "Content-Type": "application/json"
//             },
//             credentials: "include",
//             body: JSON.stringify({ project })
//             });
//         } catch (error) {
//             console.log("Server connection failed:", error);
//         }
//         loadBoards();
//     }

//     const[allboard, setAllboard] = useState<Board[]>([]);

//     async function loadBoards() {
//         fetch(`http://localhost:3000/getprojectboards/${id}`, {
//         credentials: "include"
//         })
//         .then(res => res.json())
//         .then(data => {
//             setAllboard(data.boards);
//         });
//     }
//     useEffect(() => {
//         loadBoards();
//     }, []);

//     const [seletPadmin, setSelectPadmin] = useState(false);
//     const[project_admin, setProject_admin] = useState("");
//     function clkaddprojectadmin(){
//         setSelectPadmin(true);
//     }
//     async function clkaddpadmin() {
//         setSelectPadmin(false);
//         try{
//             await fetch("http://localhost:3000/addadminproject", {
//             method: "POST",
//             headers: {
//                 "Content-Type": "application/json"
//             },
//             credentials: "include",
//             body: JSON.stringify({ id, project_admin})
//             });
//         } catch (error) {
//             console.log("Server connection failed:", error);
//         }
//         loadBoards();
//         loadAdmins();
//     }
//     async function clickedLogout() {

//         try{
//         const res = await fetch("http://localhost:3000/logout", {
//             method:"POST",
//             credentials: "include"
//         });
//         const cond = await res.json();
//         if(cond.logout){
//             navigate("/");
//         }
//         } catch (error) {
//         console.log("Server connection failed:", error);
//         }
//     }
//     const [user, setUser] = useState<User>({
//         _id: "",
//         name: "",
//         avatar: "",
//       }); 
//       useEffect(() => {
//         fetch("http://localhost:3000/profile", {
//           credentials: "include"
//         })
//           .then(res => res.json())
//           .then(data => {
//             setUser({
//               _id: data._id,
//               name: data.name,
//               avatar: data.avatar
//             });
//           });
//       }, []);
// 	return (
// 	  <div className="container">
//              <div>
//                  <header>
//                     <h1>Profile</h1>
//                     <div>
//                     <div>Name: {user.name} </div>
//                     <div>Avatar: <img src={`/${user.avatar}.jpeg`} height={"40px"}/> </div>
//                     </div>
//                 </header>
//             </div>
// 		<h1 className="header">Project Name: {project.name} </h1>
// 		{/* the name of project selected is here */}
// 		<h1 className="header">Project Desciption: {project.description}</h1>
//     <br></br>

//     <div>Project Admins
//         <div>
//             {allprojectadmins.map ((user, pos) => (
//                 <div key={pos}>
//                     {user.name}
//                 </div>
//             ))}
//         </div>
//     </div>

//     { seletPadmin && <div>
//         <form> Choose your project admin <select value={project_admin} onChange={(e) => setProject_admin( e.target.value )}>
//                          <option value="">Select Assignee</option>
//                          {allusers.map(user => (
//                             <option key={user._id} value={user._id}>
//                                 {user.name}
//                             </option>
//                         ))}
//                         </select></form>
//                         <button type="button" onClick={clkaddpadmin}>Done</button>
//                         </div> }
//     {(role === "global_admin") && <button onClick={clkaddprojectadmin}> ADD ProjectAdmin </button>}
//     {(role === "project_admin") && <button onClick={clkaddboard}> ADDboard </button> }

//     <div>
//         <div>
//             {allboard?.map((board, boardpos) => (
//                 <div>
//                 <a key={boardpos} href={`/projectinfo/${id}/${board._id}/${boardpos}`}>
//                     Board {boardpos}
//                 </a>
//                 </div>
//             ))}
//         </div>
//     </div>
//     <button onClick={clickedLogout}>Logout</button>
    
// 	</div>
// 	);
//   }
  
//   export default ProjectInfo;



import styles from "./projectinfo.module.css";
import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import type { Project, User, Board } from "../../types/type";

function ProjectInfo() {

  const navigate = useNavigate();
  const { id } = useParams();

  const [role, setRole] = useState("");

  const [project, setProject] = useState<Project>({
    _id: "",
    name: "",
    description: "",
    project_admin: [],
  });

  useEffect(() => {
    fetch(`http://localhost:3000/project/${id}`, {
      credentials: "include"
    })
      .then(res => res.json())
      .then(data => {
        setProject(data.project);
        setRole(data.role);
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

  const [allusers, setAllusers] = useState<User[]>([]);

  useEffect(() => {
    fetch(`http://localhost:3000/allusers/${id}`, {
      credentials: "include"
    })
      .then(res => res.json())
      .then(data => {
        setAllusers(data.userlist);
      });
  }, []);

  const [allprojectadmins, setAllprojectadmins] = useState<User[]>([]);

  async function loadAdmins() {
    fetch(`http://localhost:3000/getprojectadmins/${id}`, {
      credentials: "include"
    })
      .then(res => res.json())
      .then(data => {
        setAllprojectadmins(data.project_admins);
      });
  }

  useEffect(() => {
    loadAdmins();
  }, []);

  const [allboard, setAllboard] = useState<Board[]>([]);

  async function loadBoards() {
    fetch(`http://localhost:3000/getprojectboards/${id}`, {
      credentials: "include"
    })
      .then(res => res.json())
      .then(data => {
        setAllboard(data.boards);
      });
  }

  useEffect(() => {
    loadBoards();
  }, []);

  async function clkaddboard() {
    await fetch("http://localhost:3000/addboardinproject", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      credentials: "include",
      body: JSON.stringify({ project })
    });

    loadBoards();
  }

  const [seletPadmin, setSelectPadmin] = useState(false);
  const [project_admin, setProject_admin] = useState("");

  function clkaddprojectadmin() {
    setSelectPadmin(true);
  }

  async function clkaddpadmin() {
    setSelectPadmin(false);

    await fetch("http://localhost:3000/addadminproject", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      credentials: "include",
      body: JSON.stringify({ id, project_admin })
    });

    loadBoards();
    loadAdmins();
  }

  async function clickedLogout() {
    const res = await fetch("http://localhost:3000/logout", {
      method: "POST",
      credentials: "include"
    });

    const cond = await res.json();

    if (cond.logout) {
      navigate("/");
    }
  }

  return (
    <div className={styles.container}>

      <header className={styles.header}>
        <div>
          <h1>{project.name}</h1>
          <p>{project.description}</p>
        </div>

        <div className={styles.profile}>
          <span>{user.name}</span>
          <img
            className={styles.avatar}
            src={`/${user.avatar}.jpeg`}
          />
        </div>
      </header>

      <section className={styles.section}>
        <h2>Project Admins</h2>

        <div className={styles.adminList}>
          {allprojectadmins.map((user, pos) => (
            <div key={pos} className={styles.adminCard}>
              {user.name}
            </div>
          ))}
        </div>

        {seletPadmin && (
          <div className={styles.form}>
            <select
              value={project_admin}
              onChange={(e) => setProject_admin(e.target.value)}
            >
              <option value="">Select Admin</option>

              {allusers.map(user => (
                <option key={user._id} value={user._id}>
                  {user.name}
                </option>
              ))}
            </select>

            <button onClick={clkaddpadmin}>Done</button>
          </div>
        )}

        {role === "global_admin" && (
          <button
            className={styles.button}
            onClick={clkaddprojectadmin}
          >
            Add Project Admin
          </button>
        )}
      </section>

      <section className={styles.section}>
        <h2>Boards</h2>

        <div className={styles.boardList}>
          {allboard.map((board, boardpos) => (
            <a
              key={boardpos}
              className={styles.boardCard}
              href={`/projectinfo/${id}/${board._id}/${boardpos}`}
            >
              Board {boardpos}
            </a>
          ))}
        </div>

        {role === "project_admin" && (
          <button
            className={styles.button}
            onClick={clkaddboard}
          >
            Add Board
          </button>
        )}
      </section>

      <button
        className={styles.logout}
        onClick={clickedLogout}
      >
        Logout
      </button>

    </div>
  );
}

export default ProjectInfo;