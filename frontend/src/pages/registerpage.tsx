import { useNavigate } from "react-router";
import styles from "./registerpage.module.css";
import { useState } from "react";

function RegisterPage() {
  const navigate = useNavigate();
  const [user, setUser] = useState({
    name: "",
    email: "",
    avatar: "",    
    password: "",    
  });

  async function clickedregister() {
    try{
      await fetch("http://localhost:3000/registerpage", {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        credentials: "include",
        body: JSON.stringify(user)
      });
    } catch (error) {
      console.log("Server connection failed:", error);
    }
    navigate("/")
  }
  return (
    <div className={styles.container}>
    <div className={styles.loginCard}>
    <h1 style={{ fontFamily: "arial" }}>Enter the details for creating new account</h1>
      <form lassName={styles.form} method="post">
        Name: <input className={styles.textButton} onChange={(e) => setUser({ ...user, name: e.target.value })}/> <br></br>
        Email: <input className={styles.textButton} onChange={(e) => setUser({ ...user, email: e.target.value })}/> <br></br>
        <div style={{position:"relative",right:"137px"}}>Avatar: </div>
        <div style={{display: "flex", gap: "20px"}}>
        <div onClick={()=>setUser({ ...user, avatar: "man"})}>
          <img src="/public/man.jpeg" width="80"/>
        </div>

        <div onClick={()=>setUser({ ...user, avatar: "woman" })}>
            <img src="/public/woman.jpeg" width="80"/>
        </div>
        <br></br>
        </div> 
        password: <input className={styles.textButton} onChange={(e) => setUser({ ...user, password: e.target.value })}/>
      </form>
      <button className={styles.actionButton} onClick={clickedregister}>
        Create Account
      </button>
    </div>
    </div>
  )
}

export default RegisterPage
