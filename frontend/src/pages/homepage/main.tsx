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

  // takes user to the register page when user click the button
  const createaccout = () => {
    navigate("/registerpage")
  }

  //sends user to loginpage
  const loginaccount = () => {
    navigate("/loginpage")
  }

  // making a state to hold all the users, starts out as an empty array.
  const[allusers, setAllusers] = useState<User[]>([]);

  // fetching the users from local server
  useEffect(() => {
        fetch(`http://localhost:3000/allusersathome`, {
        credentials: "include"
        })
        .then(res => res.json())
        .then(data => {
            // updating our state with the data we got back
            setAllusers(data.userlist);
        });
    }, []); // empty brackets so it only runs once when the page loads

    // doing the exact same thing for projects now
    const[allprojects, setAllprojects] = useState<Project[]>([]);

    // fetching the project list from the backend
    useEffect(() => {
        fetch(`http://localhost:3000/allprojects`, {
        credentials: "include"
        })
        .then(res => res.json())
        .then(data => {
            setAllprojects(data.projectlist);
        });
    }, []); 

    // function to go to a specific project's page using its id in the url
    function showdetailsofproject(projectid: string){
      navigate(`/projectview/${projectid}`);
    }
  return (
    // the main container for the whole home page
    <div className={styles.container}>
      <h1 className = {styles.header}>Project Management System</h1>
      <div className={styles.loginCard}>
      {/* button to trigger the login function */}
      <button className={styles.actionButton} onClick={loginaccount}>
        Login 
      </button>
      <br></br>
      {/* button for making a new account */}
      <button className={styles.actionButton} onClick={createaccout}>
        Create Account
      </button>
      </div>
      <div >
      {/* table to show all the users */}
      <table  className={styles.tableWrapper}>
          <thead className={styles.tableHead}>
            <tr>
              <th>users</th>
            </tr>
          </thead>
          {/* mapping over the users to make a row for every single one */}
          <tbody>{allusers.map(user => (
              <tr key={user._id}>
                <td className={styles.tableData}>{user.name}</td>
              </tr>
            ))}
          </tbody>
        </table>

        {/* table for the projects */}
        <table className={styles.tableWrapper}>
          <thead className={styles.tableHead}>
            <tr>
              <th>projects</th>
            </tr>
          </thead>
          
          {/* looping through projects to show user and add a view button for project viewers*/}
          <tbody>{allprojects.map(project => (
              <tr key={project._id}>
                <td className={styles.tableData}>{project.name}</td>
                <td><button className={styles.viewButton} onClick={() => showdetailsofproject(project._id)}>View Details </button></td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}

export default App