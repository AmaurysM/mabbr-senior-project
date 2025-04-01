import { FaCheckCircle, FaUserShield } from "react-icons/fa";

const UserVerificationIcon = ({ userRole, className = "" }: { userRole: string | undefined; className?: string }) => {
  const getUserVerification = () => {
    if (userRole === "admin") {
      return { label: "Administrator", icon: <FaUserShield className={className} /> };
    }
    if (userRole === "premium") {
      return { label: "Premium Member", icon: null };
    }
    if (userRole === "verified") {
      return { label: "Verified", icon: <FaCheckCircle className={className} /> };
    }
    return { label: "Member", icon: null };
  };

  const { icon } = getUserVerification();

  return (
    <span className="flex items-center">
      {icon && icon}
    </span>
  );
};

export default UserVerificationIcon;
