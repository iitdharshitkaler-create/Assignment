import styles from "./loginpage.module.css";
import { useState } from "react";
import { useNavigate } from "react-router-dom";

function LoginPage() {

  const navigate = useNavigate();
  const [user, setUser] = useState({
      email: "",
      password: "",    
    });
  
    async function clickedregister() {
      try{
        const res = await fetch("http://localhost:3000/loginpage", {
          method: "POST",
          headers: {
            "Content-Type": "application/json"
          },
          credentials: "include",
          body: JSON.stringify(user)
        });
        const state = await res.json();
        if(state.loggedin){
          navigate("/profilepage");
        }
      } catch (error) {
        console.log("Server connection failed:", error);
      }
    }
   return (
    <div className={styles.container}>
      <h1>Enter the details for login</h1>
      <form>
        email: <input onChange={(e) => setUser({ ...user, email: e.target.value })}/> <br></br>
        password: <input onChange={(e) => setUser({ ...user, password: e.target.value })}/>
      </form>
      <button className={styles.button} onClick={clickedregister}>
        Login
      </button>
    </div>
  )
}

export default LoginPage


