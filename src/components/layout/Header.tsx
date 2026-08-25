import React, { useState, useRef, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import {
  Menu,
  LogOut,
  ChevronDown,
  HelpCircle
} from "lucide-react";
import { NotificationBell } from "./NotificationBell";
import Button from "../common/Button";
import Avatar from "../common/Avatar";
import { useAppDispatch, useAppSelector } from "../../store/hooks";
import { logout } from "../../store/slices/authSlice";
import { cn } from "../../lib/utils";
import logoStatic from "../../assets/codecit-logo.png";

interface HeaderProps {
  handleDrawerToggle: () => void;
  onSupportClick?: () => void;
}

// NotificationDropdown was replaced by NotificationBell component

interface UserDropdownProps {
  userDropdownOpen: boolean;
  setUserDropdownOpen: (open: boolean) => void;
  userName: string;
  userEmail: string;
  profilePicture?: string;
  userDropdownRef: React.RefObject<HTMLDivElement | null>;
  navigate: (path: string) => void;
  handleLogout: () => void;
}

const UserDropdown: React.FC<UserDropdownProps> = ({
  userDropdownOpen,
  setUserDropdownOpen,
  userName,
  userEmail,
  profilePicture,
  userDropdownRef,
  // navigate,
  handleLogout,
}) => (
  <div className="relative" ref={userDropdownRef}>
    <Button
      variant="ghost"
      onClick={() => {
        setUserDropdownOpen(!userDropdownOpen);
      }}
      className={cn(
        "flex items-center gap-3 py-1.5 pl-1.5 pr-3 rounded-xl transition-all h-auto",
        "hover:bg-muted",
        userDropdownOpen && "bg-muted",
      )}
    >
      <Avatar
        src={profilePicture}
        firstName={userName.split(" ")[0]}
        lastName={userName.split(" ")[1]}
        size="sm"
      />

      <div className="text-left hidden lg:block">
        <p className="text-sm font-medium text-foreground leading-tight">
          {userName}
        </p>
        <p className="text-xs text-foreground-secondary capitalize">
          {userEmail.split("@")[0]}
        </p>
      </div>

      <ChevronDown
        className={cn(
          "w-4 h-4 text-foreground-secondary transition-transform duration-200",
          userDropdownOpen && "rotate-180",
        )}
      />
    </Button>

    {userDropdownOpen && (
      <div className="absolute right-0 mt-2 w-64 bg-surface rounded-2xl shadow-xl border border-border overflow-hidden z-50">
        <div className="px-4 py-4 bg-muted/50">
          <div className="flex items-center gap-3">
            <Avatar
              src={profilePicture}
              firstName={userName.split(" ")[0]}
              lastName={userName.split(" ")[1]}
              size="lg"
            />
            <div className="flex-1 min-w-0">
              <p className="font-semibold text-foreground truncate">
                {userName}
              </p>
              <p className="text-sm text-foreground-secondary truncate">
                {userEmail}
              </p>
            </div>
          </div>
        </div>

        {/* <div className="py-2">
          <Button
            variant="ghost"
            onClick={() => {
              setUserDropdownOpen(false);
              navigate("/profile");
            }}
            className="w-full flex items-center gap-3 px-4 py-2.5 text-sm text-foreground hover:bg-muted transition-colors h-auto rounded-none justify-start"
            startIcon={<User className="w-4 h-4 text-foreground-secondary" />}
          >
            My Profile
          </Button>
          <Button
            variant="ghost"
            onClick={() => {
              setUserDropdownOpen(false);
              navigate("/settings");
            }}
            className="w-full flex items-center gap-3 px-4 py-2.5 text-sm text-foreground hover:bg-muted transition-colors h-auto rounded-none justify-start"
            startIcon={<Settings className="w-4 h-4 text-foreground-secondary" />}
          >
            Settings
          </Button>
        </div> */}

        <div className="border-t border-border" />

        <div className="py-2">
          <Button
            variant="ghost"
            onClick={handleLogout}
            className="w-full flex items-center gap-3 px-4 py-2.5 text-sm text-error hover:bg-error/5 transition-colors h-auto rounded-none justify-start"
            startIcon={<LogOut className="w-4 h-4" />}
          >
            Sign Out
          </Button>
        </div>
      </div>
    )}
  </div>
);


const Header: React.FC<HeaderProps> = ({ handleDrawerToggle, onSupportClick }) => {
  const navigate = useNavigate();
  const dispatch = useAppDispatch();
  const { user } = useAppSelector((state) => state.auth);
  const [userDropdownOpen, setUserDropdownOpen] = useState(false);
  const userDropdownRef = useRef<HTMLDivElement>(null);

  const handleLogout = async () => {
    setUserDropdownOpen(false);
    await dispatch(logout());
    navigate("/login", { replace: true });
  };

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        userDropdownRef.current &&
        !userDropdownRef.current.contains(event.target as Node)
      ) {
        setUserDropdownOpen(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const userName = user ? `${user.personalInfo.firstName} ${user.personalInfo.lastName}` : "User";
  const userEmail = user?.personalInfo?.email || "";
  const profilePicture = user?.personalInfo?.profilePicture;

  // const unreadCount = notifications.filter((n) => n.unread).length;

  return (
    <header className="fixed top-0 left-0 right-0 z-50 h-16 bg-surface border-b border-border shadow-sm">
      <div className="h-full px-4 md:px-6 flex items-center justify-between">
        {/* Left side - Logo & Branding */}
        <div className="flex items-center gap-3">
          {/* Mobile menu button */}
          <Button
            variant="ghost"
            size="icon"
            onClick={handleDrawerToggle}
            className="md:hidden p-2 rounded-xl hover:bg-muted transition-colors h-auto w-auto"
            aria-label="Open menu"
          >
            <Menu className="w-6 h-6 text-foreground" />
          </Button>

          {/* Logo */}
          <div className="flex items-center gap-3">
            <img
              src={logoStatic}
              alt="CodecIT"
              className="w-10 h-10 rounded-xl shadow-sm"
            />
            <div className="hidden sm:block">
              <h1 className="text-lg font-bold text-foreground leading-tight">
                CodecIT
              </h1>
              <p className="text-xs text-foreground-secondary">
                HR Management System
              </p>
            </div>
          </div>
        </div>

        {/* Right side - Actions */}
        <div className="flex items-center gap-4">
          <button 
            onClick={onSupportClick}
            className="p-2 rounded-xl hover:bg-muted text-foreground-tertiary hover:text-primary transition-all group"
            title="System Support"
          >
            <HelpCircle className="w-5 h-5 group-hover:scale-110 transition-transform" />
          </button>
          <NotificationBell />
          <div className="w-px h-8 bg-border mx-1 md:mx-2" />
          <UserDropdown
            userDropdownOpen={userDropdownOpen}
            setUserDropdownOpen={setUserDropdownOpen}
            userName={userName}
            userEmail={userEmail}
            profilePicture={profilePicture}
            userDropdownRef={userDropdownRef}
            navigate={navigate}
            handleLogout={handleLogout}
          />
        </div>
      </div>
    </header>
  );
};

export default Header;
