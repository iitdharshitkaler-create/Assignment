
// import styles from "./loginpage.module.css";
// import { useNavigate } from "react-router-dom";
// import { useEffect, useState } from "react";
// import { Link } from "react-router-dom";
// interface Project {
//   _id: string;
//   name: string;
//   description: string;
// }
// interface User {
//   avatar: string;
//     name: string;
//     _id: string;
// }
 
// interface Task {
//     _id: string;
//     boardname: string;
//     storyname: string;
//     name: string;
//     description: string; 
//     assigneeid: string;
//     assignee: string;
//     reporterid: string;
//     reporter: string;
//     status: string;
//     dueDate: string;
//     priority: string;
// }

// interface Board {
//     _id: string;
//     projectname: string;
//     todo: Task[];
//     inprogress: Task[];
//     done: Task[];
//     stories: Story[ ];
//     __v: number;
// }

// interface Story {
//     _id: string;
//     boardname: string;
//   storyname: string;
//   status: string;
//   tasks: [string];
// }
// interface Notification {
//     _id: string;
//     Message: string,
//     sendto: User,
//     sendfrom: User,
//     task: Task,
//     board: Board,
//     project: Project,
//     story: Story,
//     date: string,
//     read: boolean,
// }

// function ProfileDashboard() {
//   const [projects, setProjects] = useState<Project[]>([]);
//   useEffect(() => {
//     fetch("http://localhost:3000/projects", {
//       credentials: "include"
//     })
//       .then(res => res.json())
//       .then(data => {
//         setProjects(data.projects);
//       });
//   }, []);

//   const [user, setUser] = useState<User>({
//     _id: "",
//     name: "",
//     avatar: "",
//   }); 
//   useEffect(() => {
//     fetch("http://localhost:3000/profile", {
//       credentials: "include"
//     })
//       .then(res => res.json())
//       .then(data => {
//         setUser({
//           _id: data._id,
//           name: data.name,
//           avatar: data.avatar
//         });
//       });
//   }, []);

//   const navigate = useNavigate();
//   async function clickedLogout() {

//     try{
//       const res = await fetch("http://localhost:3000/logout", {
//         method:"POST",
//         credentials: "include"
//       });
//       const cond = await res.json();
//       if(cond.logout){
//         navigate("/");
//       }
//     } catch (error) {
//       console.log("Server connection failed:", error);
//     }
//   }
//   function clkcreateproject() {
//       navigate("/createnew");
//   }

//   const [messages, setMessages] = useState<Notification[]>([]);

//   async function fetchnotifications(){
//     fetch(`http://localhost:3000/getnotifications/${user._id}`, {
//         credentials: "include"
//         }).then(res => res.json())
//         .then(data => {
//             setMessages(data.notifications);
//         });
//   }
//   useEffect(() => {
//     if(user._id){
//       fetchnotifications();
//     }
//   }, [user._id])

//   return (
//     <div className={styles.container}>
//       <header>
//         <h1>Profile</h1>
//         <div>
//           <div>Name: {user.name} </div>
//           <div>Avatar: <img src={`/${user.avatar}.jpeg`} height={"40px"}/> </div>
//         </div>
//       </header>
//       <div>
//         notifications
//         <div>
//            {messages.map((message) => (
//                     <div> {message.Message} </div>
//                     ))}
//         </div>
//       </div>
//       <main>
//         <nav>
//           <button className={styles.button} onClick={clkcreateproject}>Create New Project</button>
//           <div> {projects.map((project) => (
//             <div key={project._id}> 
//               <Link to={`/projectinfo/${project._id}`}>
//                 {project.name}
//               </Link>
//             </div> 
//           ))} </div>
//           <button className={styles.button}>See Completed Projects</button>
//           <hr />
//           <button className={styles.button} onClick={clickedLogout}>Logout</button>
//         </nav>
//       </main>
//     </div>
//   );
// };

// export default ProfileDashboard;
import styles from "./loginpage.module.css";
import { useNavigate } from "react-router-dom";
import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import type { User, Project, Notification} from "../../types/type";

function ProfileDashboard() {

  const [projects, setProjects] = useState<Project[]>([]);
  const [messages, setMessages] = useState<Notification[]>([]);
  const [user, setUser] = useState<User>({
    _id: "",
    name: "",
    avatar: "",
  });

  const navigate = useNavigate();

  useEffect(() => {
    fetch("http://localhost:3000/projects", {
      credentials: "include"
    })
      .then(res => res.json())
      .then(data => {
        setProjects(data.projects);
      });
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
  return (
    <div className={styles.container}>

      <header className={styles.header}>
        <h1>Profile Dashboard</h1>

        <div className={styles.profileInfo}>
          <div className={styles.profileText}>
            <p>Name: {user.name}</p>
          </div>

          <img
            className={styles.avatar}
            src={`/${user.avatar}.jpeg`}
          />
        </div>
      </header>

      <section className={styles.notifications}>
        <h2 onClick={shownotifications}>Notifications</h2>

        { show && <div className={styles.notificationList}>
          {messages.map((message) => (
            <div className={styles.notificationCard} key={message._id}>
              {message.Message}
            </div>
          ))}
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
              </div>
            ))}
          </div>

          <button className={styles.button}>
            See Completed Projects
          </button>

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