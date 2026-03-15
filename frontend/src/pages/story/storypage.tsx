import { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import { Link } from "react-router-dom";
import { useNavigate } from "react-router-dom";
import type {  User, Task, Story } from "../../types/type";

function StoryInfo() {
    const navigate = useNavigate();
    const [role, setRole] = useState("");
    const { id, boardid, boardpos, storyid } = useParams();
    const [story, setStory ] = useState<Story>({
        _id: "",
        boardname: "",
        storyname: "",
        status: "",
        tasks: [],
    });
    const [projectname, setProjectname ] = useState("");
    async function loadStories() {
        fetch(`http://localhost:3000/story/${storyid}/${id}`, {
        credentials: "include"
        })
        .then(res => res.json())
        .then(data => {
            setStory(data.story);
            setProjectname(data.projectname);
            setRole(data.role);
        });
    }   
    useEffect(() => {
        loadStories();
    }, []);  

    const [taskname, setTaskname] = useState("");
    const [taskdescription, setTaskdescription ] = useState("");
    const [tasktype, setTasktype ] = useState("");
    const [taskform, setTaskform] = useState(false);
    async function clkdone(){
        try{
            await fetch(`http://localhost:3000/addtaskinstory`, {
            method: "POST",
            headers: {
                "Content-Type": "application/json"
            },
            credentials: "include",
            body: JSON.stringify({ taskname, taskdescription, tasktype, storyid  })
            });
        } catch (error) {
            console.log("Server connection failed:", error);
        }
        setTaskform(false);
        loadStories();
    }
    function addtask(){
        setTaskform(true);
    }
    async function clkremovetask(index: number){
        try{
            await fetch(`http://localhost:3000/removetaskinstory/${storyid}`, {
            method: "POST",
            headers: {
                "Content-Type": "application/json"
            },
            credentials: "include",
            body: JSON.stringify({ index })
            });
        } catch (error) {
            console.log("Server connection failed:", error);
        }
        loadStories();
    }
    const [edittask, setEdittask] = useState<Task>({
        _id: "",
        boardname: "",
        storyname: "",
        name: "",
        description: "",
        assigneeid: "",
        assignee: "",
        reporterid: "",
        reporter: "",
        status: "",
        dueDate: "",
        priority: "",
        tasktype: "",
        createdat: "",
        updatedat: "",
        resolvedat: "",
        closedat: "",
        auditlog: [],
    })
    const [editform, SetEditform] = useState(false);
    async function editdone(){
        try{
            await fetch(`http://localhost:3000/updatetask/${id}`, {
            method: "POST",
            headers: {
                "Content-Type": "application/json"
            },
            credentials: "include",
            body: JSON.stringify( edittask )
            });
        } catch (error) {
            console.log("Server connection failed:", error);
        }
        SetEditform(false);
        await loadStories();
    }
    function clkedittask(task: Task){
        setEdittask(task);
        SetEditform(true);
    }

    const [allmembers, setAllmembers] = useState<User[]>([]);
    useEffect(() => {
        fetch(`http://localhost:3000/allmembersinproject/${id}`, {
        credentials: "include"
        })
        .then(res => res.json())
        .then(data => {
            setAllmembers(data.projectmembers);
        });
    },[]); 
    async function clickedLogout() {

        try{
        const res = await fetch("http://localhost:3000/logout", {
            method:"POST",
            credentials: "include"
        });
        const cond = await res.json();
        if(cond.logout){
            navigate("/");
        }
        } catch (error) {
        console.log("Server connection failed:", error);
        }
    }
    const [user, setUser] = useState<User>({
        _id: "",
        name: "",
        avatar: "",
      }); 
      useEffect(() => {
        fetch("http://localhost:3000/profile", {
          credentials: "include"
        })
          .then(res => res.json())
          .then(data => {
            setUser({
              _id: data._id,
              name: data.name,
              avatar: data.avatar
            });
          });
      }, []);

	return (
        
        <div> 
            <div>
                 <header>
                    <h1>Profile</h1>
                    <div>
                    <div>Name: {user.name} </div>
                    <div>Avatar: <img src={`/${user.avatar}.jpeg`} height={"40px"}/> </div>
                    </div>
                </header>
            </div>
            <h1>Projectname: {projectname}</h1>
            <h1>Board {boardpos}</h1>
            <h1>Story: {story.storyname}</h1>
            <h1>Status: {story.status}</h1>
            <h1>Tasks:</h1>
            { taskform && 
                <div> 
                    <form method="post">
                        Name: <input onChange={(e) => setTaskname(e.target.value)}/></form>
                        <form>Description: <input onChange={(e) => setTaskdescription(e.target.value)} /></form>
                        <form>TaskTye:<select value={tasktype} onChange={(e) => setTasktype(e.target.value)} >
                        <option value="">Task Type</option>
                        <option>Normal</option>
                        <option>Bug</option>
                        </select></form>
                        <button onClick={clkdone}>done</button>
                    </div>}
            { editform && 
                <div> 
                    {(role === "project_admin" || role === "global_admin") &&
                    <form> Assignee: <select value={edittask.assigneeid} onChange={(e) => setEdittask({ ...edittask, assigneeid: e.target.value })}>
                         <option value="">Select Assignee</option>
                         {allmembers.map(user => (
                            <option key={user._id} value={user._id}>
                                {user.name}
                            </option>
                        ))}
                        </select></form>}
                    <form> Priority: <select value={edittask.priority} onChange={(e) => setEdittask({...edittask, priority: e.target.value})}>
                        <option>Low</option>
                        <option>Medium</option>
                        <option>High</option>
                        <option>Critcal</option>
                        </select></form>
                    <form>
                        Duedate:
                        <input type="date" value={edittask.dueDate} onChange={(e) => setEdittask({ ...edittask, dueDate: e.target.value }) } /> </form>
                    <button onClick={editdone}>done</button>
                </div>}
            <table style={{ width: '100%', borderCollapse: 'collapse', marginTop: '20px' }}>
            <thead>
                <tr style = {{textAlign : 'left',borderBottom : '1px solidd #eee'}}>
                <th style = {{padding : '12px 0' }}>Name</th>
                <th style = {{padding : '12px 0' }}>Description</th>
                <th style = {{padding : '12px 0' }}>TaskType</th>
                <th style = {{padding : '12px 0' }}>Assignee</th>
                <th style = {{padding : '12px 0' }}>Reporter</th>
                <th style = {{padding : '12px 0' }}>Status</th>
                <th style = {{padding : '12px 0' }}>DueDate</th>
                <th style = {{padding : '12px 0' }}>Priority</th>
                <th style = {{padding : '12px 0' }}>Actions</th>
                </tr>
            </thead>
            <tbody>
                {story.tasks.map((task, index) => (
                <tr key={task._id}>
                    <td>{task.name}</td>
                    <td>{task.description}</td>
                    <td>{task.tasktype}</td>
                    <td>{task.assignee}</td>
                    <td>{task.reporter}</td>
                    <td>{task.status}</td>
                    <td>{task.dueDate}</td>
                    <td>{task.priority}</td>
                    <td><button onClick={() => clkedittask(task)}>Edit</button><button onClick={() => clkremovetask(index)}>Remove</button> <div><Link to={`/comment/${id}/${boardid}/${boardpos}/${storyid}/${task._id}`}> Comments </Link></div> </td>
                </tr>
                ))}
            </tbody>
            </table>
            {(role === "project_admin" || role === "member") &&<button onClick={addtask}> Add Task </button>}
            <button onClick={clickedLogout}>Logout</button>
        </div>
	);
  }
  
  export default StoryInfo;