import styles from "./loginpage.module.css";
import { useState } from "react";
import { useNavigate } from "react-router-dom";

function LoginPage() {
  const navigate = useNavigate();
  // saving the email and password as user type it into the form
  const [user, setUser] = useState({
    email: "",
    password: "",
  });

  // the main function that fires when user click the login button
  async function clickedregister() {
    try {
      // sending the login info we saved in state over to our backend server
      const res = await fetch("http://localhost:3000/loginpage", {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        credentials: "include",
        body: JSON.stringify(user)
      });

      // waiting to hear back from the server
      const state = await res.json();

      // if the server says yep they are logged in, send them to their dashboard
      if (state.loggedin) {
        navigate("/profilepage");
      }

    } catch (error) {
      // prints an error in the console if the server crashes or is offline
      console.log("Server connection failed:", error);
    }
  }

  return (
    <div className={styles.container}>
      <div className={styles.card}> <h1 className={styles.title}>  Login </h1>
        <form className={styles.form}>
          <label>Email</label>
          <input  className={styles.input}  type="email"
            // updates the email part of our state variable every time they press a key
            onChange={(e) =>
              setUser({ ...user, email: e.target.value })
            } />

          <label>Password</label>
          <input className={styles.input} type="password"
            // same thing, updates the password part of our state as they type
            onChange={(e) =>
              setUser({ ...user, password: e.target.value })
            } />
        </form>
        <button className={styles.button} onClick={clickedregister} > Login </button>
      </div>
    </div>
  );
}

export default LoginPage;