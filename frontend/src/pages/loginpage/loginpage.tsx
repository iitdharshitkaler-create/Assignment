


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
    try {
      const res = await fetch("http://localhost:3000/loginpage", {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        credentials: "include",
        body: JSON.stringify(user)
      });

      const state = await res.json();

      if (state.loggedin) {
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
          Login
        </h1>

        <form className={styles.form}>

          <label>Email</label>
          <input
            className={styles.input}
            type="email"
            onChange={(e) =>
              setUser({ ...user, email: e.target.value })
            }
          />

          <label>Password</label>
          <input
            className={styles.input}
            type="password"
            onChange={(e) =>
              setUser({ ...user, password: e.target.value })
            }
          />

        </form>

        <button
          className={styles.button}
          onClick={clickedregister}
        >
          Login
        </button>

      </div>

    </div>
  );
}

export default LoginPage;
