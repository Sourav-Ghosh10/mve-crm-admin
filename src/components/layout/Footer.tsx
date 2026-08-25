import React from "react";

const Footer: React.FC = () => {
  return (
    <footer className="py-4 text-center">
      <p className="text-sm text-foreground-secondary">
        &copy; {new Date().getFullYear()} CodecIT. All rights reserved.
      </p>
    </footer>
  );
};

export default Footer;
