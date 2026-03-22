import { useNavigate } from "react-router";
import styles from "./registerpage.module.css";
import { useState } from "react";

function RegisterPage() {
  const navigate = useNavigate();
  // State to track all user input data for the form
  const [user, setUser] = useState({
    name: "",
    email: "",
    avatar: "",
    password: "",
  });
  // Basic validation to ensure the email has an "@" and "." in valid positions
  function isValidEmail(email: string){
    const atpos = email.indexOf("@");
    const dotpos = email.lastIndexOf(".");
    if(atpos <= 0) { return false; }
    if(dotpos <= atpos + 1) { return false; }
    if(dotpos >= email.length - 1) { return false; }
    return true;
  }
  // Calls the backend API to check if the user's email is already registered
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
        // Save the converted Base64 string directly into the user's avatar state
        setUser({ ...user, avatar: reader.result as string });
      };
      reader.readAsDataURL(file);
    }
  };
  // Main submission handler fired when the user clicks 'Create Account'
  async function clickedregister() {
    const emailformat = isValidEmail(user.email);
    const exists = await checkemailexistence(user.email);

    // Block registration if the email is already taken or formatted incorrectly
    if(exists) {
      alert("Email already exists");
      return;
    } else if (!emailformat){
      alert("Invalid email format. Please use xyz@gmail.com");
      return;
    }

    // Attempt to send the completed user object to the backend
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
    // Redirect the user back to the home/login page after registering
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
        {/* Prevent standard form submission behavior to handle it via our custom function */}
        <form className={styles.form} onSubmit={(e) => e.preventDefault()}>
          <label>Name</label>
          <input className={styles.input} onChange={(e) => setUser({ ...user, name: e.target.value })}/>
          <label>Email</label>
          <input className={styles.input} onChange={(e) => setUser({ ...user, email: e.target.value })} />
          <label>Choose Avatar</label>
          {/* Conditional Rendering based on whether an avatar is selected */}
          {!user.avatar ? (
            <>
              <div className={styles.avatarContainer}>
                {/* Preset Man Avatar Selection */}
                <div  
                  className={styles.avatarOption}  
                  onClick={() => setUser({ ...user, avatar: "man" })} 
                > 
                  <img src="/man.jpeg" alt="Man avatar" />
                </div>
                
                {/* Preset Woman Avatar Selection */}
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
                  ⬆️ Upload Custom Image (max size 50kb)
                </label>
              </div>
            </>
          ) : (
            /* Selected Avatar View */
            <div className={styles.avatarContainer} style={{ justifyContent: "center" }}>
              {/* Clicking the selected avatar clears it, letting the user pick again */}
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
        
        {/* Trigger the custom registration logic */}
        <button className={styles.button} onClick={clickedregister}> 
          Create Account  
        </button>
      </div>
    </div>
  );
}

export default RegisterPage;