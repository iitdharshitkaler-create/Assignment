import { useEffect, useState, useRef } from "react";
import { useParams } from "react-router-dom";
import styles from "./commentpage.module.css";

interface User {
    _id: string;
    name: string;
}

interface Comment {
    _id: string;
    task: string;
    text: string; 
    user: User;
    mentions: User[];
    createdAt: string;
    updatedAt: string;
}

function CommentInfo() {
    // We grab 'id' which acts as your projectid from App.tsx routing
    const { taskid, id } = useParams();

    const [comments, setComments] = useState<Comment[]>([]);
    const [text, setText] = useState("");
    
    const [editText, setEditText] = useState("");
    const [editingId, setEditingId] = useState<string | null>(null);

    const [allusers, setAllusers] = useState<User[]>([]);
    
    // --- NEW STATE FOR MENTIONS ---
    const [showMentions, setShowMentions] = useState(false);
    const [mentionSearch, setMentionSearch] = useState("");
    
    const newCommentRef = useRef<HTMLDivElement>(null);

    // Now strictly fetches ONLY users associated with this project id
    useEffect(() => {
        if(id) {
            fetch(`http://localhost:3000/projectusers/${id}`, {
                credentials: "include"
            })
            .then(res => res.json())
            .then(data => {
                setAllusers(data.users);
            });
        }
    }, [id]);

    async function loadComments(){
        fetch(`http://localhost:3000/taskcomments/${taskid}`, {
            credentials: "include"
        })
        .then(res => res.json())
        .then(data => {
            setComments(data.comments);
        });
    }

    useEffect(() => {
        if(taskid){
            loadComments();
        }
    }, [taskid]);

    function extractMentions(text: string){
        const regex = /@(\w+)/g;
        const usernames: string[] = [];
        let match = regex.exec(text);

        while(match){
            usernames.push(match[1]);
            match = regex.exec(text);
        }

        const mentionedIds: string[] = [];

        for(let i=0;i<allusers.length;i++){
            if(usernames.includes(allusers[i].name)){
                mentionedIds.push(allusers[i]._id);
            }
        }

        return mentionedIds;
    }

    async function addComment(){
        const mentions = extractMentions(text);

        await fetch(`http://localhost:3000/addcomment`,{
            method:"POST",
            headers:{ "Content-Type":"application/json" },
            credentials:"include",
            body: JSON.stringify({
                taskid,
                text,
                mentions
            })
        });
        
        setText("");
        if (newCommentRef.current) {
            newCommentRef.current.innerHTML = "";
        }
        loadComments();
    }

    async function deleteComment(commentid:string){
        await fetch(`http://localhost:3000/deletecomment`,{
            method:"POST",
            headers:{ "Content-Type":"application/json" },
            credentials:"include",
            body: JSON.stringify({commentid})
        });
        loadComments();
    }

    function startEdit(comment:Comment){
        setEditingId(comment._id);
        setEditText(comment.text);
    }

    async function saveEdit(){
        await fetch(`http://localhost:3000/editcomment`,{
            method:"POST",
            headers:{ "Content-Type":"application/json" },
            credentials:"include",
            body: JSON.stringify({
                editingId,
                editText
            })
        });

        setEditingId(null);
        loadComments();
    }
    
    const handleFormat = (e: React.MouseEvent, command: string) => {
        e.preventDefault(); 
        document.execCommand(command, false, undefined);
    };

    // --- NEW LOGIC: Tracks cursor to see if user typed @ ---
    const handleInput = (e: React.FormEvent<HTMLDivElement>) => {
        const html = e.currentTarget.innerHTML;
        setText(html);

        const selection = window.getSelection();
        if (!selection || selection.rangeCount === 0) {
            setShowMentions(false);
            return;
        }

        const range = selection.getRangeAt(0);
        
        // Ensures we are tracking text specifically inside our comment box
        if (!newCommentRef.current?.contains(range.startContainer)) return;

        const textBeforeCursor = range.startContainer.textContent?.slice(0, range.startOffset) || "";
        
        // Detects an @ followed by any letters at the very end of the cursor
        const match = textBeforeCursor.match(/@(\w*)$/);
        if (match) {
            setShowMentions(true);
            setMentionSearch(match[1]);
        } else {
            setShowMentions(false);
        }
    };

    // --- NEW LOGIC: Injects the user's name exactly where they were typing ---
    const insertMention = (username: string) => {
        const selection = window.getSelection();
        if (!selection || selection.rangeCount === 0) return;

        const range = selection.getRangeAt(0);
        const textNode = range.startContainer;
        const currentText = textNode.textContent || "";
        const offset = range.startOffset;

        const match = currentText.slice(0, offset).match(/@(\w*)$/);
        if (match) {
            const startIdx = offset - match[0].length;
            
            range.setStart(textNode, startIdx);
            range.setEnd(textNode, offset);
            selection.removeAllRanges();
            selection.addRange(range);

            // Replaces the @typed text with a styled blue mention tag
            document.execCommand("insertHTML", false, `<span style="color: blue;" contentEditable="false">@${username}</span>&nbsp;`);
            
            setShowMentions(false);
            setMentionSearch("");
            
            // Syncs the new styled text back to your text state
            if (newCommentRef.current) {
                setText(newCommentRef.current.innerHTML);
            }
        }
    };

	return (
        <div className={styles.container}>
            <h2 className={styles.title}>Comments</h2>

            <div className={styles.commentBox} style={{ position: "relative" }}>
                <div style={{ marginBottom: "8px", display: "flex", gap: "5px" }}>
                    <button className={styles.smallButton} onMouseDown={(e) => handleFormat(e, 'bold')}><b>B</b></button>
                    <button className={styles.smallButton} onMouseDown={(e) => handleFormat(e, 'italic')}><i>I</i></button>
                    <button className={styles.smallButton} onMouseDown={(e) => handleFormat(e, 'underline')}><u>U</u></button>
                </div>
                
                <div 
                    ref={newCommentRef}
                    contentEditable
                    className={`${styles.textarea} ${styles.editableDiv}`} 
                    style={{ minHeight: "80px", backgroundColor: "white", padding: "8px", border: "1px solid #ccc", overflowY: "auto" }}
                    onInput={handleInput}
                    data-placeholder="Write a comment..." 
                />
                
                {/* --- NEW UI: The Mention Dropdown --- */}
                {/* --- NEW UI: The Mention Dropdown --- */}
               {/* --- NEW UI: The Mention Dropdown --- */}
               {showMentions && (
                    <div style={{ position: "absolute", top: "100%", left: 0, backgroundColor: "white", border: "1px solid #ccc", zIndex: 10, maxHeight: "150px", overflowY: "auto", width: "200px", borderRadius: "4px", boxShadow: "0px 4px 6px rgba(0,0,0,0.1)", marginTop: "5px" }}>
                        {allusers
                            // SAFETY FIX: Checks if 'u' and 'u.name' actually exist before calling toLowerCase()
                            .filter(u => u && u.name && u.name.toLowerCase().includes(mentionSearch.toLowerCase()))
                            .map(user => (
                                <div 
                                    key={user._id} 
                                    // CHANGE IS HERE: Use onMouseDown and preventDefault to stop focus-stealing
                                    onMouseDown={(e) => {
                                        e.preventDefault();
                                        insertMention(user.name);
                                    }}
                                    style={{ padding: "8px", cursor: "pointer", borderBottom: "1px solid #eee", fontSize: "14px" }}
                                    onMouseOver={(e) => e.currentTarget.style.backgroundColor = "#f0f0f0"}
                                    onMouseOut={(e) => e.currentTarget.style.backgroundColor = "transparent"}
                                >
                                    {user.name}
                                </div>
                            ))}
                        
                        {/* Failsafe if they type a name that doesn't exist */}
                        {allusers.filter(u => u && u.name && u.name.toLowerCase().includes(mentionSearch.toLowerCase())).length === 0 && (
                             <div style={{ padding: "8px", color: "#888", fontSize: "14px" }}>No members found</div>
                        )}
                    </div>
                )}

                <button className={styles.button} onClick={addComment} style={{ marginTop: "10px" }}> Add Comment </button>
            </div>

            {comments.map((comment) => (
                <div key={comment._id}  className={styles.commentCard} >
                    <div className={styles.commentHeader}>
                        <span className={styles.username}> {comment.user.name} </span>
                        <span className={styles.date}> {new Date(comment.createdAt).toLocaleString()} </span>
                    </div>

                    {editingId === comment._id ? (
                        <div className={styles.editArea}>
                            <div style={{ marginBottom: "8px", display: "flex", gap: "5px" }}>
                                <button className={styles.smallButton} onMouseDown={(e) => handleFormat(e, 'bold')}><b>B</b></button>
                                <button className={styles.smallButton} onMouseDown={(e) => handleFormat(e, 'italic')}><i>I</i></button>
                                <button className={styles.smallButton} onMouseDown={(e) => handleFormat(e, 'underline')}><u>U</u></button>
                            </div>
                            
                            <div 
                                contentEditable
                                suppressContentEditableWarning 
                                className={styles.textarea}
                                style={{ minHeight: "60px", backgroundColor: "white", padding: "8px", border: "1px solid #ccc", overflowY: "auto" }}
                                onInput={(e) => setEditText(e.currentTarget.innerHTML)}
                                dangerouslySetInnerHTML={{ __html: comment.text }} 
                            />
                            <button className={styles.button} onClick={saveEdit} style={{ marginTop: "10px" }}> Save </button>
                        </div>
                    ) : (
                        <div className={styles.commentText} dangerouslySetInnerHTML={{ __html: comment.text }} />
                    )}

                    {comment.mentions?.length > 0 && (
                        <div className={styles.mentions} style={{ marginTop: "10px" }}> 
                            mentions: {comment.mentions.map(m => (
                                <span key={m._id} style={{ color: "blue", marginRight: "4px" }}> @{m.name} </span>
                            ))}
                        </div>
                    )}
                    
                    <div className={styles.actions} style={{ marginTop: "10px" }}>
                        <button className={styles.smallButton} onClick={()=>startEdit(comment)}> Edit </button>
                        <button className={styles.smallButton} onClick={()=>deleteComment(comment._id)}> Delete </button>
                    </div>
                </div>
            ))}
        </div>
	);
}

export default CommentInfo;