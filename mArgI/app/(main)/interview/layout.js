import React, { Suspense } from "react";
import { BarLoader } from "react-spinners";

const Layout = ({children}) => {
    return (
            <Suspense fallback={<BarLoader className="mt-4" width={"100%"} color="gray"/>}>
                {children}
            </Suspense>
   
    );
};

export default Layout;
