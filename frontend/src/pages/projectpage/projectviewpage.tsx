import { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import type { Project, User, Board, Story, Task, Column } from "../../types/type";
import styles from "./projectview.module.css";

function ProjectReadOnly() {
  // getting the project id straight from the web address at the top
  const { projectid } = useParams();
  const id = projectid;

  // setting up empty states to hold all our data before the server sends it over
  // this holds the basic project info
  const [project, setProject] = useState<Project>({
    _id: "",
    name: "",
    description: "",
    project_admin: [],
  });

  // holding the info of global admin
  const [global_admin, setGlobal_admin] = useState<User>({
    _id: "",
    name: "",
    avatar: "",
  });

  // arrays to hold the lists of people and boards
  const [members, setMembers] = useState<User[]>([]);
  const [admins, setAdmins] = useState<User[]>([]);
  const [boards, setBoards] = useState<Board[]>([]);

  // fetch for getting the main project details and the global admin
  // runs once when the page first loads
  useEffect(() => {
    fetch(`http://localhost:3000/projecttoread/${id}`, {
      credentials: "include",
    })
      .then((res) => res.json())
      .then((data) => {
        setProject(data.project);
        setGlobal_admin(data.global_admin);
      });
  }, []);

  // fetch for grabbing the list of all the members in this project
  useEffect(() => {
    fetch(`http://localhost:3000/allmembersinproject/${id}`, {
      credentials: "include",
    })
      .then((res) => res.json())
      .then((data) => {
        setMembers(data.projectmembers);
      });
  }, []);

  // fetch for getting just the people who have admin powers for this specific project
  useEffect(() => {
    fetch(`http://localhost:3000/getprojectadmins/${id}`, {
      credentials: "include",
    })
      .then((res) => res.json())
      .then((data) => {
        setAdmins(data.project_admins);
      });
  }, []);

  // fetch for pulling all the boards, columns, and tasks to show on the screen
  useEffect(() => {
    fetch(`http://localhost:3000/getprojectboardstoread/${id}`, {
      credentials: "include",
    })
      .then((res) => res.json())
      .then((data) => {
        setBoards(data.boards);
      });
  }, []);

  return (
    <div className={styles.container}>
      <header className={styles.header}>
        <div>
          {/* showing the project name and description at the top */}
          <h1>{project.name}</h1>
          <div className={styles.projectInfo}>Project Description</div>
          <p>{project.description}</p>
        </div>
      </header>
      
      {/* section for the overall owner/creator */}
      <section className={styles.section}>
        <h2>Global Admin</h2>
        <div className={styles.adminList}>
          <div className={styles.adminCard}>{global_admin.name}</div>
        </div>
      </section>

      {/* section displaying all the project admins */}
      <section className={styles.section}>
        <h2>Project Admins</h2>
        <div className={styles.adminList}>
          {/* looping over the admins array to make a card for each one */}
          {admins.map((u) => (
            <div key={u._id} className={styles.adminCard}>
              {u.name}
            </div>
          ))}
        </div>
      </section>

      {/* section displaying regular members */}
      <section className={styles.section}>
        <h2>Members</h2>
        <div className={styles.adminList}>
          {/* looping over the members array */}
          {members.map((u) => (
            <div key={u._id} className={styles.adminCard}>
              {u.name}
            </div>
          ))}
        </div>
      </section>

      {/* section for drawing out the boards and columns */}
      <section className={styles.section}>
        <h2>Boards</h2>
        {/* looping through every board we got from the server */}
        {boards.map((board, pos) => (
          <div key={board._id} className={styles.boardContainer}>
            <h3>Board {pos}</h3>
            <div className={styles.columnsContainer}>
              {/* nested loop for going through every column inside the current board */}
              {board.columns?.map((col: Column, i: number) => (
                <div key={i} className={styles.columnCard}>
                  <b>{col.name}</b>
                  {/* another nested loop for drawing every task inside this column */}
                  {col.tasks?.map((task: Task) => (
                    <div key={task._id}>{task.name}</div>
                  ))}
                </div>
              ))}
            </div>
          </div>
        ))}
      </section>

      {/* section for drawing out all the stories */}
      <section className={styles.section}>
        <h2>Stories</h2>
        <div className={styles.columnsContainer}>
        {/* looping through boards again, but this time looking for stories instead of columns */}
        {boards.map((board) =>
          board.stories?.map((story: Story) => (
            <div key={story._id} className={styles.columnCard}>
              <b>{story.storyname}</b>
              {/* listing out the tasks that belong to this specific story */}
              {story.tasks?.map((task: Task) => (
                <div key={task._id} className={styles.taskItem}>
                  - {task.name}
                </div>
              ))}
            </div>
          ))
        )}</div>
      </section>
    </div>
  );
}
export default ProjectReadOnly;