import { FC } from "react";

const Header: FC = () => {
  return (
    <header className="flex items-center justify-between h-14 px-6 border-b bg-white">
      <h1 className="text-lg font-semibold text-gray-800">
        CA Practice Manager
      </h1>
    </header>
  );
};

export default Header;
