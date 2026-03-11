import styles from "./Global_Admin_Page.module.css";

function Global_Admin_page() {
   return (
    <div className={styles.container}>

      <h1>Enter the details for creating new account</h1>
      <form>
        Name: <input/> <br></br>
        Email: <input/> <br></br>
        Username: <input/> <br></br>
        Avatar: <input/> <br></br>
        password: <input/>
      </form>
      <button className={styles.button}>
        Create Account
      </button>
    </div>
  )
}

export default Global_Admin_page