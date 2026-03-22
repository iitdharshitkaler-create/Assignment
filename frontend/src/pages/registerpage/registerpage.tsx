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
      return false; 
    }
  }

  // Handle the custom image upload and convert to Base64
  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setUser({ ...user, avatar: reader.result as string });
      };
      reader.readAsDataURL(file);
    }
  };

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

  // Helper to determine the image source for the selected avatar
  const getSelectedAvatarSrc = () => {
    if (user.avatar === "man") return "/man.jpeg";
    if (user.avatar === "woman") return "/woman.jpeg";
    return user.avatar; // Custom uploaded base64 string
  };

  return (
    <div className={styles.container}>
      <div className={styles.card}>
        <h1 className={styles.title}>
          Create Account
        </h1>
        <form className={styles.form} onSubmit={(e) => e.preventDefault()}>
          <label>Name</label>
          <input
            className={styles.input}
            onChange={(e) => setUser({ ...user, name: e.target.value })}
          />
          
          <label>Email</label>
          <input
            className={styles.input}
            onChange={(e) => setUser({ ...user, email: e.target.value })}
          />
          
          <label>Choose Avatar</label>
          
          {/* Conditional Rendering based on whether an avatar is selected */}
          {!user.avatar ? (
            <>
              <div className={styles.avatarContainer}>
                <div  
                  className={styles.avatarOption}  
                  onClick={() => setUser({ ...user, avatar: "man" })} 
                > 
                  <img src="/man.jpeg" alt="Man avatar" />
                </div>
                
                <div  
                  className={styles.avatarOption}  
                  onClick={() => setUser({ ...user, avatar: "woman" }) }
                >
                  <img src="/woman.jpeg" alt="Woman avatar" />
                </div>
              </div>

              {/* CLEARLY VISIBLE UPLOAD BUTTON */}
              <div style={{ marginTop: "10px", marginBottom: "15px", textAlign: "center" }}>
                <input
                  type="file"
                  accept="image/*"
                  id="avatar-upload"
                  onChange={handleImageUpload}
                  style={{ display: "none" }} 
                />
                <label 
                  htmlFor="avatar-upload" 
                  className={styles.button}
                  style={{ display: "inline-block", padding: "8px 16px", cursor: "pointer", backgroundColor: "#555", width: "auto", fontSize: "14px" }}
                >
                  ⬆️ Upload Custom Image
                </label>
              </div>
            </>
          ) : (
            /* Selected Avatar View */
            <div className={styles.avatarContainer} style={{ justifyContent: "center" }}>
              <div 
                className={`${styles.avatarOption} ${styles.selected}`}
                onClick={() => setUser({ ...user, avatar: "" })} // Allows user to click and re-select
                title="Click to remove and choose another"
              >
                <img 
                  src={getSelectedAvatarSrc()} 
                  alt="Selected avatar" 
                  style={{ width: "70px", height: "70px", objectFit: "cover", borderRadius: "50%" }} 
                />
              </div>
            </div>
          )}

          <label>Password</label>
          <input 
            type="password" 
            className={styles.input}  
            onChange={(e) => setUser({ ...user, password: e.target.value }) }
          />
        </form>
        
        <button className={styles.button} onClick={clickedregister}> 
          Create Account  
        </button>
      </div>
    </div>
  );
}

export default RegisterPage;