import { useEffect, useState } from "react";
import { useParams } from "react-router-dom";

interface Project {
  name: string;
  description: string;
  project_admin: User[];
}
interface User {
    name: string;
    _id: string;
}
interface Column {
    name: string;
    tasks: Task[];
}
interface Board {
    _id: string;
    projectname: string;
    columns: {name: string, tasks: Task[]}[]
    stories: Story[ ];
    __v: number;
}
interface Story {
    _id: string;
    boardname: string;
  storyname: string;
  status: string;
  tasks: [string];
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

function Project() {
    const { id } = useParams();  
    const[project, setProject] = useState<Project>({
        name: "",
        description: "",
        project_admin: [],
    });

    useEffect(() => {
        fetch(`http://localhost:3000/project/${id}`, {
        credentials: "include"
        })
        .then(res => res.json())
        .then(data => {
            setProject(data.project);
        });
    }, []); 

    const[allusers, setAllusers] = useState<User[]>([]);
    useEffect(() => {
        fetch(`http://localhost:3000/allusers`, {
        credentials: "include"
        })
        .then(res => res.json())
        .then(data => {
            setAllusers(data.userlist);
        });
    }, []); 

    const[allprojectadmins, setAllprojectadmins] = useState<User[]>([]);
    async function loadAdmins() {
        fetch(`http://localhost:3000/getprojectadmins/${id}`, {
        credentials: "include"
        })
        .then(res => res.json())
        .then(data => {
            setAllprojectadmins(data.project_admins);
        });
    }
    useEffect(() =>{
        loadAdmins();
    }, [])
    async function clkaddboard() {
        try{
            await fetch("http://localhost:3000/addboardinproject", {
            method: "POST",
            headers: {
                "Content-Type": "application/json"
            },
            credentials: "include",
            body: JSON.stringify({ project })
            });
        } catch (error) {
            console.log("Server connection failed:", error);
        }
        loadBoards();
    }

    const[allboard, setAllboard] = useState<Board[]>([]);

    async function loadBoards() {
        fetch(`http://localhost:3000/getprojectboards/${id}`, {
        credentials: "include"
        })
        .then(res => res.json())
        .then(data => {
            setAllboard(data.boards);
        });
    }
    useEffect(() => {
        loadBoards();
    }, []);

    const [seletPadmin, setSelectPadmin] = useState(false);
    const[project_admin, setProject_admin] = useState("");
    function clkaddprojectadmin(){
        setSelectPadmin(true);
    }
    async function clkaddpadmin() {
        setSelectPadmin(false);
        try{
            await fetch("http://localhost:3000/addadminproject", {
            method: "POST",
            headers: {
                "Content-Type": "application/json"
            },
            credentials: "include",
            body: JSON.stringify({ id, project_admin})
            });
        } catch (error) {
            console.log("Server connection failed:", error);
        }
        loadBoards();
        loadAdmins();
    }
	return (
	  <div className="container">
		<h1 className="header">Project Name: {project.name} </h1>
		{/* the name of project selected is here */}
		<h1 className="header">Project Desciption: {project.description}</h1>
    <br></br>

    <div>Project Admins
        <div>
            {allprojectadmins.map ((user, pos) => (
                <div key={pos}>
                    {user.name}
                </div>
            ))}
        </div>
    </div>

    { seletPadmin && <div>
        <form> Choose your project admin <select value={project_admin} onChange={(e) => setProject_admin( e.target.value )}>
                         <option value="">Select Assignee</option>
                         {allusers.map(user => (
                            <option key={user._id} value={user._id}>
                                {user.name}
                            </option>
                        ))}
                        </select></form>
                        <button type="button" onClick={clkaddpadmin}>Done</button>
                        </div> }
    <button onClick={clkaddprojectadmin}> ADD ProjectAdmin </button>
    <button onClick={clkaddboard}> ADDboard </button>

    <div>
        <div>
            {allboard?.map((board, boardpos) => (
                <div>
                <a key={boardpos} href={`/projectinfo/${id}/${board._id}/${boardpos}`}>
                    Board {boardpos}
                </a>
                </div>
            ))}
        </div>
    </div>
    
	</div>
	);
  }
  
  export default Project;