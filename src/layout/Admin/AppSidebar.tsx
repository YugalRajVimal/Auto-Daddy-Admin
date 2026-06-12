

// import { useCallback, useEffect, useRef, useState } from "react";
// import { Link, useLocation } from "react-router";
// import { useSidebar } from "../../context/SidebarContext";

// // React Icons for accurate and meaningful menu icons
// import { MdDashboard } from "react-icons/md";
// import { FaUsers, FaCarSide, FaMoneyBillWave, FaBullhorn, FaTags, FaRegCreditCard, FaFileAlt, FaUserCog} from "react-icons/fa";

// import { HiTemplate, HiOutlineLogout } from "react-icons/hi";

// import { TbHelpCircle } from "react-icons/tb";

// import { MdLocationPin } from "react-icons/md";
// import { FiChevronDown, FiMoreHorizontal } from "react-icons/fi";

// type NavItem = {
//   name: string;
//   icon: React.ReactNode;
//   path?: string;
//   subItems?: { name: string; path: string; pro?: boolean; new?: boolean }[];
// };

// const navItems: NavItem[] = [
//   {
//     icon: <MdDashboard />,
//     name: "Dashboard",
//     path: "/admin",
//   },
//   {
//     icon: <FaUsers />,
//     name: "All Users",
//     subItems: [
//       { name: "Car Owners", path: "/admin/car-owners", pro: false },
//       { name: "Auto Shop Owners", path: "/admin/auto-shop-owners", pro: false },
//     ],
//   },
//   {
//     icon: <FaRegCreditCard />,
//     name: "Services / Categories",
//     subItems: [
//       { name: "Services", path: "/admin/services" },
//       { name: "Categories", path: "/admin/categories" },
//     ],
//   },
//   {
//     icon: <HiTemplate />,
//     name: "Website Templates",
//     path: "/admin/website-templates",
//   },
//   {
//     icon: <FaFileAlt />,
//     name: "Dashboard Data",
//     path: "/admin/dashboard-data",
//   },
//   {
//     icon: <FaCarSide />,
//     name: "Car Companies",
//     path: "/admin/car-companies",
//   },
//   {
//     icon: <MdLocationPin />, // location pin
//     name: "Location",
//     subItems: [
//       {
//         name: "Provinces",
//         path: "/admin/provinces",
//       },
//       {
//         name: "Cities",
//         path: "/admin/cities",
//       },
//     ],
//   },
//   {
//     icon: <FaBullhorn />,
//     name: "Ads",
//     path: "/admin/ads",
//   },
//   {
//     icon: <FaTags />,
//     name: "Running Deals",
//     path: "/admin/running-deals",
//   },
//   {
//     icon: <FaMoneyBillWave />,
//     name: "Wallet",
//     path: "/admin/wallet",
//   },
//   {
//     icon: <TbHelpCircle />,
//     name: "Invite Help",
//     path: "/admin/invite-help",
//   },
//   {
//     icon: <FaUserCog />,
//     name: "Sub-Admin Management",
//     path: "/admin/sub-admin-management",
//   },
// ];

// const logoutNavItem: NavItem = {
//   icon: <HiOutlineLogout />,
//   name: "Logout",
//   path: "/admin/logout",
// };

// const othersItems: NavItem[] = [];

// const SubAdminAppSidebar: React.FC = () => {
//   const { isExpanded, isMobileOpen, isHovered, setIsHovered } = useSidebar();
//   const location = useLocation();

//   const [openSubmenu, setOpenSubmenu] = useState<{
//     type: "main" | "others";
//     index: number;
//   } | null>(null);
//   const [subMenuHeight, setSubMenuHeight] = useState<Record<string, number>>({});
//   const subMenuRefs = useRef<Record<string, HTMLDivElement | null>>({});

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
//               setOpenSubmenu({ type: menuType as "main" | "others", index });
//               submenuMatched = true;
//             }
//           });
//         }
//       });
//     });
//     if (!submenuMatched) setOpenSubmenu(null);
//   }, [location, isActive]);

//   useEffect(() => {
//     if (openSubmenu !== null) {
//       const key = `${openSubmenu.type}-${openSubmenu.index}`;
//       if (subMenuRefs.current[key]) {
//         setSubMenuHeight((prev) => ({
//           ...prev,
//           [key]: subMenuRefs.current[key]?.scrollHeight || 0,
//         }));
//       }
//     }
//   }, [openSubmenu]);

//   const handleSubmenuToggle = (index: number, menuType: "main" | "others") => {
//     setOpenSubmenu((prev) => {
//       if (prev && prev.type === menuType && prev.index === index) return null;
//       return { type: menuType, index };
//     });
//   };

//   const isCollapsed = !isExpanded && !isHovered && !isMobileOpen;

//   const renderMenuItems = (items: NavItem[], menuType: "main" | "others") => (
//     <ul className="flex flex-col gap-1">
//       {items.map((nav, index) => {
//         const isSubmenuOpen =
//           openSubmenu?.type === menuType && openSubmenu?.index === index;
//         const hasActiveChild = nav.subItems?.some((s) => isActive(s.path));

//         return (
//           <li key={nav.name}>
//             {nav.subItems ? (
//               <button
//                 onClick={() => handleSubmenuToggle(index, menuType)}
//                 className={`
//                   w-full flex items-center gap-3 px-4 py-2.5 rounded-lg text-sm font-medium
//                   transition-all duration-150 cursor-pointer relative
//                   ${isSubmenuOpen || hasActiveChild
//                     ? "bg-[#4a5568] text-white"
//                     : "text-[#a0aec0] hover:bg-white/5 hover:text-[#e2e8f0]"
//                   }
//                   ${isCollapsed ? "justify-center" : "justify-start"}
//                 `}
//               >
//                 {(isSubmenuOpen || hasActiveChild) && (
//                   <span className="absolute left-0 top-1 bottom-1 w-[3px] bg-[#68d391] rounded-r-sm" />
//                 )}
//                 <span className="w-5 h-5 flex text-lg items-center justify-center flex-shrink-0">
//                   {nav.icon}
//                 </span>
//                 {!isCollapsed && (
//                   <>
//                     <span className="flex-1 text-left text-base">{nav.name}</span>
//                     <FiChevronDown
//                       className={`w-4 h-4 flex-shrink-0 transition-transform duration-200 text-[#718096]
//                         ${isSubmenuOpen ? "rotate-180 !text-[#a0aec0]" : ""}
//                       `}
//                     />
//                   </>
//                 )}
//               </button>
//             ) : (
//               nav.path && (
//                 <Link
//                   to={nav.path}
//                   className={`
//                     flex items-center gap-3 px-4 py-2.5 rounded-lg text-sm font-medium
//                     transition-all duration-150 relative
//                     ${isActive(nav.path)
//                       ? "bg-[#4a5568] text-white"
//                       : "text-[#a0aec0] hover:bg-white/5 hover:text-[#e2e8f0]"
//                     }
//                     ${isCollapsed ? "justify-center" : "justify-start"}
//                   `}
//                 >
//                   {isActive(nav.path) && (
//                     <span className="absolute left-0 top-1 bottom-1 w-[3px] bg-[#68d391] rounded-r-sm" />
//                   )}
//                   <span className="w-5 h-5 text-xl flex items-center justify-center flex-shrink-0">
//                     {nav.icon}
//                   </span>
//                   {!isCollapsed && (
//                     <span className="flex-1 text-base">{nav.name}</span>
//                   )}
//                 </Link>
//               )
//             )}

//             {nav.subItems && !isCollapsed && (
//               <div
//                 ref={(el) => {
//                   subMenuRefs.current[`${menuType}-${index}`] = el;
//                 }}
//                 className="overflow-hidden transition-all duration-300"
//                 style={{
//                   height: isSubmenuOpen
//                     ? `${subMenuHeight[`${menuType}-${index}`]}px`
//                     : "0px",
//                 }}
//               >
//                 <ul className="mt-1 pl-10 flex flex-col gap-0.5">
//                   {nav.subItems.map((subItem) => (
//                     <li key={subItem.name}>
//                       <Link
//                         to={subItem.path}
//                         className={`
//                           flex items-center gap-2.5 px-3 py-2 rounded-lg text-[13px]
//                           transition-all duration-150
//                           ${isActive(subItem.path)
//                             ? "text-white bg-white/8"
//                             : "text-[#718096] hover:bg-white/4 hover:text-[#cbd5e0]"
//                           }
//                         `}
//                       >
//                         <span
//                           className={`
//                             w-[18px] h-[18px] rounded-full border flex-shrink-0 flex items-center justify-center
//                             ${isActive(subItem.path)
//                               ? "border-white"
//                               : "border-[#718096]"
//                             }
//                           `}
//                         >
//                           {isActive(subItem.path) && (
//                             <span className="w-[7px] h-[7px] rounded-full bg-white" />
//                           )}
//                         </span>
//                         <span className="text-base">{subItem.name}</span>
//                         {(subItem.new || subItem.pro) && (
//                           <span className="flex items-center gap-1 ml-auto">
//                             {subItem.new && (
//                               <span className="text-[10px] px-1.5 py-0.5 rounded bg-[#68d391]/20 text-[#68d391] font-medium">
//                                 new
//                               </span>
//                             )}
//                             {subItem.pro && (
//                               <span className="text-[10px] px-1.5 py-0.5 rounded bg-[#f6ad55]/20 text-[#f6ad55] font-medium">
//                                 pro
//                               </span>
//                             )}
//                           </span>
//                         )}
//                       </Link>
//                     </li>
//                   ))}
//                 </ul>
//               </div>
//             )}
//           </li>
//         );
//       })}
//     </ul>
//   );

//   const renderLogoutButton = () => (
//     <div className="px-3 py-4 border-t border-white/10">
//       <Link
//         to={logoutNavItem.path!}
//         className={`
//           flex items-center gap-3 px-4 py-2.5 rounded-lg
//           bg-red-600 hover:bg-red-700 text-white text-sm font-semibold
//           transition-all duration-150
//           ${isCollapsed ? "justify-center" : "justify-start"}
//         `}
//       >
//         <span className="w-5 h-5 flex items-center justify-center flex-shrink-0">
//           {logoutNavItem.icon}
//         </span>
//         {!isCollapsed && <span>{logoutNavItem.name}</span>}
//       </Link>
//     </div>
//   );

//   return (
//     <aside
//       className={`
//         fixed mt-16 flex flex-col lg:mt-0 top-0 left-0 h-screen
//         bg-[#2d3748] text-gray-100
//         border-r border-white/10
//         transition-all duration-300 ease-in-out z-50
//         ${isExpanded || isMobileOpen ? "w-[290px]" : isHovered ? "w-[270px]" : "w-[92px]"}
//         ${isMobileOpen ? "translate-x-0" : "-translate-x-full"}
//         lg:translate-x-0
//       `}
//       onMouseEnter={() => !isExpanded && setIsHovered(true)}
//       onMouseLeave={() => setIsHovered(false)}
//     >
//       {/* Header */}
//       <div
//         className={`
//           flex items-center gap-3 px-4 py-5
//           bg-[#1a202c] border-b border-white/10 flex-shrink-0
//           ${isCollapsed ? "justify-center" : "justify-start"}
//         `}
//       >
//         <div className="w-9 h-9 rounded-lg bg-[#38a169] flex items-center justify-center flex-shrink-0">
//           <span className="text-white font-bold text-base leading-none">A</span>
//         </div>
//         {!isCollapsed && (
//           <Link to="/" className="flex items-center gap-1 select-none">
//             <span className="text-white font-extrabold text-xl tracking-wide uppercase">
//               Auto
//             </span>
//             <span className="text-white font-bold text-xl tracking-widest uppercase">
//               Daddy
//             </span>
//           </Link>
//         )}
//       </div>

//       {/* Nav */}
//       <div className="flex flex-col flex-1 overflow-y-auto no-scrollbar">
//         <nav className="flex-1 px-3 py-4">
//           <div className="flex flex-col gap-4">
//             <div>
//               {!isCollapsed && (
//                 <p className="mb-3 px-1 text-[10px] uppercase tracking-widest font-semibold text-[#718096]">
//                   Menu
//                 </p>
//               )}
//               {isCollapsed && (
//                 <div className="flex justify-center mb-3">
//                   <FiMoreHorizontal className="w-5 h-5 text-[#718096]" />
//                 </div>
//               )}
//               {renderMenuItems(navItems, "main")}
//             </div>
//           </div>
//         </nav>
//       </div>

//       {renderLogoutButton()}
//     </aside>
//   );
// };

// export default SubAdminAppSidebar;

// layout/Admin/AppSidebar.tsx  — UPDATED VERSION
// Key changes:
//   1. Imports usePermissions hook
//   2. Hides menu items the subadmin has no `view` permission for
//   3. Adds "Sub Admin Management" under "Administration" section (admin only)

import { useCallback, useEffect, useRef, useState } from "react";
import { Link, useLocation } from "react-router";
import { useSidebar } from "../../context/SidebarContext";

import { MdDashboard } from "react-icons/md";
import { FaUsers, FaCarSide, FaMoneyBillWave, FaBullhorn, FaTags, FaRegCreditCard, FaFileAlt, FaUserShield } from "react-icons/fa";
import { HiTemplate, HiOutlineLogout } from "react-icons/hi";
import { TbHelpCircle } from "react-icons/tb";
import { MdLocationPin } from "react-icons/md";
import { FiChevronDown, FiMoreHorizontal } from "react-icons/fi";
import usePermissions from "../../hooks/usePermission";

type NavItem = {
  name: string;
  icon: React.ReactNode;
  path?: string;
  permissionModule?: string; // if set, only show when user can view this module
  adminOnly?: boolean;       // if true, only show to main admin
  subItems?: { name: string; path: string; permissionModule?: string }[];
};

const navItems: NavItem[] = [
  { icon: <MdDashboard />, name: "Dashboard", path: "/admin", permissionModule: "dashboard" },
  {
    icon: <FaUsers />, name: "All Users",
    subItems: [
      { name: "Car Owners",       path: "/admin/car-owners",       permissionModule: "users" },
      { name: "Auto Shop Owners", path: "/admin/auto-shop-owners", permissionModule: "users" },
    ],
  },
  {
    icon: <FaRegCreditCard />, name: "Services / Categories",
    subItems: [
      { name: "Services",    path: "/admin/services",    permissionModule: "services" },
      { name: "Categories",  path: "/admin/categories",  permissionModule: "categories" },
    ],
  },
  { icon: <HiTemplate />,    name: "Website Templates", path: "/admin/website-templates", permissionModule: "websiteTemplates" },
  { icon: <FaFileAlt />,     name: "Dashboard Data",    path: "/admin/dashboard-data",    permissionModule: "dashboardData" },
  { icon: <FaCarSide />,     name: "Car Companies",     path: "/admin/car-companies",     permissionModule: "carCompanies" },
  {
    icon: <MdLocationPin />, name: "Location",
    subItems: [
      { name: "Provinces", path: "/admin/provinces", permissionModule: "provinces" },
      { name: "Cities",    path: "/admin/cities",    permissionModule: "cities" },
    ],
  },
  { icon: <FaBullhorn />,        name: "Ads",           path: "/admin/ads",           permissionModule: "ads" },
  { icon: <FaTags />,            name: "Running Deals", path: "/admin/running-deals", permissionModule: "runningDeals" },
  { icon: <FaMoneyBillWave />,   name: "Wallet",        path: "/admin/wallet",        permissionModule: "wallet" },
  { icon: <TbHelpCircle />,      name: "Invite Help",   path: "/admin/invite-help",   permissionModule: "inviteHelp" },
];

// Administration section — main admin only
const adminOnlyItems: NavItem[] = [
  {
    icon: <FaUserShield />,
    name: "Administration",
    adminOnly: true,
    subItems: [
      { name: "Sub Admin Management", path: "/admin/subadmins" },
    ],
  },
];

const logoutNavItem: NavItem = { icon: <HiOutlineLogout />, name: "Logout", path: "/admin/logout" };

const SubAdminAppSidebar: React.FC = () => {
  const { isExpanded, isMobileOpen, isHovered, setIsHovered } = useSidebar();
  const location = useLocation();
  const { isAdmin, canView } = usePermissions();

  const [openSubmenu, setOpenSubmenu] = useState<{ type: "main" | "admin"; index: number } | null>(null);
  const [subMenuHeight, setSubMenuHeight] = useState<Record<string, number>>({});
  const subMenuRefs = useRef<Record<string, HTMLDivElement | null>>({});

  const isActive = useCallback((path: string) => location.pathname === path, [location.pathname]);

  // Filter nav items by permission
  const visibleNavItems = navItems.filter((nav) => {
    if (!nav.permissionModule && !nav.subItems) return true;
    if (nav.subItems) {
      return nav.subItems.some((s) => !s.permissionModule || canView(s.permissionModule));
    }
    return canView(nav.permissionModule!);
  });

  const visibleAdminItems = isAdmin ? adminOnlyItems : [];

  useEffect(() => {
    let matched = false;
    [{ items: visibleNavItems, type: "main" }, { items: visibleAdminItems, type: "admin" }].forEach(({ items, type }) => {
      items.forEach((nav, index) => {
        nav.subItems?.forEach((sub) => {
          if (isActive(sub.path)) { setOpenSubmenu({ type: type as any, index }); matched = true; }
        });
      });
    });
    if (!matched) setOpenSubmenu(null);
  }, [location, isActive]);

  useEffect(() => {
    if (openSubmenu !== null) {
      const key = `${openSubmenu.type}-${openSubmenu.index}`;
      if (subMenuRefs.current[key]) {
        setSubMenuHeight((prev) => ({ ...prev, [key]: subMenuRefs.current[key]?.scrollHeight || 0 }));
      }
    }
  }, [openSubmenu]);

  const handleSubmenuToggle = (index: number, menuType: "main" | "admin") => {
    setOpenSubmenu((prev) => (prev?.type === menuType && prev?.index === index ? null : { type: menuType, index }));
  };

  const isCollapsed = !isExpanded && !isHovered && !isMobileOpen;

  const renderItems = (items: NavItem[], menuType: "main" | "admin") => (
    <ul className="flex flex-col gap-1">
      {items.map((nav, index) => {
        const isSubmenuOpen = openSubmenu?.type === menuType && openSubmenu?.index === index;
        const hasActiveChild = nav.subItems?.some((s) => isActive(s.path));
        const visibleSubItems = nav.subItems?.filter((s) => !s.permissionModule || canView(s.permissionModule));

        return (
          <li key={nav.name}>
            {nav.subItems ? (
              <button onClick={() => handleSubmenuToggle(index, menuType)}
                className={`w-full flex items-center gap-3 px-4 py-2.5 rounded-lg text-sm font-medium transition-all duration-150 cursor-pointer relative ${isSubmenuOpen || hasActiveChild ? "bg-[#4a5568] text-white" : "text-[#a0aec0] hover:bg-white/5 hover:text-[#e2e8f0]"} ${isCollapsed ? "justify-center" : "justify-start"}`}>
                {(isSubmenuOpen || hasActiveChild) && <span className="absolute left-0 top-1 bottom-1 w-[3px] bg-[#68d391] rounded-r-sm" />}
                <span className="w-5 h-5 flex text-lg items-center justify-center flex-shrink-0">{nav.icon}</span>
                {!isCollapsed && (
                  <>
                    <span className="flex-1 text-left text-base">{nav.name}</span>
                    <FiChevronDown className={`w-4 h-4 flex-shrink-0 transition-transform duration-200 text-[#718096] ${isSubmenuOpen ? "rotate-180" : ""}`} />
                  </>
                )}
              </button>
            ) : (
              nav.path && (
                <Link to={nav.path}
                  className={`flex items-center gap-3 px-4 py-2.5 rounded-lg text-sm font-medium transition-all duration-150 relative ${isActive(nav.path) ? "bg-[#4a5568] text-white" : "text-[#a0aec0] hover:bg-white/5 hover:text-[#e2e8f0]"} ${isCollapsed ? "justify-center" : "justify-start"}`}>
                  {isActive(nav.path) && <span className="absolute left-0 top-1 bottom-1 w-[3px] bg-[#68d391] rounded-r-sm" />}
                  <span className="w-5 h-5 text-xl flex items-center justify-center flex-shrink-0">{nav.icon}</span>
                  {!isCollapsed && <span className="flex-1 text-base">{nav.name}</span>}
                </Link>
              )
            )}

            {nav.subItems && !isCollapsed && (
              <div ref={(el) => { subMenuRefs.current[`${menuType}-${index}`] = el; }}
                className="overflow-hidden transition-all duration-300"
                style={{ height: isSubmenuOpen ? `${subMenuHeight[`${menuType}-${index}`]}px` : "0px" }}>
                <ul className="mt-1 pl-10 flex flex-col gap-0.5">
                  {(visibleSubItems || []).map((subItem) => (
                    <li key={subItem.name}>
                      <Link to={subItem.path}
                        className={`flex items-center gap-2.5 px-3 py-2 rounded-lg text-[13px] transition-all duration-150 ${isActive(subItem.path) ? "text-white bg-white/8" : "text-[#718096] hover:bg-white/4 hover:text-[#cbd5e0]"}`}>
                        <span className={`w-[18px] h-[18px] rounded-full border flex-shrink-0 flex items-center justify-center ${isActive(subItem.path) ? "border-white" : "border-[#718096]"}`}>
                          {isActive(subItem.path) && <span className="w-[7px] h-[7px] rounded-full bg-white" />}
                        </span>
                        <span className="text-base">{subItem.name}</span>
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

  return (
    <aside
      className={`fixed mt-16 flex flex-col lg:mt-0 top-0 left-0 h-screen bg-[#2d3748] text-gray-100 border-r border-white/10 transition-all duration-300 ease-in-out z-50 ${isExpanded || isMobileOpen ? "w-[290px]" : isHovered ? "w-[270px]" : "w-[92px]"} ${isMobileOpen ? "translate-x-0" : "-translate-x-full"} lg:translate-x-0`}
      onMouseEnter={() => !isExpanded && setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}>

      {/* Header */}
      <div className={`flex items-center gap-3 px-4 py-5 bg-[#1a202c] border-b border-white/10 flex-shrink-0 ${isCollapsed ? "justify-center" : "justify-start"}`}>
        <div className="w-9 h-9 rounded-lg bg-[#38a169] flex items-center justify-center flex-shrink-0">
          <span className="text-white font-bold text-base">A</span>
        </div>
        {!isCollapsed && (
          <Link to="/" className="flex items-center gap-1 select-none">
            <span className="text-white font-extrabold text-xl tracking-wide uppercase">Auto</span>
            <span className="text-white font-bold text-xl tracking-widest uppercase">Daddy</span>
          </Link>
        )}
      </div>

      {/* Nav */}
      <div className="flex flex-col flex-1 overflow-y-auto no-scrollbar">
        <nav className="flex-1 px-3 py-4">
          <div className="flex flex-col gap-4">
            {/* Main items */}
            <div>
              {!isCollapsed && <p className="mb-3 px-1 text-[10px] uppercase tracking-widest font-semibold text-[#718096]">Menu</p>}
              {isCollapsed && <div className="flex justify-center mb-3"><FiMoreHorizontal className="w-5 h-5 text-[#718096]" /></div>}
              {renderItems(visibleNavItems, "main")}
            </div>

            {/* Administration (admin only) */}
            {isAdmin && visibleAdminItems.length > 0 && (
              <div>
                {!isCollapsed && <p className="mb-3 px-1 text-[10px] uppercase tracking-widest font-semibold text-[#718096]">Administration</p>}
                {renderItems(visibleAdminItems, "admin")}
              </div>
            )}
          </div>
        </nav>
      </div>

      {/* Logout */}
      <div className="px-3 py-4 border-t border-white/10">
        <Link to={logoutNavItem.path!}
          className={`flex items-center gap-3 px-4 py-2.5 rounded-lg bg-red-600 hover:bg-red-700 text-white text-sm font-semibold transition-all duration-150 ${isCollapsed ? "justify-center" : "justify-start"}`}>
          <span className="w-5 h-5 flex items-center justify-center flex-shrink-0">{logoutNavItem.icon}</span>
          {!isCollapsed && <span>{logoutNavItem.name}</span>}
        </Link>
      </div>
    </aside>
  );
};

export default SubAdminAppSidebar;