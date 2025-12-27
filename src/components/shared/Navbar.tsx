function Navbar() {
  return (
    <nav className="flex items-center justify-between w-full px-6 py-4 bg-white">
      {/* Logo and Brand */}
      <div className="flex items-center gap-3">
        {/* Logo - Black circle with white abstract symbol */}
        <div className="w-10 h-10 bg-black rounded-full flex items-center justify-center flex-shrink-0">
          <svg
            width="16"
            height="16"
            viewBox="0 0 16 16"
            fill="none"
            xmlns="http://www.w3.org/2000/svg"
          >
            {/* Four curved lines creating a stylized star/asterisk shape from center */}
            <path
              d="M8 2 C8 5 8 8 8 8 C8 8 8 11 8 14"
              stroke="white"
              strokeWidth="1.4"
              strokeLinecap="round"
              fill="none"
            />
            <path
              d="M14 8 C11 8 8 8 8 8 C8 8 5 8 2 8"
              stroke="white"
              strokeWidth="1.4"
              strokeLinecap="round"
              fill="none"
            />
            <path
              d="M8 14 C8 11 8 8 8 8 C8 8 8 5 8 2"
              stroke="white"
              strokeWidth="1.4"
              strokeLinecap="round"
              fill="none"
            />
            <path
              d="M2 8 C5 8 8 8 8 8 C8 8 11 8 14 8"
              stroke="white"
              strokeWidth="1.4"
              strokeLinecap="round"
              fill="none"
            />
          </svg>
        </div>
        {/* Brand name */}
        <span className="text-black font-bold text-lg lowercase">
          shadon/studio
        </span>
      </div>

      {/* Navigation Links */}
      <div className="flex items-center gap-0">
        {["Home", "Products", "About Us", "Contacts"].map((link, index) => (
          <div key={link} className="flex items-center">
            {index > 0 && (
              <div className="h-4 w-px bg-gray-300 mx-4" aria-hidden="true" />
            )}
            <a
              href="#"
              className="text-gray-600 hover:text-gray-900 transition-colors text-sm font-medium"
            >
              {link}
            </a>
          </div>
        ))}
      </div>
    </nav>
  );
}

export default Navbar;
