import styles from "./storypage.module.css";
import { useEffect, useState } from "react";
import { useParams, Link, useNavigate } from "react-router-dom";
import type { User, Task, Story } from "../../types/type";

function StoryInfo() {
    const navigate = useNavigate();
    // saving what role the user has
    const [role, setRole] = useState("");
    // getting all the specific ids from the url bar at the top
    const { id, boardid, boardpos, storyid } = useParams();
    // setting up empty story state so it doesn't crash before it loads
    const [story, setStory] = useState<Story>({
        _id: "",
        boardname: "",
        storyname: "",
        status: "",
        tasks: [],
    });
    const [projectname, setProjectname] = useState("");
    // function to grab the story details from our backend server
    async function loadStories() {
        fetch(`http://localhost:3000/story/${storyid}/${id}`, {
            credentials: "include"
        })
        .then(res => res.json())
        .then(data => {
            // update our states with the data we got back
            setStory(data.story);
            setProjectname(data.projectname);
            setRole(data.role);
        });
    }
    // run this once right when the page first opens up
    useEffect(() => {
        loadStories();
    }, []);
    // basically all the variables needed for making a new task
    const [taskname, setTaskname] = useState("");
    const [taskdescription, setTaskdescription] = useState("");
    const [tasktype, setTasktype] = useState("");
    const [taskform, setTaskform] = useState(false);
    // runs when create task button is clicked
    async function clkdone(){
        await fetch(`http://localhost:3000/addtaskinstory`, {
            method: "POST",
            headers: {"Content-Type": "application/json"},
            credentials: "include",
            // bundling up all the typed-in info to send it over
            body: JSON.stringify({ taskname, taskdescription, tasktype, storyid })
        });
        // hide the form and reload the stuff
        setTaskform(false);
        loadStories();
    }
    // to make the add task form to pop up
    function addtask(){
        setTaskform(true);
    }
    // deletes a task by telling the server its index
    async function clkremovetask(index:number){
        await fetch(`http://localhost:3000/removetaskinstory/${storyid}`, {
            method:"POST",
            headers:{"Content-Type":"application/json"},
            credentials:"include",
            body:JSON.stringify({ index })
        });
        loadStories();
    }
    // object to hold whatever task we're trying to edit right now
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
    // toggle for the edit form
    const [editform, SetEditform] = useState(false);
    // sends the updated task stuff back to the database
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
    // pre-fills the edit form with the task we clicked
    function clkedittask(task:Task){
        setEdittask(task);
        SetEditform(true);
    }
    // array to keep track of everyone in the project
    const [allmembers,setAllmembers] = useState<User[]>([]);
    // fetching the project members so we can assign tasks to them
    useEffect(()=>{
        fetch(`http://localhost:3000/allmembersinproject/${id}`,{
            credentials:"include"
        })
        .then(res=>res.json())
        .then(data=>{
            setAllmembers(data.projectmembers);
        });
    },[]);

    // kicks the user out and sends them to the homepage
    async function clickedLogout(){
        const res = await fetch("http://localhost:3000/logout",{
            method:"POST",
            credentials:"include"
        });
        const cond = await res.json();
        // if the server returns true then change the page
        if(cond.logout){
            navigate("/");
        }
    }
    // holding info for the person currently using the app
    const [user,setUser] = useState<User>({
        _id:"",
        name:"",
        avatar:""
    });
    // grabbing the current user's profile on load
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
{/* top part with the project name and user profile */}
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
<section className={styles.section}>
<h3>Status: {story.status}</h3>
</section>

{/* shows up only if taskform is true */}
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

{/* shows up only if we're editing something */}
{editform &&
<div className={styles.form}>

{/* only admins are allowed to re-assign tasks */}
{(role==="project_admin" || role==="global_admin") &&
<select value={edittask.assigneeid}
onChange={(e)=>setEdittask({...edittask, assigneeid:e.target.value})}>
<option value="">Select Assignee</option>
{/* looping through members for the dropdown */}
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
{/* table of tasks */}
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
<tbody>   {/* map over the tasks and make a row for each one */}
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
{/* only admins get to edit or delete stuff here */}
{role==="project_admin" &&
<button onClick={()=>clkedittask(task)}>Edit</button>}
{role==="project_admin" &&
<button onClick={()=>clkremovetask(index)}> Remove </button>}
<Link to={`/comment/${id}/${boardid}/${boardpos}/${storyid}/${task._id}`}> Comments </Link>
</td></tr>      ))}       </tbody></table>
{/* button to pop open the new task form */}
{(role==="project_admin" || role === "member") &&
<button className={styles.button} onClick={addtask}>Add Task</button>}
</section>
<button className={styles.logout} onClick={clickedLogout}>Logout</button>
</div>
);}
export default StoryInfo;