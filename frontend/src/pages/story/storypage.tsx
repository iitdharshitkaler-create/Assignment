import { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import { Link } from "react-router-dom";
import styles from "./storypage.module.css";interface Board {
    _id: string;
    projectname: string;
    todo: [string];
    inprogress: [string];
    done: [string];
    stories: Story[ ];
    __v: number;
}

interface User {
    name: string;
    _id: string;
}

interface Task {
    _id: string;
    boardname: string;
    storyname: string;
    name: string;
    description: string; 
    assigneeid: string;
    assignee: string;
    reporterid: string;
    reporter: string;
    status: string;
    dueDate: string;
    priority: string;
    tasktype: string;
}

interface Story {
    _id: string;
    boardname: string;
  storyname: string;
  status: string;
  tasks: Task[];
}

function StoryInfo() {
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
    })
    const [editform, SetEditform] = useState(false);
    async function editdone(){
        try{
            await fetch(`http://localhost:3000/updatetask`, {
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
    }, []); 

	return (
        
        <div className={styles.container}> 
			<div className={styles.textCard}>
	            <h1>Projectname: {projectname}</h1>
	            <h1>Board {boardpos}</h1>
	            <h1>Story: {story.storyname}</h1>
	            <h1>Status: {story.status}</h1>
	            <h1>Tasks:</h1>
			</div>
			<div className={styles.textCard} >
            { taskform && 
                <div style={{lineHeight:"170%"}}> 
                    <form method="post">
                        Name: <input className={styles.textButton} onChange={(e) => setTaskname(e.target.value)}/></form>
                        <form>Description: <input className={styles.textButton} onChange={(e) => setTaskdescription(e.target.value)} /></form>
                        <form>TaskTye:<select className={styles.textButton} value={tasktype} onChange={(e) => setTasktype(e.target.value)} >
                        <option>Normal</option>
                        <option>Bug</option>
                        </select></form>
                        <button className={styles.actionButton} onClick={clkdone}>done</button>
                    </div>}
            { editform && 
                <div style={{lineHeight: "30px"}}> 
                    <form> <span style={{wordSpacing:"30px"}}>Assignee: </span><select className={styles.textButton} value={edittask.assigneeid} onChange={(e) => setEdittask({ ...edittask, assigneeid: e.target.value })}>
                         <option value="">Select Assignee</option>
                         {allmembers.map(user => (
                            <option key={user._id} value={user._id}>
                                {user.name}
                            </option>
                        ))}
                        </select></form>
                    <form> style={{wordSpacing:"33px"}}>Reporter: </span> <select className={styles.textButton}  value={edittask.reporterid} onChange={(e) => setEdittask({ ...edittask, reporterid: e.target.value })}>
                         <option value="">Select Assignee</option>
                         {allmembers.map(user => (
                            <option key={user._id} value={user._id}>
                                {user.name}
                            </option>
                        ))}
                        </select></form>
                    <form> <span style={{wordSpacing:"45px"}}>Priority: </span> <select className={styles.textButton}  value={edittask.priority} onChange={(e) => setEdittask({...edittask, priority: e.target.value})}>
                        <option>Low</option>
                        <option>Medium</option>
                        <option>High</option>
                        <option>Critcal</option>
                        </select></form>
                    <form>
                         <span style={{wordSpacing:"34px"}}>Duedate: </span>
                        <input className={styles.textButton} type="date" value={edittask.dueDate} onChange={(e) => setEdittask({ ...edittask, dueDate: e.target.value }) } /> </form>
                    <button className={styles.actionButton}  onClick={editdone}>done</button>
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
                    <td><button className={styles.actionButton}  onClick={() => clkedittask(task)}>Edit</button>
						<button className={styles.actionButton}  onClick={() => clkremovetask(index)}>Remove</button>
						<div><Link to={`/comment/${id}/${boardid}/${boardpos}/${storyid}/${task._id}`}> Comments </Link></div> </td>
                </tr>
                ))}
            </tbody>
            </table>
            <button className={styles.actionButton}  onClick={addtask}> Add Task </button>
        </div>
		</div>
	);
  }
  
  export default StoryInfo;
