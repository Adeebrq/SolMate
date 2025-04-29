import React, { ReactNode } from 'react';
import './container.css';

interface ContainerProps {
  title?: string;
  subtitle?: string;
  children: ReactNode;
  className?: string;
  vscroll?: boolean;
  maxHeight?: number;
}

const Container: React.FC<ContainerProps> = ({
  title,
  subtitle,
  children,
  className,
  vscroll = false, 
  maxHeight,
}) => {
  return (
    <div className={`data-container ${className || ''}`}>
      <div>
        {title && <p className="container-title">{title}</p>}
        {subtitle && <p className="container-subtitle">{subtitle}</p>}</div>

        <div className={`container-content ${vscroll ? 'v-scroll' : ''}`}
        style={vscroll && maxHeight ? {maxHeight}: undefined}>
          {children}
        </div>
      </div>
  );
};

export default Container;