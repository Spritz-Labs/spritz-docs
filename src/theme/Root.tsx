import React from 'react';
import StructuredData from '@site/src/components/StructuredData';

// This component is used to inject content into the root HTML element
export default function Root({children}: {children: React.ReactNode}): JSX.Element {
    return (
        <>
            <StructuredData />
            {children}
        </>
    );
}

