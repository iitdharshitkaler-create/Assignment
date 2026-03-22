import styles from "./projectinfo.module.css";
import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import type { Project, User, Board } from "../../types/type";

function ProjectInfo() {
  const navigate = useNavigate();
  const { id } = useParams();
  
  // State variables for the user's role in this project and the project details
  const [role, setRole] = useState("");
  // Initialize with null or empty, but we will use optional chaining in JSX
  const [project, setProject] = useState<Project | null>(null);

  // Fetch the project metadata and the user's specific role for this project
  useEffect(() => {
    if (!id) return;
    fetch(`http://localhost:3000/project/${id}`, {
      credentials: "include"
    })
      .then(res => res.json())
      .then(data => {
        if (data.project) {
          setProject(data.project);
          setRole(data.role);
        }
      })
      .catch(err => console.error("Error fetching project metadata:", err));
  }, [id]);

  // State to hold the current logged-in user's information
  const [user, setUser] = useState<User>({
    _id: "",
    name: "",
    avatar: "",
  });

  // Fetch the current user's profile data on component mount
  useEffect(() => {
    fetch("http://localhost:3000/profile", {
      credentials: "include"
    })
      .then(res => res.json())
      .then(data => {
        if (data._id) {
            setUser({
            _id: data._id,
            name: data.name,
            avatar: data.avatar
            });
        }
      })
      .catch(err => console.error("Error fetching profile:", err));
  }, []);

  // State for holding all users (used later in the admin selection dropdown)
  const [allusers, setAllusers] = useState<User[]>([]);

  // States and functions specifically handling the "Edit Description" feature
  const [isEditingDesc, setIsEditingDesc] = useState(false);
  const [newDesc, setNewDesc] = useState("");

  // Activates the description text area and populates it with the current text
  function startEditingDesc() {
    setNewDesc(project?.description || "");
    setIsEditingDesc(true);
  }

  // Sends the newly edited description to the backend and updates the UI
  async function saveDescription() {
    if (!id || !project) return;
    try {
      const res = await fetch(`http://localhost:3000/updateprojectdesc/${id}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ description: newDesc })
      });
      const data = await res.json();
      
      if (data.updated) {
        // Update local state so it shows immediately without a refresh
        setProject({ ...project, description: data.description });
        setIsEditingDesc(false);
      }
    } catch (err) {
      console.error("Error updating description:", err);
    }
  }
  
  // Fetch all registered users to populate the "Add Admin" dropdown
  useEffect(() => {
    if (!id) return;
    fetch(`http://localhost:3000/allusers/${id}`, {
      credentials: "include"
    })
      .then(res => res.json())
      .then(data => {
        if (data.userlist) setAllusers(data.userlist);
      })
      .catch(err => console.error(err));
  }, [id]);

  // State and logic to manage the list of admins for this specific project
  const [allprojectadmins, setAllprojectadmins] = useState<User[]>([]);

  async function loadAdmins() {
    if (!id) return;
    fetch(`http://localhost:3000/getprojectadmins/${id}`, {
      credentials: "include"
    })
      .then(res => res.json())
      .then(data => {
        if (data.project_admins) setAllprojectadmins(data.project_admins);
      })
      .catch(err => console.error(err));
  }

  useEffect(() => {
    loadAdmins();
  }, [id]);

  // State and logic for managing the boards inside this project
  const [allboard, setAllboard] = useState<Board[]>([]);

  async function loadBoards() {
    if (!id) return;
    fetch(`http://localhost:3000/getprojectboards/${id}`, {
      credentials: "include"
    })
      .then(res => res.json())
      .then(data => {
        if (data.boards) setAllboard(data.boards);
      })
      .catch(err => console.error(err));
  }

  useEffect(() => {
    loadBoards();
  }, [id]);

  // Function to create a new empty board and reload the board list
  async function clkaddboard() {
    if (!project) return;
    await fetch("http://localhost:3000/addboardinproject", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      credentials: "include",
      body: JSON.stringify({ project })
    });

    loadBoards();
  }

  // States handling the UI toggle and selection for adding a new project admin
  const [seletPadmin, setSelectPadmin] = useState(false);
  const [project_admin, setProject_admin] = useState("");

  // Shows the admin selection dropdown
  function clkaddprojectadmin() {
    setSelectPadmin(true);
  }

  // Submits the selected user as a new project admin to the backend
  async function clkaddpadmin() {
    setSelectPadmin(false);

    await fetch("http://localhost:3000/addadminproject", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      credentials: "include",
      body: JSON.stringify({ id, project_admin })
    });

    // Refresh lists after adding a new admin
    loadBoards();
    loadAdmins();
  }

  // Logs the user out and redirects them to the home page
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
      {/* Header containing project title, description, and current user's profile info */}
      <header className={styles.header}>
        <div>
          <h1>{project?.name || "Loading Project..."}</h1>
          
          {/* Conditional rendering for Description */}
          {isEditingDesc ? (
            /* Editable text area shown when editing is active */
            <div style={{ marginTop: "10px" }}>
              <textarea 
                value={newDesc} 
                onChange={(e) => setNewDesc(e.target.value)} 
                rows={3}
                style={{ width: "100%", padding: "5px", marginBottom: "5px" }}
              />
              <div>
                <button onClick={saveDescription} className={styles.button}>Save</button>
                <button 
                   onClick={() => setIsEditingDesc(false)} 
                   className={styles.button} 
                   style={{ marginLeft: "10px", backgroundColor: "#ccc", color: "#000" }}
                >
                   Cancel
                </button>
              </div>
            </div>
          ) : (
            /* Standard read-only description view */
            <div>
              <p>{project?.description || "No description available"}</p>
              
              {/* Only show Edit button if user has permission */}
              {(role === "global_admin" || role === "project_admin") && (
                <button onClick={startEditingDesc} className={styles.button} style={{ fontSize: "0.8rem", padding: "5px 10px" }}>
                  Edit Description
                </button>
              )}
            </div>
          )}
        </div>

        {/* User profile section at the top right */}
        <div className={styles.profile}>
          <span>{user?.name}</span>
          <img 
             className={styles.avatar} 
             src={user?.avatar?.startsWith("data:image") ? user.avatar : `/${user.avatar}.jpeg`} 
             alt="User Avatar"
          />
        </div>
      </header>

      {/* Section displaying the list of current project admins */}
      <section className={styles.section}>
        <h2>Project Admins</h2>
        <div className={styles.adminList}>
          {allprojectadmins.map((adminUser, pos) => (
            <div key={pos} className={styles.adminCard}>
              {adminUser.name}
            </div>
          ))}
        </div>

        {/* Dropdown menu to select and add a new admin (visible when Add Project Admin is clicked) */}
        {seletPadmin && (
          <div className={styles.form}>
            <select
              value={project_admin}
              onChange={(e) => setProject_admin(e.target.value)}>
              <option value="">Select Admin</option>
              {allusers.map(u => (
                <option key={u._id} value={u._id}> {u.name} </option>
              ))}
            </select>
            <button onClick={clkaddpadmin}> Done </button>
          </div>
        )}
        
        {/* Button to reveal the admin selection dropdown (only visible to global admins) */}
        {role === "global_admin" && (
          <button className={styles.button} onClick={clkaddprojectadmin}> Add Project Admin </button>
        )}
      </section>
      
      {/* Section displaying the project's boards */}
      <section className={styles.section}>
        <h2>Boards</h2>
        <div className={styles.boardList}>
          {allboard.map((board, boardpos) => (
            <a key={boardpos} className={styles.boardCard} href={`/projectinfo/${id}/${board._id}/${boardpos}`} > Board {boardpos} </a>
          ))}
        </div>

        {/* Button to add a new board (visible to global or project admins) */}
        {(role === "project_admin" || role === "global_admin") && (
          <button className={styles.button} onClick={clkaddboard}> Add Board </button>
        )}
      </section>
      
      {/* Global logout button */}
      <button className={styles.logout} onClick={clickedLogout}> Logout </button>
    </div>
  );
}
export default ProjectInfo;