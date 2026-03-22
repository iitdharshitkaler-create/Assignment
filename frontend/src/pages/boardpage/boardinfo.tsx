import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import type { Project, User, Board } from "../../types/type";
import styles from "./boarfinfo.module.css";

// Extended interface to include custom workflow transitions
interface BoardWithTransitions extends Board {
    transitions?: Record<number, number[]>;
    wipLimits?: Record<string, number>;   // NEW
}

function BoardInfo() {
    const navigate = useNavigate();
    // Extracting URL parameters
    const { id, boardid, boardpos } = useParams();
    
    // Core state variables for user role, project info, and board data
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
    const [wipLimits, setWipLimits] = useState<Record<string, number>>({});
    const [showWipEdit, setShowWipEdit] = useState(false);
    // --- NEW STATE: Tracks allowed workflow transitions ---
    // Controls which column a task can move to based on its current column
    const [transitions, setTransitions] = useState<Record<number, number[]>>({});
    // Toggles the visibility of the admin workflow editor
    const [showWorkflowEdit, setShowWorkflowEdit] = useState(false);

    // Initialize the transitions mapping when the board loads
    useEffect(() => {
        if (board.columns.length > 0) {
            setTransitions((prevTransitions) => {
                // 1. Use transitions from database if they exist
                if (board.transitions && Object.keys(board.transitions).length > 0) {
                    return board.transitions;
                }
                // 2. If the local transition state already matches the current number of columns, KEEP them. Do not overwrite.
                if (Object.keys(prevTransitions).length === board.columns.length) {
                    return prevTransitions;
                }
                // 3. Otherwise (first load or column count changed), set default sequential behavior (e.g., Col 1 -> Col 2)
                const defaultTrans: Record<number, number[]> = {};
                board.columns.forEach((_, idx) => {
                   defaultTrans[idx] = idx < board.columns.length - 1 ? [idx + 1] : [];
                });
                return defaultTrans;
            });
        }
    }, [board.columns, board.transitions]); // Change dependency to only trigger on column or DB transition changes

    // Initial fetch to load the board details and user role
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

    // State and fetch logic to get all users in the system (for adding members)
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

    // State to toggle the "Add Member" dropdown
    const [showmembers, setShowmembers] = useState(false);

    // Shows the member selection list
    async function addmember() {
        setShowmembers(true);
    }

    // Assigns a selected user as a member to this project
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
        loadMembers(); // Refresh the list
    }
    
    // State and logic for fetching members already in the project
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

    // States handling story creation
    const [storyform, setStoryform] = useState(false);
    const [newstory, setNewstory] = useState("");
    const [boardindex, setBoardindex] = useState(-1);

    // Submits the new story to the backend
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

    // Opens the form to add a new story
    function clkaddstory(index: number) {
        setBoardindex(index);
        setStoryform(true);
    }

    // State variables for tracking drag-and-drop actions
    const [dragTaskId, setDragTaskId] = useState<string | null>(null);
    const [dragFrom, setDragfrom] = useState<number | null>(null);

    // Stores the ID and original column when a user starts dragging a task
    function handleDragStart(taskid: string, columnpos: number) {
        setDragTaskId(taskid);
        setDragfrom(columnpos);
    }

    // Prevents default behavior to allow elements to be dropped
    function allowDrop(e: React.DragEvent) {
        e.preventDefault();
    }

    // Handles the logic when a task is dropped into a new column
    async function handleDrop(columnpos: number) {
        if (dragFrom !== null) {
            // Get the list of allowed destination columns for the starting column based on workflow rules
            const allowedDestinations = transitions[dragFrom] || [];

            // Only proceed if the workflow allows moving to the target column
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

                    // CRITICAL FIX: Await this so React waits for the DB to finish updating
                    await loadBoard(); 
                } catch (error) {
                    console.log("Server connection failed:", error);
                }
            } else {
                // Reject the drop if it violates workflow rules
                alert("Invalid status transition! Your project admin has not allowed moving tasks directly between these columns.");
            }
        }

        // Reset drag state
        setDragTaskId(null);
        setDragfrom(null);
    }

    // Re-fetches the latest board data from the server
    async function loadBoard() {
        try {
            const res = await fetch(`http://localhost:3000/board/${id}/${boardpos}`, { credentials: "include" });
            const data = await res.json();
            setProject(data.project);
            setBoard(data.board);
            setRole(data.role);
            // NEW: load saved WIP limits from DB
            if (data.board?.wipLimits) {
                setWipLimits(data.board.wipLimits);
            }
        } catch (error) {
            console.log("Board reload failed:", error);
        }
    }
    useEffect(() => {
        loadBoard();
    }, []);

    // Toggles the team member table visibility
    const [show, setShow] = useState(false);
    function showTeammembers() {
        setShow(prev => !prev);
    }

    // Links an existing story to the current board
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

    // State variables for editing columns
    const [newname, setNewname] = useState("");
    const [columnform, setColumnform] = useState(false);
    const [renameform, setRenameform] = useState(false);
    const [columnpos, setColumnpos] = useState(0);

    // Prevents editing the board structure if tasks currently exist inside it
    function edittheboard() {
        const boardIsEmpty = board.columns.every(
            column => column.tasks.length === 0
        );
        if (boardIsEmpty) {
            setColumnform(true);
        }
        else{
            alert("the columns should not contain any tasks for this feature")
        }
    }

    // Submits the new column name to the backend
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

    // Prepares state to rename an existing column
    function clkrenamecolumn(pos: number) {
        setRenameform(true);
        setColumnpos(pos);
    }

    // Deletes a specific column from the board
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

    // Prepares state to add a completely new column
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
    async function saveWipLimits() {
        try {
            await fetch(`http://localhost:3000/updatewiplimits/${board._id}`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                credentials: "include",
                body: JSON.stringify({ wipLimits }),
            });
            setShowWipEdit(false);
            alert("WIP limits saved!");
        } catch (error) {
            console.log("Failed to save WIP limits:", error);
        }
    }
    // Logs the user out
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

    // Fetches and stores the profile of the currently logged-in user
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

    // Deletes a specific story from the board
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
            {/* Header / Profile block */}
            <header>
                <h1 className={styles.title}>Profile</h1>
                <div className={styles.profile}>
                    <div>{user.name}</div>
                    <img className={styles.avatar} src={user.avatar.startsWith("data:image") ? user.avatar : `/${user.avatar}.jpeg`} />
                    </div>
            </header>
            {/* Title Section */}
            <h1>Project: {project.name}</h1>
            <h1>Board {boardpos}</h1>
            
            {/* Team Members Section */}
            <h2>Team Members</h2>
            <button className={styles.button} onClick={showTeammembers}> Show team members </button>

            {/* Conditionally rendered table of members */}
            {show && (
                <div><table className={styles.table}><thead><tr>
                                <th>Name</th>
                                <th>Role</th>
                                <th>Associated stories/task</th>
                            </tr></thead><tbody>
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
            {/* List to pick a new member to add */}
            {showmembers && (
                <div><table className={styles.table}> <tbody>
                            {allusers.map((user, index) => (
                                <tr key={index}  onClick={() =>  choosemember(user._id) } >
                                    <td>{user.name}</td>
                                </tr>
                            ))}  </tbody>   </table>  </div>
            )}
        
            {/* Stories Section */}
            <div className={styles.storySection}>
                {/* Form to create a new story */}
                {storyform && (
                    <div className={styles.form}>
                        Story:
                        <input className={styles.input} onChange={e => setNewstory(e.target.value)  } />
                        <button  className={styles.button} onClick={putstoryonboard}  > Done </button>
                    </div>
                )}
                
                {/* Table of existing stories */}
                <div>  Stories  {(role === "project_admin" || role === "global_admin") && (
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
                                        {(role === "project_admin" || role === "global_admin") && (
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

            {/* --- NEW UI: Workflow Transition Editor for Project Admins and Global Admins --- */}
            {/* Allows admins to define which columns a task can move into from its current column */}
            {showWorkflowEdit && (role === "project_admin" || role === "global_admin") && (
                <div className={styles.form} style={{ border: "2px solid #ccc", padding: "15px", marginBottom: "20px" }}>
                    <h3>Edit Allowed Workflow Transitions</h3>
                    <p style={{ fontSize: "14px", color: "gray" }}>Select which columns a task is allowed to move to from its current state.</p>
                    {board.columns.map((fromCol, fromIdx) => (
                        <div key={fromIdx} style={{ margin: "10px 0" }}>
                            <strong style={{ display: "inline-block", width: "120px" }}>{fromCol.name}</strong> ➔ 
                            {board.columns.map((toCol, toIdx) => {
                                if (fromIdx === toIdx) return null; // Can't transition to itself
                                return (
                                    <label key={toIdx} style={{ marginLeft: "15px", cursor: "pointer" }}>
                                        <tr>
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
                                        {' '} {toCol.name}</tr>
                                    </label>
                                )
                            })}
                        </div>
                    ))}
                    <button className={styles.button} onClick={saveWorkflow} style={{ marginTop: "10px" }}>Save Workflow</button>
                    <button className={styles.button} onClick={() => setShowWorkflowEdit(false)} style={{ marginTop: "10px", marginLeft: "10px", backgroundColor: "gray" }}>Cancel</button>
                </div>
            )}
            {showWipEdit && (role === "project_admin" || role === "global_admin") && (
                <div className={styles.form} style={{ border: "2px solid #f0ad4e", padding: "15px", marginBottom: "20px" }}>
                    <h3>Set WIP Limits per Column</h3>
                    <p style={{ fontSize: "14px", color: "gray" }}>
                        Set the maximum number of tasks allowed in each column. Enter 0 for no limit.
                    </p>
                    {board.columns.map((col, idx) => (
                        <div key={idx} style={{ margin: "8px 0", display: "flex", alignItems: "center", gap: "12px" }}>
                            <label style={{ width: "120px", fontWeight: "bold" }}>{col.name}</label>
                            <input
                                type="number"
                                min="0"
                                value={wipLimits[String(idx)] ?? 0}
                                onChange={(e) => {
                                    const val = parseInt(e.target.value) || 0;
                                    setWipLimits(prev => ({ ...prev, [String(idx)]: val }));
                                }}
                                style={{ width: "70px", padding: "4px 8px", borderRadius: "4px", border: "1px solid #ccc" }}
                            />
                            <span style={{ fontSize: "13px", color: "gray" }}>
                                {wipLimits[String(idx)] ? `max ${wipLimits[String(idx)]} tasks` : "no limit"}
                            </span>
                        </div>
                    ))}
                    <div style={{ marginTop: "12px" }}>
                        <button className={styles.button} onClick={saveWipLimits}>Save WIP Limits</button>
                        <button className={styles.button} onClick={() => setShowWipEdit(false)}
                            style={{ marginLeft: "10px", backgroundColor: "gray" }}>Cancel</button>
                    </div>
                </div>
            )}
            {/* Kanban Board Layout */}
            <div className={styles.boardContainer}>
                {board.columns.map((column, pos) => (
                    <div key={pos}  className={styles.column}  onDragOver={allowDrop}  onDrop={() => handleDrop(pos)}>
                        <div className={styles.columnTitle}>
                            {column.name}
                            {/* Show task count / WIP limit badge */}
                            <span style={{
                                marginLeft: "8px",
                                fontSize: "12px",
                                background: (() => {
                                    const limit = wipLimits[String(pos)];
                                    if (!limit || limit === 0) return "#888";        // grey = no limit
                                    if (column.tasks.length >= limit) return "#d9534f"; // red = at limit
                                    if (column.tasks.length >= limit * 0.8) return "#f0ad4e"; // orange = near limit
                                    return "#5cb85c";                                 // green = ok
                                })(),
                                color: "white",
                                borderRadius: "10px",
                                padding: "1px 7px",
                            }}>
                                {column.tasks.length}
                                {wipLimits[String(pos)] ? `/${wipLimits[String(pos)]}` : ""}
                            </span>
                        </div>
                        
                        {/* Tasks mapped inside each column */}
                        {column.tasks.map((task, index) => (
                            <div
                                key={index}
                                draggable={
                                    (task.assigneeid === user._id || role === "project_admin" || role === "global_admin")
                                }
                                onDragStart={() =>
                                    handleDragStart(task._id, pos)
                                }
                                className={`${styles.task} ${
                                    (task.assigneeid === user._id || role === "project_admin" || role === "global_admin")
                                        ? ""
                                        : styles.taskDisabled
                                }`}
                            >
                                {task.name}
                            </div>
                        ))}
    
                        {/* Column management tools (Rename/Delete) */}
                        {columnform && (
                            <div>
                                <button  className={styles.button} onClick={() => clkrenamecolumn(pos)}> Rename </button>
                                <button  className={styles.button} onClick={() => clkdeletecolumn(pos)}> Delete </button>
                            </div>
                        )}
                    </div>
                ))}
            </div>
            {/* Form for renaming a column */}
            {renameform && (
                <div className={styles.form}><input  className={styles.input}
                        value={newname}
                        onChange={e =>
                            setNewname(e.target.value)
                        } />
                    <button  className={styles.button}  onClick={donerenaming}> Done  </button>
                </div>
            )}
            {(role === "project_admin" || role === "global_admin") && (
                <div style={{ marginTop: "20px" }}>
                    <button className={styles.button} onClick={edittheboard}>Edit Board</button>
                    <button className={styles.button} onClick={() => setShowWorkflowEdit(!showWorkflowEdit)}
                        style={{ marginLeft: "10px", backgroundColor: "#0056b3" }}>
                        ⚙️ Configure Workflow
                    </button>
                    {/* NEW button */}
                    <button className={styles.button} onClick={() => setShowWipEdit(!showWipEdit)}
                        style={{ marginLeft: "10px", backgroundColor: "#e67e22" }}>
                        📊 Set WIP Limits
                    </button>
                </div>
            )}            
            {/* Button to trigger adding a new column */}
            {columnform && (
                <button className={styles.button}  onClick={clkaddcolumn} >  Add Column </button>
            )}
            
            {/* Admin Controls Section */}
            {/* {(role === "project_admin" || role === "global_admin") && (
                <div style={{ marginTop: "20px" }}>
                    <button className={styles.button} onClick={edittheboard} > Edit Board </button>
                    <button className={styles.button} onClick={() => setShowWorkflowEdit(!showWorkflowEdit)} style={{ marginLeft: "10px", backgroundColor: "#0056b3" }}> ⚙️ Configure Workflow </button>
                </div>
            )} */}
            
            <button className={`${styles.button} ${styles.logout}`} onClick={clickedLogout} > Logout </button>
        </div>
    );
}
export default BoardInfo;