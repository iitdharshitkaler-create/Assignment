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
    }
	return (
	  <div className="container">
		<h1 className="header">Project Name: {project.name} </h1>
		{/* the name of project selected is here */}
		<h1 className="header">Project Desciption: {project.description}</h1>
    <h1 className="header">Team Members: </h1>
    <table style={{ width: '100%', borderCollapse: 'collapse', marginTop: '20px' }}>
      <thead>
        <tr style = {{textAlign : 'left',borderBottom : '1px solidd #eee'}}>
          <th style = {{padding  :'12px 0' }}>Name: {g_admin}</th>
          <th style = {{padding : '12px 0' }}>Role: global_admin</th>
          <th style = {{padding : '12px 0' }}>Associated stories/task</th>
        </tr>
        
      </thead>
    </table>
    <button className="button" onClick={addmember}>Add Team Member</button>
    {showmembers && (
        <div>
            <table>
            <tbody>
                {allusers.map(user => (
                <tr key={user._id} onClick={() => choosemember(user._id)}>
                    <td>{user.name}</td>
                </tr>
                ))}
            </tbody>
            </table>
        </div>
        )}

    <table style={{ width: '50%', borderCollapse: 'collapse', marginTop: '20px' }}>
      <thead>
        <tr style = {{textAlign : 'left',borderBottom : '1px solidd #eee'}}>
          <th style = {{padding  :'12px 0' }}>Stories</th>
          <th style = {{padding : '12px 0' }}>Status</th>
        </tr>
      </thead>
    </table>
    
		{/* <div style={{ marginBottom: '20px' }}>
		  <input 
		  type = "text"/>
		</div> */}

		{ <button className="button">Back</button> }
		
	  </div>
	);
  }
  
  export default Project;