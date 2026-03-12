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
    __v: number;
}

function Project() {
    const { id } = useParams();  
    const[project, setProject] = useState<Project>({
        name: "",
        description: "",
    });
    const[g_admin, setG_admin] = useState("");
    useEffect(() => {
        fetch(`http://localhost:3000/project/${id}`, {
        credentials: "include"
        })
        .then(res => res.json())
        .then(data => {
            setProject(data.project);
            setG_admin(data.name);
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
        loadMembers();
    }, []);

    useEffect(() => {
        loadBoards();
    }, []);






    // const[storyform, setStoryform] = useState(false);
    // const[newstory, setNewstory] = useState("");
    // const[boardindex, setBoardindex] = useState(-1);
    // async function putstoryonboard(){
    //     try{
    //     await fetch(`http://localhost:3000/putstoryonboard/${id}`, {
    //         method: "POST",
    //         headers: {
    //         "Content-Type": "application/json"
    //         },
    //         credentials: "include",
    //         body: JSON.stringify([newstory, boardindex])
    //     });
    //     await loadBoards(); 
    //     } catch (error) {
    //     console.log("Server connection failed:", error);
    //     }
    //     setStoryform(false);
    // }

    // function clkaddstory(pos: number){
    //     setBoardindex(pos);
    //     setStoryform(true);
    // }

    // async function clkdelboard(pos:number){
    //     try{
    //     await fetch(`http://localhost:3000/deleteboard/${id}`, {
    //         method: "POST",
    //         headers: {
    //         "Content-Type": "application/json"
    //         },
    //         credentials: "include",
    //         body: JSON.stringify( { pos })
    //     });
    //     await loadBoards(); 
    //     } catch (error) {
    //     console.log("Server connection failed:", error);
    //     }
    // }



    // const [dragfrom, setDragfrom] = useState("");

    // const [dragIndex, setDragIndex] = useState<number | null>(null);
    // const [dragBoardPos, setDragBoardPos] = useState<number | null>(null);

    // function handleDragStart(index: number, pos: number) {
    //     setDragIndex(index);
    //     setDragBoardPos(pos);
    // }

    // function allowDrop(e: React.DragEvent) {
    //     e.preventDefault();
    // }

    // async function handleDrop() {
    //     if(dragIndex === null || dragBoardPos === null) return;
    //     try{
    //         await fetch(`http://localhost:3000/movestoryonboard/${id}`, {
    //             method: "POST",
    //             headers: {
    //                 "Content-Type": "application/json"
    //             },
    //             credentials: "include",
    //             body: JSON.stringify({
    //                 boardIndex: dragBoardPos,
    //                 storyIndex: dragIndex,
    //                 from: dragfrom,
    //             })
    //         });
    //     } catch(error){
    //         console.log("Server connection failed:", error);
    //     }

    //     setDragIndex(null);
    //     setDragBoardPos(null);
    //     loadBoards();
    // }

	return (
	  <div className="container">
		<h1 className="header">Project Name: {project.name} </h1>
		{/* the name of project selected is here */}
		<h1 className="header">Project Desciption: {project.description}</h1>

    {/* {showmembers && (
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
        )} */}

    {/* <table style={{ width: '50%', borderCollapse: 'collapse', marginTop: '20px' }}>
      <thead>
        <tr style = {{textAlign : 'left',borderBottom : '1px solidd #eee'}}>
          <th style = {{padding  :'12px 0' }}>Stories</th>
          <th style = {{padding : '12px 0' }}>Status</th>
        </tr>
      </thead>
    </table> */}
    <br></br>
    <button onClick={clkaddboard}> ADDboard </button>
    <div>
        <div>
            {allboard?.map((board, boardpos) => (
                <a key={boardpos} href={`/projectinfo/${id}/${board._id}/${boardpos}`}>
                    Board {boardpos}
                </a>
            ))}
        </div>
    </div>
    
	</div>
	);
  }
  
  export default Project;