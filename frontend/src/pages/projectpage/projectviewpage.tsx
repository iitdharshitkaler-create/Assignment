import { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import type { Project, User, Board, Story, Task, Column} from "../../types/type";
import styles from "./projectinfo.module.css";

function ProjectReadOnly() {

  const { projectid } = useParams();
  const id = projectid;
  const [project, setProject] = useState<Project>({
    _id: "",
    name: "",
    description: "",
    project_admin: [],
  });

  const [global_admin, setGlobal_admin] = useState<User>({
    _id: "",
    name: "",
    avatar: "",
  });

  const [members, setMembers] = useState<User[]>([]);
  const [admins, setAdmins] = useState<User[]>([]);
  const [boards, setBoards] = useState<Board[]>([]);

  useEffect(() => {
    fetch(`http://localhost:3000/projecttoread/${id}`, {
      credentials: "include"
    })
      .then(res => res.json())
      .then(data => {
        setProject(data.project);
        setGlobal_admin(data.global_admin);
      });
  }, []);

  useEffect(() => {
    fetch(`http://localhost:3000/allmembersinproject/${id}`, {
      credentials: "include"
    })
      .then(res => res.json())
      .then(data => {
        setMembers(data.projectmembers);
      });
  }, []);

  useEffect(() => {
    fetch(`http://localhost:3000/getprojectadmins/${id}`, {
      credentials: "include"
    })
      .then(res => res.json())
      .then(data => {
        setAdmins(data.project_admins);
      });
  }, []);

  useEffect(() => {
    fetch(`http://localhost:3000/getprojectboardstoread/${id}`, {
      credentials: "include"
    })
      .then(res => res.json())
      .then(data => {
        setBoards(data.boards);
      });
  }, []);

  return (
    <div className={styles.container}>

      <header className={styles.header}>
        <div>
          <h1>{project.name}</h1>
          <p>{project.description}</p>

          <div style={{ color: "red", fontWeight: "bold" }}>
            Project Info
          </div>
        </div>
      </header>
      <section className={styles.section}>
        <h2>Global Admin</h2>
        <div className={styles.adminList}>
            <div className={styles.adminCard}>
              {global_admin.name}
            </div>
        </div>
      </section>
      <section className={styles.section}>
        <h2>Project Admins</h2>

        <div className={styles.adminList}>
          {admins.map((u) => (
            <div key={u._id} className={styles.adminCard}>
              {u.name}
            </div>
          ))}
        </div>
      </section>

      <section className={styles.section}>
        <h2>Members</h2>
        <div className={styles.adminList}>
          {members.map((u) => (
            <div key={u._id} className={styles.adminCard}>
              {u.name}
            </div>
          ))}
        </div>
      </section>

      <section className={styles.section}>
        <h2>Boards</h2>
        {boards.map((board, pos) => (
          <div key={board._id} style={{ marginBottom: "30px" }}>
            <h3>Board {pos}</h3>
            <div style={{ display: "flex", gap: "20px" }}>
              {board.columns?.map((col: Column, i: number) => (
                <div key={i} style={{ border: "1px solid black", padding: "10px" }}>
                  <b>{col.name}</b>
                  {col.tasks?.map((task: Task) => (
                    <div key={task._id}>
                      {task.name}
                    </div>
                  ))}
                </div>
              ))}
            </div>
          </div>
        ))}
      </section>

      <section className={styles.section}>
        <h2>Stories</h2>
        {boards.map((board) =>
          board.stories?.map((story: Story) => (
            <div key={story._id} style={{ marginBottom: "10px" }}>
              <b>{story.storyname}</b>
              {story.tasks?.map((task: Task) => (
                <div key={task._id} style={{ marginLeft: "20px" }}>
                  - {task.name}
                </div>
              ))}
            </div>
          ))
        )}
      </section>

    </div>
  );
}

export default ProjectReadOnly;