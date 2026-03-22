import styles from "./storypage.module.css";
import { useEffect, useState } from "react";
import { useParams, Link, useNavigate } from "react-router-dom";
import type { User, Task, Story } from "../../types/type";

function StoryInfo() {
    // Navigation hook for redirecting the user
    const navigate = useNavigate();
    
    // State to store the current user's role (e.g., project_admin, member)
    const [role, setRole] = useState("");
    
    // Extracting all the specific IDs directly from the URL parameters
    const { id, boardid, boardpos, storyid } = useParams();
    
    // Initializing empty story state to prevent crashes before the server data loads
    const [story, setStory] = useState<Story>({
        _id: "",
        boardname: "",
        storyname: "",
        status: "",
        tasks: [],
    });
    
    // State for the project's name
    const [projectname, setProjectname] = useState("");

    // Fetches the specific story details and tasks from the backend
    async function loadStories() {
        fetch(`http://localhost:3000/story/${storyid}/${id}`, {
            credentials: "include"
        })
        .then(res => res.json())
        .then(data => {
            // Update our local states with the retrieved data
            setStory(data.story);
            setProjectname(data.projectname);
            setRole(data.role);
        });
    }

    // Run the story fetch automatically when the page first loads
    useEffect(() => {
        loadStories();
    }, []);

    // State variables for handling the creation of a new task
    const [taskname, setTaskname] = useState("");
    const [taskdescription, setTaskdescription] = useState("");
    const [tasktype, setTasktype] = useState("");
    
    // Toggles the visibility of the "Create Task" form
    const [taskform, setTaskform] = useState(false);

    // Submits the new task data to the backend when "Create Task" is clicked
    async function clkdone(){
        await fetch(`http://localhost:3000/addtaskinstory`, {
            method: "POST",
            headers: {"Content-Type": "application/json"},
            credentials: "include",
            // Bundle up all the typed-in info to send it over
            body: JSON.stringify({ taskname, taskdescription, tasktype, storyid })
        });
        
        // Hide the form and reload the story data to show the new task
        setTaskform(false);
        loadStories();
    }

    // Opens the "Add Task" form
    function addtask(){
        setTaskform(true);
    }

    // Deletes a task by sending its array index to the backend
    async function clkremovetask(index:number){
        await fetch(`http://localhost:3000/removetaskinstory/${storyid}`, {
            method:"POST",
            headers:{"Content-Type":"application/json"},
            credentials:"include",
            body:JSON.stringify({ index })
        });
        loadStories();
    }

    // State object to hold the specific task we are currently trying to edit
    const [edittask, setEdittask] = useState<Task>({
        _id:"",
        boardname:"",
        storyname:"",
        name:"",
        description:"",
        assigneeid:"",
        assignee:"",
        reporterid:"",
        reporter:"",
        status:"",
        dueDate:"",
        priority:"",
        tasktype:"",
        createdat:"",
        updatedat:"",
        resolvedat:"",
        closedat:"",
        auditlog:[]
    });

    // Toggles the visibility of the edit form
    const [editform, SetEditform] = useState(false);

    // Sends the updated task data back to the database
    async function editdone(){
        await fetch(`http://localhost:3000/updatetask/${id}`,{
            method:"POST",
            headers:{"Content-Type":"application/json"},
            credentials:"include",
            body:JSON.stringify(edittask)
        });

        SetEditform(false);
        loadStories();
    }

    // Pre-fills the edit form with the data of the task we clicked
    function clkedittask(task:Task){
        setEdittask(task);
        SetEditform(true);
    }

    // Array to keep track of everyone in the project (used for assigning tasks)
    const [allmembers,setAllmembers] = useState<User[]>([]);

    // Fetches the project members on load so we can populate the assignee dropdown
    useEffect(()=>{
        fetch(`http://localhost:3000/allmembersinproject/${id}`,{
            credentials:"include"
        })
        .then(res=>res.json())
        .then(data=>{
            setAllmembers(data.projectmembers);
        });
    },[]);

    // Logs the user out and redirects them back to the homepage
    async function clickedLogout(){
        const res = await fetch("http://localhost:3000/logout",{
            method:"POST",
            credentials:"include"
        });
        const cond = await res.json();
        
        // If the server confirms logout, change the page
        if(cond.logout){
            navigate("/");
        }
    }

    // Holds profile info for the person currently using the app
    const [user,setUser] = useState<User>({
        _id:"",
        name:"",
        avatar:""
    });

    // Grabs the current user's profile details on load
    useEffect(()=>{
        fetch("http://localhost:3000/profile",{
            credentials:"include"
        })
        .then(res=>res.json())
        .then(data=>{
            setUser({
                _id:data._id,
                name:data.name,
                avatar:data.avatar
            });
        });
    },[]);

return(
<div className={styles.container}>
{/* Header section with project info, current board/story, and user profile */}
<header className={styles.header}>
<div>
<h2>Project: {projectname}</h2>
<p>Board {boardpos} • Story: {story.storyname}</p>
</div>
<div className={styles.profile}>
<span>{user.name}</span>
<img className={styles.avatar} src={user.avatar.startsWith("data:image") ? user.avatar : `/${user.avatar}.jpeg`} />
</div>
</header>

{/* Displays the overall status of the current story */}
<section className={styles.section}>
<h3>Status: {story.status}</h3>
</section>

{/* New Task Form: Only visible if 'taskform' state is true */}
{taskform &&
<div className={styles.form}>
<input placeholder="Task name" onChange={(e)=>setTaskname(e.target.value)}/>
<input placeholder="Description" onChange={(e)=>setTaskdescription(e.target.value)}/>
<select value={tasktype} onChange={(e)=>setTasktype(e.target.value)}>
<option value="">Task Type</option>
<option>Normal</option>
<option>Bug</option>
</select>
<button onClick={clkdone}>Create Task</button></div>
}

{/* Edit Task Form: Only visible if 'editform' state is true */}
{editform &&
<div className={styles.form}>

{/* Only admins are allowed to re-assign tasks to other members */}
{(role==="project_admin" || role==="global_admin") &&
<select value={edittask.assigneeid}
onChange={(e)=>setEdittask({...edittask, assigneeid:e.target.value})}>
<option value="">Select Assignee</option>
{/* Looping through fetched project members to populate the dropdown */}
{allmembers.map(user=>(
<option key={user._id} value={user._id}> {user.name} </option>   ))}     </select> }

<select value={edittask.priority}
onChange={(e)=>setEdittask({...edittask,priority:e.target.value})}>
<option>Low</option>
<option>Medium</option>
<option>High</option>
<option>Critical</option>
</select>

<input type="date"
value={edittask.dueDate}
onChange={(e)=>setEdittask({...edittask,dueDate:e.target.value})}/>
<button onClick={editdone}>Save</button>
</div>}

<section className={styles.section}>
{/* Table displaying all tasks associated with this story */}
<table className={styles.table}>
<thead>
<tr>
<th>Name</th>
<th>Description</th>
<th>Type</th>
<th>Assignee</th>
<th>Reporter</th>
<th>Status</th>
<th>DueDate</th>
<th>Priority</th>
<th>Actions</th>
</tr></thead>
<tbody>   
{/* Map over the tasks array to generate a table row for each task */}
{story.tasks.map((task,index)=>(
<tr key={task._id}>
<td>{task.name}</td>
<td>{task.description}</td>
<td>{task.tasktype}</td>
<td>{task.assignee}</td>
<td>{task.reporter}</td>
<td>{task.status}</td>
<td>{task.dueDate}</td>
<td>{task.priority}</td>

<td className={styles.actions}>
{/* Only project admins get to see the Edit or Remove buttons */}
{role==="project_admin" &&
<button onClick={()=>clkedittask(task)}>Edit</button>}
{role==="project_admin" &&
<button onClick={()=>clkremovetask(index)}> Remove </button>}
<Link to={`/comment/${id}/${boardid}/${boardpos}/${storyid}/${task._id}`}> Comments </Link>
</td></tr>      ))}       </tbody></table>

{/* Button to pop open the new task form (visible to admins and members) */}
{(role==="project_admin" || role === "member") &&
<button className={styles.button} onClick={addtask}>Add Task</button>}
</section>

{/* Global logout button */}
<button className={styles.logout} onClick={clickedLogout}>Logout</button>
</div>
);}
export default StoryInfo;