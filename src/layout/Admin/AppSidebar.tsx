// import { useCallback, useEffect, useRef, useState } from "react";
// import { Link, useLocation } from "react-router";

// // Assume these icons are imported from an icon library
// import {

//   ChevronDownIcon,
//   GridIcon,
//   HorizontaLDots,

//   UserCircleIcon,
//   UserIcon,
// } from "../../icons";
// import { useSidebar } from "../../context/SidebarContext";

// type NavItem = {
//   name: string;
//   icon: React.ReactNode;
//   path?: string;
//   subItems?: { name: string; path: string; pro?: boolean; new?: boolean }[];
// };

// const navItems: NavItem[] = [
//   {
//     icon: <GridIcon />,
//     name: "Dashboard",
//     path: "/admin",
//   },
//   {
//     icon: <UserIcon />,
//     name: "All Users",
//     // path: "/admin/all-users",
//        subItems: [
//       { name: "Car Owners", path: "/admin/car-owners", pro: false },
//       { name: "Auto Shop Owners", path: "/admin/auto-shop-owners", pro: false },
//     ],
//   },
//   {
//     icon: <UserCircleIcon />,
//     name: "Services",
//     path: "/admin/services",
//   },
//   // {
//   //   icon: <GridIcon />,
//   //   name: "Vehicle Types",
//   //   path: "/admin/vehicle-types",
//   // },
//   {
//     icon: <GridIcon />,
//     name: "Website Templates",
//     path: "/admin/website-templates",
//   },
//   {
//     icon: <GridIcon />,
//     name: "Dashboard Data",
//     path: "/admin/dashboard-data",
//   },
//   {
//     icon: <GridIcon />,
//     name: "Car Companies",
//     path: "/admin/car-companies",
//   },
//   {
//     icon: <GridIcon />,
//     name: "Cities",
//     path: "/admin/cities",
//   },
//   {
//     icon: <GridIcon />,
//     name: "Ads",
//     path: "/admin/ads",
//   },
//   {
//     icon: <GridIcon />,
//     name: "Running Deals",
//     path: "/admin/running-deals",
//   },
//   {
//     icon: <GridIcon />,
//     name: "Wallet",
//     path: "/admin/wallet",
//   },

//   // {
//   //   icon: <FileIcon />,
//   //   name: "Manage Packages",
//   //   path: "/admin/manage-packages",
//   // },
//   // {
//   //   icon: <FileIcon />,
//   //   name: "Manage Task",
//   //   path: "/admin/manage-task",
//   // },
//   // {
//   //   icon: <FileIcon />,
//   //   name: "Manage Rewards",
//   //   path: "/admin/manage-rewards",
//   // },
//   // {
//   //   icon: <UserIcon />,
//   //   name: "Profile",
//   //   path: "/admin/profile",
//   // },
//   // {
//   //   icon: <FileIcon />,
//   //   name: "Finances",
//   //   path: "/admin/finances",
//   // },
// ];

// // Logout nav item for the red button at the bottom
// const logoutNavItem: NavItem = {
//   icon: <UserIcon />,
//   name: "Logout",
//   path: "/admin/logout",
// };

// const othersItems: NavItem[] = [
//   // {
//   //   icon: <PieChartIcon />,
//   //   name: "Charts",
//   //   subItems: [
//   //     { name: "Line Chart", path: "/line-chart", pro: false },
//   //     { name: "Bar Chart", path: "/bar-chart", pro: false },
//   //   ],
//   // },
//   // {
//   //   icon: <BoxCubeIcon />,
//   //   name: "UI Elements",
//   //   subItems: [
//   //     { name: "Alerts", path: "/alerts", pro: false },
//   //     { name: "Avatar", path: "/avatars", pro: false },
//   //     { name: "Badge", path: "/badge", pro: false },
//   //     { name: "Buttons", path: "/buttons", pro: false },
//   //     { name: "Images", path: "/images", pro: false },
//   //     { name: "Videos", path: "/videos", pro: false },
//   //   ],
//   // },
//   // {
//   //   icon: <PlugInIcon />,
//   //   name: "Authentication",
//   //   subItems: [
//   //     { name: "Sign In", path: "/signin", pro: false },
//   //     { name: "Sign Up", path: "/signup", pro: false },
//   //   ],
//   // },
// ];

// const SubAdminAppSidebar: React.FC = () => {
//   const { isExpanded, isMobileOpen, isHovered, setIsHovered } = useSidebar();
//   const location = useLocation();

//   const [openSubmenu, setOpenSubmenu] = useState<{
//     type: "main" | "others";
//     index: number;
//   } | null>(null);
//   const [subMenuHeight, setSubMenuHeight] = useState<Record<string, number>>(
//     {}
//   );
//   const subMenuRefs = useRef<Record<string, HTMLDivElement | null>>({});

//   // const isActive = (path: string) => location.pathname === path;
//   const isActive = useCallback(
//     (path: string) => location.pathname === path,
//     [location.pathname]
//   );

//   useEffect(() => {
//     let submenuMatched = false;
//     ["main", "others"].forEach((menuType) => {
//       const items = menuType === "main" ? navItems : othersItems;
//       items.forEach((nav, index) => {
//         if (nav.subItems) {
//           nav.subItems.forEach((subItem) => {
//             if (isActive(subItem.path)) {
//               setOpenSubmenu({
//                 type: menuType as "main" | "others",
//                 index,
//               });
//               submenuMatched = true;
//             }
//           });
//         }
//       });
//     });

//     if (!submenuMatched) {
//       setOpenSubmenu(null);
//     }
//   }, [location, isActive]);

//   useEffect(() => {
//     if (openSubmenu !== null) {
//       const key = `${openSubmenu.type}-${openSubmenu.index}`;
//       if (subMenuRefs.current[key]) {
//         setSubMenuHeight((prevHeights) => ({
//           ...prevHeights,
//           [key]: subMenuRefs.current[key]?.scrollHeight || 0,
//         }));
//       }
//     }
//   }, [openSubmenu]);

//   const handleSubmenuToggle = (index: number, menuType: "main" | "others") => {
//     setOpenSubmenu((prevOpenSubmenu) => {
//       if (
//         prevOpenSubmenu &&
//         prevOpenSubmenu.type === menuType &&
//         prevOpenSubmenu.index === index
//       ) {
//         return null;
//       }
//       return { type: menuType, index };
//     });
//   };

//   const renderMenuItems = (items: NavItem[], menuType: "main" | "others") => (
//     <ul className="flex flex-col gap-4">
//       {items.map((nav, index) => (
//         <li key={nav.name}>
//           {nav.subItems ? (
//             <button
//               onClick={() => handleSubmenuToggle(index, menuType)}
//               className={`menu-item group ${
//                 openSubmenu?.type === menuType && openSubmenu?.index === index
//                   ? "menu-item-active"
//                   : "menu-item-inactive"
//               } cursor-pointer ${
//                 !isExpanded && !isHovered
//                   ? "lg:justify-center"
//                   : "lg:justify-start"
//               }`}
//             >
//               <span
//                 className={`menu-item-icon-size  ${
//                   openSubmenu?.type === menuType && openSubmenu?.index === index
//                     ? "menu-item-icon-active"
//                     : "menu-item-icon-inactive"
//                 }`}
//               >
//                 {nav.icon}
//               </span>
//               {(isExpanded || isHovered || isMobileOpen) && (
//                 <span className="menu-item-text">{nav.name}</span>
//               )}
//               {(isExpanded || isHovered || isMobileOpen) && (
//                 <ChevronDownIcon
//                   className={`ml-auto w-5 h-5 transition-transform duration-200 ${
//                     openSubmenu?.type === menuType &&
//                     openSubmenu?.index === index
//                       ? "rotate-180 text-brand-500"
//                       : ""
//                   }`}
//                 />
//               )}
//             </button>
//           ) : (
//             nav.path && (
//               <Link
//                 to={nav.path}
//                 className={`menu-item group ${
//                   isActive(nav.path) ? "menu-item-active" : "menu-item-inactive"
//                 }`}
//               >
//                 <span
//                   className={`menu-item-icon-size ${
//                     isActive(nav.path)
//                       ? "menu-item-icon-active"
//                       : "menu-item-icon-inactive"
//                   }`}
//                 >
//                   {nav.icon}
//                 </span>
//                 {(isExpanded || isHovered || isMobileOpen) && (
//                   <span className="menu-item-text">{nav.name}</span>
//                 )}
//               </Link>
//             )
//           )}
//           {nav.subItems && (isExpanded || isHovered || isMobileOpen) && (
//             <div
//               ref={(el) => {
//                 subMenuRefs.current[`${menuType}-${index}`] = el;
//               }}
//               className="overflow-hidden transition-all duration-300"
//               style={{
//                 height:
//                   openSubmenu?.type === menuType && openSubmenu?.index === index
//                     ? `${subMenuHeight[`${menuType}-${index}`]}px`
//                     : "0px",
//               }}
//             >
//               <ul className="mt-2 space-y-1 ml-9">
//                 {nav.subItems.map((subItem) => (
//                   <li key={subItem.name}>
//                     <Link
//                       to={subItem.path}
//                       className={`menu-dropdown-item ${
//                         isActive(subItem.path)
//                           ? "menu-dropdown-item-active"
//                           : "menu-dropdown-item-inactive"
//                       }`}
//                     >
//                       {subItem.name}
//                       <span className="flex items-center gap-1 ml-auto">
//                         {subItem.new && (
//                           <span
//                             className={`ml-auto ${
//                               isActive(subItem.path)
//                                 ? "menu-dropdown-badge-active"
//                                 : "menu-dropdown-badge-inactive"
//                             } menu-dropdown-badge`}
//                           >
//                             new
//                           </span>
//                         )}
//                         {subItem.pro && (
//                           <span
//                             className={`ml-auto ${
//                               isActive(subItem.path)
//                                 ? "menu-dropdown-badge-active"
//                                 : "menu-dropdown-badge-inactive"
//                             } menu-dropdown-badge`}
//                           >
//                             pro
//                           </span>
//                         )}
//                       </span>
//                     </Link>
//                   </li>
//                 ))}
//               </ul>
//             </div>
//           )}
//         </li>
//       ))}
//     </ul>
//   );

//   // Red logout button at the bottom
//   const renderLogoutButton = () => (
//     <div className="w-fit mt-auto pt-6 pb-8 flex">
//       <Link
//         to={logoutNavItem.path!}
//         className={`
//           flex items-center w-full gap-3 px-4 py-3
//           rounded-lg text-white bg-red-600 hover:bg-red-700
//           font-semibold text-base transition-all duration-150
//           justify-start
//           ${!isExpanded && !isHovered && !isMobileOpen ? "lg:justify-center px-2" : ""}
//         `}
//         style={{
//           minHeight: "48px",
//         }}
//       >
//         <span className={`menu-item-icon-size`}>
//           {logoutNavItem.icon}
//         </span>
//         {(isExpanded || isHovered || isMobileOpen) && (
//           <span className="menu-item-text">{logoutNavItem.name}</span>
//         )}
//       </Link>
//     </div>
//   );

//   return (
//     <aside
//       className={`fixed mt-16 flex flex-col lg:mt-0 top-0 px-5 left-0 bg-white dark:bg-gray-900 dark:border-gray-800 text-gray-900 h-screen transition-all duration-300 ease-in-out z-50 border-r border-gray-200 
//         ${
//           isExpanded || isMobileOpen
//             ? "w-[290px]"
//             : isHovered
//             ? "w-[290px]"
//             : "w-[90px]"
//         }
//         ${isMobileOpen ? "translate-x-0" : "-translate-x-full"}
//         lg:translate-x-0`}
//       onMouseEnter={() => !isExpanded && setIsHovered(true)}
//       onMouseLeave={() => setIsHovered(false)}
//       // style={{
//       //   background: "linear-gradient(180deg, #fdf4cc 0%, #ffe3ef 45%, #ced3f3 100%)",
//       // }}
//     >
//       <div
//         className={`py-8 px-6 flex ${
//           !isExpanded && !isHovered ? "lg:justify-center" : "justify-start"
//         }`}
//       >
//         <Link to="/">
//           {isExpanded || isHovered || isMobileOpen ? (
//              <span className="flex items-center gap-2 select-none">
//              <span
//                style={{
//                  color: "#11181c",
//                  fontWeight: 800,
//                  fontSize: "2rem",
//                  letterSpacing: "0.05em",
//                  lineHeight: 1,
//                }}
//                className="font-extrabold tracking-wide uppercase"
//              >
//                Auto
//              </span>
//              <span
//                style={{
//                  color: "#11181c",
//                  fontWeight: 700,
//                  fontSize: "2rem",
//                  letterSpacing: "0.07em",
//                  lineHeight: 1,
//                }}
//                className="font-bold tracking-widest uppercase"
//              >
//                Daddy
//              </span>
//            </span>
//           ) : (
//             <></>
//             // <span className="text-xl font-bold">ADMIN</span>
//           )}
//         </Link>
//       </div>
//       <div className="flex flex-col overflow-y-auto duration-300 ease-linear no-scrollbar flex-1">
//         <nav className="mb-6">
//           <div className="flex flex-col gap-4">
//             <div>
//               <h2
//                 className={`mb-4 text-xs uppercase flex leading-[20px] text-gray-400 ${
//                   !isExpanded && !isHovered
//                     ? "lg:justify-center"
//                     : "justify-start"
//                 }`}
//               >
//                 {isExpanded || isHovered || isMobileOpen ? (
//                   "Menu"
//                 ) : (
//                   <HorizontaLDots className="size-6" />
//                 )}
//               </h2>
//               {renderMenuItems(navItems, "main")}
//             </div>
//             {/* <div className="">
//               <h2
//                 className={`mb-4 text-xs uppercase flex leading-[20px] text-gray-400 ${
//                   !isExpanded && !isHovered
//                     ? "lg:justify-center"
//                     : "justify-start"
//                 }`}
//               >
//                 {isExpanded || isHovered || isMobileOpen ? (
//                   "Others"
//                 ) : (
//                   <HorizontaLDots />
//                 )}
//               </h2>
//               {renderMenuItems(othersItems, "others")}
//             </div> */}
//           </div>
//         </nav>
//         {/* {isExpanded || isHovered || isMobileOpen ? <SidebarWidget /> : null} */}
//       </div>
//       {renderLogoutButton()}
//     </aside>
//   );
// };

// export default SubAdminAppSidebar;


import { useCallback, useEffect, useRef, useState } from "react";
import { Link, useLocation } from "react-router";
import { useSidebar } from "../../context/SidebarContext";

// React Icons for accurate and meaningful menu icons
import { MdDashboard } from "react-icons/md";
import { FaUsers, FaCarSide, FaMoneyBillWave, FaBullhorn, FaTags, FaRegCreditCard, FaFileAlt} from "react-icons/fa";

import { HiTemplate, HiOutlineLogout } from "react-icons/hi";

import { TbHelpCircle } from "react-icons/tb";

import { MdLocationPin } from "react-icons/md";
import { FiChevronDown, FiMoreHorizontal } from "react-icons/fi";

type NavItem = {
  name: string;
  icon: React.ReactNode;
  path?: string;
  subItems?: { name: string; path: string; pro?: boolean; new?: boolean }[];
};

const navItems: NavItem[] = [
  {
    icon: <MdDashboard />,
    name: "Dashboard",
    path: "/admin",
  },
  {
    icon: <FaUsers />,
    name: "All Users",
    subItems: [
      { name: "Car Owners", path: "/admin/car-owners", pro: false },
      { name: "Auto Shop Owners", path: "/admin/auto-shop-owners", pro: false },
    ],
  },
  {
    icon: <FaRegCreditCard />,
    name: "Services / Categories",
    subItems: [
      { name: "Services", path: "/admin/services" },
      { name: "Categories", path: "/admin/categories" },
    ],
  },
  {
    icon: <HiTemplate />,
    name: "Website Templates",
    path: "/admin/website-templates",
  },
  {
    icon: <FaFileAlt />,
    name: "Dashboard Data",
    path: "/admin/dashboard-data",
  },
  {
    icon: <FaCarSide />,
    name: "Car Companies",
    path: "/admin/car-companies",
  },
  {
    icon: <MdLocationPin />, // location pin
    name: "Location",
    subItems: [
      {
        name: "Provinces",
        path: "/admin/provinces",
      },
      {
        name: "Cities",
        path: "/admin/cities",
      },
    ],
  },
  {
    icon: <FaBullhorn />,
    name: "Ads",
    path: "/admin/ads",
  },
  {
    icon: <FaTags />,
    name: "Running Deals",
    path: "/admin/running-deals",
  },
  {
    icon: <FaMoneyBillWave />,
    name: "Wallet",
    path: "/admin/wallet",
  },
  {
    icon: <TbHelpCircle />,
    name: "Invite Help",
    path: "/admin/invite-help",
  },
];

const logoutNavItem: NavItem = {
  icon: <HiOutlineLogout />,
  name: "Logout",
  path: "/admin/logout",
};

const othersItems: NavItem[] = [];

const SubAdminAppSidebar: React.FC = () => {
  const { isExpanded, isMobileOpen, isHovered, setIsHovered } = useSidebar();
  const location = useLocation();

  const [openSubmenu, setOpenSubmenu] = useState<{
    type: "main" | "others";
    index: number;
  } | null>(null);
  const [subMenuHeight, setSubMenuHeight] = useState<Record<string, number>>({});
  const subMenuRefs = useRef<Record<string, HTMLDivElement | null>>({});

  const isActive = useCallback(
    (path: string) => location.pathname === path,
    [location.pathname]
  );

  useEffect(() => {
    let submenuMatched = false;
    ["main", "others"].forEach((menuType) => {
      const items = menuType === "main" ? navItems : othersItems;
      items.forEach((nav, index) => {
        if (nav.subItems) {
          nav.subItems.forEach((subItem) => {
            if (isActive(subItem.path)) {
              setOpenSubmenu({ type: menuType as "main" | "others", index });
              submenuMatched = true;
            }
          });
        }
      });
    });
    if (!submenuMatched) setOpenSubmenu(null);
  }, [location, isActive]);

  useEffect(() => {
    if (openSubmenu !== null) {
      const key = `${openSubmenu.type}-${openSubmenu.index}`;
      if (subMenuRefs.current[key]) {
        setSubMenuHeight((prev) => ({
          ...prev,
          [key]: subMenuRefs.current[key]?.scrollHeight || 0,
        }));
      }
    }
  }, [openSubmenu]);

  const handleSubmenuToggle = (index: number, menuType: "main" | "others") => {
    setOpenSubmenu((prev) => {
      if (prev && prev.type === menuType && prev.index === index) return null;
      return { type: menuType, index };
    });
  };

  const isCollapsed = !isExpanded && !isHovered && !isMobileOpen;

  const renderMenuItems = (items: NavItem[], menuType: "main" | "others") => (
    <ul className="flex flex-col gap-1">
      {items.map((nav, index) => {
        const isSubmenuOpen =
          openSubmenu?.type === menuType && openSubmenu?.index === index;
        const hasActiveChild = nav.subItems?.some((s) => isActive(s.path));

        return (
          <li key={nav.name}>
            {nav.subItems ? (
              <button
                onClick={() => handleSubmenuToggle(index, menuType)}
                className={`
                  w-full flex items-center gap-3 px-4 py-2.5 rounded-lg text-sm font-medium
                  transition-all duration-150 cursor-pointer relative
                  ${isSubmenuOpen || hasActiveChild
                    ? "bg-[#4a5568] text-white"
                    : "text-[#a0aec0] hover:bg-white/5 hover:text-[#e2e8f0]"
                  }
                  ${isCollapsed ? "justify-center" : "justify-start"}
                `}
              >
                {(isSubmenuOpen || hasActiveChild) && (
                  <span className="absolute left-0 top-1 bottom-1 w-[3px] bg-[#68d391] rounded-r-sm" />
                )}
                <span className="w-5 h-5 flex text-lg items-center justify-center flex-shrink-0">
                  {nav.icon}
                </span>
                {!isCollapsed && (
                  <>
                    <span className="flex-1 text-left text-base">{nav.name}</span>
                    <FiChevronDown
                      className={`w-4 h-4 flex-shrink-0 transition-transform duration-200 text-[#718096]
                        ${isSubmenuOpen ? "rotate-180 !text-[#a0aec0]" : ""}
                      `}
                    />
                  </>
                )}
              </button>
            ) : (
              nav.path && (
                <Link
                  to={nav.path}
                  className={`
                    flex items-center gap-3 px-4 py-2.5 rounded-lg text-sm font-medium
                    transition-all duration-150 relative
                    ${isActive(nav.path)
                      ? "bg-[#4a5568] text-white"
                      : "text-[#a0aec0] hover:bg-white/5 hover:text-[#e2e8f0]"
                    }
                    ${isCollapsed ? "justify-center" : "justify-start"}
                  `}
                >
                  {isActive(nav.path) && (
                    <span className="absolute left-0 top-1 bottom-1 w-[3px] bg-[#68d391] rounded-r-sm" />
                  )}
                  <span className="w-5 h-5 text-xl flex items-center justify-center flex-shrink-0">
                    {nav.icon}
                  </span>
                  {!isCollapsed && (
                    <span className="flex-1 text-base">{nav.name}</span>
                  )}
                </Link>
              )
            )}

            {nav.subItems && !isCollapsed && (
              <div
                ref={(el) => {
                  subMenuRefs.current[`${menuType}-${index}`] = el;
                }}
                className="overflow-hidden transition-all duration-300"
                style={{
                  height: isSubmenuOpen
                    ? `${subMenuHeight[`${menuType}-${index}`]}px`
                    : "0px",
                }}
              >
                <ul className="mt-1 pl-10 flex flex-col gap-0.5">
                  {nav.subItems.map((subItem) => (
                    <li key={subItem.name}>
                      <Link
                        to={subItem.path}
                        className={`
                          flex items-center gap-2.5 px-3 py-2 rounded-lg text-[13px]
                          transition-all duration-150
                          ${isActive(subItem.path)
                            ? "text-white bg-white/8"
                            : "text-[#718096] hover:bg-white/4 hover:text-[#cbd5e0]"
                          }
                        `}
                      >
                        <span
                          className={`
                            w-[18px] h-[18px] rounded-full border flex-shrink-0 flex items-center justify-center
                            ${isActive(subItem.path)
                              ? "border-white"
                              : "border-[#718096]"
                            }
                          `}
                        >
                          {isActive(subItem.path) && (
                            <span className="w-[7px] h-[7px] rounded-full bg-white" />
                          )}
                        </span>
                        <span className="text-base">{subItem.name}</span>
                        {(subItem.new || subItem.pro) && (
                          <span className="flex items-center gap-1 ml-auto">
                            {subItem.new && (
                              <span className="text-[10px] px-1.5 py-0.5 rounded bg-[#68d391]/20 text-[#68d391] font-medium">
                                new
                              </span>
                            )}
                            {subItem.pro && (
                              <span className="text-[10px] px-1.5 py-0.5 rounded bg-[#f6ad55]/20 text-[#f6ad55] font-medium">
                                pro
                              </span>
                            )}
                          </span>
                        )}
                      </Link>
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </li>
        );
      })}
    </ul>
  );

  const renderLogoutButton = () => (
    <div className="px-3 py-4 border-t border-white/10">
      <Link
        to={logoutNavItem.path!}
        className={`
          flex items-center gap-3 px-4 py-2.5 rounded-lg
          bg-red-600 hover:bg-red-700 text-white text-sm font-semibold
          transition-all duration-150
          ${isCollapsed ? "justify-center" : "justify-start"}
        `}
      >
        <span className="w-5 h-5 flex items-center justify-center flex-shrink-0">
          {logoutNavItem.icon}
        </span>
        {!isCollapsed && <span>{logoutNavItem.name}</span>}
      </Link>
    </div>
  );

  return (
    <aside
      className={`
        fixed mt-16 flex flex-col lg:mt-0 top-0 left-0 h-screen
        bg-[#2d3748] text-gray-100
        border-r border-white/10
        transition-all duration-300 ease-in-out z-50
        ${isExpanded || isMobileOpen ? "w-[290px]" : isHovered ? "w-[270px]" : "w-[92px]"}
        ${isMobileOpen ? "translate-x-0" : "-translate-x-full"}
        lg:translate-x-0
      `}
      onMouseEnter={() => !isExpanded && setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      {/* Header */}
      <div
        className={`
          flex items-center gap-3 px-4 py-5
          bg-[#1a202c] border-b border-white/10 flex-shrink-0
          ${isCollapsed ? "justify-center" : "justify-start"}
        `}
      >
        <div className="w-9 h-9 rounded-lg bg-[#38a169] flex items-center justify-center flex-shrink-0">
          <span className="text-white font-bold text-base leading-none">A</span>
        </div>
        {!isCollapsed && (
          <Link to="/" className="flex items-center gap-1 select-none">
            <span className="text-white font-extrabold text-xl tracking-wide uppercase">
              Auto
            </span>
            <span className="text-white font-bold text-xl tracking-widest uppercase">
              Daddy
            </span>
          </Link>
        )}
      </div>

      {/* Nav */}
      <div className="flex flex-col flex-1 overflow-y-auto no-scrollbar">
        <nav className="flex-1 px-3 py-4">
          <div className="flex flex-col gap-4">
            <div>
              {!isCollapsed && (
                <p className="mb-3 px-1 text-[10px] uppercase tracking-widest font-semibold text-[#718096]">
                  Menu
                </p>
              )}
              {isCollapsed && (
                <div className="flex justify-center mb-3">
                  <FiMoreHorizontal className="w-5 h-5 text-[#718096]" />
                </div>
              )}
              {renderMenuItems(navItems, "main")}
            </div>
          </div>
        </nav>
      </div>

      {renderLogoutButton()}
    </aside>
  );
};

export default SubAdminAppSidebar;