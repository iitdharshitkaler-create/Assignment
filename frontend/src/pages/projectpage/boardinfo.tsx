import { useEffect, useState } from "react";
import { useParams } from "react-router-dom";

interface Project {
  name: string;
  description: string;
}
interface User {
    name: string;
    _id: string;
}
interface Board {
    _id: string;
    projectname: string;
    todo: [string];
    inprogress: [string];
    done: [string];
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

function BoardInfo() {
    const { id, boardid, boardpos } = useParams();  
    const[project, setProject] = useState<Project>({
        name: "",
        description: "",
    });
    const[board, setBoard] = useState<Board>({
        _id: "",
        projectname: "",
        todo: [""],
        inprogress: [""],
        done: [""],
        stories: [],
        __v: 0,
    })
    useEffect(() => {
        fetch(`http://localhost:3000/board/${id}/${boardpos}`, {
        credentials: "include"
        })
        .then(res => res.json())
        .then(data => {
            setProject(data.project);
            setBoard(data.board);
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

    const[showmembers, setShowmembers] = useState(false);
    // const [selectedUser, setSelectedUser] = useState<string | null>(null);
    async function addmember() {
        setShowmembers(true);
        // setSelectedUser(choosenuser);
    }

    async function choosemember(choosenuser: string) {
        // setSelectedUser(choosenuser);
        setShowmembers(false);
        try{
            await fetch("http://localhost:3000/addmemberinproject", {
            method: "POST",
            headers: {
                "Content-Type": "application/json"
            },
            credentials: "include",
            body: JSON.stringify({choosenuser, project})
            });
        } catch (error) {
            console.log("Server connection failed:", error);
        }
        loadMembers();
    }

    const[allprojectmember, setAllprojectmember] = useState<User[]>([]);

    async function loadMembers() {
        fetch(`http://localhost:3000/getprojectmembers/${id}`, {
        credentials: "include"
        })
        .then(res => res.json())
        .then(data => {
            setAllprojectmember(data.members);
        });
    }

    useEffect(() => {
        loadMembers();
    }, []);
    const[storyform, setStoryform] = useState(false);
    const[newstory, setNewstory] = useState("");
    const[boardindex, setBoardindex] = useState(-1);
    async function putstoryonboard(){
        try{
        await fetch(`http://localhost:3000/putstoryonboard/${id}`, {
            method: "POST",
            headers: {
            "Content-Type": "application/json"
            },
            credentials: "include",
            body: JSON.stringify([ newstory, boardindex ])
        });
        await loadBoard();
        } catch (error) {
        console.log("Server connection failed:", error);
        }
        setStoryform(false);
    }

    function clkaddstory(index: number){
        setBoardindex(index);
        setStoryform(true);
    }

    const [dragfrom, setDragfrom] = useState("");

    const [dragIndex, setDragIndex] = useState<number | null>(null);
    const [dragBoardPos, setDragBoardPos] = useState<number | null>(null);

    function handleDragStart(index: number, pos: number) {
        setDragIndex(index);
        setDragBoardPos(pos);
    }

    function allowDrop(e: React.DragEvent) {
        e.preventDefault();
    }

    async function handleDrop() {
        if(dragIndex === null || dragBoardPos === null) return;
        try{
            await fetch(`http://localhost:3000/movestoryonboard/${id}`, {
                method: "POST",
                headers: {
                    "Content-Type": "application/json"
                },
                credentials: "include",
                body: JSON.stringify({
                    boardIndex: dragBoardPos,
                    storyIndex: dragIndex,
                    from: dragfrom,
                })
            });
        } catch(error){
            console.log("Server connection failed:", error);
        }
        
        setDragIndex(null);
        setDragBoardPos(null);
        loadBoard();
    }

    async function loadBoard() {
        try {
            const res = await fetch(`http://localhost:3000/board/${id}/${boardpos}`, {
                credentials: "include"
            });

            const data = await res.json();

            setProject(data.project);
            setBoard(data.board);

        } catch (error) {
            console.log("Board reload failed:", error);
        }
    }
    useEffect(() => {
        loadBoard();
    }, [id, boardpos]);

    const[show, setShow] = useState(false);
    function showTeammembers(){
        setShow(prev => !prev);
    }

	return (

	  <div className="container">
        <h1>Projet: {project.name}</h1>
        <h1>Board {boardpos} </h1>
        <h2>{boardid}</h2>
    <h2 className="header">Team Members: </h2>
    <button onClick={showTeammembers}>Show team members </button> {
        show && <div>
    <table style={{ width: '100%', borderCollapse: 'collapse', marginTop: '20px' }}>
    <thead>
        <tr style = {{textAlign : 'left',borderBottom : '1px solidd #eee'}}>
        <th style = {{padding  :'12px 0' }}>Name</th>
        <th style = {{padding : '12px 0' }}>Role</th>
        <th style = {{padding : '12px 0' }}>Associated stories/task</th>
        </tr>
    </thead>
    <tbody>
        {allprojectmember?.map((user, index) => (
        <tr key={index}>
            <td>{user.name}</td>
            <td>member</td>
            <td>nothing</td>
        </tr>
        ))}
    </tbody>
    </table>
    <button className="button" onClick={addmember} >Add Team Member</button>
    </div> }

    {showmembers && (
        <div>
            <table>
            <tbody>
                {allusers.map((user, index) => (
                <tr key = {index} onClick={() => choosemember(user._id)}>
                    <td>{user.name}</td>
                </tr>
                ))}
            </tbody>
            </table>
        </div>
        )}
    <br></br>
    <div>
        <div>

            { storyform && 
                <div> 
                    <form method="post">
                        Story: <input onChange={(e) => setNewstory(e.target.value)}/></form>
                        <button onClick={putstoryonboard}>done</button>
                    </div>}

            <div>Stories
                <button onClick={() => clkaddstory(Number(boardpos))}> add story  </button>
                <button> put story on board</button>
                <button> remove story</button>
                <div>
                    <table style={{ width: '100%', borderCollapse: 'collapse', marginTop: '20px' }}>
                    <thead>
                        <tr style = {{textAlign : 'left',borderBottom : '1px solidd #eee'}}>
                        <th style = {{padding  :'12px 0' }}>Name</th>
                        <th style = {{padding : '12px 0' }}>Tasks</th>
                        <th style = {{padding : '12px 0' }}>Status</th>
                        <th style = {{padding : '12px 0' }}>Actions</th>
                        </tr>
                    </thead>
                    <tbody>
                        {board.stories?.map((story) => (
                        <tr key={story._id}>
                            <td>
                                <a href={`/storyinfo/${id}/${board._id}/${boardpos}/${story._id}`}> {story.storyname} </a></td>
                            <td>{story.tasks?.length ?? 0} </td>
                            <td>{story.status}</td>
                            <td>
                                <button>add to board</button>
                                <button>Del story</button>
                            </td>
                        </tr>
                        ))}
                    </tbody>
                    </table>
                 </div>
            </div>

            <div style={{backgroundColor: "yellow"}}> Kanban Board
                <div className="to-do" style={{ backgroundColor: "red" }}> TO-DO
                {board.todo.map((story, index) => (
                    <div key={index} draggable onDragStart={() => {handleDragStart(index, Number(boardpos)); setDragfrom("todo")}}> {story} </div>
                    ))}
                </div>

                <div className="in-progress" style={{ backgroundColor: "blue" }} onDragOver={allowDrop} onDrop={handleDrop} > IN-PROGRESS
                    {board.inprogress.map((story, index) => (
                        <div key={index} draggable onDragStart={() => {handleDragStart(index, Number(boardpos)); setDragfrom("inprogress")}} > {story} </div>
                    ))}
                </div>

                <div className="done" style={{ backgroundColor: "green" }} onDragOver={allowDrop} onDrop={handleDrop} > DONE
                {board.done.map((story, index) => (
                    <div key={index} > {story}</div>
                ))}
            </div>
            </div>
        </div>
    </div>
    
	</div>
	);
  }
  
  export default BoardInfo;