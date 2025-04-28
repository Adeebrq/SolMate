import React, { ReactNode } from 'react';
import './container.css';

interface ContainerProps {
  title?: string;
  subtitle?: string;
  children: ReactNode;
  className?: string;
  vscroll?: boolean;
}

const Container: React.FC<ContainerProps> = ({
  title,
  subtitle,
  children,
  className,
  vscroll = false, 
}) => {
  return (
    <div className={`data-container ${className || ''}`}>
      <div className="container-header">
        {title && <p className="container-title">{title}</p>}
        {subtitle && <p className="container-subtitle">{subtitle}</p>}
        <div className={`container-content ${vscroll ? 'v-scroll' : ''}`}>
          {children}
        </div>
      </div>
    </div>
  );
};

export default Container;