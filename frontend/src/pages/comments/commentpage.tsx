// import { useEffect, useState } from "react";
// import { useParams } from "react-router-dom";

// interface Board {
//     _id: string;
//     projectname: string;
//     todo: [string];
//     inprogress: [string];
//     done: [string];
//     stories: Story[ ];
//     __v: number;
// }

// interface User {
//     name: string;
//     _id: string;
// }

// interface Task {
//     _id: string;
//     boardname: string;
//     storyname: string;
//     name: string;
//     description: string; 
//     assigneeid: string;
//     assignee: string;
//     reporterid: string;
//     reporter: string;
//     status: string;
//     dueDate: string;
//     priority: string;
// }

// interface Story {
//     _id: string;
//     boardname: string;
//   storyname: string;
//   status: string;
//   tasks: Task[];
// }


// function CommentInfo() {
   
// 	return (
        
//         <div> 
//             <div>Comments</div>

//         </div>
// 	);
//   }
  
//   export default CommentInfo;




import { useEffect, useState } from "react";
import { useParams } from "react-router-dom";

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

    const { taskid } = useParams();

    const [comments, setComments] = useState<Comment[]>([]);
    const [text, setText] = useState("");
    const [editText, setEditText] = useState("");
    const [editingId, setEditingId] = useState<string | null>(null);

    const [allusers, setAllusers] = useState<User[]>([]);

    // load all users (for mentions)
    useEffect(() => {
        fetch(`http://localhost:3000/allusers`, {
            credentials: "include"
        })
        .then(res => res.json())
        .then(data => {
            setAllusers(data.userlist);
        });
    }, []);

    // load comments
    async function loadComments(){
        fetch(`http://localhost:3000/taskcomments/${taskid}`, {
            credentials: "include"
        }).then(res => res.json())
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
        for(let i = 0; i < allusers.length; i++){
            if(usernames.includes(allusers[i].name)){
                mentionedIds.push(allusers[i]._id);
            }
        }
        return mentionedIds;
    }

    async function addComment(){
        const mentions = extractMentions(text);
        await fetch(`http://localhost:3000/addcomment`, {
            method:"POST",
            headers:{
                "Content-Type":"application/json"
            },
            credentials:"include",
            body: JSON.stringify({
                taskid,
                text,
                mentions
            })
        });

        setText("");
        loadComments();
    }

    async function deleteComment(commentid:string){
        await fetch(`http://localhost:3000/deletecomment`,{
            method:"POST",
            headers:{
                "Content-Type":"application/json"
            },
            credentials:"include",
            body: JSON.stringify( {commentid})
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
            headers:{
                "Content-Type":"application/json"
            },
            credentials:"include",
            body: JSON.stringify({ editingId, editText })
        });
        setEditingId(null);
        loadComments();
    }

	return (
        <div>
            <h2>Comments</h2>
            <div>
                <textarea placeholder="Write comment..." value={text} onChange={(e)=>setText(e.target.value)}/>
                <button onClick={addComment}> Add Comment </button>
            </div>
            <hr/> {comments.map((comment) => (
                <div key={comment._id} style={{marginBottom:"20px"}}>
                    <b>{comment.user.name}</b>
                    <div style={{fontSize:"12px"}}>
                        {new Date(comment.createdAt).toLocaleString()}
                    </div>
                    {editingId === comment._id ? (
                        <div>
                            <textarea value={editText} onChange={(e)=>setEditText(e.target.value)} />
                            <button onClick={saveEdit}>Save </button>
                        </div>
                    ) : (
                        <p>{comment.text}</p>
                    )}
                    {comment.mentions?.length > 0 && (<div> mentions: {comment.mentions.map(m => ( <span key={m._id}> @{m.name} </span> ))} </div> )}
                    <button onClick={()=>startEdit(comment)}> Edit </button>
                    <button onClick={()=>deleteComment(comment._id)}>Delete </button>
                <hr/>
            </div> ))}
        </div>
	);
}

export default CommentInfo;