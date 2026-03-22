import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import type { Project, User, Board } from "../../types/type";
import styles from "./boarfinfo.module.css";

// Extending your Board interface locally to include the new transitions map
interface BoardWithTransitions extends Board {
    transitions?: Record<number, number[]>;
}

function BoardInfo() {
    const navigate = useNavigate();
    const { id, boardid, boardpos } = useParams();
    const [role, setRole] = useState("");
    const [project, setProject] = useState<Project>({
        _id: "",
        name: "",
        description: "",
        project_admin: [],
    });
    const [board, setBoard] = useState<BoardWithTransitions>({
        _id: "",
        projectname: "",
        columns: [],
        stories: [],
        __v: 0,
    });
    
    // --- NEW STATE: Tracks allowed workflow transitions ---
    const [transitions, setTransitions] = useState<Record<number, number[]>>({});
    const [showWorkflowEdit, setShowWorkflowEdit] = useState(false);

    // Initialize the transitions mapping when the board loads
    useEffect(() => {
        if (board.columns.length > 0) {
            // Default behavior: can only move forward exactly one column
            const defaultTrans: Record<number, number[]> = {};
            board.columns.forEach((_, idx) => {
               defaultTrans[idx] = idx < board.columns.length - 1 ? [idx + 1] : [];
            });
            // Use saved transitions from DB if they exist, otherwise use the default
            setTransitions(board.transitions || defaultTrans);
        }
    }, [board]);

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
        fetch(`http://localhost:3000/allusers/${id}`, {
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

    // --- UPDATED LOGIC: Validating the drop against configured transitions ---
    // async function handleDrop(columnpos: number) {
    //     if (dragFrom !== null) {
    //         // Get the list of allowed destination columns for the starting column
    //         const allowedDestinations = transitions[dragFrom] || [];

    //         if (allowedDestinations.includes(columnpos)) {
    //             try {
    //                 await fetch(`http://localhost:3000/movetaskonboard`, {
    //                     method: "POST",
    //                     headers: {
    //                         "Content-Type": "application/json",
    //                     },
    //                     credentials: "include",
    //                     body: JSON.stringify({
    //                         boardid: board._id,
    //                         taskid: dragTaskId,
    //                         from: dragFrom,
    //                         to: columnpos,
    //                     }),
    //                 });

    //                 loadBoard();
    //             } catch (error) {
    //                 console.log("Server connection failed:", error);
    //             }
    //         } else {
    //             // Blocks invalid transitions and warns the user
    //             alert("Invalid status transition! Your project admin has not allowed moving tasks directly between these columns.");
    //         }
    //     }

    //     setDragTaskId(null);
    //     setDragfrom(null);
    //     loadBoard();
    // }
    async function handleDrop(columnpos: number) {
        if (dragFrom !== null) {
            // Get the list of allowed destination columns for the starting column
            const allowedDestinations = transitions[dragFrom] || [];

            if (allowedDestinations.includes(columnpos)) {
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

                    // CRITICAL FIX: Await this so React waits for the DB to finish
                    await loadBoard(); 
                } catch (error) {
                    console.log("Server connection failed:", error);
                }
            } else {
                alert("Invalid status transition! Your project admin has not allowed moving tasks directly between these columns.");
            }
        }

        setDragTaskId(null);
        setDragfrom(null);
        // CRITICAL FIX: Removed the duplicate loadBoard() from here
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

    // --- NEW FUNC: Save the custom workflow transitions to the backend ---
    async function saveWorkflow() {
        try {
            await fetch(`http://localhost:3000/updateworkflow/${board._id}`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                credentials: "include",
                body: JSON.stringify({ transitions }),
            });
            setShowWorkflowEdit(false);
            alert("Workflow updated successfully!");
        } catch (error) {
            console.log("Failed to save workflow:", error);
        }
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

    async function clkdeletestory(storyid: string){
        try {
            await fetch(`http://localhost:3000/deletestory/${storyid}/${id}`, {
                method: "POST",
                credentials: "include",
            });
        } catch (error) {
            console.log("Server connection failed:", error);
        }
        loadBoard();
    }

    return (
        <div className={styles.container}>
            <header>
                <h1 className={styles.title}>Profile</h1>
                <div className={styles.profile}>
                    <div>{user.name}</div>
                    <img className={styles.avatar} src={user.avatar.startsWith("data:image") ? user.avatar : `/${user.avatar}.jpeg`} />
                    </div>
            </header>
            
            <h1>Project: {project.name}</h1>
            <h1>Board {boardpos}</h1>
            <h2>Team Members</h2>
            <button className={styles.button} onClick={showTeammembers}> Show team members </button>

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
                                <tr key={index}  onClick={() =>  choosemember(user._id) } >
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
                        <input className={styles.input} onChange={e => setNewstory(e.target.value)  } />
                        <button  className={styles.button} onClick={putstoryonboard}  > Done </button>
                    </div>
                )}
                <div>  Stories  {role === "project_admin" && (
                        <button className={styles.button}
                            onClick={() =>
                                clkaddstory(Number(boardpos))
                            }>
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
                                        <a href={`/storyinfo/${id}/${board._id}/${boardpos}/${story._id}`}>
                                            {story.storyname}
                                        </a>
                                    </td>
                                    <td>{story.tasks?.length ?? 0}</td>
                                    <td>{story.status}</td>
                                    <td>
                                        {role === "project_admin" && (
                                            <div>
                                            <button className={styles.button} onClick={() => clkaddtoboard(story._id)}> Add to Board </button>
                                                <button className={styles.button} onClick={() => clkdeletestory(story._id)} > Delete </button>
                                        </div>
                                        )}
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </div>

            {/* --- NEW UI: Workflow Transition Editor for Project Admins --- */}
            {showWorkflowEdit && role === "project_admin" && (
                <div className={styles.form} style={{ border: "2px solid #ccc", padding: "15px", marginBottom: "20px" }}>
                    <h3>Edit Allowed Workflow Transitions</h3>
                    <p style={{ fontSize: "14px", color: "gray" }}>Select which columns a task is allowed to move to from its current state.</p>
                    {board.columns.map((fromCol, fromIdx) => (
                        <div key={fromIdx} style={{ margin: "10px 0" }}>
                            <strong style={{ display: "inline-block", width: "120px" }}>{fromCol.name}</strong> ➔ 
                            {board.columns.map((toCol, toIdx) => {
                                if (fromIdx === toIdx) return null;
                                return (
                                    <label key={toIdx} style={{ marginLeft: "15px", cursor: "pointer" }}>
                                        <input
                                            type="checkbox"
                                            checked={transitions[fromIdx]?.includes(toIdx) || false}
                                            onChange={(e) => {
                                                const newTrans = { ...transitions };
                                                if (!newTrans[fromIdx]) newTrans[fromIdx] = [];
                                                
                                                if (e.target.checked) {
                                                    newTrans[fromIdx].push(toIdx);
                                                } else {
                                                    newTrans[fromIdx] = newTrans[fromIdx].filter(id => id !== toIdx);
                                                }
                                                setTransitions(newTrans);
                                            }}
                                        />
                                        {' '} {toCol.name}
                                    </label>
                                )
                            })}
                        </div>
                    ))}
                    <button className={styles.button} onClick={saveWorkflow} style={{ marginTop: "10px" }}>Save Workflow</button>
                    <button className={styles.button} onClick={() => setShowWorkflowEdit(false)} style={{ marginTop: "10px", marginLeft: "10px", backgroundColor: "gray" }}>Cancel</button>
                </div>
            )}

            <div className={styles.boardContainer}>
                {board.columns.map((column, pos) => (
                    <div key={pos}  className={styles.column}  onDragOver={allowDrop}  onDrop={() => handleDrop(pos)}>
                        <div className={styles.columnTitle}>  {column.name} </div>
                        {column.tasks.map((task, index) => (
                            <div
                                key={index}
                                draggable={
                                    (task.assigneeid === user._id || role === "project_admin")
                                }
                                onDragStart={() =>
                                    handleDragStart(task._id, pos)
                                }
                                className={`${styles.task} ${
                                    (task.assigneeid === user._id || role === "project_admin")
                                        ? ""
                                        : styles.taskDisabled
                                }`}
                            >
                                {task.name}
                            </div>
                        ))}

                        {columnform && (
                            <div>
                                <button  className={styles.button} onClick={() => clkrenamecolumn(pos)}> Rename </button>
                                <button  className={styles.button} onClick={() => clkdeletecolumn(pos)}> Delete </button>
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
                    <button  className={styles.button}  onClick={donerenaming}> Done  </button>
                </div>
            )}
            
            {columnform && (
                <button className={styles.button}  onClick={clkaddcolumn} >  Add Column </button>
            )}

            {/* Admin Controls Section */}
            {role === "project_admin" && (
                <div style={{ marginTop: "20px" }}>
                    <button className={styles.button} onClick={edittheboard} > Edit Board </button>
                    <button className={styles.button} onClick={() => setShowWorkflowEdit(!showWorkflowEdit)} style={{ marginLeft: "10px", backgroundColor: "#0056b3" }}> ⚙️ Configure Workflow </button>
                </div>
            )}
            
            <button className={`${styles.button} ${styles.logout}`} onClick={clickedLogout} > Logout </button>
        </div>
    );
}
export default BoardInfo;