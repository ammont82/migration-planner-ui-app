import React, { PropsWithChildren, useEffect } from 'react';

export type SVGIconProps = PropsWithChildren<
  Omit<React.SVGProps<SVGElement>, 'ref' | 'role'>
> & {
  title?: string;
  className?: string;
};

type SVGIconState = {
  title: `svg-icon-title-${number}`;
};

let currentId = 0;

export const SVGIcon = React.forwardRef<SVGSVGElement, SVGIconProps>(
  (props, ref) => {
    const { current: state } = React.useRef<SVGIconState>({
      title: `svg-icon-title-${currentId}`,
    });
    const { children, className, title, viewBox = '0 0 1024 1024' } = props;
    const hasTitle = Boolean(title);
    const classes = className ? `pf-v6-svg ${className}` : 'pf-v6-svg';

    useEffect(() => {
      currentId++;
    }, []);

    return (
      <svg
        ref={ref}
        role="img"
        width="1em"
        height="1em"
        fill="currentColor"
        viewBox={viewBox}
        className={classes}
        {...(hasTitle && { ['aria-labelledby']: title })}
        {...(!hasTitle && { ['aria-hidden']: 'true' })}
        {...props}
      >
        {hasTitle && <title id={state.title}>{title}</title>}
        {children}
      </svg>
    );
  },
);

SVGIcon.displayName = `SVGIcon`;
