import { useState } from "react";
import { toast } from "sonner";

const useFetch = (cb) => {
    const [data, setData] = useState(null);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);

    const fn = async(...args) => {
        setLoading(true);
        setError(null);
        try {
            const response = await cb(...args);
            setData(response);
            setError(null);
            return response;
        } catch (error) {
            setError(error);
            toast.error(error.message || "Something went wrong");
        } finally {
            setLoading(false);
        }
    } 
    return [fn,data,loading,error,setData];    
};

export default useFetch;