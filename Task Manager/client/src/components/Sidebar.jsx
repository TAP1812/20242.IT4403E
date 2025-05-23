import { Link, useLocation } from 'react-router-dom';
import { MdDashboard, MdOutlineAddTask, MdTaskAlt, MdOutlinePendingActions, MdSettings } from "react-icons/md";
import { FaTasks, FaTrashAlt, FaUsers } from "react-icons/fa";
import { useDispatch, useSelector, useStore } from 'react-redux';
import { setOpenSidebar } from '../redux/slices/authSlice';
import clsx from 'clsx';

const linkData = [
    {
      label: "Dashboard",
      link: "dashboard",
      icon: <MdDashboard />,
    },
    {
      label: "Tasks",
      link: "tasks",
      icon: <FaTasks />,
    },
    {
      label: "Team",
      link: "team",
      icon: <FaUsers />,
    },
    {
      label: "Trash",
      link: "trashed",
      icon: <FaTrashAlt />,
    },
  ];

const Sidebar = () => {
    const {user} = useSelector((state) => state.auth);

    const dispatch = useDispatch();
    const location = useLocation(); 

    const path = location.pathname.split("/")[1];

    const sidebarLinks = user?.isAdmin ? linkData : linkData.slice(0, 2);

    const closeSidebar = () => {
        dispatch(setOpenSidebar(false));
    }

    const Navlink = ({el}) => {
      return (
        <Link to={el.link} onClick={closeSidebar} className={clsx("w-full lg:w-3/4 flex gap-2 px-3 py-2 rounded-full items-center text-gray-800 text-base hover:bg-[#2564ed2d]", path === el.link.split("/")[0] ? "bg-blue-700 text-neutral-100" : "")}>

          {el.icon}
          <span className="hover:text-[#2564ed]">{el.label}</span>
      </Link>
      )}


  return (
    <div className="w-full h-full flex flex-col gap-6 p-5">
      <h1 className="flex gap-1 items-center">
        <p className="bg-blue-600 p-2 rounded-full">
            <MdOutlineAddTask className="text-white text-2xl font-black" />
        </p>
        <span className="text-2xl font-bold text-black">Task Manager</span>
      </h1>

      <div className='flex-1 flex flex-col gap-y-5 py-8'>
        { 
          sidebarLinks.map((link) =>  (<Navlink el={link} key= {link.label} />))
        }
        </div>
    </div>
  )
}

export default Sidebar;
