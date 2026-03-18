// import { useNavigate } from "react-router";
// import styles from "./registerpage.module.css";
// import { useState } from "react";

// function RegisterPage() {
//   const navigate = useNavigate();
//   const [user, setUser] = useState({
//     name: "",
//     email: "",
//     avatar: "",    
//     password: "",    
//   });

//   async function clickedregister() {
//     try{
//       await fetch("http://localhost:3000/registerpage", {
//         method: "POST",
//         headers: {
//           "Content-Type": "application/json"
//         },
//         credentials: "include",
//         body: JSON.stringify(user)
//       });
//     } catch (error) {
//       console.log("Server connection failed:", error);
//     }
//     navigate("/")
//   }
//   return (
//     <div className={styles.container}>

//       <h1>Enter the details for creating new account</h1>
//       <form method="post">
//         Name: <input onChange={(e) => setUser({ ...user, name: e.target.value })}/> <br></br>
//         Email: <input onChange={(e) => setUser({ ...user, email: e.target.value })}/> <br></br>
//         Avatar: 
//         <div style={{display: "flex", gap: "20px"}}>
//         <div onClick={()=>setUser({ ...user, avatar: "man"})}>
//           <img src="/man.jpeg" width="80"/>
//         </div>

//         <div onClick={()=>setUser({ ...user, avatar: "woman" })}>
//             <img src="/woman.jpeg" width="80"/>
//         </div>
//         <br></br>
//         </div>
//         password: <input onChange={(e) => setUser({ ...user, password: e.target.value })}/>
//       </form>
//       <button className={styles.button} onClick={clickedregister}>
//         Create Account
//       </button>
//     </div>
//   )
// }

// export default RegisterPage




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
  function isValidEmail(email: string){
    const atpos = email.indexOf("@");
    const dotpos = email.lastIndexOf(".");
    if(atpos <= 0) { return false; }
    if(dotpos <= atpos + 1) { return false; }
    if(dotpos >= email.length - 1) { return false; }
    return true;
}
  async function checkemailexistence(email: string){
     try {
      const res = await fetch(`http://localhost:3000/checkemailexistence/${email}`);
      const data = await res.json();
      return data.exists;
    } catch (error) {
      console.log("Email check failed:", error);
      return false; // allow registration to continue
    }
  }
  async function clickedregister() {
    const emailformat = isValidEmail(user.email);
    const exists = await checkemailexistence(user.email);
    if(exists) {
      alert("Email already exists");
      return;
    } else if (!emailformat){
      alert("Invalid email format. Please use xyz@gmail.com");
      return;
    }
      try {
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
      navigate("/");
  }

  return (

    <div className={styles.container}>

      <div className={styles.card}>

        <h1 className={styles.title}>
          Create Account
        </h1>

        <form className={styles.form}>

          <label>Name</label>
          <input
            className={styles.input}
            onChange={(e) =>
              setUser({ ...user, name: e.target.value })
            }
          />

          <label>Email</label>
          <input
            className={styles.input}
            onChange={(e) =>
              setUser({ ...user, email: e.target.value })
            }
          />

          <label>Choose Avatar</label>

          <div className={styles.avatarContainer}>

            <div
              className={`${styles.avatarOption} ${user.avatar === "man" ? styles.selected : ""}`}
              onClick={() =>
                setUser({ ...user, avatar: "man" })
              }
            >
              <img src="/man.jpeg" />
            </div>

            <div
              className={`${styles.avatarOption} ${user.avatar === "woman" ? styles.selected : ""}`}
              onClick={() =>
                setUser({ ...user, avatar: "woman" })
              }
            >
              <img src="/woman.jpeg" />
            </div>

          </div>

          <label>Password</label>
          <input
            type="password"
            className={styles.input}
            onChange={(e) =>
              setUser({ ...user, password: e.target.value })
            }
          />

        </form>

        <button
          className={styles.button}
          onClick={clickedregister}
        >
          Create Account
        </button>

      </div>

    </div>

  );
}

export default RegisterPage;