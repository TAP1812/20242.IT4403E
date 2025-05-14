import TaskCard from "./TaskCard";

const BoardView = ({ tasks }) => {
  const todoTasks = tasks.filter((task) => task.stage === "todo");
  const inProgressTasks = tasks.filter((task) => task.stage === "in progress");
  const completedTasks = tasks.filter((task) => task.stage === "completed");

  const columns = [
    { title: "To Do", tasks: todoTasks },
    { title: "In Progress", tasks: inProgressTasks },
    { title: "Completed", tasks: completedTasks },
  ];

  return (
    <div className="w-full py-4 grid grid-cols-3 gap-4 2xl:gap-10">
      {columns.map((col, idx) => (
        <div key={idx} className="bg-gray-100 rounded-xl p-4 shadow-sm min-h-[300px] flex flex-col space-y-4">
          {col.tasks.map((task, index) => (
            <TaskCard task={task} key={index} />
          ))}
        </div>
      ))}
    </div>
  );
};


export default BoardView;