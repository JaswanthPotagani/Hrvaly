import { useState } from "react";
import { toast } from "sonner";
import { useSession } from "next-auth/react";

const useFetch = (endpoint, method="GET") => {
    const [data, setData] = useState(null);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);
    const { data: session } = useSession();

    const fn = async(payload= null) => {
        setLoading(true);
        setError(null);
        try {
          const baseUrl = process.env.NEXT_PUBLIC_API_BASE_URL;

          const response = await fetch(`${baseUrl}${endpoint}`,{
            method,
            headers: {
                "Content-Type": "application/json",
                "Authorization": `Bearer ${session?.accessToken}`,
            },
            body: method !== "GET" && payload ? JSON.stringify(payload) : null,
          });

          const result = await response.json();

          if(!response.ok) throw new Error(result.detail || "Request failed");

          setData(result);
          return result;
        } catch (error) {
            setError(error);
            toast.error(error.message || "Something went wrong");
            return null;
        } finally {
            setLoading(false);
        }
    };
    return { fn, data, loading, error, setData };    
};

export default useFetch;