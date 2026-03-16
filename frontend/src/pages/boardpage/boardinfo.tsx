// import { useEffect, useState } from "react";
// import { useParams, useNavigate } from "react-router-dom";
// import type { Project, User, Board } from "../../types/type";

// function BoardInfo() {
//     const navigate = useNavigate();
//     const [role, setRole] = useState("");
//     const { id, boardid, boardpos } = useParams();  
//     const[project, setProject] = useState<Project>({
//         name: "",
//         description: "",
//         project_admin: [],
//     });
//     const[board, setBoard] = useState<Board>({
//         _id: "",
//         projectname: "",
//         columns: [],
//         stories: [],
//         __v: 0,
//     })
//     useEffect(() => {
//         fetch(`http://localhost:3000/board/${id}/${boardpos}`, {
//         credentials: "include"
//         })
//         .then(res => res.json())
//         .then(data => {
//             setProject(data.project);
//             setBoard(data.board);
//             setRole(data.role);
//         });
//     },[]); 

//     const[allusers, setAllusers] = useState<User[]>([]);
//     useEffect(() => {
//         fetch(`http://localhost:3000/allusers`, {
//         credentials: "include"
//         })
//         .then(res => res.json())
//         .then(data => {
//             setAllusers(data.userlist);
//         });
//     }, []); 

//     const[showmembers, setShowmembers] = useState(false);
//     // const [selectedUser, setSelectedUser] = useState<string | null>(null);
//     async function addmember() {
//         setShowmembers(true);
//         // setSelectedUser(choosenuser);
//     }

//     async function choosemember(choosenuser: string) {
//         // setSelectedUser(choosenuser);
//         setShowmembers(false);
//         try{
//             await fetch("http://localhost:3000/addmemberinproject", {
//             method: "POST",
//             headers: {
//                 "Content-Type": "application/json"
//             },
//             credentials: "include",
//             body: JSON.stringify({choosenuser, project})
//             });
//         } catch (error) {
//             console.log("Server connection failed:", error);
//         }
//         loadMembers();
//     }

//     const[allprojectmember, setAllprojectmember] = useState<User[]>([]);

//     async function loadMembers() {
//         fetch(`http://localhost:3000/getprojectmembers/${id}`, {
//         credentials: "include"
//         })
//         .then(res => res.json())
//         .then(data => {
//             setAllprojectmember(data.members);
//         });
//     }

//     useEffect(() => {
//         loadMembers();
//     },[]);
//     const[storyform, setStoryform] = useState(false);
//     const[newstory, setNewstory] = useState("");
//     const[boardindex, setBoardindex] = useState(-1);
//     async function putstoryonboard(){
//         try{
//         await fetch(`http://localhost:3000/putstoryonboard/${id}`, {
//             method: "POST",
//             headers: {
//             "Content-Type": "application/json"
//             },
//             credentials: "include",
//             body: JSON.stringify([ newstory, boardindex ])
//         });
//         await loadBoard();
//         } catch (error) {
//         console.log("Server connection failed:", error);
//         }
//         setStoryform(false);
//     }

//     function clkaddstory(index: number){
//         setBoardindex(index);
//         setStoryform(true);
//     }

//     const [dragTaskId, setDragTaskId] = useState<string | null>(null);
//     const [dragFrom, setDragfrom] = useState<number | null>(null);

//     function handleDragStart(taskid: string, columnpos: number) {
//         setDragTaskId(taskid);
//         setDragfrom(columnpos);
//     }

//     function allowDrop(e: React.DragEvent) {
//         e.preventDefault();
//     }

//     async function handleDrop(columnpos: number) {
//         if(dragFrom !== null && (columnpos - dragFrom) == 1) {
//              try{
//                 await fetch(`http://localhost:3000/movetaskonboard`, {
//                     method: "POST",
//                     headers: {
//                         "Content-Type": "application/json"
//                     },
//                     credentials: "include",
//                     body: JSON.stringify({
//                         boardid: board._id,
//                         taskid: dragTaskId,
//                         from: dragFrom,
//                         to: columnpos
//                     })
//                 });
//                 loadBoard();
//             } catch(error){
//                 console.log("Server connection failed:", error);
//             }
//         }
//         setDragTaskId(null);
//         setDragfrom(null);
//         loadBoard();
//     }

//     async function loadBoard() {
//         try {
//             const res = await fetch(`http://localhost:3000/board/${id}/${boardpos}`, {
//                 credentials: "include"
//             });

//             const data = await res.json();

//             setProject(data.project);
//             setBoard(data.board);

//         } catch (error) {
//             console.log("Board reload failed:", error);
//         }
//     }
//     useEffect(() => {
//         loadBoard();
//     }, []);

//     const[show, setShow] = useState(false);
//     function showTeammembers(){
//         setShow(prev => !prev);
//     }

//     async function clkaddtoboard(storyid: string) {
//         try {
//             await fetch("http://localhost:3000/addstorytoboard/", {
//                 method: "POST",
//                 headers: {
//                     "Content-Type": "application/json"
//                 },
//                 credentials: "include",
//                 body: JSON.stringify({ storyid })
//             });
//             loadBoard();   // reload board data
//         } catch (error) {
//             console.log("Server connection failed:", error);
//         }
//     }

//     const [newname, setNewname] = useState("");
//     const [columnform, setColumnform] = useState(false);
//     const [renameform, setRenameform] = useState(false);
//     const [columnpos, setColumnpos] = useState(0);

//     function edittheboard() {
//         const boardIsEmpty = board.columns.every(column => column.tasks.length === 0);
//         if(boardIsEmpty) {
//             setColumnform(true);
//         }
//     }
    
//     async function donerenaming(){
//         setRenameform(false);
//         try {
//             await fetch("http://localhost:3000/renamecolumn", {
//                 method: "POST",
//                 headers: {
//                     "Content-Type": "application/json"
//                 },
//                 credentials: "include",
//                 body: JSON.stringify({ newname, boardid, columnpos})
//             });
//             loadBoard();
//             setNewname("");   // reload board data
//         } catch (error) {
//             console.log("Server connection failed:", error);
//         }
//         setColumnform(false);
//     }
    
//     function clkrenamecolumn(pos: number){
//         setRenameform(true);
//         setColumnpos(pos);
//     }

//     async function clkdeletecolumn(pos: number){
//         try {
//             await fetch("http://localhost:3000/deletecolumn", {
//                 method: "POST",
//                 headers: {
//                     "Content-Type": "application/json"
//                 },
//                 credentials: "include",
//                 body: JSON.stringify({ boardid, pos})
//             });
//             loadBoard();   // reload board data
//             setColumnform(false);
//         } catch (error) {
//             console.log("Server connection failed:", error);
//         }
//     }

//     function clkaddcolumn(){
//         setRenameform(true);
//         setColumnpos(-1);
//     }
//     async function clickedLogout() {

//         try{
//         const res = await fetch("http://localhost:3000/logout", {
//             method:"POST",
//             credentials: "include"
//         });
//         const cond = await res.json();
//         if(cond.logout){
//             navigate("/");
//         }
//         } catch (error) {
//         console.log("Server connection failed:", error);
//         }
//     }
//     const [user, setUser] = useState<User>({
//         _id: "",
//         name: "",
//         avatar: "",
//       }); 
//       useEffect(() => {
//         fetch("http://localhost:3000/profile", {
//           credentials: "include"
//         })
//           .then(res => res.json())
//           .then(data => {
//             setUser({
//               _id: data._id,
//               name: data.name,
//               avatar: data.avatar
//             });
//           });
//       }, []);
// 	return (

// 	<div className="container">
//         <div>
//             <header>
//                 <h1>Profile</h1>
//                 <div>
//                 <div>Name: {user.name} </div>
//                 <div>Avatar: <img src={`/${user.avatar}.jpeg`} height={"40px"}/> </div>
//                 </div>
//             </header>
//         </div>
//         <h1>Projet: {project.name}</h1>
//         <h1>Board {boardpos} </h1>
//     <h2 className="header">Team Members: </h2>
//     <button onClick={showTeammembers}>Show team members </button> {
//         show && <div>
//     <table style={{ width: '100%', borderCollapse: 'collapse', marginTop: '20px' }}>
//     <thead>
//         <tr style = {{textAlign : 'left',borderBottom : '1px solidd #eee'}}>
//         <th style = {{padding  :'12px 0' }}>Name</th>
//         <th style = {{padding : '12px 0' }}>Role</th>
//         <th style = {{padding : '12px 0' }}>Associated stories/task</th>
//         </tr>
//     </thead>
//     <tbody>
//         {allprojectmember?.map((user, index) => (
//         <tr key={index}>
//             <td>{user.name}</td>
//             <td>member</td>
//             <td>nothing</td>
//         </tr>
//         ))}
//     </tbody>
//     </table>
//      {(role === "global_admin" || role === "project_admin") && <button className="button" onClick={addmember} >Add Team Member</button>}
//     </div> }

//     {showmembers && (
//         <div>
//             <table>
//             <tbody>
//                 {allusers.map((user, index) => (
//                 <tr key = {index} onClick={() => choosemember(user._id)}>
//                     <td>{user.name}</td>
//                 </tr>
//                 ))}
//             </tbody>
//             </table>
//         </div>
//         )}
//     <br></br>
//     <div>
//         <div>
//             { storyform && 
//                 <div> 
//                     <form method="post">
//                         Story: <input onChange={(e) => setNewstory(e.target.value)}/></form>
//                         <button onClick={putstoryonboard}>done</button>
//                     </div>}
//             <div>Stories
//                 {(role === "project_admin") && <button onClick={() => clkaddstory(Number(boardpos))}> add story  </button> }
//                 <div>
//                     <table style={{ width: '100%', borderCollapse: 'collapse', marginTop: '20px' }}>
//                     <thead>
//                         <tr style = {{textAlign : 'left',borderBottom : '1px solidd #eee'}}>
//                         <th style = {{padding  :'12px 0' }}> Name </th>
//                         <th style = {{padding : '12px 0' }}> Tasks </th>
//                         <th style = {{padding : '12px 0' }}> Status </th>
//                         <th style = {{padding : '12px 0' }}> Actions </th>
//                         </tr>
//                     </thead>
//                     <tbody>
//                         {board.stories?.map((story) => (
//                         <tr key={story._id} >
//                             <td>
//                                 <a href={`/storyinfo/${id}/${board._id}/${boardpos}/${story._id}`}> {story.storyname} </a></td>
//                             <td> {story.tasks?.length ?? 0} </td>
//                             <td> {story.status} </td>
//                             <td>
//                                 {(role === "project_admin") &&  <button onClick={() => clkaddtoboard(story._id)}> Add to Board</button>}
//                                 <button>Del story</button>
//                             </td>
//                         </tr>
//                         ))}
//                     </tbody>
//                     </table>
//                  </div>
//             </div>
//             <div style={{backgroundColor: "yellow"}}> Kanban Board {board.columns.map((column, pos) => (
//                     <div key = {pos} style={{ backgroundColor: "red" }} onDragOver={allowDrop} onDrop={() => handleDrop(pos)}> {column.name}
//                     {column.tasks.map((task, index) => (
//                         <div key={index} draggable = {task.assigneeid === user._id} style={{ opacity: task.assigneeid === user._id ? 1 : 0.5, cursor: task.assigneeid === user._id ? "grab" : "not-allowed" }} onDragStart={() => {handleDragStart(task._id, pos)}}> {task.name} </div>
//                         ))}
//                     {columnform &&
//                     <div>
//                         <button onClick={() => clkrenamecolumn(pos)}>Rename</button>
//                         <button onClick={() => clkdeletecolumn(pos)}>Delete</button>
//                     </div>}
//                     </div>
//                     ))}
//                     {renameform && 
//                         <div>
//                             <form>
//                                 <input value={newname} onChange={(e) => setNewname(e.target.value)} />
//                             </form>
//                             <button onClick={donerenaming}>Done</button>
//                         </div>
//                         }
//                     {columnform &&
//                     <button onClick={clkaddcolumn}>Add column</button>}
//             </div>
            
//         </div>
//          {(role === "project_admin") && <button onClick={edittheboard}>Edit board</button> }
//     </div>
//     <button onClick={clickedLogout}>Logout</button>
// 	</div>
// 	);
//   }
  
//   export default BoardInfo;


import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import type { Project, User, Board } from "../../types/type";
import styles from "./boarfinfo.module.css";


function BoardInfo() {
    const navigate = useNavigate();
    const { id, boardid, boardpos } = useParams();

    const [role, setRole] = useState("");

    const [project, setProject] = useState<Project>({
        name: "",
        description: "",
        project_admin: [],
    });

    const [board, setBoard] = useState<Board>({
        _id: "",
        projectname: "",
        columns: [],
        stories: [],
        __v: 0,
    });

    useEffect(() => {
        fetch(`http://localhost:3000/board/${id}/${boardpos}`, {
            credentials: "include",
        })
            .then(res => res.json())
            .then(data => {
                setProject(data.project);
                setBoard(data.board);
                setRole(data.role);
            });
    }, []);

    const [allusers, setAllusers] = useState<User[]>([]);

    useEffect(() => {
        fetch(`http://localhost:3000/allusers`, {
            credentials: "include",
        })
            .then(res => res.json())
            .then(data => {
                setAllusers(data.userlist);
            });
    }, []);

    const [showmembers, setShowmembers] = useState(false);

    async function addmember() {
        setShowmembers(true);
    }

    async function choosemember(choosenuser: string) {
        setShowmembers(false);

        try {
            await fetch("http://localhost:3000/addmemberinproject", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                credentials: "include",
                body: JSON.stringify({ choosenuser, project }),
            });
        } catch (error) {
            console.log("Server connection failed:", error);
        }

        loadMembers();
    }

    const [allprojectmember, setAllprojectmember] = useState<User[]>([]);

    async function loadMembers() {
        fetch(`http://localhost:3000/getprojectmembers/${id}`, {
            credentials: "include",
        })
            .then(res => res.json())
            .then(data => {
                setAllprojectmember(data.members);
            });
    }

    useEffect(() => {
        loadMembers();
    }, []);

    const [storyform, setStoryform] = useState(false);
    const [newstory, setNewstory] = useState("");
    const [boardindex, setBoardindex] = useState(-1);

    async function putstoryonboard() {
        try {
            await fetch(`http://localhost:3000/putstoryonboard/${id}`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                credentials: "include",
                body: JSON.stringify([newstory, boardindex]),
            });

            await loadBoard();
        } catch (error) {
            console.log("Server connection failed:", error);
        }

        setStoryform(false);
    }

    function clkaddstory(index: number) {
        setBoardindex(index);
        setStoryform(true);
    }

    const [dragTaskId, setDragTaskId] = useState<string | null>(null);
    const [dragFrom, setDragfrom] = useState<number | null>(null);

    function handleDragStart(taskid: string, columnpos: number) {
        setDragTaskId(taskid);
        setDragfrom(columnpos);
    }

    function allowDrop(e: React.DragEvent) {
        e.preventDefault();
    }

    async function handleDrop(columnpos: number) {
        if (dragFrom !== null && columnpos - dragFrom === 1) {
            try {
                await fetch(`http://localhost:3000/movetaskonboard`, {
                    method: "POST",
                    headers: {
                        "Content-Type": "application/json",
                    },
                    credentials: "include",
                    body: JSON.stringify({
                        boardid: board._id,
                        taskid: dragTaskId,
                        from: dragFrom,
                        to: columnpos,
                    }),
                });

                loadBoard();
            } catch (error) {
                console.log("Server connection failed:", error);
            }
        }

        setDragTaskId(null);
        setDragfrom(null);
        loadBoard();
    }

    async function loadBoard() {
        try {
            const res = await fetch(
                `http://localhost:3000/board/${id}/${boardpos}`,
                { credentials: "include" }
            );

            const data = await res.json();

            setProject(data.project);
            setBoard(data.board);
        } catch (error) {
            console.log("Board reload failed:", error);
        }
    }

    useEffect(() => {
        loadBoard();
    }, []);

    const [show, setShow] = useState(false);

    function showTeammembers() {
        setShow(prev => !prev);
    }

    async function clkaddtoboard(storyid: string) {
        try {
            await fetch("http://localhost:3000/addstorytoboard/", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                credentials: "include",
                body: JSON.stringify({ storyid }),
            });

            loadBoard();
        } catch (error) {
            console.log("Server connection failed:", error);
        }
    }

    const [newname, setNewname] = useState("");
    const [columnform, setColumnform] = useState(false);
    const [renameform, setRenameform] = useState(false);
    const [columnpos, setColumnpos] = useState(0);

    function edittheboard() {
        const boardIsEmpty = board.columns.every(
            column => column.tasks.length === 0
        );

        if (boardIsEmpty) {
            setColumnform(true);
        }
    }

    async function donerenaming() {
        setRenameform(false);

        try {
            await fetch("http://localhost:3000/renamecolumn", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                credentials: "include",
                body: JSON.stringify({ newname, boardid, columnpos }),
            });

            loadBoard();
            setNewname("");
        } catch (error) {
            console.log("Server connection failed:", error);
        }

        setColumnform(false);
    }

    function clkrenamecolumn(pos: number) {
        setRenameform(true);
        setColumnpos(pos);
    }

    async function clkdeletecolumn(pos: number) {
        try {
            await fetch("http://localhost:3000/deletecolumn", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                credentials: "include",
                body: JSON.stringify({ boardid, pos }),
            });

            loadBoard();
            setColumnform(false);
        } catch (error) {
            console.log("Server connection failed:", error);
        }
    }

    function clkaddcolumn() {
        setRenameform(true);
        setColumnpos(-1);
    }

    async function clickedLogout() {
        try {
            const res = await fetch("http://localhost:3000/logout", {
                method: "POST",
                credentials: "include",
            });

            const cond = await res.json();

            if (cond.logout) {
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
            credentials: "include",
        })
            .then(res => res.json())
            .then(data => {
                setUser({
                    _id: data._id,
                    name: data.name,
                    avatar: data.avatar,
                });
            });
    }, []);

    return (
        <div className={styles.container}>
            <header>
                <h1 className={styles.title}>Profile</h1>

                <div className={styles.profile}>
                    <div>{user.name}</div>
                    <img
                        src={`/${user.avatar}.jpeg`}
                        height={"40px"}
                        className={styles.avatar}
                    />
                </div>
            </header>

            <h1>Project: {project.name}</h1>
            <h1>Board {boardpos}</h1>

            <h2>Team Members</h2>

            <button className={styles.button} onClick={showTeammembers}>
                Show team members
            </button>

            {show && (
                <div>
                    <table className={styles.table}>
                        <thead>
                            <tr>
                                <th>Name</th>
                                <th>Role</th>
                                <th>Associated stories/task</th>
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

                    {(role === "global_admin" ||
                        role === "project_admin") && (
                        <button
                            className={styles.button}
                            onClick={addmember}
                        >
                            Add Team Member
                        </button>
                    )}
                </div>
            )}

            {showmembers && (
                <div>
                    <table className={styles.table}>
                        <tbody>
                            {allusers.map((user, index) => (
                                <tr
                                    key={index}
                                    onClick={() =>
                                        choosemember(user._id)
                                    }
                                >
                                    <td>{user.name}</td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            )}

            <div className={styles.storySection}>
                {storyform && (
                    <div className={styles.form}>
                        Story:
                        <input
                            className={styles.input}
                            onChange={e =>
                                setNewstory(e.target.value)
                            }
                        />
                        <button
                            className={styles.button}
                            onClick={putstoryonboard}
                        >
                            Done
                        </button>
                    </div>
                )}

                <div>
                    Stories
                    {role === "project_admin" && (
                        <button
                            className={styles.button}
                            onClick={() =>
                                clkaddstory(Number(boardpos))
                            }
                        >
                            Add Story
                        </button>
                    )}

                    <table className={styles.table}>
                        <thead>
                            <tr>
                                <th>Name</th>
                                <th>Tasks</th>
                                <th>Status</th>
                                <th>Actions</th>
                            </tr>
                        </thead>

                        <tbody>
                            {board.stories?.map(story => (
                                <tr key={story._id}>
                                    <td>
                                        <a
                                            href={`/storyinfo/${id}/${board._id}/${boardpos}/${story._id}`}
                                        >
                                            {story.storyname}
                                        </a>
                                    </td>

                                    <td>
                                        {story.tasks?.length ?? 0}
                                    </td>

                                    <td>{story.status}</td>

                                    <td>
                                        {role === "project_admin" && (
                                            <button
                                                className={styles.button}
                                                onClick={() =>
                                                    clkaddtoboard(
                                                        story._id
                                                    )
                                                }
                                            >
                                                Add to Board
                                            </button>
                                        )}

                                        <button
                                            className={styles.button}
                                        >
                                            Delete
                                        </button>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </div>

            <div className={styles.boardContainer}>
                {board.columns.map((column, pos) => (
                    <div
                        key={pos}
                        className={styles.column}
                        onDragOver={allowDrop}
                        onDrop={() => handleDrop(pos)}
                    >
                        <div className={styles.columnTitle}>
                            {column.name}
                        </div>

                        {column.tasks.map((task, index) => (
                            <div
                                key={index}
                                draggable={
                                    task.assigneeid === user._id
                                }
                                onDragStart={() =>
                                    handleDragStart(task._id, pos)
                                }
                                className={`${styles.task} ${
                                    task.assigneeid === user._id
                                        ? ""
                                        : styles.taskDisabled
                                }`}
                            >
                                {task.name}
                            </div>
                        ))}

                        {columnform && (
                            <div>
                                <button
                                    className={styles.button}
                                    onClick={() =>
                                        clkrenamecolumn(pos)
                                    }
                                >
                                    Rename
                                </button>

                                <button
                                    className={styles.button}
                                    onClick={() =>
                                        clkdeletecolumn(pos)
                                    }
                                >
                                    Delete
                                </button>
                            </div>
                        )}
                    </div>
                ))}
            </div>

            {renameform && (
                <div className={styles.form}>
                    <input
                        className={styles.input}
                        value={newname}
                        onChange={e =>
                            setNewname(e.target.value)
                        }
                    />

                    <button
                        className={styles.button}
                        onClick={donerenaming}
                    >
                        Done
                    </button>
                </div>
            )}

            {columnform && (
                <button
                    className={styles.button}
                    onClick={clkaddcolumn}
                >
                    Add Column
                </button>
            )}

            {role === "project_admin" && (
                <button
                    className={styles.button}
                    onClick={edittheboard}
                >
                    Edit Board
                </button>
            )}

            <button
                className={`${styles.button} ${styles.logout}`}
                onClick={clickedLogout}
            >
                Logout
            </button>
        </div>
    );
}

export default BoardInfo;