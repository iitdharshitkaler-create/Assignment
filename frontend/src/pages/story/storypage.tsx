import { useEffect, useState } from "react";
import { useParams } from "react-router-dom";

interface Board {
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
    const [taskform, setTaskform] = useState(false);
    async function clkdone(){
        try{
            await fetch(`http://localhost:3000/addtaskinstory`, {
            method: "POST",
            headers: {
                "Content-Type": "application/json"
            },
            credentials: "include",
            body: JSON.stringify({ taskname, taskdescription, storyid  })
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
        priority: ""
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
        loadStories();
    }
    function clkedittask(task: Task){
        setEdittask(task);
        SetEditform(true);
    }

    const [allusers, setAllusers] = useState<User[]>([]);
    useEffect(() => {
        fetch(`http://localhost:3000/allusers`, {
        credentials: "include"
        })
        .then(res => res.json())
        .then(data => {
            setAllusers(data.userlist);
        });
    }, []); 

	return (
        
        <div> 
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
                        <button onClick={clkdone}>done</button>
                    </div>}
            { editform && 
                <div> 
                    <form> Assignee: <select value={edittask.assigneeid} onChange={(e) => setEdittask({ ...edittask, assigneeid: e.target.value })}>
                         <option value="">Select Assignee</option>
                         {allusers.map(user => (
                            <option key={user._id} value={user._id}>
                                {user.name}
                            </option>
                        ))}
                        </select></form>
                    <form> Reporter: <select value={edittask.assigneeid} onChange={(e) => setEdittask({ ...edittask, reporterid: e.target.value })}>
                         <option value="">Select Assignee</option>
                         {allusers.map(user => (
                            <option key={user._id} value={user._id}>
                                {user.name}
                            </option>
                        ))}
                        </select></form>
                    <form> Status: <select value={edittask.status} onChange={(e) => setEdittask({...edittask, status: e.target.value})} >
                        <option>todo</option>
                        <option>inprogess</option>
                        <option>done</option>
                        </select></form>
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
                <th style = {{padding  :'12px 0' }}>Name</th>
                <th style = {{padding : '12px 0' }}>Description</th>
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
                    <td>{task.assignee}</td>
                    <td>{task.reporter}</td>
                    <td>{task.status}</td>
                    <td>{task.dueDate}</td>
                    <td>{task.priority}</td>
                    <td><button onClick={() => clkedittask(task)}>Edit</button><button onClick={() => clkremovetask(index)}>Remove</button></td>
                </tr>
                ))}
            </tbody>
            </table>
            <button onClick={addtask}>Add Task</button>
        </div>
	);
  }
  
  export default StoryInfo;