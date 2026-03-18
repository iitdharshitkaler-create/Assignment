

import { useNavigate  } from "react-router"
import styles from "./main.module.css"
import { useEffect, useState } from "react";

interface User {
  name: string,
  _id: string,
}
interface Project {
  name: string,
  _id: string
}
function App() {
  const navigate = useNavigate();
  const createaccout = () => {
    navigate("/registerpage")
  }
  const loginaccount = () => {
    navigate("/loginpage")
  }
  const[allusers, setAllusers] = useState<User[]>([]);
  useEffect(() => {
        fetch(`http://localhost:3000/allusersathome`, {
        credentials: "include"
        })
        .then(res => res.json())
        .then(data => {
            setAllusers(data.userlist);
        });
    }, []); 

    const[allprojects, setAllprojects] = useState<Project[]>([]);
    useEffect(() => {
        fetch(`http://localhost:3000/allprojects`, {
        credentials: "include"
        })
        .then(res => res.json())
        .then(data => {
            setAllprojects(data.projectlist);
        });
    }, []); 

  return (
    
    <div className={styles.container}>

      <h1 className = {styles.header}>Project Management System</h1>
      <div className={styles.loginCard}>
      <button className={styles.actionButton} onClick={loginaccount}>
        Login 
      </button>
      <br></br>
      <button className={styles.actionButton} onClick={createaccout}>
        Create Account
      </button>
      </div>
      <div >
      <table  className={styles.tableWrapper}>
          <thead className={styles.tableHead}>
            <tr>
              <th>users</th>
            </tr>
          </thead>
          <tbody>{allusers.map(user => (
              <tr key={user._id}>
                <td className={styles.tableData}>{user.name}</td>
              </tr>
            ))}
          </tbody>
        </table>
        <table className={styles.tableWrapper}>
          <thead className={styles.tableHead}>
            <tr>
              <th>projects</th>
            </tr>
          </thead>
          <tbody className={styles.tableData}><tr><td>hello</td></tr></tbody>
          <tbody>{allprojects.map(project => (
              <tr key={project._id}>
                <td className={styles.tableData}>{project.name}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}

export default App
