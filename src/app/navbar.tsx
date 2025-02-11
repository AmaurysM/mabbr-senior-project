import Link from 'next/link';

const Navbar = () => {
  return (
    <nav className="bg-white shadow-md py-4 px-6">
      <div className="container mx-auto flex justify-between items-center">
        <Link href="/" className="text-xl font-bold text-gray-800">
          MABBR APP
        </Link>
        <ul className="flex space-x-6">
          <li>
            <Link href="/home" className="text-gray-600 hover:text-blue-600 transition">
              Home
            </Link>
          </li>
          <li>
            <Link href="/login-signup" className="text-gray-600 hover:text-blue-600 transition">
              Login
            </Link>
          </li>
        </ul>
      </div>
    </nav>
  );
};

export default Navbar;
