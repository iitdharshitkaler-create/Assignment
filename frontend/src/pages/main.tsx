import { useNavigate  } from "react-router"
import styles from "./loginpage.module.css"
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
        fetch(`http://localhost:3000/allusers`, {
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

      <h1>Project Management System</h1>

      <button className={styles.button} onClick={loginaccount}>
        Login 
      </button>

      <button className={styles.button} onClick={createaccout}>
        Create Account
      </button>
      <div>
        <table>
          <thead>
            <tr>
              <th>users</th>
            </tr>
          </thead>
          <tbody>{allusers.map(user => (
              <tr key={user._id}>
                <td>{user.name}</td>
              </tr>
            ))}
          </tbody>
        </table>
        <table>
          <thead>
            <tr>
              <th>projects</th>
            </tr>
          </thead>
          <tbody>{allprojects.map(project => (
              <tr key={project._id}>
                <td>{project.name}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}

export default App